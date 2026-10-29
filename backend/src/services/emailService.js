import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const client=env.BREVO_API_KEY?new BrevoClient({apiKey:env.BREVO_API_KEY,timeoutInSeconds:12,maxRetries:2}):null;
const sender={email:env.EMAIL_FROM,name:env.EMAIL_FROM_NAME};
async function send(payload){if(!client){if(env.NODE_ENV==='production')throw new AppError('Transactional email is temporarily unavailable.',503,'EMAIL_UNAVAILABLE');return{messageId:'sandbox-email-disabled'}}try{return await client.transactionalEmails.sendTransacEmail({...payload,sender,headers:{...(payload.headers||{}),'X-Auto-Response-Suppress':'All'}})}catch(error){throw new AppError('Transactional email could not be delivered. Please try again.',503,'EMAIL_DELIVERY_FAILED',{providerStatus:error.statusCode})}}
export async function sendOtpEmail({email,name,code,purpose,idempotencyKey}){const subjects={EMAIL_VERIFY:'Verify your EMBODY email',PASSWORD_RESET:'Reset your EMBODY password'};const payload={to:[{email,name,contactPixelTrackingConsent:false}],subject:subjects[purpose],tags:['security','otp'],headers:{'Idempotency-Key':idempotencyKey},params:{firstName:name,otp:code,expiresMinutes:10,purpose}};if(env.BREVO_OTP_TEMPLATE_ID)payload.templateId=env.BREVO_OTP_TEMPLATE_ID;else{payload.textContent=`Your EMBODY verification code is ${code}. It expires in 10 minutes. Never share this code. If you did not request it, ignore this message.`;payload.htmlContent=`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1 style="color:#0b1f2a">EMBODY</h1><p>Hello ${escapeHtml(name)},</p><p>Your one-time verification code is:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes. Never share it. EMBODY will never ask for it by phone or chat.</p></div>`}return send(payload)}
export async function sendInvoiceEmail({email,name,order,attachment}){const payload={to:[{email,name,contactPixelTrackingConsent:false}],subject:`Invoice ${order.invoice.number} from EMBODY`,tags:['transactional','invoice'],headers:{'Idempotency-Key':`invoice-${order.id}-${order.invoice.number}`},params:{firstName:name,orderNumber:order.number,invoiceNumber:order.invoice.number,total:(order.totalCents/100).toFixed(2)},attachment:[{name:`invoice-${order.invoice.number}.pdf`,content:attachment.toString('base64')}]};if(env.BREVO_INVOICE_TEMPLATE_ID)payload.templateId=env.BREVO_INVOICE_TEMPLATE_ID;else{payload.textContent=`Your invoice ${order.invoice.number} for order ${order.number} is attached. Total: $${(order.totalCents/100).toFixed(2)}.`;payload.htmlContent=`<p>Hello ${escapeHtml(name)},</p><p>Your invoice <strong>${escapeHtml(order.invoice.number)}</strong> is attached.</p><p>Order ${escapeHtml(order.number)} · $${(order.totalCents/100).toFixed(2)}</p>`}return send(payload)}
export async function sendChatNotificationEmail({customerName,customerEmail,messageId,receivedAt}){
  const email=env.SUPPORT_NOTIFICATION_EMAIL||env.ADMIN_SEED_EMAIL;
  if(!email)return{messageId:'chat-notification-unconfigured',skipped:true};
  const received=new Date(receivedAt).toLocaleString('en-US',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'});
  return send({
    to:[{email,name:'EMBODY Support',contactPixelTrackingConsent:false}],
    subject:`New support message from ${customerName}`,
    tags:['transactional','support-chat'],
    headers:{'Idempotency-Key':`support-chat-${messageId}`},
    textContent:`A new customer support message was received from ${customerName} (${customerEmail}) at ${received} UTC. Sign in to the EMBODY admin panel to read and reply. Message content is intentionally excluded from email.`,
    htmlContent:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#0b1f2a"><h1 style="font-size:24px">New support message</h1><p><strong>${escapeHtml(customerName)}</strong> (${escapeHtml(customerEmail)}) sent a message at ${escapeHtml(received)} UTC.</p><p>Sign in to the secure EMBODY admin panel to read and reply.</p><p style="color:#68777c;font-size:13px">For privacy, the message content is not included in this email.</p></div>`
  });
}
export async function sendHealthInfoEnquiryEmail({reference,name,email,group,category,description,medicineNames,message,categoryUrl}){
  const inbox=env.SUPPORT_NOTIFICATION_EMAIL||env.ADMIN_SEED_EMAIL;
  if(!inbox)throw new AppError('The health information enquiry inbox is not configured.',503,'ENQUIRY_INBOX_UNAVAILABLE');
  const medicines=medicineNames.length?medicineNames.join(', '):'No medicine examples are currently listed.';
  return send({
    to:[{email:inbox,name:'EMBODY Health Information',contactPixelTrackingConsent:false}],
    replyTo:{email,name},
    subject:`Health information enquiry: ${category} — ${reference}`,
    tags:['transactional','health-information-enquiry'],
    headers:{'Idempotency-Key':`health-info-enquiry-${reference}`},
    textContent:`A general health information enquiry was submitted. Reference: ${reference}. From: ${name} (${email}). Section: ${group}. Topic: ${category}. Published description: ${description}. Medicine names shown: ${medicines}. General message: ${message}. Topic page: ${categoryUrl}. Medicine names are informational examples, not recommendations or an offer to sell. This channel is not for medical advice, emergencies, prescriptions, or protected health information.`,
    htmlContent:`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b1f2a"><p style="color:#167a72;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">EMBODY health information enquiry</p><h1 style="font-size:25px">${escapeHtml(category)}</h1><p><strong>Reference:</strong> ${escapeHtml(reference)}</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#68777c">From</td><td style="padding:8px 0">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr><tr><td style="padding:8px 0;color:#68777c">Section</td><td style="padding:8px 0">${escapeHtml(group)}</td></tr><tr><td style="padding:8px 0;color:#68777c">Topic</td><td style="padding:8px 0">${escapeHtml(category)}</td></tr></table><p><strong>Published topic details</strong><br>${escapeHtml(description)}</p><p><strong>Medicine names shown</strong><br>${escapeHtml(medicines)}</p><p><strong>Customer's general question</strong><br>${escapeHtml(message)}</p><p><a href="${escapeHtml(categoryUrl)}">Open this topic on EMBODY</a></p><p style="padding:12px;background:#edf5f2;color:#52666c;font-size:13px">Medicine names are informational examples, not recommendations or an offer to sell. This channel is for general information only. Do not request or send diagnoses, prescriptions, emergency information, or protected health information by email.</p></div>`
  });
}
export async function sendHcpApplicationNotificationEmail({applicationId}){
  const email=env.SUPPORT_NOTIFICATION_EMAIL||env.ADMIN_SEED_EMAIL;
  if(!email)return{messageId:'hcp-notification-unconfigured',skipped:true};
  return send({
    to:[{email,name:'EMBODY Credentialing',contactPixelTrackingConsent:false}],
    subject:'Healthcare professional application requires review',
    tags:['transactional','hcp-credentialing'],
    headers:{'Idempotency-Key':`hcp-application-${applicationId}`},
    textContent:`A healthcare professional application (${applicationId}) is ready for credential review. Sign in to the EMBODY admin panel. Sensitive credential details are intentionally excluded from this email.`,
    htmlContent:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#0b1f2a"><h1 style="font-size:24px">Professional application ready</h1><p>Application <strong>${escapeHtml(applicationId)}</strong> requires credential review.</p><p>Sign in to the secure EMBODY admin panel to inspect the NPI registry result and state license information.</p><p style="color:#68777c;font-size:13px">Sensitive credential details are intentionally excluded from email.</p></div>`
  });
}
export async function sendHcpReviewEmail({email,name,status,applicationId}){
  const messages={
    APPROVED:{subject:'Your EMBODY professional account is approved',heading:'Credential review complete',body:'Your healthcare professional account has been approved.'},
    NEEDS_INFORMATION:{subject:'More information is needed for your EMBODY application',heading:'Application update requested',body:'The credentialing team needs additional information before it can complete your review.'},
    REJECTED:{subject:'Update on your EMBODY professional application',heading:'Credential review update',body:'Your professional application could not be approved at this time.'},
    SUSPENDED:{subject:'Your EMBODY professional access has been suspended',heading:'Professional access update',body:'Your professional access has been suspended pending review.'}
  };
  const message=messages[status]||messages.NEEDS_INFORMATION;
  return send({
    to:[{email,name,contactPixelTrackingConsent:false}],
    subject:message.subject,
    tags:['transactional','hcp-credentialing'],
    headers:{'Idempotency-Key':`hcp-review-${applicationId}-${status}`},
    textContent:`Hello ${name}, ${message.body} Sign in to your EMBODY account to securely view the current status and any reviewer note. Do not reply with patient or credential information.`,
    htmlContent:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#0b1f2a"><h1 style="font-size:24px">${escapeHtml(message.heading)}</h1><p>Hello ${escapeHtml(name)},</p><p>${escapeHtml(message.body)}</p><p>Sign in to your EMBODY account to securely view the current status and any reviewer note.</p><p style="color:#68777c;font-size:13px">Do not send patient or credential information by reply email.</p></div>`
  });
}
export async function sendPartnerVerificationEmail({email,name,reference,token}){const link=`${env.FRONTEND_URL}/partner-with-us/verify?token=${encodeURIComponent(token)}`;return send({to:[{email,name,contactPixelTrackingConsent:false}],subject:'Verify your EmbodyHubs partnership application email',tags:['transactional','partner-verification'],headers:{'Idempotency-Key':`partner-verify-${reference}`},textContent:`Hello ${name}, verify the professional email for application ${reference}: ${link}. The link expires in 24 hours. Do not forward it or reply with credentials, patient information, prescriptions, or medical records.`,htmlContent:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#0b1f2a"><h1 style="font-size:24px">Verify your professional email</h1><p>Hello ${escapeHtml(name)},</p><p>Confirm the professional email for partnership application <strong>${escapeHtml(reference)}</strong>.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;background:#0b5a79;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none">Verify email</a></p><p>This link expires in 24 hours. Submission does not guarantee approval or create a partnership.</p><p style="color:#68777c;font-size:13px">Do not reply with credentials, patient information, prescriptions, or medical records.</p></div>`})}
export async function sendPartnerAdminNotification({reference,applicantType,name,organization,state}){const email=env.SUPPORT_NOTIFICATION_EMAIL||env.ADMIN_SEED_EMAIL;if(!email)return{skipped:true};return send({to:[{email,name:'EmbodyHubs Partnerships',contactPixelTrackingConsent:false}],subject:`New EmbodyHubs Partner Application — ${reference}`,tags:['transactional','partner-review'],headers:{'Idempotency-Key':`partner-admin-${reference}`},textContent:`Application ${reference} is ready for review. Applicant type: ${applicantType}. Applicant: ${name}. Organization: ${organization||'Not provided'}. State: ${state}. Sign in to the secure admin dashboard. Sensitive license numbers and documents are intentionally excluded.`,htmlContent:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#0b1f2a"><h1 style="font-size:24px">Partnership application ready</h1><p><strong>${escapeHtml(reference)}</strong> is ready for review.</p><ul><li>Applicant type: ${escapeHtml(applicantType)}</li><li>Applicant: ${escapeHtml(name)}</li><li>Organization: ${escapeHtml(organization||'Not provided')}</li><li>State: ${escapeHtml(state)}</li></ul><p>Sign in to the secure admin dashboard.</p><p style="color:#68777c;font-size:13px">Sensitive license numbers and documents are intentionally excluded.</p></div>`})}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
