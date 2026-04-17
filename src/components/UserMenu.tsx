'use client'

import { useState } from 'react'

interface SessionUser {
  email?: string | null
  name?: string | null
  role?: 'ADMIN' | 'CUSTOMER' | null
}

export default function UserMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false)
  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {(user.name || user.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">
            {user.name || user.email}
          </div>
          <div className="text-[10px] text-gray-400 truncate">
            {user.role === 'ADMIN' ? '관리자' : '고객'}
          </div>
        </div>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          {user.role === 'ADMIN' && (
            <a
              href="/admin"
              className="block px-4 py-2.5 text-xs text-blue-400 hover:bg-gray-700 border-b border-gray-700"
            >
              🔧 어드민 모드
            </a>
          )}
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-gray-700"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
