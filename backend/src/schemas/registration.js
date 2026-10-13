import { z } from 'zod';

export const AGE_RANGES=['UNDER_18','18_29','30_44','45_59','60_PLUS'];
export const SERVICE_GOALS=['OTC_SHOPPING','MEDICATION_SAFETY','PHARMACIST_QUESTION','EXISTING_PRESCRIPTION'];
export const PHARMACIST_SUPPORT_OPTIONS=['YES','NO','NOT_SURE'];
export const US_STATE_CODES=['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export const isAdultAgeRange=value=>value!=='UNDER_18';

export const strongPassword=z.string().min(12).max(128).regex(/[a-z]/,'Add a lowercase letter.').regex(/[A-Z]/,'Add an uppercase letter.').regex(/[0-9]/,'Add a number.').regex(/[^A-Za-z0-9]/,'Add a symbol.');

export const registrationSchema=z.object({
  email:z.email(),
  password:strongPassword,
  firstName:z.string().trim().min(1).max(60),
  lastName:z.string().trim().min(1).max(60),
  ageRange:z.enum(AGE_RANGES),
  state:z.enum(US_STATE_CODES),
  serviceGoal:z.enum(SERVICE_GOALS),
  pharmacistSupport:z.enum(PHARMACIST_SUPPORT_OPTIONS),
  termsAccepted:z.union([z.literal('true'),z.literal(true)]),
  privacyAcknowledged:z.union([z.literal('true'),z.literal(true)]),
  marketing:z.union([z.literal('true'),z.literal(true)]).optional()
});
