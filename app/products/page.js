import Link from "next/link";
import { getProducts, getCategories } from "@/lib/products";
import { filterProducts, getBrands } from "@/lib/filter";
import ProductCard from "../ProductCard";
import BrandFilter from "../BrandFilter";
import { ChevronRight, Crosshair, SlidersHorizontal } from "lucide-react";

const chip = (active) =>
  `px-4 py-2 text-sm font-bold uppercase tracking-wider border transition-all ${
    active
      ? "bg-red-700 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.45)]"
      : "bg-[#111] text-gray-400 border-[#333] hover:border-red-600 hover:text-red-500"
  }`;

const field =
  "bg-[#050505] border border-[#333] text-gray-300 px-3 py-2.5 w-full focus:outline-none focus:border-red-600 transition-colors";

export async function generateMetadata({ searchParams }) {
  const { category, q } = await searchParams;
  if (q) return { title: `Tìm kiếm: ${q}` };
  if (category) {
    const c = (await getCategories()).find((x) => x.slug === category);
    if (c) return { title: c.name };
  }
  return { title: "Tất cả sản phẩm" };
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const { category, q } = params;

  const [products, rawCategories] = await Promise.all([getProducts(), getCategories()]);
  const categories = rawCategories.filter((c) => c.slug !== "pc-theo-nganh");
  const current = categories.find((c) => c.slug === category);

  const list = filterProducts(products, params);
  const brands = getBrands(products, category);
  const isFiltered = Boolean(q || params.brand || params.min || params.max || params.sort);

  const heading = q ? `Kết quả cho “${q}”` : current?.name ?? "Tất cả sản phẩm";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <Link href="/products" className={chip(!category)}>Tất cả</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/products?category=${c.slug}`} className={chip(category === c.slug)}>
            {c.name}
          </Link>
        ))}
      </div>

      <BrandFilter brands={brands} category={category} currentBrand={params.brand} />

      <form className="bg-[#0d0d0d] border border-[#2a2a2a] p-4 mb-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-[auto_1fr_1fr_1.2fr_auto] items-center gap-3 text-sm">
        {category && <input type="hidden" name="category" value={category} />}
        {q && <input type="hidden" name="q" value={q} />}
        {params.brand && <input type="hidden" name="brand" value={params.brand} />}

        <span className="hidden md:flex items-center gap-2 font-bold uppercase tracking-wider text-gray-400">
          <SlidersHorizontal size={16} className="text-red-600" /> Lọc
        </span>
        <input name="min" type="number" min="0" step="100000" defaultValue={params.min} placeholder="Giá từ (đ)" aria-label="Giá từ" className={field} />
        <input name="max" type="number" min="0" step="100000" defaultValue={params.max} placeholder="Giá đến (đ)" aria-label="Giá đến" className={field} />
        <select name="sort" defaultValue={params.sort ?? ""} aria-label="Sắp xếp" className={`${field} col-span-2 md:col-span-1`}>
          <option value="">Sắp xếp: Mặc định</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="name">Tên A–Z</option>
        </select>
        <div className="flex gap-2 col-span-2 md:col-span-1">
          <button type="submit" className="flex-1 bg-red-800 hover:bg-red-700 border border-red-600 text-white font-bold uppercase tracking-wider px-6 py-2.5 transition-colors">
            Áp dụng
          </button>
          {isFiltered && (
            <Link
              href={category ? `/products?category=${category}` : "/products"}
              className="flex-1 text-center bg-[#1a1a1a] hover:bg-[#262626] border border-[#3a3a3a] text-gray-300 font-bold uppercase tracking-wider px-4 py-2.5 transition-colors"
            >
              Xóa
            </Link>
          )}
        </div>
      </form>

      {category || q ? (
        <section>
          <div className="flex flex-wrap items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-wide">
              <Crosshair className="text-red-600 shrink-0" /> {heading}
            </h1>
            <span className="text-sm text-red-400 bg-[#111] px-3 py-1 border border-red-900/50">{list.length} sản phẩm</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      ) : (
        <div className="space-y-16">
          <h1 className="sr-only">Tất cả sản phẩm</h1>
          {categories.map((c) => {
            const items = list.filter((p) => p.category === c.slug);
            if (items.length === 0) return null;
            return (
              <section key={c.slug}>
                <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-wide">
                    {c.name} <span className="text-sm text-gray-500 font-bold not-italic ml-1">({items.length})</span>
                  </h2>
                  <Link href={`/products?category=${c.slug}`} className="text-red-500 font-bold uppercase tracking-wider text-sm hover:text-red-400 flex items-center gap-1 group">
                    Xem tất cả <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                  {items.slice(0, 5).map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {list.length === 0 && (
        <div className="text-center py-20 bg-[#0d0d0d] border border-gray-800 mt-6">
          <p className="text-red-500 text-xl font-black uppercase tracking-wider mb-2">Không tìm thấy sản phẩm phù hợp</p>
          <p className="text-gray-500 mb-6">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
          <Link href="/products" className="inline-block bg-red-800 hover:bg-red-700 border border-red-600 text-white font-bold uppercase tracking-wider px-6 py-2.5 transition-colors">
            Xem tất cả sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
}
