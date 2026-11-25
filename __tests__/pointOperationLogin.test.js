import {jest} from '@jest/globals';import express from 'express';import request from 'supertest';import bcrypt from 'bcryptjs';
const user={id:7,username:'operador',requires_password_change:0,password_hash:await bcrypt.hash('senha-teste-isolada',4)};
const updatePassword=jest.fn(async()=>{});
jest.unstable_mockModule('../src/repositories/userRepository.js',()=>({default:{findUserByUsername:async()=>user,updatePassword}}));
const {default:router}=await import('../src/routes/authRoutes.js');const {readPointSession}=await import('../src/services/pointOperationSessions.js');const app=express();app.use(express.json());app.use('/auth',router);
test('login emite identidade individual e senha incorreta não emite sessão',async()=>{
 const good=await request(app).post('/auth/login').send({username:'operador',password:'senha-teste-isolada'});expect(good.status).toBe(200);expect(readPointSession(good.body.pointOperationSession)).toMatchObject({id:7,username:'operador'});
 const bad=await request(app).post('/auth/login').send({username:'operador',password:'incorreta'});expect(bad.status).toBe(401);expect(bad.body.pointOperationSession).toBeUndefined();
});
