export const careContent = {
  'cetirizine-10mg': {
    careName: 'Seasonal allergy care',
    headline: 'Clear, once-daily allergy support.',
    summaryPoints: ['24-hour tablet format', 'For symptoms listed on the Drug Facts label', 'Simple 30-tablet supply'],
    howItWorks: 'Cetirizine is an antihistamine. It blocks the action of histamine, a substance involved in common allergy symptoms. Use it only for the symptoms and people listed on the Drug Facts label.',
    pharmacistNote: 'Ask a healthcare professional before use if you have liver or kidney disease, or if you are pregnant or breastfeeding.',
    faqs: [
      ['What is cetirizine used for?', 'Cetirizine is labeled for temporary relief of certain symptoms caused by hay fever or other upper respiratory allergies. Check the Drug Facts label for the complete list.'],
      ['Can cetirizine cause drowsiness?', 'Drowsiness can occur. Avoid alcoholic drinks and use care when driving or operating machinery until you know how it affects you.'],
      ['How should I take it?', 'Follow the age-based directions and dose limits on the Drug Facts label. Do not take more than directed.']
    ]
  },
  'acetaminophen-500mg': {
    careName: 'Pain & fever care',
    headline: 'Label-first relief for everyday aches and fever.',
    summaryPoints: ['500 mg per caplet', 'Pain reliever and fever reducer', '50-caplet package'],
    howItWorks: 'Acetaminophen is an OTC pain reliever and fever reducer. Because it appears in many combination medicines, always compare active ingredients before taking more than one product.',
    pharmacistNote: 'Ask a healthcare professional before use if you have liver disease, take warfarin, or regularly consume three or more alcoholic drinks a day.',
    faqs: [
      ['What does acetaminophen help with?', 'It is labeled to temporarily reduce fever and relieve minor aches and pains. Read the package for the complete labeled uses.'],
      ['Can I combine it with another cold or pain medicine?', 'Do not use it with another medicine containing acetaminophen. Check every Drug Facts label or ask a pharmacist if you are unsure.'],
      ['Why is the daily limit important?', 'Taking more than directed can cause severe liver damage. Follow the package directions and dose limits exactly.']
    ]
  },
  'minoxidil-foam-5': {
    careName: 'Hair care',
    headline: 'A straightforward topical hair-care routine.',
    summaryPoints: ['5% topical foam', 'One-month supply', 'Drug Facts guidance included'],
    howItWorks: 'Topical minoxidil is labeled for certain patterns of hair loss. Results and eligibility vary, and continued use may be needed to maintain results. Follow the complete Drug Facts label.',
    pharmacistNote: 'Ask a healthcare professional before use if you have heart disease. Stop use and seek advice for chest pain, rapid heartbeat, faintness, or persistent scalp irritation.',
    faqs: [
      ['Who should use topical minoxidil?', 'Use only if your hair-loss pattern and age match the indications on the Drug Facts label. A pharmacist or healthcare professional can help if you are unsure.'],
      ['When might results appear?', 'The package label explains expected timing and when to stop if results do not occur. Individual results vary.'],
      ['Where should the foam be applied?', 'Apply only to the scalp as directed. It is for external use and should be kept away from the eyes and other parts of the body.']
    ]
  },
  'mens-daily-multivitamin': {
    careName: 'Daily wellness',
    headline: 'Everyday nutritional support, clearly presented.',
    summaryPoints: ['Daily capsule format', 'Vitamin and mineral blend', '30-day supply'],
    howItWorks: 'This dietary supplement provides a blend of vitamins and minerals intended to complement—not replace—a varied diet. It is not intended to diagnose, treat, cure, or prevent disease.',
    pharmacistNote: 'Talk with a healthcare professional before use if you have a medical condition, take medicines, or plan to combine it with other supplements.',
    faqs: [
      ['Is a multivitamin a replacement for a balanced diet?', 'No. Supplements are intended to complement a varied diet and healthy routine, not replace them.'],
      ['Can I take it with other supplements?', 'Compare labels to avoid unnecessary duplication. Ask a pharmacist or healthcare professional if you use several supplements or medicines.'],
      ['How should it be stored?', 'Follow the package storage directions and keep it securely out of reach of children.']
    ]
  }
};

export function getCareContent(product) {
  return careContent[product?.slug] || {
    careName: 'Everyday care',
    headline: product?.description || 'Clear product information for an informed choice.',
    summaryPoints: [product?.dosage || 'Label-first information', product?.form || 'Everyday care format', product?.pack || 'Package details shown before checkout'],
    howItWorks: product?.description || 'Review the complete product label, directions, and warnings before use.',
    pharmacistNote: 'Ask a pharmacist or healthcare professional before use if you have questions about conditions, allergies, medicines, or supplements.',
    faqs: [
      [`What should I know before using ${product?.name || 'this product'}?`, 'Read the complete package label, including active ingredients, uses, warnings, and directions, before use.'],
      ['Can I use it with my other medicines?', 'A pharmacist can help you check ingredients and possible interactions. Keep an up-to-date list of your medicines and supplements.'],
      ['When should I get medical help?', 'Follow the label’s stop-use directions. For a medical emergency, call 911.']
    ]
  };
}
