import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout }  = useAuth();
  const navigate           = useNavigate();
  const [boards,    setBoards]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [newTitle,  setNewTitle]  = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [joining,   setJoining]   = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

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

  const createBoard = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/boards', { title: newTitle || 'Untitled Board' });
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

  return (
    <div className="dash-bg">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <div className="dash-logo-icon">✦</div>
          SketchLink
        </div>
        <div className="dash-header-right">
          <span className="dash-user">👤 {user?.name}</span>
          <button className="dash-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Body */}
      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1 className="dash-heading">Your Boards</h1>
            <p className="dash-sub">Collaborative whiteboards with AI superpowers</p>
          </div>
          <button className="dash-new-btn" onClick={() => setShowForm(true)}>
            + New Board
          </button>

          {/* Join by share code */}
          <div style={{ display:'flex', gap:'8px', alignItems:'center', marginTop:'10px' }}>
            <input
              type="text"
              placeholder="Share code…"
              value={shareCode}
              maxLength={6}
              onChange={e => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && joinBoard()}
              style={{ width:'110px', letterSpacing:'2px', textTransform:'uppercase', textAlign:'center' }}
            />
            <button
              className="dash-new-btn"
              onClick={joinBoard}
              disabled={joining || shareCode.length !== 6}
              style={{ opacity: shareCode.length !== 6 ? 0.5 : 1 }}
            >
              {joining ? 'Joining…' : 'Join Board'}
            </button>
          </div>
        </div>

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

        {/* Board grid */}
        {loading ? (
          <div className="dash-loading">Loading boards…</div>
        ) : boards.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">✦</div>
            <p>No boards yet.<br />Create your first collaborative whiteboard.</p>
            <button className="dash-new-btn" onClick={() => setShowForm(true)}>
              + Create Board
            </button>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map(b => (
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
      </main>
    </div>
  );
}
