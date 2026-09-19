# Neon production database

The Social Intelligence Platform uses a dedicated Neon PostgreSQL project.

- Project: Social Intelligence Platform
- Project ID: fragrant-lab-22442111
- Database: postiz
- Branch: main
- Branch ID: br-delicate-king-b1nh12vp
- Region: AWS EU Central 1

Set the privileged connection string only as the deployment secret `DATABASE_URL`. Never commit it.

Created intelligence tables:
brand_profiles, social_targets, audit_runs, content_snapshots, content_metrics,
content_strategies, idea_bank, content_plans, content_plan_items, approval_requests,
performance_snapshots, learning_insights.

The existing Postiz Prisma schema must remain the source of truth for Postiz core tables.
