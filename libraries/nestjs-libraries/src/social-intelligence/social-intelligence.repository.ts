import { Injectable } from '@nestjs/common';
import { SocialIntelligenceDatabase } from './social-intelligence.database';
import { Prisma } from '@prisma/client';
import { CreateIdeaDto, CreatePlanDto } from './social-intelligence.dto';

@Injectable()
export class SocialIntelligenceRepository {
  constructor(private readonly prisma: SocialIntelligenceDatabase) {}

  async dashboard(organizationId: string) {
    const [brands, targets, audits, ideas, plans] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM brand_profiles WHERE organization_id = ${organizationId} ORDER BY created_at DESC`),
      this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM social_targets WHERE organization_id = ${organizationId} ORDER BY created_at DESC`),
      this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM audit_runs WHERE organization_id = ${organizationId} ORDER BY created_at DESC LIMIT 20`),
      this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM idea_bank WHERE organization_id = ${organizationId} ORDER BY created_at DESC LIMIT 100`),
      this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM content_plans WHERE organization_id = ${organizationId} ORDER BY created_at DESC LIMIT 20`),
    ]);
    return { brands, targets, audits, ideas, plans };
  }

  createBrand(organizationId: string, name: string, website?: string, industry?: string) {
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO brand_profiles (organization_id,name,website,industry)
      VALUES (${organizationId},${name},${website || null},${industry || null}) RETURNING *
    `);
  }

  createTarget(organizationId: string, input: { brandProfileId?: string; platform: string; profileUrl: string; handle?: string; source?: string; isCompetitor?: boolean; label?: string }) {
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO social_targets (organization_id,brand_profile_id,platform,profile_url,handle,source,is_competitor,label)
      VALUES (${organizationId},${input.brandProfileId || null},${input.platform},${input.profileUrl},${input.handle || null},${input.source || 'public'},${!!input.isCompetitor},${input.label || null}) RETURNING *
    `);
  }

  createIdea(organizationId: string, input: CreateIdeaDto) {
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO idea_bank (organization_id,brand_profile_id,title,goal,platform,format,hook,script,caption,cta,creative_brief,evidence)
      VALUES (${organizationId},${input.brandProfileId || null},${input.title},${input.goal || ''},${input.platform},${input.format || 'other'},${input.hook || ''},${input.script || null},${input.caption || null},${input.cta || null},${input.creativeBrief || null},${JSON.stringify(input.evidence || [])}::jsonb) RETURNING *
    `);
  }

  async createPlan(organizationId: string, input: CreatePlanDto) {
    const plan = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      INSERT INTO content_plans (organization_id,brand_profile_id,horizon_days,strategy_summary,starts_at)
      VALUES (${organizationId},${input.brandProfileId || null},${input.horizonDays},${input.strategySummary || ''},${new Date(input.startsAt)}) RETURNING *
    `);
    return plan[0];
  }
}
