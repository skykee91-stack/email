"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";

interface SessionUser {
  email?: string | null;
  name?: string | null;
  role?: 'ADMIN' | 'CUSTOMER' | null;
}

// 사이드바 메뉴 항목 정의
const menuItems = [
  { name: "대시보드", path: "/", icon: "📊" },
  { name: "수집 관리", path: "/scrape", icon: "🔍" },
  { name: "수집 이력", path: "/scrape-history", icon: "📋" },
  { name: "업체 목록", path: "/businesses", icon: "🏢" },
  { name: "캠페인 (주문)", path: "/campaigns", icon: "📦" },
  { name: "이메일 발송", path: "/email", icon: "📧" },
  { name: "템플릿", path: "/templates", icon: "📝" },
  { name: "팔로업", path: "/followup", icon: "🔄" },
  { name: "통계", path: "/stats", icon: "📈" },
  { name: "인사이트", path: "/insights", icon: "💡" },
  { name: "핫 리드", path: "/leads", icon: "🔥" },
  { name: "ROI", path: "/roi", icon: "💰" },
  { name: "설정", path: "/settings", icon: "⚙️" },
];

export default function Sidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* 로고 영역 */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">셀포 메일러</h1>
        <p className="text-sm text-gray-400 mt-1">
          {user?.role === 'ADMIN' ? '어드민 · 전체 보기' : 'B2B 영업 자동화'}
        </p>
      </div>

      {/* 메뉴 목록 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 사용자 메뉴 */}
      <div className="p-3 border-t border-gray-800">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
