const crypto = require('crypto');
const pool = require('../config/db');
const {
  buildFacebookLoginUrl,
  exchangeCodeForToken,
  getFacebookPages,
  getInstagramBusinessAccount,
  getInstagramProfile,
  getInstagramMedia,
  getInstagramInsights,
  getMediaWithInsights,
  calculateProfileStats,
  normaliseInsightMetrics,
} = require('../services/metaInstagramService');
const { verifyJWT } = require('../helpers/jwt');

const COOKIE_NAME = 'gradix_ig_connection';
const STATE_COOKIE_NAME = 'gradix_ig_oauth_state';
const tokenStore = new Map();
const stateStore = new Map();

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index > -1) acc[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return acc;
    }, {});
}

function setHttpOnlyCookie(res, name, value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`,
  ]);
}

function appendHttpOnlyCookie(res, name, value, maxAgeSeconds) {
  const existing = res.getHeader('Set-Cookie');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const cookie = `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
  res.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, cookie] : [existing, cookie].filter(Boolean));
}

function getConnection(req) {
  const connectionId = parseCookies(req)[COOKIE_NAME];
  if (!connectionId) return null;
  return tokenStore.get(connectionId) || null;
}

function requireConnection(req) {
  const connection = getConnection(req);
  if (!connection?.accessToken) {
    const err = new Error('Instagram OAuth connection not found. Start with GET /auth/facebook.');
    err.statusCode = 401;
    throw err;
  }
  return connection;
}

function handleControllerError(res, err) {
  const metaError = err.response?.data?.error;
  const status = err.statusCode || err.response?.status || 500;

  console.error('[Instagram Graph API]', metaError || err.message);

  return res.status(status).json({
    success: false,
    error: metaError?.message || err.message || 'Instagram Graph API request failed',
    meta: metaError
      ? {
          type: metaError.type,
          code: metaError.code,
          error_subcode: metaError.error_subcode,
          fbtrace_id: metaError.fbtrace_id,
        }
      : undefined,
  });
}

/**
 * Ephemeral OAuth: Build a self-closing HTML response for the popup.
 * Uses postMessage to communicate back to parent window, then auto-closes.
 */
