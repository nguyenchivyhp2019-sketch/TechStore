"use client";
import Link from "next/link";
import { CUT_BUTTON, btnPrimary, btnGhost } from "@/lib/ui";

export default function Error({ reset }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-doom text-6xl md:text-7xl text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] mb-4">ERROR</p>
      <h1 className="text-2xl font-black uppercase tracking-wide text-white mb-3">Đã xảy ra lỗi</h1>
      <p className="text-gray-500 mb-8 max-w-md">Hệ thống gặp sự cố khi tải dữ liệu. Vui lòng thử lại sau ít phút.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={() => reset()} className={btnPrimary} style={{ clipPath: CUT_BUTTON }}>Thử lại</button>
        <Link href="/" className={btnGhost}>Về trang chủ</Link>
      </div>
    </div>
  );
}
