-- Create client_games table for design game tracking
-- Multi-tenant design games with JSON storage for cards and game state

CREATE TABLE client_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'complete', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- JSON field containing all game data
  game_data JSONB NOT NULL,
  
  -- Ensure unique game names per client
  UNIQUE(client_id, name)
);

-- Index for fast client queries
CREATE INDEX idx_client_games_client ON client_games(client_id);

-- Index for JSON queries on cards and game content
CREATE INDEX idx_client_games_data ON client_games USING GIN (game_data);

-- Index for game status queries
CREATE INDEX idx_client_games_status ON client_games(client_id, status);

COMMENT ON TABLE client_games IS 'Design games and card libraries for each client';
COMMENT ON COLUMN client_games.game_data IS 'JSON containing cards, hands, UDE, status, and game history';