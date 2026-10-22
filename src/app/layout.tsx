import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, Noto_Serif_SC } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const notoSerifSc = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["500", "700", "900"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Chinese Learning with Groves",
  description:
    "Practice the Chinese words that matter most with flashcards, quizzes and matching games. Every word you master grows your bamboo grove.",
};

export const viewport: Viewport = {
  themeColor: "#f4efe3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable} ${notoSerifSc.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-6 sm:px-6">{children}</main>
          <footer className="border-t border-line py-6 text-center text-sm text-ink-soft">
            学而时习之 — <span className="italic">to learn, and to practice what you learn</span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
