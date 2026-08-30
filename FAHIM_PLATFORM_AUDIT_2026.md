# التقرير الشامل لتقييم منصة فَهيم

**تقييم تقني، مهني، تعليمي، تجاري، أثري، وتشغيلي**  
**تاريخ المراجعة:** 14 أغسطس 2026  
**الإصدار الذي تمت مراجعته:** مستودع العمل الحالي والنسخة المنشورة على `fahim-ai-egypt.vercel.app`  
**حالة التقرير:** تدقيق مبني على الكود والـmigrations والاختبارات وملفات البناء ونتائج التحقق من النشر، مع مقارنة سوقية من مصادر أولية أو رسمية حديثة.

---

## 1. الملخص التنفيذي

### الحكم المختصر

فَهيم حاليًا **منتج تعليمي رقمي متقدم وقابل للاستخدام**، وليس مجرد تصميم أو عرض تجريبي. لديه هوية بصرية واضحة، تجربة ثنائية اللغة، مساعد تعليمي متدفق، بحث متعدد المصادر، اختبارات مؤمنة، خزانة معرفة محلية، مراجعة متباعدة، فيديو مدمج، تجربة مجانية فعلية، مصادقة، إدارة، دعم، ومدفوعات يدوية موثقة.

لكن المنصة لم تصل بعد إلى مستوى Coursera أو Khan Academy أو NotebookLM من حيث **عمق المحتوى الموثق، التشغيل متعدد الأجهزة، أدوات المؤسسات، القياس طويل المدى، الامتثال، والمصداقية المبنية على نتائج تعلم حقيقية**. اتساع المنتج سبق عمق التشغيل في بعض المساحات: توجد جداول قاعدة بيانات ومسارات واجهة لخصائص مؤسسية متقدمة، بينما التنفيذ اليومي لبعضها ما يزال محليًا داخل المتصفح.

### التقييم العام

| المحور | الدرجة | الحكم |
|---|---:|---|
| جودة تجربة المنتج والهوية | **8.5/10** | قوية، مميزة، عربية الأصل، ومتجاوبة |
| التصميم التعليمي وعلوم التعلم | **7.4/10** | أساس جيد جدًا؛ يحتاج قياس نتائج وضبط خوارزمي |
| الذكاء الاصطناعي والبحث | **7.8/10** | قوي وظيفيًا مع failover وأدلة؛ البحث الدلالي الكامل غير مكتمل |
| المحتوى وRAG والمناهج | **5.8/10** | رفع محلي مفيد؛ لا توجد بعد سلسلة OCR/Hybrid RAG معتمدة سحابيًا |
| البيانات والمنصة الخلفية | **6.4/10** | schema غني وRLS قوي؛ مزامنة دورة التعلم غير مكتملة |
| الأمن والخصوصية | **7.2/10** | ضوابط تقنية جيدة؛ الامتثال القانوني والاختبار الحي يحتاجان إغلاقًا |
| الاعتمادية والتشغيل | **6.3/10** | نشر واختبارات وصحة جيدة؛ المراقبة وDR واختبار الأحمال غير مثبتة |
| الأداء وإمكانية الوصول وSEO | **7.1/10** | code splitting وPWA وSEO أساسي؛ لا توجد قياسات ميدانية أو axe CI |
| المعلم والفصول والمؤسسات | **4.9/10** | نموذج البيانات موجود؛ التجربة المؤسسية نفسها ما تزال pilot محليًا |
| الجاهزية التجارية والربحية | **5.7/10** | تسعير جذاب ومسار تحصيل؛ economics والتجديد والفوترة غير مثبتة |
| الأثر وأدلة أهداف التنمية | **3.9/10** | نظرية أثر قوية محتملة؛ لا توجد نتائج تعلم مستقلة مقاسة بعد |
| **الدرجة العالمية الموزونة** | **6.7/10** | **منتج واعد قوي، لكنه في مرحلة ما قبل التوسع المؤسسي** |

### كيف تُقرأ درجة 6.7؟

- لا تعني أن المنتج ضعيف؛ بل تعني أن **واجهة وتجربة المنتج أقوى من أدلة التشغيل والأثر التجاري**.
- يمكن إطلاقه لمستخدمين حقيقيين في cohort محدود مع مراقبة ودعم بشري.
- لا ينبغي بعد توقيع عقود مدارس واسعة، ادعاء اعتماد شهادات، أو وعد بنتائج تعلم قبل إكمال بوابات الجاهزية المذكورة في هذا التقرير.
- أسرع طريق إلى 8.5 عالميًا ليس إضافة عشرين شاشة أخرى، بل إغلاق خمس فجوات: المزامنة السحابية، RAG المعتمد، تشغيل الفصول، القياس/المراقبة، وإثبات الأثر.

---

## 2. نطاق ومنهجية التقييم

اعتمد التدقيق على خمس طبقات من الأدلة:

1. **دليل الكود:** البنية، الصفحات، الـAPIs، إدارة الحالة، التخزين، الأمن، ومكونات المنتج.
2. **دليل قاعدة البيانات:** migrations، RLS، الدوال، الأدوار، entitlements، سجلات التدقيق، والفهارس.
3. **دليل الجودة:** typecheck، lint، الاختبارات، build الإنتاجي، فحص الأسرار، وفحص npm.
4. **دليل النشر:** حالة النسخة المنشورة، health endpoint، واختبارات smoke والواجهات التي أُجريت في دورة النشر الحالية.
5. **دليل السوق والأثر:** وزارة التربية والتعليم، CAPMAS، ITU، الأمم المتحدة، UNESCO، NIST، 1EdTech، والمصادر الرسمية للمنافسين.

### حدود التقرير

- لا توجد بيانات فعلية متاحة عن MAU أو retention أو إيراد محقق أو تكلفة ذكاء اصطناعي لكل مستخدم؛ لذلك قسم الربحية **نموذج تخطيطي** وليس بيانًا ماليًا.
- لا توجد دراسة تعلم baseline/post-test تخص مستخدمي فَهيم؛ لذلك لا يدّعي التقرير أثرًا سببيًا.
- لم تتوفر أداة Chrome DevTools trace في بيئة التدقيق، ولم يُسمح بتنزيل أداة متصفح مؤقتة بسبب قيد رصيد بيئة العمل. لذلك لم يتم اختلاق درجة Lighthouse، واعتمد تقييم الأداء على البناء والحزم والكاش والتحقق السابق للنشر.
- اختبارات RLS الحالية تفحص نصوص migrations والعقود الأمنية بدرجة جيدة، لكنها ليست بديلًا كاملًا عن مصفوفة تكامل حية ضد قاعدة staging بأدوار متعددة.

---

## 3. جرد المنتج الحالي بالأرقام

### حجم التطبيق

| المؤشر | القيمة الحالية |
|---|---:|
| ملفات TypeScript/TSX/MJS/SQL | 130 |
| أسطر الكود التقريبية | 17,394 |
| مكونات الصفحات | 32 |
| handlers وmodules داخل `api` | 17: منها 10 endpoints و7 وحدات مشتركة |
| ملفات الاختبار | 16 |
| الاختبارات الناجحة | 58/58 |
| ملفات migrations النشطة في المسار | 17 |
| تعريفات الجداول الفريدة في migrations | 57 |
| تعريفات سياسات RLS | 111 |
| دوال قاعدة البيانات | 23 |
| فهارس قاعدة البيانات | 39 |
| المسارات التعليمية الجاهزة في الكتالوج | 9 |
| الوحدات | 35 |
| الدروس | 71 |
| المصادر الرسمية في السجل المحلي | 8 |

### نتيجة بوابة الجودة الحالية

تم تشغيل `npm run check` بنجاح، وشمل:

- TypeScript بدون أخطاء.
- ESLint بدون إخفاق.
- **16 ملف اختبار و58 اختبارًا ناجحًا**.
- بناء Vite إنتاجي ناجح بعد تحويل 2,285 module.
- فحص أمني داخلي ناجح لـ145 ملفًا، دون source maps إنتاجية.
- `npm audit --omit=dev` أعاد **0 ثغرات معروفة**.

### ما هو موجود فعليًا الآن؟

#### تجربة عامة وهوية

- صفحة رئيسية، طريقة العمل، الأسعار، About، المصادر، الكورسات، والتحقق من الشهادة.
- هوية «أطلس المعرفة» بألوان navy/teal/saffron/coral وخط Cairo محلي.
- عربي/إنجليزي، RTL/LTR، light/dark/system mode، reduced motion، responsive layouts.
- شعار وأيقونات وsocial card وfounder imagery داخل المنتج.
- PWA قابلة للتثبيت مع service worker وmanifest وoffline shell للصفحات العامة.

