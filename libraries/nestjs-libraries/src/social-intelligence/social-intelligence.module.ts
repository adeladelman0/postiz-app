import { Module } from '@nestjs/common';
import { SocialIntelligenceService } from './social-intelligence.service';
import { SocialIntelligenceRepository } from './social-intelligence.repository';
import { SocialIntelligenceDatabase } from './social-intelligence.database';

@Module({
  providers: [
    SocialIntelligenceDatabase,
    SocialIntelligenceService,
    SocialIntelligenceRepository,
  ],
  exports: [SocialIntelligenceService, SocialIntelligenceRepository],
})
export class SocialIntelligenceModule {}
