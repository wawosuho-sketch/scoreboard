import type { Metadata } from "next";
import { Outfit, Teko } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Home, Trophy, Calendar, LayoutDashboard, Shield } from "lucide-react";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-teko" });

export const metadata: Metadata = {
  title: "2026 세종특별자치시교육감배 학교스포츠클럽 농구대회",
  description: "공식 현황판 플랫폼 - 경기 일정, 조별 순위, 경기 결과, 결선 대진표 제공",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={cn(outfit.className, teko.variable, "bg-brand-paper-cream text-brand-ink-black antialiased")}>
        {children}
        
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 w-full bg-brand-paper-cream border-t-[3px] border-brand-ink-black z-50 pb-safe shadow-[0_-4px_0_rgba(17,17,17,0.1)]">
          <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex flex-col items-center text-brand-court-orange">
              <Home className="w-5 h-5 mb-1 stroke-[2.5px]" />
              <span className="text-[10px] font-bold">홈</span>
            </Link>
            <Link href="/matches" className="flex flex-col items-center text-brand-ink-black/60 hover:text-brand-ink-black transition-colors">
              <Calendar className="w-5 h-5 mb-1 stroke-[2.5px]" />
              <span className="text-[10px] font-bold">일정</span>
            </Link>
            <Link href="/standings" className="flex flex-col items-center text-brand-ink-black/60 hover:text-brand-ink-black transition-colors">
              <Trophy className="w-5 h-5 mb-1 stroke-[2.5px]" />
              <span className="text-[10px] font-bold">리그</span>
            </Link>
            <Link href="/bracket" className="flex flex-col items-center text-brand-ink-black/60 hover:text-brand-ink-black transition-colors">
              <LayoutDashboard className="w-5 h-5 mb-1 stroke-[2.5px]" />
              <span className="text-[10px] font-bold">토너먼트</span>
            </Link>
            <Link href="/admin/dashboard" className="flex flex-col items-center text-brand-ink-black/60 hover:text-brand-ink-black transition-colors">
              <Shield className="w-5 h-5 mb-1 stroke-[2.5px]" />
              <span className="text-[10px] font-bold">관리자</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  );
}
