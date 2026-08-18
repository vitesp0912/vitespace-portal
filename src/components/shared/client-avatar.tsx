import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ClientAvatar({
  src,
  name,
  className,
  rounded = "full",
}: {
  src?: string | null;
  name: string;
  className?: string;
  rounded?: "full" | "xl";
}) {
  return (
    <span
      className={cn(
        "relative isolate block aspect-square shrink-0 overflow-hidden bg-black text-brand ring-1 ring-border/50",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 size-full max-h-none max-w-none object-cover object-center"
        />
      ) : (
        <span className="flex size-full items-center justify-center bg-brand/10 font-semibold">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
