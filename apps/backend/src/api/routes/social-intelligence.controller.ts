import { Body, Controller, Get, Post } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { SocialIntelligenceService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.service';
import { SocialIntelligenceRepository } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.repository';
import { AuditSnapshot } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.types';

@Controller('/social-intelligence')
export class SocialIntelligenceController {
  constructor(
    private readonly intelligence: SocialIntelligenceService,
    private readonly repository: SocialIntelligenceRepository
  ) {}

  @Get('/dashboard')
  dashboard(@GetOrgFromRequest() org: Organization) {
    return this.repository.dashboard(org.id);
  }

  @Post('/brands')
  createBrand(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { name: string; website?: string; industry?: string }
  ) {
    return this.repository.createBrand(org.id, body.name, body.website, body.industry);
  }

  @Post('/targets')
  createTarget(@GetOrgFromRequest() org: Organization, @Body() body: any) {
    return this.repository.createTarget(org.id, body);
  }

  @Post('/ideas')
  createIdea(@GetOrgFromRequest() org: Organization, @Body() body: any) {
    return this.repository.createIdea(org.id, body);
  }

  @Post('/plans')
  createPlan(@GetOrgFromRequest() org: Organization, @Body() body: any) {
    return this.repository.createPlan(org.id, body);
  }

  @Post('/audit/preview')
  previewAudit(@Body() snapshot: AuditSnapshot) {
    return this.intelligence.summarize(snapshot);
  }
}
