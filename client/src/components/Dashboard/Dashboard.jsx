import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Dashboard.css';

const TEMPLATES = [
  { id: 'flowchart', label: 'Flowchart', icon: '⬡', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    desc: 'Visualize processes and decision flows' },
  { id: 'mindmap',   label: 'Mind Map',  icon: '◎', gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    desc: 'Brainstorm ideas and connections' },
  { id: 'wireframe', label: 'Wireframe', icon: '▭', gradient: 'linear-gradient(135deg,#6b7280,#374151)',
    desc: 'Sketch UI layouts and screens' },
  { id: 'kanban',    label: 'Kanban',    icon: '⊞', gradient: 'linear-gradient(135deg,#10b981,#047857)',
    desc: 'Manage tasks and workflows' },
];

const NAV_ITEMS = [
  { id: 'home',      icon: '⌂', label: 'Home'      },
  { id: 'boards',    icon: '▦', label: 'My Boards'  },
  { id: 'shared',    icon: '⬡', label: 'Shared'     },
  { id: 'templates', icon: '◫', label: 'Templates'  },
  { id: 'profile',   icon: '◉', label: 'Profile'    },
  { id: 'settings',  icon: '⚙', label: 'Settings'   },
];

const DEFAULT_SETTINGS = {
  showGrid:           false,
  snapToGrid:         false,
  showCursorLabels:   true,
  enableAI:           true,
  privateByDefault:   false,
  allowPublicSharing: true,
};

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('sl_settings') || '{}') }; }
  catch { return DEFAULT_SETTINGS; }
}

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Board state
  const [boards,    setBoards]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [newTitle,  setNewTitle]  = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [joining,   setJoining]   = useState(false);
  const [search,    setSearch]    = useState('');

  // Navigation
  const [activeNav, setActiveNav] = useState('home');

  // Profile state
  const [profileName,   setProfileName]   = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState('');

  // Settings state (persisted to localStorage)
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => { fetchBoards(); }, []);
  useEffect(() => { setProfileName(user?.name || ''); }, [user]);

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards');
      setBoards(data.boards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e, title) => {
    if (e) e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/boards', { title: title || newTitle || 'Untitled Board' });
      navigate(`/board/${data.board._id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const joinBoard = async () => {
    if (shareCode.length !== 6) return;
    setJoining(true);
    try {
      const { data } = await api.get(`/boards/share/${shareCode.trim().toUpperCase()}`);
      setShareCode('');
      navigate(`/board/${data.board._id}`);
    } catch {
      alert('Board not found. Check the share code and try again.');
      setJoining(false);
    }
  };

  const deleteBoard = async (id) => {
    if (!window.confirm('Delete this board?')) return;
    await api.delete(`/boards/${id}`);
    setBoards(prev => prev.filter(b => b._id !== id));
  };

  const saveProfile = async () => {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const { data } = await api.put('/auth/profile', { name: profileName.trim() });
      updateUser(data.user);
      setProfileMsg('✓ Profile updated successfully');
    } catch (err) {
      setProfileMsg('✗ ' + (err.response?.data?.message || 'Failed to save profile'));
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('sl_settings', JSON.stringify(next));
      return next;
    });
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const myId = String(user?._id || '');

  // Split boards into owned vs shared
  const myBoards     = boards.filter(b => String(b.owner?._id || b.owner) === myId);
  const sharedBoards = boards.filter(b => String(b.owner?._id || b.owner) !== myId);

  const filterBoards = (list) =>
    list.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  const firstName = user?.name?.split(' ')[0] || 'there';

  // ── Board card helper ────────────────────────────────────────
  const BoardCard = ({ b, showDelete = true }) => (
    <div className="board-card" onClick={() => navigate(`/board/${b._id}`)}>
      <div className="board-card-preview">
        {b.thumbnail
          ? <img src={b.thumbnail} alt="preview" />
          : <div className="board-card-empty-preview">✦</div>}
      </div>
      <div className="board-card-info">
        <div className="board-card-title">{b.title}</div>
        <div className="board-card-meta">Updated {timeAgo(b.updatedAt)}</div>
      </div>
      {showDelete && (
        <button
          className="board-card-delete"
          onClick={e => { e.stopPropagation(); deleteBoard(b._id); }}
          title="Delete board"
        >🗑</button>
      )}
    </div>
  );

  // ── Toggle switch helper ─────────────────────────────────────
  const Toggle = ({ settingKey, label, desc }) => (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">{label}</div>
        {desc && <div className="setting-desc">{desc}</div>}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={settings[settingKey]}
          onChange={() => toggleSetting(settingKey)}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  const handleNavClick = (id) => {
    setActiveNav(id);
    setSearch('');
    setShowForm(false);
    setProfileMsg('');
  };

  return (
    <div className="dash-bg">

      {/* ── Left sidebar ─────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✦</div>
          SketchLink
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="snav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout}>Log out</button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="dash-content">

        {/* Top bar — shown for board views */}
        {['home','boards','shared'].includes(activeNav) && (
          <header className="dash-topbar">
            <div className="dash-search-wrap">
              <span className="dash-search-icon">🔍</span>
              <input
                className="dash-search"
                placeholder="Search boards…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="dash-topbar-right">
              <div className="join-wrap">
                <input
                  type="text"
                  className="join-input"
                  placeholder="Share code"
                  value={shareCode}
                  maxLength={6}
                  onChange={e => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && joinBoard()}
                />
                <button
                  className="join-btn"
                  onClick={joinBoard}
                  disabled={joining || shareCode.length !== 6}
                >
                  {joining ? '…' : 'Join'}
                </button>
              </div>
              {activeNav !== 'shared' && (
                <button className="dash-new-btn" onClick={() => setShowForm(true)}>
                  + New Board
                </button>
              )}
            </div>
          </header>
        )}

        {/* New board inline form */}
        {showForm && (
          <form className="new-board-form" onSubmit={createBoard}>
            <input
              autoFocus
              type="text"
              placeholder="Board title…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setNewTitle(''); }}>
              Cancel
            </button>
          </form>
        )}

        <main className="dash-main">

          {/* ── HOME ────────────────────────────────────────── */}
          {activeNav === 'home' && (
            <>
              <div className="dash-welcome">
                <h1 className="dash-heading">Welcome back, {firstName}! 👋</h1>
                <p className="dash-sub">Pick up where you left off or start something new.</p>
              </div>

              <section className="dash-section">
                <div className="dash-section-header">
                  <h2 className="dash-section-title">Start with a template</h2>
                </div>
                <div className="template-grid">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      className="template-card"
                      style={{ background: t.gradient }}
                      onClick={() => createBoard(null, t.label)}
                      disabled={creating}
                    >
                      <span className="template-icon">{t.icon}</span>
                      <span className="template-label">{t.label}</span>
                      <span className="template-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="dash-section">
                <div className="dash-section-header">
                  <h2 className="dash-section-title">Recent boards</h2>
                  <span className="dash-board-count">{boards.length} board{boards.length !== 1 ? 's' : ''}</span>
                </div>
                {loading ? (
                  <div className="dash-loading">Loading boards…</div>
                ) : filterBoards(boards).length === 0 ? (
                  <div className="dash-empty">
                    <div className="dash-empty-icon">✦</div>
                    <p>{search ? 'No boards match your search.' : 'No boards yet. Create your first!'}</p>
                    {!search && (
                      <button className="dash-new-btn" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>
                        + Create Board
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="boards-grid">
                    {filterBoards(boards).map(b => <BoardCard key={b._id} b={b} />)}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── MY BOARDS ──────────────────────────────────── */}
          {activeNav === 'boards' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">My Boards</h2>
                <span className="dash-board-count">{myBoards.length} board{myBoards.length !== 1 ? 's' : ''}</span>
              </div>
              {loading ? (
                <div className="dash-loading">Loading…</div>
              ) : filterBoards(myBoards).length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">▦</div>
                  <p>{search ? 'No boards match your search.' : "You haven't created any boards yet."}</p>
                  {!search && (
                    <button className="dash-new-btn" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>
                      + Create Board
                    </button>
                  )}
                </div>
              ) : (
                <div className="boards-grid">
                  {filterBoards(myBoards).map(b => <BoardCard key={b._id} b={b} />)}
                </div>
              )}
            </section>
          )}

          {/* ── SHARED WITH ME ─────────────────────────────── */}
          {activeNav === 'shared' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">Shared with me</h2>
                <span className="dash-board-count">{sharedBoards.length} board{sharedBoards.length !== 1 ? 's' : ''}</span>
              </div>
              {loading ? (
                <div className="dash-loading">Loading…</div>
              ) : filterBoards(sharedBoards).length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">⬡</div>
                  <p>{search ? 'No boards match your search.' : 'No boards have been shared with you yet.'}</p>
                  <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text3)' }}>
                    Ask a board owner to share their link or give you the share code.
                  </p>
                </div>
              ) : (
                <div className="boards-grid">
                  {filterBoards(sharedBoards).map(b => (
                    <BoardCard key={b._id} b={b} showDelete={false} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── TEMPLATES ──────────────────────────────────── */}
          {activeNav === 'templates' && (
            <>
              <div className="dash-welcome">
                <h1 className="dash-heading">Templates</h1>
                <p className="dash-sub">Choose a template to get started quickly.</p>
              </div>
              <div className="template-grid template-grid-lg">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className="template-card template-card-lg"
                    style={{ background: t.gradient }}
                    onClick={() => createBoard(null, t.label)}
                    disabled={creating}
                  >
                    <span className="template-icon">{t.icon}</span>
                    <span className="template-label">{t.label}</span>
                    <span className="template-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── PROFILE ────────────────────────────────────── */}
          {activeNav === 'profile' && (
            <div className="profile-panel">
              <div className="dash-welcome">
                <h1 className="dash-heading">Profile</h1>
                <p className="dash-sub">Manage your account information.</p>
              </div>

              <div className="profile-card">
                <div className="profile-avatar">
                  {user?.name?.slice(0, 2).toUpperCase() || '??'}
                </div>

                <div className="profile-fields">
                  <div className="profile-field">
                    <label className="profile-label">Display Name</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveProfile()}
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="profile-field">
                    <label className="profile-label">Email Address</label>
                    <input
                      type="email"
                      className="profile-input"
                      value={user?.email || ''}
                      disabled
                      style={{ opacity: 0.55, cursor: 'not-allowed' }}
                    />
                    <span className="profile-hint">Email cannot be changed</span>
                  </div>

                  {profileMsg && (
                    <div className={`profile-msg ${profileMsg.startsWith('✓') ? 'success' : 'error'}`}>
                      {profileMsg}
                    </div>
                  )}

                  <button
                    className="dash-new-btn"
                    onClick={saveProfile}
                    disabled={profileSaving || profileName.trim() === user?.name}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ───────────────────────────────────── */}
          {activeNav === 'settings' && (
            <div className="settings-panel">
              <div className="dash-welcome">
                <h1 className="dash-heading">Settings</h1>
                <p className="dash-sub">Preferences are saved automatically to this browser.</p>
              </div>

              <div className="settings-group">
                <div className="settings-group-title">Board Preferences</div>
                <Toggle settingKey="showGrid"         label="Show grid"                desc="Display a dotted grid on the canvas" />
                <Toggle settingKey="snapToGrid"       label="Snap to grid"             desc="Snap drawn shapes to grid points" />
                <Toggle settingKey="showCursorLabels" label="Show collaborator cursors" desc="Display real-time cursors of other users" />
                <Toggle settingKey="enableAI"         label="Enable AI assistance"      desc="Show the AI panel with shape recognition and diagram generation" />
              </div>

              <div className="settings-group">
                <div className="settings-group-title">Privacy</div>
                <Toggle settingKey="privateByDefault"   label="Make boards private by default" desc="New boards are private until explicitly shared" />
                <Toggle settingKey="allowPublicSharing" label="Allow public sharing"            desc="Generate shareable links for boards" />
              </div>

              <div className="settings-group">
                <div className="settings-group-title">Data</div>
                <div className="setting-row">
                  <div className="setting-info">
                    <div className="setting-label">Reset all settings</div>
                    <div className="setting-desc">Restore all preferences to their default values</div>
                  </div>
                  <button
                    className="settings-reset-btn"
                    onClick={() => {
                      localStorage.removeItem('sl_settings');
                      setSettings(DEFAULT_SETTINGS);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
