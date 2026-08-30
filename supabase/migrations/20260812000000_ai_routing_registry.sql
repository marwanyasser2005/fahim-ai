-- Operational registry for Fahim's provider-neutral AI routing layer.
-- Provider and model identifiers remain server-side; clients receive only Fahim engine status.

insert into public.api_registry (
  key, provider, service, purpose, learning_task, data_sent, data_received,
  cost_model, rate_limit, fallback, security_controls, retention, status
) values (
  'agent_router_gateway',
  'Agent Router',
  'OpenAI-compatible AI gateway',
  'Redundant educational generation route',
  'Tutor responses and formative quiz generation',
  'Minimum necessary learner prompt, recent context, and selected evidence excerpts',
  'Generated educational content and token accounting metadata',
  'Usage-based with a server-controlled quota',
  'Application entitlement plus distributed API rate limiting',
  'Direct Gemini route; never substitute canned educational content',
  'Server-only secret, HTTPS-only endpoint, authenticated users, origin checks, prompt-injection boundary, provider-neutral public responses',
  'Generation audit metadata follows the platform retention policy; secrets are never stored in application tables',
  'configured'
)
on conflict (key) do update set
  provider = excluded.provider,
  service = excluded.service,
  purpose = excluded.purpose,
  learning_task = excluded.learning_task,
  data_sent = excluded.data_sent,
  data_received = excluded.data_received,
  cost_model = excluded.cost_model,
  rate_limit = excluded.rate_limit,
  fallback = excluded.fallback,
  security_controls = excluded.security_controls,
  retention = excluded.retention,
  status = excluded.status;
