import { Module } from '@nestjs/common';
import { SocialIntelligenceService } from './social-intelligence.service';

@Module({
  providers: [SocialIntelligenceService],
  exports: [SocialIntelligenceService],
})
export class SocialIntelligenceModule {}
