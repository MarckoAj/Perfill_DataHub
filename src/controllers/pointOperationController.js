import asyncHandler from '../utils/asyncHandler.js';
import repository from '../repositories/pointOperationRepository.js';
import adapter from '../integrations/pointOperationAdapter.js';
import {PointOperationService} from '../services/pointOperationService.js';
const service=new PointOperationService(repository,adapter);
export const pointOperationAccess=(req,res)=>res.json({enabled:String(req.params.entityId)==='12130',actor:req.pointActor.username});
export const preparePointOperation=asyncHandler(async(req,res)=>res.status(201).json(await service.prepare(req.params.entityId,req.body,req.pointActor)));
export const confirmPointOperation=asyncHandler(async(req,res)=>{
 if(req.body?.confirmed!==true)return res.status(400).json({message:'Confirmação explícita obrigatória.'});
 const result=await service.confirm(req.params.entityId,req.body.operationId,req.pointActor);res.json(result);
});
export const getPointOperationStatus=asyncHandler(async(req,res)=>res.json(await service.status(req.params.entityId,req.params.operationId,req.pointActor)));
