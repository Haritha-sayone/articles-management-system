import React, { memo } from 'react';

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User',
  size = 'md',
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`
        relative rounded-full overflow-hidden flex items-center justify-center bg-blue-100 text-blue-800 font-medium
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className={`text-${size === 'sm' ? 'xs' : size === 'md' ? 'sm' : size === 'lg' ? 'base' : 'lg'}`}>
          {getInitials(alt)}
        </span>
      )}
    </div>
  );
};

export default memo(Avatar);