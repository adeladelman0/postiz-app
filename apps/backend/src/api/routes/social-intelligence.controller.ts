import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SocialIntelligenceService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.service';
import { SocialIntelligenceRepository } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.repository';
import { AuditSnapshot } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.types';

@Controller('/social-intelligence')
export class SocialIntelligenceController {
  constructor(private readonly intelligence: SocialIntelligenceService, private readonly repository: SocialIntelligenceRepository) {}
  private org(req: any) { return req.user?.orgId || req.user?.organizationId || req.headers['x-organization-id']; }
  @Get('/dashboard') dashboard(@Req() req: any) { return this.repository.dashboard(this.org(req)); }
  @Post('/brands') createBrand(@Req() req: any, @Body() body: any) { return this.repository.createBrand(this.org(req), body.name, body.website, body.industry); }
  @Post('/targets') createTarget(@Req() req: any, @Body() body: any) { return this.repository.createTarget(this.org(req), body); }
  @Post('/ideas') createIdea(@Req() req: any, @Body() body: any) { return this.repository.createIdea(this.org(req), body); }
  @Post('/plans') createPlan(@Req() req: any, @Body() body: any) { return this.repository.createPlan(this.org(req), body); }
  @Post('/audit/preview') previewAudit(@Body() snapshot: AuditSnapshot) { return this.intelligence.summarize(snapshot); }
}