#### رحلة الطالب

- تسجيل/دخول/نسيان وتغيير كلمة المرور وOAuth حسب إعداد Supabase.
- onboarding واضح يبدأ تجربة كاملة لمدة 30 يومًا.
- dashboard، profile، courses، workspace، quiz lab، knowledge vault، review، video learning، AI tutor، support.
- حصة entitlement فعلية للذكاء الاصطناعي، مع خصم ذري ورد الحصة عند فشل المزود.

#### الذكاء الاصطناعي

- Agent Router وGemini بترتيب قابل للضبط وfailover بين المزودين والنماذج الاحتياطية.
- streaming، deadlines، usage tracking، cost hooks، وتخزين generations.
- prompt تعليمي سقراطي، modes للشرح والخطة والاختبار والبطاقات والتلخيص والمشروع.
- تصنيف ادعاءات: مصدر موثق، استنتاج، شرح تعليمي، معرفة عامة، يحتاج مراجعة.
- citation context من Wikipedia والمصادر المصرية ومقتطفات المستخدم.
- عدم عرض اسم النموذج أو البنية الداخلية للمستخدم.

#### البحث

- بحث موحد عبر سجل المصادر المصري، Wikimedia، OpenAlex، وCrossref.
- ranking يجمع تطابق الكلمات، حداثة المصدر، عدد الاستشهادات، ونوع السلطة.
- Wikipedia أصبحت قناة ضمن محرك متعدد المصادر، وليست المصدر الوحيد.
- filtering وعرض learning score وmetadata.

#### الاختبارات والتعلم

- توليد اختبار متكيف متعدد الأنماط.
- الإجابات الصحيحة لا تُرسل مكشوفة؛ تُغلق بتوكن AES-GCM ثم تُصحح على الخادم.
- تتبع mastery ومحاولات وخطأ وتفسير.
- spaced review موجود وخوارزميته مختبرة.
- كتالوج حقيقي من 9 مسارات و71 درسًا، لا placeholders.

#### الفيديو

- YouTube Data API والبحث والفيديو داخل المنصة.
- IFrame Player، سرعة، captions حيث تتوفر، fullscreen، mini-player، progress، notes، timestamps، وask-at-timestamp.
- لا يتم تحويل المستخدم إلى YouTube بوصفه الرحلة الأساسية.

#### الإدارة والتشغيل البشري

- لوحة admin للأدوار والمستخدمين والمدفوعات والمحتوى والفيديوهات والمصادر والدعم.
- رفع إثبات الدفع، queue للمراجعة، قبول/رفض/إعادة تقديم، وسجل أحداث غير قابل للتعديل من العميل.
- تذاكر دعم ورسائل بين المستخدم والإدارة.
- رفع فيديوهات حصرية ومصادر تعليمية مُدارة عبر Supabase Storage.

---

## 4. مصفوفة الحقيقة: مكتمل، جزئي، وما يزال قيد البناء

| القدرة | الحالة | الدليل | ما ينقص للوصول العالمي |
|---|---|---|---|
| الهوية والواجهات الأساسية | مكتمل جيدًا | design system وصفحات متجاوبة | اختبار استعمال منهجي وتحسين الاتساق الباقي |
| المصادقة والجلسات | مكتمل تقنيًا | PKCE، refresh، recovery من JWT expired | اختبار حي لكل OAuth وسياسات lifecycle للحساب |
| تجربة 30 يومًا | مكتمل | onboarding RPC وentitlements | مكافحة إساءة الاستخدام وتحليل conversion |
| AI streaming/failover | مكتمل وظيفيًا | مساران للمزودين، retries، deadlines | evals، quality SLO، content safety مخصص للأعمار |
| البحث المتعدد | مكتمل جزئيًا | 4 مزودين وranking heuristic | embeddings، reranker، deduplication، query expansion |
| claim-level evidence | جزئي | prompt وlabels وcitation UI | verifier آلي، coverage score، entailment checks |
| رفع الملفات وRAG | جزئي | PDF/text محلي وIndexedDB | OCR، cloud ingestion، vector index، source ACL/versioning |
| المراجعة المتباعدة | جزئي | algorithm + UI + tests | مزامنة خادم، notification scheduler، calibration بالبيانات |
| التقدم والإتقان | جزئي | local progress + schema | event model موحد، cross-device sync، server truth |
| الفصول والتكليفات | pilot | واجهة محلية + schema سحابي | roster، invitations، submissions، grading، realtime |
| مراجعة المشاريع | pilot | rubrics وAI handoff محلي | رفع نسخ، reviewer workflow، moderation، provenance |
| الشهادات | تحقق جزئي | verifier + schema | إصدار خادمي موقع، Open Badges 3.0، شريك واعتماد |
| المدفوعات اليدوية | مكتمل تشغيليًا لمرحلة صغيرة | proof/review/audit/RLS | SLA، reconciliation، refunds، invoice، fraud tooling |
| Stripe/Paymob | معطل عمدًا | handlers/migrations تاريخية | إزالة أو عزل الدين القديم؛ قرار provider لاحقًا |
| PWA | مكتمل أساسيًا | manifest + SW + install page | background sync، push، offline learning data |
| تطبيق native | غير موجود | PWA فقط | لا يلزم قبل إثبات الحاجة؛ Capacitor/React Native لاحقًا |
| التحليلات | جزئي | web-vitals endpoint وDB permissions | product analytics، funnels، cohorts، privacy-safe events |
| مراقبة الإنتاج | جزئي | health/logging/request IDs | alerting، traces، error tracker، dashboards، runbooks |
| اختبار الأحمال | غير مثبت | script موجود | baseline، stress/soak، capacity model، failover drill |
| النسخ الاحتياطي وDR | غير مثبت | لا يوجد restore report | PITR policy، restore rehearsal، RPO/RTO موثق |
| الامتثال وحوكمة الأطفال | غير مكتمل | ضوابط تقنية فقط | privacy/terms/consent/DPO/retention/age policy |

---

## 5. التقييم التقني التفصيلي

### 5.1 المعمارية الحالية

المعمارية الفعلية هي:

```text
React 18 + TypeScript + Vite SPA
        │
        ├── Vercel Static/CDN + Serverless API handlers
        ├── Supabase Auth / Postgres / RLS / Storage
        ├── Agent Router + Gemini failover
        ├── YouTube Data API / IFrame Player
        └── Wikipedia + OpenAlex + Crossref + verified registry
```

#### نقاط القوة

- فصل جيد بين واجهة العميل وAPI server-side للأسرار والـAI.
- lazy loading للصفحات وcode splitting واضح.
- Supabase مناسب لسرعة البناء، auth، RLS، realtime، والتخزين.
- Vercel مناسب للـedge delivery والـserverless burst في المرحلة الحالية.
- migrations باتجاه canonical model، مع عزل migration متداخل قديم داخل `legacy_migrations`.
- API helpers مشتركة للأمن والمصادقة وتوجيه الذكاء الاصطناعي.

#### الفجوات

1. **ليست Next.js App Router** رغم أن المتطلبات الأصلية نصت عليه؛ لا توجد Server Components أو Server Actions أو SSR حقيقي.
2. Vite SPA مناسب لتطبيق مسجل الدخول، لكنه أضعف من SSR/SSG في فهرسة صفحات الكورسات والتسويق ووقت أول محتوى على أجهزة ضعيفة.
3. لا يوجد ملف database types مولد من Supabase؛ هذا يزيد احتمال drift بين TypeScript وPostgres.
4. لا توجد بنية Git في نسخة workspace الحالية ولا `.github` workflows؛ لا يمكن من هذه النسخة إثبات code review أو branch protection أو CI/CD governance.
5. لا توجد اختبارات E2E بـPlaywright/Cypress في المستودع.

#### القرار المعماري المقترح

لا أوصي بإعادة كتابة عمياء. القرار الصحيح خلال Gate تقني هو:

- إبقاء تطبيق التعلم الحالي كـSPA مؤقتًا لتجنب كسر الرحلات.
- نقل الواجهة العامة، catalog، course landing، About، pricing، وSEO إلى Next.js App Router تدريجيًا.
- إبقاء Supabase وطبقة الخدمات الحالية، ثم نقل APIs عالية القيمة إلى route handlers typed عند الحاجة.
- نجاح هذه الهجرة يُقاس بتحسن crawlability وLCP ومعدل التحويل، لا بمجرد تغيير اسم framework.

