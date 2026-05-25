-- ============================================================
-- DompetKu - Add photo_url column to transactions
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Add photo_url column
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- Storage Bucket Policy for transaction-photos
-- ============================================================
-- NOTE: You must first create the bucket 'transaction-photos'
-- manually in Supabase Dashboard > Storage (set as PUBLIC).
--
-- Then run these policies:

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload transaction photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transaction-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view transaction photos (public bucket)
CREATE POLICY "Transaction photos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'transaction-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own transaction photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'transaction-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
