import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { AuditSnapshot, SocialProfileTarget } from './social-intelligence.types';

@Injectable()
export class SocialIntelligencePublicDataService {
  private youtubeClient() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'YOUTUBE_API_KEY is required for public YouTube competitor analysis.'
      );
    }
    return google.youtube({ version: 'v3', auth: apiKey });
  }

  private observed(
    key: string,
    value: number,
    observedAt = new Date().toISOString()
  ) {
    return {
      key,
      value,
      unit: 'count' as const,
      evidence: 'observed' as const,
      observedAt,
    };
  }

  private async resolveYoutubeChannel(profileUrl: string) {
    const youtube = this.youtubeClient();
    const parsed = new URL(profileUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const first = segments[0] || '';

    let response: any;

    if (first === 'channel' && segments[1]) {
      response = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [segments[1]],
      });
    } else if (first.startsWith('@')) {
      response = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        forHandle: first.slice(1),
      } as any);
    } else {
      const query = decodeURIComponent(segments[segments.length - 1] || first);
      const search = await youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['channel'],
        maxResults: 1,
      });
      const channelId = search.data.items?.[0]?.id?.channelId;
      if (channelId) {
        response = await youtube.channels.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: [channelId],
        });
      }
    }

    const channel = response?.data?.items?.[0];
    if (!channel?.id) {
      throw new BadRequestException('Could not resolve this YouTube channel.');
    }
    return channel;
  }

  private async youtubeSnapshot(
    target: SocialProfileTarget,
    maxPosts: number
  ): Promise<AuditSnapshot> {
    const youtube = this.youtubeClient();
    const channel: any = await this.resolveYoutubeChannel(target.profileUrl);
    const uploads =
      channel.contentDetails?.relatedPlaylists?.uploads as string | undefined;

    if (!uploads) {
      throw new BadRequestException(
        'This YouTube channel does not expose an uploads playlist.'
      );
    }

    const playlist = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploads,
      maxResults: Math.min(maxPosts, 50),
    });

    const videoIds = (playlist.data.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter(Boolean) as string[];

    const videos = videoIds.length
      ? await youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: videoIds,
        })
      : null;

    const capturedAt = new Date().toISOString();
    const stats = channel.statistics || {};

    return {
      target: {
        ...target,
        handle: channel.snippet?.customUrl || target.handle,
        externalId: channel.id,
        source: 'public',
      },
      capturedAt,
      profileMetrics: [
        this.observed(
          'subscribers',
          Number(stats.subscriberCount || 0),
          capturedAt
        ),
        this.observed('views', Number(stats.viewCount || 0), capturedAt),
        this.observed('videos', Number(stats.videoCount || 0), capturedAt),
      ],
      content: (videos?.data.items || []).map((video: any) => {
        const publishedAt = video.snippet?.publishedAt || capturedAt;
        const statistics = video.statistics || {};
        const metrics = [
          this.observed('views', Number(statistics.viewCount || 0), capturedAt),
          this.observed('likes', Number(statistics.likeCount || 0), capturedAt),
          this.observed(
            'comments',
            Number(statistics.commentCount || 0),
            capturedAt
          ),
        ];

        return {
          externalId: String(video.id),
          url: `https://www.youtube.com/watch?v=${video.id}`,
          publishedAt,
          format: 'video' as const,
          text: video.snippet?.description || '',
          metrics,
          topics: (video.snippet?.tags || []).slice(0, 12),
          hook: video.snippet?.title || '',
        };
      }),
      notes: [
        'Public YouTube Data API observations only.',
        'Private reach, audience and retention metrics are not available without an authorized account connection.',
      ],
    };
  }

  async analyze(target: SocialProfileTarget, maxPosts = 25) {
    const platform = target.platform.toLowerCase();

    if (platform === 'youtube') {
      return this.youtubeSnapshot(target, maxPosts);
    }

    throw new BadRequestException(
      `Automatic public competitor retrieval is not available for ${platform} through the configured official APIs. Import observed data or use an authorized connected account instead.`
    );
  }
}
