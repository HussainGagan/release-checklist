import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Release Checklist Tool",
  description: "Track release progress across reusable checklist steps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
