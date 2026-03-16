import fetchRequest from "../api/fetchRequest.js";

class GPSlocation{
    async fetchRequestGps(){
        const auvoHeaderAuthorization = await fetchRequest.auvoHeaderAuthorization()
        const data = fetchRequest.request("https://api.auvo.com.br/v2/gps","GET",auvoHeaderAuthorization)
        return data
    }

}

export default new GPSlocation
const teste = new GPSlocation

console.log(await teste.fetchRequestGps())