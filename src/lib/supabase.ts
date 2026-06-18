import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Creates a signed URL for a file in a Supabase storage bucket.
 * @param bucket - The bucket name (e.g., 'mission-photos', 'avatars', 'signatures')
 * @param path - The file path within the bucket
 * @param expiresIn - The number of seconds until the URL expires (default: 3600 = 1 hour)
 * @returns The signed URL string, or null if an error occurred
 */
export const createSignedUrl = async (
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> => {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    console.error(`Error creating signed URL for bucket ${bucket} path ${path}:`, error);
    return null;
  }
  return data?.signedUrl ?? null;
};
