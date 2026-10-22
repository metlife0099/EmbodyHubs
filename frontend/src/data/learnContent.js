const source = (name, url) => ({ name, url });

export const learnCategories = [
  { id:'treatment-basics', name:'Treatment Basics', number:'01', description:'Start with the essentials: what treatment may do, what affects timing, and what to discuss before beginning.', accent:'teal' },
  { id:'condition-guides', name:'Condition Guides', number:'02', description:'Plain-language introductions to common concerns and what a professional evaluation may include.', accent:'sage' },
  { id:'treatment-comparisons', name:'Treatment Comparisons', number:'03', description:'Understand the practical differences between approaches without turning education into a recommendation.', accent:'sand' },
  { id:'safety-side-effects', name:'Safety & Side Effects', number:'04', description:'Important precautions, common questions, interactions, and signs that call for prompt help.', accent:'navy' },
  { id:'frequently-asked-questions', name:'Frequently Asked Questions', number:'05', description:'Straight answers about prescriptions, evaluations, shipping, follow-up, and refills.', accent:'clay' },
  { id:'glossary', name:'Glossary', number:'06', description:'Medical and pharmacy terms translated into clear, everyday language.', accent:'mint' }
];

const niddkEd = source('National Institute of Diabetes and Digestive and Kidney Diseases — Erectile Dysfunction', 'https://www.niddk.nih.gov/health-information/urologic-diseases/erectile-dysfunction');
const niddkDiagnosis = source('NIDDK — Diagnosis of Erectile Dysfunction', 'https://www.niddk.nih.gov/health-information/urologic-diseases/erectile-dysfunction/diagnosis');
const niddkTreatment = source('NIDDK — Treatment for Erectile Dysfunction', 'https://www.niddk.nih.gov/health-information/urologic-diseases/erectile-dysfunction/treatment');
const medlineEd = source('MedlinePlus — Erection Problems', 'https://medlineplus.gov/ency/article/007617.htm');
const medlineSelfCare = source('MedlinePlus — Erection Problems: Self-care', 'https://medlineplus.gov/ency/patientinstructions/000396.htm');
const medlinePe = source('MedlinePlus — Premature Ejaculation', 'https://medlineplus.gov/ency/article/001524.htm');
const medlineSildenafil = source('MedlinePlus — Sildenafil', 'https://medlineplus.gov/druginfo/meds/a699015.html');
const medlineTadalafil = source('MedlinePlus — Tadalafil', 'https://medlineplus.gov/druginfo/meds/a604008.html');
const fdaOnline = source('FDA BeSafeRx — Considering an Online Pharmacy', 'https://www.fda.gov/drugs/besaferx-your-source-online-pharmacy-information/considering-online-pharmacy');

