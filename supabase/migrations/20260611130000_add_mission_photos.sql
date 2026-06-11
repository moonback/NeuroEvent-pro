-- ======================================================
-- Table : mission_photos
-- Enregistre les photos preuves (avant / après montage)
-- associées aux missions.
-- ======================================================

CREATE TABLE IF NOT EXISTS public.mission_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id  uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('before', 'after')),
  url         text NOT NULL,
  file_path   text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index pour requêtes fréquentes (par mission)
CREATE INDEX IF NOT EXISTS idx_mission_photos_mission ON public.mission_photos(mission_id);

-- Activer la RLS
ALTER TABLE public.mission_photos ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour la démonstration / test sur le terrain
CREATE POLICY "mission_photos_select" ON public.mission_photos FOR SELECT USING (true);
CREATE POLICY "mission_photos_insert" ON public.mission_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "mission_photos_delete" ON public.mission_photos FOR DELETE USING (true);

-- Permissions d'accès aux rôles Supabase API
GRANT ALL ON TABLE public.mission_photos TO anon, authenticated;

-- ======================================================
-- Bucket de Stockage : mission-photos
-- Créé pour héberger les images de preuve.
-- ======================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-photos', 'mission-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies publiques pour le bucket mission-photos
CREATE POLICY "Public Access Photos" ON storage.objects FOR SELECT USING (bucket_id = 'mission-photos');
CREATE POLICY "Public Uploads Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mission-photos');
CREATE POLICY "Public Deletes Photos" ON storage.objects FOR DELETE USING (bucket_id = 'mission-photos');
