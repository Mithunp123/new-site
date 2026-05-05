module.exports = {
  ROLES: {
    CREATOR: 'creator',
    BRAND: 'brand',
    ADMIN: 'admin'
  },
  CAMPAIGN_STATUS: {
    REQUEST_SENT: 'request_sent',
    CREATOR_ACCEPTED: 'creator_accepted',
    AGREEMENT_LOCKED: 'agreement_locked',
    CONTENT_UPLOADED: 'content_uploaded',
    BRAND_APPROVED: 'brand_approved',
    POSTED_LIVE: 'posted_live',
    ANALYTICS_COLLECTED: 'analytics_collected',
    ESCROW_RELEASED: 'escrow_released',
    CAMPAIGN_CLOSED: 'campaign_closed',
    DECLINED: 'declined'
  },
  ESCROW_STATUS: {
    PENDING: 'pending',
    HELD: 'held',
    RELEASED: 'released',
    REFUNDED: 'refunded'
  },
  VALID_TRANSITIONS: {
    'request_sent':        ['creator_accepted','declined'],
    'creator_accepted':    ['agreement_locked'],
    'agreement_locked':    ['content_uploaded'],
    'content_uploaded':    ['brand_approved'],
    'brand_approved':      ['posted_live'],
    'posted_live':         ['analytics_collected'],
    'analytics_collected': ['escrow_released'],
    'escrow_released':     ['campaign_closed'],
    'campaign_closed':     [],
    'declined':            []
  }
};
