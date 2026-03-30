"use client";

import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none">🍑</span>
        <span className="font-bold text-lg text-gray-900 tracking-tight">
          Apricot Forecast
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">
          {session?.user?.name || session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
