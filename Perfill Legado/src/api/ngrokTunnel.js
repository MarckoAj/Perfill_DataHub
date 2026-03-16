import ngrok from 'ngrok';
import fetch from 'node-fetch';


class NgrokTunnel {

    constructor() {
        this.port = process.env.PORT || 3000;
        this.ngrok_authtoken = process.env.NGROK_AUTHTOKEN
    }

    async ngrokConnect() {
        await ngrok.authtoken(this.ngrok_authtoken)
        const url = await ngrok.connect(this.port)
        console.log(`Ngrok tunnel started at: ${url}`);
    }

    async ngrokGetPublicUrl() {
        const ngrokApiUrl = 'http://127.0.0.1:4040/api/tunnels';
        const response = await fetch(ngrokApiUrl)
        const data = await response.json()
        const publicUrl = data.tunnels[0].public_url;
        return publicUrl
    }
}

export default new NgrokTunnel
