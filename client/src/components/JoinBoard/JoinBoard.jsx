import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function JoinBoard() {
  const { code }   = useParams();
  const navigate   = useNavigate();

  useEffect(() => {
    api.get(`/boards/share/${code}`)
      .then(({ data }) => {
        navigate(`/board/${data.board._id}`, { replace: true });
      })
      .catch(() => {
        navigate('/dashboard', { replace: true });
      });
  }, [code]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 12,
      background: 'var(--bg, #0f0f1a)', color: 'var(--text3, #5a5a7a)',
      fontSize: '14px', fontFamily: 'Outfit, sans-serif',
    }}>
      <div style={{ fontSize: 28 }}>✦</div>
      Joining board…
    </div>
  );
}
