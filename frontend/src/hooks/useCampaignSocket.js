import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

/**
 * Connects to the campaign WebSocket and subscribes to one or more campaign IDs.
 * On receiving a campaign_update event, it invalidates the relevant React Query caches
 * so both brand and creator pages refresh automatically.
 *
 * @param {string|number|Array<string|number>} campaignIds - single id or array of ids
 * @param {string[]} queryKeysToInvalidate - extra query keys to invalidate on update
 */
export function useCampaignSocket(campaignIds, queryKeysToInvalidate = []) {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  // Stable string key so the effect only re-runs when IDs actually change
  const ids = Array.isArray(campaignIds)
    ? campaignIds.filter(Boolean)
    : campaignIds ? [campaignIds] : [];
  const idsKey = ids.join(',');

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current || !idsKey) return;

      const token = localStorage.getItem('gradix_token');
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        idsKey.split(',').forEach(id => {
          ws.send(JSON.stringify({ type: 'subscribe', campaign_id: id }));
        });
      };

      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.type === 'campaign_update') {
          queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
          queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] });
          queryClient.invalidateQueries({ queryKey: ['requests'] });
          queryClient.invalidateQueries({ queryKey: ['brand-requests'] });
          // Always invalidate campaign detail so content_submissions refresh for the brand
          queryClient.invalidateQueries({ queryKey: ['campaign-detail-tracking'] });
          // If metrics just arrived, also invalidate the analytics detail query
          if (msg.status === 'analytics_collected' && msg.campaign_id) {
            queryClient.invalidateQueries({ queryKey: ['campaign-analytics', Number(msg.campaign_id)] });
            queryClient.invalidateQueries({ queryKey: ['campaign-analytics', String(msg.campaign_id)] });
          }
          queryKeysToInvalidate.forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });
        }
      };

      ws.onclose = (e) => {
        if (mountedRef.current && e.code !== 4001) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [idsKey, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps
}
