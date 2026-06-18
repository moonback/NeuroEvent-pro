-- ============================================
-- Fix storage bucket: make signatures bucket private and remove public policies
-- ============================================

-- Make signatures bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'signatures';

-- Drop existing public policies for signatures (if they exist)
DROP POLICY IF EXISTS "Public Access Signatures" ON storage.objects;
DROP POLICY IF EXISTS "Public Uploads Signatures" ON storage.objects;
DROP POLICY IF EXISTS "Public Deletes Signatures" ON storage.objects;

-- Create an insert policy for signatures (allow authenticated users)
CREATE POLICY "signatures_insert_authenticated" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'signatures');

-- Create a delete policy for signatures (allow authenticated users)
CREATE POLICY "signatures_delete_authenticated" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'signatures');

-- Note: We do not create a select policy because we will use signed URLs.