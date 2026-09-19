# Social Intelligence deployment configuration

## Runtime topology

Postiz is not a frontend-only deployment. A production install needs the core Postiz application runtime plus its scheduler dependencies.

Required core services:
- Postiz application (frontend + backend)
- Postiz orchestrator / Temporal workers
- PostgreSQL for the Postiz core schema (DATABASE_URL)
- Redis (REDIS_URL)
- Temporal (TEMPORAL_ADDRESS)
- Persistent or S3-compatible media storage

Social Intelligence adds:
- Dedicated Neon PostgreSQL database (SOCIAL_INTELLIGENCE_DATABASE_URL)
- Optional Ollama endpoint (OLLAMA_URL, OLLAMA_MODEL)
- Optional YouTube Data API server key (YOUTUBE_API_KEY) for official public YouTube competitor ingestion

SOCIAL_INTELLIGENCE_DATABASE_URL intentionally remains separate from the Postiz core DATABASE_URL. The Neon project created for Social Intelligence contains the intelligence tables only and must not be used as a replacement for the Postiz core database unless the full Postiz schema has also been initialized there.

## Required URLs

Set the normal Postiz public/internal URL variables for the chosen host:
- FRONTEND_URL
- NEXT_PUBLIC_BACKEND_URL
- BACKEND_INTERNAL_URL

## Provider credentials

Inject provider credentials at deployment time for each network that should be connectable through Postiz. Never commit social OAuth secrets, database connection strings, JWT secrets, storage credentials, or API keys.

Public competitor observations and connected-account private analytics are deliberately kept separate. Public analysis only stores metrics actually observed through an allowed source. Reach, impressions, saves, audience and other private metrics require an authorized account connection when the platform exposes them.

## AI

Ollama is optional. When it is reachable, Social Intelligence requests structured strategy/idea/planner output from the configured local model. If it is unavailable, the application returns a conservative local fallback rather than fabricating analytics.

## YouTube public competitor analysis

Set YOUTUBE_API_KEY to enable public YouTube channel/video ingestion through the official YouTube Data API. Other networks fall back to authorized account analytics or explicit observed-data import unless an official public-data integration is configured.
