interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
}

export function Avatar({ src = '', name, size = 32 }: AvatarProps) {
  return (
    <img
      src={src || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`}
      alt={name}
      className="rounded-full shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