function buildPopupResponse(success, message, extraData = {}) {
  const data = JSON.stringify({
    type: 'INSTAGRAM_OAUTH_RESPONSE',
    success,
    message,
    ...extraData,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Connected' : 'Error'} — Gradix</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%);
    }
    .card {
      background: white; border-radius: 24px; padding: 48px 40px;
      text-align: center; max-width: 380px; width: 90%;
      box-shadow: 0 20px 60px rgba(124, 58, 237, 0.08);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
    p { font-size: 14px; color: #64748b; line-height: 1.6; }
    .closing { margin-top: 20px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h2>${success ? 'Instagram Connected!' : 'Connection Failed'}</h2>
    <p>${message}</p>
    <p class="closing">This window will close automatically...</p>
  </div>
  <script>
    (function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(${data}, '*');
        }
      } catch (e) {
        console.error('postMessage failed:', e);
      }
      setTimeout(function() { window.close(); }, 1500);
    })();
  </script>
</body>
</html>`;
}

/**
 * Ephemeral OAuth Step 1: Redirect to Facebook with reauthenticate + popup params.
 * Generates a CSRF state token with a 10-minute TTL.
 */
exports.redirectToFacebook = async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    const returnTo = typeof req.query.return_to === 'string' && req.query.return_to.startsWith('/')
      ? req.query.return_to
      : '/register';

    // Extract JWT token from query for auto-linking after callback
    const token = req.query.token || null;

    // Store state with TTL for CSRF protection (10 min expiry)
    stateStore.set(state, {
      returnTo,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Clean up expired states (housekeeping)
    for (const [key, val] of stateStore.entries()) {
      if (val.expiresAt && Date.now() > val.expiresAt) stateStore.delete(key);
    }

    setHttpOnlyCookie(res, STATE_COOKIE_NAME, state, 10 * 60);
    return res.redirect(buildFacebookLoginUrl(state));
  } catch (err) {
    return handleControllerError(res, err);
  }
};

/**
 * Ephemeral OAuth Step 2: Handle Facebook callback.
 * Exchanges code for token, saves connection, and returns a self-closing popup HTML.
 */
exports.facebookCallback = async (req, res) => {
  console.log('[OAuth Callback] Hit');

  try {
    const { code, state, error: oauthError, error_description } = req.query;

    // ─── Error from Facebook ───
    if (oauthError) {
      console.error('[Facebook OAuth Error]', error_description || oauthError);
      const msg = oauthError === 'access_denied'
        ? 'You denied the required permissions. Please try again and grant all requested access.'
        : `Facebook returned an error: ${error_description || oauthError}`;
      return res.status(200).send(buildPopupResponse(false, msg));
    }

    // ─── No authorization code ───
    if (!code) {
      console.error('[Facebook OAuth] No authorization code received');
      return res.status(200).send(buildPopupResponse(false, 'No authorization code was received from Facebook.'));
    }

    // ─── CSRF State Validation ───
    const expectedState = parseCookies(req)[STATE_COOKIE_NAME];
    const stateRecord = stateStore.get(state);

    if (!stateRecord) {
      console.error('[Facebook OAuth] Unknown or expired state parameter');
      return res.status(200).send(buildPopupResponse(false, 'OAuth session expired. Please close this window and try again.'));
    }

    if (expectedState && state && expectedState !== state) {
      console.error('[Facebook OAuth] State mismatch — possible CSRF');
      stateStore.delete(state);
      return res.status(200).send(buildPopupResponse(false, 'Security validation failed. Please try again.'));
    }

    if (stateRecord.expiresAt && Date.now() > stateRecord.expiresAt) {
      console.error('[Facebook OAuth] State expired');
      stateStore.delete(state);
      return res.status(200).send(buildPopupResponse(false, 'OAuth session timed out. Please close this window and try again.'));
    }

    // ─── Exchange code for access token ───
    let accessToken;
    try {
      accessToken = await exchangeCodeForToken(code);
    } catch (tokenErr) {
      console.error('[Facebook OAuth] Token exchange failed:', tokenErr.response?.data || tokenErr.message);
      return res.status(200).send(buildPopupResponse(false, 'Failed to exchange authorization code. The code may have expired — please try again.'));
    }
    console.log('[OAuth] Access token received');

    // ─── Get Facebook Pages ───
    const pages = await getFacebookPages(accessToken);
    const page = pages[0];
    if (!page) {
      console.error('[Facebook OAuth] No Facebook Pages returned');
      return res.status(200).send(buildPopupResponse(false, 'No Facebook Page found on your account. You need a Facebook Page with a linked Instagram Business/Creator account.'));
    }

    // ─── Get Instagram Business Account ───
    const pageAccessToken = page.page_access_token || accessToken;
    const igAccount = await getInstagramBusinessAccount(page.page_id, pageAccessToken);
    if (!igAccount?.id) {
      console.error('[Facebook OAuth] No Instagram Business Account linked to page');
      return res.status(200).send(buildPopupResponse(false, 'No Instagram Business or Creator account is linked to your Facebook Page. Please connect one in Meta Business Suite first.'));
    }

    // ─── Fetch Instagram profile + media ───
    const profile = await getInstagramProfile(igAccount.id, pageAccessToken);
    const mediaItems = await getMediaWithInsights(igAccount.id, pageAccessToken, 10);
    const reels = mediaItems.filter(m => m.media_type === 'REELS' || m.media_product_type === 'REELS');
    const stats = calculateProfileStats(reels.length > 0 ? reels : mediaItems);

    // ─── Store in-memory session ───
    const connectionId = crypto.randomUUID();
    tokenStore.set(connectionId, {
      accessToken,
      pageAccessToken,
      pages,
      selectedPageId: page.page_id,
      igId: igAccount.id,
      igAccount,
      profile: { ...profile, ...stats },
      media: mediaItems,
      reels,
      createdAt: new Date().toISOString(),
    });

    // ─── Auto-link to creator if JWT token was provided ───
    if (stateRecord.token) {
      try {
        const decoded = verifyJWT(stateRecord.token);
        if (decoded?.id) {
          // Remove old tokens before saving new ones (prevent stale credentials)
          await pool.query(
            'UPDATE creator_social_accounts SET instagram_access_token=NULL WHERE creator_id=? AND instagram_business_id != ?',
            [decoded.id, igAccount.id]
          );

          await pool.query(`
            INSERT INTO creator_social_accounts
              (creator_id, instagram_connected, instagram_access_token, facebook_page_id,
               instagram_business_id, instagram_username, instagram_followers,
               instagram_profile_picture, connected_at)
            VALUES (?, true, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              instagram_connected=true,
              instagram_access_token=VALUES(instagram_access_token),
              facebook_page_id=VALUES(facebook_page_id),
              instagram_business_id=VALUES(instagram_business_id),
              instagram_username=VALUES(instagram_username),
              instagram_followers=VALUES(instagram_followers),
              instagram_profile_picture=VALUES(instagram_profile_picture),
              connected_at=NOW()
          `, [
            decoded.id,
            pageAccessToken,
            page.page_id,
            igAccount.id,
            profile.username,
            Number(profile.followers_count || 0),
            profile.profile_picture_url || null,
          ]);
          console.log(`[OAuth] Auto-linked Instagram @${profile.username} to creator ${decoded.id}`);
        }
      } catch (linkErr) {
        console.error('[Facebook OAuth] Auto-link failed:', linkErr.message);
        // Non-fatal — connection still works, user can save manually
      }
    }

    // ─── Cleanup ───
    stateStore.delete(state);
    setHttpOnlyCookie(res, COOKIE_NAME, connectionId, 60 * 60 * 24 * 60);
    appendHttpOnlyCookie(res, STATE_COOKIE_NAME, '', 0);

    console.log(`[OAuth] Instagram @${profile.username} connected successfully`);

    // ─── Return self-closing popup HTML ───
    return res.status(200).send(buildPopupResponse(
      true,
      `Successfully connected @${profile.username} with ${Number(profile.followers_count || 0).toLocaleString()} followers.`,
      {
        username: profile.username,
        followers: profile.followers_count,
        profilePicture: profile.profile_picture_url,
      }
    ));

  } catch (err) {
    console.error('[Facebook OAuth Callback Error]', err.response?.data || err.message);
    return res.status(200).send(buildPopupResponse(false, 'An unexpected error occurred during authentication. Please try again.'));
  }
};

exports.getPages = async (req, res) => {
  try {
    const connection = requireConnection(req);
    const pages = await getFacebookPages(connection.accessToken);
    connection.pages = pages;

    return res.json({
      success: true,
      data: pages.map(({ page_id, page_name }) => ({ page_id, page_name })),
    });
  } catch (err) {
    return handleControllerError(res, err);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const connection = requireConnection(req);
    if (connection.profile) {
      return res.json({
        success: true,
        data: {
          page_id: connection.selectedPageId,
          instagram_account: connection.igAccount,
          profile: connection.profile,
          connected: true,
        },
      });
    }

    const pageId = req.query.pageId || connection.pages?.[0]?.page_id;
    const pageAccessToken = connection.pages?.find((page) => page.page_id === pageId)?.page_access_token || connection.accessToken;
    const igAccount = await getInstagramBusinessAccount(pageId, pageAccessToken);

    if (!igAccount?.id) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram Business/Creator account is connected to this Facebook Page',
      });
    }

    const profile = await getInstagramProfile(igAccount.id, pageAccessToken);
    const media = await getMediaWithInsights(igAccount.id, pageAccessToken, 12);
    const stats = calculateProfileStats(media);
    connection.selectedPageId = pageId;
    connection.igId = igAccount.id;
    connection.igAccount = igAccount;
    connection.profile = { ...profile, ...stats };
    connection.media = media;

    return res.json({
      success: true,
      data: {
        page_id: pageId,
        instagram_account: igAccount,
        profile: connection.profile,
        connected: true,
      },
    });
  } catch (err) {
    return handleControllerError(res, err);
  }
};

exports.getReels = async (req, res) => {
  try {
    const connection = requireConnection(req);
    const pageId = req.query.pageId || connection.selectedPageId || connection.pages?.[0]?.page_id;
    const pageAccessToken = connection.pages?.find((p) => p.page_id === pageId)?.page_access_token || connection.accessToken;
    
    let reels = connection.reels;
    if (!reels) {
      const media = await getInstagramMedia(connection.igId, pageAccessToken);
      reels = media.filter(m => m.media_type === 'REELS' || m.media_product_type === 'REELS');
      connection.reels = reels;
    }

    return res.json({
      success: true,
      data: {
        instagram_account_id: connection.igId,
        reels,
      },
    });
  } catch (err) {
    return handleControllerError(res, err);
  }
};

exports.getInsights = async (req, res) => {
  try {
    const connection = requireConnection(req);
    const pageId = req.query.pageId || connection.selectedPageId || connection.pages?.[0]?.page_id;
    const pageAccessToken = connection.pages?.find((page) => page.page_id === pageId)?.page_access_token || connection.accessToken;
    const insights = await getInstagramInsights(req.params.mediaId, pageAccessToken);

    return res.json({
      success: true,
      data: {
        media_id: req.params.mediaId,
        metrics: normaliseInsightMetrics(insights),
        raw: insights,
      },
    });
  } catch (err) {
    return handleControllerError(res, err);
  }
};

exports.saveCurrentConnection = async (req, res) => {
  try {
    const connection = requireConnection(req);
    const creatorId = req.user.id;
    const profile = connection.profile;

    if (!profile?.id) {
      return res.status(400).json({ success: false, error: 'No connected Instagram profile found to save' });
    }

    await pool.query(`
      INSERT INTO creator_social_accounts
        (creator_id, instagram_connected, instagram_access_token, facebook_page_id,
         instagram_business_id, instagram_username, instagram_followers, instagram_follows,
         instagram_media_count, instagram_profile_picture, connected_at)
      VALUES (?, true, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        instagram_connected=true,
        instagram_access_token=VALUES(instagram_access_token),
        facebook_page_id=VALUES(facebook_page_id),
        instagram_business_id=VALUES(instagram_business_id),
        instagram_username=VALUES(instagram_username),
        instagram_followers=VALUES(instagram_followers),
        instagram_follows=VALUES(instagram_follows),
        instagram_media_count=VALUES(instagram_media_count),
        instagram_profile_picture=VALUES(instagram_profile_picture),
        connected_at=NOW()
    `, [
      creatorId,
      connection.pageAccessToken || connection.accessToken,
      connection.selectedPageId,
      connection.igId,
      profile.username,
      Number(profile.followers_count || 0),
      Number(profile.follows_count || 0),
      Number(profile.media_count || 0),
      profile.profile_picture_url || null,
    ]);

    // Save Reels
    const mediaToSave = connection.reels || connection.media || [];
    if (Array.isArray(mediaToSave) && mediaToSave.length > 0) {
      for (const media of mediaToSave) {
        await pool.query(`
          INSERT INTO instagram_reels
            (creator_id, media_id, caption, media_type, media_url, permalink, 
             thumbnail_url, views, reach, likes, comments, shares, saved, posted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            caption=VALUES(caption),
            media_type=VALUES(media_type),
            media_url=VALUES(media_url),
            permalink=VALUES(permalink),
            thumbnail_url=VALUES(thumbnail_url),
            views=VALUES(views),
            reach=VALUES(reach),
            likes=VALUES(likes),
            comments=VALUES(comments),
            shares=VALUES(shares),
            saved=VALUES(saved),
            updated_at=NOW()
        `, [
          creatorId,
          media.id,
          media.caption || null,
          media.media_product_type || media.media_type || null,
          media.media_url || null,
          media.permalink || null,
          media.thumbnail_url || null,
          Number(media.insights?.views || 0),
          Number(media.insights?.reach || 0),
          Number(media.insights?.likes || media.like_count || 0),
          Number(media.insights?.comments || media.comments_count || 0),
          Number(media.insights?.shares || 0),
          Number(media.insights?.saved || 0),
          media.timestamp ? new Date(media.timestamp) : null,
        ]);
      }
    }

    return res.json({
      success: true,
      message: 'Instagram connection saved',
      data: {
        profile,
        reels: connection.reels || [],
      },
    });
  } catch (err) {
    return handleControllerError(res, err);
  }
};

exports.disconnect = async (req, res) => {
  try {
    const connectionId = parseCookies(req)[COOKIE_NAME];
    if (connectionId) tokenStore.delete(connectionId);

    await pool.query(`
      UPDATE creator_social_accounts
      SET instagram_connected=false,
          instagram_access_token=NULL,
          facebook_page_id=NULL,
          instagram_business_id=NULL,
          connected_at=NULL
      WHERE creator_id=?
    `, [req.user.id]);

    setHttpOnlyCookie(res, COOKIE_NAME, '', 0);
    return res.json({ success: true, message: 'Instagram disconnected' });
  } catch (err) {
    return handleControllerError(res, err);
  }
};
