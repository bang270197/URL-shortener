import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Shortly", description: "Create concise links with clear analytics." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
