-- Allow single player games by updating the num_players constraint
ALTER TABLE public.games 
  DROP CONSTRAINT IF EXISTS games_num_players_check,
  ADD CONSTRAINT games_num_players_check CHECK (num_players BETWEEN 1 AND 4);
