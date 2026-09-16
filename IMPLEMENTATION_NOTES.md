> **متجاوَز — Superseded 2026-09-15.** هذا المستند يصف حالة أقدم ولا يعكس المنتج الحالي. المصادر المعتمدة الآن: [README.md](README.md)، [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)، [docs/HACKATHON_READINESS_REPORT_2026.md](docs/HACKATHON_READINESS_REPORT_2026.md)، و[UPDATED_PRODUCT_REVIEW_2026-09-10.md](UPDATED_PRODUCT_REVIEW_2026-09-10.md). أبرز ما تغيّر بعد تاريخ هذا المستند: توقيع الشهادات صار HMAC-SHA256 مع تحقق يُعيد الحساب وإلغاء إداري؛ حلقة التعلّم أُغلقت (إصدار `review_recalled` و`transfer_applied`)؛ الاختبار يُصحَّح ويُسجَّل على الخادم لمسار كامل قابل للإنجاز؛ استهلاك توليد الاختبارات يُقاس ويُقيَّد؛ شجرة الإضافات صارت واحدة تحت `supabase/migrations/`؛ ولا توجد طبقة اختبارات مكوّنات أو E2E بعد.
>
> **Superseded — 2026-09-15.** This document describes an earlier state and no longer
> reflects the product. Authoritative sources today: [README.md](README.md),
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
> [docs/HACKATHON_READINESS_REPORT_2026.md](docs/HACKATHON_READINESS_REPORT_2026.md), and
> [UPDATED_PRODUCT_REVIEW_2026-09-10.md](UPDATED_PRODUCT_REVIEW_2026-09-10.md). Since this
> document was written: credentials are signed with HMAC-SHA256 and verification recomputes
> the signature, with admin revocation; the learning loop is closed (`review_recalled` and
> `transfer_applied` are emitted); one course is graded and recorded server-side end to end;
> quiz generation spend is metered; there is a single migration tree under
> `supabase/migrations/`; and there is still no component or E2E test layer.

# Fahim AI — implementation and launch notes

## Product audit and design decisions

The Atlas release replaces repeated generic “AI startup” patterns with a recognizable Arabic editorial product system. Its design language uses a strict knowledge-grid, large display typography, lapis and Nile inks, saffron and vermilion wayfinding, warm paper surfaces, restrained corners and one original screen-print-style mural. Glass effects remain only where they communicate layering; they are not the product identity.

The primary learner flow is explicit:

1. Home explains the product and leads to one next action.
2. Learning gives the student a short, realistic study rhythm.
3. Official resources separate authoritative source material from Fahim's supportive explanation.
4. The knowledge vault ingests PDF/text material locally and retrieves cited excerpts.
5. Ask Fahim teaches from the question and optional vault evidence.
6. Quiz and spaced review convert the session into an attempt and a future recall event.

The product keeps keyboard focus styles, responsive phone/tablet layouts, correct language/direction and no invented learner-count or success-rate claims.

## Egypt-specific, implementable content strategy

| Need | Site implementation | Source |
| --- | --- | --- |
| Verify syllabus and textbook scope | Link every curriculum lesson to the relevant digital book before any AI explanation | [MOE student books](https://studentbooks.moe.gov.eg/) |
| Find Ministry learning services | Keep a curated resource card for e-learning, livestreams, assessments, and model papers | [MOE educational platforms](https://moe.gov.eg/educationalplatform/) |
| Enrich study and research | Link to EKB without copying licensed content; explain that sign-in/access conditions may apply | [Egyptian Knowledge Bank](https://www.ekb.eg/) |
| Extend study into employable digital skills | Add a post-foundation skills path that points to the national digital-work initiative | [ITIDA — Future Work is Digital](https://itida.gov.eg/English/Programs/future-work-is-digital/Pages/default.aspx) |

The Ministry has also described its electronic learning content as including explanations, concept maps, and practice that account for different learner levels. That is the right content pattern for Fahim: lesson mapping, explanation, and formative practice—not a replacement for official material. See [the Ministry announcement](https://moe.gov.eg/what-s-on/news/on-its-website/).

## AI architecture

`src/pages/AiTutor.tsx` calls the same-origin `/api/chat` boundary through `src/lib/aiTutor.ts`. The browser sends bounded conversation context and, when explicitly handed off from the local vault, at most six cited excerpts. `api/chat.mjs` validates the request, rate limits it, retrieves approved public references, treats uploaded excerpts as untrusted data rather than instructions, and calls Gemini with primary/fallback model handling. Secrets remain server-side.

The local vault stores imported content in IndexedDB and does not upload original files. Evidence is sent to the tutor only when the learner chooses “Ask Fahim with evidence.” A future cloud corpus must add explicit consent, encryption, retention controls, deletion and content-rights governance before replacing this local-first boundary.

### Deploy the tutor

1. Deploy the Vite build and `/api` functions to Vercel.
2. Set server-side secrets (never put them in `VITE_*` variables):
   ```powershell
   vercel env add GEMINI_API_KEY production
   vercel env add YOUTUBE_API_KEY production
   ```
3. Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend environment only; they configure the optional authenticated client and are not model credentials.
4. Configure Google API restrictions, quotas, spend alerts and staging smoke tests.
5. Verify `/api/health`, telemetry ingestion and provider failure states on the deployed URL.

## Before public launch

- Have a curriculum specialist map each unit to the currently published official book and academic year.
- Add authentication, a privacy notice, rate limits, feedback/review flow, and a report mechanism before collecting learner conversations.
- Do not present Fahim as affiliated with a government entity or as a source of exam answers.
- Test Arabic, English, keyboard-only navigation, low-bandwidth behavior, and the model error state on real devices.

## Canonical product foundation — release 6

- Public use now follows a clear contract: product preview is public, while real uploads, conversations, progress, review, and projects require an account and completed onboarding.
- Onboarding starts one non-renewable 30-day Plus trial without a card. Launch prices are encoded in one shared catalog and database seed: Free (EGP 0), Plus monthly (EGP 49), and Plus annual (EGP 399).
- Stripe billing uses hosted Checkout subscriptions. A successful browser redirect never grants access; only a verified, idempotent webhook and the service-only activation transaction can do so. Live activation still requires a merchant entity in a Stripe-supported country; test mode is not represented as live commerce.
- Every AI request receives an ID and a pending database row before the provider is called. Completion, model, sources, tokens, estimated cost, errors, and private cache hits are persisted and visible to the owning learner at `/generation/:generationId`.
- The canonical conversation model is `conversations.user_id` plus `chat_history`; the overlapping legacy migration has been quarantined without deletion.
- Certificates are verification records, not accreditation claims. Public verification explicitly states this boundary.
- The founder page uses the supplied portrait and public, supported biography only. No partnership, user-count, outcome, or accreditation claim is invented.

### External activation gates

The code cannot truthfully complete merchant onboarding, curriculum licensing, OAuth consent, email-domain reputation, human project review, certificate accreditation, or production load certification without the corresponding accounts, agreements, reviewers, secrets, and deployed infrastructure. Features that cross those boundaries expose a clear unavailable/pilot/coming-soon state rather than simulated success.

## Dependency audit note

`react-router-dom` is pinned to the newest registry release available during this update (`7.18.2`). npm's advisory feed still reports a React Server Components CSRF advisory for versions below a not-yet-published `8.3.0` release. This app is a Vite client-side SPA and does not use React Server Components or server actions, so that server-mode route is not active here. Keep monitoring the advisory and upgrade as soon as a fixed public release becomes available.