export const learnArticles = [
  {
    slug:'how-prescription-ed-treatments-work', categoryId:'treatment-basics', category:'Treatment Basics', title:'How do prescription ED treatments work?', summary:'A clear introduction to erections, blood flow, and what oral PDE5 inhibitors are designed to do.', read:'6 min', featured:true,
    seoTitle:'How Prescription ED Treatments Work | EMBODY Learn', keywords:['ED treatment','PDE5 inhibitor','erectile dysfunction education'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Oral ED medicines support a natural response; they do not create automatic arousal.','Different medicines have different instructions, timing, and interaction risks.','A licensed healthcare professional must decide whether a prescription option is appropriate for you.'],
    sections:[
      { heading:'Start with the normal response', body:['An erection involves signals from the brain and nerves, relaxation of smooth muscle, and increased blood flow into the penis. Physical health, medicines, stress, and relationship factors can all influence that process.'] },
      { heading:'Where PDE5 inhibitors fit', body:['PDE5 inhibitors help preserve a chemical signal involved in relaxing blood vessels. That can improve blood flow during sexual stimulation. They do not increase desire by themselves and they are not a cure for every cause of erectile difficulty.'] },
      { heading:'Why an evaluation still matters', body:['Erectile concerns can sometimes be connected with cardiovascular disease, diabetes, hormone issues, medication effects, or emotional health. A professional can review the full picture and discuss options that match your health history.'] }
    ], sources:[niddkEd,niddkTreatment,medlineSelfCare]
  },
  {
    slug:'how-long-ed-treatment-effects-last', categoryId:'treatment-basics', category:'Treatment Basics', title:'How long does ED treatment typically last?', summary:'Why “how long” can mean onset, effective window, or how long a medicine remains in the body.', read:'5 min',
    seoTitle:'How Long Do ED Treatments Last? | EMBODY Learn', keywords:['ED treatment duration','tadalafil duration','sildenafil timing'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Onset and duration are not the same thing.','Food, dose, other medicines, and individual health can change timing.','Never take an extra dose because a medicine seems slow to work unless your prescriber instructs you to.'],
    sections:[
      { heading:'Three different clocks', body:['Onset is how soon an effect may begin. The effective window is the period when a medicine may support a response with stimulation. Half-life describes how the body clears a medicine; it does not tell you exactly how long an erection will last.'] },
      { heading:'Why there is no universal timetable', body:['Specific medicines vary, and the same medicine may feel different from one person to another. Meals, alcohol, age, liver or kidney function, and interacting medicines may matter. Follow the exact instructions on your prescription.'] },
      { heading:'An erection should not last for the whole window', body:['The effective window means the body may respond during that time. An erection lasting more than four hours is an emergency and needs immediate medical care.'] }
    ], sources:[medlineSelfCare,medlineSildenafil,medlineTadalafil]
  },
  {
    slug:'what-to-know-before-starting-ed-treatment', categoryId:'treatment-basics', category:'Treatment Basics', title:'What should I know before starting treatment?', summary:'A practical checklist for medicine lists, health history, goals, and questions for a clinician or pharmacist.', read:'7 min',
    keywords:['before ED treatment','medication list','ED evaluation'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Bring a complete list of prescriptions, OTC products, and supplements.','Tell the clinician about heart symptoms, blood-pressure medicines, and nitrate use.','Set a clear goal and ask what to do if the first approach is not effective.'],
    sections:[
      { heading:'Prepare the complete picture', body:['Include medicines used every day and only occasionally, vitamins, supplements, allergies, surgeries, and major medical conditions. Do not leave out medicines obtained elsewhere.'] },
      { heading:'Share symptoms honestly', body:['A clinician may ask when the concern began, whether it happens consistently, and whether morning or spontaneous erections occur. These questions help distinguish possible contributing factors; they are not a judgment.'] },
      { heading:'Understand the plan', body:['Ask how and when to take a medicine, what interactions to avoid, which side effects are expected, what requires urgent help, and when follow-up should happen. Do not change or stop prescribed treatment without professional guidance.'] }
    ], sources:[niddkDiagnosis,niddkTreatment,medlineEd]
  },
  {
    slug:'understanding-erectile-concerns', categoryId:'condition-guides', category:'Condition Guides', title:'Understanding erectile concerns', summary:'What erectile dysfunction means, what may contribute to it, and why it is worth discussing with a professional.', read:'7 min', featured:true,
    keywords:['erectile dysfunction guide','erectile concerns','ED causes'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Occasional difficulty is common; persistent or recurring difficulty deserves attention.','Physical, medication-related, and emotional factors can overlap.','A conversation may identify an underlying health issue as well as treatment options.'],
    sections:[
      { heading:'What the term means', body:['Erectile dysfunction generally means ongoing difficulty getting or keeping an erection firm enough for sex. It is not considered a routine part of aging, even though risk may increase with age.'] },
      { heading:'More than one cause is possible', body:['Blood-vessel and nerve conditions, diabetes, hormone changes, medicines, tobacco use, stress, anxiety, depression, and relationship concerns may contribute. Self-diagnosis can miss important context.'] },
      { heading:'What an evaluation may include', body:['A professional may review medical, sexual, and mental-health history, check blood pressure, perform a focused exam, and order tests when appropriate. The goal is to understand contributing factors and choose a safe next step.'] }
    ], sources:[niddkEd,niddkDiagnosis,medlineEd]
  },
  {
    slug:'understanding-premature-ejaculation', categoryId:'condition-guides', category:'Condition Guides', title:'Understanding premature ejaculation', summary:'A respectful overview of timing concerns, distress, and the value of a complete assessment.', read:'6 min',
    keywords:['premature ejaculation guide','ejaculation concerns','sexual health evaluation'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['The concern is not defined by a stopwatch alone; control, distress, and relationship impact matter.','It can occur lifelong or develop later.','Behavioral, relationship, psychological, and medical factors may all be relevant.'],
    sections:[
      { heading:'A common and personal concern', body:['Premature ejaculation refers to ejaculation that occurs sooner than a person or couple would like, together with limited control or meaningful distress. Experiences vary, so an individualized conversation is more useful than comparison with a single number.'] },
      { heading:'What may contribute', body:['Anxiety, relationship stress, learned patterns, erection concerns, and some health factors may play a role. A clinician can ask targeted questions and decide whether an exam or other evaluation is appropriate.'] },
      { heading:'A range of approaches', body:['Education, behavioral techniques, counseling, and prescribed treatment may be discussed depending on the situation. Products marketed as instant fixes may be ineffective or unsafe; use a licensed professional and legitimate pharmacy.'] }
    ], sources:[medlinePe]
  },
  {
    slug:'preparing-for-a-sexual-health-evaluation', categoryId:'condition-guides', category:'Condition Guides', title:'Preparing for a sexual health evaluation', summary:'What to gather, what questions may come up, and how to make a private visit more useful.', read:'5 min',
    keywords:['sexual health appointment','ED evaluation questions','telehealth preparation'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Write down your timeline, symptoms, medicines, and questions in advance.','Expect questions about general health as well as sexual health.','Telehealth can support evaluation, but in-person testing may still be needed.'],
    sections:[
      { heading:'Before the appointment', body:['Make a brief timeline, note what makes the concern better or worse, and gather your medicine and supplement list. If you track blood pressure at home, bring accurate recent readings rather than estimates.'] },
      { heading:'During the conversation', body:['Answer as completely as you can. Ask how your information is protected, what the clinician thinks may be contributing, and what benefits, limitations, or follow-up each option involves.'] },
      { heading:'After the visit', body:['Keep the plan and pharmacy instructions. Contact the care team if your symptoms change, side effects occur, or the treatment is not working as expected. Never share a prescription medicine.'] }
    ], sources:[niddkDiagnosis,niddkTreatment]
  },
  {
    slug:'daily-vs-as-needed-approaches', categoryId:'treatment-comparisons', category:'Treatment Comparisons', title:'Daily vs as-needed approaches', summary:'A practical comparison of scheduling, spontaneity, adherence, and the questions that affect a prescribing decision.', read:'6 min', featured:true,
    keywords:['daily vs as needed ED treatment','tadalafil daily','ED treatment comparison'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Daily and as-needed are dosing approaches, not promises of a specific result.','Convenience, frequency, side effects, other medicines, and cost may affect the discussion.','Only take the schedule written by your prescriber.'],
    sections:[
      { heading:'As-needed treatment', body:['An as-needed medicine is taken before anticipated sexual activity according to its prescribed timing and maximum frequency. Meals and other factors may affect some medicines.'] },
      { heading:'Daily treatment', body:['A daily approach uses a lower scheduled dose for some medicines and indications. It may reduce the need to plan around a single dose, but requires consistent use and is not suitable for everyone.'] },
      { heading:'How to compare responsibly', body:['Ask about interactions, expected timing, missed doses, side effects, refill cadence, and total cost. Do not combine daily and as-needed doses or switch schedules without instructions.'] }
    ], sources:[medlineSildenafil,medlineTadalafil]
  },
  {
    slug:'medication-vs-nonmedication-options', categoryId:'treatment-comparisons', category:'Treatment Comparisons', title:'Medication and non-medication options', summary:'How lifestyle support, counseling, devices, and prescriptions can occupy different roles in a care plan.', read:'7 min',
    keywords:['ED treatment options','non medication ED options','ED counseling devices'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Treatment should address contributing factors, not only the immediate symptom.','Non-medication options can be useful alone or with prescribed care.','Online supplements advertised as “natural” can still interact with medicines or contain hidden ingredients.'],
    sections:[
      { heading:'Addressing health factors', body:['Physical activity, sleep, tobacco cessation, alcohol moderation, and management of blood pressure, diabetes, or other conditions may support overall and sexual health. These steps are not an instant replacement for evaluation.'] },
      { heading:'Other established approaches', body:['Depending on the cause and preference, counseling, vacuum erection devices, injected or inserted medicines, and surgical options may be discussed. Each has different benefits, limitations, and training needs.'] },
      { heading:'Be cautious with unverified products', body:['Avoid products that promise prescription-like results without a prescription. Use a pharmacy that requires valid prescriptions, provides pharmacist access, and can be verified with the relevant state board of pharmacy.'] }
    ], sources:[niddkTreatment,fdaOnline]
  },
  {
    slug:'common-side-effects-questions', categoryId:'safety-side-effects', category:'Safety & Side Effects', title:'Common questions about side effects', summary:'How to think about expected effects, unusual symptoms, and when to contact the prescribing team.', read:'6 min',
    keywords:['ED medicine side effects','sildenafil side effects','tadalafil side effects'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Side effects differ by medicine, dose, and person.','Read the medication guide and know the urgent warning signs before the first dose.','Report persistent or concerning effects rather than changing the dose yourself.'],
    sections:[
      { heading:'Common does not mean universal', body:['Headache, flushing, indigestion, nasal symptoms, dizziness, or muscle and back discomfort may occur with some oral ED medicines. The approved patient information for your specific prescription is the right place to check.'] },
      { heading:'Keep useful notes', body:['Record when the symptom started, how long it lasted, what else you took, and whether it returned. This helps a clinician distinguish a possible side effect from another health problem.'] },
      { heading:'Do not “treat around” a reaction', body:['Do not add another medicine, split or combine doses, or stop an important long-term medicine without guidance. A pharmacist can also check whether other products may be contributing.'] }
    ], sources:[medlineSildenafil,medlineTadalafil]
  },
  {
    slug:'important-precautions-interactions', categoryId:'safety-side-effects', category:'Safety & Side Effects', title:'Important precautions and interactions', summary:'Why nitrates, blood-pressure effects, and a complete medicine list matter before oral ED treatment.', read:'7 min',
    keywords:['PDE5 nitrate interaction','ED medicine precautions','drug interactions'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['PDE5 inhibitors must not be combined with nitrate medicines because blood pressure can fall dangerously.','Other medicines and health conditions may require a different plan or dose.','Tell every treating professional when and what ED medicine you last took, especially in an emergency.'],
    sections:[
      { heading:'Nitrates are a critical interaction', body:['Nitrates used for chest pain and recreational “poppers” containing nitrates can interact dangerously with PDE5 inhibitors. If chest pain occurs after an ED medicine, seek emergency help and tell responders what you took and when.'] },
      { heading:'Other details matter too', body:['Alpha blockers, blood-pressure medicines, certain antifungals or antibiotics, HIV medicines, and other drugs may affect safety or dosing. Heart, liver, kidney, bleeding, eye, and blood-cell conditions may also be relevant.'] },
      { heading:'Use one verified prescriber and pharmacy record', body:['Keeping a complete record reduces the chance of hidden duplication or interaction. Never use someone else’s prescription, and avoid websites that sell prescription medicine without requiring a valid prescription.'] }
    ], sources:[medlineSildenafil,medlineTadalafil,fdaOnline]
  },
  {
    slug:'when-to-contact-a-healthcare-professional', categoryId:'safety-side-effects', category:'Safety & Side Effects', title:'When to contact a healthcare professional', summary:'A simple guide to routine follow-up, prompt calls, and symptoms that require emergency care.', read:'5 min',
    keywords:['ED treatment emergency','priapism','when to call doctor ED medicine'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Call 911 for a medical emergency.','An erection lasting more than four hours requires immediate emergency care.','Sudden vision or hearing changes after treatment require urgent medical attention.'],
    sections:[
      { heading:'Emergency: act now', body:['Call 911 for chest pain, severe shortness of breath, fainting, stroke symptoms, or a serious allergic reaction. Seek emergency care immediately for an erection lasting more than four hours.'] },
      { heading:'Urgent: get prompt medical advice', body:['Sudden loss or major change in vision or hearing needs urgent attention. Stop sexual activity and seek help if you develop dizziness, nausea, or pain, numbness, or tingling in the chest, arms, neck, or jaw.'] },
      { heading:'Routine follow-up still matters', body:['Contact the care team if side effects persist, symptoms change, the prescribed approach is not working, or you have questions about dosing. Do not take more than prescribed.'] }
    ], sources:[medlineSildenafil,medlineTadalafil,niddkTreatment]
  },
  {
    slug:'prescription-and-evaluation-faq', categoryId:'frequently-asked-questions', category:'Frequently Asked Questions', title:'Prescription and evaluation questions', summary:'What a legitimate prescription process should include, from identity and health history to professional review.', read:'6 min',
    keywords:['online ED prescription','telehealth evaluation FAQ','legitimate online pharmacy'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['A questionnaire alone is not a guarantee that a prescription will be issued.','The licensed prescriber decides whether treatment is appropriate.','A legitimate online pharmacy requires a valid prescription and offers access to a pharmacist.'],
    sections:[
      { heading:'Why are personal questions necessary?', body:['A prescriber needs enough accurate information to evaluate possible causes, interaction risks, and whether remote care is appropriate. Some situations require an in-person exam or testing.'] },
      { heading:'Will everyone receive a prescription?', body:['No. A clinician may request more information, recommend in-person care, suggest another approach, or decide that a medicine is not appropriate. Payment should never guarantee prescribing.'] },
      { heading:'How can I evaluate an online pharmacy?', body:['Look for a valid prescription requirement, a U.S. physical address and phone number, access to a licensed pharmacist, and state-board licensure. Avoid sellers offering prescription drugs without these safeguards.'] }
    ],
    faq:[['Can an online questionnaire guarantee a prescription?','No. A licensed prescriber must independently decide whether a prescription is appropriate.'],['Should an online pharmacy require a prescription?','Yes. A legitimate U.S. online pharmacy requires a valid prescription for prescription medicine and provides access to a licensed pharmacist.']],
    sources:[niddkDiagnosis,fdaOnline]
  },
  {
    slug:'shipping-refills-and-followup-faq', categoryId:'frequently-asked-questions', category:'Frequently Asked Questions', title:'Shipping, refills, and follow-up questions', summary:'What happens after a clinical decision, why refills may need review, and what tracking can—and cannot—tell you.', read:'5 min',
    keywords:['prescription shipping FAQ','prescription refill review','online pharmacy tracking'], updated:'2026-10-22', reviewStatus:'source-checked',
    takeaways:['Clinical approval, pharmacy fulfillment, and carrier delivery are separate steps.','A refill can require renewed health information or professional review.','Tracking confirms package movement, not the safety or authenticity of a seller.'],
    sections:[
      { heading:'Before a prescription order ships', body:['The pharmacy must have a valid prescription, confirm product and destination eligibility, complete required pharmacist checks, and verify inventory and payment. Timelines may change if more information is needed.'] },
      { heading:'Why a refill may pause', body:['Prescriptions have limits and expiration rules. A refill may require updated symptoms, medicines, blood pressure, follow-up, or a new prescription. Do not wait until the final dose to ask about timing.'] },
      { heading:'Using delivery information safely', body:['Use the tracking number from the pharmacy or known carrier. Inspect the package and label on arrival, store the medicine as directed, and contact the dispensing pharmacy if anything looks wrong.'] }
    ],
    faq:[['Does a tracking number mean my prescription was clinically approved?','No. Tracking reports carrier activity only; it does not describe the prescribing or pharmacy review.'],['Why might a refill need another evaluation?','Health information, medicines, symptoms, or prescription validity can change, so a prescriber or pharmacist may need updated information.']],
    sources:[fdaOnline]
  }
];

export const glossaryTerms = [
  { term:'As-needed dosing', letter:'A', definition:'Taking a medicine only at an instructed time or in an instructed situation, rather than on a fixed daily schedule. It still has a maximum dose and frequency.' },
  { term:'Contraindication', letter:'C', definition:'A reason a medicine or procedure should not be used because the potential harm is too great for that person or situation.' },
  { term:'Daily dosing', letter:'D', definition:'Taking a prescribed amount on a regular daily schedule. Daily dosing is not appropriate for every medicine or every person.' },
  { term:'Half-life', letter:'H', definition:'The approximate time the body takes to reduce the amount of a medicine by half. It is not the same as how long you feel an effect.' },
  { term:'Interaction', letter:'I', definition:'A change in a medicine’s effect caused by another medicine, supplement, food, alcohol, or health condition.' },
  { term:'Nitrate', letter:'N', definition:'A class of medicine often used for chest pain. Nitrates can cause a dangerous blood-pressure drop when combined with PDE5 inhibitors.' },
  { term:'Onset', letter:'O', definition:'How soon an effect may begin after a treatment is used. Onset varies by medicine and person.' },
  { term:'PDE5 inhibitor', letter:'P', definition:'A prescription drug class that supports blood flow by slowing an enzyme called phosphodiesterase type 5. Some medicines in this class are used for erectile dysfunction.' },
  { term:'Prescription', letter:'P', definition:'An authorization from a licensed prescriber for a specific medicine, patient, dose, and set of instructions. It does not replace pharmacist review.' },
  { term:'Priapism', letter:'P', definition:'An erection that lasts more than four hours. It is a medical emergency because permanent damage can occur without prompt treatment.' },
  { term:'Refill', letter:'R', definition:'An additional dispensing allowed by a prescription. Refills can be limited by the prescriber, expiration, law, or the need for follow-up.' },
  { term:'Telehealth evaluation', letter:'T', definition:'A healthcare evaluation conducted through secure remote communication. A clinician may still decide that an in-person exam or testing is needed.' }
];

export function getLearnArticle(slug){ return learnArticles.find(article => article.slug === slug); }
export function getLearnCategory(id){ return learnCategories.find(category => category.id === id); }
