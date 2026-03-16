import fetchRequest from "./fetchRequest.js";
import ngrokTunnel from "./ngrokTunnel.js";


class AuvoWebHook {

    constructor() {
        this.webHooksEntitys = ["User", "Task", "Customer"]
        this.webHooksActions = ["Inclusao", "Alteracao", "Exclusao"]
    }

    async checkIfWebhookAlreadyExists(body, webHooksList) {
        try {
            const dataRequest = { ...body }
            dataRequest.urlResponse = dataRequest.targetUrl
            delete dataRequest.targetUrl
            const keysForCheck = Object.keys(dataRequest);
            const result = webHooksList.some((webHook) =>
                keysForCheck.every((key) => dataRequest[key] === webHook[key]),
            );
            return result
        }
        catch (error) {
            throw error
        }
    }

    async newAuvoWebhook(entity) {
        try {
            const webHooks = await this.requestWebHooksList()
            const apiUrl = `${await ngrokTunnel.ngrokGetPublicUrl()}/webhook`
            const webHookCreated = this.webHooksActions.map(async webhookAction => {
                const body = { entity: entity, action: webhookAction, targetUrl: apiUrl, active: true }
                if (!(await this.checkIfWebhookAlreadyExists(body, webHooks))) {
                    return await fetchRequest.fetchAuvoEntity("webhooks", "POST", null, body)
                }
            })
            const result = await Promise.all(webHookCreated)
            return result
        } catch (error) {
            throw error
        }

    }

    async addAllWebHooks() {
        for (const entity of this.webHooksEntitys) {
            try {
                const webHook = await this.newAuvoWebhook(entity)
                console.log(webHook)
            } catch (error) {
                throw error
            }
        }
    }

    async deleteAllWebHooksActive() {
        try {
            const webHookActivesList = await this.requestWebHooksList();
            const webHooksIdList = webHookActivesList
                .filter(obj => obj.active === true)
                .map(webHook => webHook.id);

            const deletePromises = webHooksIdList.map(ID => fetchRequest.fetchAuvoEntity("webhooks", "DELETE", ID));

            const results = await Promise.all(deletePromises);
            return results;
        } catch (error) {
            throw error

        }
    }

    async requestWebHooksList() {
        try {
            const webHooks = await fetchRequest.getAuvoListComplete("webhooks")
            return webHooks.flat()
        } catch (error) {
            throw error
        }
    }
}



export default new AuvoWebHook
