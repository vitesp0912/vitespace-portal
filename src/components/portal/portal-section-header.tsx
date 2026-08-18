import { cn } from "@/lib/utils";

interface PortalSectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PortalSectionHeader({
  title,
  description,
  action,
  className,
}: PortalSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="w-full shrink-0 lg:w-auto">{action}</div>}
    </div>
  );
}
