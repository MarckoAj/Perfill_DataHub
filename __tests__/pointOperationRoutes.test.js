import {jest} from '@jest/globals';
import express from 'express';import request from 'supertest';
const prepare=jest.fn(async()=>({operationId:'review'})),confirm=jest.fn(async()=>({state:'COMPLETED'}));
const findUser=jest.fn(async()=>({id:7,username:'operador',requires_password_change:0}));
jest.unstable_mockModule('../src/repositories/userRepository.js',()=>({default:{findUserById:findUser}}));
jest.unstable_mockModule('../src/services/pointOperationService.js',()=>({PointOperationService:class{prepare(...args){return prepare(...args);}confirm(...args){return confirm(...args);}}}));
const {default:auth}=await import('../src/middlewares/authMiddleware.js');
const {default:pointAuth}=await import('../src/middlewares/pointOperationAuth.js');
const {preparePointOperation,confirmPointOperation}=await import('../src/controllers/pointOperationController.js');
const {issuePointSession}=await import('../src/services/pointOperationSessions.js');
const app=express();app.use(express.json());app.post('/entities/:entityId/prepare',auth,pointAuth,preparePointOperation);app.post('/entities/:entityId/confirm',auth,pointAuth,confirmPointOperation);
beforeEach(()=>{process.env.API_AUTH_TOKEN='test-shared';prepare.mockClear();confirm.mockClear();});
test('token compartilhado e identidade forjada não autorizam gravação',async()=>{
 expect((await request(app).post('/entities/12130/prepare').set('Authorization','Bearer test-shared').send({})).status).toBe(401);
 expect((await request(app).post('/entities/12130/prepare').set('Authorization','Bearer test-shared').set('X-Hub-Session','operador').send({})).status).toBe(401);expect(prepare).not.toHaveBeenCalled();
});
test('login autenticado identifica operador e confirmar exige consentimento explícito',async()=>{
 const session=issuePointSession({id:7,username:'operador',requires_password_change:0});
 const invoke=(path,body)=>request(app).post('/entities/12130/'+path).set('Authorization','Bearer test-shared').set('X-Hub-Session',session).send(body);
 expect((await invoke('prepare',{mode:'edit'})).status).toBe(201);expect(prepare).toHaveBeenCalledWith('12130',{mode:'edit'},{id:7,username:'operador'});
 expect((await invoke('confirm',{operationId:'review'})).status).toBe(400);expect(confirm).not.toHaveBeenCalled();
 expect((await invoke('confirm',{operationId:'review',confirmed:true})).status).toBe(200);expect(confirm).toHaveBeenCalledTimes(1);
});
