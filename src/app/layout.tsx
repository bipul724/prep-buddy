import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prep Buddy",
  description: "An offline, private mock-interview coach powered by Gemma on your own laptop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Prep Buddy
            </Link>
            <StatusBadge />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="px-4 py-4 text-center text-xs text-muted">
          Runs on your laptop · Gemma via Ollama · your answers never leave this machine
        </footer>
      </body>
    </html>
  );
}
