import { Body, Controller, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { Organization, User } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { SocialIntelligenceService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.service';
import { SocialIntelligenceRepository } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.repository';
import { SocialIntelligenceAiService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.ai.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { SocialIntelligenceReportService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.report.service';
import { Response } from 'express';
import { AuditSnapshot } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.types';
import {
  CreateApprovalRequestDto,
  CreateAuditRunDto,
  CreateBrandDto,
  CreateIdeaDto,
  CreateLearningInsightDto,
  CreatePerformanceSnapshotDto,
  CreatePlanDto,
  CreatePlanItemDto,
  CreateSocialTargetDto,
  CreateStrategyDto,
  DecideApprovalDto,
  GenerateIdeasDto,
  GeneratePlanDto,
  GenerateStrategyDto,
  LinkPostizPostDto,
  SyncConnectedAuditDto,
  UpdateIdeaStatusDto,
} from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.dto';

@Controller('/social-intelligence')
export class SocialIntelligenceController {
  constructor(
    private readonly intelligence: SocialIntelligenceService,
    private readonly repository: SocialIntelligenceRepository,
    private readonly ai: SocialIntelligenceAiService,
    private readonly integrations: IntegrationService,
    private readonly posts: PostsService,
    private readonly reports: SocialIntelligenceReportService
  ) {}

  @Get('/report.pdf')
  async report(
    @GetOrgFromRequest() org: Organization,
    @Res({ passthrough: false }) res: Response
  ) {
    const data = await this.repository.dashboard(org.id);
    const pdf = this.reports.createDashboardReport(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="social-intelligence-report.pdf"'
    );
    res.end(pdf);
  }

  @Get('/dashboard')
  dashboard(@GetOrgFromRequest() org: Organization) {
    return this.repository.dashboard(org.id);
  }

  @Post('/brands')
  createBrand(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateBrandDto
  ) {
    return this.repository.createBrand(
      org.id,
      body.name,
      body.website,
      body.industry
    );
  }

  @Post('/targets')
  createTarget(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateSocialTargetDto
  ) {
    return this.repository.createTarget(org.id, body);
  }

  @Get('/competitors/outliers')
  competitorOutliers(@GetOrgFromRequest() org: Organization) {
    return this.repository.competitorOutliers(org.id);
  }

  @Post('/targets/:targetId/observations')
  async ingestObservations(
    @GetOrgFromRequest() org: Organization,
    @Param('targetId') targetId: string,
    @Body() snapshot: AuditSnapshot
  ) {
    const summary = this.intelligence.summarize(snapshot);
    return this.repository.ingestAuditSnapshot(
      org.id,
      targetId,
      snapshot,
      summary
    );
  }

  @Post('/connected/:integrationId/audit')
  async syncConnectedAudit(
    @GetOrgFromRequest() org: Organization,
    @Param('integrationId') integrationId: string,
    @Body() body: SyncConnectedAuditDto
  ) {
    const integration = await this.integrations.getIntegrationById(
      org.id,
      integrationId
    );
    if (!integration) {
      return null;
    }
    const analytics = await this.integrations.checkAnalytics(
      org,
      integrationId,
      String(body.days)
    );
    const target = await this.repository.upsertConnectedTarget(org.id, {
      platform: integration.providerIdentifier,
      integrationId: integration.id,
      name: integration.name,
      profile: integration.profile,
    });
    if (!target) {
      return null;
    }
    return this.repository.createConnectedAudit(
      org.id,
      target.id,
      analytics,
      body.days
    );
  }

  @Post('/audits')
  createAudit(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateAuditRunDto
  ) {
    return this.repository.createAudit(org.id, body);
  }

  @Post('/strategies')
  createStrategy(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateStrategyDto
  ) {
    return this.repository.createStrategy(org.id, body);
  }

  @Post('/ideas')
  createIdea(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateIdeaDto
  ) {
    return this.repository.createIdea(org.id, body);
  }

  @Patch('/ideas/:id/status')
  updateIdeaStatus(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateIdeaStatusDto
  ) {
    return this.repository.updateIdeaStatus(org.id, id, body.status);
  }

  @Post('/plans')
  createPlan(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreatePlanDto
  ) {
    return this.repository.createPlan(org.id, body);
  }

  @Post('/plan-items')
  createPlanItem(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreatePlanItemDto
  ) {
    return this.repository.createPlanItem(org.id, body);
  }

  @Patch('/plan-items/:id/postiz')
  linkPlanItemToPostiz(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: LinkPostizPostDto
  ) {
    return this.repository.linkPlanItemToPostiz(org.id, id, body);
  }

  @Post('/approvals')
  createApproval(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateApprovalRequestDto
  ) {
    return this.repository.createApproval(org.id, body);
  }

  @Patch('/approvals/:id')
  decideApproval(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string,
    @Body() body: DecideApprovalDto
  ) {
    return this.repository.decideApproval(org.id, user.id, id, body);
  }

  @Post('/performance/sync/:planItemId')
  async syncPerformance(
    @GetOrgFromRequest() org: Organization,
    @Param('planItemId') planItemId: string,
    @Body() body: SyncConnectedAuditDto
  ) {
    const item = await this.repository.getPlanItem(org.id, planItemId);
    if (!item?.postiz_post_id) {
      return null;
    }

    const analytics = await this.posts.checkPostAnalytics(
      org.id,
      item.postiz_post_id,
      body.days
    );
    if (!Array.isArray(analytics)) {
      return analytics;
    }

    const metrics = analytics.reduce((all: Record<string, number>, metric: any) => {
      const key = String(metric.label || 'metric')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      const points = Array.isArray(metric.data) ? metric.data : [];
      const latest = points[points.length - 1];
      all[key] = Number(latest?.total || 0);
      return all;
    }, {});

    return this.repository.createPerformance(org.id, {
      planItemId,
      postizPostId: item.postiz_post_id,
      platform: item.platform,
      metrics,
      observedAt: new Date().toISOString(),
    });
  }

  @Post('/performance')
  createPerformance(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreatePerformanceSnapshotDto
  ) {
    return this.repository.createPerformance(org.id, body);
  }

  @Post('/learning/:brandProfileId/recompute')
  async recomputeLearning(
    @GetOrgFromRequest() org: Organization,
    @Param('brandProfileId') brandProfileId: string
  ) {
    const performance = await this.repository.performanceForBrand(
      org.id,
      brandProfileId
    );
    const learning = this.intelligence.derivePerformanceLearning(performance);
    return this.repository.createInsight(org.id, {
      brandProfileId,
      insightType: learning.insightType,
      insight: learning.insight,
      evidence: learning.evidence,
      confidence: learning.confidence,
    });
  }

  @Post('/insights')
  createInsight(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateLearningInsightDto
  ) {
    return this.repository.createInsight(org.id, body);
  }

  @Post('/generate/strategy')
  generateStrategy(@Body() body: GenerateStrategyDto) {
    return this.ai.generateStrategy(body);
  }

  @Post('/generate/ideas')
  generateIdeas(@Body() body: GenerateIdeasDto) {
    return this.ai.generateIdeas(body);
  }

  @Post('/generate/plan')
  generatePlan(@Body() body: GeneratePlanDto) {
    return this.ai.generatePlan(body);
  }

  @Post('/audit/preview')
  previewAudit(@Body() snapshot: AuditSnapshot) {
    return this.intelligence.summarize(snapshot);
  }
}
