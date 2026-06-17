import React from 'react';
import { cn } from '../../lib/utils';
import { createSignedUrl } from '../../lib/supabase';

/**
 * Calcule les initiales à partir d'un nom complet.
 * - "Jean-Marc Dupont" → "JD"
 * - "Marie" → "M"
 * - "Marc" + "Dupont" (séparés) → "MD"
 * - "" ou undefined → "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Tailles prédéfinies (cohérence visuelle dans toute l'app)         */
/* ------------------------------------------------------------------ */

const SIZE_STYLES: Record<UserAvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
};

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UserAvatarProps {
  /** URL publique de l'avatar (null = fallback initiales) */
  src?: string | null;
  /** Nom complet — sert à calculer les initiales ET l'attribut alt */
  name: string | null | undefined;
  /** Taille prédéfinie (défaut: md) */
  size?: UserAvatarSize;
  /** Variant visuel du fond fallback */
  variant?: 'emerald' | 'blue' | 'violet' | 'amber' | 'slate';
  /** Classes CSS additionnelles pour cas spéciaux (marges, position absolute…) */
  className?: string;
  /** Forme : 'rounded2xl' (défaut, app style) ou 'circle' (header, badges) */
  shape?: 'rounded' | 'circle';
  /** Empêche l'affichage d'image si vraie (utile quand on veut juste les initiales) */
  initialsOnly?: boolean;
  /** Texte alt pour l'image (par défaut: "Photo de {name}") */
  alt?: string;
  /** Objet d'événements à forwarder au wrapper (pour overlays, position absolue…) */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** ARIA */
  role?: string;
  'aria-label'?: string;
};

const VARIANT_GRADIENTS: Record<NonNullable<UserAvatarProps['variant']>, string> = {
  emerald: 'linear-gradient(135deg, rgba(0,229,160,0.22) 0%, rgba(77,159,255,0.22) 100%)',
  blue:    'linear-gradient(135deg, rgba(77,159,255,0.25) 0%, rgba(139,92,246,0.22) 100%)',
  violet:  'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(236,72,153,0.22) 100%)',
  amber:   'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(239,68,68,0.22) 100%)',
  slate:   'linear-gradient(135deg, rgba(100,116,139,0.25) 0%, rgba(71,85,105,0.22) 100%)',
};

const VARIANT_BORDERS: Record<NonNullable<UserAvatarProps['variant']>, string> = {
  emerald: 'rgba(0,229,160,0.40)',
  blue:    'rgba(77,159,255,0.40)',
  violet:  'rgba(139,92,246,0.40)',
  amber:   'rgba(245,158,11,0.40)',
  slate:   'rgba(148,163,184,0.40)',
};

const VARIANT_COLORS: Record<NonNullable<UserAvatarProps['variant']>, string> = {
  emerald: 'var(--tech-accent, #00e5a0)',
  blue:    '#4d9fff',
  violet:  '#8b5cf6',
  amber:   '#f59e0b',
  slate:   '#94a3b8',
};

/**
 * Avatar utilisateur unifié pour toute l'app.
 *
 * Affichage conditionnel :
 *   - Si `src` est non-null et non-vide ET `initialsOnly` est faux → <img>
 *   - Sinon → initiales sur gradient (avec couleur selon variant)
 *
 * L'image est lazy-loadée par défaut pour ne pas bloquer le rendu initial
 * des listes longues.
 */
export function UserAvatar({
  src,
  name,
  size = 'md',
  variant = 'emerald',
  shape = 'rounded',
  className,
  initialsOnly = false,
  alt,
  onClick,
  role,
  ...aria
}: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  useEffect(() => {
    if (src && typeof src === 'string' && !src.startsWith('http')) {
      // It's a filePath, generate signed URL for avatars bucket
      createSignedUrl('avatars', src).then((signedUrl) => {
        setAvatarSrc(signedUrl ?? src); // fallback to src if signedUrl is null
      });
    } else {
      setAvatarSrc(src);
    }
  }, [src]);

  const showImage = !initialsOnly && avatarSrc && avatarSrc.length > 0;
  const initials = getInitials(name);
  const altText = alt ?? (name ? `Photo de ${name}` : 'Avatar utilisateur');

  return (
    <div
      className={cn(
        'flex items-center justify-center font-black border-2 shadow-sm overflow-hidden relative shrink-0',
        SIZE_STYLES[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{
        background: VARIANT_GRADIENTS[variant],
        borderColor: VARIANT_BORDERS[variant],
        color: VARIANT_COLORS[variant],
      }}
      onClick={onClick}
      role={role}
      {...aria}
    >
      {showImage ? (
        <img
          src={avatarSrc}
          alt={altText}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Si l'image échoue à charger (URL cassée, fichier supprimé), bascule sur les initiales
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span aria-label={altText}>{initials}</span>
      )}
    </div>
  );
}

export default UserAvatar;