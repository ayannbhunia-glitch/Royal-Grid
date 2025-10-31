-- Royal Grid Domination - Join/Leave Game RPCs
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- ============================================================
-- Helper: get player profile as JSONB
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_player_json(p_uid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'uid', p_uid,
    'name', COALESCE(p.display_name, 'Player'),
    'avatar', p.avatar_url,
    'order', 0,
    'joinedAt', NOW()
  )
  FROM public.profiles p
  WHERE p.id = p_uid;
$$;

-- ============================================================
-- RPC: join_game(share_code)
-- Adds current auth.uid() as a player if game is waiting and not already joined
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_game(p_share_code text)
RETURNS public.games
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game public.games;
  v_uid uuid := auth.uid();
  v_player jsonb;
  v_already_joined boolean;
  v_players_count int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_game FROM public.games WHERE share_code = p_share_code LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  IF v_game.status <> 'waiting' THEN
    RAISE EXCEPTION 'Game is not joinable';
  END IF;

  -- Check if already joined
  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_game.players) AS player
    WHERE (player->>'uid')::uuid = v_uid
  ) INTO v_already_joined;

  IF v_already_joined THEN
    RETURN v_game; -- idempotent
  END IF;

  -- Check capacity
  SELECT jsonb_array_length(v_game.players) INTO v_players_count;
  IF v_players_count IS NOT NULL AND v_players_count >= COALESCE(v_game.num_players, 2) THEN
    RAISE EXCEPTION 'Game is full';
  END IF;

  -- Build player JSON
  SELECT public.get_player_json(v_uid) INTO v_player;

  -- Append to players array
  UPDATE public.games
  SET players = CASE
      WHEN players IS NULL OR players = '[]'::jsonb THEN jsonb_build_array(v_player)
      ELSE players || jsonb_build_array(v_player)
    END,
    updated_at = NOW()
  WHERE id = v_game.id
  RETURNING * INTO v_game;

  RETURN v_game;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_game(text) TO authenticated;

-- ============================================================
-- RPC: leave_game(game_id)
-- Removes current auth.uid() from players array
-- ============================================================
CREATE OR REPLACE FUNCTION public.leave_game(p_game_id uuid)
RETURNS public.games
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game public.games;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_game FROM public.games WHERE id = p_game_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  UPDATE public.games
  SET players = (
      SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
      FROM jsonb_array_elements(v_game.players) AS p
      WHERE (p->>'uid')::uuid IS DISTINCT FROM v_uid
    ),
    updated_at = NOW()
  WHERE id = p_game_id
  RETURNING * INTO v_game;

  RETURN v_game;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_game(uuid) TO authenticated;
