export type PlanCode = 'free' | 'plus_monthly' | 'plus_annual';

export type PublicPlan = {
  code: PlanCode;
  name: { ar: string; en: string };
  priceEgp: number;
  billingPeriod: 'none' | 'month' | 'year';
  launchPrice: boolean;
  features: { ar: string; en: string }[];
};

// Public display catalog. Payment amounts are independently enforced on the server.
export const publicPlans: PublicPlan[] = [
  {
    code: 'free',
    name: { ar: 'فَهيم المجاني', en: 'Fahim Free' },
    priceEgp: 0,
    billingPeriod: 'none',
    launchPrice: false,
    features: [
      { ar: 'مسارات عامة ومراجعات محدودة', en: 'Public paths and limited reviews' },
      { ar: 'بحث تعليمي موحّد', en: 'Unified learning search' },
      { ar: 'سجل تقدم أساسي', en: 'Core progress history' },
    ],
  },
  {
    code: 'plus_monthly',
    name: { ar: 'فَهيم بلس', en: 'Fahim Plus' },
    priceEgp: 49,
    billingPeriod: 'month',
    launchPrice: true,
    features: [
      { ar: 'المعلّم الذكي والأدلة على مستوى الادعاء', en: 'AI tutor and claim-level evidence' },
      { ar: 'خزانة معرفة ومراجعة متباعدة كاملة', en: 'Full knowledge vault and spaced review' },
      { ar: 'مشروعات وملف أخطاء ودليل تعلّم', en: 'Projects, mistake portfolio, and learning evidence' },
      { ar: 'استخدام عادل يعرض جلساتك بوضوح', en: 'Transparent fair-use session allowance' },
    ],
  },
  {
    code: 'plus_annual',
    name: { ar: 'فَهيم بلس سنوي', en: 'Fahim Plus Annual' },
    priceEgp: 399,
    billingPeriod: 'year',
    launchPrice: true,
    features: [
      { ar: 'كل مزايا بلس لمدة عام', en: 'Every Plus feature for one year' },
      { ar: 'توفير 189 جنيهًا مقابل الشهري', en: 'Save EGP 189 versus monthly' },
      { ar: 'أولوية في الخصائص التجريبية الآمنة', en: 'Priority access to safe beta features' },
    ],
  },
];

export function getPublicPlan(code: PlanCode) {
  return publicPlans.find((plan) => plan.code === code);
}
