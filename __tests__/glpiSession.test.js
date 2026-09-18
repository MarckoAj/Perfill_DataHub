import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/utils/glpiUrlBuilder.js", () => ({
  default: { glpiBaseUrl: () => "https://glpi.test/apirest.php" },
}));
const { GlpiClient } = await import("../src/integrations/glpi/glpiClient.js");
const reply = (status, data) => ({ status, json: async () => data, headers: new Headers() });
const invalid = () => reply(401, ["ERROR_SESSION_TOKEN_INVALID", "Invalid session"]);
const login = (token) => reply(200, { session_token: token });
const originalFetch = global.fetch;
let client;

beforeEach(() => {
  global.fetch = jest.fn();
  client = new GlpiClient();
  client.userToken = "test-user-token";
});
afterEach(async () => {
  await client.dispatcher.close();
  global.fetch = originalFetch;
});

test("authenticates lazily and shares initial login", async () => {
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValueOnce(login("first")).mockResolvedValue(reply(206, [{ id: 1 }]));
  const results = await Promise.all([client.glpiRequestData("Peripheral"), client.glpiRequestData("Peripheral")]);
  expect(results.map((result) => result.data)).toEqual([[{ id: 1 }], [{ id: 1 }]]);
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("initSession"))).toHaveLength(1);
});

test("renews an invalid session and repeats the original request exactly once", async () => {
  fetch.mockResolvedValueOnce(login("old")).mockResolvedValueOnce(invalid())
    .mockResolvedValueOnce(login("new")).mockResolvedValueOnce(reply(200, { id: 7 }));
  const result = await client.glpiRequestData("Peripheral", "GET", null, 7);
  expect(result.data).toEqual({ id: 7 });
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(fetch.mock.calls[1][0]).toBe(fetch.mock.calls[3][0]);
  expect(fetch.mock.calls[3][1].headers["Session-Token"]).toBe("new");
});

test("concurrent invalid sessions share one renewal, including a delayed old response", async () => {
  let loginCount = 0;
  let releaseLate;
  const late = new Promise((resolve) => { releaseLate = resolve; });
  fetch.mockImplementation(async (url, options) => {
    if (url.endsWith("initSession")) return login(++loginCount === 1 ? "old" : "new");
    if (options.headers["Session-Token"] === "old") {
      if (url.endsWith("/3")) return late;
      return invalid();
    }
    return reply(200, { id: 1 });
  });
  await client.getGlpiHeader();
  const requests = [1, 2, 3].map((id) => client.glpiRequestData("Peripheral", "GET", null, id));
  await Promise.all(requests.slice(0, 2));
  releaseLate(invalid());
  await Promise.all(requests);
  expect(loginCount).toBe(2);
});

test("stops after a second invalid session and clears it for the next call", async () => {
  fetch.mockResolvedValueOnce(login("old")).mockResolvedValueOnce(invalid())
    .mockResolvedValueOnce(login("new")).mockResolvedValueOnce(invalid());
  expect(await client.glpiRequestData("Peripheral", "GET", null, null, { suppressErrorLog: true })).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(client.sessionHeaderPromise).toBeNull();
});

test.each([401, 403, 500])("does not renew on unrelated HTTP %s errors", async (status) => {
  fetch.mockResolvedValueOnce(login("valid")).mockResolvedValueOnce(reply(status, ["ERROR_RIGHT_MISSING", "Denied"]));
  expect(await client.glpiRequestData("Peripheral", "GET", null, null, { suppressErrorLog: true })).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("failed shared authentication can recover on a later call", async () => {
  fetch.mockResolvedValueOnce(reply(401, ["ERROR_GLPI_LOGIN_USER_TOKEN", "Denied"]));
  const results = await Promise.allSettled([client.glpiRequestData("Peripheral"), client.glpiRequestData("Peripheral")]);
  expect(results.every((result) => result.status === "rejected")).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(client.sessionHeaderPromise).toBeNull();
  fetch.mockResolvedValueOnce(login("recovered")).mockResolvedValueOnce(reply(200, []));
  expect((await client.glpiRequestData("Peripheral")).data).toEqual([]);
});

test("reports TLS failures without credentials and clears pending authentication", async () => {
  fetch.mockRejectedValueOnce(Object.assign(new Error("sensitive upstream details"), { cause: { code: "CERT_HAS_EXPIRED" } }));
  await expect(client.glpiRequestData("Peripheral")).rejects.toThrow("CERT_HAS_EXPIRED");
  expect(client.sessionHeaderPromise).toBeNull();
});

test("uses a local dispatcher, timeout and blocked redirects without changing global TLS", async () => {
  const tlsBefore = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  fetch.mockResolvedValueOnce(login("valid")).mockResolvedValueOnce(reply(200, []));
  await client.glpiRequestData("Peripheral");
  for (const [, options] of fetch.mock.calls) {
    expect(options.dispatcher).toBe(client.dispatcher);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.redirect).toBe("error");
  }
  expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe(tlsBefore);
});
