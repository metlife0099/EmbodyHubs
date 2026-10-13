export const AGE_OPTIONS=[
  {value:'UNDER_18',label:'Under 18'},
  {value:'18_29',label:'18–29'},
  {value:'30_44',label:'30–44'},
  {value:'45_59',label:'45–59'},
  {value:'60_PLUS',label:'60 or older'}
];

export const SERVICE_GOAL_OPTIONS=[
  {value:'OTC_SHOPPING',label:'Shop over-the-counter and wellness products'},
  {value:'MEDICATION_SAFETY',label:'Learn about medication safety'},
  {value:'PHARMACIST_QUESTION',label:'Ask a pharmacist a question'},
  {value:'EXISTING_PRESCRIPTION',label:'Get help with an existing prescription'}
];

export const PHARMACIST_SUPPORT_OPTIONS=[
  {value:'YES',label:'Yes, show me pharmacist support options'},
  {value:'NO',label:'Not right now'},
  {value:'NOT_SURE',label:'I’m not sure'}
];

export const US_STATES=[
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],['DC','District of Columbia']
].map(([value,label])=>({value,label}));
