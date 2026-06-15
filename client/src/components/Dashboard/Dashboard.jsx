import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Dashboard.css';

const TEMPLATES = [
  { id: 'flowchart',  label: 'Flowchart',  icon: '⬡', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
  { id: 'mindmap',    label: 'Mind Map',   icon: '◎', gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
  { id: 'wireframe',  label: 'Wireframe',  icon: '▭', gradient: 'linear-gradient(135deg,#6b7280,#374151)' },
  { id: 'kanban',     label: 'Kanban',     icon: '⊞', gradient: 'linear-gradient(135deg,#10b981,#047857)' },
];

const NAV_ITEMS = [
  { id: 'home',      icon: '⌂', label: 'Home'      },
  { id: 'boards',    icon: '▦', label: 'My Boards'  },
  { id: 'shared',    icon: '⬡', label: 'Shared'     },
  { id: 'templates', icon: '◫', label: 'Templates'  },
  { id: 'profile',   icon: '◉', label: 'Profile'    },
  { id: 'settings',  icon: '⚙', label: 'Settings'   },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [boards,     setBoards]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [newTitle,   setNewTitle]   = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [shareCode,  setShareCode]  = useState('');
  const [joining,    setJoining]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [activeNav,  setActiveNav]  = useState('home');

  useEffect(() => { fetchBoards(); }, []);

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
    } finally {
      setCreating(false);
    }
  };

  const joinBoard = async () => {
    if (shareCode.length !== 6) return;
    setJoining(true);
    try {
      const { data } = await api.get(`/boards/share/${shareCode.trim().toUpperCase()}`);
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

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const filteredBoards = boards.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="dash-bg">

      {/* ── Left sidebar ───────────────────────────────────── */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✦</div>
          SketchLink
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
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

      {/* ── Main content ───────────────────────────────────── */}
      <div className="dash-content">

        {/* Top bar */}
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
            {/* Join by share code */}
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

            <button className="dash-new-btn" onClick={() => setShowForm(true)}>
              + New Board
            </button>
          </div>
        </header>

        {/* New board form */}
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
            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        )}

        <main className="dash-main">
          {/* Welcome */}
          <div className="dash-welcome">
            <h1 className="dash-heading">Welcome back, {firstName}! 👋</h1>
            <p className="dash-sub">Pick up where you left off or start something new.</p>
          </div>

          {/* Templates */}
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
                </button>
              ))}
            </div>
          </section>

          {/* Recent boards */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent boards</h2>
              <span className="dash-board-count">{boards.length} board{boards.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="dash-loading">Loading boards…</div>
            ) : filteredBoards.length === 0 ? (
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
                {filteredBoards.map(b => (
                  <div
                    key={b._id}
                    className="board-card"
                    onClick={() => navigate(`/board/${b._id}`)}
                  >
                    <div className="board-card-preview">
                      {b.thumbnail
                        ? <img src={b.thumbnail} alt="preview" />
                        : <div className="board-card-empty-preview">✦</div>}
                    </div>
                    <div className="board-card-info">
                      <div className="board-card-title">{b.title}</div>
                      <div className="board-card-meta">Updated {timeAgo(b.updatedAt)}</div>
                    </div>
                    <button
                      className="board-card-delete"
                      onClick={e => { e.stopPropagation(); deleteBoard(b._id); }}
                      title="Delete board"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
