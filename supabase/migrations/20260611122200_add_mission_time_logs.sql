-- ======================================================
-- Table : mission_time_logs
-- Enregistre les heures réelles de travail par technicien
-- et par mission (pointage début/fin).
-- ======================================================

CREATE TABLE IF NOT EXISTS public.mission_time_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  start_time    timestamptz NOT NULL,
  end_time      timestamptz,                -- null tant que le technicien n'a pas clôturé
  note          text,                       -- commentaire libre optionnel
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index pour requêtes fréquentes (par mission, par technicien)
CREATE INDEX IF NOT EXISTS idx_time_logs_mission    ON public.mission_time_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_technician ON public.mission_time_logs(technician_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_time_log_updated_at
  BEFORE UPDATE ON public.mission_time_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS : un technicien ne voit et ne modifie que ses propres logs.
-- Les admins voient tout.
ALTER TABLE public.mission_time_logs ENABLE ROW LEVEL SECURITY;

-- Policy : lecture (technicien = ses propres logs, admin = tous)
CREATE POLICY "time_logs_select" ON public.mission_time_logs
  FOR SELECT USING (
    auth.uid() = technician_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Policy : insertion (uniquement son propre log)
CREATE POLICY "time_logs_insert" ON public.mission_time_logs
  FOR INSERT WITH CHECK (auth.uid() = technician_id);

-- Policy : mise à jour (uniquement son propre log, ou admin)
CREATE POLICY "time_logs_update" ON public.mission_time_logs
  FOR UPDATE USING (
    auth.uid() = technician_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Policy : suppression (uniquement son propre log, ou admin)
CREATE POLICY "time_logs_delete" ON public.mission_time_logs
  FOR DELETE USING (
    auth.uid() = technician_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );
