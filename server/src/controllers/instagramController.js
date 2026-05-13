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

exports.redirectToFacebook = async (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString('hex');
    const returnTo = typeof req.query.return_to === 'string' && req.query.return_to.startsWith('/')
      ? req.query.return_to
      : '/register';
    
    // Check if frontend passed token
    const token = req.query.token || null;
    
    stateStore.set(state, { returnTo, token, createdAt: Date.now() });
    setHttpOnlyCookie(res, STATE_COOKIE_NAME, state, 10 * 60);
    return res.redirect(buildFacebookLoginUrl(state));
  } catch (err) {
    return handleControllerError(res, err);
  }
};

exports.facebookCallback = async (req, res) => {
  console.log("OAuth callback hit");
  console.log(req.query);

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const stateRecord = stateStore.get(req.query.state);
  const returnTo = stateRecord?.returnTo || '/register';
  const errorRedirectUrl = new URL(returnTo, frontendUrl);
  errorRedirectUrl.searchParams.set('instagram_error', 'true');

  try {
    const { code, state, error, error_description } = req.query;
    if (error) {
      console.error('[Facebook OAuth Error]', error_description || error);
      return res.redirect(errorRedirectUrl.toString());
    }
    if (!code) {
      console.error('[Facebook OAuth] No code received');
      return res.redirect(errorRedirectUrl.toString());
    }

    const expectedState = parseCookies(req)[STATE_COOKIE_NAME];
    if (expectedState && state && expectedState !== state) {
      console.error('[Facebook OAuth] State mismatch');
      return res.redirect(errorRedirectUrl.toString());
    }

    const accessToken = await exchangeCodeForToken(code);
    console.log("Access token received");

    const pages = await getFacebookPages(accessToken);
    const page = pages[0];
    if (!page) {
      console.error('[Facebook OAuth] No Facebook Pages returned');
      return res.redirect(errorRedirectUrl.toString());
    }

    const igAccount = await getInstagramBusinessAccount(page.page_id, page.page_access_token || accessToken);
    if (!igAccount?.id) {
      console.error('[Facebook OAuth] No Instagram Business Account linked to page');
      return res.redirect(errorRedirectUrl.toString());
    }

    const pageAccessToken = page.page_access_token || accessToken;
    const profile = await getInstagramProfile(igAccount.id, pageAccessToken);
    
    // Optimize media fetching if needed, limit to 10 for faster response
    const mediaItems = await getMediaWithInsights(igAccount.id, pageAccessToken, 10);
    const reels = mediaItems.filter(m => m.media_type === 'REELS' || m.media_product_type === 'REELS');
    
    const stats = calculateProfileStats(reels.length > 0 ? reels : mediaItems);
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

    if (stateRecord?.token) {
      try {
        const decoded = verifyJWT(stateRecord.token);
        if (decoded && decoded.id) {
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
        }
      } catch (err) {
        console.error('[Facebook OAuth] Token verification or MySQL save failed', err);
      }
    }

    stateStore.delete(state);
    setHttpOnlyCookie(res, COOKIE_NAME, connectionId, 60 * 60 * 24 * 60);
    appendHttpOnlyCookie(res, STATE_COOKIE_NAME, '', 0);

    console.log("Instagram connected successfully");

    const successRedirectUrl = new URL(returnTo, frontendUrl);
    successRedirectUrl.searchParams.set('instagram_connected', 'true');
    return res.redirect(successRedirectUrl.toString());
  } catch (err) {
    console.error('[Facebook OAuth Callback Error]', err.response?.data || err.message);
    return res.redirect(errorRedirectUrl.toString());
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
