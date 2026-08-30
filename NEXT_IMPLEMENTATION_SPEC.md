# Fahim — Next Implementation Specification

هذه الوثيقة تحول `FAHIM_MASTER_PLAN_2026.md` إلى ترتيب تنفيذ هندسي. لا يبدأ Epic قبل نجاح gate السابق له.

## Gate 0 — Baseline وحماية الموجود

- تثبيت snapshot لاختبارات TypeScript/ESLint/Vitest/build؛
- إضافة smoke tests لمسارات `/`, `/ask-fahim`, `/library`, `/knowledge-vault`, `/review`, `/studio`؛
- حفظ schema dump للقاعدة الحالية إن كانت البيئة مربوطة؛
- inventory لكل localStorage/IndexedDB key وعقد تحويله للسحابة؛
- feature flags لكل مسار جديد.

**قبول:** لا regressions في 20 اختبارًا الحاليين، ولا فقد بيانات محلية عند الترقية.

## Epic 1 — Canonical Data Model

### الجداول السلطوية

- `profiles`, `roles`, `permissions`, `user_roles`؛
- `organizations`, `organization_memberships`؛
- `classrooms`, `classroom_memberships`؛
- `courses`, `course_versions`, `modules`, `lessons`, `lesson_versions`؛
- `assignments`, `assignment_versions`, `submissions`, `submission_versions`؛
- `projects`, `project_versions`, `rubrics`, `rubric_criteria`, `reviews`؛
- `concepts`, `concept_aliases`, `concept_edges`؛
- `learning_evidence`, `mastery_states`, `misconception_events`؛
- `review_cards`, `review_attempts`؛
- `source_records`, `source_versions`, `source_documents`, `source_chunks`؛
- `conversations`, `messages`, `notes`, `bookmarks`؛
- `plans`, `subscriptions`, `entitlements`, `payment_events`؛
- `credentials`, `credential_evidence`, `credential_status_events`؛
- `consents`, `data_export_jobs`, `deletion_jobs`, `audit_events`.

### القرارات

- استخدام `user_id` موحد بدل المزج مع `owner_id`؛
- `role` عبر relation وليس عمود profile قابلًا للتعديل من المستخدم؛
- كل محتوى منهجي versioned ولا يعدل record منشورًا in-place؛
- money بوحدات أصغر integer + currency؛
- timestamps كلها `timestamptz`؛
- soft delete فقط عندما توجد حاجة audit، وإلا cascade مدروس؛
- public IDs للشهادات منفصلة عن primary keys؛
- embeddings مرتبطة بـsource version لا بالملف المتغير.

### RLS tests المطلوبة

- الطالب لا يرى فصلًا غير عضو فيه؛
- المعلم يرى submissions لفصله فقط؛
- ولي الأمر لا يرى message content؛
- moderator لا يملك billing؛
- support impersonation غير متاح؛
- admin actions تُسجل؛
- service role فقط يصدر entitlement/credential؛
- public verifier يعرض أقل metadata لازمة فقط.

**قبول:** migration من قاعدة فارغة ومن snapshot؛ schema واحد؛ types مولدة؛ اختبارات RLS ناجحة.

## Epic 2 — Repository Layer وLocal-first Sync

- interfaces موحدة لكل progress/review/note/project store؛
- local adapter وSupabase adapter؛
- outbox للأحداث غير المتزامنة؛
- idempotency keys؛
- last-write policy للحقول البسيطة وappend-only للمحاولات؛
- شاشة sync state وحل التعارض؛
- export/delete من الواجهة؛
- backfill لمفاتيح `fahim-*` المحلية بعد موافقة المستخدم.

**قبول:** مستخدم offline ينشئ مراجعات وملاحظات ثم تتم مزامنتها مرة واحدة دون تكرار عند عودة الاتصال.

## Epic 3 — Real Classroom Workflow

### واجهات

- `/teacher` overview؛
- `/teacher/classes/:id`؛
- `/teacher/classes/:id/assignments/new`؛
- `/class/:id` للطالب؛
- `/assignment/:id`؛
- `/submission/:id/review`.

### APIs/Actions

- create/join/approve class؛
- invite/revoke member؛
- draft/publish/close assignment؛
- submit/resubmit؛
- comment/score against rubric؛
- return/request changes/finalize؛
- CSV roster import/export؛
- notification events.

### قواعد

- join codes hashed وقابلة للإلغاء والانتهاء؛
- due dates timezone-aware؛
- grade لا يكتب من client؛
- AI feedback draft لا يظهر كقرار معلم قبل approval؛
- كل rubric version يثبت مع submission.

**قبول:** سيناريو E2E من ثلاثة حسابات: مدرس، طالب عضو، طالب غير عضو؛ الصلاحيات صحيحة والـaudit ظاهر.

## Epic 4 — Curriculum Evidence Engine

- upload عبر signed URL؛
- file type/signature/size scanning؛
- OCR job للصفحات المصورة؛
- parsing مع page/section anchors؛
- Arabic normalization؛
- embeddings + lexical index؛
- hybrid retrieval ثم reranking؛
- source license/status/year metadata؛
- prompt-injection sanitization؛
- claim → supporting chunks mapping؛
- stale/contradiction workflow؛
- curator approval UI.

### Evaluation set

- 200 سؤال عربي أولي عبر 4 مواد ومستويين؛
- gold source span؛
- curriculum match؛
- unsupported claim؛
- Arabic terminology؛
- refusal/safety؛
- latency/cost.

**قبول:** citation precision ≥85% على الـgold set، ولا يجيب النظام من source archived دون تحذير.

## Epic 5 — Adaptive Learning Evidence

- diagnostic attempt؛
- concept/prerequisite selection؛
- worked example؛
- completion problem؛
- independent problem؛
- confidence input؛
- hint levels مسجلة؛
- misconception classification؛
- immediate mastery update؛
- spaced delayed check؛
- transfer task؛
- teacher-visible aggregate.

### Mastery state

لا يخزن score واحدًا فقط. يخزن:

- evidence count and types؛
- recency؛
- independence؛
- confidence calibration؛
- transfer success؛
- source/curriculum version؛
- uncertainty interval؛
- next recommended action.

**قبول:** تغيير mastery قابل للتفسير من evidence events، وإعادة الحساب deterministic.

## Epic 6 — Product Analytics and Experiments

- event dictionary بإصدارات؛
- anonymous ID قبل الحساب ثم merge آمن؛
- consent-aware analytics؛
- funnel وcohort وretention؛
- cost per verified loop؛
- experiment assignment server-side؛
- guardrails للسafety/cost؛
- dashboards للطالب/المعلم/الإدارة منفصلة.

**قبول:** يمكن حساب North Star وD1/D7/D30 وcitation validity وcost/loop دون قراءة نصوص المحادثات.

## Epic 7 — Distributed Security and Operations

- distributed rate limits حسب IP/user/org/endpoint؛
- abuse quotas وbudget caps؛
- JWT validation server-side؛
- MFA للموظفين؛
- device/session revocation؛
- secret rotation؛
- structured logs + traces + error tracking؛
- SLO alerts؛
- dependency/security scanning؛
- backup + point-in-time recovery + restore drill؛
- incident/status runbooks.

**قبول:** load test متعدد instances، provider outage drill، وrestore لنسخة staging موثق بالزمن والنتيجة.

## Epic 8 — Commerce and Entitlements

- catalog plans server-side؛
- Paymob checkout؛
- webhook signature verification؛
- idempotent payment state machine؛
- entitlements لا تعتمد على UI؛
- trials، grace، cancellation، refund؛
- invoice/receipt؛
- scholarship/promo؛
- usage limits وoverage policy؛
- reconciliation job.

**قبول:** duplicate/out-of-order webhooks لا تمنح صلاحيات مكررة، وإلغاء الاشتراك يطبق في الموعد الصحيح مع export متاح.

## Epic 9 — Projects, Portfolio and Credentials

- milestone submissions؛
- evidence attachments؛
- version diff؛
- peer/teacher/assessor review؛
- appeal state machine؛
- public portfolio consent؛
- Open Badges 3.0 payload؛
- digital signature؛
- verification and revocation؛
- issuer/partner administration.

**قبول:** verifier مستقل يتحقق من التوقيع والحالة والمعايير والدليل، ولا تستخدم كلمة «معتمد» دون endorsement مسجل.

## Epic 10 — Migration to Next.js and PWA

يبدأ فقط بعد تثبيت Epics 1–2:

- نقل public SEO pages أولًا؛
- auth/session server boundary؛
- learner routes تدريجيًا؛
- streaming عبر route handlers؛
- dynamic metadata/JSON-LD/sitemap؛
- Service Worker، offline packs، background sync؛
- install/update UX؛
- إزالة Vite route بعد parity test.

**قبول:** route parity، noindex للخاص، canonical للعام، hydration/RTL/accessibility بلا regressions.

## Definition of Done لكل Story

- acceptance test؛
- loading/empty/error/offline/permission states؛
- RTL/LTR، mobile/tablet/desktop؛
- keyboard/screen reader؛
- analytics event؛
- authorization test؛
- rate/cost limit؛
- documentation/runbook؛
- no fabricated metrics or credentials؛
- feature flag + rollback path.

## ترتيب التنفيذ في الرسالة القادمة

البدء بـGate 0 وEpic 1 فقط حتى يكتمل canonical schema واختباره. تنفيذ الواجهة أو الدفع قبل هذا سيضاعف الدين الفني ويعيد إنتاج نفس البيانات بأسماء مختلفة.
