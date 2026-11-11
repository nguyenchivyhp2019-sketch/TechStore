import Image from "next/image";
import Link from "next/link";
import { getProducts, formatPrice } from "@/lib/products";
import ProductImage from "./ProductImage";
import ProductCard from "./ProductCard";
import FadeIn from "./FadeIn";
import {
  Flame, Crosshair, Laptop, Smartphone, Cpu, Headphones, Truck, ShieldCheck, RefreshCw, Headset, ArrowRight,
} from "lucide-react";

const CUT_BUTTON = "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)";
const CUT_CARD = "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)";

const CATEGORIES = [
  { slug: "laptop", label: "Laptop", desc: "Chiến binh hiệu năng", icon: Laptop },
  { slug: "dien-thoai", label: "Điện thoại", desc: "Vũ khí bỏ túi", icon: Smartphone },
  { slug: "linh-kien-pc", label: "Linh kiện PC", desc: "Độ lại sức mạnh", icon: Cpu },
  { slug: "tai-nghe", label: "Tai nghe", desc: "Phụ kiện chiến trường", icon: Headphones },
];

const PERKS = [
  { icon: Truck, title: "Giao hàng nhanh", desc: "Đóng gói kỹ, giao tận nơi" },
  { icon: ShieldCheck, title: "Bảo hành chính hãng", desc: "Yên tâm sử dụng lâu dài" },
  { icon: RefreshCw, title: "Đổi trả dễ dàng", desc: "Hỗ trợ khi sản phẩm lỗi" },
  { icon: Headset, title: "Hỗ trợ tận tâm", desc: "Tư vấn chọn đúng vũ khí" },
];

function SectionTitle({ white, red }) {
  return (
    <h2 className="font-sans text-3xl md:text-5xl font-black tracking-widest mb-12 text-center text-white uppercase drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]">
      {white} <span className="text-red-600">{red}</span>
    </h2>
  );
}

function Divider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />;
}

async function loadProducts() {
  try {
    const products = await getProducts();
    return Array.isArray(products) ? products : [];
  } catch (err) {
    console.error("Không tải được sản phẩm:", err);
    return [];
  }
}

