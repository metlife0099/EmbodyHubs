import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { Order } from '../models/Order.js';

async function migrate(){
  await connectDatabase();
  await Promise.all([
    Order.collection.createIndex({'payment.bankTransactionReferenceFingerprint':1},{unique:true,sparse:true}),
    Order.collection.createIndex({'payment.provider':1,paymentStatus:1,createdAt:-1})
  ]);
  console.log('Zelle payment indexes are ready. No order or payment data was modified.');
}

migrate().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>mongoose.disconnect());
