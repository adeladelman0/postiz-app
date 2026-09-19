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

  derivePerformanceLearning(rows: any[]) {
    if (!rows.length) {
      return {
        insightType: 'performance-learning',
        insight: 'Not enough published performance evidence yet.',
        evidence: [],
        confidence: 0,
      };
    }

    const groups = new Map<string, { score: number; count: number; ids: string[] }>();
    for (const row of rows) {
      const metrics = row.metrics || {};
      const views = Number(metrics.views || 0);
      const likes = Number(metrics.likes || 0);
      const comments = Number(metrics.comments || 0);
      const shares = Number(metrics.shares || 0);
      const saves = Number(metrics.saves || 0);
      const interactions = likes + comments * 2 + shares * 3 + saves * 3;
      const score = views > 0 ? interactions / views : interactions;
      const key = [row.platform || 'unknown', row.format || 'other'].join(' / ');
      const current = groups.get(key) || { score: 0, count: 0, ids: [] };
      current.score += score;
      current.count += 1;
      current.ids.push(row.id);
      groups.set(key, current);
    }

    const ranked = [...groups.entries()]
      .map(([key, value]) => ({
        key,
        average: value.score / value.count,
        count: value.count,
        ids: value.ids,
      }))
      .sort((a, b) => b.average - a.average);

    const best = ranked[0];
    return {
      insightType: 'performance-learning',
      insight:
        best.count === 1
          ? `${best.key} currently has the strongest observed interaction score, based on one snapshot. Treat this as an early signal and test it again.`
          : `${best.key} has the strongest observed average interaction score across ${best.count} snapshots. Prioritize another controlled test before increasing its share of the plan.`,
      evidence: best.ids,
      confidence: Math.min(0.9, 0.35 + best.count * 0.08),
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
