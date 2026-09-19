import { Injectable } from '@nestjs/common';
import {
  GenerateIdeasDto,
  GeneratePlanDto,
  GenerateStrategyDto,
} from './social-intelligence.dto';

type GenerationResult<T> = {
  provider: 'ollama' | 'fallback';
  model?: string;
  data: T;
};

@Injectable()
export class SocialIntelligenceAiService {
  private readonly endpoint =
    process.env.OLLAMA_URL?.replace(/\/$/, '') || 'http://127.0.0.1:11434';
  private readonly model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

  private async generateJson<T>(
    instruction: string,
    fallback: T
  ): Promise<GenerationResult<T>> {
    try {
      const response = await fetch(this.endpoint + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: 'json',
          prompt:
            'You are a social media strategist. Never invent metrics, reach, impressions, audience facts, competitor facts, or results. Only use evidence supplied in the request. Clearly frame anything not directly evidenced as a recommendation. Return valid JSON only.\n\n' +
            instruction,
        }),
      });

      if (!response.ok) {
        throw new Error('Ollama request failed');
      }

      const payload = (await response.json()) as { response?: string };
      if (!payload.response) {
        throw new Error('Ollama returned no response');
      }

      return {
        provider: 'ollama',
        model: this.model,
        data: JSON.parse(payload.response) as T,
      };
    } catch {
      return { provider: 'fallback', data: fallback };
    }
  }

  generateStrategy(input: GenerateStrategyDto) {
    const fallback = {
      title: input.goal
        ? `${input.brandName}: ${input.goal}`
        : `${input.brandName} content strategy`,
      summary:
        'Strategy draft based only on supplied evidence. Add connected-account analytics for stronger recommendations.',
      pillars: ['Educate', 'Demonstrate value', 'Build trust'],
      recommendations: [
        'Test multiple hooks while keeping the topic constant.',
        'Reuse proven topics across short-form and static formats.',
        'Review observed performance weekly before changing cadence.',
      ],
      evidence: input.evidence || [],
    };

    return this.generateJson(
      `Create a social media strategy for ${input.brandName}.
Goal: ${input.goal || 'not specified'}
Observed evidence: ${JSON.stringify(input.evidence || [])}
Competitor observations: ${JSON.stringify(input.competitors || [])}
Return an object with title, summary, pillars (array), recommendations (array), evidence (array). Recommendations must be explicit recommendations, not claimed facts.`,
      fallback
    );
  }

  generateIdeas(input: GenerateIdeasDto) {
    const count = input.count || 12;
    const pillars = input.pillars?.length
      ? input.pillars
      : ['Educate', 'Demonstrate value', 'Build trust'];

    const fallback = {
      ideas: Array.from({ length: count }).map((_, index) => {
        const pillar = pillars[index % pillars.length];
        return {
          title: `${pillar} idea ${index + 1}`,
          goal: input.goal || 'engagement',
          platform: 'instagram',
          format: index % 2 === 0 ? 'short' : 'carousel',
          hook: `A clear ${pillar.toLowerCase()} hook for ${input.brandName}`,
          script:
            'Open with the hook, explain one useful point, show proof or an example, then end with one clear next step.',
          caption:
            'Draft caption. Adapt wording to the brand voice before publishing.',
          cta: 'Save this and share it with someone who needs it.',
          creativeBrief:
            'Use a clear first frame, one core message, readable on-screen text, and a single CTA.',
          evidence: input.evidence || [],
        };
      }),
    };

    return this.generateJson(
      `Generate ${count} content ideas for ${input.brandName}.
Goal: ${input.goal || 'not specified'}
Content pillars: ${JSON.stringify(pillars)}
Observed evidence: ${JSON.stringify(input.evidence || [])}
Return {"ideas":[...]} where every idea contains title, goal, platform, format, hook, script, caption, cta, creativeBrief, evidence. Do not claim performance that was not observed.`,
      fallback
    );
  }

  generatePlan(input: GeneratePlanDto) {
    const timezone = input.timezone || 'UTC';
    const fallback = {
      horizonDays: input.horizonDays,
      timezone,
      strategySummary:
        'Execution plan generated from supplied ideas. Posting times are recommendations until account-level timing evidence is available.',
      items: (input.ideas || []).slice(0, input.horizonDays).map((idea: any, index) => ({
        ...idea,
        plannedDayOffset: index,
        recommendedLocalTime: index % 2 === 0 ? '12:00' : '19:00',
        timingEvidence: 'recommended',
      })),
    };

    return this.generateJson(
      `Build a ${input.horizonDays}-day content execution plan for ${input.brandName}.
Timezone: ${timezone}
Ideas: ${JSON.stringify(input.ideas || [])}
Observed evidence: ${JSON.stringify(input.evidence || [])}
Return an object with horizonDays, timezone, strategySummary and items. Each item should include its source idea fields, plannedDayOffset, recommendedLocalTime and timingEvidence. Use timingEvidence="observed" only when the supplied evidence directly supports the timing; otherwise use "recommended".`,
      fallback
    );
  }
}
