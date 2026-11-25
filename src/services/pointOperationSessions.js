import {randomBytes,createHash} from 'node:crypto';
const sessions=new Map();
const digest=token=>createHash('sha256').update(token).digest('hex');
export function issuePointSession(user) {
 const now=Date.now();for(const [key,value] of sessions)if(value.expiresAt<=now)sessions.delete(key);
 if(user.requires_password_change)return null;
 const token=randomBytes(32).toString('hex');
 sessions.set(digest(token),{id:user.id,username:user.username,expiresAt:now+8*60*60*1000});return token;
}
export function readPointSession(token) {
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
 const user=sessions.get(digest(token));if(!user||user.expiresAt<=Date.now())return null;return {...user};
}
