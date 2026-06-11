-- Ajouter les colonnes `skills` et `driver_license` à la table `technicians`
ALTER TABLE public.technicians
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS driver_license jsonb DEFAULT '{"hasLicense": false, "since": "", "categories": []}'::jsonb;
