import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ConversationPanel.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

const ConversationPanel = ({ conversation, moves, gameId }) => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [llmReason, setLlmReason] = useState('');
  const conversationEndRef = useRef(null);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleLLMSnapshot = async () => {
    if (!llmReason.trim()) return;
    
    try {
      await axios.post(`${API_BASE}/games/${gameId}/llm-snapshot`, {
        reason: llmReason.trim(),
        confidence: 0.85
      });
      setLlmReason('');
    } catch (error) {
      console.error('Error requesting LLM snapshot:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'kanban_move': return '🎯';
      case 'kanban_board_response': return '🤖';
      case 'llm_snapshot_request': return '📸';
      default: return '💬';
    }
  };

  return (
    <div className="conversation-panel">
      <div className="panel-header">
        <div className="panel-tabs">
          <button 
            className={`tab ${activeTab === 'conversation' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversation')}
          >
            💬 Conversation
          </button>
          <button 
            className={`tab ${activeTab === 'moves' ? 'active' : ''}`}
            onClick={() => setActiveTab('moves')}
          >
            🎯 Moves
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'conversation' && (
          <div className="conversation-tab">
            <div className="conversation-list">
              {conversation.map((turn, index) => (
                <div key={turn.turn_id} className={`conversation-item ${turn.source_type}`}>
                  <div className="turn-header">
                    <span className="source-icon">{getSourceIcon(turn.source_type)}</span>
                    <span className="source-type">{turn.source_type.replace('_', ' ')}</span>
                    <span className="timestamp">{formatTimestamp(turn.timestamp)}</span>
                  </div>
                  <div className="turn-content">{turn.content}</div>
                  {turn.metadata?.move_notation && (
                    <div className="move-notation">Move: {turn.metadata.move_notation}</div>
                  )}
                </div>
              ))}
              <div ref={conversationEndRef} />
            </div>

            <div className="llm-snapshot-form">
              <h4>🧠 Request LLM Snapshot</h4>
              <div className="form-row">
                <input
                  type="text"
                  value={llmReason}
                  onChange={(e) => setLlmReason(e.target.value)}
                  placeholder="Why should the LLM take a snapshot?"
                  className="reason-input"
                />
                <button 
                  onClick={handleLLMSnapshot}
                  disabled={!llmReason.trim()}
                  className="snapshot-button"
                >
                  📸 Request
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moves' && (
          <div className="moves-tab">
            <div className="moves-list">
              {moves.map((move, index) => (
                <div key={index} className="move-item">
                  <div className="move-header">
                    <span className="move-sequence">#{move.move_sequence}</span>
                    <span className="move-notation">{move.move_notation}</span>
                    <span className="move-time">{formatTimestamp(move.move_timestamp)}</span>
                  </div>
                  <div className="move-description">{move.move_content}</div>
                  <div className="board-response">
                    <strong>Board:</strong> {move.board_response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationPanel;