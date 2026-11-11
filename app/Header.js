"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingBag, Menu, User, ArrowRight } from "lucide-react";

const removeAccents = (str = "") =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

const qLink = (text) => `/products?q=${encodeURIComponent(text)}`;

const MENU_DATA = {
  Laptop: {
    viewAll: "/products?category=laptop",
    categories: [
      {
        title: "Khám phá Laptop",
        links: [
          { name: "MacBook Air", href: qLink("MacBook Air") },
          { name: "MacBook Pro", href: qLink("MacBook Pro") },
          { name: "Laptop Gaming", href: qLink("Gaming") },
          { name: "Laptop Văn phòng", href: qLink("Văn phòng") },
        ],
      },
      {
        title: "Mua sắm theo Hãng",
        links: [
          { name: "Apple", href: "/products?category=laptop&brand=Apple", subItems: [{ name: "MacBook Air", href: qLink("MacBook Air") }, { name: "MacBook Pro", href: qLink("MacBook Pro") }] },
          { name: "ASUS", href: "/products?category=laptop&brand=ASUS" },
          { name: "Dell", href: "/products?category=laptop&brand=Dell" },
        ],
      },
    ],
  },
  "Điện thoại": {
    viewAll: qLink("Điện thoại"),
    categories: [
      {
        title: "Khám phá Điện thoại",
        links: [
          { name: "iPhone", href: qLink("iPhone"), subItems: [{ name: "iPhone 15", href: qLink("iPhone 15") }, { name: "iPhone 16", href: qLink("iPhone 16") }, { name: "iPhone 17", href: qLink("iPhone 17") }] },
        ],
      },
    ],
  },
  "Linh kiện": {
    viewAll: qLink("Linh kiện"),
    categories: [
      {
        title: "Linh kiện máy tính",
        links: [
          { name: "Card màn hình (VGA)", href: qLink("VGA"), subItems: [{ name: "RTX 40 Series", href: qLink("RTX 40") }] },
          { name: "RAM máy tính", href: qLink("RAM") },
        ],
      },
    ],
  },
  Loa: {
    viewAll: "/products?category=loa",
    categories: [
      {
        title: "Phân loại Loa",
        links: [
          { name: "Tất cả Loa", href: "/products?category=loa" },
          { name: "Loa vi tính 2.0", href: "/products?category=loa&q=2.0" },
          { name: "Loa vi tính 2.1", href: "/products?category=loa&q=2.1" },
          { name: "Loa Bookshelf", href: "/products?category=loa&q=bookshelf" },
          { name: "Loa có Bluetooth", href: "/products?category=loa&q=bluetooth" },
        ],
      },
      {
        title: "Thương hiệu",
        links: [
          { name: "Logitech", href: "/products?category=loa&brand=Logitech" },
          { name: "Edifier", href: "/products?category=loa&brand=Edifier" },
          { name: "Creative", href: "/products?category=loa&brand=Creative" },
          { name: "Microlab", href: "/products?category=loa&brand=Microlab" },
        ],
      },
    ],
  },
};

const GLOW = "hover:text-red-500 hover:drop-shadow-[0_0_10px_rgba(220,38,38,1)]";

