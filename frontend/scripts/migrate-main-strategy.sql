-- Rolling narrative: one paragraph that consolidates cards + chat, shown at top of Estrategia.
ALTER TABLE strategy_analyses
  ADD COLUMN IF NOT EXISTS main_strategy TEXT;
