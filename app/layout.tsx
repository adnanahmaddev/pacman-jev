import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAC-MAN // JEV SYSTEM ONE",
  description: "Autonomous Pac-Man driven by TypeSafe AI's JEV System One decision model in a monochromatic light design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased selection:bg-neutral-900 selection:text-neutral-50">
        {children}
      </body>
    </html>
  );
}
