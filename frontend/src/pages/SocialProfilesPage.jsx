import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocialProfiles, upsertSocialProfile } from '../api/creatorApi';

function extractInstagramUsername(url) {
  if (!url) return null;
  const clean = url.trim().replace(/\/$/, '');
  const m = clean.match(/instagram\.com\/([^/?#]+)/i);
  if (m) return m[1];
  return clean.includes(' ') ? null : clean;
}

function extractYouTubeIdentifier(url) {
  if (!url) return null;
  const clean = url.trim().replace(/\/$/, '');
  const channelMatch = clean.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
  if (channelMatch) return { type: 'channelId', id: channelMatch[1] };
  const handleMatch = clean.match(/youtube\.com\/@([\w-]+)/i);
  if (handleMatch) return { type: 'handle', id: handleMatch[1] };
  const userMatch = clean.match(/youtube\.com\/user\/([\w-]+)/i);
  if (userMatch) return { type: 'username', id: userMatch[1] };
  if (!clean.includes('/') && !clean.includes('.')) return { type: 'handle', id: clean };
  return null;
}

export default function SocialProfilesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ig, setIg] = useState({ profile_url: '', followers_count: '', avg_views: '', engagement_rate: '', is_verified: false });
  const [yt, setYt] = useState({ profile_url: '', followers_count: '', avg_views: '', engagement_rate: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    getSocialProfiles().then(res => {
      if (!mounted) return;
      const rows = res.data.data || res.data || [];
      const igRow = rows.find(r => r.platform === 'instagram');
      const ytRow = rows.find(r => r.platform === 'youtube');
      if (igRow) setIg({ profile_url: igRow.profile_url || '', followers_count: igRow.followers_count || '', avg_views: igRow.avg_views || '', engagement_rate: igRow.engagement_rate || '', is_verified: !!igRow.is_verified });
      if (ytRow) setYt({ profile_url: ytRow.profile_url || '', followers_count: ytRow.followers_count || '', avg_views: ytRow.avg_views || '', engagement_rate: ytRow.engagement_rate || '' });
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const fetchIg = async () => {
    const username = extractInstagramUsername(ig.profile_url);
    if (!username) { setMsg('Invalid Instagram URL'); return; }
    setMsg('Fetching Instagram stats...');
    try {
      const res = await fetch(`http://localhost:3000/api/social/instagram?username=${encodeURIComponent(username)}`);
      const body = await res.json();
      const d = body.data || body;
      if (d) setIg(prev => ({ ...prev, followers_count: d.followers || prev.followers_count, avg_views: d.avg_views || prev.avg_views, engagement_rate: d.engagement_rate || prev.engagement_rate, is_verified: d.is_verified ?? prev.is_verified }));
      setMsg('Instagram stats updated');
    } catch (e) { setMsg('Failed to fetch Instagram'); }
  };

  const fetchYt = async () => {
    const result = extractYouTubeIdentifier(yt.profile_url);
    if (!result) { setMsg('Invalid YouTube URL/handle'); return; }
    setMsg('Fetching YouTube stats...');
    try {
      const res = await fetch(`http://localhost:3000/api/social/youtube?type=${encodeURIComponent(result.type)}&identifier=${encodeURIComponent(result.id)}`);
      const body = await res.json();
      const d = body.data || body;
      if (d) setYt(prev => ({ ...prev, followers_count: d.subscribers || prev.followers_count, avg_views: d.avg_views || prev.avg_views, engagement_rate: d.engagement_rate || prev.engagement_rate }));
      setMsg('YouTube stats updated');
    } catch (e) { setMsg('Failed to fetch YouTube'); }
  };

  const saveIg = async () => {
    setSaving(true); setMsg('Saving Instagram...');
    try {
      await upsertSocialProfile({ platform: 'instagram', profile_url: ig.profile_url, followers_count: Number(ig.followers_count) || 0, avg_views: Number(ig.avg_views) || 0, engagement_rate: Number(ig.engagement_rate) || 0 });
      setMsg('Instagram saved');
    } catch (e) { setMsg('Failed to save Instagram'); }
    setSaving(false);
  };

  const saveYt = async () => {
    setSaving(true); setMsg('Saving YouTube...');
    try {
      await upsertSocialProfile({ platform: 'youtube', profile_url: yt.profile_url, followers_count: Number(yt.followers_count) || 0, avg_views: Number(yt.avg_views) || 0, engagement_rate: Number(yt.engagement_rate) || 0 });
      setMsg('YouTube saved');
    } catch (e) { setMsg('Failed to save YouTube'); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 800 }}>
      <h2 style={{ marginBottom: 12 }}>Social Profiles</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>Add or update your Instagram and YouTube handles. Fetch stats and save to keep counts visible to brands and admins.</p>

      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>Instagram</h3>
        <input placeholder="Instagram profile or URL" value={ig.profile_url} onChange={(e) => setIg({ ...ig, profile_url: e.target.value })} style={{ width: '100%', padding: '8px 10px', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={fetchIg} disabled={saving}>Fetch Stats</button>
          <button onClick={saveIg} disabled={saving}>Save</button>
        </div>
        <div style={{ color: '#444' }}>
          <div>Followers: {ig.followers_count || 0}</div>
          <div>Avg Views: {ig.avg_views || 0}</div>
          <div>Engagement Rate: {ig.engagement_rate || 0}%</div>
          <div>Verified: {ig.is_verified ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h3>YouTube</h3>
        <input placeholder="YouTube channel/handle/URL" value={yt.profile_url} onChange={(e) => setYt({ ...yt, profile_url: e.target.value })} style={{ width: '100%', padding: '8px 10px', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={fetchYt} disabled={saving}>Fetch Stats</button>
          <button onClick={saveYt} disabled={saving}>Save</button>
        </div>
        <div style={{ color: '#444' }}>
          <div>Subscribers: {yt.followers_count || 0}</div>
          <div>Avg Views: {yt.avg_views || 0}</div>
          <div>Engagement Rate: {yt.engagement_rate || 0}%</div>
        </div>
      </div>

      <div style={{ color: '#666', marginTop: 8 }}>{msg}</div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/settings')}>Back to Settings</button>
      </div>
    </div>
  );
}
