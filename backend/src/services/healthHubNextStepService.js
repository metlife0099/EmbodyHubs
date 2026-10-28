const classifyOrder=order=>{
  const status=order.shipment?.status||order.status||'UNKNOWN';
  if(status==='DELIVERED'||status==='COMPLETED')return{classification:'COMPLETED',current:'Completed',next:'No action is required.',responsibleParty:'NONE'};
  if(['CANCELLED','REFUNDED'].includes(status))return{classification:'CANCELLED',current:'Cancelled',next:'Contact support if this does not match your records.',responsibleParty:'CUSTOMER'};
  if(['FAILED','PAYMENT_FAILED'].includes(status))return{classification:'FAILED',current:'Payment or fulfillment needs attention',next:'Review the order or contact support.',responsibleParty:'CUSTOMER'};
  if(['SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(status))return{classification:'PROCESSING',current:'In transit',next:'Follow verified carrier updates.',responsibleParty:'EXTERNAL'};
  return{classification:'PROCESSING',current:'Order is being processed',next:'No customer action is currently required.',responsibleParty:'EMBODY'};
};
const classifyCase=item=>item.status==='WAITING_CUSTOMER'?{classification:'AWAITING_CUSTOMER',current:'Support is waiting for you',next:'Reply to the support case.',responsibleParty:'CUSTOMER'}:item.status==='ESCALATED'?{classification:'SUPPORT_REQUIRED',current:'Support case escalated',next:'The support team is reviewing the case.',responsibleParty:'EMBODY'}:['RESOLVED','CLOSED'].includes(item.status)?{classification:'COMPLETED',current:'Support case resolved',next:'No action is required.',responsibleParty:'NONE'}:{classification:'PROCESSING',current:'Support case in progress',next:'Wait for the next verified response.',responsibleParty:'EMBODY'};
const score=value=>({AWAITING_CUSTOMER:1,SUPPORT_REQUIRED:2,FAILED:3,PROCESSING:4,AWAITING_PHARMACY:5,AWAITING_EXTERNAL:6,ESTIMATED:7,COMPLETED:8,CANCELLED:9,UNKNOWN:10}[value]||10);
export function buildNextSteps({journeys=[],orders=[],supportCases=[]}){
  const rows=[
    ...journeys.filter(item=>!['ARCHIVED','CANCELLED','COMPLETED'].includes(item.state)).map(item=>({kind:'JOURNEY',id:String(item._id),title:item.title,classification:item.state==='ACTION_REQUIRED'?'AWAITING_CUSTOMER':item.state==='SUPPORT_REQUIRED'?'SUPPORT_REQUIRED':item.state.startsWith('AWAITING_')?item.state:'PROCESSING',current:item.stageLabel||'Journey in progress',next:item.nextStep?.label||'Review your journey.',responsibleParty:item.nextStep?.responsibleParty||'CUSTOMER',lastActivityAt:item.lastActivityAt||item.updatedAt,url:'/account/journey'})),
    ...orders.map(item=>({kind:'ORDER',id:String(item._id),title:`Order ${item.number}`,...classifyOrder(item),lastActivityAt:item.updatedAt,url:'/orders'})),
    ...supportCases.filter(item=>!['CLOSED'].includes(item.status)).map(item=>({kind:'SUPPORT',id:String(item._id),title:item.subject,...classifyCase(item),lastActivityAt:item.updatedAt,url:'/account/support-cases'}))
  ];
  rows.sort((a,b)=>score(a.classification)-score(b.classification)||new Date(b.lastActivityAt)-new Date(a.lastActivityAt));
  return rows;
}
