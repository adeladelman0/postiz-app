import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class SocialIntelligenceRepository {
  constructor(private readonly prisma: PrismaRepository) {}

  async dashboard(organizationId: string) {
    const [brands, targets, audits, ideas, plans] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>('SELECT * FROM brand_profiles WHERE organization_id = $1 ORDER BY created_at DESC', organizationId),
      this.prisma.$queryRawUnsafe<any[]>('SELECT * FROM social_targets WHERE organization_id = $1 ORDER BY created_at DESC', organizationId),
      this.prisma.$queryRawUnsafe<any[]>('SELECT * FROM audit_runs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20', organizationId),
      this.prisma.$queryRawUnsafe<any[]>('SELECT * FROM idea_bank WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100', organizationId),
      this.prisma.$queryRawUnsafe<any[]>('SELECT * FROM content_plans WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20', organizationId),
    ]);
    return { brands, targets, audits, ideas, plans };
  }

  createBrand(organizationId: string, name: string, website?: string, industry?: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      'INSERT INTO brand_profiles (organization_id,name,website,industry) VALUES ($1,$2,$3,$4) RETURNING *',
      organizationId, name, website || null, industry || null
    );
  }

  createTarget(organizationId: string, input: { brandProfileId?: string; platform: string; profileUrl: string; handle?: string; source?: string; isCompetitor?: boolean; label?: string }) {
    return this.prisma.$queryRawUnsafe<any[]>(
      'INSERT INTO social_targets (organization_id,brand_profile_id,platform,profile_url,handle,source,is_competitor,label) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      organizationId, input.brandProfileId || null, input.platform, input.profileUrl, input.handle || null, input.source || 'public', !!input.isCompetitor, input.label || null
    );
  }

  createIdea(organizationId: string, input: any) {
    return this.prisma.$queryRawUnsafe<any[]>(
      'INSERT INTO idea_bank (organization_id,brand_profile_id,title,goal,platform,format,hook,script,caption,cta,creative_brief,evidence) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb) RETURNING *',
      organizationId, input.brandProfileId || null, input.title, input.goal || '', input.platform, input.format || 'other', input.hook || '', input.script || null, input.caption || null, input.cta || null, input.creativeBrief || null, JSON.stringify(input.evidence || [])
    );
  }

  async createPlan(organizationId: string, input: any) {
    const plan = await this.prisma.$queryRawUnsafe<any[]>(
      'INSERT INTO content_plans (organization_id,brand_profile_id,horizon_days,strategy_summary,starts_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      organizationId, input.brandProfileId || null, input.horizonDays, input.strategySummary || '', new Date(input.startsAt)
    );
    return plan[0];
  }
}
