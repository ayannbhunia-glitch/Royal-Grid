-- Royal Grid Domination - Initial Schema Migration
-- Phase 1: Multiplayer Foundation
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. USERS (Profiles) Table
-- ============================================================
-- Extends Supabase auth.users with game-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Stats
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1200,
  
  -- Metadata
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read profiles, users can update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_elo_idx ON public.profiles(elo_rating DESC);
CREATE INDEX IF NOT EXISTS profiles_wins_idx ON public.profiles(wins DESC);

-- ============================================================
-- 2. GAMES Table
-- ============================================================
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'ended', 'cancelled');

CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status game_status DEFAULT 'waiting',
  
  -- Game configuration
  num_players INTEGER DEFAULT 2 CHECK (num_players BETWEEN 2 AND 4),
  grid_size INTEGER DEFAULT 8,
  
  -- Players (array of player objects)
  -- Structure: [{ uid, name, avatar, order, joinedAt, finishedAt, rank }]
  players JSONB DEFAULT '[]'::jsonb,
  
  -- Game state
  -- Structure: { board: [][], turn: 0, currentPlayer: 0, history: [], lastMoveAt }
  state JSONB DEFAULT '{
    "board": [],
    "turn": 0,
    "currentPlayer": 0,
    "history": [],
    "lastMoveAt": null
  }'::jsonb,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_uid UUID REFERENCES public.profiles(id),
  
  -- Share/invite
  share_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone authenticated can read games, players can update their game
CREATE POLICY "Games are viewable by authenticated users"
  ON public.games FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create games"
  ON public.games FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Players can update their games"
  ON public.games FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      -- Creator can update
      auth.uid() = created_by OR
      -- Or user is a player in the game
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(players) AS player
        WHERE (player->>'uid')::uuid = auth.uid()
      )
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS games_status_idx ON public.games(status);
CREATE INDEX IF NOT EXISTS games_created_by_idx ON public.games(created_by);
CREATE INDEX IF NOT EXISTS games_share_code_idx ON public.games(share_code);
CREATE INDEX IF NOT EXISTS games_created_at_idx ON public.games(created_at DESC);

-- ============================================================
-- 3. MOVES Table (Optional - for detailed history/replay)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.moves (
  id BIGSERIAL PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  player_uid UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Move data: { position: [row, col], card: {...}, timestamp }
  move_data JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read moves for games they're in
CREATE POLICY "Moves are viewable by game players"
  ON public.moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = moves.game_id
      AND (
        games.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(games.players) AS player
          WHERE (player->>'uid')::uuid = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Players can insert moves for their games"
  ON public.moves FOR INSERT
  WITH CHECK (
    auth.uid() = player_uid AND
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = moves.game_id
      AND (
        games.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(games.players) AS player
          WHERE (player->>'uid')::uuid = auth.uid()
        )
      )
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS moves_game_id_idx ON public.moves(game_id, move_number);
CREATE INDEX IF NOT EXISTS moves_player_uid_idx ON public.moves(player_uid);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. REALTIME
-- ============================================================
-- Enable realtime for games table (so clients can subscribe to changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;

-- ============================================================
-- DONE!
-- ============================================================
-- Next steps:
-- 1. Enable Google Auth in Supabase Dashboard > Authentication > Providers
-- 2. Configure OAuth redirect URLs
-- 3. Test connection from your React app
