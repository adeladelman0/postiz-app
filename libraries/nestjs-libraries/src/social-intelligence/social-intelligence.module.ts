import { Module } from '@nestjs/common';
import { SocialIntelligenceService } from './social-intelligence.service';
import { SocialIntelligenceRepository } from './social-intelligence.repository';
import { SocialIntelligenceDatabase } from './social-intelligence.database';
import { SocialIntelligenceAiService } from './social-intelligence.ai.service';

@Module({
  providers: [
    SocialIntelligenceDatabase,
    SocialIntelligenceService,
    SocialIntelligenceRepository,
    SocialIntelligenceAiService,
  ],
  exports: [
    SocialIntelligenceService,
    SocialIntelligenceRepository,
    SocialIntelligenceAiService,
  ],
})
export class SocialIntelligenceModule {}
