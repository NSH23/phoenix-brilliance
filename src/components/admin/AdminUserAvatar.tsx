/**
 * Admin-only avatar: resolves admin-avatars storage path/URL and displays image.
 * Use ONLY inside admin dashboard (e.g. sidebar, Settings → Admin users list).
 * Never use on public routes.
 * Uses getPublicUrl for the public admin-avatars bucket so avatars load without signed URLs.
 */
import { useState, useEffect } from 'react';
import { getPublicUrl } from '@/services/storage';

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
    setSrc(getPublicUrl('admin-avatars', avatarUrl));
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
