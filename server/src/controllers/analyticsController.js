/**
 * Analytics Controller
 * Handles YouTube auto-fetch after content goes live.
 *
 * YouTube: Uses youtube_date_key (Data API v3) — fetches real viewCount, likeCount, commentCount.
 *
 * Instagram: Uses RAPIDAPI_KEY with instagram-data1.p.rapidapi.com (scraper-based).
 *   - Returns real public metrics: views/plays, likes, comments.
 *   - reach/impressions are PRIVATE metrics on Instagram — not available via any public scraper.
 *     We estimate reach as views × 0.9 (industry standard for Reels).
 *   - Falls back to creator profile estimates if the API fails.
 *
 * For true Instagram reach/impressions, the creator must connect their
 * Instagram Business account via Meta Graph API OAuth (future enhancement).
 */
const axios = require('axios');
const pool = require('../config/db');
const { broadcastCampaignUpdate } = require('../websocket');

const YT_DATA_KEY = process.env.youtube_date_key;

/**
 * Extract YouTube video ID from a URL.
 * Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
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
 * Extract Instagram shortcode from URL.
 * Handles: instagram.com/p/CODE, instagram.com/reel/CODE, instagram.com/tv/CODE
 */
function extractInstagramShortcode(url) {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Fetch YouTube video stats using Data API v3.
 * Returns REAL data: views, likes, comments, engagement_rate.
 * Reach and clicks are estimated (YouTube doesn't expose these publicly).
 */
async function fetchYouTubeVideoStats(videoId) {
  if (!YT_DATA_KEY) throw new Error('YouTube Data API key not configured');

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
    data_source: 'youtube_api',              // real data
  };
}

/**
 * Fetch Instagram post stats via RapidAPI (instagram-data1.p.rapidapi.com).
 *
 * What is REAL: views/plays, likes, comments (public metrics).
 * What is ESTIMATED: reach (private metric — not available via any scraper).
 *
 * Returns null if the API is unavailable or the key is not configured,
 * so the caller can fall back to profile-based estimates.
 */
async function fetchInstagramPostStats(shortcode) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'instagram-data1.p.rapidapi.com';

  if (!RAPIDAPI_KEY) {
    console.log('[Analytics] RAPIDAPI_KEY not set — skipping Instagram API fetch');
    return null;
  }

  try {
    const res = await axios.get(`https://${RAPIDAPI_HOST}/post/info`, {
      params: { shortcode },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      timeout: 15000,
    });

    const data = res.data;

    // The API returns different shapes for photos vs videos vs reels
    // video_view_count / play_count → Reels/Videos
    // edge_media_preview_like.count → older photo posts
    const views = parseInt(data.video_view_count || data.play_count || 0);
    const likes = parseInt(
      data.like_count ||
      data.edge_media_preview_like?.count ||
      data.edge_liked_by?.count ||
      0
    );
    const comments = parseInt(
      data.edge_media_to_comment?.count ||
      data.comments_count ||
      0
    );

    // If we got nothing meaningful, treat as failed
    if (views === 0 && likes === 0) {
      console.log(`[Analytics] Instagram API returned empty data for shortcode ${shortcode}`);
      return null;
    }

    // Reach is a private metric — Instagram does not expose it publicly.
    // Industry standard estimate: reach ≈ 90% of views for Reels, or likes × 10 for photos.
    const baseForReach = views > 0 ? views : likes * 10;
    const reach = Math.round(baseForReach * 0.9);
    const engagement_rate = baseForReach > 0
      ? ((likes + comments) / baseForReach) * 100
      : 0;

    return {
      views: views || Math.round(likes * 8), // photo posts have no view count
      reach,
      clicks: Math.round(reach * 0.04),       // ~4% link-in-bio CTR estimate
      conversions: Math.round(reach * 0.008), // ~0.8% conversion estimate
      likes,
      comments,
      engagement_rate: parseFloat(engagement_rate.toFixed(2)),
      platform: 'instagram',
      data_source: 'instagram_api',           // views/likes/comments are real; reach is estimated
    };
  } catch (e) {
    // Log the specific error so we know if it's a 403 (blocked), 429 (rate limit), etc.
    const status = e.response?.status;
    console.error(`[Analytics] Instagram RapidAPI failed (HTTP ${status || 'network error'}):`, e.message);
    return null;
  }
}

