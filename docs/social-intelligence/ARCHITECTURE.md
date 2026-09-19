# Social Intelligence Layer

This directory contains the product-specific intelligence layer built on top of Postiz.

## Scope

The first implementation phase is intentionally isolated from the existing scheduler and publishing core.

Modules:
- Social Audit: normalized public/connected account audits without inventing unavailable metrics.
- Competitors: competitor profiles, snapshots, outlier detection, and content-gap analysis.
- Strategy: evidence-backed content pillars, experiments, positioning notes, and recommendations.
- Idea Bank: reusable ideas tied to goals, platforms, formats, and evidence.
- Content Planner: 30/60/90-day plans with platform, format, hook, script, CTA, caption, creative brief, and planned time.
- Approval: idea -> production -> review -> approved -> scheduled -> published.
- Learning Loop: post-performance snapshots feed future planning.

## Data truth rules

1. Public URL audits only store metrics that are actually available publicly.
2. Private metrics such as reach, impressions, saves, and audience details require an authorized integration when the platform requires it.
3. Inferred values are stored separately from observed values and must include confidence/evidence metadata.
4. Recommendations are never presented as observed facts.

## Integration boundary

Postiz remains responsible for:
- authentication and organizations
- social integrations/OAuth
- media
- scheduling
- publishing
- existing analytics

The intelligence layer references the existing organization and publishing entities instead of duplicating them.

## Delivery phases

1. Foundation and schema
2. Audit ingestion and normalization
3. Competitor snapshots/outliers
4. Strategy + idea generation
5. 30/60/90-day planner
6. Approval -> existing Postiz scheduler
7. Analytics feedback loop
8. QA, retries, observability and production hardening
