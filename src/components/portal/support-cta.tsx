import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function SupportCta() {
  return (
    <section className="rounded-2xl vitespace-gradient-soft px-5 py-5 ring-1 ring-brand/10 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold">Have a question?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Send us a message — we&apos;re here to help.
          </p>
          <Link
            href="/messages"
            className="group mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
          >
            Start Conversation
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