/**
 * Main function: auto-collect metrics for a campaign after it goes live.
 * Called by markCampaignLive with a 30-second delay.
 *
 * Priority order:
 *   1. YouTube Data API (if content_url is a YouTube link)
 *   2. Instagram RapidAPI (if content_url is an Instagram link)
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

    const contentUrl = campaign.content_url;
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
          stats = await fetchInstagramPostStats(shortcode);
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

    // Sales estimate: conversions × (budget / 10) — rough revenue attribution
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

    // ── Advance campaign status ─────────────────────────────────────────
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

/**
 * Extract YouTube video ID from a URL.
 * Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
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
 * Extract Instagram shortcode from URL.
 * Handles: instagram.com/p/CODE, instagram.com/reel/CODE
 */
function extractInstagramShortcode(url) {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Fetch YouTube video stats using Data API v3.
 * Returns: views, likes, comments, engagement_rate
 */
async function fetchYouTubeVideoStats(videoId) {
  if (!YT_DATA_KEY) throw new Error('YouTube Data API key not configured');

  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YT_DATA_KEY}`;
  const res = await axios.get(url, { timeout: 10000 });
  const item = res.data?.items?.[0];
  if (!item) throw new Error(`YouTube video ${videoId} not found`);

  const stats = item.statistics;
  const views = parseInt(stats.viewCount) || 0;
  const likes = parseInt(stats.likeCount) || 0;
  const comments = parseInt(stats.commentCount) || 0;
  const engagement_rate = views > 0 ? ((likes + comments) / views) * 100 : 0;

  return {
    views,
    reach: Math.round(views * 0.85), // reach ≈ 85% of views (standard estimate)
    clicks: Math.round(views * 0.03), // CTR ≈ 3% estimate
    conversions: Math.round(views * 0.005), // 0.5% conversion estimate
    likes,
    comments,
    engagement_rate: parseFloat(engagement_rate.toFixed(2)),
    platform: 'youtube',
  };
}

/**
 * Fetch Instagram post stats via RapidAPI.
 * Falls back to estimates if API unavailable.
 */
async function fetchInstagramPostStats(shortcode) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'instagram-data1.p.rapidapi.com';

  if (!RAPIDAPI_KEY) {
    // Return estimates based on shortcode existence
    return null;
  }

  try {
    const res = await axios.get(`https://${RAPIDAPI_HOST}/post/info`, {
      params: { shortcode },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      timeout: 10000,
    });

    const data = res.data;
    const views = data.video_view_count || data.play_count || 0;
    const likes = data.like_count || data.edge_media_preview_like?.count || 0;
    const comments = data.edge_media_to_comment?.count || 0;
    const reach = data.reach || Math.round((views || likes * 10) * 0.9);

    const engagement_rate = (views || likes * 10) > 0
      ? ((likes + comments) / (views || likes * 10)) * 100
      : 0;

    return {
      views: views || likes * 8,
      reach,
      clicks: Math.round(reach * 0.04),
      conversions: Math.round(reach * 0.008),
      likes,
      comments,
      engagement_rate: parseFloat(engagement_rate.toFixed(2)),
      platform: 'instagram',
    };
  } catch (e) {
    console.error('Instagram stats fetch failed:', e.message);
    return null;
  }
}

/**
 * Main function: auto-collect metrics for a campaign after it goes live.
 * Called after markCampaignLive with a delay to allow content to be indexed.
 */