export default async function HomePage() {
  const products = await loadProducts();
  const priced = products.filter((p) => p.price);
  const flagged = priced.filter((p) => p.badge);
  // Chưa gắn nhãn nổi bật: lấy sản phẩm đắt nhất (flagship) của 4 danh mục chính
  const flagship = ["dien-thoai", "laptop", "tai-nghe", "linh-kien-pc"]
    .map((slug) => priced.filter((p) => p.category === slug).sort((a, b) => b.price - a.price)[0])
    .filter(Boolean);
  const featuredProducts = (flagged.length >= 4 ? flagged : flagship.length === 4 ? flagship : priced).slice(0, 4);

  // Mỗi danh mục lấy 2 sản phẩm để trang chủ đa dạng
  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const perCategory = {};
  const newArrivals = priced.filter((p) => {
    if (featuredIds.has(p.id) || (perCategory[p.category] ?? 0) >= 2) return false;
    perCategory[p.category] = (perCategory[p.category] ?? 0) + 1;
    return true;
  }).slice(0, 10);

  return (
    <div className="text-gray-200">
      {/* 1. HERO */}
      <section className="relative text-center pt-16 pb-20 px-4 max-w-5xl mx-auto overflow-hidden">
        <div aria-hidden="true" className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-700/20 blur-[120px] rounded-full pointer-events-none -z-10 motion-safe:animate-pulse" />

        <FadeIn>
          <div className="relative mb-10 flex justify-center group">
            <Image src="/images/doom.gif" alt="DOOM Slayer" width={1280} height={720} priority unoptimized className="w-full h-auto max-w-[850px] object-contain relative z-10 transition-transform duration-700 group-hover:scale-105 mix-blend-screen drop-shadow-[0_0_40px_rgba(220,38,38,0.7)]" />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="font-sans text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-none text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 uppercase drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            Chào mừng đến địa ngục
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-sans text-lg md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto tracking-widest uppercase border-l-4 border-red-700 pl-6 text-left">
            Trang bị vũ khí công nghệ tối tân nhất.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
            <span className="group inline-block drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] hover:drop-shadow-[0_0_22px_rgba(220,38,38,0.95)] transition-[filter] duration-300">
              <Link href="/products" className="font-sans font-bold text-lg inline-flex items-center justify-center px-10 py-4 bg-[#1a0505] group-hover:bg-red-800 border border-red-600 text-red-500 group-hover:text-white uppercase tracking-widest transition-colors duration-300" style={{ clipPath: CUT_BUTTON }}>
                <Flame size={24} className="mr-3 group-hover:animate-bounce" /> Mua sắm ngay
              </Link>
            </span>
            <Link href="/products?category=laptop" className="font-sans font-bold text-lg group inline-flex items-center justify-center px-8 py-4 text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors duration-300">
              <Crosshair size={24} className="mr-3" /> Khám phá kho vũ khí
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* 2. DẢI LỢI ÍCH */}
      <section className="border-y border-red-950 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {PERKS.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.08}>
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 flex items-center justify-center border border-red-800 bg-red-950/30 text-red-500">
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm md:text-base font-black uppercase tracking-wider text-gray-100">{title}</p>
                  <p className="text-xs md:text-sm text-gray-500 leading-snug mt-1">{desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 3. CHỌN VŨ KHÍ THEO DANH MỤC */}
      <section className="max-w-6xl mx-auto px-4 pt-20">
        <FadeIn>
          <SectionTitle white="Chọn" red="Vũ Khí" />
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.map(({ slug, label, desc, icon: Icon }, i) => (
            <FadeIn key={slug} delay={i * 0.08}>
              <Link href={`/products?category=${slug}`} className="group relative flex flex-col items-center text-center h-full p-6 md:p-8 bg-[#0d0d0d] border border-[#2a2a2a] hover:border-red-600 hover:bg-[#1a0505] transition-all duration-300">
                <Icon size={42} className="text-red-600 mb-4 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="font-sans text-xl md:text-2xl font-bold tracking-wider text-gray-100 group-hover:text-red-500 transition-colors">{label}</h3>
                <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">{desc}</p>
                <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-red-600 group-hover:w-full transition-all duration-500" />
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 4. SẢN PHẨM NỔI BẬT */}
      <section className="max-w-6xl mx-auto px-4 py-20 relative">
        <Divider />
        <div className="mt-16">
          <FadeIn><SectionTitle white="Vũ Khí" red="Nổi Bật" /></FadeIn>
        </div>

        {featuredProducts.length === 0 ? (
          <FadeIn>
            <div className="border border-dashed border-red-900 bg-red-950/10 py-16 text-center">
              <p className="font-sans text-xl font-bold tracking-widest text-red-500 uppercase">Đang cập nhật sản phẩm</p>
              <p className="mt-2 text-base text-gray-500">Chưa tải được sản phẩm. Vui lòng quay lại sau ít phút.</p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredProducts.map((p, index) => (
              <FadeIn key={p.id} delay={index * 0.1}>
                <div className="h-full transition-[filter] duration-300 hover:drop-shadow-[0_0_18px_rgba(220,38,38,0.35)]">
                  <Link href={`/products/${p.id}`} className="group relative bg-[#111] overflow-hidden flex flex-col items-center text-center transition-colors duration-300 hover:bg-[#1a0505] p-10 border border-[#333] hover:border-red-600 h-full" style={{ clipPath: CUT_CARD }}>
                    <div className="absolute top-4 left-4 bg-red-900/40 border border-red-700 text-red-500 text-sm font-bold px-3 py-1 uppercase tracking-wider">
                      {p.brand || "Hàng Mới"}
                    </div>

                    <h3 className="font-sans text-2xl md:text-3xl font-bold mt-8 mb-3 text-gray-100 group-hover:text-red-500 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-sm line-clamp-2 text-base">{p.description}</p>

                    <div className="w-full h-64 mt-auto relative group-hover:-translate-y-2 transition-transform duration-500 bg-white rounded-md p-4 border border-gray-800 group-hover:border-red-600">
                      <ProductImage id={p.id} category={p.category} name={p.name} imageSrc={p.image} imageUrl={p.image_url} className="w-full h-full object-contain" />
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800 w-full flex justify-between items-center">
                      <span className="font-sans text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-wider">
                        {p.variants?.length > 1 ? "Từ " : ""}{formatPrice(p.price)}
                      </span>
                      <ArrowRight size={28} className="text-red-600 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        <FadeIn delay={0.2}>
          <div className="mt-12 text-center">
            <Link href="/products" className="font-sans font-bold text-lg inline-flex items-center gap-3 tracking-widest text-gray-400 hover:text-red-500 transition-colors">
              Xem tất cả vũ khí <ArrowRight size={20} />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* 5. SẢN PHẨM THEO DANH MỤC */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <FadeIn><SectionTitle white="Gợi ý" red="Cho Bạn" /></FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
            {newArrivals.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* 6. KÊU GỌI HÀNH ĐỘNG CUỐI TRANG */}
      <section className="px-4 pb-24">
        <FadeIn>
          <div className="relative max-w-4xl mx-auto text-center p-10 md:p-14 border border-red-700/60 bg-gradient-to-b from-[#1a0505] to-[#0a0a0a] shadow-[0_0_60px_rgba(220,38,38,0.2)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
            <h2 className="font-sans text-3xl md:text-5xl font-black tracking-wider text-red-600 [text-shadow:0_0_20px_rgba(220,38,38,0.6)]">Sẵn sàng chiến đấu?</h2>
            <p className="mt-4 text-gray-400 uppercase tracking-widest text-base md:text-lg">Chọn vũ khí của bạn và tiêu diệt mọi deadline.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <span className="group inline-block drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] hover:drop-shadow-[0_0_22px_rgba(220,38,38,0.95)] transition-[filter] duration-300">
                <Link href="/products" className="font-sans font-bold text-lg inline-flex items-center justify-center px-10 py-4 bg-[#1a0505] group-hover:bg-red-800 border border-red-600 text-red-500 group-hover:text-white tracking-widest transition-colors duration-300" style={{ clipPath: CUT_BUTTON }}>
                  <Flame size={24} className="mr-3" /> Vào kho vũ khí
                </Link>
              </span>
              <Link href="/login" className="font-sans font-bold text-lg px-8 py-4 text-gray-400 hover:text-red-500 tracking-widest transition-colors">Đăng nhập / Gia nhập</Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}