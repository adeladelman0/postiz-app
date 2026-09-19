# Social Intelligence deployment configuration

Required core infrastructure:
- PostgreSQL: dedicated Neon project (configured through DATABASE_URL)
- Redis: required by Postiz core
- Temporal: required by Postiz workers/scheduling
- Public frontend/backend URLs: follow the existing Postiz deployment configuration

Never commit DATABASE_URL or provider client secrets.

Provider credentials should be injected at deployment time for Meta, TikTok and YouTube.
Public competitor data and connected-account private analytics must remain distinct.
