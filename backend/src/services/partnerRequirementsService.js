export const REQUIRED_PARTNER_DOCUMENTS=[
  'DEA_LICENSE',
  'STATE_PHARMACY_LICENSE',
  'PROFESSIONAL_LICENSE',
  'BUSINESS_LICENSE',
  'EIN_DOCUMENT',
  'W9_FORM',
  'CERTIFICATE_OF_INSURANCE',
  'OWNERSHIP_AGREEMENT'
];

export const REQUIRED_PHARMACY_DOCUMENTS=REQUIRED_PARTNER_DOCUMENTS;

export const DOCUMENT_LABELS={
  DEA_LICENSE:'DEA License',
  STATE_PHARMACY_LICENSE:'State Pharmacy License',
  BUSINESS_LICENSE:'Business License',
  EIN_DOCUMENT:'EIN Document',
  W9_FORM:'W-9 Form',
  CERTIFICATE_OF_INSURANCE:'Certificate of Insurance',
  OWNERSHIP_AGREEMENT:'Ownership Agreement',
  PROFESSIONAL_LICENSE:'Professional License',
  CLINIC_IMAGE:'Pharmacy or clinic image',
  CLINIC_VIDEO:'30–60 second pharmacy or clinic video',
  OTHER:'Other requested document'
};

export function isPharmacyApplicant(applicantType){
  return ['LICENSED_PHARMACY','PHARMACY_ORGANIZATION'].includes(applicantType);
}

export function partnershipDocumentReadiness(application){
  const documents=application.documents||[];
  const present=new Set(documents.map(item=>item.documentType));
  const missingDocuments=REQUIRED_PARTNER_DOCUMENTS.filter(type=>!present.has(type));
  const clinicImageCount=documents.filter(item=>item.documentType==='CLINIC_IMAGE').length;
  const clinicVideoCount=documents.filter(item=>item.documentType==='CLINIC_VIDEO'&&Number(item.durationSeconds)>=30&&Number(item.durationSeconds)<=60).length;
  return{
    required:true,
    complete:missingDocuments.length===0&&clinicImageCount>=2&&clinicVideoCount>=1,
    requiredDocuments:REQUIRED_PARTNER_DOCUMENTS,
    missingDocuments,
    clinicImageCount,
    clinicImagesRemaining:Math.max(0,2-clinicImageCount),
    clinicVideoCount,
    clinicVideoRemaining:Math.max(0,1-clinicVideoCount)
  };
}
