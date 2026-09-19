import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export const socialPlatforms = [
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'linkedin',
  'x',
  'threads',
  'other',
] as const;

export const ideaStatuses = [
  'idea',
  'production',
  'review',
  'approved',
  'scheduled',
  'published',
] as const;

export class CreateBrandDto {
  @IsString() name!: string;
  @IsOptional() @IsUrl({ require_tld: false }) website?: string;
  @IsOptional() @IsString() industry?: string;
}

export class CreateSocialTargetDto {
  @IsOptional() @IsString() brandProfileId?: string;
  @IsIn(socialPlatforms) platform!: string;
  @IsUrl({ require_tld: false }) profileUrl!: string;
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsIn(['public', 'connected', 'imported']) source?: string;
  @IsOptional() @IsBoolean() isCompetitor?: boolean;
  @IsOptional() @IsString() label?: string;
}

export class CreateIdeaDto {
  @IsOptional() @IsString() brandProfileId?: string;
  @IsString() title!: string;
  @IsOptional() @IsString() goal?: string;
  @IsIn(socialPlatforms) platform!: string;
  @IsOptional() @IsString() format?: string;
  @IsOptional() @IsString() hook?: string;
  @IsOptional() @IsString() script?: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() cta?: string;
  @IsOptional() @IsString() creativeBrief?: string;
  @IsOptional() @IsArray() evidence?: string[];
}

export class UpdateIdeaStatusDto {
  @IsIn(ideaStatuses) status!: string;
}

export class CreatePlanDto {
  @IsOptional() @IsString() brandProfileId?: string;
  @Type(() => Number) @IsInt() @IsIn([30, 60, 90]) horizonDays!: 30 | 60 | 90;
  @IsOptional() @IsString() strategySummary?: string;
  @IsString() startsAt!: string;
}

export class CreateAuditRunDto {
  @IsString() targetId!: string;
  @IsOptional() @IsIn(['pending', 'running', 'completed', 'failed']) status?: string;
  @IsOptional() @IsObject() summary?: Record<string, unknown>;
  @IsOptional() @IsArray() notes?: unknown[];
}

export class CreateStrategyDto {
  @IsString() brandProfileId!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsArray() pillars?: unknown[];
  @IsOptional() @IsArray() recommendations?: unknown[];
  @IsOptional() @IsArray() evidence?: unknown[];
}

export class CreatePlanItemDto {
  @IsString() planId!: string;
  @IsOptional() @IsString() ideaId?: string;
  @IsString() plannedAt!: string;
  @IsOptional() @IsString() timezone?: string;
  @IsIn(socialPlatforms) platform!: string;
  @IsOptional() @IsString() format?: string;
  @IsOptional() @IsString() hook?: string;
  @IsOptional() @IsString() script?: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() cta?: string;
  @IsOptional() @IsString() creativeBrief?: string;
  @IsOptional() @IsIn(ideaStatuses) status?: string;
}

export class CreateApprovalRequestDto {
  @IsString() planItemId!: string;
  @IsOptional() @IsString() message?: string;
}

export class DecideApprovalDto {
  @IsIn(['approved', 'changes_requested', 'rejected']) status!: string;
  @IsOptional() @IsString() message?: string;
}

export class CreatePerformanceSnapshotDto {
  @IsOptional() @IsString() planItemId?: string;
  @IsString() postizPostId!: string;
  @IsIn(socialPlatforms) platform!: string;
  @IsObject() metrics!: Record<string, unknown>;
  @IsOptional() @IsString() observedAt?: string;
}

export class CreateLearningInsightDto {
  @IsString() brandProfileId!: string;
  @IsString() insightType!: string;
  @IsString() insight!: string;
  @IsOptional() @IsArray() evidence?: unknown[];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1) confidence?: number;
}
