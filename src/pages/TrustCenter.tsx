import { Link } from 'react-router-dom';
import PrivacyInsightPanel from '@/components/teacher/PrivacyInsightPanel';
import { BadgeCheck, Bot, Database, FileCheck2, KeyRound, LockKeyhole, Scale, ShieldCheck, UserRoundCheck } from 'lucide-react';

type PolicyKey = 'overview' | 'privacy' | 'terms' | 'ai' | 'credentials';

const sections = {
  privacy: { icon: LockKeyhole, ar: 'الخصوصية والبيانات', en: 'Privacy & data' },
  terms: { icon: Scale, ar: 'شروط الاستخدام', en: 'Terms of use' },
  ai: { icon: Bot, ar: 'سياسة الذكاء الاصطناعي', en: 'AI policy' },
  credentials: { icon: BadgeCheck, ar: 'سياسة الشارات والشهادات', en: 'Badge & credential policy' },
} as const;

export default function TrustCenter({ language, focus = 'overview' }: { language: 'ar' | 'en'; focus?: PolicyKey }) {
  const rtl = language === 'ar';
  return <main className="trust-center-page">
    <section className="trust-center-hero"><div className="atlas-grid absolute inset-0 opacity-60" /><div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><p className="atlas-kicker"><ShieldCheck className="h-4 w-4" />FAHIM TRUST CENTER</p><div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end"><div><p className="atlas-display trust-hero-headline">{rtl ? 'الثقة ليست حاشية. هي جزء من قرار التعلّم.' : 'Trust is not fine print. It is part of every learning decision.'}</p><p className="mt-5 max-w-3xl leading-8 text-[var(--muted)]">{rtl ? 'هنا نوضح ما يجمعه فَهيم، وكيف يستخدم AI، ومتى تُصدر الشارات والشهادات، وما الذي لا ندّعيه.' : 'This center explains what Fahim stores, how AI is used, when badges and credentials are issued, and what we do not claim.'}</p></div><div className="trust-effective"><FileCheck2 /><span>{rtl ? 'آخر تحديث' : 'Effective date'}</span><strong><bdi>30 August 2026</bdi></strong><small>{rtl ? 'نسخة المنتج الحالية' : 'Current product release'}</small></div></div></div></section>
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[17rem_1fr] lg:px-8 lg:py-14">
      <aside className="trust-nav"><p className="atlas-section-number">POLICY INDEX</p>{Object.entries(sections).map(([key, item]) => { const Icon = item.icon; return <Link key={key} to={key === 'privacy' ? '/privacy' : key === 'terms' ? '/terms' : key === 'ai' ? '/ai-policy' : '/credentials-policy'} aria-current={focus === key ? 'page' : undefined} className={focus === key ? 'active' : ''}><Icon className="h-4 w-4" />{item[language]}</Link>; })}<Link to="/support" className="trust-support-link"><UserRoundCheck className="h-4 w-4" />{rtl ? 'اطلب دعمًا أو حذف بيانات' : 'Request support or data deletion'}</Link></aside>
      <article className="trust-policy">
        {focus==='overview' && <><section className="privacy-insight"><h2>{rtl?'كيف يمر سياق التعلّم؟':'How does learning context flow?'}</h2><ol className="trust-data-flow">{(rtl?['محاولة المتعلّم','سياق الدرس','تدخل فَهيم','تصنيف الدليل','استجابة للمتعلّم']:['Learner attempt','Lesson context','Fahim intervention','Evidence classification','Learner response']).map((label,i)=><li key={label}><span>{i+1}</span>{label}</li>)}</ol></section><PrivacyInsightPanel language={language}/></>}
        {focus === 'overview' ? <TrustOverview language={language} /> : null}
        {focus === 'privacy' ? <PrivacyPolicy language={language} /> : null}
        {focus === 'terms' ? <TermsPolicy language={language} /> : null}
        {focus === 'ai' ? <AiPolicy language={language} /> : null}
        {focus === 'credentials' ? <CredentialPolicy language={language} /> : null}
      </article>
    </div>
  </main>;
}