### 5.2 البيانات والمزامنة

الـschema قوي من حيث الرؤية: profiles، roles، permissions، courses، lessons، progress، conversations، quizzes، review items، evidence، misconceptions، organizations، classes، assignments، submissions، projects، certificates، payments، support، notifications، audit logs.

المشكلة ليست نقص الجداول؛ المشكلة أن مصادر الحقيقة متعددة:

- `videoProgress`, `studyProgress`, `spacedReview`, `mastery`, `courseProgress`, `creatorStudio`, و`conversations` تستخدم localStorage كليًا أو جزئيًا.
- Knowledge Vault تستخدم IndexedDB وتتعمد إبقاء الملفات داخل الجهاز.
- schema السحابي للفصول والمشروعات والمراجعات أغنى من الاتصال الفعلي للواجهة به.

هذا يؤدي إلى خمسة مخاطر:

1. فقدان التقدم عند تغيير الجهاز أو تنظيف المتصفح.
2. dashboard لا يمثل دائمًا حقيقة موحدة.
3. لا يمكن للمعلم أو المؤسسة الاعتماد على تقارير قابلة للتدقيق.
4. لا يمكن إصدار شهادة موثقة اعتمادًا على بيانات محلية.
5. يصعب قياس أثر التعلم والـretention الحقيقي.

#### المطلوب

- تعريف canonical learning event schema: `source_viewed`, `attempted`, `hint_requested`, `misconception_detected`, `reviewed`, `applied`, `mastered`.
- outbox محلي مشفر + idempotency key + sync cursor.
- تعارضات واضحة: server timestamp + version أو CRDT فقط حيث يلزم.
- server truth للشهادات والإتقان والمدفوعات؛ local cache لتحسين السرعة فقط.
- توليد `database.types.ts` في CI بعد كل migration.

### 5.3 الذكاء الاصطناعي

#### ما هو قوي

- تعدد مزودين يقلل single-provider outage.
- timeout وdeadline budget وrefund للحصة عند الفشل.
- prompt يرفض كشف الأسرار أو اختلاق الشهادات والمصادر.
- tutor modes ليست مجرد تغيير نص؛ لكل وضع عقد تعليمي مختلف.
- معالجة citation context وgeneration persistence واستهلاك tokens.
- quiz security أفضل بوضوح من إرسال الإجابة الصحيحة في JSON.

#### ما ينقص

- لا توجد مجموعة evals عربية مصرية versioned تقيس: factuality، citation precision، pedagogical appropriateness، jailbreak، dialect/RTL، ومستوى الصف.
- لا يوجد automated claim verifier يفحص هل المقتطف يدعم الادعاء فعلًا.
- لا توجد moderation policy مفصلة حسب العمر أو سياسة self-harm/abuse/sexual content مخصصة للتعليم.
- لا توجد red-team suite لمناهج المدرسة أو محاولات الغش والواجبات المقيمة.
- تكلفة كل دورة تعلم غير مرئية إداريًا كـunit economics، رغم وجود hooks لتسجيل token/cost.
- مفتاح مزود تجريبي سبق مشاركته نصيًا أثناء التطوير؛ يجب اعتباره معرضًا والاستبدال بهدوء دون إظهار قيمته في أي سجل أو تقرير.

#### بوابة الجودة المطلوبة

قبل التوسع: 500–1,000 سيناريو eval بالعربية والإنجليزية، مع حدود قبول مثل:

- citation precision ≥ 95% على مجموعة golden.
- unsupported material claim rate < 2%.
- direct-answer leakage في quiz mode < 1%.
- age-inappropriate response critical failures = 0.
- p95 first-token latency وcompletion success SLO موثق.

### 5.4 البحث وRAG

محرك البحث الحالي أفضل من «بحث Wikipedia»: هو federated search متعدد المزودين. لكنه **ليس semantic search كاملًا** حتى الآن؛ learning score الحالي heuristic يعتمد على tokens والحداثة والاستشهادات.

#### التطوير الصحيح

1. query normalization عربي: همزات، تشكيل، ياء/ألف مقصورة، مرادفات، وترجمة مصطلح ثنائية اللغة.
2. sparse retrieval بـBM25/tsvector.
3. dense embeddings متعدد اللغة محفوظ في pgvector أو vector store مناسب.
4. reciprocal rank fusion بين sparse/dense/official registry.
5. cross-encoder reranking لأعلى 30 نتيجة.
6. deduplication للـDOI والنسخ المتكررة.
7. source authority policy حسب نوع السؤال؛ المصادر الرسمية للمناهج والقرارات تتقدم على الموسوعات.
8. freshness monitor و`verified_at`, `valid_from`, `valid_to`, `curriculum_year`.
9. answer verifier يربط كل claim بالـchunk والصفحة والإصدار.

#### RAG للملفات

المعالجة المحلية الحالية ممتازة كميزة خصوصية، لكنها لا تدعم PDF مصورًا أو OCR أو المزامنة. الحل العالمي يجب أن يقدم مسارين واضحين:

- **Private Local Mode:** كما هو الآن، بلا رفع، مع شرح الحدود.
- **Cloud Verified Mode:** رفع مشفر، malware scan، OCR عربي، layout parsing، chunking، embedding، ACL، retention controls، وحذف كامل.

### 5.5 الأداء

#### ما تم إثباته

- route-level lazy loading.
- assets hashed ومخزنة سنة بصيغة immutable.
- لا توجد source maps في الإنتاج.
- main bundle حوالي 397KB خام / 124KB gzip.
- RichMessage حوالي 434KB خام / 130KB gzip ويُحمل كchunk مستقل.
- PDF parser حوالي 399KB وworker حوالي 1.05MB ويُحمل عند الحاجة.
- الخطوط محلية، والعربي الأساسي preloaded.
- service worker يتجنب cache للـAPI وAuthorization والبيانات الخاصة.

#### المخاطر

- KaTeX يشحن عددًا كبيرًا من ملفات الخطوط؛ يلزم التأكد من تحميل المطلوب فقط.
- rich markdown/code/math chunk كبير نسبيًا.
- لا توجد RUM dashboard فعلية رغم إرسال web-vitals إلى logs.
- لا توجد أرقام LCP/INP/CLS ميدانية يمكن الدفاع عنها، وبالتالي هدف Lighthouse 100 غير مثبت.

#### الأولوية

- إرسال Web Vitals إلى store زمني لا console فقط.
- budgets في CI: initial JS gzip، CSS، fonts، page chunks.
- Lighthouse CI لصفحات `/`, `/pricing`, `/courses`, `/login` على mobile throttling.
- virtualization لسجل محادثات طويل، نتائج بحث طويلة، وقوائم الإدارة.

### 5.6 SEO

الموجود جيد كأساس: canonical، OG، Twitter cards، JSON-LD، sitemap، robots، وmetadata ديناميكية على العميل.

الفجوة: كل المسارات تُعاد إلى `index.html`، ولذلك crawlers غير المنفذة لـJS سترى metadata العامة. صفحات كل كورس لا تمتلك HTML server-rendered وstructured data خاصًا بها. كما لا توجد صفحات عامة واضحة للخصوصية والشروط رغم أهميتهما للثقة والامتثال.

### 5.7 إمكانية الوصول

#### نقاط القوة

- semantic labels وARIA في مناطق كثيرة.
- focus-visible واضح.
- reduced-motion عالمي.
- RTL/LTR ودعم لغة ثنائي.
- keyboard-accessible controls في المكونات الأساسية.
- contrast system أكثر اتساقًا بعد إعادة التصميم.

#### الفجوات

- لا توجد axe/pa11y CI.
- لا توجد VPAT أو accessibility statement.
- يلزم فحص قارئ شاشة فعلي لنوافذ dialog، streaming announcements، مشغل الفيديو، وجداول markdown.
- يلزم اختبار 200% zoom، high contrast، switch control، وkeyboard-only لجميع flows.

---

## 6. الأمن والخصوصية والامتثال

### ما تم تنفيذه بصورة جيدة

