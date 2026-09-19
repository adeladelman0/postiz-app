'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export type SocialIntelligenceDashboard = {
  brands: any[];
  targets: any[];
  audits: any[];
  strategies: any[];
  ideas: any[];
  plans: any[];
  planItems: any[];
  approvals: any[];
  performance: any[];
  insights: any[];
};

const emptyDashboard: SocialIntelligenceDashboard = {
  brands: [],
  targets: [],
  audits: [],
  strategies: [],
  ideas: [],
  plans: [],
  planItems: [],
  approvals: [],
  performance: [],
  insights: [],
};

export function useSocialIntelligence() {
  const fetcher = useFetch();

  const load = useCallback(async () => {
    const response = await fetcher('/social-intelligence/dashboard');
    if (!response.ok) {
      throw new Error('Failed to load Social Intelligence');
    }
    return (await response.json()) as SocialIntelligenceDashboard;
  }, [fetcher]);

  const swr = useSWR('social-intelligence-dashboard', load, {
    revalidateOnFocus: false,
    fallbackData: emptyDashboard,
  });

  const request = useCallback(
    async <T = any>(
      path: string,
      method: 'POST' | 'PATCH',
      body: Record<string, unknown>
    ) => {
      const response = await fetcher('/social-intelligence' + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Social Intelligence request failed');
      }
      await swr.mutate();
      return payload as T;
    },
    [fetcher, swr]
  );

  return {
    ...swr,
    data: swr.data || emptyDashboard,
    request,
  };
}
