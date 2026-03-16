import tasksMod from "./tasksMod.js";
import urls from "../repositorios/urlsRep.js";
import glpiRequest from "../api/glpiRequest.js";
import glpiUlils from "../utils/glpiUlils.js";
import ticketsAlerts from "../models/ticketsAlerts.js"
import ticketsRep from "../repositorios/ticketsRep.js";

class Tickets {
    constructor() {
        this.glpiTicketStatus = {
            "novo": 1,
            "atribuido": 2,
            "planejado": 3,
            "pausado": 4,
            "solucionado": 5,
        }
    }

    async getGlpiTickets(status) {
        const urlStatus = this.glpiTicketStatus[status]
        const endPoint = urls.requestGlpiEndpointByStatus(urlStatus)
        const result = await glpiRequest.glpiRequestData(endPoint, "GET")
        return result.data ? glpiUlils.processTickets(result.data) : []
    }


    async requestTaskAuvoById(ticketId) {
        try {
            const tasks = await tasksMod.getTaskByExternalId(ticketId);
            return tasks.sort((taskA, taskB) => new Date(taskB.dateLastUpdate) - new Date(taskA.dateLastUpdate))
        } catch (error) {
            console.log(error)
        }
    }

    async getTicketsByStatus(status) {
        const glpiTickets = await this.getGlpiTickets(status.toLowerCase());
        console.log(`${glpiTickets} linha 38`)
        let resolvedTickets = []
        if (glpiTickets && glpiTickets.length > 0) {
            const ticketsWithTasks = glpiTickets.map(async ticket => this.addTicketsAttachments(ticket));
            resolvedTickets = await Promise.all(ticketsWithTasks);
        }
        return resolvedTickets;
    }


    async addTicketsAttachments(ticket) {
        const auvoTasks = await this.requestTaskAuvoById(ticket.ticketId)
        const atribuiedUser = await glpiRequest.glpiRequestData(`/user/${ticket.atribuiedUserId}`)
        const pingStatus = 1
        const pingUpTime = "9D, 23H:59M"
        return { ...ticket, atribuiedUserName: atribuiedUser.name, pingStatus: pingStatus, pingUpTime: pingUpTime, tasksAuvo: auvoTasks }
    }

    async sincroniseTicketInDb(ticket) {
        try {
            const ticketInDb = await ticketsRep.selecTicketById(ticket.ticketId)
            if (ticketInDb.length === 0) {
                await ticketsRep.insertTicket(ticket)
            } else if (new Date(ticketInDb[0].lastTicketUpdate) < new Date(ticket.lastAtualization)) {
                await ticketsRep.updateTicket(ticket)
            }
        } catch (error) {
            console.log(error)
        }
    }

    async sincroniseOpenedTickets() {
        try {
            const openedTickets = await ticketsRep.selectTicketsOpened()
            if (openedTickets.length !== 0) {
                const promiseList = openedTickets.map(ticket => {
                    const endPoint = urls.requestGlpiEndpointByTicketId(ticket.ticketId)
                    return glpiRequest.glpiRequestData(endPoint)
                })
                const resolvedTickets = (await Promise.all(promiseList))
                const resolevedTicketsData = resolvedTickets.map(result => result.data).flat()
                const ticketList = glpiUlils.processTickets(resolevedTicketsData)
                for (const ticket of ticketList) {
                    await this.sincroniseTicketInDb(ticket)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    async addTicketsInDb() {
        try {
            const statusList = ["novo", "atribuido", "planejado", "pausado"]
            const promiseList = statusList.map(status => this.getGlpiTickets(status))
            const result = await Promise.all(promiseList)
            const ticketsList = result.flat(Infinity)
            for (const ticket of ticketsList) {
                await this.sincroniseTicketInDb(ticket)
            }
        } catch (error) {
            console.log(error)
        }
    }

    async checkTicketAlerts() {
        const openedTickets = await ticketsRep.selectTicketsOpened()
        for (const ticket of openedTickets) {
            const completeTicket = await this.addTicketsAttachments(ticket)
            await ticketsAlerts.processTicketAlerts(completeTicket)
        }
    }

}


// const teste = new Tickets()
// await teste.addTicketsInDb()
// await teste.sincroniseOpenedTickets()
// await teste.checkTicketAlerts()
// console.log("concluido")

export default new Tickets();