export default function Header({ products = [] }) {
  const { count, isMenuOpen, setIsMenuOpen } = useCart();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(null);
  const menuTimeout = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => { setActiveMenu(null); setIsFocused(false); }, [pathname]);

  useEffect(() => {
    return () => { if (menuTimeout.current) clearTimeout(menuTimeout.current); };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setActiveMenu(null); setIsFocused(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsFocused(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const openMenu = (menuName) => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setActiveMenu(menuName);
  };

  const handleMouseLeave = () => { menuTimeout.current = setTimeout(() => setActiveMenu(null), 150); };
  const toggleMenu = (menuName) => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setActiveMenu((cur) => (cur === menuName ? null : menuName));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length === 0) { setSuggestions([]); return; }
    const searchQuery = removeAccents(value.toLowerCase()).trim();
    const searchWords = searchQuery.split(/\s+/);
    const searchQueryWithDash = searchQuery.replace(/\s+/g, "-");
    const matched = products.filter((p) => {
        const nameAndBrand = removeAccents(`${p.name ?? ""} ${p.brand ?? ""}`.toLowerCase());
        const category = removeAccents((p.category ?? "").toLowerCase());
        return searchWords.every((word) => nameAndBrand.includes(word) || category.includes(word) || category.includes(searchQueryWithDash));
      }).slice(0, 5);
    setSuggestions(matched);
  };

  const menuNames = Object.keys(MENU_DATA);

  return (
    <header className="sticky top-0 z-50 bg-[#050505] border-b-2 border-red-900 shadow-[0_4px_20px_rgba(220,38,38,0.2)]" onMouseLeave={handleMouseLeave}>
      <div className="max-w-[1400px] mx-auto px-4 h-[80px] flex items-center justify-between gap-2 md:gap-8 relative z-50">
        
        <div className="flex items-center gap-2 md:gap-4">
          <button type="button" aria-label="Mở danh mục" onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-red-500 hover:text-white transition-colors">
            <Menu size={28} />
          </button>
          {/* CHỈ LOGO NÀY GIỮ FONT DOOM */}
          <Link href="/" className="font-doom text-4xl md:text-5xl tracking-widest text-red-600 hover:text-white transition-all duration-300 uppercase drop-shadow-[0_0_15px_rgba(220,38,38,1)]">
            DOOM.
          </Link>
        </div>

        {/* Menu dùng font-sans thông thường */}
        <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-6 xl:gap-8 text-base font-bold uppercase tracking-wider text-gray-400 h-full font-sans">
          <button type="button" onClick={() => setIsMenuOpen(true)} className={`${GLOW} transition-all py-5`}>
            Danh mục
          </button>
          <Link href="/products" className={`${GLOW} transition-all py-5`}>
            Kho vũ khí
          </Link>

          {menuNames.map((menuName) => {
            const isActive = activeMenu === menuName;
            return (
              <button
                key={menuName}
                type="button"
                aria-haspopup="true"
                aria-expanded={isActive}
                onMouseEnter={() => openMenu(menuName)}
                onFocus={() => openMenu(menuName)}
                onClick={() => toggleMenu(menuName)}
                className={`relative h-full flex items-center cursor-pointer py-5 uppercase font-bold tracking-widest transition-all ${
                  isActive ? "text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,1)]" : "text-gray-400 hover:text-red-500"
                }`}
              >
                {menuName}
                <span className={`absolute bottom-0 left-0 h-[3px] bg-red-600 transition-all duration-300 ${isActive ? "w-full" : "w-0"}`} />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 md:gap-5 relative z-50">
          <Link href="/products" aria-label="Tìm kiếm" className={`lg:hidden text-gray-400 ${GLOW} transition-all`}>
            <Search size={26} strokeWidth={2.5} />
          </Link>

          <div className="hidden lg:block relative" ref={searchRef}>
            <form action="/products" method="GET" onSubmit={() => setIsFocused(false)}>
              <input
                type="search" name="q" value={query} onChange={handleSearch} onFocus={() => setIsFocused(true)} placeholder="Tìm vũ khí..." aria-label="Tìm kiếm sản phẩm"
                className="w-64 focus:w-80 bg-[#111] text-gray-200 text-base rounded-none pl-12 pr-4 py-2.5 border border-gray-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all duration-300 font-sans"
                autoComplete="off"
              />
              <Search size={20} className="absolute left-4 top-3 text-gray-500 pointer-events-none" />
            </form>

            {isFocused && query.trim().length > 0 && (
              <div className="absolute top-full right-0 mt-3 w-96 bg-[#050505] shadow-2xl overflow-hidden border-2 border-red-900 z-50 font-sans">
                {suggestions.length > 0 ? (
                  <ul>
                    {suggestions.map((p) => {
                      const img = p.image_url || p.image;
                      return (
                        <li key={p.id}>
                          <Link href={`/products/${p.id}`} onClick={() => setIsFocused(false)} className="flex items-center gap-3 p-3 hover:bg-red-950/40 border-b border-gray-800 last:border-0 transition-colors">
                            <div className="w-12 h-12 bg-white flex items-center justify-center p-1 flex-shrink-0 border border-gray-700">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt={p.name} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <span className="text-[10px] text-gray-600">Ảnh</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-sans font-bold text-gray-200 text-base line-clamp-1">{p.name}</p>
                              <p className="font-sans text-red-500 text-sm font-bold mt-0.5">{formatPrice(p.price)}</p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-red-500 text-lg font-bold uppercase font-sans">Không tìm thấy vũ khí.</div>
                )}
              </div>
            )}
          </div>

          <Link href={user ? "/profile" : "/login"} aria-label={user ? "Tài khoản" : "Đăng nhập"} className={`relative text-gray-400 ${GLOW} transition-all`}>
            <User size={26} strokeWidth={2.5} />
            {user && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-[#050505] rounded-full motion-safe:animate-pulse" />}
          </Link>

          <Link href="/cart" aria-label={`Giỏ hàng${count > 0 ? ` (${count} sản phẩm)` : ""}`} className={`relative text-gray-400 ${GLOW} transition-all`}>
            <ShoppingBag size={26} strokeWidth={2.5} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-red-700 text-white text-xs font-bold min-w-[20px] h-[20px] px-1 flex items-center justify-center border border-red-500 font-sans">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div aria-hidden="true" className={`fixed inset-0 top-[82px] bg-black/90 z-40 transition-opacity duration-300 ${activeMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setActiveMenu(null)} />

      <div className={`absolute top-[82px] left-0 w-full bg-[#050505] border-b-2 border-red-900 shadow-2xl overflow-hidden z-50 transition-all duration-300 ease-in-out grid ${activeMenu ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
        <div className="overflow-hidden">
          {activeMenu && MENU_DATA[activeMenu] && (
            <div className="max-w-[1400px] mx-auto px-4 py-12">
              <div className="flex flex-col md:flex-row gap-10 md:gap-20">
                {MENU_DATA[activeMenu].categories.map((col) => (
                  <div key={col.title} className="flex flex-col gap-4 min-w-[250px]">
                    <h3 className="font-sans text-sm font-bold text-red-600 tracking-wider mb-2 border-b border-red-900 pb-2 inline-block uppercase">
                      {col.title}
                    </h3>
                    {col.links.map((link) => (
                      <div key={link.name} className="group/sub flex flex-col">
                        <Link href={link.href} onClick={() => setActiveMenu(null)} className="font-sans text-xl font-bold text-gray-300 hover:text-red-500 transition-colors py-1 inline-block">
                          {link.name}
                        </Link>
                        {link.subItems && (
                          <div className="hidden group-hover/sub:flex group-focus-within/sub:flex flex-col mt-2 pl-4 border-l-2 border-red-800 space-y-3">
                            {link.subItems.map((sub) => (
                              <Link key={sub.name} href={sub.href} onClick={() => setActiveMenu(null)} className="font-sans text-sm text-gray-500 hover:text-red-400 transition-colors font-medium">
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {MENU_DATA[activeMenu].viewAll && (
                <div className="mt-10 pt-6 border-t border-red-950">
                  <Link href={MENU_DATA[activeMenu].viewAll} onClick={() => setActiveMenu(null)} className="font-sans font-bold inline-flex items-center gap-2 text-base uppercase tracking-wider text-red-500 hover:text-white transition-colors">
                    Xem tất cả {activeMenu} <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}