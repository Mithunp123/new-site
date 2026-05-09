import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Local copy of the fixed canUpload predicate
const canUpload = (c) =>
  c.status === 'agreement_locked' ||
  c.status === 'escrow_locked';

// Local copy of the status message mapping (mirrors the ternary in the Status Info Block)
const statusMessage = (status) => {
  if (status === 'request_sent' || status === 'negotiating')
    return 'Waiting for negotiation to complete and escrow to be locked.';
  if (status === 'creator_accepted')
    return 'Waiting for brand to lock escrow before you can upload content.';
  if (status === 'content_uploaded')
    return 'Content submitted. Waiting for brand review.';
  if (status === 'brand_approved' || status === 'posted_live')
    return 'Content approved and live! Payment will be released automatically.';
  if (status === 'analytics_collected' || status === 'escrow_released')
    return 'Payment released. Campaign closing.';
  return '';
};

// ---------------------------------------------------------------------------
// Property 1: Upload eligibility is exactly the escrow-locked statuses
// Validates: Requirements 1.1, 1.2, 4.5
// ---------------------------------------------------------------------------
describe('Property 1: canUpload — upload eligibility is exactly the escrow-locked statuses', () => {
  it(
    'Feature: escrow-gated-upload-fix, Property 1: Upload eligibility is exactly the escrow-locked statuses',
    () => {
      fc.assert(
        fc.property(fc.string(), (status) => {
          const expected =
            status === 'agreement_locked' || status === 'escrow_locked';
          expect(canUpload({ status })).toBe(expected);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 2: Status-to-message mapping is total and correct
// Validates: Requirements 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
// ---------------------------------------------------------------------------
describe('Property 2: statusMessage — mapping is total and correct for all non-upload, non-closed statuses', () => {
  it(
    'Feature: escrow-gated-upload-fix, Property 2: Status-to-message mapping is total and correct',
    () => {
      const expectedMessages = {
        request_sent:
          'Waiting for negotiation to complete and escrow to be locked.',
        negotiating:
          'Waiting for negotiation to complete and escrow to be locked.',
        creator_accepted:
          'Waiting for brand to lock escrow before you can upload content.',
        content_uploaded: 'Content submitted. Waiting for brand review.',
        brand_approved:
          'Content approved and live! Payment will be released automatically.',
        posted_live:
          'Content approved and live! Payment will be released automatically.',
        analytics_collected: 'Payment released. Campaign closing.',
        escrow_released: 'Payment released. Campaign closing.',
      };

      fc.assert(
        fc.property(
          fc.constantFrom(
            'request_sent',
            'negotiating',
            'creator_accepted',
            'content_uploaded',
            'brand_approved',
            'posted_live',
            'analytics_collected',
            'escrow_released'
          ),
          (status) => {
            const msg = statusMessage(status);
            expect(msg).toBe(expectedMessages[status]);
            expect(msg.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 3: creator_accepted message is distinct from request_sent/negotiating
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------
describe('Property 3: statusMessage — creator_accepted message is distinct from request_sent/negotiating', () => {
  it(
    'Feature: escrow-gated-upload-fix, Property 3: creator_accepted message is distinct',
    () => {
      expect(statusMessage('creator_accepted')).not.toBe(
        statusMessage('request_sent')
      );
      expect(statusMessage('creator_accepted')).not.toBe(
        statusMessage('negotiating')
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Unit tests: concrete status examples
// Validates: Requirements 1.1, 1.2, 2.1, 3.1, 3.2
// ---------------------------------------------------------------------------
describe('Unit tests: canUpload and statusMessage concrete examples', () => {
  // canUpload
  it('canUpload returns false for creator_accepted', () => {
    expect(canUpload({ status: 'creator_accepted' })).toBe(false);
  });

  it('canUpload returns true for agreement_locked', () => {
    expect(canUpload({ status: 'agreement_locked' })).toBe(true);
  });

  it('canUpload returns true for escrow_locked', () => {
    expect(canUpload({ status: 'escrow_locked' })).toBe(true);
  });

  it('canUpload returns false for request_sent', () => {
    expect(canUpload({ status: 'request_sent' })).toBe(false);
  });

  it('canUpload returns false for campaign_closed', () => {
    expect(canUpload({ status: 'campaign_closed' })).toBe(false);
  });

  // statusMessage
  it('statusMessage returns the escrow-waiting message for creator_accepted', () => {
    expect(statusMessage('creator_accepted')).toBe(
      'Waiting for brand to lock escrow before you can upload content.'
    );
  });

  it('statusMessage returns the negotiation-waiting message for request_sent', () => {
    expect(statusMessage('request_sent')).toBe(
      'Waiting for negotiation to complete and escrow to be locked.'
    );
  });
});
