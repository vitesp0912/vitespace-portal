import { cn } from "@/lib/utils";

export function PortalPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-up",
        className
      )}
    >
      {children}
    </div>
  );
}
