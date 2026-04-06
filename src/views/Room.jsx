import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, UserCircle } from 'lucide-react';
import { listenToRoom, updateGameState } from '../services/roomService';

export default function Room({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenToRoom(roomId, (data) => {
      if (data) {
        setRoomData(data);
        // Automatically jump to game if both are playing
        if (data.status === 'playing') {
          navigate(`/game/${roomId}?game=${data.gameType}`);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, navigate]);

  const startGameManually = async () => {
    // Just safely force it if needed
    if (roomData && roomData.hostId === user?.uid) {
      await updateGameState(roomId, { status: 'playing' });
    }
  };

  if (!roomData) return <div className="animate-in flex-center">Loading Room...</div>;

  return (
    <div className="animate-in flex-center" style={{ width: '100%', flex: 1 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Room Lobby</h2>
        <p style={{ marginBottom: '2rem' }}>Playing: <strong>{roomData.gameType === 'rps' ? 'Rock Paper Scissors' : roomData.gameType === 'sos' ? 'SOS Game' : 'Tic Tac Toe'}</strong></p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <UserCircle size={64} color="var(--accent-primary)" />
            <span>{roomData.hostName}</span>
          </div>
          
          {roomData.guestId ? (
            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <UserCircle size={64} color="var(--accent-secondary)" />
              <span>{roomData.guestName}</span>
            </div>
          ) : (
            <div className="animate-pulse-slow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
              <UserCircle size={64} style={{ border: '2px dashed var(--accent-hover)', borderRadius: '50%' }} color="var(--text-muted)" />
              <span>Waiting for love...</span>
            </div>
          )}

        </div>

        {user?.uid === roomData.hostId && (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }} 
            disabled
          >
            Waiting for your partner...
          </button>
        )}
      </div>
    </div>
  );
}
