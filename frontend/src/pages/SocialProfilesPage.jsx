import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocialProfiles, upsertSocialProfile } from '../api/creatorApi';
import { getInstagramConnectUrl, getInstagramProfile, saveCurrentInstagramConnection, disconnectInstagram } from '../api/instagramApi';

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
  const [ig, setIg] = useState({ profile_url: '', followers_count: '', avg_views: '', engagement_rate: '', is_verified: false, instagram_connected: false, instagram_username: '', instagram_profile_picture: '' });
  const [yt, setYt] = useState({ profile_url: '', followers_count: '', avg_views: '', engagement_rate: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    getSocialProfiles().then(res => {
      if (!mounted) return;
      const rows = res.data.data || res.data || [];
      const igRow = rows.find(r => r.platform === 'instagram');
      const ytRow = rows.find(r => r.platform === 'youtube');
      if (igRow) setIg({ profile_url: igRow.profile_url || '', followers_count: igRow.followers_count || '', avg_views: igRow.avg_views || '', engagement_rate: igRow.engagement_rate || '', is_verified: !!igRow.is_verified, instagram_connected: !!igRow.instagram_connected, instagram_username: igRow.instagram_username || '', instagram_profile_picture: igRow.instagram_profile_picture || '' });
      if (ytRow) setYt({ profile_url: ytRow.profile_url || '', followers_count: ytRow.followers_count || '', avg_views: ytRow.avg_views || '', engagement_rate: ytRow.engagement_rate || '' });
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!window.location.search.includes('instagram_connected=true')) return;
    refreshIg()
      .then(() => saveCurrentInstagramConnection())
      .finally(() => window.history.replaceState({}, '', window.location.pathname));
  }, []);

  const refreshIg = async () => {
    setMsg('Refreshing Instagram stats...');
    try {
      const res = await getInstagramProfile();
      const d = res.data?.data?.profile;
      if (d) setIg(prev => ({ ...prev, profile_url: d.username ? `https://www.instagram.com/${d.username}` : prev.profile_url, instagram_username: d.username || prev.instagram_username, instagram_profile_picture: d.profile_picture_url || prev.instagram_profile_picture, followers_count: d.followers_count ?? prev.followers_count, avg_views: d.avg_views ?? prev.avg_views, engagement_rate: d.engagement_rate ?? prev.engagement_rate, is_verified: d.is_verified ?? prev.is_verified, instagram_connected: true }));
      setMsg('Instagram stats updated');
    } catch (e) { setMsg('Connect Instagram first'); }
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
      await saveCurrentInstagramConnection();
      setMsg('Instagram saved');
    } catch (e) { setMsg('Failed to save Instagram'); }
    setSaving(false);
  };

  const disconnectIg = async () => {
    setSaving(true); setMsg('Disconnecting Instagram...');
    try {
      await disconnectInstagram();
      setIg({ profile_url: '', followers_count: '', avg_views: '', engagement_rate: '', is_verified: false, instagram_connected: false, instagram_username: '', instagram_profile_picture: '' });
      setMsg('Instagram disconnected');
    } catch (e) { setMsg('Failed to disconnect Instagram'); }
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
        {ig.instagram_connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {ig.instagram_profile_picture && <img src={ig.instagram_profile_picture} alt={ig.instagram_username} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />}
            <div>
              <div style={{ fontWeight: 700 }}>@{ig.instagram_username}</div>
              <div style={{ color: '#16a34a', fontSize: 12 }}>Connected</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', marginBottom: 12 }}>Connect through Facebook OAuth to fetch official Instagram stats.</p>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={() => { window.location.href = getInstagramConnectUrl('/social-profiles'); }} disabled={saving}>{ig.instagram_connected ? 'Reconnect' : 'Connect Instagram'}</button>
          {ig.instagram_connected && <button onClick={refreshIg} disabled={saving}>Refresh Stats</button>}
          {ig.instagram_connected && <button onClick={saveIg} disabled={saving}>Save</button>}
          {ig.instagram_connected && <button onClick={disconnectIg} disabled={saving}>Disconnect</button>}
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