function TrustOverview({ language }: { language: 'ar' | 'en' }) {
  const rtl = language === 'ar';
  const promises = [
    { icon: Database, title: rtl ? 'أقل بيانات لازمة' : 'Minimum necessary data', body: rtl ? 'الملفات في خزانة المعرفة تُعالج محليًا ولا تُرفع إلى خوادم فَهيم في الإصدار الحالي.' : 'Knowledge Vault files are processed locally and are not uploaded to Fahim servers in the current release.' },
    { icon: KeyRound, title: rtl ? 'صلاحيات على الخادم' : 'Server-side authorization', body: rtl ? 'الأدوار وRLS وحدود المؤسسة تطبق عند قاعدة البيانات، لا بمجرد إخفاء زر في الواجهة.' : 'Roles, RLS, and organization boundaries are enforced at the database—not by hiding a UI button.' },
    { icon: Bot, title: rtl ? 'AI لا يقرر الاعتماد' : 'AI does not grant accreditation', body: rtl ? 'الذكاء الاصطناعي يشرح ويقترح تشخيصًا قابلًا للمراجعة؛ ولا يحوّل شهادة إتمام إلى اعتماد أكاديمي.' : 'AI explains and proposes revisable diagnoses; it cannot turn a completion credential into academic accreditation.' },
    { icon: BadgeCheck, title: rtl ? 'الإنجاز مرتبط بدليل' : 'Achievement is evidence-bound', body: rtl ? 'الشارات تُمنح من أحداث تعلم فعلية، والشهادات لها رقم وحالة تحقق وإمكانية إلغاء.' : 'Badges are awarded from real learning events, while credentials carry an ID, verification status, and revocation path.' },
  ];
  return <><PolicyHeader number="00" title={rtl ? 'عقد الثقة في فَهيم' : 'The Fahim trust contract'} body={rtl ? 'أربع قواعد يراها المستخدم داخل التجربة، لا في المستند فقط.' : 'Four rules visible inside the product—not only in this document.'} /><div className="trust-promise-grid">{promises.map(({ icon: Icon, title, body }, index) => <section key={title}><span>0{index + 1}</span><Icon /><h2>{title}</h2><p>{body}</p></section>)}</div></>;
}

function PrivacyPolicy({ language }: { language: 'ar' | 'en' }) {
  const rtl = language === 'ar';
  return <><PolicyHeader number="01" title={rtl ? 'سياسة الخصوصية والبيانات' : 'Privacy and data policy'} body={rtl ? 'وصف تشغيلي لما يحدث في النسخة الحالية. قد تُحدّث السياسة عند إضافة مزود أو غرض جديد، ويظهر تاريخ التحديث أعلى الصفحة.' : 'An operational description of the current release. The effective date changes when a provider or purpose changes.'} />
    <PolicySection title={rtl ? 'البيانات التي نعالجها' : 'Data we process'} items={rtl ? ['بيانات الحساب والملف التعليمي التي تقدمها عند التسجيل والإعداد.', 'سجل التقدم والمحاولات والمراجعات والشارات والشهادات اللازمة لتشغيل مسارك.', 'رسائل الدعم وإثباتات الدفع التي يرفعها المستخدم، داخل مساحات خاصة محمية.', 'بيانات تشغيل محدودة مثل request ID وحالة الخطأ والأداء دون وضع مفاتيح أو كلمات مرور في السجلات.'] : ['Account and learning-profile data provided during signup and onboarding.', 'Progress, attempts, reviews, badges, and credentials required to operate your path.', 'Support messages and payment evidence uploaded by the user to private protected storage.', 'Limited operational data such as request IDs, error states, and performance—without secrets or passwords in logs.']} />
    <PolicySection title={rtl ? 'خزانة المعرفة' : 'Knowledge Vault'} items={rtl ? ['PDF وTXT وMD وCSV وJSON وHTML تُقرأ وتُفهرس في المتصفح.', 'المحتوى يبقى في IndexedDB على الجهاز الحالي ما لم يرسله المستخدم صراحة إلى جلسة سؤال.', 'PDF المصوّر الذي لا يحتوي نصًا لا يُرسل تلقائيًا إلى OCR خارجي.'] : ['PDF, TXT, MD, CSV, JSON, and HTML are read and indexed in the browser.', 'Content remains in IndexedDB on the current device unless the learner explicitly hands selected passages to a tutor request.', 'Image-only PDFs are not silently transmitted to an external OCR provider.']} />
    <PolicySection title={rtl ? 'التحكم والاحتفاظ' : 'Control and retention'} items={rtl ? ['يمكن حذف المصادر المحلية من الخزانة فورًا من نفس الجهاز.', 'يمكن طلب تصحيح بيانات الحساب أو حذفها عبر الدعم، مع الاحتفاظ بما يلزم للنزاعات والأمن والقانون.', 'لا تعرض لوحات المعلم محادثات الطالب الخاصة افتراضيًا، وتُحجب الأنماط الصفية التي تخص أقل من ثلاثة طلاب.'] : ['Local sources can be removed immediately from the same device.', 'Account correction or deletion can be requested through support, subject to security, dispute, and legal retention.', 'Teacher views do not expose private student chats by default; class patterns below three learners are suppressed.']} />
  </>;
}

