import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
export async function createPaymentIntent(){if(!env.STRIPE_SECRET_KEY)throw new AppError('Payment provider is not configured. Use sandbox checkout only.',503,'PAYMENT_NOT_CONFIGURED');throw new AppError('Confirm pharmacy-business support with the selected provider before enabling payments.',501,'PAYMENT_ADAPTER_PENDING')}
