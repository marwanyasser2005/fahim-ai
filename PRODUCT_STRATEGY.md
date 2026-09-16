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

# Fahim product strategy — Egypt, August 2026

## Positioning

Fahim should not compete as another lesson catalogue or teacher marketplace. Its strongest position is **the decision engine for the Egyptian learner**:

> Question → structured explanation → suitable video → trusted source → micro-quiz → next study action.

This removes the daily friction that learners face across disconnected videos, PDFs, chatbots, and official portals. The product promise is not “all content”; it is “the right next step, with evidence.”

## Core personas

### Mariam — the high-school learner

- 17, Thanaweya Amma science stream, studies mostly on her phone.
- Watches several teachers for the same concept and loses time deciding which explanation to trust.
- Needs a short Arabic path aligned to her grade, fast revision, captions, and a way to verify the curriculum source.
- Success: understands the concept, completes one applied question, and knows what to revise next within 30–45 minutes.

### Youssef — the STEM university learner

- 20, engineering or computing student; course terms are English but the difficult idea is clearer in Arabic.
- Needs bilingual terminology, practical examples, video discovery, and source links rather than a school-style content feed.
- Success: converts a concept into an application, summary, or short self-test without losing the English terminology.

### Salma — teacher or parent

- Wants transparency: where information came from, what the student did, and whether AI has sensible safety limits.
- Does not need another social feed; she needs progress evidence and routes to official material.
- Success: can see the learning goal, source, short assessment, and uncertainty flags.

## Competitor landscape

| Product | Strength | Where Fahim should differ |
|---|---|---|
| [Noon Academy](https://www.noonacademy.com/en-eg) | Social group learning, teachers, live interaction and challenges | Own the individual “best next step” across sources, not social classes |
| [Nagwa Egypt](https://www.nagwa.com/en/eg/) | Deep Egyptian curriculum catalogue in Arabic and English | Be source-agnostic and orchestrate Nagwa/official/video resources instead of recreating the catalogue |
| [Abwaab](https://abwaab.com/) | Animated lessons, question banks, mentors and exams | Win on Egyptian resource verification and a unified question-to-mastery flow |
| [Nafham AI](https://www.nafham-ai.com/) | AI tutoring for Egyptian secondary learners, including voice and practice | Differentiate with transparent source routing, video search and higher-education/STEM coverage |
| [iTutor Egypt](https://intrazero.com/en/solutions/ai-tutor-egypt) | Arabic-first tutoring, uploaded material, flashcards and LMS integration | Stay learner-first and lightweight, then add school integrations only after product-market fit |
| [Raskh](https://raskh.app/) | Turns learner files into summaries, cards, maps and audio | Focus on discovering and validating the right external resource before personal knowledge workflows |
| [Coligo](https://www.coligoedu.com/) | B2B school operating system with LMS and Arabic AI | Avoid competing on administration; provide a focused learner layer that can later integrate with schools |
| [Najmy](https://www.najmy.online/) | Arabic dialect and voice support | Prioritise Egyptian curriculum/source provenance and measurable study actions |

## Differentiation pillars

1. **Egypt-aware routing:** grade, subject, Egyptian official resource directory, Arabic-first video ranking.
2. **Evidence before confidence:** show original-source links, label AI clearly, and say when a claim needs verification.
3. **Active learning loop:** every explanation ends with a learner action or question, not endless chat.
4. **Bilingual STEM fluency:** Arabic clarity with preserved English technical terminology.
5. **Low-friction and low-bandwidth:** fast search, lazy images, concise answers, phone-first layout.
6. **Open-web orchestration:** link and attribute instead of copying paid books or full external articles.

## Practical roadmap

### Implemented in this version

- Gemini server function with model fallback, rate limiting, safety filters, and education-specific system instruction.
- YouTube educational search tuned for Egypt, Arabic relevance, strict SafeSearch, embeddable videos, and optional captions.
- Arabic/English Wikipedia concept search with short excerpts and original-article links.
- Official Egyptian resources directory, learning journey, full RTL/LTR support, and class-based dark mode.
- Security headers, secret separation, input limits, source attribution, and local graceful fallbacks.

### Next product experiments

1. Persist mastery locally first; measure completed “question → check” loops rather than page views.
2. Add a transparent video score: curriculum match, duration, captions, channel quality, and learner completion—not popularity alone.
3. Add source-grounded answers using an approved corpus of Ministry/EKB links; do not ingest copyrighted books without permission.
4. Add teacher-curated playlists and verified-source badges with an audit trail.
5. Add voice only after privacy, child-safety, and cost controls are tested.

## Research and API references

- [Gemini API pricing and free-tier models](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini text generation](https://ai.google.dev/gemini-api/docs/text-generation)
- [Gemini API key guidance](https://ai.google.dev/gemini-api/docs/generate-content/api-key)
- [Gemini safety settings](https://ai.google.dev/gemini-api/docs/safety-settings)
- [YouTube Data API search.list](https://developers.google.com/youtube/v3/docs/search/list)
- [YouTube Data API getting started and quotas](https://developers.google.com/youtube/v3/getting-started)
- [MediaWiki REST API search](https://www.mediawiki.org/wiki/API:REST_API/Reference)
- [MediaWiki CORS guidance](https://www.mediawiki.org/wiki/Manual:CORS/en)

## Success metrics

- North star: weekly completed learning loops (question + source/video + self-check).
- Activation: first loop completed within 10 minutes of first visit.
- Quality: useful-response rating, source-open rate, quiz-attempt rate, and correction rate.
- Safety: blocked abuse rate, personally identifying data reports, unsupported-citation reports, and API cost per completed loop.
