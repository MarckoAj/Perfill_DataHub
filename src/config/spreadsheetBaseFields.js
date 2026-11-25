// Coluna original, chave HUB e seção. Datas de eventos não são status atuais.
export const spreadsheetBaseFields = [
  ['ITEM','spreadsheetItem','general'], ['IDDOGLPI','glpiDeviceId','general'], ['ID AUVO','auvoCustomerId','general'],
  ['LATITUDE','latitude','general'], ['LONGITUDE','longitude','general'], ['RASTREABILIDADE','traceability','general'],
  ['ID ANTIGO','previousPointName','general'], ['ID/ENDEREÇO','name','general'], ['Nº O.S','serviceOrder','general'],
  ['CICOM','cicom','general'], ['MUNICIPIO','city','general'], ['REGIÃO','region','general'], ['UNIDADE','unit','general'],
  ['TIPO','deviceType','general'], ['CIRCUITO','circuit','network'], ['IP','ip','network'], ['MASCARA','subnet','network'],
  ['GATEWAY','gateway','network'], ['IP DO EQUIP. DE LINK','linkEquipmentIp','network'],
  ['RESP_LINK','linkResponsible','network'], ['INST_LINK','linkInstallationStatus','network'],
  ['DATA_INST.LINK','linkInstallationDate','network'], ['DATA LINK DISPONIBILZADO','availabilityDate','network'],
  ['STATUS DA VISTORIA','inspectionStatus','status'], ['DATA DA VISTORIA','inspectionDate','status'],
  ['P.DEDICADO','dedicatedPole','status'], ['RESP. PELO POSTE','poleResponsible','status'],
  ['INST. DE POSTE','poleInstallationStatus','status'], ['DATA DA INST. POSTE','poleInstallationDate','status'],
  ['SUBSTATUS_POSTE','poleStatus','status'], ['TIPO DE CAIXA','boxType','status'], ['INST. CAIXA','boxInstallation','status'],
  ['DATA INST.CAIXA','boxInstallationDate','status'], ['SUBSTATUS _INST.CAIXA','boxSubstatus','status'],
  ['DATA DESINST. CAIXA','boxUninstallDate','status'], ['INST.CÂMERA','cameraInstallationStatus','status'],
  ['DATA_INST.CAMERA','cameraInstallation','status'], ['SUBSTATUS _CAMERA FISICA','cameraSubstitution','status'],
  ['DATA DESINST.','uninstallDate','status'], ['INSTALAÇÃO DE BRAÇO','armInstallation','status'],
  ['DATA_INST_BRAÇO','armInstallationDate','status'], ['DESINST. DE BRAÇO','armRemovalStatus','status'],
  ['DATA DESINST. BRAÇO','armRemovalDate','status']
];
