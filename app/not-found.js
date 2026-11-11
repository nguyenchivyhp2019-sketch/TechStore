import Link from "next/link";
import { CUT_BUTTON, btnPrimary, btnGhost } from "@/lib/ui";

export const metadata = { title: "Không tìm thấy trang" };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-doom text-8xl md:text-9xl text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] mb-4">404</p>
      <h1 className="text-2xl font-black uppercase tracking-wide text-white mb-3">Không tìm thấy trang</h1>
      <p className="text-gray-500 mb-8 max-w-md">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className={btnPrimary} style={{ clipPath: CUT_BUTTON }}>Về trang chủ</Link>
        <Link href="/products" className={btnGhost}>Xem sản phẩm</Link>
      </div>
    </div>
  );
}
