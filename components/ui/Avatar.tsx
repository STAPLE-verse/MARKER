import React from 'react';
import SparkMD5 from 'spark-md5';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  email?: string | null;
  src?: string | null;
  fallback?: string;
  size?: number;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({
  email,
  src,
  fallback,
  size = 40,
  className,
  ...props
}, ref) => {
  // If src is provided, use it. Otherwise, if email is provided, generate Gravatar.
  let imageSrc = src;
  if (!imageSrc && email) {
    const hash = SparkMD5.hash(email.trim().toLowerCase());
    imageSrc = `https://www.gravatar.com/avatar/${hash}?d=retro&s=${size}`;
  }

  return (
    <div 
      ref={ref}
      className={cn("avatar placeholder", className)} 
      {...props}
    >
      <div className="bg-neutral text-neutral-content rounded-full" style={{ width: size, height: size }}>
        {imageSrc ? (
          <img src={imageSrc} alt="Avatar" width={size} height={size} className="rounded-full object-cover" />
        ) : (
          <span className="text-xl uppercase">{fallback || "?"}</span>
        )}
      </div>
    </div>
  );
});

Avatar.displayName = 'Avatar';
