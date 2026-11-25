import {readPointSession} from '../services/pointOperationSessions.js';
import users from '../repositories/userRepository.js';
export default async function pointOperationAuth(req,res,next) {
 try {
  const session=readPointSession(req.get('X-Hub-Session'));
  if(!session)return res.status(401).json({message:'Entre novamente para identificar o operador desta alteração.'});
  const user=await users.findUserById(session.id);
  if(!user||user.requires_password_change||user.username!==session.username)return res.status(403).json({message:'Sessão de edição indisponível.'});
  req.pointActor={id:user.id,username:user.username};next();
 }catch(error){next(error);}
}
