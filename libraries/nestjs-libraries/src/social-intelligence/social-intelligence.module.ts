import { Module } from '@nestjs/common';
import { SocialIntelligenceService } from './social-intelligence.service';
import { SocialIntelligenceRepository } from './social-intelligence.repository';
import { SocialIntelligenceDatabase } from './social-intelligence.database';
import { SocialIntelligenceAiService } from './social-intelligence.ai.service';
import { SocialIntelligenceReportService } from './social-intelligence.report.service';
import { SocialIntelligencePublicDataService } from './social-intelligence.public-data.service';

@Module({
  providers: [
    SocialIntelligenceDatabase,
    SocialIntelligenceService,
    SocialIntelligenceRepository,
    SocialIntelligenceAiService,
    SocialIntelligenceReportService,
    SocialIntelligencePublicDataService,
  ],
  exports: [
    SocialIntelligenceService,
    SocialIntelligenceRepository,
    SocialIntelligenceAiService,
    SocialIntelligenceReportService,
    SocialIntelligencePublicDataService,
  ],
})
export class SocialIntelligenceModule {}
