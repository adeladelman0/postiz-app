# Neon production databases

The deployment uses two separate Neon PostgreSQL projects so the Postiz core schema and the Social Intelligence evidence store can evolve independently.

## Postiz core

- Project: Postiz Core Platform
- Project ID: rapid-sunset-97517539
- Database: postiz
- Region: AWS EU Central 1

Use this project's privileged connection string only as the deployment secret DATABASE_URL. The Postiz Prisma schema remains the source of truth for this database and is initialized by the Postiz deployment process.

## Social Intelligence

- Project: Social Intelligence Platform
- Project ID: fragrant-lab-22442111
- Database: postiz
- Branch: main
- Branch ID: br-delicate-king-b1nh12vp
- Region: AWS EU Central 1

Use this project's privileged connection string only as the deployment secret SOCIAL_INTELLIGENCE_DATABASE_URL. Never commit either connection string.

Created intelligence tables:
brand_profiles, social_targets, audit_runs, content_snapshots, content_metrics, content_strategies, idea_bank, content_plans, content_plan_items, approval_requests, performance_snapshots, learning_insights.

The reproducible intelligence schema is stored in docs/social-intelligence/schema.sql.
