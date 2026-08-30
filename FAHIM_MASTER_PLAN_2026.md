# الخطة الرئيسية لمنصة فَهيم — المنتج، السوق، الأعمال والتنفيذ

آخر تحديث: 9 أغسطس 2026

## 1. الملخص التنفيذي

فَهيم لا يجب أن يصبح نسخة عربية من ChatGPT أو كتالوج فيديوهات جديدًا. التموضع الأقوى هو:

> **نظام تشغيل للفهم الموثق: يحول سؤال الطالب أو منهجه إلى مسار قصير من الدليل، والشرح، والمحاولة، والتغذية الراجعة، والمراجعة، ثم ينتج إثباتًا واضحًا لما أتقنه فعلًا.**

الوعد الأساسي:

> «افهم ما تحتاجه الآن، من مصدر يمكن تتبعه، ثم أثبت أنك تستطيع استخدامه ولا تنسه.»

المنتج الحالي يثبت جودة سطح التجربة والهوية والـlearning loop، لكنه لا يثبت بعد جاهزية منصة تجارية ومؤسسية كاملة. لذلك نستخدم درجتين منفصلتين:

- **قوة تجربة المنتج الحالية: 8.1/10** — واجهة مميزة، معلم، بحث متعدد المصادر، فيديو، RAG محلي، اختبارات ومراجعة متباعدة.
- **جاهزية المنصة التشغيلية والتجارية: 5.4/10** — لا توجد بعد مدفوعات حقيقية، مزامنة شاملة، فصول سلطوية، إصدار شهادات موثقة، تشغيل مؤسسي، دعم، اتفاقيات محتوى أو مراقبة production مكتملة.

الهدف خلال 12 شهرًا ليس «إضافة أكبر عدد خصائص»، بل الوصول إلى:

1. حلقة تعلم موثقة قابلة للقياس؛
2. بيانات منهج مصرية محدثة ومراجعة بشريًا؛
3. منتج طالب يدفع مقابله لأنه يوفر الوقت ويحسن الاستدعاء؛
4. منتج مدرس يوفر وقت إعداد الواجب والمتابعة؛
5. سجل إنجاز يمكن التحقق منه دون إصدار شهادات وهمية؛
6. بنية آمنة وقابلة للتوسع والبيع للمدارس والجامعات.

## 2. منهجية التقييم وحدودها

اعتمد التقييم على:

- ما يمكن إثباته داخل المستودع: المسارات، APIs، الاختبارات، Supabase migrations، التخزين المحلي وسياسات RLS؛
- صفحات المنتجات والوثائق الرسمية للمنافسين؛
- مصادر رسمية عن التعليم المصري والمعايير والخصوصية؛
- أبحاث تعلم منشورة عن الاسترجاع المتكرر، التباعد والأمثلة المحلولة.

الدرجات ليست دراسة مستخدمين أو إثبات أثر تعليمي. أي افتراض حول الرغبة في الدفع أو معدل التحويل يجب اختباره ميدانيًا.

## 3. حجم المشكلة والسوق الأولي

وزارة التعليم ذكرت وجود **25,689,571 طالبًا قبل جامعيًا، و62,690 مدرسة، و1,260,801 معلمًا** في العام 2025/2026. وفي الثانوية العامة 2024/2025 تقدم **785,099 طالبًا** للدور الأول. هذه أرقام تثبت اتساع السوق، لكنها لا تعني أن كل فرد عميل محتمل أو قادر على الدفع.

المصادر:

