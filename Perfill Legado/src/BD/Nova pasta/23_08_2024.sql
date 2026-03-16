DELIMITER $$
create trigger tickets_alerts_automatic_update
after update on glpi_tickets
for each row
begin
if new.ticketStatus = 6 then
update tickets_alerts
SET checked = 1,
justifiedText = "Chamado finalizado, justificado pelo sistema"
where glpi_ticketId = new.ticketId;
end if;
end $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER insert_ticket_atualization
AFTER INSERT
ON glpi_tickets
FOR EACH ROW
BEGIN
    INSERT INTO ticketsUpdates (ticketId, ticketStatus, slaStatus, updateTicketTime)
    VALUES (NEW.ticketId, NEW.ticketStatus, NEW.slaStatus, NEW.ticketLastAtualization);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER tickets_atualizations_upadates
AFTER UPDATE
ON glpi_tickets
FOR EACH ROW
BEGIN
    UPDATE ticketsUpdates SET ticketPreviousStatus = OLD.ticketStatus, ticketStatus = NEW.ticketStatus, slaPreviousStatus = OLD.slaStatus, updateTicketTime = NEW.ticketLastAtualization
    WHERE ticketId = NEW.ticketId;
END$$
DELIMITER ;



select * from glpi_tickets;

    create table ticketsUpdates (
    updateTicketId int primary key auto_increment ,
    ticketId int not null,
    ticketPreviousStatus int ,
    ticketStatus int,
	slaPreviousStatus int,
    slaStatus int,
    updateTicketTime dateTime
    );


create table tasksUpdates (
    updateTaskId int primary key auto_increment ,
    externalId int,
    taskPreviousStatus int,
    taskStatus int,
    updateTaskTime dateTime
    );


create table glpi_typeAlerts
 (typeId int not null,
  notification text,
  previousNotificationType varchar(50),
  actualNotificationType varchar(50),
  alertSeverty varchar(50)
   );
   
   
   
DELIMITER $$
CREATE FUNCTION select_previous_StatusByTicketId(
    tickedId INT, 
    notificationType VARCHAR(50)
) RETURNS INT
READS SQL DATA
BEGIN
    DECLARE previousStaus INT;

    CASE 
        WHEN notificationType = 'GLPI' THEN 
            SELECT ticketPreviousStatus 
            INTO previousStaus
            FROM glpi_tickets_updates 
            WHERE ticketId = tickedId;
        
        WHEN notificationType = 'SLA' THEN 
            SELECT slaPreviousStatus 
            INTO previousStaus
            FROM glpi_tickets_updates
            WHERE ticketId = tickedId;
        
        WHEN notificationType = 'AUVO' THEN 
            SELECT taskPreviousStatus 
            INTO previousStaus
            FROM auvo_tasks_updates
            WHERE externalId = tickedId;
        
        ELSE 
            SET previousStaus = NULL;
    END CASE;

    RETURN previousStaus;
END$$
DELIMITER ;


DELIMITER $$
CREATE FUNCTION select_actual_StatusByTicketId(
    tickedId INT, 
    notificationType VARCHAR(50)
) RETURNS INT
READS SQL DATA
BEGIN
    DECLARE actualStatus INT;

    CASE 
        WHEN notificationType = 'GLPI' THEN 
            SELECT ticketStatus 
            INTO actualStatus
            FROM glpi_tickets_updates
            WHERE ticketId = tickedId;
        
        WHEN notificationType = 'SLA' THEN 
            SELECT slaStatus 
            INTO actualStatus
            FROM glpi_tickets_updates
            WHERE ticketId = tickedId;
        
        WHEN notificationType = 'AUVO' THEN 
            SELECT taskStatus 
            INTO actualStatus
            FROM auvo_tasks_updates
            WHERE externalId = tickedId;
        
        ELSE 
            SET actualStatus = NULL;
    END CASE;

    RETURN actualStatus;
END$$
DELIMITER ;

        CREATE TABLE glpi_ticketss (
        ticketId INT PRIMARY KEY,
        customerName VARCHAR(100),
        ticketDescription TEXT,
        ticketOpenDate DATETIME,
        ticketStatus INT,
        ticketLastAtualization DATETIME,
        slaCategory VARCHAR(100),
        slaTime VARCHAR(50),
        selaStatus INT,
        reasonForPause TEXT,
        userAtibuiedId INT);
        

    
    

select * from tickets_alerts;
    
    show triggers from auvodb;
    drop trigger auvodb.tickets_atualizations_upadates;
    


select * from customers_auvo;
                   
alter table tickets_alerts add constraint foreign key (glpi_typeAlertId) references  glpi_typealerts(typeId);
drop table tickets_alerts;
select * from glpi_tickets;
select * from tickets_alerts;
delete from tickets_alerts where alertId > 0;
select * from glpi_tickets where ticketId = 16251;
update glpi_tickets set ticketStatus = 5 where ticketId = 16251;
select * from  glpi_tickets_updates;

select * from glpi_tickets_updates where ticketId = 15867;



SELECT 
ta.alertId,
tat.notificationText,
select_actual_StatusByTicketId(15867,"GLPI"),
tat.previousNotificationType,
tat.actualNotificationType,
tat.alertSeverity
from tickets_alerts ta
LEFT JOIN ticket_alert_types tat
ON ta.alertTypeId = tat.alertTypeId
where ta.alertId = 14;


SHOW CREATE FUNCTION  select_actual_StatusByTicketId
# Function, sql_mode, Create Function, character_set_client, collation_connection, Database Collation
'select_actual_StatusByTicketId', 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION', 'CREATE DEFINER=`root`@`%` FUNCTION `select_actual_StatusByTicketId`(\n            ticketId INT, \n            notificationType VARCHAR(50)\n        ) RETURNS int\n    READS SQL DATA\nBEGIN\n            DECLARE actualStatus INT;\n\n            CASE \n                WHEN notificationType = \'GLPI\' THEN \n                    SELECT ticketStatus \n                    INTO actualStatus\n                    FROM glpi_tickets_updates\n                    WHERE ticketId = ticketId;\n                \n                WHEN notificationType = \'SLA\' THEN \n                    SELECT slaStatus \n                    INTO actualStatus\n                    FROM glpi_tickets_updates\n                    WHERE ticketId = ticketId;\n                \n                WHEN notificationType = \'AUVO\' THEN \n                    SELECT taskStatus \n                    INTO actualStatus\n                    FROM auvo_tasks_updates\n                    WHERE externalId = ticketId;\n                \n                ELSE \n                    SET actualStatus = NULL;\n            END CASE;\n\n            RETURN actualStatus;\n        END', 'utf8mb3', 'utf8mb3_general_ci', 'utf8mb4_0900_ai_ci'