- Supabase RLS وسياسات owner/admin/permission.
- PKCE، session persistence، auto refresh، وretry مرة واحدة عند JWT expiry.
- server-side JWT validation للـAPIs الحساسة.
- CSRF/same-origin checks، JSON content type، body size limits، وrate limiting موزع مع fallback.
- CSP، HSTS، frame denial، no-sniff، referrer policy، permissions policy.
- quiz answer sealing، private storage buckets، signed URLs عند الحاجة.
- audit logs للـonboarding والمدفوعات وعمليات حساسة.
- service role محجوب عن العميل.

### المخاطر ذات الأولوية

| المخاطرة | الشدة | الإجراء |
|---|---|---|
| مفتاح AI تجريبي سبق كشفه نصيًا | حرج | rotation فوري، إلغاء القديم، وفحص logs/history |
| RLS tests ليست role-matrix حية | عالٍ | اختبارات staging لـanon/student/teacher/admin/cross-tenant |
| لا توجد privacy/terms/children policy عامة | عالٍ | نشر مستندات قانونية وموافقة ولي الأمر حيث يلزم |
| لا توجد DPO/retention/data map موثقة | عالٍ | data inventory، purpose، retention، processor register |
| بيانات تقدم محلية بلا sync/backup | متوسط | outbox مشفر ومزامنة وحذف قابل للتدقيق |
| codebase يحوي Stripe/Paymob تاريخيًا رغم تعطيلهما | متوسط | إزالة dead surface أو عزله في archive موثق |
| لا توجد SAST/DAST/SBOM وCI مثبتة | متوسط | dependency review، CodeQL/Semgrep، SBOM وإصدارات موقعة |

### الالتزام المصري

قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 ينظم معالجة البيانات الإلكترونية، واللائحة التنفيذية صدرت بقرار 816 لسنة 2025 وفق إرشادات مركز حماية البيانات الشخصية. هذا يجعل الامتثال الحالي مسألة تشغيلية فورية، لا «ميزة مستقبلية». يجب إجراء مراجعة قانونية مصرية متخصصة لتحديد الترخيص/التصريح، DPO، نقل البيانات عبر الحدود، ومعالجة بيانات الأطفال. [مركز حماية البيانات الشخصية](https://pdpc.gov.eg/assets/pdf-data/Guidelines/Privacy%20Notice.pdf)، [الهيئة العامة للاستعلامات](https://sis.gov.eg/ar/%D8%A7%D9%84%D8%B1%D8%A6%D8%A7%D8%B3%D8%A9/%D8%B4%D8%A6%D9%88%D9%86-%D8%AF%D8%A7%D8%AE%D9%84%D9%8A%D8%A9/%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D8%B1%D8%A6%D8%A7%D8%B3%D9%8A%D8%A9/%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3-%D8%A7%D9%84%D8%B3%D9%8A%D8%B3%D9%89%D9%8A-%D9%8A-%D8%B5%D8%AF-%D9%82-%D8%B9%D9%84%D9%89-%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%AD%D9%85%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA-%D8%A7%D9%84%D8%B4%D8%AE%D8%B5%D9%8A%D8%A9/)

### حوكمة AI

يجب تحويل مبادئ prompt الحالية إلى نظام إدارة مخاطر وفق وظائف NIST AI RMF: Govern, Map, Measure, Manage، مع سجل مخاطر ونماذج eval وحوادث. NIST نشر ملفًا خاصًا بمخاطر GenAI، وUNESCO تشدد على الخصوصية والملاءمة العمرية والإشراف البشري. [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)، [UNESCO GenAI in Education](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)

---

## 7. التقييم التعليمي والمهني

### 7.1 هل فَهيم منصة تعليم أم chatbot؟

التصميم المقترح «مصدر → شرح → محاولة → خطأ → تدخل → مراجعة → تطبيق → دليل» يجعله أقرب إلى **Learning Operating System** من chatbot. هذه هي أفضل نقطة تموضع، لأنها تبني حلقة قابلة للقياس بدل تسليم إجابة.

### 7.2 توافقه مع علوم التعلم

المنتج يتضمن مبادئ صحيحة:

- الاسترجاع النشط بدل إعادة القراءة.
- التباعد بدل المذاكرة المكثفة.
- feedback بعد المحاولة.
- تشخيص misconception.
- التدرج والسؤال السقراطي.
- application/project evidence.

الأدلة البحثية تدعم spacing وretrieval practice كاستراتيجيات تعلم فعالة، لكنها لا تثبت تلقائيًا أن أي تنفيذ برمجي لها ناجح. [Nature Reviews Psychology](https://doi.org/10.1038/s44159-022-00089-1)

الأبحاث الحديثة على tutoring بالذكاء الاصطناعي متباينة بطريقة مفيدة لفَهيم: tutor مصمم تربويًا حقق مكاسب في تجربة جامعية عشوائية، بينما وجدت دراسة أخرى أن GenAI بلا guardrails قد يضر التعلم. الاستنتاج المهني: **قيمة فَهيم في الـinstructional harness، لا في اسم النموذج**. [Scientific Reports RCT](https://www.nature.com/articles/s41598-025-97652-6)، [PNAS: GenAI without guardrails](https://doi.org/10.1073/pnas.2422633122)

### 7.3 ما الذي يلزم لإثبات الجودة التعليمية؟

1. تحديد learning outcomes لكل درس وقابلية قياسها.
2. baseline قبل التدخل، immediate post-test، وdelayed test بعد 2–4 أسابيع.
3. transfer task لا يكرر نفس الأسئلة.
4. قياس hint dependence وmisconception recurrence.
5. مقارنة مع بديل حقيقي: مراجعة عادية أو فيديو/worksheet، لا مقارنة مع «لا شيء» فقط.
6. تحليل النتائج حسب النوع، المحافظة، الجهاز، الدخل التقريبي، والإعاقة دون جمع بيانات أكثر من اللازم.
7. مراجعة تربوية بشرية للمحتوى عالي المخاطر والامتحانات.

### 7.4 الاحتراف المهني للمحتوى

الكتالوج الحالي مفيد كبذرة، لكنه لا يمثل مكتبة عالمية:

- 9 مسارات و71 درسًا رقم جيد لمنتج مبكر، صغير جدًا مقارنة بمنصات المحتوى الكبرى.
- rating وlearner counts الموجودة في كتالوج static تحتاج تعريفًا: إن لم تكن بيانات فعلية فيجب عدم عرضها كدليل اجتماعي حقيقي.
- لا توجد بعد هيئة تحرير، مالكو منهج، versioning workflow، أو SLA لتحديث محتوى المنهج.
- المصادر الثمانية الرسمية بداية جيدة لكنها ليست corpus.

#### المطلوب

- Content Governance Board مصغرة: subject expert + instructional designer + fact checker.
- curriculum map لكل سنة دراسية.
- source registry له owner وlicense وvalidity dates وchange alerts.
- Exam Drift Monitor يراقب تغييرات الوزارة ويمنع تقديم محتوى سنة سابقة كحالي.
- content QA rubric: accuracy، alignment، cognitive level، accessibility، citation coverage، bias.

---

## 8. المقارنة بالمنافسين

### 8.1 المنافسة العالمية والإقليمية

| المنافس | قوته المثبتة | أين فَهيم أفضل أو مختلف | الفجوة التي يجب إغلاقها |
|---|---|---|---|
| ChatGPT Study Mode | tutor عالمي، ملفات/صور، ذاكرة، صوت، انتشار هائل | مسار فهم موثق، سياق مصري، evidence graph مقترح | جودة النموذج، multimodal، التطبيقات، الثقة المؤسسية |
| NotebookLM | RAG قوي، citations، PDF/web/YouTube، audio/video/mind maps | دورة خطأ/مراجعة/مشروع وليس notebook فقط | ingestion/OCR، source scale، multimedia generation |
| Perplexity Learn | بحث عالمي + guided learning + quizzes/flashcards | سجل تعلم مصري ومناهج وإثبات تقدم | البحث العميق والفهرس والسرعة والـcitations |
| Khan Academy/Khanmigo | محتوى موثوق، mastery، أدوات مدرس، مؤسسات وخصوصية مدققة | العربية/مصر والسعر والوصول المحلي | المحتوى، بيانات التعلم، أدوات المعلم، evidence-based outcomes |
| Nagwa | تغطية قوية للمنهج المصري ودروس وخبراء | AI tutor + RAG + evidence/misconceptions | عمق المنهج، المدرسون، المراجعة البشرية |
| Noon Academy | social live learning، مدرسون، مجموعات، انتشار إقليمي | تعلم ذاتي موثق وخصوصية المحادثة | community، live classes، network effects |
| Raskh | Arabic-first retention، OCR، voice teach-back، mind maps/podcasts | evidence contract ومصر والمنهج والمشروعات | OCR/voice/podcast/concept decay الناضج |
| almentor | مكتبة عربية وتعلم مهني وشراكات | school/STEM learning loop بسعر أقل | catalog، production، offline cross-device، partnerships |

المصادر الرسمية للمقارنة: [OpenAI Study Mode](https://help.openai.com/en/articles/11780217-study-mode)، [Google NotebookLM](https://edu.google.com/ai-notebooklm/)، [Perplexity Learn](https://www.perplexity.ai/help-center/en/articles/12120542-what-is-learn-mode)، [Khanmigo](https://www.khanmigo.ai/learners)، [Khan Academy Districts](https://www.khanacademy.org/schools/pricing)، [Nagwa](https://www.nagwa.com/en/eg/)، [Noon Academy](https://www.noonacademy.com/en-eg)، [Raskh](https://raskh.app/)، [almentor](https://www.almentor.net/home).

### 8.2 أين يمكن أن يمتلك فَهيم moat حقيقيًا؟

#### 1. Learning Evidence Graph

ليس completion percentage، بل سلسلة تربط المصدر بالمحاولة والخطأ والتدخل والمراجعة والتطبيق. هذه طبقة يصعب نسخها إذا تجمعت بيانات عالية الجودة وخصوصية آمنة.

#### 2. Misconception Atlas عربي

خريطة أخطاء شائعة لكل مفهوم وصف ومرحلة، مرتبطة بتدخلات مجربة. المنافسون يشرحون؛ فَهيم يمكنه تعلم «لماذا يخطئ طلاب هذا السياق؟».

#### 3. Bilingual Concept Bridge

العربي، المصطلح الإنجليزي، النطق، التمثيل الرياضي، والخطأ الشائع في موضع واحد. هذا مهم لطلاب STEM والجامعة في مصر.

#### 4. Exam Drift Monitor

ربط المحتوى بسنة المنهج والقرارات الرسمية مع تنبيه ومراجعة بشرية. هذه قيمة محلية عالية وثقة صعبة التقليد عالميًا.

#### 5. Proof-of-Learning Passport

سجل قابل للتحقق يضم evidence وprojects وتقييمًا، وليس PDF شهادة فقط. Open Badges 3.0 يدعم metadata والأدلة والتوقيعات وقابلية النقل. [1EdTech Open Badges 3.0](https://standards.1edtech.org/open-badges/specifications/standards/v3p0/cert)

#### 6. Privacy Boundary للأسرة

ولي الأمر يرى التقدم والمخاطر والاتساق دون قراءة محادثات الطالب افتراضيًا. هذه ميزة ثقة يمكن تسويقها أخلاقيًا.

### 8.3 ما الذي لا يصلح كتميّز؟

- chatbot + PDF.
- تلخيص YouTube.
- flashcards أو quiz generation وحدهما.
- «مدعوم بأكثر من نموذج»؛ المستخدم يشتري النتيجة لا البنية.
- أقل سعر وحده؛ السعر المنخفض بلا margin أو ثقة يتحول إلى نقطة ضعف.

---

## 9. تحليل السوق وحجم الفرصة

### 9.1 السوق المصري

وزارة التعليم أعلنت أن العام 2025/2026 يضم **25,689,571 طالبًا** في المدارس الحكومية والخاصة، و62,690 مدرسة، و1,260,801 معلم. CAPMAS يستخدم نطاقًا أوسع في نشرة 2023/2024 وذكر 28.5 مليون تلميذ في التعليم قبل الجامعي؛ اختلاف الرقمين يرجع إلى التغطية والتعريف، لذلك لا يجوز جمعهما. [وزارة التربية والتعليم](https://moe.gov.eg/what-s-on/news/on-health/)، [CAPMAS عبر بوابة إعلام مصر](https://mediadr.sis.gov.eg/handle/123456789/86154)

يوجد كذلك **3.8 مليون طالب** مقيد بالتعليم العالي في 2023/2024. [CAPMAS](https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/755/download/2233)

وتشير ITU إلى استخدام الإنترنت من 74.6% من الأفراد في مصر عام 2024، وهو وصول واسع لكنه لا يلغي فجوات الجهاز والتكلفة والمهارات. [ITU DataHub](https://datahub.itu.int/data/?e=EGY&i=11624&v=chart)

### 9.2 TAM/SAM/SOM بطريقة مسؤولة

#### TAM نظري

كل المتعلمين قبل الجامعي والعالي أكبر من 29 مليونًا، لكن هذا **سقف سكاني** وليس سوقًا قابلًا للبيع الآن.

عند 49 جنيهًا شهريًا، 1% فقط من 25.69 مليون طالب يساوي نظريًا:

- نحو 256,896 مشتركًا.
- 12.59 مليون جنيه MRR.
- 151 مليون جنيه ARR قبل الخصومات والتكلفة والضرائب.

هذه ليست forecast؛ هي فقط توضح حجم السقف. البنية اليدوية الحالية لا يمكنها خدمة هذا الحجم تشغيليًا.

#### SAM الواقعي أولًا

أوصي بتحديده كالتالي:

- طلاب ثانوي وجامعة STEM في مصر.
- لديهم smartphone/desktop وإنترنت قابل للاستخدام.
- يدرسون بالعربية مع مصطلحات إنجليزية.
- لديهم ألم متكرر في الفهم والمراجعة والتحضير للامتحان.
- مستعدون للتعلم الذاتي، وليسوا باحثين فقط عن حصة مباشرة.

لا ينبغي وضع رقم مالي لـSAM قبل survey مدفوع وبيانات funnel فعلية.

#### SOM خلال 24 شهرًا

هدف قابل للدفاع كبداية:

- 50–100 ألف مستخدم مسجل.
- 8–15 ألف مستخدم نشط شهريًا.
- 1,500–4,000 مشترك فردي دافع.
- 10–25 cohort معلمين.
- 3–5 pilots مؤسسية صغيرة بعد إغلاق cloud classroom وprivacy gates.

هذا هدف تشغيلي يجب اختباره، لا وعد للمستثمر.

---

## 10. نموذج الأعمال والتسعير والربحية

### 10.1 الوضع الحالي

- Free: صفر جنيه.
- Plus Monthly: 49 جنيهًا، سعر إطلاق.
- Plus Annual: 399 جنيهًا، ما يعادل 33.25 جنيه شهريًا.
- تجربة كاملة 30 يومًا دون بطاقة.
- التحصيل الحالي بإثبات دفع ومراجعة إدارية.

السعر أقل بكثير اسميًا من Raskh الذي يعرض 49 SAR للـPlus، وأقل من Khanmigo بسعر 4 دولارات شهريًا، مع ملاحظة أن الأسواق والتغطية والقوة الشرائية مختلفة. [Raskh Pricing](https://raskh.app/)، [Khanmigo Pricing](https://www.khanmigo.ai/learners)

### 10.2 هل 49 جنيهًا سعر مستدام؟

ليس مؤكدًا. هو ممتاز للاكتساب، لكنه قد يكون خاسرًا إذا كان الاستخدام كثيفًا. النموذج التالي يوضح الحساسية، ولا يمثل التكلفة الفعلية:

| السيناريو لكل مشترك/شهر | AI | بنية وتخزين | دعم ومراجعة دفع | فاقد/استرداد | المساهمة من 49 جنيهًا | هامش المساهمة |
|---|---:|---:|---:|---:|---:|---:|
| كفء | 7 | 3 | 4 | 1 | 34 | 69% |
| أساسي | 16 | 5 | 8 | 2 | 18 | 37% |
| ضغط مرتفع | 28 | 8 | 12 | 3 | -2 | سالب |

السعر السنوي 399 يضغط الهامش أكثر. لذلك يجب اعتباره **launch plan مع fair-use حقيقي**، لا unlimited غير محدود.

### 10.3 حساسية الإيراد

| المشتركين الدافعين | MRR عند 49 جنيهًا | ARR اسمي |
|---:|---:|---:|
| 1,000 | 49,000 | 588,000 |
| 5,000 | 245,000 | 2.94 مليون |
| 10,000 | 490,000 | 5.88 مليون |
| 50,000 | 2.45 مليون | 29.4 مليون |

لا تشمل الأرقام annual mix أو ضرائب أو churn أو refunds أو support أو AI.

### 10.4 نقطة التعادل التخطيطية

إذا كانت التكاليف الثابتة الشهرية 150 ألف جنيه والمساهمة 34 جنيهًا، يلزم قرابة **4,412 مشتركًا**. إذا كانت التكاليف 300 ألف والمساهمة 18 جنيهًا، يلزم قرابة **16,667 مشتركًا**. وفي سيناريو المساهمة السالبة لا توجد نقطة تعادل مهما زاد الحجم.

### 10.5 توصية التسعير

1. إبقاء 49 جنيهًا كسعر Founding/Limited Launch بحدود واضحة.
2. تثبيت Free دائم منخفض التكلفة لبناء الثقة.
3. بعد 8 أسابيع من بيانات التكلفة، اختبار 69–79 جنيهًا regular Plus مع grandfathering للأوائل.
4. annual لا يقل عن economics قابلة للحياة؛ لا تسعّره فقط كنسبة خصم.
5. Teacher plan لا يطلق قبل cloud classroom، بسعر مبني على الوقت الموفر لا عدد AI calls.
6. School plan لكل active learner مع setup/support fee وminimum contract.
7. Verified assessment منفصل فقط بعد وجود مراجع وشريك وإصدار موثق.

### 10.6 مشكلة المدفوعات اليدوية

التحقق اليدوي مناسب لاختبار السوق المصري وتجنب تكامل ناقص، لكنه يخلق:

- زمن انتظار.
- تكلفة بشرية لكل عملية.
- صعوبة التجديد التلقائي.
- أخطاء reconciliation واحتيال reference reuse.
- ضغطًا كبيرًا عند بضعة آلاف مشترك.

المطلوب أولًا: SLA أقل من 4 ساعات في أوقات العمل، duplicate detection، daily reconciliation، refund workflow، invoice/receipt، ومؤشرات queue. ثم يقرر المنتج gateway آليًا بناءً على التحويل لا التفضيل التقني.

### 10.7 قنوات الإيراد المستقبلية

- B2C Student Plus.
- Teacher Pro.
- Schools/Programs per active learner.
- cohort-based exam preparation.
- project review وverified assessment.
- white-label curriculum evidence layer للمؤسسات.
- content partnerships؛ لا بيع بيانات الطلاب ولا إعلانات استغلالية.

---

## 11. خطة الذهاب إلى السوق

### الشريحة الشاطئية

لا تبدأ «لكل طالب في العالم». ابدأ بـ:

> طالب ثانوي أو جامعة STEM في مصر، يذاكر من PDF/فيديو، يفهم لحظيًا ثم ينسى، ويحتاج دليلًا عمليًا على ما أتقنه وما أخطأ فيه.

### لحظة القيمة

خلال أول 12 دقيقة:

1. يضيف مصدرًا أو يختار درسًا.
2. يشرح له فَهيم نقطة واحدة.
3. يحاول سؤالًا.
4. يرى تشخيص خطئه.
5. تُضاف مراجعة لاحقة.
6. يرى evidence card أو next action.

إذا لم تحدث هذه الدورة في أول جلسة، onboarding لم يحقق قيمته مهما كان جميلًا.

### قنوات الاكتساب

- teacher ambassadors وmicro-cohorts.
- محتوى SEO مرتبط بمفاهيم لا إجابات امتحان فقط.
- shareable proof-of-learning cards بدون كشف البيانات.
- challenges تطبيقية أسبوعية.
- شراكات نوادي STEM وكليات ومعسكرات.
- referral يعطي review credits لا AI غير محدود.

### مؤشرات funnel

- visitor → registered.
- registered → onboarding complete.
- onboarding → first verified cycle.
- first cycle خلال 24 ساعة.
- day-7 review completion.
- trial → paid.
- paid month-2 retention.

---

## 12. نظرية الأثر

### سلسلة الأثر

```text
مدخلات
مصادر موثقة + AI + تصميم تعلم + معلم/مراجع
        ↓
أنشطة
شرح + محاولة + feedback + مراجعة + مشروع
        ↓
مخرجات
محاولات موثقة + أخطاء مصنفة + مراجعات مكتملة + أعمال تطبيقية
        ↓
نتائج قصيرة
تحسن الاسترجاع + انخفاض تكرار الخطأ + زيادة الثقة المنضبطة
        ↓
نتائج متوسطة
إتقان وانتقال لمهام جديدة + استمرارية تعلم + مهارات رقمية
        ↓
أثر طويل
تعلم أكثر عدلًا وقابلية توظيف وإثبات مهارة موثوق
```

### الفرضيات الحرجة

- الطالب لا يستخدم AI لتجاوز المحاولة.
- المحتوى صحيح ومناسب للمنهج.
- المراجعات تحدث في موعدها.
- الجهاز والإنترنت لا يمنعان الاستمرارية.
- المعلم يثق في evidence ويمكنه التدخل.
- الخصائص لا تزيد اعتماد الطالب على الإجابة الآلية.

### ما يمكن ادعاؤه الآن

- «المنصة مصممة لدعم الاسترجاع والتباعد والتغذية الراجعة.»
- «توفر دورة تعلم قابلة للتتبع وتقليل الاعتماد على الإجابة المباشرة.»

### ما لا يمكن ادعاؤه الآن

- أنها ترفع الدرجات بنسبة معينة.
- أنها تقلل الفجوات التعليمية فعليًا.
- أن شهاداتها معتمدة.
- أن خوارزمية المراجعة متفوقة على البدائل.

هذه ادعاءات تحتاج تجربة وبيانات وشركاء.

---

## 13. أهداف التنمية المستدامة

### الهدف الأساسي: SDG 4 — التعليم الجيد

الأمم المتحدة تربط الهدف 4 بالتعليم المنصف الجيد والتعلم مدى الحياة، وتشمل أهدافه نتائج التعلم، الوصول للتعليم الفني والعالي، المهارات للعمل، المساواة، وتأهيل المعلمين. [UN SDG 4](https://sdgs.un.org/goals/goal4)

| هدف/غاية | مساهمة فَهيم المحتملة | مؤشر قياس داخلي | الدليل الحالي |
|---|---|---|---|
| 4.1 نتائج تعلم فعالة | mastery وdelayed retrieval | تحسن post/delayed test | غير مقاس بعد |
| 4.3 وصول ميسور للتعليم الفني والعالي | Free وسعر محلي وPWA | مستخدمون نشطون حسب المحافظة والدخل | تصميم فقط |
| 4.4 مهارات للعمل وICT | مسارات Python/AI/data/projects | projects مكتملة ومراجعة | محتوى أولي |
| 4.5 تقليل الفجوات | عربي/إنجليزي، mobile، accessibility | parity حسب النوع/الموقع/الإعاقة | غير مقاس |
| 4.7 تعلم مسؤول واستدامة | AI literacy ومصادر وتحقق | وحدات وassessment للوعي الرقمي | جزئي |
| 4.c دعم المعلم | rubrics، assignments، misconception insights | وقت معلم موفر وجودة التدخل | pilot محلي |

### أهداف ثانوية

#### SDG 8 — العمل اللائق والنمو الاقتصادي

- مهارات رقمية ومشروعات قابلة للعرض.
- ربط evidence بمهارات وليس completion فقط.
- القياس: نسبة المتعلمين الذين ينجزون project rubric ويستخدمونه في تدريب/عمل.

#### SDG 9 — الصناعة والابتكار والبنية الأساسية

- منتج AI عربي محلي وبنية تعلم رقمية قابلة للتوسع.
- القياس: availability، cost per learning cycle، ونسبة الوصول من أجهزة منخفضة.

#### SDG 10 — الحد من أوجه عدم المساواة

- تسعير محلي، Free، bilingual bridge، وprivacy boundary.
- القياس: فجوة retention/learning outcomes بين المحافظات والفئات، لا عدد التسجيلات فقط.

#### SDG 17 — عقد الشراكات

- الجامعات والمدارس وخبراء المناهج والجهات المانحة ومصدرو الاعتماد.
- القياس: partnerships لها outcomes وdata-sharing agreements، لا logos تسويقية.

### تجنب SDG-washing

لا يوضع شعار SDG في التسويق إلا مع:

1. target محدد.
2. metric محدد.
3. baseline.
4. نتيجة سنوية قابلة للمراجعة.
5. أثر سلبي محتمل وخطة تقليل.

---

## 14. لوحة مؤشرات المنتج والأثر

### North Star Metric

**Weekly Verified Learning Cycles:** عدد الدورات الأسبوعية التي تشمل مصدرًا ومحاولة وfeedback ومراجعة أو تطبيقًا، لا عدد الرسائل.

### مقاييس المنتج

- WAU/MAU.
- first verified cycle rate.
- D1/D7/D30 retention.
- review due/completed ratio.
- sessions with learner attempt before answer.
- course/module completion مع delayed mastery.
- cross-device sync success.

### مقاييس جودة AI

- citation precision وcoverage.
- NEEDS_REVIEW rate.
- hallucination/unsupported claim rate.
- quiz answer leakage.
- regeneration rate.
- negative feedback by subject/grade.
- p50/p95 first token وcompletion success.

### مقاييس التعلم

- pre/post/delayed gain.
- misconception recurrence.
- hint dependence.
- transfer task success.
- calibration gap بين ثقة الطالب ونتيجته.

### مقاييس الأعمال

- trial activation.
- trial-to-paid.
- ARPPU.
- contribution margin per paid user.
- AI cost per verified cycle.
- churn وrefund rate.
- CAC payback.
- support tickets per 100 active users.

### مقاييس الأثر والعدالة

- active learners حسب المحافظة ونوع الجهاز.
- female/male parity حيث الجمع مشروع وموافق عليه.
- accessibility issue rate.
- low-bandwidth completion rate.
- teacher time saved، مع time study لا self-report فقط.

---

## 15. SWOT

### نقاط القوة

- هوية عربية مميزة وليست clone بصريًا.
- تموضع واضح حول الفهم الموثق.
- منتج واسع فعليًا مع AI، بحث، فيديو، اختبار، مراجعة، إدارة ودعم.
- سعر مصري شديد الجاذبية.
- بنية أمنية أفضل من متوسط المنتجات المبكرة.
- prompt وعقد تعلم أكثر نضجًا من chatbot عام.
- قدرة على الجمع بين B2C وteacher/institutional لاحقًا.

### نقاط الضعف

- كثرة الخصائص مع persistence محلي تقلل العمق.
- مكتبة محتوى صغيرة ولا توجد هيئة تحرير مثبتة.
- لا توجد بيانات أثر أو traction موثقة.
- مدفوعات يدوية لا تتوسع.
- لا توجد E2E/CI/observability/DR مثبتة.
- لا توجد تطبيقات native أو offline learning كامل.
- عدم وجود صفحات قانونية عامة وحوكمة أطفال.

### الفرص

- سوق تعليمي مصري ضخم وسياق عربي/إنجليزي غير مخدوم جيدًا.
- تحول المنافسة من «إجابة» إلى guided learning.
- احتياج المدارس لأدلة تقدم لا مجرد ساعات مشاهدة.
- سوق التعليم الفني والجامعة والمشروعات.
- Verified learning passport وشهادات قابلة للتحقق.
- Exam Drift Monitor وMisconception Atlas كبيانات محلية صعبة التقليد.

### التهديدات

- Google/OpenAI/Perplexity تضيف خصائص تعليم بسرعة وتقدم free tiers.
- تكلفة AI وتقلب المزودين.
- أخطاء AI في تعليم عالي المخاطر.
- تغييرات المنهج والحقوق والتراخيص.
- الامتثال لبيانات الأطفال ونقل البيانات.
- ضعف willingness-to-pay أو مشاركة الحساب.
- منافسون محليون لديهم مدرسون ومحتوى وثقة أكبر.

---

## 16. سجل المخاطر التنفيذي

| الخطر | الاحتمال | الأثر | الأولوية | المالك المقترح | التخفيف |
|---|---|---|---|---|---|
| فقد/تشتت تقدم الطالب بين الأجهزة | عالٍ | عالٍ | P0 | Platform | sync/outbox/server truth |
| ادعاء غير مسنود من AI | متوسط | عالٍ | P0 | AI + Content | evals/verifier/human escalation |
| مفتاح API مكشوف تاريخيًا | عالٍ | عالٍ | P0 | Security | rotate/audit/secret policy |
| عدم امتثال بيانات الأطفال | متوسط | حرج | P0 | Legal/Privacy | DPO, consent, DPIA, policies |
| 49 جنيهًا لا يغطي الاستخدام | عالٍ | عالٍ | P0 | Product/Finance | cost telemetry/fair use/price test |
| ضغط المدفوعات اليدوية | عالٍ | متوسط | P1 | Ops | SLA/reconciliation/automation gate |
| محتوى أو منهج قديم | متوسط | عالٍ | P1 | Content | source versions/drift monitor |
| انقطاع مزود AI | متوسط | متوسط | P1 | AI/SRE | redundancy/circuit breaker/cache |
| غياب restore rehearsal | متوسط | حرج | P1 | DevOps | PITR/restore drill/RPO-RTO |
| شهادة تُفهم كاعتماد رسمي | متوسط | عالٍ | P1 | Product/Legal | wording/issuer/evidence/Open Badges |
| إعادة كتابة Next.js تستهلك الفريق | متوسط | متوسط | P2 | Architecture | incremental migration with KPIs |

---

## 17. خارطة الطريق المطلوبة

### Gate 0 — خلال 7 أيام: الأمان والحقيقة التشغيلية

**الهدف:** منع مخاطر فورية وتثبيت baseline.

- rotate لكل مفتاح سبق كشفه نصيًا، خصوصًا مزود AI التجريبي.
- إنشاء مستودع Git موثوق وbranch protection وCI.
- تجميد migrations القديمة وتوثيق الترتيب canonical.
- توليد database types.
- نشر privacy، terms، AI disclosure، child/guardian policy، refund/support SLA.
- إعداد error tracker وuptime alert وrelease identifier.
- توثيق RPO/RTO وسياسة backup.

**معيار الخروج:** لا أسرار مكشوفة، CI أخضر، legal surfaces منشورة، owner لكل إنذار وحادث.

### Gate 1 — أسابيع 2–6: دورة تعلم سحابية كاملة

- unified learning event model.
- مزامنة progress، mastery، review، video notes، bookmarks، conversations.
- server truth + local outbox + idempotency.
- dashboard مبني على events حقيقية.
- notifications للمراجعة عبر in-app أولًا، ثم email/push.
- E2E لأهم 8 رحلات: auth، onboarding، chat، quiz، vault، review، payment proof، admin review.

**معيار الخروج:** المستخدم يبدل جهازًا دون فقد، وadmin/teacher يرى نفس الحقيقة.

### Gate 2 — أسابيع 5–10: RAG والمحتوى الموثق

- source registry/versioning UI حقيقي.
- Cloud Verified Mode مع OCR عربي وlayout extraction.
- hybrid retrieval + reranking + page-level citations.
- claim verifier وcitation coverage.
- curriculum-year bindings وExam Drift Monitor.
- content moderation/review queue.

**معيار الخروج:** 95% citation precision على golden set، وكل claim مادي له chunk/page/version أو NEEDS_REVIEW.

### Gate 3 — أسابيع 8–14: المعلم والفصل والمشروع

- organizations/classes/roster/invite codes على الخادم.
- assignments/submissions/version history.
- rubrics وAI-assisted review مع قرار بشري.
- teacher intervention queue من misconceptions.
- parent privacy boundary.
- export gradebook وbasic LTI/OneRoster discovery، لا تكامل شكلي.

**معيار الخروج:** pilot لـ3 معلمين و100 طالب دون local-only data.

### Gate 4 — أسابيع 12–18: التشغيل والربحية

- product analytics وcost dashboards.
- manual payment SLA/reconciliation/refund.
- pricing experiment وquota elasticity.
- load test 1x/3x/10x، stress وsoak.
- incident runbooks، provider failover drill، restore rehearsal.
- support macros وCSAT.

**معيار الخروج:** p95/SLO، cost per cycle، gross contribution، وrestore report مثبتة.

### Gate 5 — أشهر 5–8: الأثر والشهادة

- baseline/post/delayed study مع جهة تعليمية.
- mistake portfolio وevidence passport.
- server-side signed credentials.
- Open Badges 3.0 format وpublic verifier.
- reviewer identity، revocation، expiry، evidence hash.
- لا يكتب «معتمد» إلا بعقد جهة اعتماد محددة.

**معيار الخروج:** دراسة نتائج أولية قابلة للمراجعة وشهادات يمكن التحقق من مصدرها وأدلتها.

### Gate 6 — أشهر 8–12: التوسع

- SSR/Next migration للواجهة العامة حيث تثبت فائدته.
- multi-tenant school controls، data residency assessment، SSO/rostering.
- native app فقط إذا أثبتت PWA فجوة retention أو device capability.
- partnerships للمحتوى والتقييم والتوظيف.
- Arabic regional curriculum packs بعد نجاح مصر.

---

## 18. ما يجب عدم بنائه الآن

- متجر دورات ضخم قبل تثبيت أول شريحة وقيمة متكررة.
- social feed عام قبل moderation وحوكمة القصر.
- blockchain certificate؛ التوقيع القياسي وOpen Badges يكفيان.
- native apps كاملة لمجرد وجود المنافسين؛ PWA الحالية تختبر الحاجة بأقل تكلفة.
- AI avatar أو فيديو مولد قبل إغلاق factuality وRAG.
- نظام اشتراك آلي جديد قبل معرفة economics وconversion للـ49 جنيهًا.
- rewriting كامل قبل sync وimpact؛ تغيير framework لن يصلح model product.

---

## 19. فريق التشغيل المطلوب

للانتقال من 6.7 إلى 8.5 خلال 9–12 شهرًا، الحد الأدنى العملي:

- Product/Founder owner واحد للنتيجة.
- Staff full-stack/platform engineer.
- AI/RAG engineer.
- frontend/design systems engineer.
- learning scientist/instructional designer.
- subject-matter reviewers حسب المسارات.
- part-time security/privacy/DPO counsel.
- support/content operations.
- data/analytics capability، ولو بدوام جزئي أولًا.

لا ينبغي أن تكون كل الأدوار وظائف ثابتة من اليوم؛ يمكن توزيعها على فريق صغير وشركاء، لكن يجب أن يكون لكل مسؤولية **مالك وSLA**.

---

## 20. تقدير الجاهزية للاستثمار والشراكة

### صالح الآن لـ

- beta عام مضبوط.
- cohort جامعي/ثانوي محدود.
- اختبار willingness-to-pay.
- teacher pilots صغيرة تحت إشراف مباشر.
- جمع بيانات activation وretention وتكلفة.

### غير صالح بعد لـ

- rollout وطني أو آلاف المدارس.
- SLA مؤسسي صارم.
- شهادة اعتماد مهني أو أكاديمي.
- ادعاءات أثر تسويقية كمية.
- معالجة كثيفة لبيانات قصر دون اكتمال الحوكمة.

### ما يحتاجه investor data room

- cap table وIP assignment.
- Git/release history.
- architecture/data-flow diagrams.
- security/privacy pack وDPIA.
- cohort metrics وunit economics.
- AI vendor terms وprocessor list.
- content licenses.
- contracts/pilots.
- monthly management accounts.
- risk register وincident/backup evidence.

---

## 21. Definition of Done للوصول إلى «منصة عالمية»

لا تُعتبر فَهيم عالميًا لأن كل شاشة موجودة. تعتبر جاهزة عندما تتحقق الشروط التالية معًا:

### المنتج

- 80% من المستخدمين النشطين يكملون verified cycle أسبوعيًا.
- D30 retention وtrial conversion يتجاوزان baseline محددًا مسبقًا.
- كل البيانات الحرجة تعمل عبر الأجهزة.

### التعلم

- تحسن delayed assessment مثبت على cohort مناسب.
- misconception recurrence ينخفض بمرور الوقت.
- لا يزيد الاعتماد على hints أو الإجابة المباشرة.

### AI

- evals versioned وتشغل في CI/release gates.
- citation precision وcritical safety thresholds محققة.
- failover واستهلاك التكلفة تحت SLO.

### المحتوى

- owner ومصدر وإصدار وسنة منهج لكل وحدة رسمية.
- review SLA وchange monitoring.
- حقوق استخدام واضحة.

### التشغيل

- uptime/latency/error/cost dashboards.
- restore rehearsal ناجح.
- load وsoak tests ناجحة عند 3x الحمل المتوقع.
- incident response وتمارين دورية.

### الأمن والامتثال

- live RLS tenant-isolation tests.
- secrets rotation وSBOM وSAST/DAST.
- privacy/children/retention/DPO obligations مغلقة بمراجعة قانونية.

### الأعمال

- contribution margin موجب لكل خطة.
- support وpayment SLA قابلة للتوسع.
- churn وCAC payback ضمن الحدود.
- B2B pilot renewed بسبب نتيجة، لا مجاملة.

### الأثر

- تقرير سنوي يربط SDG targets بنتائج قابلة للتحقق.
- عدم وجود ادعاءات «اعتماد» أو «تحسن» بلا دليل.

---

## 22. القرار النهائي

فَهيم حاليًا من أقوى المشاريع العربية المبكرة من حيث **اتساع رؤية المنتج، تماسك الهوية، ومحاولة تحويل AI من مولد إجابات إلى نظام للفهم الموثق**. الميزة الاستراتيجية ليست أن لديه chat أو PDF أو YouTube؛ كل ذلك أصبح commodity. الميزة هي تحويل التعلم إلى evidence graph محلي الثقافة، ثنائي اللغة، مرتبط بالخطأ والمراجعة والتطبيق.

المرحلة القادمة يجب أن تتحول من **feature production** إلى **evidence production**:

- دليل أن البيانات لا تضيع.
- دليل أن المصدر يدعم الادعاء.
- دليل أن الطالب تذكر وطبق.
- دليل أن المعلم وفر وقتًا واتخذ تدخلًا أفضل.
- دليل أن السعر يغطي التكلفة.
- دليل أن النظام يتحمل الفشل والحمل.
- دليل أن حقوق وبيانات الطالب محمية.

إذا أُغلقت Gates 0–4 قبل التوسع، يمكن أن ترتفع الجاهزية العالمية من 6.7 إلى 8.0–8.5. وإذا أضيفت دراسة أثر وشراكات وشهادات قابلة للتحقق، يصبح التموضع «نظام تشغيل للفهم الموثق» دفاعيًا ومختلفًا فعلًا، لا مجرد شعار.

---

## 23. المصادر الرئيسية

### السوق والتعليم في مصر

- [وزارة التربية والتعليم — مؤشرات 2025/2026](https://moe.gov.eg/what-s-on/news/on-health/)
- [CAPMAS — التعليم قبل الجامعي 2023/2024](https://mediadr.sis.gov.eg/handle/123456789/86154)
- [CAPMAS — التعليم العالي 2023/2024](https://censusinfo.capmas.gov.eg/Metadata-en-v4.2/index.php/catalog/755/download/2233)
- [ITU DataHub — استخدام الإنترنت في مصر](https://datahub.itu.int/data/?e=EGY&i=11624&v=chart)

### التعليم والأثر والاستدامة

- [الأمم المتحدة — SDG 4](https://sdgs.un.org/goals/goal4)
- [UNESCO — Guidance for Generative AI in Education](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
- [Nature Reviews Psychology — spacing and retrieval practice](https://doi.org/10.1038/s44159-022-00089-1)
- [Scientific Reports — AI tutoring RCT](https://www.nature.com/articles/s41598-025-97652-6)
- [PNAS — GenAI without guardrails can harm learning](https://doi.org/10.1073/pnas.2422633122)

### المعايير والأمن

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [1EdTech Open Badges 3.0](https://standards.1edtech.org/open-badges/specifications/standards/v3p0/cert)
- [مركز حماية البيانات الشخصية المصري](https://pdpc.gov.eg/assets/pdf-data/Guidelines/Privacy%20Notice.pdf)

### المنافسون

- [OpenAI Study Mode](https://help.openai.com/en/articles/11780217-study-mode)
- [Google NotebookLM for Education](https://edu.google.com/ai-notebooklm/)
- [Perplexity Learn Mode](https://www.perplexity.ai/help-center/en/articles/12120542-what-is-learn-mode)
- [Khanmigo](https://www.khanmigo.ai/learners)
- [Khan Academy Districts](https://www.khanacademy.org/schools/pricing)
- [Nagwa Egypt](https://www.nagwa.com/en/eg/)
- [Noon Academy Egypt](https://www.noonacademy.com/en-eg)
- [Raskh](https://raskh.app/)
- [almentor](https://www.almentor.net/home)

---

**ملاحظة مهنية أخيرة:** كل رقم ربح أو حجم استحواذ في هذا التقرير هو فرضية تخطيطية معلّمة بوضوح. القرار الاستثماري الصحيح يبدأ من telemetry وفوج مستخدمين حقيقي، لا من تحويل TAM إلى وعد إيراد.
