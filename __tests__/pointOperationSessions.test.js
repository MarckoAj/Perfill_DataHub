import {issuePointSession,readPointSession} from '../src/services/pointOperationSessions.js';
test('sessão identifica operador sem aceitar token compartilhado nem usuário com troca pendente',()=>{
 expect(issuePointSession({id:1,username:'novo',requires_password_change:1})).toBeNull();
 const token=issuePointSession({id:2,username:'operador',requires_password_change:0});
 expect(token).toMatch(/^[a-f0-9]{64}$/);expect(readPointSession(token)).toMatchObject({id:2,username:'operador'});expect(readPointSession('token-compartilhado')).toBeNull();
});

test('sessão expirada não identifica operador',()=>{
 const realNow=Date.now;try{Date.now=()=>1000;const token=issuePointSession({id:3,username:'temporario'});Date.now=()=>1000+9*60*60*1000;expect(readPointSession(token)).toBeNull();}finally{Date.now=realNow;}
});
