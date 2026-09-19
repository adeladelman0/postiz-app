import { Module } from '@nestjs/common';
import { SocialIntelligenceService } from './social-intelligence.service';
import { SocialIntelligenceRepository } from './social-intelligence.repository';
import { SocialIntelligenceDatabase } from './social-intelligence.database';
import { SocialIntelligenceAiService } from './social-intelligence.ai.service';
import { SocialIntelligenceReportService } from './social-intelligence.report.service';

@Module({
  providers: [
    SocialIntelligenceDatabase,
    SocialIntelligenceService,
    SocialIntelligenceRepository,
    SocialIntelligenceAiService,
    SocialIntelligenceReportService,
  ],
  exports: [
    SocialIntelligenceService,
    SocialIntelligenceRepository,
    SocialIntelligenceAiService,
    SocialIntelligenceReportService,
  ],
})
export class SocialIntelligenceModule {}
