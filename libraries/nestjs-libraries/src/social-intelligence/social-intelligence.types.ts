export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'other';

export type DataSourceKind = 'public' | 'connected' | 'imported';
export type EvidenceKind = 'observed' | 'inferred' | 'recommended';

export interface MetricValue {
  key: string;
  value: number;
  unit?: 'count' | 'percent' | 'seconds' | 'ratio';
  evidence: EvidenceKind;
  confidence?: number;
  observedAt: string;
}

export interface SocialProfileTarget {
  platform: SocialPlatform;
  profileUrl: string;
  handle?: string;
  externalId?: string;
  source: DataSourceKind;
}

export interface ContentObservation {
  externalId: string;
  url?: string;
  publishedAt?: string;
  format?: 'image' | 'carousel' | 'video' | 'short' | 'story' | 'text' | 'other';
  text?: string;
  metrics: MetricValue[];
  topics?: string[];
  hook?: string;
  cta?: string;
}

export interface AuditSnapshot {
  target: SocialProfileTarget;
  capturedAt: string;
  profileMetrics: MetricValue[];
  content: ContentObservation[];
  notes: string[];
}

export interface CompetitorSnapshot extends AuditSnapshot {
  label?: string;
  outlierScore?: number;
}

export type IdeaStatus =
  | 'idea'
  | 'production'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published';

export interface ContentIdea {
  title: string;
  goal: string;
  platform: SocialPlatform;
  format: string;
  hook: string;
  script?: string;
  caption?: string;
  cta?: string;
  creativeBrief?: string;
  status: IdeaStatus;
  evidence: string[];
}

export interface PlannedContent extends ContentIdea {
  plannedAt: string;
  timezone: string;
}

export interface ContentPlan {
  horizonDays: 30 | 60 | 90;
  generatedAt: string;
  strategySummary: string;
  items: PlannedContent[];
}
