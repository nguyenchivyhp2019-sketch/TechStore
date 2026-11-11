"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { Smartphone, Tablet, Laptop, Monitor, Cpu, Headphones, Mouse, Keyboard, Glasses, LayoutGrid, Menu, X } from "lucide-react";

const iconMap = {
  "dien-thoai": Smartphone, "may-tinh-bang": Tablet, "laptop": Laptop, "pc-theo-nganh": Monitor,
  "linh-kien-pc": Cpu, "tai-nghe": Headphones, "chuot": Mouse, "ban-phim": Keyboard, "kinh-ai": Glasses,
};

export default function Sidebar({ categories }) {
  const { isMenuOpen, setIsMenuOpen } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || isMenuOpen;

  return (
    <>
      {isMenuOpen && <div className="fixed inset-0 bg-black/80 z-[55] md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>}
      
      <aside
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        // Nền đen tuyền, dính sát lề, viền đỏ bên phải
        className={`fixed top-0 left-0 h-screen bg-[#050505] border-r-2 border-red-900 transition-all duration-300 ease-in-out z-[60] flex flex-col py-4 overflow-hidden 
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
        ${isExpanded ? "w-[260px]" : "w-[70px]"}`}
      >
        <div className="flex items-center justify-between px-4 mb-6 h-10 flex-shrink-0 mt-2">
          {/* Nút menu phát sáng */}
          <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 bg-[#1a0505] hover:bg-red-800 border border-red-700 rounded-none flex items-center justify-center flex-shrink-0 cursor-pointer transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            <Menu size={20} className="text-red-500" strokeWidth={2.5} />
          </div>
          {isMenuOpen && (
            <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center bg-[#1a0505] rounded-none text-red-500 transition-colors md:hidden border border-red-800">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-10">
          <Link href="/" onClick={() => setIsMenuOpen(false)} 
            // Hover sẽ hiện vạch đỏ bên trái
            className="flex items-center px-4 py-3 hover:bg-red-950/30 border-l-4 border-transparent hover:border-red-600 transition-all group">
            <div className="w-10 flex justify-center flex-shrink-0 text-gray-500 group-hover:text-red-500 transition-colors">
              <LayoutGrid size={22} strokeWidth={2} />
            </div>
            <span className={`ml-2 font-bold uppercase italic tracking-wider text-sm text-gray-300 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
              Tất cả sản phẩm
            </span>
          </Link>

          {categories.map((cat) => {
            const IconComponent = iconMap[cat.slug] || LayoutGrid;
            return (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} onClick={() => setIsMenuOpen(false)} 
                className="flex items-center px-4 py-3 hover:bg-red-950/30 border-l-4 border-transparent hover:border-red-600 transition-all group">
                <div className="w-10 flex justify-center flex-shrink-0 text-gray-500 group-hover:text-red-500 transition-colors">
                  <IconComponent size={22} strokeWidth={2} />
                </div>
                <span className={`ml-2 font-bold uppercase italic tracking-wider text-sm text-gray-400 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}