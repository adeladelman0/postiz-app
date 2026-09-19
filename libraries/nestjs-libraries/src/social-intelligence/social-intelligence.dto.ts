import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, Min, ValidateNested } from 'class-validator';

const platforms = ['facebook','instagram','tiktok','youtube','linkedin','x','threads','other'] as const;

export class CreateBrandDto {
  @IsString() name!: string;
  @IsOptional() @IsUrl({ require_tld: false }) website?: string;
  @IsOptional() @IsString() industry?: string;
}

export class CreateSocialTargetDto {
  @IsOptional() @IsString() brandProfileId?: string;
  @IsIn(platforms) platform!: string;
  @IsUrl({ require_tld: false }) profileUrl!: string;
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsIn(['public','connected','imported']) source?: string;
  @IsOptional() @IsBoolean() isCompetitor?: boolean;
  @IsOptional() @IsString() label?: string;
}

export class CreateIdeaDto {
  @IsOptional() @IsString() brandProfileId?: string;
  @IsString() title!: string;
  @IsOptional() @IsString() goal?: string;
  @IsIn(platforms) platform!: string;
  @IsOptional() @IsString() format?: string;
  @IsOptional() @IsString() hook?: string;
  @IsOptional() @IsString() script?: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() cta?: string;
  @IsOptional() @IsString() creativeBrief?: string;
  @IsOptional() @IsArray() evidence?: string[];
}

export class CreatePlanDto {
  @IsOptional() @IsString() brandProfileId?: string;
  @Type(() => Number) @IsInt() @IsIn([30,60,90]) horizonDays!: 30 | 60 | 90;
  @IsOptional() @IsString() strategySummary?: string;
  @IsString() startsAt!: string;
}
