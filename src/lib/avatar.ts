import { supabase } from './supabase';

/**
 * Helpers pour la gestion des avatars utilisateur (upload, compression, suppression).
 *
 * Flux complet :
 *   1. validateAvatarFile() — vérifie le type MIME et la taille (≤ 5 MB)
 *   2. compressAvatar()      — carré centré + redimensionnement 512px + WebP/JPEG
 *   3. uploadAvatar()        — upload dans le bucket `avatars/{user_id}/avatar-{ts}.webp`
 *   4. persistAvatarUrl()    — met à jour profiles.avatar_url
 *   5. removeAvatar()        — supprime le fichier Storage et clear la colonne
 */

const BUCKET = 'avatars';
const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB avant compression
const MAX_OUTPUT_SIZE = 512; // côté max du carré final (suffisant pour retina)
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AcceptedMime = (typeof ACCEPTED_MIME)[number];

/** Vérifie qu'un fichier est acceptable avant de tenter la compression. */
export function validateAvatarFile(file: File): { ok: true } | { ok: false; reason: string } {
  if (!ACCEPTED_MIME.includes(file.type as AcceptedMime)) {
    return { ok: false, reason: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, reason: `Image trop volumineuse (${(file.size / 1024 / 1024).toFixed(1)} MB, max 5 MB).` };
  }
  return { ok: true };
}

/** Détecte si le navigateur supporte l'encodage WebP via canvas. */
function supportsWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    return dataUrl.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Compresse un fichier image en un Blob carré 512px (WebP si supporté, JPEG sinon).
 * Le crop est centré pour garantir un avatar rond propre, peu importe le ratio source.
 */
export async function compressAvatar(file: File): Promise<{ blob: Blob; ext: 'webp' | 'jpg' }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  // Crop centré carré
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  // Resize côté max
  const scale = Math.min(1, MAX_OUTPUT_SIZE / side);
  const dstW = Math.round(side * scale);
  const dstH = Math.round(side * scale);

  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non supporté.');

  // Lissage haute qualité
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, dstW, dstH);

  const useWebP = supportsWebP();
  const mime = useWebP ? 'image/webp' : 'image/jpeg';
  const quality = 0.9;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Échec de l\'encodage de l\'image.'))),
      mime,
      quality
    );
  });

  return { blob, ext: useWebP ? 'webp' : 'jpg' };
}

/**
 * Upload un avatar pour un user donné. Retourne l'URL publique + le chemin storage.
 * Si un ancien `currentPath` est fourni, il est supprimé du bucket avant l'upload
 * (pour éviter l'accumulation de fichiers orphelins).
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  currentPath?: string | null
): Promise<{ url: string; path: string }> {
  const validation = validateAvatarFile(file);
  if (validation.ok === false) throw new Error(validation.reason);

  const { blob, ext } = await compressAvatar(file);

  // Supprime l'ancien fichier (best-effort : on n'échoue pas si ça ne marche pas)
  if (currentPath) {
    await supabase.storage.from(BUCKET).remove([currentPath]);
  }

  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: ext === 'webp' ? 'image/webp' : 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Échec de l'upload : ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Extrait le chemin storage à partir d'une URL publique.
 * Ex : "https://xxx.supabase.co/storage/v1/object/public/avatars/{userId}/avatar-1.webp"
 *   → "{userId}/avatar-1.webp"
 */
export function pathFromPublicUrl(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Supprime l'avatar storage d'un user et clear la colonne `profiles.avatar_url`.
 * Idempotent : ne fait rien si aucun avatar n'est set.
 */
export async function removeAvatar(userId: string, currentUrl: string | null | undefined): Promise<void> {
  const path = pathFromPublicUrl(currentUrl);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
  await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
}

/** Met à jour la colonne `profiles.avatar_url` pour un user. */
export async function persistAvatarUrl(userId: string, url: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId);
  if (error) throw new Error(`Échec de la sauvegarde : ${error.message}`);
}