async function autoCollectMetrics(campaignId, brandId) {
  try {
    const [camps] = await pool.query(
      'SELECT c.*, cr.name AS creator_name FROM campaigns c JOIN creators cr ON cr.id=c.creator_id WHERE c.id=?',
      [campaignId]
    );
    if (!camps.length) return;
    const campaign = camps[0];

    if (campaign.status !== 'posted_live') return; // already advanced

    const contentUrl = campaign.content_url;
    if (!contentUrl) {
      console.log(`[Analytics] Campaign ${campaignId} has no content_url, skipping auto-collect`);
      return;
    }

    let stats = null;

    // Try YouTube first
    const videoId = extractYouTubeVideoId(contentUrl);
    if (videoId) {
      try {
        stats = await fetchYouTubeVideoStats(videoId);
        console.log(`[Analytics] YouTube stats fetched for campaign ${campaignId}:`, stats);
      } catch (e) {
        console.error(`[Analytics] YouTube fetch failed for campaign ${campaignId}:`, e.message);
      }
    }

    // Try Instagram if not YouTube
    if (!stats) {
      const shortcode = extractInstagramShortcode(contentUrl);
      if (shortcode) {
        stats = await fetchInstagramPostStats(shortcode);
        console.log(`[Analytics] Instagram stats for campaign ${campaignId}:`, stats);
      }
    }

    // If no stats from APIs, use intelligent estimates based on creator's profile
    if (!stats) {
      const [social] = await pool.query(
        'SELECT followers_count, avg_views, engagement_rate FROM creator_social_profiles WHERE creator_id=? ORDER BY followers_count DESC LIMIT 1',
        [campaign.creator_id]
      );
      const profile = social[0] || {};
      const baseViews = profile.avg_views || Math.round((profile.followers_count || 1000) * 0.1);
      const er = profile.engagement_rate || 3.5;

      stats = {
        views: baseViews,
        reach: Math.round(baseViews * 0.85),
        clicks: Math.round(baseViews * 0.03),
        conversions: Math.round(baseViews * 0.005),
        engagement_rate: parseFloat(er),
        platform: campaign.platform || 'instagram',
      };
      console.log(`[Analytics] Using estimated stats for campaign ${campaignId}:`, stats);
    }

    // Calculate sales estimate based on escrow amount and conversions
    const salesGenerated = Math.round(stats.conversions * (campaign.budget / 10));

    // Insert/update campaign_analytics
    await pool.query(`
      INSERT INTO campaign_analytics
        (campaign_id, views, reach, clicks, conversions, sales_generated, engagement_rate, cost_per_conversion, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        views=VALUES(views), reach=VALUES(reach), clicks=VALUES(clicks),
        conversions=VALUES(conversions), sales_generated=VALUES(sales_generated),
        engagement_rate=VALUES(engagement_rate), cost_per_conversion=VALUES(cost_per_conversion),
        platform=VALUES(platform), updated_at=NOW()
    `, [
      campaignId,
      stats.views, stats.reach, stats.clicks, stats.conversions,
      salesGenerated, stats.engagement_rate,
      stats.conversions > 0 ? campaign.budget / stats.conversions : 0,
      stats.platform,
    ]);

    // Advance campaign to analytics_collected
    await pool.query(
      "UPDATE campaigns SET status='analytics_collected', updated_at=NOW() WHERE id=?",
      [campaignId]
    );
    await pool.query(
      "INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'analytics_collected', 'system', ?)",
      [campaignId, `Auto-collected via ${videoId ? 'YouTube Data API' : 'estimate'}`]
    );

    // Insert lead record
    const [nd] = await pool.query('SELECT categories FROM creator_niche_details WHERE creator_id=?', [campaign.creator_id]);
    const niche = nd[0] ? (JSON.parse(nd[0].categories || '[]')[0] || 'General') : 'General';
    await pool.query(
      'INSERT IGNORE INTO leads (campaign_id, creator_id, brand_id, niche, deal_value) VALUES (?, ?, ?, ?, ?)',
      [campaignId, campaign.creator_id, campaign.brand_id, niche, campaign.budget]
    );

    // Notify both parties
    await pool.query(
      "INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Metrics Ready 📊', ?)",
      [campaign.brand_id, `Performance metrics collected for "${campaign.title}". Views: ${stats.views.toLocaleString()}, ER: ${stats.engagement_rate}%. Release payment to complete.`]
    );
    await pool.query(
      "INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Analytics Collected ✅', ?)",
      [campaign.creator_id, `Your content for "${campaign.title}" has been analysed. ${stats.views.toLocaleString()} views, ${stats.engagement_rate}% engagement rate.`]
    );

    // Broadcast via WebSocket
    broadcastCampaignUpdate(campaignId, {
      status: 'analytics_collected',
      progress_step: 6,
      analytics: {
        views: stats.views,
        reach: stats.reach,
        engagement_rate: stats.engagement_rate,
      },
    });

    console.log(`[Analytics] Campaign ${campaignId} advanced to analytics_collected`);
  } catch (err) {
    console.error(`[Analytics] autoCollectMetrics failed for campaign ${campaignId}:`, err.message);
  }
}

module.exports = { autoCollectMetrics, fetchYouTubeVideoStats, extractYouTubeVideoId };
