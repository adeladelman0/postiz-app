import { Injectable } from '@nestjs/common';
import {
  AuditSnapshot,
  ContentObservation,
  MetricValue,
} from './social-intelligence.types';

@Injectable()
export class SocialIntelligenceService {
  private metric(content: ContentObservation, key: string): number {
    return content.metrics.find(
      (metric) => metric.key === key && metric.evidence === 'observed'
    )?.value ?? 0;
  }

  scoreContent(content: ContentObservation): number {
    const views = this.metric(content, 'views');
    const likes = this.metric(content, 'likes');
    const comments = this.metric(content, 'comments');
    const shares = this.metric(content, 'shares');
    const saves = this.metric(content, 'saves');

    return views + likes * 2 + comments * 4 + shares * 6 + saves * 6;
  }

  summarize(snapshot: AuditSnapshot) {
    const ranked = [...snapshot.content].sort(
      (a, b) => this.scoreContent(b) - this.scoreContent(a)
    );

    return {
      target: snapshot.target,
      capturedAt: snapshot.capturedAt,
      contentCount: snapshot.content.length,
      topContent: ranked.slice(0, 10),
      lowContent: ranked.slice(-10).reverse(),
      notes: snapshot.notes,
    };
  }

  observedMetric(
    key: string,
    value: number,
    observedAt = new Date().toISOString(),
    unit: MetricValue['unit'] = 'count'
  ): MetricValue {
    return { key, value, unit, evidence: 'observed', observedAt };
  }
}
