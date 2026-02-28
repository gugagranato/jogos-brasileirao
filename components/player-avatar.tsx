import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
} as const;

type PlayerAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
};

export const PlayerAvatar = ({
  name,
  imageUrl,
  size = "sm",
}: PlayerAvatarProps) => {
  if (!imageUrl) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500",
          sizes[size]
        )}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={cn(
        "rounded-full border border-white object-cover shadow-sm",
        sizes[size]
      )}
    />
  );
};
