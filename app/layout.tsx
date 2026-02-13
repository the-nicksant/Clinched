import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { ConvexClientProvider } from "./providers";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";

const oswaldSans = Oswald({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinched - MMA Fantasy",
  description: "Build your dream MMA roster and compete for glory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${oswaldSans.variable} font-sans antialiased bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950`}
        >
          <ConvexClientProvider>
            <TooltipProvider>
              <header className="sticky top-0 z-50 border-b border-cyan-900/30 bg-zinc-950/80 backdrop-blur">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                  <Link href="/" className="text-xl font-bold text-white">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      Clinched
                    </span>
                  </Link>
                  <nav className="flex items-center gap-4">
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button className="text-sm font-medium text-zinc-300 transition-colors hover:text-cyan-400">
                          Sign In
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-cyan-500 hover:to-blue-500">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <Link
                        href="/my-rosters"
                        className="text-sm font-medium text-zinc-300 transition-colors hover:text-cyan-400"
                      >
                        My Rosters
                      </Link>
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </nav>
                </div>
              </header>
              <main className="container mx-auto px-4 py-8 font-sans">{children}</main>
            </TooltipProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
