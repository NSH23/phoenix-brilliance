/**
 * Admin-only avatar: resolves admin-avatars storage path/URL and displays image.
 * Use ONLY inside admin dashboard (e.g. sidebar, Settings → Admin users list).
 * Never use on public routes.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createSignedUrl } from '@/services/storage';

interface AdminUserAvatarProps {
  avatarUrl: string | null | undefined;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };

export default function AdminUserAvatar({ avatarUrl, name, className = '', size = 'md' }: AdminUserAvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarUrl) {
      setSrc(null);
      return;
    }
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      setSrc(avatarUrl);
      return;
    }
    let cancelled = false;
    createSignedUrl('admin-avatars', avatarUrl, 3600)
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => {
        if (!cancelled) {
          const { data } = supabase.storage.from('admin-avatars').getPublicUrl(avatarUrl);
          setSrc(data.publicUrl);
        }
      });
    return () => { cancelled = true; };
  }, [avatarUrl]);

  const initial = name?.trim().charAt(0)?.toUpperCase() || '?';
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-primary/20 text-primary font-semibold ${className}`}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm">{initial}</span>
      )}
    </div>
  );
}
