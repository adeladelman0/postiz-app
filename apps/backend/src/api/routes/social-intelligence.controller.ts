import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Organization, User } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { SocialIntelligenceService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.service';
import { SocialIntelligenceRepository } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.repository';
import { SocialIntelligenceAiService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.ai.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
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
    private readonly integrations: IntegrationService
  ) {}

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

  @Post('/performance')
  createPerformance(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreatePerformanceSnapshotDto
  ) {
    return this.repository.createPerformance(org.id, body);
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
