"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

interface LockedModuleOverlayProps {
  moduleTitle: string;
}

/**
 * Full-area overlay rendered in place of a module the current user is not
 * allowed to access based on their subscription's allowedModules list.
 */
export default function LockedModuleOverlay({ moduleTitle }: LockedModuleOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-[#0d1117]/90 backdrop-blur-sm select-none">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30">
        <Lock className="w-6 h-6 text-yellow-400" />
      </div>
      <div className="text-center px-4">
        <p className="text-sm font-semibold text-gray-200">{moduleTitle}</p>
        <p className="text-xs text-gray-400 mt-1">
          Gói đăng ký hiện tại không bao gồm tính năng này
        </p>
      </div>
      <Link
        href="/profile"
        className="mt-1 px-4 py-1.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-colors"
      >
        Nâng cấp gói
      </Link>
    </div>
  );
}
