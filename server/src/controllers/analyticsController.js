/**
 * Analytics Controller
 * Handles YouTube auto-fetch after content goes live.
 *
 * YouTube: Uses youtube_date_key (Data API v3) — fetches real viewCount, likeCount, commentCount.
 *
 * Instagram: Uses Meta Instagram Graph API for connected Business/Creator accounts.
 *   - Returns official media insights for content owned by the connected IG account.
 *   - Falls back to creator profile estimates when Meta cannot match the submitted URL.
 */
const axios = require('axios');
const pool = require('../config/db');
const { broadcastCampaignUpdate } = require('../websocket');
const {
  extractInstagramShortcode,
  getMediaInsightsByPermalink,
} = require('../services/metaInstagramService');

// Env var is named youtube_date_key in .env
const YT_DATA_KEY = process.env.youtube_date_key;

/**
 * Extract YouTube video ID from a URL.
 * Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, youtube.com/embed/ID
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Fetch YouTube video stats using Data API v3.
 * Returns REAL data: views, likes, comments, engagement_rate.
 * Reach and clicks are estimated (YouTube doesn't expose these publicly).
 */
async function fetchYouTubeVideoStats(videoId) {
  if (!YT_DATA_KEY) throw new Error('YouTube Data API key not configured (youtube_date_key)');

  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YT_DATA_KEY}`;
  const res = await axios.get(url, { timeout: 10000 });
  const item = res.data?.items?.[0];
  if (!item) throw new Error(`YouTube video ${videoId} not found or is private`);

  const stats = item.statistics;
  const views = parseInt(stats.viewCount) || 0;
  const likes = parseInt(stats.likeCount) || 0;
  const comments = parseInt(stats.commentCount) || 0;
  // YouTube doesn't expose reach via public API — estimate at 85% of views
  const reach = Math.round(views * 0.85);
  const engagement_rate = views > 0 ? ((likes + comments) / views) * 100 : 0;

  return {
    views,
    reach,
    clicks: Math.round(views * 0.03),       // CTR ~3% estimate
    conversions: Math.round(views * 0.005),  // CVR ~0.5% estimate
    likes,
    comments,
    engagement_rate: parseFloat(engagement_rate.toFixed(2)),
    platform: 'youtube',
    data_source: 'youtube_api',
  };
}

async function fetchInstagramPostStats(contentUrl, creatorId) {
  try {
    const [profiles] = await pool.query(
      "SELECT instagram_access_token, instagram_business_id FROM creator_social_profiles WHERE creator_id=? AND platform='instagram' AND instagram_connected=true LIMIT 1",
      [creatorId]
    );
    const profile = profiles[0];
    if (!profile?.instagram_access_token || !profile?.instagram_business_id) {
      console.log(`[Analytics] Creator ${creatorId} has no connected Instagram Graph account`);
      return null;
    }

    return await getMediaInsightsByPermalink(profile.instagram_business_id, profile.instagram_access_token, contentUrl);
  } catch (e) {
    const status = e.response?.status;
    console.error(`[Analytics] Meta Instagram Graph API failed (HTTP ${status || 'network error'}):`, e.message);
    return null;
  }
}

/**
 * Main function: auto-collect metrics for a campaign after it goes live.
 * Called by markCampaignLive with a 30-second delay.
 *
 * Priority order:
 *   1. YouTube Data API (if content_url is a YouTube link)
 *   2. Meta Instagram Graph API (if content_url is an Instagram link)
 *   3. Creator profile estimates (fallback — always succeeds)
 */
async function autoCollectMetrics(campaignId, brandId) {
  try {
    const [camps] = await pool.query(
      'SELECT c.*, cr.name AS creator_name FROM campaigns c JOIN creators cr ON cr.id=c.creator_id WHERE c.id=?',
      [campaignId]
    );
    if (!camps.length) return;
    const campaign = camps[0];

    if (campaign.status !== 'posted_live') {
      console.log(`[Analytics] Campaign ${campaignId} is no longer posted_live (status: ${campaign.status}), skipping`);
      return;
    }

    // Priority: 1. Latest content_url from content_submissions, 2. campaign.content_url
    let contentUrl = campaign.content_url;
    const [latestSub] = await pool.query(
      "SELECT content_url FROM content_submissions WHERE campaign_id = ? AND content_url IS NOT NULL ORDER BY id DESC LIMIT 1",
      [campaignId]
    );
    if (latestSub.length > 0) {
      contentUrl = latestSub[0].content_url;
    }
    let stats = null;
    let dataSource = 'estimate';

    if (!contentUrl) {
      console.log(`[Analytics] Campaign ${campaignId} has no content_url — using profile estimates`);
    } else {
      // ── 1. Try YouTube ──────────────────────────────────────────────────
      const videoId = extractYouTubeVideoId(contentUrl);
      if (videoId) {
        try {
          stats = await fetchYouTubeVideoStats(videoId);
          dataSource = 'youtube_api';
          console.log(`[Analytics] YouTube real stats for campaign ${campaignId}:`, {
            views: stats.views, likes: stats.likes, er: stats.engagement_rate
          });
        } catch (e) {
          console.error(`[Analytics] YouTube API failed for campaign ${campaignId}:`, e.message);
        }
      }

      // ── 2. Try Instagram ────────────────────────────────────────────────
      if (!stats) {
        const shortcode = extractInstagramShortcode(contentUrl);
        if (shortcode) {
          stats = await fetchInstagramPostStats(contentUrl, campaign.creator_id);
          if (stats) {
            dataSource = 'instagram_api';
            console.log(`[Analytics] Instagram stats for campaign ${campaignId}:`, {
              views: stats.views, likes: stats.likes, er: stats.engagement_rate
            });
          }
        }
      }
    }

    // ── 3. Fallback: creator profile estimates ──────────────────────────
    if (!stats) {
      const [social] = await pool.query(
        'SELECT followers_count, avg_views, engagement_rate FROM creator_social_profiles WHERE creator_id=? ORDER BY followers_count DESC LIMIT 1',
        [campaign.creator_id]
      );
      const profile = social[0] || {};
      const baseViews = profile.avg_views || Math.round((profile.followers_count || 1000) * 0.1);
      const er = parseFloat(profile.engagement_rate) || 3.5;

      stats = {
        views: baseViews,
        reach: Math.round(baseViews * 0.85),
        clicks: Math.round(baseViews * 0.03),
        conversions: Math.round(baseViews * 0.005),
        engagement_rate: er,
        platform: campaign.platform || 'instagram',
        data_source: 'estimate',
      };
      dataSource = 'estimate';
      console.log(`[Analytics] Using profile estimates for campaign ${campaignId}:`, {
        views: stats.views, er: stats.engagement_rate, reason: contentUrl ? 'API failed' : 'no content_url'
      });
    }

    // Sales estimate: conversions × (budget / 10)
    const salesGenerated = Math.round(stats.conversions * (campaign.budget / 10));

    // ── Persist analytics ───────────────────────────────────────────────
    await pool.query(`
      INSERT INTO campaign_analytics
        (campaign_id, views, reach, clicks, conversions, sales_generated, engagement_rate, cost_per_conversion, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        views=VALUES(views), reach=VALUES(reach), clicks=VALUES(clicks),
        conversions=VALUES(conversions), sales_generated=VALUES(sales_generated),
        engagement_rate=VALUES(engagement_rate), cost_per_conversion=VALUES(cost_per_conversion),
        platform=VALUES(platform), recorded_at=NOW()
    `, [
      campaignId,
      stats.views, stats.reach, stats.clicks, stats.conversions,
      salesGenerated, stats.engagement_rate,
      stats.conversions > 0 ? campaign.budget / stats.conversions : 0,
      stats.platform,
    ]);

    // ── Advance campaign status to analytics_collected ──────────────────
    await pool.query(
      "UPDATE campaigns SET status='analytics_collected', updated_at=NOW() WHERE id=?",
      [campaignId]
    );
    await pool.query(
      "INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'analytics_collected', 'system', ?)",
      [campaignId, `Metrics collected via ${dataSource}. Views: ${stats.views}, ER: ${stats.engagement_rate}%`]
    );

    // ── Insert lead record ──────────────────────────────────────────────
    const [nd] = await pool.query('SELECT categories FROM creator_niche_details WHERE creator_id=?', [campaign.creator_id]);
    const niche = nd[0] ? (JSON.parse(nd[0].categories || '[]')[0] || 'General') : 'General';
    await pool.query(
      'INSERT IGNORE INTO leads (campaign_id, creator_id, brand_id, niche, deal_value) VALUES (?, ?, ?, ?, ?)',
      [campaignId, campaign.creator_id, campaign.brand_id, niche, campaign.budget]
    );

    // ── Notify both parties ─────────────────────────────────────────────
    const sourceLabel = dataSource === 'youtube_api' ? 'YouTube' : dataSource === 'instagram_api' ? 'Instagram' : 'estimated';
    await pool.query(
      "INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Metrics Ready 📊', ?)",
      [campaign.brand_id, `Metrics collected for "${campaign.title}" (${sourceLabel}). Views: ${stats.views.toLocaleString()}, ER: ${stats.engagement_rate}%. Release payment to complete.`]
    );
    await pool.query(
      "INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Analytics Collected ✅', ?)",
      [campaign.creator_id, `Your content for "${campaign.title}" has been analysed (${sourceLabel}). ${stats.views.toLocaleString()} views, ${stats.engagement_rate}% engagement rate.`]
    );

    // ── Broadcast via WebSocket ─────────────────────────────────────────
    broadcastCampaignUpdate(campaignId, {
      status: 'analytics_collected',
      progress_step: 6,
      analytics: {
        views: stats.views,
        reach: stats.reach,
        engagement_rate: stats.engagement_rate,
        data_source: dataSource,
      },
    });

    console.log(`[Analytics] Campaign ${campaignId} → analytics_collected (source: ${dataSource})`);
  } catch (err) {
    console.error(`[Analytics] autoCollectMetrics failed for campaign ${campaignId}:`, err.message);
  }
}

module.exports = { autoCollectMetrics, fetchYouTubeVideoStats, extractYouTubeVideoId };
