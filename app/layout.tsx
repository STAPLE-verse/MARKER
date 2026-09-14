import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { auth } from "@/auth";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import { PROFILE_THEME_OPTIONS } from "@/features/users/schemas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MARKER",
  description: "Metadata archive for research knowledge exchange and reuse",
};

const KNOWN_THEMES = PROFILE_THEME_OPTIONS.map((option) => option.value);
const DEFAULT_THEME = "dark";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  // Rendered server-side into the initial HTML — unlike STAPLE's ThemeSelect,
  // which applies the stored theme in a `useEffect` and visibly flashes the
  // default theme on every load, this never flashes: the correct `data-theme`
  // is already present before the browser paints anything.
  const profile = session?.user ? await getUserProfile(Number(session.user.id)) : null;
  const theme = profile && KNOWN_THEMES.includes(profile.theme) ? profile.theme : DEFAULT_THEME;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme={theme}
    >
      <body className="min-h-full flex flex-col bg-base-100 text-base-content">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
