import Link from "next/link";
import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="Prep Buddy home">
            <Logo />
          </Link>
          <StatusBadge />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-muted">
        Runs on your laptop · Gemma via Ollama · your answers never leave this machine
      </footer>
    </>
  );
}
