import { cn } from "@/lib/utils";

export function AdminPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1080px] animate-fade-up px-1",
        className
      )}
    >
      {children}
    </div>
  );
}
