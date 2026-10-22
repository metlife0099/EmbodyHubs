import PDFDocument from 'pdfkit';

export function createInvoicePdf(order,customer){
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'LETTER',margin:54,info:{Title:`Invoice ${order.invoice.number}`,Author:'EMBODY Pharmacy'}});
    const chunks=[];
    doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    doc.fillColor('#0b1f2a').fontSize(24).text('EMBODY');doc.fontSize(10).fillColor('#557078').text('PHARMACY SERVICES');doc.moveDown(2);
    doc.fillColor('#14242b').fontSize(18).text(`Invoice ${order.invoice.number}`);doc.fontSize(10).text(`Order: ${order.number}`).text(`Issued: ${new Date(order.invoice.issuedAt).toLocaleDateString('en-US')}`).text(`Customer: ${customer.firstName} ${customer.lastName}`);
    doc.moveDown();doc.moveTo(54,doc.y).lineTo(558,doc.y).strokeColor('#dbe1de').stroke();doc.moveDown();
    for(const item of order.items){const option=item.variantLabel||[item.dosage,item.form,item.packSize].filter(Boolean).join(' · ');doc.fillColor('#14242b').fontSize(10).text(`${item.name}${option?` — ${option}`:''} × ${item.quantity}`,54,doc.y,{continued:true}).text(`$${(item.unitPriceCents*item.quantity/100).toFixed(2)}`,400,doc.y,{align:'right'});if(item.sku)doc.fillColor('#607078').fontSize(8).text(`SKU ${item.sku}`)}
    doc.moveDown();doc.fillColor('#14242b').fontSize(12).text(`Total: $${(order.totalCents/100).toFixed(2)}`,400,doc.y,{align:'right'});doc.moveDown(2);doc.fontSize(9).fillColor('#607078').text('This invoice records payment only. It does not establish prescription validity, pharmacist authorization, or dispensing approval.');doc.end();
  });
}
