select count(*) from customers_auvo;-- 8675 ok 8675 ok
select count(*) from customers_contacts; -- 173  ok 173
select count(*) from customers_emails; -- 7811   ok 7811
select count(*) from customers_groups; -- 24042  ok 24042
select count(*) from  customers_managers; -- 18546 
select count(*) from customers_uriattachments; -- 146 ok 146
select count(*) from groups_auvo; -- 430 ok 430
select count(*) from segments_auvo; -- 119 ok 119 
select count(*) from users_auvo;  -- 56  ok 56
select count(*) from questionnaires_auvo; -- 247 ok 247
select count(*) from userstypes_auvo; -- 3 ok 3
select count(*) from questionnairesquestions; -- 1144 ok 1144
select count(*) from tasks_types_requirements;-- 101
select count(*)  from tasks_status;
select * from tasks_types_auvo; -- 195
select * from tasks_auvo where taskId = 42945572;
select * from segments_auvo;
select * from tasks_auvo WHERE DATE(taskDate) = CURDATE();
SELECT * FROM tasks_auvo WHERE DATE(taskDate) = CURDATE() and taskStatusID != 5;

select * from tasks_types_auvo;
select customerId from customers_auvo where description like '%64-002%';

select * from tasks_auvo where customerId = (select customerId from customers_auvo where description like '%64-002%') ;

SELECT * FROM customers_auvo WHERE customerId  = 0;
dateLastUpdate
solutiontypes_id  SELECT
T.orientation,
T.taskStatusID,
UserFrom.`name`,
UserTo.`name`,
C.`description`,
Ttype.`description`,
T.taskDate,
T.taskCreationDate,
T.finished,
T.visualized,
T.checkIn,
T.checkInDate,
T.checkOut,
T.checkOutDate,
T.taskUrl,
T.displacementStart
FROM tasks_auvo AS T
LEFT JOIN users_auvo AS UserFrom
ON T.userFromId  = UserFrom.userId
LEFT JOIN  users_auvo AS UserTo
on T.userToId = UserTo.userId
LEFT JOIN customers_auvo AS C
on T.customerId = C.customerId
LEFT JOIN tasks_types_auvo AS Ttype
on T.tasksTypesId = Ttype.tasksTypesId





select count(*) from tasks_auvo

statusDescriptions

 
-- insert into customers_auvo(customerId,description,segmentId,) values (0,"Não atribuido",0) ok
-- insert into questionnaires_auvo(questionaryId,`description`,creationDate) values (0,"Selecione um questionario",now()); ok
-- insert into tasks_prioritys values (1,"Low"),(2,"Mediuim"),(3,"High"); ok  
-- insert into tasks_status values(1,"Opened"),(2,"InDisplacement"),(3,"CheckedIn"),(4,"CheckedOut"),(5,"Finished"),(6,"Paused"); ok
-- insert into users_auvo(userId,`name`,`userType`) values(0,"NÂO ATRIBUIDO",3) ok
-- insert into users_auvo(userId,`name`,`userType`) values (86302,"Inativo - Cristiano Martins dos Santos",3);
-- insert into users_auvo(userId,`name`,`userType`) values(54930,"Inativo - Lázaro Cézar Brasil Silveira",3);
-- insert into users_auvo(userId,`name`,`userType`) values(106162,"Inativo - Maurício Araujo",3);
-- insert into users_auvo(userId,`name`,`userType`) values(105119,"Inativo - Silas Santana Santos",3);
-- insert into users_auvo(userId,`name`,`userType`) values(53914,"Inativo - Rafael Cristian Souza Martins Dos Santos",3);
-- insert into users_auvo(userId,`name`,`userType`) values(112360,"Inativo - NOC PERFILL DA NOITE",3);
-- insert into users_auvo(userId,`name`,`userType`) values(61641,"Inativo - LUCIANO MARTINS " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(53867,"Inativo - Luciano Martins Conect",3);
-- insert into users_auvo(userId,`name`,`userType`) values(107497,"Inativo - Samuel Cristian Freire Souza Dos Santos " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(123021,"Inativo - Francisco Araújo Alencar Junior " ,3);

-- insert into users_auvo(userId,`name`,`userType`) values(136524,"Inativo - Consulta Perfill " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(53906,"Inativo - Josenel Oliveira Santos " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(54439," Inativo - Luciano Martins Conect 2" ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(55871," Inativo - Jadson Menezes " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(54922," Inativo - Sergio de Oliveira Vale " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(58055," Inativo - Gutembergue Santos Cardoso " ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(58628," Inativo -Gutembergue Santos Cardoso 2" ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(60532," Inativo - Samuel Cristian Freire Souza" ,3);  
-- insert into users_auvo(userId,`name`,`userType`) values(98363," Inativo - Jadson Almeida de Menezes" ,3); 
-- insert into users_auvo(userId,`name`,`userType`) values(61064," Inativo - Gutembergue Cardoso" ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(66836," Inativo - Tatiana Santos Silveira" ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(96028," Inativo - Gabriel Alberto Dos Santos" ,3);
-- insert into users_auvo(userId,`name`,`userType`) values(109410," Inativo - Véber dos Santos Costa Nascimento" ,3);


    INSERT INTO users_auvo (userId, `name`,userType)
     SELECT userId,`name`, userType
     FROM (
     SELECT 0 AS userId,"NÃO ATRIBUIDO" AS `name`, 1 AS userType
     AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM users_auvo WHERE users_auvo.userId = temp.userId
    );
    
    INSERT INTO users_auvo (userId, `name`, userType)
SELECT userId, `name`, userType
FROM (
    SELECT 0 AS userId, 'NÃO ATRIBUIDO' AS `name`, 1 AS userType
) AS temp
WHERE NOT EXISTS (
    SELECT 1 FROM users_auvo WHERE users_auvo.userId = temp.userId
);
create schema auvodb;


select * from tasks_auvo where taskId = 43963061;

 select count(*) from questionnaires_auvo;
 insert into tasks_types_auvo(tasksTypesId,userCreatorId,standardQuestionnaireId,description,creationDate,standardTime,toleranceTime,active) values (0,0,0,"tarefa sem tipo",null,0,0,0);
select count(*) from tasks_auvo;
 select * from glpi_solutiontypes;
 

 select * from tickets_alerts;
truncate table tickets_alerts;
update tickets_alerts set checked = 1 where alertId = 14;
 
 create table glpi_tickets (
externalId int,
customerName varchar(100),
ticketTitle varchar(100),
ticket_description varchar(100),
openDate datetime,
ticketStatus int,
lastAtualization datetime,
categorySla varchar(100),
slaTime varchar(50),
slaStatus int,
reasonForPause varchar(100) default null,
atribuiedUserId int
);
 
 
 create table tasks_auvo_update(
 updateID int auto_increment primary Key,
 externalId int,
 taskAuvoId int,
 taskLastUpdate datetime,
 previusTaskStatus int,
 actuallyTaskStatus int
 );
 
 
 create table tickets_alerts (
alertId int primary key auto_increment,
glpi_typeAlertId int,
glpi_ticketId int,
checked tinyint default 0 ,
justifiedText varchar(50) default null);


create table ticket_alertTypes (
alertId int,
alertMensage varchar(100),
alertSeverty varchar(50)
)

select  * from customers_auvo where customerId = 44630706
