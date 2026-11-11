import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, getProducts, getCategories, formatPrice } from "@/lib/products";
import AddToCart from "../../AddToCart";
import ProductImage from "../../ProductImage";
import FadeIn from "../../FadeIn";
import ProductCard from "../../ProductCard";
import { CheckCircle2, XCircle, Truck, ShieldCheck, RefreshCw, ChevronRight } from "lucide-react";
import { CUT_CARD } from "@/lib/ui";

const PERKS = [
  { icon: Truck, title: "Miễn phí giao hàng", desc: "Toàn quốc, nhận hàng trong 2–3 ngày" },
  { icon: ShieldCheck, title: "Bảo hành chính hãng", desc: "Theo chính sách của nhà sản xuất" },
  { icon: RefreshCw, title: "Đổi trả 7 ngày", desc: "Nếu sản phẩm lỗi do nhà sản xuất" },
];

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();
  return {
    title: p.name,
    description: p.description?.slice(0, 160) || `Mua ${p.name} chính hãng tại DOOM Tech Store.`,
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const [p, categories, all] = await Promise.all([getProduct(id), getCategories(), getProducts()]);
  if (!p) notFound();

  // Sản phẩm tương tự: cùng danh mục, ưu tiên cùng hãng
  const related = all
    .filter((x) => x.id !== p.id && x.category === p.category && x.price)
    .sort((a, b) => (b.brand === p.brand) - (a.brand === p.brand))
    .slice(0, 5);

  const category = categories.find((c) => c.slug === p.category);
  const hasVariants = p.variants?.length > 0;
  const inStock = p.stock == null || p.stock > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mb-8 font-bold uppercase tracking-widest">
        <Link href="/" className="hover:text-red-500 transition-colors">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-red-500 transition-colors">Sản phẩm</Link>
        {category && (
          <>
            <ChevronRight size={12} />
            <Link href={`/products?category=${category.slug}`} className="hover:text-red-500 transition-colors">{category.name}</Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-red-500 normal-case tracking-normal line-clamp-1">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start mb-16">
        <FadeIn>
          <div
            className="md:sticky md:top-28 bg-[#111] border border-gray-800 p-5 shadow-[0_0_30px_rgba(220,38,38,0.1)] hover:border-red-700 transition-colors duration-500"
            style={{ clipPath: CUT_CARD }}
          >
            <ProductImage
              id={p.id}
              category={p.category}
              name={p.name}
              imageSrc={p.image}
              imageUrl={p.image_url}
              className="w-full aspect-square"
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex flex-col">
            {p.brand && <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-2">{p.brand}</p>}

            <h1 className="text-3xl md:text-4xl font-black mb-4 text-white leading-tight">{p.name}</h1>

            <div className="flex items-center gap-3 mb-6 text-sm">
              <span className={`inline-flex items-center gap-1.5 font-bold ${inStock ? "text-green-500" : "text-gray-500"}`}>
                <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-gray-500"}`} />
                {inStock ? "Còn hàng" : "Tạm hết hàng"}
              </span>
              {p.price_note && <span className="text-gray-500">· {p.price_note}</span>}
            </div>

            {!hasVariants && (
              <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-6">
                {formatPrice(p.price)}
              </p>
            )}

            <div className="mb-8 bg-[#111] p-6 border border-gray-800 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-700" />
              <AddToCart
                product={{
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  variants: p.variants,
                  colors: p.colors,
                  stock: p.stock,
                  image: p.image_url || p.image || null,
                }}
              />
            </div>

            <ul className="grid gap-4 border-t border-gray-800 pt-6">
              {PERKS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3 text-sm">
                  <Icon size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-200">{title}</p>
                    <p className="text-gray-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </div>

      <div className="border-t border-gray-800 pt-12 space-y-14 mb-16">
        {p.description && (
          <FadeIn>
            <section className="max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-black mb-5 text-white uppercase italic tracking-wide border-l-4 border-red-600 pl-4">
                Tổng quan
              </h2>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed whitespace-pre-line">{p.description}</p>
            </section>
          </FadeIn>
        )}

        {p.specs?.length > 0 && (
          <FadeIn>
            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-6 text-white uppercase italic tracking-wide border-l-4 border-red-600 pl-4">
                Thông số <span className="text-red-600">kỹ thuật</span>
              </h2>
              <dl className="max-w-4xl border border-gray-800 divide-y divide-gray-800">
                {p.specs.map((spec, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[220px_1fr] odd:bg-[#0d0d0d]">
                    <dt className="px-4 pt-3 sm:py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{spec.label}</dt>
                    <dd className="px-4 pb-3 sm:py-3 text-sm text-gray-200">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </FadeIn>
        )}

        {(p.pros || p.cons) && (
          <FadeIn>
            <section className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
              {p.pros && (
                <div className="bg-[#111] p-6 border border-gray-800 border-l-4 border-l-green-600">
                  <h3 className="text-base font-bold text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <CheckCircle2 size={20} className="text-green-500" /> Ưu điểm
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{p.pros}</p>
                </div>
              )}
              {p.cons && (
                <div className="bg-[#111] p-6 border border-gray-800 border-l-4 border-l-red-600">
                  <h3 className="text-base font-bold text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <XCircle size={20} className="text-red-500" /> Nhược điểm
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{p.cons}</p>
                </div>
              )}
            </section>
          </FadeIn>
        )}
      </div>

      {related.length > 0 && (
        <FadeIn>
          <section className="border-t border-gray-800 pt-12 mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-6 text-white uppercase italic tracking-wide border-l-4 border-red-600 pl-4">
              Sản phẩm <span className="text-red-600">tương tự</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
              {related.map((r) => <ProductCard key={r.id} p={r} />)}
            </div>
          </section>
        </FadeIn>
      )}
    </div>
  );
}
