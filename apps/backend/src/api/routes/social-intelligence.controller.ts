import { Body, Controller, Post } from '@nestjs/common';
import { SocialIntelligenceService } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.service';
import { AuditSnapshot } from '@gitroom/nestjs-libraries/social-intelligence/social-intelligence.types';

@Controller('/social-intelligence')
export class SocialIntelligenceController {
  constructor(private readonly intelligence: SocialIntelligenceService) {}

  @Post('/audit/preview')
  previewAudit(@Body() snapshot: AuditSnapshot) {
    return this.intelligence.summarize(snapshot);
  }
}
