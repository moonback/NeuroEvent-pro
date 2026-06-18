-- ============================================
-- Make mission_photos.url nullable to store file path only and generate signed URLs on demand
-- ============================================

ALTER TABLE public.mission_photos
ALTER COLUMN url DROP NOT NULL;