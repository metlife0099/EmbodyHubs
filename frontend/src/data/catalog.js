export const categories = [
  { slug: 'sexual-health', name: 'Sexual health', eyebrow: 'Discreet support', description: 'Clinician-reviewed pathways for common sexual health concerns.', icon: 'spark' },
  { slug: 'hair-care', name: 'Hair care', eyebrow: 'Evidence-led care', description: 'Explore options for hair loss with clear education and review.', icon: 'leaf' },
  { slug: 'everyday-wellness', name: 'Everyday wellness', eyebrow: 'Daily foundations', description: 'Non-prescription products selected for everyday wellbeing.', icon: 'heart' }
];

export const products = [
  {
    id: 'sildenafil-50', slug: 'sildenafil-50mg', category: 'sexual-health', name: 'Sildenafil', ingredient: 'Sildenafil citrate', dosage: '50 mg', form: 'Tablet', pack: '6 tablets', price: 24, prescriptionRequired: true, stock: 36,
    badge: 'Professional review required', tone: 'teal',
    description: 'A prescription treatment option for erectile dysfunction. Eligibility, medicine choice, and dose must be determined by an appropriately licensed professional.',
    warnings: ['Do not take with nitrates or riociguat.', 'Seek emergency care for chest pain, sudden vision or hearing loss, or an erection lasting more than 4 hours.']
  },
  {
    id: 'tadalafil-10', slug: 'tadalafil-10mg', category: 'sexual-health', name: 'Tadalafil', ingredient: 'Tadalafil', dosage: '10 mg', form: 'Tablet', pack: '6 tablets', price: 29, prescriptionRequired: true, stock: 21,
    badge: 'Professional review required', tone: 'navy',
    description: 'A prescription treatment option for erectile dysfunction. A licensed professional must assess whether it is appropriate for you.',
    warnings: ['Do not take with nitrates or riociguat.', 'Tell the reviewer about heart conditions, blood pressure medicines, and other ED treatments.']
  },
  {
    id: 'minoxidil-foam', slug: 'minoxidil-foam-5', category: 'hair-care', name: 'Minoxidil foam', ingredient: 'Minoxidil', dosage: '5%', form: 'Topical foam', pack: '1 month supply', price: 31, prescriptionRequired: false, stock: 58,
    badge: 'Non-prescription', tone: 'sage',
    description: 'Topical minoxidil for certain patterns of hair loss. Read and follow the Drug Facts label before use.',
    warnings: ['For external use only.', 'Stop use and ask a clinician if chest pain, rapid heartbeat, faintness, or scalp irritation occurs.']
  },
  {
    id: 'daily-multi', slug: 'mens-daily-multivitamin', category: 'everyday-wellness', name: 'Daily essentials', ingredient: 'Vitamin and mineral blend', dosage: 'Daily', form: 'Capsule', pack: '30 capsules', price: 18, prescriptionRequired: false, stock: 84,
    badge: 'Wellness', tone: 'sand',
    description: 'A daily vitamin and mineral supplement. Supplements are not intended to diagnose, treat, cure, or prevent disease.',
    warnings: ['Consult a healthcare professional if you take medicines or have a medical condition.', 'Keep out of reach of children.']
  }
];

export const articles = [
  { slug: 'understanding-ed-care', category: 'Sexual health', title: 'What to expect from an ED care review', summary: 'Why a licensed professional asks about symptoms, medicines, and cardiovascular history.', read: '5 min', reviewed: 'Educational draft — clinical review required before publication' },
  { slug: 'hair-loss-basics', category: 'Hair care', title: 'Hair loss: the useful basics', summary: 'Common patterns, when to seek help, and how to prepare for a conversation about options.', read: '6 min', reviewed: 'Educational draft — clinical review required before publication' },
  { slug: 'medication-safety', category: 'Medication safety', title: 'Your medication list matters', summary: 'A simple guide to sharing medicines, supplements, and allergies safely.', read: '4 min', reviewed: 'Educational draft — clinical review required before publication' }
];
