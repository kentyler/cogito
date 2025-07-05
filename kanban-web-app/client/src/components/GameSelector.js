import React, { useState } from 'react';
import './GameSelector.css';

const GameSelector = ({ games, currentGame, onSelectGame, onCreateGame }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGameName, setNewGameName] = useState('');

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (newGameName.trim()) {
      onCreateGame(newGameName.trim());
      setNewGameName('');
      setShowCreateForm(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="game-selector">
      <div className="selector-header">
        <h3>🎮 Games</h3>
        <button 
          className="create-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕' : '+'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGame} className="create-form">
          <input
            type="text"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
            placeholder="Enter game name..."
            className="game-name-input"
            autoFocus
          />
          <button type="submit" className="submit-button">
            Create Game
          </button>
        </form>
      )}

      <div className="games-list">
        {games.length === 0 ? (
          <div className="no-games">
            <p>No games yet</p>
            <p>Create your first game!</p>
          </div>
        ) : (
          games.map(game => (
            <div
              key={game.game_id}
              className={`game-item ${currentGame?.game_id === game.game_id ? 'active' : ''}`}
              onClick={() => onSelectGame(game.game_id)}
            >
              <div className="game-name">{game.game_name}</div>
              <div className="game-meta">
                <span className="game-type">{game.game_type}</span>
                <span className="game-status">{game.status}</span>
              </div>
              <div className="game-date">
                {formatDate(game.start_timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameSelector;