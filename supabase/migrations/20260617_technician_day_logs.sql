-- ============================================================
-- technician_day_logs : une seule ligne par technicien / jour
-- Permet de clôturer la journée et calculer les heures
-- (début = heure de la 1re mission, fin = heure choisie).
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.technician_day_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date          date    NOT NULL,
  first_mission_start timestamptz NOT NULL,
  day_end_time        timestamptz NOT NULL,
  total_minutes       integer NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (technician_id, date)
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_day_logs_tech_date
  ON public.technician_day_logs (technician_id, date DESC);

-- 3. RLS
ALTER TABLE public.technician_day_logs ENABLE ROW LEVEL SECURITY;

-- Un technicien voit et insère ses propres lignes
DO $$ BEGIN
  -- SELECT propre
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'technician_day_logs' AND policyname = 'tech_read_own_day_logs'
  ) THEN
    CREATE POLICY "tech_read_own_day_logs" ON public.technician_day_logs
      FOR SELECT USING (auth.uid() = technician_id);
  END IF;

  -- INSERT propre
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'technician_day_logs' AND policyname = 'tech_insert_own_day_logs'
  ) THEN
    CREATE POLICY "tech_insert_own_day_logs" ON public.technician_day_logs
      FOR INSERT WITH CHECK (auth.uid() = technician_id);
  END IF;

  -- Admin lit tout
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'technician_day_logs' AND policyname = 'admin_read_day_logs'
  ) THEN
    CREATE POLICY "admin_read_day_logs" ON public.technician_day_logs
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
