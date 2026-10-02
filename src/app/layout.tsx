import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prep Buddy",
  description: "An offline, private mock-interview coach powered by Gemma on your own laptop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