- [وزارة التعليم: حجم منظومة التعليم قبل الجامعي 2025/2026](https://moe.gov.eg/en/what-s-on/news/on-health/)
- [وزارة التعليم: نتيجة الثانوية العامة 2024/2025](https://moe.gov.eg/en/what-s-on/news/22-7-2025/)
- [البنك الدولي: إصلاح التعليم في مصر والموارد الرقمية](https://www.worldbank.org/en/news/feature/2024/05/21/egypt-preparing-students-for-life-and-the-workplace-of-tomorrow)

### TAM / SAM / SOM بطريقة واقعية

- **TAM سياقي:** طلاب التعليم قبل الجامعي في مصر، ثم طلاب الجامعة والتعلم المهني عربيًا. لا نستخدمه كتوقع إيراد.
- **SAM للمرحلة الأولى:** طلاب المرحلة الثانوية المصرية، وبالأخص STEM والثانوية العامة، وطلاب أول عامين بالجامعة في التخصصات العلمية.
- **Beachhead قابل للقياس:** 785 ألف متقدم سنويًا للثانوية العامة، مع تركيز أول على علمي علوم ورياضة.
- **SOM مستهدف وليس متنبأ به:**
  - سنة 1: 25 ألف حساب نشط، 2,500 عميل مدفوع، و3–5 تجارب مدارس.
  - سنة 2: 150 ألف حساب نشط، 15 ألف عميل مدفوع، و15 مؤسسة.
  - سنة 3: 500 ألف حساب نشط، 50 ألف عميل مدفوع، و50 مؤسسة.

لا تتحول هذه الأهداف إلى forecast مالي قبل اختبار retention وwillingness-to-pay.

## 4. التقييم الكامل للحالة الحالية

| المجال | الحالي /10 | الهدف | الحكم الصريح |
|---|---:|---:|---|
| الهوية وتجربة الاستخدام | 8.6 | 9.2 | هوية Atlas مميزة وRTL جيد؛ يلزم اختبار استخدام فعلي وتوحيد بقايا الشاشات القديمة |
| المعلم والـAI | 7.4 | 9.0 | Streaming، أوضاع تعليم ومصادر؛ ينقص learner model عميق، تقييم مستمر وحوكمة prompts |
| البحث المعرفي | 8.2 | 9.2 | مصر + Wikimedia + OpenAlex + Crossref؛ ينقص curriculum graph وفهرس داخلي مرخص وتحقق claim-level |
| RAG والملفات | 6.8 | 9.0 | محلي وخاص ويدعم PDF/text؛ ينقص OCR، embeddings، مزامنة، versioning، صلاحيات وحذف سلطوي |
| الفيديو | 7.8 | 9.0 | تشغيل داخل المنصة، ملاحظات وتقدم؛ ينقص transcript موثوق، chapters، playlists سلطوية وPiP متسق |
| الاختبارات والإتقان | 7.8 | 9.3 | توليد وتصحيح ومراجعة متباعدة؛ ينقص بنك أسئلة معاير، psychometrics، محاولات سلطوية ونزاهة تقييم |
| الدورات والمحتوى | 5.2 | 8.8 | 9 مسارات و72 درسًا لكن المحتوى ثابت داخل الكود وغير مُدار تحريريًا أو معتمدًا |
| التخصيص | 6.6 | 9.0 | درجة/مادة/تاريخ/مراجعات؛ لا يوجد knowledge state أو prerequisite graph أو recommendation evaluation |
| الفصول والمعلم | 3.5 | 8.8 | Pilot محلي فقط؛ لا يوجد roster حقيقي أو submissions أو gradebook أو moderation workflow |
| المشاريع | 4.0 | 8.5 | Rubric وتقييم ذاتي؛ ينقص رفع أعمال، نسخ، مراجعة بشرية، plagiarism policy وportfolio evidence |
| الشهادات | 2.5 | 8.5 | readiness فقط؛ لا يوجد issuer موثوق، توقيع، تحقق عام أو partner endorsement |
| الحسابات والصلاحيات | 7.0 | 9.0 | Email/OAuth/magic/reset موجود؛ يلزم MFA، session/device controls، guardian flow واختبار providers |
| البيانات وSupabase | 4.8 | 9.0 | جداول وRLS واسعة؛ توجد migrations متداخلة/متعارضة وتسميات schema مزدوجة يلزم حسمها قبل الإنتاج |
| الدفع والاشتراكات | 1.5 | 8.5 | schema فقط؛ لا checkout أو webhook أو invoice أو entitlement أو refund workflow |
| الإدارة والعمليات | 4.2 | 8.8 | users/roles وfeature tables؛ ينقص content ops، queues، support desk، moderation وfinancial ops |
| الأمن والخصوصية | 6.7 | 9.2 | CSP وRLS وحدود إدخال؛ rate limiting ذاكرة process وغير موزع، ولا DPIA/DSAR/retention أو secrets rotation workflow |
| الرصد والاعتمادية | 4.8 | 9.0 | health/telemetry/load harness؛ لا tracing أو alerting أو SLO أو backups/restore drills أو incident process |
| PWA والموبايل | 4.0 | 8.5 | responsive وmanifest؛ لا Service Worker أو offline queue أو install/update lifecycle أو app shells حقيقية |
| الوصول | 7.4 | 9.2 | focus وRTL وتباين جيد؛ يلزم تدقيق WCAG 2.2 AA آلي ويدوي مع قارئ شاشة |
| SEO والنمو العضوي | 5.5 | 8.5 | metadata أساسية؛ SPA تحد من صفحات الدورات الديناميكية وstructured content طويل الأجل |
| الجاهزية التجارية | 2.5 | 8.5 | لا pricing، billing، sales pipeline، support SLA، contracts أو product analytics مكتملة |

### أخطر ديون تقنية قبل أي توسع

1. يوجد نموذجان كبيران متداخلان لـLearning OS في migrations، مع اختلافات مثل `user_id/owner_id` و`chat_history/chat_messages` و`role/key/slug`. يجب إنشاء canonical schema جديد واختبار migration من الصفر ومن قاعدة موجودة.
2. وظائف الفصول والمشاريع والمراجعات تعتمد جزئيًا على localStorage؛ لا يمكن اعتبارها multi-user أو authoritative.
3. rate limit الحالي Map داخل عملية serverless؛ لا يحمي عبر instances أو regions.
4. الكتالوج التعليمي hard-coded؛ لا توجد دورة نشر، مراجعة، نسخة عام دراسي أو rollback للمحتوى.
5. وجود جدول subscriptions لا يعني وجود تجارة: لا يوجد provider integration أو webhooks أو entitlements.
6. Vite SPA يعمل، لكنه لا يحقق وحده متطلبات SEO/SSR والمؤسسات. الانتقال إلى Next.js يجب أن يكون تدريجيًا بعد تثبيت data contracts، لا إعادة كتابة عمياء.

## 5. المشهد التنافسي وما نتعلمه

### مصر والمنطقة

- **Nagwa:** منهج مصري واسع ومزدوج اللغة. فرصة فَهيم ليست إعادة إنتاج الكتالوج، بل التوجيه بين الدليل والشرح والمحاولة. [Nagwa Egypt](https://www.nagwa.com/en/eg/)
- **Noon Academy:** اجتماعي، مجموعات، مدرسون وتفاعل حي. فَهيم يركز على جلسة فردية هادئة وقرار التعلم التالي، ثم يضيف تعاونًا مضبوطًا لا feed مفتوحًا. [Noon Academy](https://www.noonacademy.com/en-eg)
- **Abwaab:** فيديو، بنك أسئلة، اختبارات موقوتة، مدرس مساعد وتقارير. فَهيم يحتاج parity في بنك الأسئلة والمتابعة، ويتفوق بالدليل المفتوح وذاكرة المفاهيم. [Abwaab](https://play.google.com/store/apps/details?id=me.abwaab.abwaabv2_app)
- **Raskh:** منافس قريب جدًا في PDF، التكرار المتباعد، decay وFeynman voice. لا يجوز تقديم هذه الخصائص وحدها كتميّز. فرصة فَهيم هي curriculum + evidence + assessment + teacher loop. [Raskh](https://raskh.app/)

### العالم

- **ChatGPT Study Mode:** تعليم سقراطي وملفات وصوت، لكنه عام وليس curriculum-governed لمصر. [OpenAI Study Mode](https://openai.com/index/chatgpt-study-mode/)
- **NotebookLM:** grounding قوي، citations، مصادر متعددة، flashcards/quizzes وAudio Overview. يتفوق بعد أن يجمع المستخدم المصادر؛ فَهيم يجب أن يحل أيضًا اكتشاف المصدر وربطه بالمنهج والتقييم. [NotebookLM for Education](https://edu.google.com/ai-notebooklm/)
- **Perplexity Learn:** search-first مع شرح واختبارات وبطاقات؛ يرفع سقف البحث التعليمي، لذلك لا يكفي تعدد المصادر دون curriculum authority. [Perplexity Learn Mode](https://www.perplexity.ai/help-center/en/articles/12120542-what-is-learn-mode)
- **Khanmigo:** benchmark قوي للمدرس والتقارير والتعليم السقراطي، مع خطة أفراد منخفضة نسبيًا وأدوات مدرسين مجانية. [Khanmigo Pricing](https://www.khanmigo.ai/pricing)
- **YouTube Courses:** تقدم رسميًا progress، completion badges، quizzes وتعليقات. فَهيم لا يفوز بمجرد embedding؛ يفوز بالترتيب، الربط بالمفهوم، الملاحظات والاستدعاء بعد الفيديو. [YouTube Courses](https://support.google.com/youtube/answer/12751869?hl=en-GB)
- **Udemy:** 26 ألف دورة في Personal Plan، AI assistant، labs، coding exercises وشهادات إتمام. [Udemy Personal Plan](https://www.udemy.com/personal-plan/)
- **Coursera:** 10 آلاف+ دورة وشركاء جامعات وشركات وشهادات ومشاريع؛ Plus معلن بسعر 59 دولارًا شهريًا أو 399 سنويًا عالميًا. [Coursera Plus](https://www.coursera.org/courseraplus)
- **Quizlet:** مكتبة ضخمة وLearn/Practice Tests، لكن بعض الخصائص المتقدمة مرتبطة بالاشتراك واللغة/السوق. [Quizlet Plans](https://quizlet.com/upgrade-web)

## 6. مساحة التميز التي يصعب نسخها

### 6.1 Learning Evidence Graph — رسم دليل التعلم

يربط كل مفهوم بـ:

- المصدر والنسخة والعام الدراسي؛
- الشرح الذي شاهده الطالب؛
- محاولاته وأخطائه؛
- مستوى الثقة ووقت آخر استدعاء؛
- المشروع أو الدليل الذي طبق فيه المهارة؛
- الشخص أو الجهة التي راجعت الإنجاز.

هذه ليست dashboard شكلية؛ إنها أصل البيانات الذي يصنع recommendations، تقارير المعلم والشهادات لاحقًا.

### 6.2 Evidence Contract — عقد الدليل

كل إجابة تعرض حالة واضحة:

- **موثق:** مدعوم بمقطع مصدر محدد؛
- **مستنتج:** استنتاج معلن من أكثر من مصدر؛
- **شرح تعليمي:** تبسيط من النموذج وليس نصًا من المرجع؛
- **يحتاج مراجعة مدرس:** تعارض أو حساسية منهجية؛
- **غير متاح:** لا نخمن.

### 6.3 Misconception Atlas — أطلس الأخطاء

بدل حفظ score فقط، تُصنف الأخطاء الشائعة والسبب المحتمل، مثال مضاد، prerequisite مفقود، وأفضل intervention. الطالب يرى «ما الذي يوقعني في الخطأ؟»، والمدرس يرى توزيع المفاهيم لا المحادثات الخاصة.

### 6.4 Exam Drift Monitor — مراقب تغير المنهج والامتحان

يربط المصادر بالعام الدراسي والقرار الوزاري، ويبلغ فريق المحتوى والمعلم عندما يصبح مورد قديمًا أو يتغير نطاق المادة. تحديث نظام الثانوية 2025/2026 مثال على ضرورة versioning، لا hard-coded content. [قرار مواد المرحلة الثانوية 2025/2026](https://moe.gov.eg/en/what-s-on/news/17-9-25-1/)

### 6.5 Bilingual Concept Bridge — جسر المصطلح

ليس زر ترجمة؛ لكل مفهوم:

- الاسم العربي والإنجليزي والرمز؛
- تعريف مبسط ورسمي؛
- أخطاء ترجمة شائعة؛
- مثال من السياق المصري ومثال عالمي؛
- نطق واستخدام في سؤال امتحان أو مشروع.

### 6.6 Friction-Aware Learning — تعلم يراعي الظروف

المستخدم يحدد: الوقت، سرعة الإنترنت، طاقة التركيز، وموعد الامتحان. النظام يختار فيديو قصير أو نص أو صوت أو اختبار offline، بدل خطة مثالية غير قابلة للتطبيق.

### 6.7 Proof-of-Learning Passport — جواز تعلم

سجل قابل للتحقق يضم skill، criteria، assessment، evidence، reviewer، الإصدار والتوقيع. يستخدم Open Badges 3.0/Verifiable Credentials عند النضج، لا صورة PDF سهلة التزوير. Open Badges يدعم هوية المُصدر، المعايير، الأدلة والتوقيع الرقمي. [1EdTech Open Badges](https://www.1edtech.org/standards/open-badges)

### 6.8 Privacy Boundary for Families — حد الخصوصية

ولي الأمر يرى الهدف، الوقت، المحاولات والمخاطر، لا نص المحادثة افتراضيًا. الطالب يعرف بدقة ما الذي سيُشارك. هذا يحل تعارض الرقابة والثقة الذي تتجاهله منتجات كثيرة.

### 6.9 Teacher Copilot with Accountability

المعلم يوفر وقتًا في بناء rubric، variants وfeedback groups، لكن كل مادة مولدة تحمل draft state، source، approver وrevision history. لا نشر تلقائي لأسئلة عالية المخاطر.

### 6.10 Mistake Portfolio — معرض المحاولات

Portfolio يعرض تطور الحل من محاولة خاطئة إلى حل متقن، وهو أقوى تعليميًا وتوظيفيًا من certificate completion فقط.

## 7. مبادئ التعلم التي يجب أن تتحول إلى منطق منتج

- الاسترجاع المتكرر يحسن التعلم عبر مراحل ومواد متعددة؛ مراجعة تطبيقية وجدت فوائد متوسطة أو كبيرة في نسبة كبيرة من الدراسات. [Systematic review of retrieval practice](https://doi.org/10.1007/s10648-021-09595-9)
- توزيع جلسات الاسترجاع على الزمن يجمع spacing وretrieval practice. [Meta-analysis via ERIC](https://eric.ed.gov/?id=EJ1310148)
- الأمثلة المحلولة تقلل الحمل المعرفي للمبتدئ، ثم يجب تقليل المساعدة تدريجيًا مع الخبرة. [Worked-example study](https://www.sciencedirect.com/science/article/abs/pii/S0361476X1000055X)
- الذكاء الاصطناعي وحده ليس المنهج؛ جودة التفاعل والـinstructional harness أهم من طول الإجابة.

قرارات المنتج الناتجة:

1. pre-check قصير قبل الشرح؛
2. worked example ثم completion problem ثم independent problem؛
3. hint ladder لا زر «أظهر الإجابة» مباشرة؛
4. confidence check قبل وبعد؛
5. delayed check بعد 1/3/7/21 يومًا؛
6. transfer task خارج صياغة المثال؛
7. recommendation مبني على evidence وليس clicks.

## 8. Personas وJobs-to-be-Done

### Persona A — مريم، طالبة ثانوية عامة علمي

- **العمر/السياق:** 17 سنة، الهاتف هو الجهاز الأساسي، وقتها موزع بين المدرسة والدروس.
- **الهدف:** تعرف بالضبط ماذا تراجع اليوم وتمنع تراكم نقاط الضعف.
- **الألم:** كثرة المدرسين والفيديوهات، إجابات AI واثقة بلا منهج، وخطط طويلة تنهار بعد يومين.
- **السلوك:** YouTube وWhatsApp، جلسات قصيرة، صور أسئلة، استخدام ليلي.
- **JTBD:** «عندما أتوقف أمام سؤال، ساعدني على تشخيص الجزء الناقص، ثم درّبني على سؤال مشابه وذكّرني به قبل أن أنساه.»
- **لحظة القيمة:** حل مستقل صحيح بعد hint وليس مجرد قراءة الحل.
- **الاعتراض:** «هل ده مطابق للنظام والسنة الحالية؟»
- **الخاصية الحاسمة:** curriculum version + source status + exam-mode + review queue.
- **فرضية الدفع:** الأسرة تدفع إذا ظهر توفير وقت وتحسن في اختبارات أسبوعية؛ تختبر ولا تفترض.

### Persona B — يوسف، طالب هندسة/حاسبات

- **العمر/السياق:** 19–23، المصادر إنجليزية لكن الفهم الأسرع أحيانًا بالعربية.
- **الهدف:** فهم المفهوم ثم استخدامه في كود أو مشروع قابل للعرض.
- **الألم:** courses طويلة، شات يعطي كودًا دون فهم، وتشتت بين docs وYouTube.
- **JTBD:** «اربط لي المصطلح الإنجليزي بشرح عربي دقيق، ثم اجعلني أبني شيئًا وأراجع قراراتي.»
- **لحظة القيمة:** artifact يعمل + explanation + rubric evidence.
- **الخاصية الحاسمة:** bilingual concept bridge، sandbox آمن لاحقًا، project review وportfolio.

### Persona C — أحمد، طالب تعليم فني/باحث عن مهارة عمل

- **السياق:** إنترنت وميزانية محدودان، يحتاج نتيجة عملية لا مسارًا أكاديميًا طويلًا.
- **الهدف:** مهارة قابلة للاستخدام واختبار عملي موثوق.
- **الألم:** محتوى إنجليزي، أجهزة ضعيفة، شهادات لا تثبت أداء فعليًا.
- **JTBD:** «علمني بالموبايل وبأقل بيانات، ثم أثبت أنني أنجزت مهمة حقيقية.»
- **الخاصية الحاسمة:** low-bandwidth/offline، micro-projects، assessor-reviewed evidence.

### Persona D — دينا، مدرسة علوم/رياضيات

- **السياق:** تدرس عدة فصول ووقتها الإداري محدود.
- **الهدف:** اكتشاف misconception groups وإعطاء تدخل مناسب بسرعة.
- **الألم:** AI ينشئ أسئلة غير منضبطة، dashboards كثيرة بلا قرار، والتصحيح متكرر.
- **JTBD:** «حوّل أهداف الدرس إلى نشاط وأسئلة بمصادر، اجمع المحاولات، ثم أخبرني من يحتاج ماذا مع إبقائي صاحبة القرار.»
- **لحظة القيمة:** توفير 30–60 دقيقة إعداد/تصحيح مع مراجعة نهائية بسيطة.
- **الخاصية الحاسمة:** class roster، assignment builder، approval workflow، misconception heatmap.

### Persona E — سلمى، ولية أمر

- **الهدف:** الاطمئنان إلى تقدم حقيقي وسلامة الاستخدام دون التجسس على الطفل.
- **الألم:** ساعات شاشة لا تعني تعلمًا، اشتراكات متعددة، وخوف من إجابات AI.
- **JTBD:** «أرني هل التزم ابني بالهدف وأين يحتاج مساعدة، دون كشف محادثاته الخاصة افتراضيًا.»
- **الخاصية الحاسمة:** weekly evidence digest، controls، budgets وprivacy boundary.

### Persona F — د. عمر، مدير مدرسة/برنامج

- **الهدف:** تجربة قابلة للقياس والحوكمة قبل شراء واسع.
- **الألم:** وعود AI بلا أثر، مخاطر بيانات القصر، وصعوبة دمج أدوات منفصلة.
- **JTBD:** «أطلق pilot لفصل أو مادة، راقب adoption والأثر والمخاطر، ثم قرر التوسع.»
- **الخاصية الحاسمة:** tenant isolation، SSO/LTI لاحقًا، audit، DPA، exports وSLO.

### Anti-personas

- من يريد حل الامتحان أو الواجب كاملًا دون تعلم؛
- مؤسسة تريد مراقبة محادثات الطلاب سرًا؛
- ناشر يريد رفع محتوى لا يملك حقوقه؛
- جهة تريد شهادة «معتمدة» دون تقييم أو جهة إصدار حقيقية.

## 9. Information Architecture المقترحة

بدل مساواة كل الخصائص في navigation:

1. **اليوم:** المهمة التالية، مراجعات مستحقة، متابعة فيديو/درس.
2. **افهم:** معلم، بحث، ملفات، فيديو.
3. **تدرّب:** Quiz، flashcards، exam simulator، teach-back.
4. **أنجز:** courses، assignments، projects، portfolio.
5. **أثبِت:** mastery map، evidence passport، credentials.
6. **علّم:** classes، content studio، review queue، analytics.
7. **أدِر:** users، sources، curriculum versions، safety، billing، operations.

كل صفحة تنتهي بـnext best action واحد، لا شبكة CTA غير محدودة.

## 10. نموذج الأعمال

### 10.1 نموذج الإيراد

**B2C Freemium** هو قناة اكتساب، و**B2B2C schools/programs** هو مسار الثقة والاستدامة، و**verified assessment** إيراد لاحق مشروط بشريك حقيقي.

#### Free

- بحث ومصادر عامة؛
- عدد يومي محدود من AI learning loops؛
- RAG محلي بحجم محدود؛
- بطاقات يدوية ومراجعة أساسية؛
- مسارات عامة بدون credential موثق.

#### Student Plus — فرضية تسعير للاختبار

- 99–149 جنيهًا شهريًا أو 799–1,199 سنويًا؛
- حدود AI أعلى، مزامنة مشفرة، OCR، خطط امتحان، advanced analytics وoffline packs؛
- لا نغلق المصادر الرسمية أو البيانات التي أنشأها الطالب خلف paywall.

#### Teacher Pro — فرضية

- 249–399 جنيهًا شهريًا؛
- فصول، assignments، rubrics، feedback grouping، content approval وexports؛
- مجانية أو مخفضة لأول cohort للحصول على evidence وcase studies.

#### Schools / Universities

- 25–60 جنيهًا لكل مستخدم نشط شهريًا، بفوترة فصل دراسي وحد أدنى وعرض مخصص؛
- onboarding، tenant controls، dashboards، SSO/LTI، support وDPA؛
- pilot مدفوع صغير قبل عقد سنوي.

#### Verified Assessment / Credential

- 99–299 جنيهًا للمحاولة/الاعتماد كفرضية؛
- لا يطلق إلا مع identity check، rubric، evaluator/partner، signed credential وappeal process.

الأسعار تُختبر A/B وبمقابلات، وتراجع ربع سنويًا بسبب تغير التكلفة وسعر الصرف.

### 10.2 الدفع

في مصر نحتاج cards + mobile wallets + recurring + خيار cash-assisted. وثائق Paymob تدعم البطاقات والمحافظ، وتعرض Subscription APIs للمدفوعات المتكررة، ما يجعلها مرشحًا أوليًا يحتاج تفاوضًا واختبارًا. [Paymob payment methods](https://developers.paymob.com/paymob-docs/developers/quicklink-apis/overview)

### 10.3 اقتصاديات الوحدة المستهدفة

- AI + search + storage cost أقل من 10–15% من صافي B2C revenue؛
- gross margin B2C أعلى من 70% بعد الاستقرار؛
- CAC payback أقل من 3 أشهر؛
- LTV/CAC أكبر من 3؛
- monthly paid churn أقل من 6% بعد موسم الإطلاق؛
- school pilot إلى annual conversion أكبر من 40%؛
- الدعم أقل من 8 tickets لكل 1,000 MAU أسبوعيًا.

تسعير Gemini الحالي يسمح بمزيج routing بين Flash-Lite/Flash/Pro، مع caching وBatch للأعمال غير التفاعلية. يجب حفظ cost per loop وليس token cost فقط. [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

## 11. Go-to-Market

### المرحلة 1 — ثانوية عامة STEM في مصر

- شراكة مع 10–20 مدرسًا صغيرًا/متوسطًا، لا مشاهير فقط؛
- «اختبار فجوة مجاني» لكل باب ثم مسار مراجعة 7 أيام؛
- صفحات SEO لكل مفهوم/خطأ شائع مع مصادر العام الحالي؛
- shareable misconception report بدون كشف المحادثة؛
- WhatsApp reminders بإذن واضح، لا spam؛
- سفراء طلاب مبنيون على completed loops لا registrations.

### المرحلة 2 — الجامعة والمهارات التقنية

- مسارات bilingual مبنية حول projects؛
- شراكات clubs وcareer centers؛
- project evidence pages وreview days؛
- ربط بالمراجع والأبحاث عبر OpenAlex/Crossref.

### المرحلة 3 — المؤسسات

- 3–5 pilots بمادة واحدة ومدة 8–12 أسبوعًا؛
- baseline وpost-assessment؛
- teacher workload، learner retention، safety incidents وcost؛
- لا توسع قبل تقرير pilot وقرار go/no-go.

### Content/brand strategy

- سلسلة «ليه الإجابة دي موثوقة؟»؛
- «غلط مشهور» يعرض misconception وليس تنمرًا؛
- «من العربي للإنجليزي» للمصطلحات؛
- «حل بدون فَهيم» لإثبات الاستقلال لا الاعتماد؛
- تقرير سنوي شفاف عن جودة المصادر والأخطاء المصححة.

## 12. القياس

### North Star

**Weekly Verified Mastery Loops per Active Learner**

الحلقة تُحسب فقط إذا حدث:

1. exposure لدليل/شرح؛
2. محاولة فعلية؛
3. feedback؛
4. delayed or transfer check؛
5. mastery state update.

### Funnel

- Visit → diagnostic start؛
- diagnostic start → first completed loop؛
- first loop → review scheduled؛
- review scheduled → D7 return؛
- D7 → 3 weekly loops؛
- free limit reached → paid intent؛
- checkout → retained paid month 2.

### Quality and safety

- claim support rate؛
- citation-open and citation-validity rate؛
- unsupported answer reports؛
- hint-to-independent-solution ratio؛
- teacher override rate؛
- assessment item rejection rate؛
- PII/safety incident rate؛
- Arabic dialect/terminology correction rate؛
- cost and latency per completed loop.

### لا نستخدم كمؤشر نجاح

- عدد رسائل الشات وحده؛
- الوقت داخل التطبيق دون محاولة؛
- streaks مصممة للذنب؛
- عدد الشهادات دون evidence؛
- page views دون تعلم.

## 13. البنية التقنية المستهدفة

### قرار معماري

لا نعيد كتابة المنتج دفعة واحدة. نثبت data contracts أولًا، ثم ننقل route-by-route إلى Next.js App Router إن كان SSR/SEO والمؤسسات أولوية مؤكدة.

```text
Web / PWA (Next.js تدريجيًا)
  ├─ Learner app
  ├─ Teacher studio
  ├─ Admin/content operations
  └─ Public evidence/credential pages

API / Edge boundary
  ├─ Auth + authorization
  ├─ AI gateway + prompt registry + evaluations
  ├─ Search federation + curriculum graph
  ├─ Assessment service
  ├─ Billing/entitlements
  └─ Webhooks/integrations

Supabase/Postgres
  ├─ canonical relational schema + RLS
  ├─ pgvector + source chunks
  ├─ storage buckets + signed URLs
  ├─ realtime classroom events
  └─ audit/retention/consent records

Durable infrastructure
  ├─ distributed rate limit
  ├─ job queue for OCR/indexing/exports
  ├─ telemetry/traces/errors
  ├─ backup/restore
  └─ feature flags and staged rollouts
```

### معايير التكامل

- LTI 1.3/LTI Advantage عند دخول المؤسسات: roster/roles، assignments/grades وdeep linking. [1EdTech LTI](https://www.1edtech.org/standards/lti)
- Open Badges 3.0 وW3C Verifiable Credentials للشهادات القابلة للتحقق.
- WCAG 2.2 AA كحد أدنى. [W3C WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/)

## 14. الأمن والخصوصية والحوكمة

- قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 موجود ويستلزم مراجعة قانونية تطبيقية، لا checkbox. [الهيئة العامة للاستعلامات](https://sis.gov.eg/ar/الرئاسة/شئون-داخلية/القرارات-الرئاسية/الرئيس-السيسىي-ي-صد-ق-على-قانون-حماية-البيانات-الشخصية/)
- UNESCO توصي بحماية الخصوصية، ملاءمة العمر، والإبقاء على الإنسان في مركز التعليم؛ وتذكر حدًا أدنى مقترحًا للاستخدام المستقل. [UNESCO GenAI Guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
- في التوسع الأوروبي، أنظمة AI التي تقيم نتائج التعلم أو تؤثر ماديًا في المسار قد تقع ضمن high-risk؛ لذلك نفصل coaching عن high-stakes decisions ونحتفظ بإشراف بشري. [EU AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689)

متطلبات P0:

1. consent ledger وpolicy versions؛
2. data inventory وretention schedule؛
3. export/delete/DSAR workflows؛
4. guardian consent حسب العمر والسوق؛
5. encryption وsigned URLs؛
6. distributed abuse/rate limiting؛
7. prompt injection tests للملفات؛
8. content safety + human escalation؛
9. audit events لا تحتوي نصوصًا حساسة افتراضيًا؛
10. incident response وbreach communication playbook.

## 15. خارطة التنفيذ الدقيقة

### Release A — Truthful Foundation (أسبوعان)

- حسم canonical schema وحذف/دمج migrations المتعارضة عبر migration جديدة آمنة؛
- generated database types؛
- environment validation؛
- distributed rate limiting؛
- error tracking، structured logs وrequest traces؛
- product events dictionary؛
- feature flags حقيقية؛
- staging منفصل وbackup/restore drill؛
- privacy/terms/consent UI؛
- توحيد design tokens وبقايا violet/legacy pages.

**Exit:** قاعدة جديدة تُبنى من الصفر، وقاعدة snapshot تهاجر دون فقد، وكل API له auth/rate/error telemetry.

### Release B — Cloud Learning Memory (3–4 أسابيع)

- مزامنة progress، review cards، notes، bookmarks وprojects؛
- conflict resolution local-first؛
- device/session management؛
- knowledge state وprerequisite edges؛
- today queue موحدة؛
- offline read/review queue وsync status؛
- import/export JSON/Markdown.

**Exit:** المستخدم يبدأ على جهاز ويكمل على آخر، ويستعيد بياناته ويحذفها.

### Release C — Curriculum Evidence Engine (4–6 أسابيع)

- source registry بمالك، ترخيص، عام دراسي، مادة، صف، وحدة، review status؛
- storage + OCR queue + page anchors؛
- pgvector/hybrid retrieval + reranking؛
- claim-level citations؛
- contradiction and stale-source flags؛
- curriculum/exam drift workflow؛
- Arabic evaluation dataset وcitation benchmark؛
- content curator console.

**Exit:** 85%+ citation validity على evaluation set المحدد و100% من المحتوى المنهجي له version/reviewer.

### Release D — Adaptive Learning Engine (4–6 أسابيع)

- diagnostic pre-check؛
- worked-example → completion → independent flow؛
- hint ladder؛
- misconception taxonomy؛
- calibrated question bank؛
- spaced/interleaved scheduler based on concept evidence؛
- transfer checks؛
- learner-facing mastery map وconfidence calibration؛
- automatic cards only from cited material.

**Exit:** تحسن measurable بين first attempt وdelayed check، وليس satisfaction فقط.

### Release E — Teacher/Classroom Product (6–8 أسابيع)

- organizations، classes، membership، join approval؛
- assignments، submissions، attachments، status and deadlines؛
- rubric builder/versioning؛
- AI draft → teacher approve workflow؛
- gradebook، comments، resubmission؛
- misconception heatmap؛
- privacy-safe guardian digest؛
- moderation/reports؛
- CSV أولًا ثم LTI 1.3.

**Exit:** مدرس يدير فصلًا كاملًا من حسابين/أجهزة حقيقية وتظل كل الصلاحيات صحيحة تحت RLS tests.

### Release F — Projects and Credentials (4–6 أسابيع)

- project briefs، milestones، evidence uploads وversion history؛
- peer review مضبوط + teacher review؛
- plagiarism/citation policy؛
- public portfolio بإذن؛
- assessor identity وappeals؛
- Open Badges 3.0 signed credential؛
- public verification/revocation endpoint؛
- partner endorsement pilot.

**Exit:** credential يمكن التحقق من issuer، criteria، evidence، signature وrevocation.

### Release G — Commerce and Operations (3–5 أسابيع)

- plans، entitlements، quotas وgrace periods؛
- Paymob checkout/webhooks؛
- idempotency، invoice/receipt، refunds وfailed payment recovery؛
- promo/scholarship codes؛
- school contracts and seat billing؛
- support inbox، status page، runbooks وadmin audit؛
- cost budgets/model routing.

**Exit:** test payment إلى entitlement إلى cancellation/refund يعمل end-to-end ولا يمنح صلاحية من client state.

### Release H — Reliability and Global Readiness (مستمر)

- SLOs: availability، AI success، search success، p95 latency؛
- synthetic checks وprovider failover؛
- load/soak/chaos tests على staging؛
- accessibility manual audit؛
- SEO/structured data؛
- localization framework لا strings مبعثرة؛
- regional curriculum packs؛
- data residency and compliance review لكل سوق.

## 16. الأولويات التنفيذية للرسالة القادمة

ابدأ بهذا الترتيب؛ لا تبدأ بالشهادات أو animations:

1. canonical database migration + typed repository layer؛
2. sync review/progress/notes/projects مع local-first fallback؛
3. organizations/classes/assignments/submissions الحقيقية؛
4. source registry + curriculum versioning؛
5. storage/OCR/hybrid RAG؛
6. learning evidence + misconception schema؛
7. today queue وadaptive flow؛
8. distributed rate limit + observability؛
9. payments/entitlements؛
10. credential issuance بعد partner/evaluator workflow.

## 17. خطة البحث والتحقق قبل التوسع

### 20 مقابلة خلال أسبوعين

- 8 طلاب ثانوي؛
- 4 طلاب جامعة؛
- 4 مدرسين؛
- 2 أولياء أمور؛
- 2 مسؤولي مدارس.

أسئلة سلوكية عن آخر مرة حدثت المشكلة، لا «هل تعجبك الفكرة؟».

### Usability tests

مهام:

1. ارفع فصل PDF واسأل سؤالًا وتحقق من الدليل؛
2. ابدأ من سؤال وانته بمراجعة مجدولة؛
3. مدرس ينشئ assignment ويستلم محاولة؛
4. طالب يفهم ما الذي يراه ولي الأمر؛
5. مستخدم يحذف ملفه وبياناته.

معايير النجاح:

- 80% task completion دون مساعدة؛
- أقل من 2 critical navigation errors لكل جلسة؛
- فهم صحيح لحالة المصدر لدى 90%؛
- لا يعتقد أكثر من 5% أن شهادة الإتمام اعتماد رسمي.

### Business experiments

- pricing Van Westendorp + checkout intent، لا survey واحد؛
- free limit 3 مقابل 5 loops؛
- annual vs monthly؛
- teacher-led invite vs direct student acquisition؛
- diagnostic report كـactivation hook؛
- paid pilot vs free pilot للمؤسسات.

## 18. المخاطر وقرارات الإيقاف

| الخطر | المؤشر المبكر | التخفيف / قرار الإيقاف |
|---|---|---|
| AI يعطي إجابات بدل تعليم | ارتفاع copy/answer reveal وانخفاض transfer score | hint ladder وإخفاء الحل الكامل حسب النشاط |
| curriculum غير محدث | تقارير stale source أو تعارض مدرسين | versioning ومراجع بشري؛ إيقاف الوحدة إن لم تُراجع |
| تكلفة AI | cost/loop يتجاوز 15% من revenue | routing/caching/limits؛ إيقاف الميزات عالية التكلفة المجانية |
| ضعف retention | D7 أقل من 15% بعد 3 cohorts | أصلح today/review loop قبل شراء نمو |
| المدرسة لا تستخدم dashboard | teacher WAU أقل من 40% | تقليل التقارير وزيادة decision-oriented workflow |
| قلق الخصوصية | انخفاض رفع الملفات أو شكاوى أولياء الأمور | local-first، شفافية، consent، private-by-default |
| حقوق محتوى | takedowns أو مصادر بلا ترخيص | registry للحقوق؛ metadata/linking حتى الترخيص |
| اعتماد وهمي | المستخدم يسيء فهم الشهادة | فصل completion عن verified credential وإظهار issuer/criteria |
| توسع مبكر | تخصيصات مؤسسة تبتلع roadmap | لا custom feature دون reusable product primitive |

## 19. الفريق الأدنى المطلوب

- Product/learning lead؛
- Senior full-stack/platform engineer؛
- AI/RAG/evaluation engineer؛
- Product designer + UX researcher؛
- Curriculum lead لكل vertical أولي؛
- Teacher success/content operations؛
- Security/privacy part-time ثم full-time قبل المؤسسات؛
- Sales/partnerships بعد ثبوت learner retention.

لا يمكن للكود وحده تعويض curriculum review، support، sales أو governance.

## 20. قرار المنتج النهائي

### ما نبنيه

منصة تفهم **رحلة المفهوم** لا مجرد جلسة الشات: مصدر → شرح → محاولة → خطأ → تدخل → استدعاء → تطبيق → دليل.

### ما لا نبنيه الآن

- marketplace مفتوح للمدرسين؛
- social feed عام؛
- proctoring آلي عالي المخاطر؛
- شهادة «معتمدة» ذاتيًا؛
- نسخ كامل لمحتوى Coursera/Udemy/Nagwa؛
- avatar أو metaverse قبل ثبوت الأثر؛
- عشرات مولدات المحتوى التي لا تغير mastery.

### الـMoat الحقيقي

1. curriculum + source graph مصري/عربي مراجع؛
2. bilingual concept and misconception graph؛
3. longitudinal evidence of learning؛
4. teacher corrections feeding evaluations؛
5. privacy/trust architecture؛
6. institutional integrations and verifiable credentials؛
7. outcome data الذي يثبت أي تدخل يساعد أي متعلم.

هذه الخطة هي مواصفة القرار للمرحلة التنفيذية التالية. أي تطوير قادم يجب أن يرتبط بPersona، وJTBD، ومقياس، وشرط قبول، ومصدر بيانات سلطوي؛ وإلا فهو feature ضوضائية لا تقرب فَهيم من منصة عالمية.
