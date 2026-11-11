import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SITE } from "@/lib/site";

const SUPPORT_LINKS = [
  { href: "/track", label: "Tra cứu đơn hàng" },
  { href: "/profile", label: "Tài khoản của tôi" },
  { href: "/cart", label: "Giỏ hàng" },
];

const linkClass = "hover:text-red-500 transition-colors";

export default function Footer({ categories = [] }) {
  return (
    <footer className="relative z-10 bg-[#080808] border-t-2 border-red-900 mt-auto text-sm text-gray-400">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="font-doom text-4xl tracking-widest text-red-600 drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]">
            DOOM.
          </Link>
          <p className="mt-4 leading-relaxed text-gray-500">
            Hệ thống bán lẻ thiết bị công nghệ chính hãng: laptop, điện thoại, linh kiện PC và gear chiến game.
          </p>
        </div>

        <nav aria-label="Danh mục sản phẩm">
          <h3 className="font-black uppercase tracking-widest text-white mb-4">Danh mục</h3>
          <ul className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className={linkClass}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ khách hàng">
          <h3 className="font-black uppercase tracking-widest text-white mb-4">Hỗ trợ</h3>
          <ul className="space-y-2">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 text-xs text-gray-500">
            <li>Miễn phí giao hàng toàn quốc</li>
            <li>Đổi trả trong 7 ngày nếu lỗi do nhà sản xuất</li>
            <li>Bảo hành chính hãng</li>
          </ul>
        </nav>

        <div>
          <h3 className="font-black uppercase tracking-widest text-white mb-4">Liên hệ</h3>
          <ul className="space-y-3">
            <li className="flex gap-3"><MapPin size={18} className="text-red-600 shrink-0" /> {SITE.address}</li>
            <li className="flex gap-3"><Phone size={18} className="text-red-600 shrink-0" /> <span>Hotline: <span className="text-white font-bold">{SITE.hotline}</span></span></li>
            <li className="flex gap-3"><Clock size={18} className="text-red-600 shrink-0" /> {SITE.hours}</li>
            <li className="flex gap-3"><Mail size={18} className="text-red-600 shrink-0" /> {SITE.email}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-red-950 py-5 px-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} {SITE.name}. Thiết kế bởi Sinh Viên.
      </div>
    </footer>
  );
}
