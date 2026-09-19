import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SocialIntelligenceDatabase } from './social-intelligence.database';
import {
  CreateApprovalRequestDto,
  CreateAuditRunDto,
  CreateIdeaDto,
  CreateLearningInsightDto,
  CreatePerformanceSnapshotDto,
  LinkPostizPostDto,
  CreatePlanDto,
  CreatePlanItemDto,
  CreateStrategyDto,
  CreateSocialTargetDto,
  DecideApprovalDto,
} from './social-intelligence.dto';

@Injectable()
export class SocialIntelligenceRepository {
  constructor(private readonly prisma: SocialIntelligenceDatabase) {}

  async dashboard(organizationId: string) {
    const [
      brands,
      targets,
      audits,
      strategies,
      ideas,
      plans,
      planItems,
      approvals,
      performance,
      insights,
    ] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM brand_profiles
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM social_targets
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM audit_runs
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC LIMIT 50
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM content_strategies
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC LIMIT 50
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM idea_bank
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC LIMIT 250
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM content_plans
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC LIMIT 50
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT i.*
        FROM content_plan_items i
        JOIN content_plans p ON p.id = i.plan_id
        WHERE p.organization_id = ${organizationId}
        ORDER BY i.planned_at ASC LIMIT 500
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM approval_requests
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC LIMIT 100
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM performance_snapshots
        WHERE organization_id = ${organizationId}
        ORDER BY observed_at DESC LIMIT 250
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM learning_insights
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC LIMIT 100
      `),
    ]);

    return {
      brands,
      targets,
      audits,
      strategies,
      ideas,
      plans,
      planItems,
      approvals,
      performance,
      insights,
    };
  }

  async createBrand(
    organizationId: string,
    name: string,
    website?: string,
    industry?: string
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO brand_profiles (organization_id,name,website,industry)
      VALUES (${organizationId},${name},${website || null},${industry || null})
      RETURNING *
    `);
    return rows[0];
  }

  async createTarget(organizationId: string, input: CreateSocialTargetDto) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO social_targets
        (organization_id,brand_profile_id,platform,profile_url,handle,source,is_competitor,label)
      VALUES (
        ${organizationId},
        ${input.brandProfileId || null},
        ${input.platform},
        ${input.profileUrl},
        ${input.handle || null},
        ${input.source || 'public'},
        ${!!input.isCompetitor},
        ${input.label || null}
      )
      RETURNING *
    `);
    return rows[0];
  }

  async upsertConnectedTarget(
    organizationId: string,
    input: {
      platform: string;
      integrationId: string;
      name?: string | null;
      profile?: string | null;
    }
  ) {
    const normalizedPlatform = input.platform.split('-')[0];
    const existing = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM social_targets
      WHERE organization_id = ${organizationId}
        AND external_id = ${input.integrationId}
        AND source = 'connected'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    if (existing[0]) return existing[0];

    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO social_targets
        (organization_id,platform,profile_url,handle,external_id,source,is_competitor,label)
      VALUES (
        ${organizationId},
        ${normalizedPlatform},
        ${'postiz://integration/' + input.integrationId},
        ${input.profile || null},
        ${input.integrationId},
        'connected',
        false,
        ${input.name || input.profile || normalizedPlatform}
      )
      RETURNING *
    `);
    return rows[0] || null;
  }

  async createConnectedAudit(
    organizationId: string,
    targetId: string,
    analytics: unknown[],
    days: number
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO audit_runs
        (organization_id,target_id,status,captured_at,summary,notes)
      VALUES (
        ${organizationId},
        ${targetId}::uuid,
        'completed',
        NOW(),
        ${JSON.stringify({
          kind: 'connected-account-analytics',
          days,
          analytics,
        })}::jsonb,
        ${JSON.stringify([
          'Authorized connected-account analytics imported from Postiz.',
        ])}::jsonb
      )
      RETURNING *
    `);
    return rows[0];
  }

  async createAudit(organizationId: string, input: CreateAuditRunDto) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO audit_runs
        (organization_id,target_id,status,captured_at,summary,notes)
      VALUES (
        ${organizationId},
        ${input.targetId},
        ${input.status || 'completed'},
        NOW(),
        ${JSON.stringify(input.summary || {})}::jsonb,
        ${JSON.stringify(input.notes || [])}::jsonb
      )
      RETURNING *
    `);
    return rows[0];
  }

  async createStrategy(organizationId: string, input: CreateStrategyDto) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO content_strategies
        (organization_id,brand_profile_id,title,summary,pillars,recommendations,evidence)
      VALUES (
        ${organizationId},
        ${input.brandProfileId},
        ${input.title},
        ${input.summary || ''},
        ${JSON.stringify(input.pillars || [])}::jsonb,
        ${JSON.stringify(input.recommendations || [])}::jsonb,
        ${JSON.stringify(input.evidence || [])}::jsonb
      )
      RETURNING *
    `);
    return rows[0];
  }

  async createIdea(organizationId: string, input: CreateIdeaDto) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO idea_bank
        (organization_id,brand_profile_id,title,goal,platform,format,hook,script,caption,cta,creative_brief,evidence)
      VALUES (
        ${organizationId},
        ${input.brandProfileId || null},
        ${input.title},
        ${input.goal || ''},
        ${input.platform},
        ${input.format || 'other'},
        ${input.hook || ''},
        ${input.script || null},
        ${input.caption || null},
        ${input.cta || null},
        ${input.creativeBrief || null},
        ${JSON.stringify(input.evidence || [])}::jsonb
      )
      RETURNING *
    `);
    return rows[0];
  }

  async updateIdeaStatus(
    organizationId: string,
    ideaId: string,
    status: string
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      UPDATE idea_bank
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${ideaId}::uuid AND organization_id = ${organizationId}
      RETURNING *
    `);
    return rows[0] || null;
  }

  async createPlan(organizationId: string, input: CreatePlanDto) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO content_plans
        (organization_id,brand_profile_id,horizon_days,strategy_summary,starts_at)
      VALUES (
        ${organizationId},
        ${input.brandProfileId || null},
        ${input.horizonDays},
        ${input.strategySummary || ''},
        ${new Date(input.startsAt)}
      )
      RETURNING *
    `);
    return rows[0];
  }

  async createPlanItem(organizationId: string, input: CreatePlanItemDto) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO content_plan_items
        (plan_id,idea_id,planned_at,timezone,platform,format,hook,script,caption,cta,creative_brief,status)
      SELECT
        p.id,
        ${input.ideaId || null}::uuid,
        ${new Date(input.plannedAt)},
        ${input.timezone || 'UTC'},
        ${input.platform},
        ${input.format || 'other'},
        ${input.hook || ''},
        ${input.script || null},
        ${input.caption || null},
        ${input.cta || null},
        ${input.creativeBrief || null},
        ${input.status || 'idea'}
      FROM content_plans p
      WHERE p.id = ${input.planId}::uuid
        AND p.organization_id = ${organizationId}
      RETURNING *
    `);
    return rows[0] || null;
  }

  async linkPlanItemToPostiz(
    organizationId: string,
    planItemId: string,
    input: LinkPostizPostDto
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      UPDATE content_plan_items i
      SET
        postiz_post_id = ${input.postizPostId},
        status = ${input.status || 'approved'},
        updated_at = NOW()
      FROM content_plans p
      WHERE i.id = ${planItemId}::uuid
        AND p.id = i.plan_id
        AND p.organization_id = ${organizationId}
      RETURNING i.*
    `);
    return rows[0] || null;
  }

  async createApproval(
    organizationId: string,
    input: CreateApprovalRequestDto
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO approval_requests
        (organization_id,plan_item_id,status,message)
      SELECT
        ${organizationId},
        i.id,
        'pending',
        ${input.message || null}
      FROM content_plan_items i
      JOIN content_plans p ON p.id = i.plan_id
      WHERE i.id = ${input.planItemId}::uuid
        AND p.organization_id = ${organizationId}
      RETURNING *
    `);
    return rows[0] || null;
  }

  async decideApproval(
    organizationId: string,
    reviewerId: string,
    approvalId: string,
    input: DecideApprovalDto
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      UPDATE approval_requests
      SET
        status = ${input.status},
        reviewer_id = ${reviewerId},
        message = ${input.message || null},
        decided_at = NOW(),
        updated_at = NOW()
      WHERE id = ${approvalId}::uuid
        AND organization_id = ${organizationId}
      RETURNING *
    `);
    return rows[0] || null;
  }

  async createPerformance(
    organizationId: string,
    input: CreatePerformanceSnapshotDto
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO performance_snapshots
        (organization_id,plan_item_id,postiz_post_id,platform,metrics,observed_at)
      VALUES (
        ${organizationId},
        ${input.planItemId || null}::uuid,
        ${input.postizPostId},
        ${input.platform},
        ${JSON.stringify(input.metrics)}::jsonb,
        ${input.observedAt ? new Date(input.observedAt) : new Date()}
      )
      RETURNING *
    `);
    return rows[0];
  }

  performanceForBrand(organizationId: string, brandProfileId: string) {
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        ps.id,
        ps.platform,
        ps.metrics,
        ps.observed_at,
        i.format,
        i.status,
        i.postiz_post_id
      FROM performance_snapshots ps
      LEFT JOIN content_plan_items i ON i.id = ps.plan_item_id
      LEFT JOIN content_plans p ON p.id = i.plan_id
      WHERE ps.organization_id = ${organizationId}
        AND p.brand_profile_id = ${brandProfileId}::uuid
      ORDER BY ps.observed_at DESC
      LIMIT 500
    `);
  }

  async createInsight(
    organizationId: string,
    input: CreateLearningInsightDto
  ) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO learning_insights
        (organization_id,brand_profile_id,insight_type,insight,evidence,confidence)
      VALUES (
        ${organizationId},
        ${input.brandProfileId},
        ${input.insightType},
        ${input.insight},
        ${JSON.stringify(input.evidence || [])}::jsonb,
        ${input.confidence ?? null}
      )
      RETURNING *
    `);
    return rows[0];
  }
}
