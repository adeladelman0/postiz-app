import { Module } from '@nestjs/common';
import { SocialIntelligenceService } from './social-intelligence.service';
import { SocialIntelligenceRepository } from './social-intelligence.repository';

@Module({
  providers: [SocialIntelligenceService, SocialIntelligenceRepository],
  exports: [SocialIntelligenceService, SocialIntelligenceRepository],
})
export class SocialIntelligenceModule {}
