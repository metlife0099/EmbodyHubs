export const fallbackComparisonOptions = [
  {
    id:'tadalafil-default',slug:'tadalafil',name:'Tadalafil',genericName:'Generic Cialis',tagline:'A longer-duration prescription option with as-needed and once-daily dosing approaches.',
    typicalOnset:'Taken before anticipated activity; timing and response vary by person.',typicalDuration:'Effectiveness demonstrated up to 36 hours after an as-needed dose.',frequency:'As needed, no more than once per day; or once daily when prescribed.',prescription:'Required — a licensed prescriber determines suitability.',importantConsiderations:'Must not be combined with nitrate medicines. Alcohol, blood-pressure medicines, alpha blockers, and certain health conditions may affect safety.',priceLabel:'Varies by strength, quantity, pharmacy, and coverage.',
    highlights:['Longer-duration characteristics may offer a wider planning window.','An approved once-daily approach is available for some patients.','Food does not determine when the labeled dose may be taken.'],source:{label:'DailyMed — Tadalafil prescribing information',url:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=351de7c2-98bf-7c88-e063-6294a90ad811'},sortOrder:10
  },
  {
    id:'sildenafil-default',slug:'sildenafil',name:'Sildenafil',genericName:'Generic Viagra',tagline:'An established as-needed prescription option taken before anticipated activity.',
    typicalOnset:'Usually taken about 1 hour before activity; the label allows 30 minutes to 4 hours before.',typicalDuration:'A shorter planning window than tadalafil; individual response varies.',frequency:'As needed, with a maximum recommended frequency of once per day.',prescription:'Required — a licensed prescriber determines suitability.',importantConsiderations:'Must not be combined with nitrate medicines. A high-fat meal may delay response, and interacting medicines or health conditions may change dosing.',priceLabel:'Varies by strength, quantity, pharmacy, and coverage.',
    highlights:['Established prescription treatment option for erectile dysfunction.','As-needed dosing may suit people who prefer dose-by-dose planning.','Available in multiple strengths selected by a licensed prescriber.'],source:{label:'DailyMed — Sildenafil prescribing information',url:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4df47282-7950-9430-e063-6394a90af579'},sortOrder:20
  }
];

export const fallbackComparisons = [{
  id:'tadalafil-vs-sildenafil-default',
  purpose:'Tadalafil vs Sildenafil',
  slug:'tadalafil-vs-sildenafil',
  intro:'Compare common characteristics side by side, then discuss your health history and goals with a licensed professional.',
  items:fallbackComparisonOptions,
  sortOrder:10
}];

export const comparisonRows = [
  ['typicalOnset','Typical onset'],
  ['typicalDuration','Typical duration'],
  ['frequency','Frequency'],
  ['prescription','Prescription'],
  ['importantConsiderations','Important considerations'],
  ['priceLabel','Price']
];
