import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export async function verifyCompletedPayment({confirmationId,amountCents}){
  if(env.NODE_ENV!=='production'&&confirmationId==='sandbox_paid')return{provider:'sandbox',externalId:`sandbox-${amountCents}-${Date.now()}`,confirmedAt:new Date()};
  if(!env.STRIPE_SECRET_KEY)throw new AppError('Payment provider is not configured.',503,'PAYMENT_NOT_CONFIGURED');
  throw new AppError('The production payment verification adapter must be completed and webhook-tested before accepting orders.',501,'PAYMENT_ADAPTER_PENDING');
}