function TermsPolicy({ language }: { language: 'ar' | 'en' }) {
  const rtl = language === 'ar';
  return <><PolicyHeader number="02" title={rtl ? 'شروط الاستخدام' : 'Terms of use'} body={rtl ? 'استخدام فَهيم يعني استخدامه كمساعد تعليمي، لا كبديل للمعلم أو جهة التقييم أو التعليمات الرسمية.' : 'Fahim is an educational aid—not a substitute for teachers, assessment authorities, or official instructions.'} />
    <PolicySection title={rtl ? 'الاستخدام المقبول' : 'Acceptable use'} items={rtl ? ['قدّم مواد تملك حق استخدامها، ولا ترفع بيانات أو محتوى شخص آخر دون إذن.', 'لا تستخدم المنصة للغش أو انتحال أعمال أو تجاوز سياسات المدرسة والجامعة.', 'لا تحاول استخراج مفاتيح أو تجاوز الحدود أو اختبار الخدمة بصورة تضر مستخدمين آخرين.'] : ['Provide only material you have the right to use; do not upload another person’s private content without permission.', 'Do not use the platform for cheating, impersonation, or bypassing school and university policies.', 'Do not extract secrets, bypass limits, or test the service in ways that harm other users.']} />
    <PolicySection title={rtl ? 'الاشتراك والدفع' : 'Subscription and payment'} items={rtl ? ['التجربة المجانية 30 يومًا تبدأ مرة واحدة بعد إكمال الإعداد.', 'اشتراكات الدفع اليدوي لا تُفعّل بمجرد رفع صورة؛ يراجع مسؤول إثبات الدفع ثم يقبل أو يطلب إعادة الإرسال أو يرفض مع سبب.', 'الأسعار الإطلاقية قد تتغير للمشتركين الجدد، بينما تظهر تفاصيل الخطة قبل إرسال طلب الدفع.'] : ['The 30-day trial starts once after onboarding.', 'Manual subscriptions are not activated by upload alone; an administrator reviews payment evidence and can approve, request resubmission, or reject with a reason.', 'Launch pricing may change for new subscribers; plan details appear before a payment request is submitted.']} />
    <PolicySection title={rtl ? 'الدقة والتوافر' : 'Accuracy and availability'} items={rtl ? ['قد يخطئ AI؛ راجع المصادر في الموضوعات عالية المخاطر.', 'لا نضمن تشغيلًا بلا انقطاع، لكننا نستخدم حدود وقت وفشل آمن ومزودًا بديلًا حيث يكون مهيأ.', 'قد تُعلّق الحسابات التي تنتهك الأمان أو حقوق الآخرين بعد مراجعة مناسبة.'] : ['AI can make mistakes; verify sources for high-stakes topics.', 'Uninterrupted availability is not guaranteed, but the service uses timeouts, safe failure, and provider fallback where configured.', 'Accounts that violate security or others’ rights may be restricted after appropriate review.']} />
  </>;
}

