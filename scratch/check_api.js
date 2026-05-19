async function checkApiStatus() {
  try {
    const res = await fetch('http://localhost:3000/api/system/status');
    const data = await res.json();
    console.log("API System Status Response:");
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error calling API:", e.message);
  }
}

checkApiStatus();
