import customDate from "../utils/customDate.js"
import ticketsRep from "../repositorios/ticketsRep.js";



class ticketsAlerts {
     constructor() {
          this.maxOpenedTime = customDate.minForMilliseconds(2)
          this.maxProactiveTime = customDate.daysForMilliseconds(2)
          this.maxPausedTime = customDate.daysForMilliseconds(7)
          this.maxOpenedTimeTaskStatusFinalized = customDate.minForMilliseconds(5)
     }

     async createNewAlert(ticketId, typeAlertId) {
          const alertList = await ticketsRep.selecTicketAlert({ glpi_ticketId: ticketId, typeAlertId: typeAlertId })
          const filtredAlertsClosed = alertList.filter(alert => alert.checked === 0)
          if (filtredAlertsClosed.length === 0) {
               return await ticketsRep.insertTicketAlert({ glpi_ticketId: ticketId, typeAlertId: typeAlertId })
          }
     }

     async checkAlert(alert, ticketId) {
          const { typeAlertId: alertTypeId, condition } = alert
          const alertList = await ticketsRep.selecTicketAlert({ glpi_ticketId: ticketId, typeAlertId: alertTypeId })

          const alertExists = alertList.some(alert => alert.checked === 0)
          if (condition && (!alertExists)) {
               await this.createNewAlert(ticketId, alertTypeId)
          }
          else if ((!condition) && alertExists) {
               await ticketsRep.updateTicketAlert({
                    checked: true,
                    justifiedText: "Status justificado pelo sistema",
                    glpi_ticketId: ticketId,
                    typeAlertId: alertTypeId
               })
          }
     }

     async processTicketAlerts(ticket) {
          const lastAtualizationInMilliseconts = Math.abs(customDate.calculateTimeDif(ticket.lastTicketUpdate))
          const ticketId = ticket.ticketId
          try {

               const alertList = [
                    /* alertType GLPI - Se Status do ticket é novo e ultima atulização > 5 min */
                    {
                         typeAlertId: 1,
                         condition: ticket.ticketStatus === 1 &&
                              lastAtualizationInMilliseconts > this.maxOpenedTime,
                    },


                    /* alertType GLPI/Auvo - Se slaTime do ticket for proativo e ultima atualização > 48h e não possuir nehuma tarefa no Auvo */
                    {
                         typeAlertId: 2,
                         condition: ticket.slaTime === 'Proativo' &&
                              lastAtualizationInMilliseconts > this.maxProactiveTime &&
                              ticket.tasksAuvo.length === 0
                    },


                    /* TYPE GLPI -  Se GLPI slaTime for pausado e ultima atualização > 7 dias */
                    {
                         typeAlertId: 3,
                         condition: ticket.ticketStatus === 4 &&
                              lastAtualizationInMilliseconts > this.maxPausedTime
                    }



                    // /*TYPE AUVO - Se tarefa tecnico StatusTarefa = Pausado 
                    //      text = {Tarefa Pausada pelo técnico} */
                    // // if (taskStatusID === 6) {

                    // // }

                    // /*TYPE AUVO - Se StatusTarefa emExecução => Finalizada e GlPI statusTicket != finalizado  E GlpiLast update Time > 1h 
                    //      text = {Tarefa finalizada no Auvo por mais de 1 hr sem interação no GLPI} */
                    // // if (auvo_actuallyTaskStatus === 5 && ticketStatus !== 6 && customDate.calculateTimeDif(ticket.lastAtualization) > this.maxOpenedTimeTaskStatusFinalized) {

                    // // }

                    /*TYPE SLA - Se Status SLA No Prazo => Atenção e tarefa técnico = Aberta e reconhecido = False
                         text = {Ténico não alterou status para em Deslocamento no Auvo}  */
                    // if (sla_previusStatus === 1 && sla_actuallyStaus === 2 && auvo_actuallyTaskStatus === 1) {

                    // }

                    /*TYPE SLA - Se Status SLA Atenção => fora do Prazo 
                         text = {SLA perdido} */
                    // if (sla_previusStatus === 2 && sla_actuallyStaus === 3) {

                    // }

                    /*TYPE - Ping Se Ping  Down =>  Ping UP 
                    text = {Câmera operacional}*/


               ]

               for (const alert of alertList) {
                    await this.checkAlert(alert, ticketId)
               }


          } catch (error) {
               console.log(`Erro ao processar alertas ${error}`)
          }
     }

}


export default new ticketsAlerts()