function AiPolicy({ language }: { language: 'ar' | 'en' }) {
  const rtl = language === 'ar';
  return <><PolicyHeader number="03" title={rtl ? 'سياسة الذكاء الاصطناعي' : 'AI policy'} body={rtl ? 'الهدف هو بناء مهارة وفهم، لا تعظيم عدد الإجابات.' : 'The goal is skill and understanding—not maximizing answer volume.'} />
    <PolicySection title={rtl ? 'كيف يتدخل فَهيم' : 'How Fahim intervenes'} items={rtl ? ['يطلب محاولة وتفسيرًا قبل التصحيح في مسار التقييم.', 'تشخيص سوء الفهم فرضية قابلة للتعديل بعد كل محاولة، وليس حكمًا ثابتًا على الطالب.', 'يستخدم فئات واضحة: موثّق بمصدر، مستنتج، شرح تعليمي، معرفة عامة، أو يحتاج مراجعة.', 'لا يدّعي الاحتفاظ طويل المدى من إجابة صحيحة واحدة؛ تُستخدم مراجعة متأخرة.'] : ['Assessment asks for an attempt and reasoning before grading.', 'A misconception diagnosis is a revisable hypothesis—not a fixed label on a learner.', 'Responses distinguish verified source, inference, teaching explanation, general knowledge, and needs review.', 'One correct answer is not treated as long-term retention; delayed review is required.']} />
    <PolicySection title={rtl ? 'الحدود البشرية' : 'Human boundaries'} items={rtl ? ['المعلم أو مسؤول المحتوى يراجع المنهج والمواد عالية الأثر.', 'إصدار الشهادة قرار خادمي قابل للتدقيق، وليس نصًا يولده النموذج.', 'مخرجات الصحة والقانون والمال ليست بديلًا لمختص.'] : ['Educators or content operators review curriculum and high-impact material.', 'Credential issuance is an auditable server decision—not model-generated text.', 'Health, legal, and financial output is not a substitute for a qualified professional.']} />
  </>;
}

function CredentialPolicy({ language }: { language: 'ar' | 'en' }) {
  const rtl = language === 'ar';
  return <><PolicyHeader number="04" title={rtl ? 'سياسة الشارات والشهادات' : 'Badge and credential policy'} body={rtl ? 'فَهيم يفصل بوضوح بين الحافز، ودليل الإكمال، والاعتماد الخارجي.' : 'Fahim separates motivation, completion evidence, and external accreditation.'} />
    <PolicySection title={rtl ? 'الشارات' : 'Badges'} items={rtl ? ['الشارة مرحلة تحفيزية مرتبطة بحدث تعلم مسجل، مثل المحاولة أو إعادة المحاولة أو الاسترجاع.', 'لا تمثل الشارة درجة أكاديمية أو اعتمادًا مهنيًا.', 'لا يمكن للمستخدم منح الشارة لنفسه؛ تطبق قواعدها داخل قاعدة البيانات.'] : ['A badge is a motivational stage tied to a recorded event such as an attempt, retry, or recall.', 'A badge is not an academic grade or professional accreditation.', 'Learners cannot self-award badges; criteria are enforced in the database.']} />
    <PolicySection title={rtl ? 'شهادة الإتمام' : 'Completion credential'} items={rtl ? ['تصدر بعد تحقق شروط المسار والتقييم والمراجعة الإدارية المحددة.', 'تحمل رقمًا ورابط تحقق واسم المستفيد وتاريخ الإصدار ولقطة من دليل الأهلية.', 'يمكن إلغاؤها عند الخطأ أو التلاعب، وتظهر حالة الإلغاء في صفحة التحقق.', 'توقيع Marwan Abdelghaffar، Founder of Fahim AI هو توقيع المُصدر، وليس توقيع جهة اعتماد أكاديمية.'] : ['Issued only after configured path, assessment, and administrator-review conditions are satisfied.', 'Carries an ID, verification link, recipient, issue date, and eligibility evidence snapshot.', 'Can be revoked for error or fraud; revocation appears in the public verification record.', 'The Marwan Abdelghaffar, Founder of Fahim AI signature identifies the issuer; it is not academic accreditation.']} />
    <PolicySection title={rtl ? 'الاعتماد الخارجي' : 'External accreditation'} items={rtl ? ['لا يظهر شعار جهة اعتماد أو شريك قبل اتفاق موثق.', 'قد تُضاف معايير Open Badges أو شراكات لاحقًا فقط بعد تنفيذها والتحقق منها فعليًا.', 'حتى ذلك الوقت، الوصف الصحيح هو: شهادة إتمام صادرة من فَهيم.'] : ['No accreditation or partner logo appears without a documented agreement.', 'Open Badges conformance or partnerships may be added only after real implementation and verification.', 'Until then, the accurate description is: Certificate of Completion issued by Fahim.']} />
  </>;
}

function PolicyHeader({ number, title, body }: { number: string; title: string; body: string }) { return <header className="trust-policy-header"><p className="atlas-section-number">POLICY / {number}</p><h1>{title}</h1><p>{body}</p></header>; }
function PolicySection({ title, items }: { title: string; items: string[] }) { return <section className="trust-policy-section"><h2>{title}</h2><ul>{items.map((item) => <li key={item}><span aria-hidden="true" /><p>{item}</p></li>)}</ul></section>; }
