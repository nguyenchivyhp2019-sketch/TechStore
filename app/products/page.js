import Link from "next/link";
import { getProducts, getCategories, formatPrice } from "@/lib/products";
import { filterProducts, getBrands } from "@/lib/filter";
import ProductImage from "../ProductImage";
import BrandFilter from "../BrandFilter";
import { ChevronRight, Crosshair } from "lucide-react";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const category = params?.category;
  
  const products = await getProducts();
  const rawCategories = await getCategories();
  
  const categories = rawCategories.filter((c) => c.slug !== "pc-theo-nganh");
  
  const list = filterProducts(products, params);
  const brands = getBrands(products, category);

  const ProductCard = ({ p, index }) => (
    <Link 
      href={`/products/${p.id}`} 
      className="group relative bg-[#111] rounded-sm overflow-hidden flex flex-col transition-all duration-300 border border-[#333] hover:border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] h-full"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
    >
      {index < 3 && (
        <span className={`font-doom absolute top-0 left-0 text-white tracking-wider px-3 py-1 z-20 ${index === 0 ? 'bg-red-700' : 'bg-orange-600'}`}>
          {index === 0 ? 'HOT' : 'MỚI'}
        </span>
      )}

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 -left-[100%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-red-600/60 to-transparent -rotate-45 transform group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
        <div className="absolute top-0 -left-[100%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent -rotate-45 transform group-hover:translate-x-[100%] transition-transform duration-500 delay-100 ease-out" />
      </div>
      
      <div className="p-4 pb-0 relative overflow-hidden z-20">
         <div className="bg-white rounded-sm p-2 border border-gray-800 group-hover:border-red-600 transition-colors">
           <ProductImage id={p.id} category={p.category} name={p.name} imageSrc={p.image} imageUrl={p.image_url} className="h-48 md:h-56 w-full" />
         </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow z-20 relative">
        <p className="font-sans text-xs text-red-500 font-bold uppercase tracking-widest mb-1">{p.brand ?? "DOOM"}</p>
        
        {/* Tên sản phẩm: Dùng font-sans, viết thường, in đậm */}
        <h3 className="font-sans text-lg font-bold text-gray-200 mb-2 line-clamp-2 leading-tight group-hover:text-red-400 transition-colors duration-300">
          {p.name}
        </h3>
        
        <div className="mt-auto pt-3 border-t border-gray-800">
          {/* Giá tiền: Dùng font-doom */}
          <p className="font-doom text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 text-2xl tracking-wider">{formatPrice(p.price)}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mt-2 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Sẵn sàng chiến đấu
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-[#050505]">
      
      {/* 1. THANH DANH MỤC (Dùng font-doom) */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center mt-4">
        <Link 
          href="/products" 
          className={`font-doom px-6 py-2.5 rounded-sm text-lg tracking-wider border-2 transition-all ${
            !category ? "bg-red-700 text-white border-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-[#111] text-gray-400 border-[#333] hover:border-red-600 hover:text-red-500"
          }`}
        >
          Tất cả
        </Link>
        {categories.map((c) => (
          <Link 
            key={c.slug} 
            href={`/products?category=${c.slug}`} 
            className={`font-doom px-6 py-2.5 rounded-sm text-lg tracking-wider border-2 transition-all ${
              category === c.slug ? "bg-red-700 text-white border-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-[#111] text-gray-400 border-[#333] hover:border-red-600 hover:text-red-500"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* 2. THANH THƯƠNG HIỆU */}
      <BrandFilter brands={brands} category={category} currentBrand={params.brand} />

      {/* 3. THANH BỘ LỌC (Dùng font-sans cho input, font-doom cho nút) */}
      <div className="bg-[#111] border border-[#333] rounded-sm p-4 mb-10 shadow-sm max-w-5xl mx-auto font-sans">
        <form className="flex flex-col md:flex-row items-center gap-4 text-sm">
          {category && <input type="hidden" name="category" value={category} />}
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {params.brand && <input type="hidden" name="brand" value={params.brand} />}

          <div className="flex-1 w-full md:w-auto">
            <select name="brand" defaultValue={params.brand ?? ""} className="bg-[#050505] border border-[#333] text-gray-300 font-bold rounded-sm px-4 py-2.5 w-full focus:outline-none focus:border-red-600 transition-colors">
              <option value="">Tất cả thương hiệu</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input name="min" type="number" defaultValue={params.min} placeholder="Giá từ..." className="bg-[#050505] border border-[#333] text-gray-300 rounded-sm px-4 py-2.5 w-full md:w-32 focus:outline-none focus:border-red-600 transition-colors" />
            <span className="text-gray-600">-</span>
            <input name="max" type="number" defaultValue={params.max} placeholder="Đến..." className="bg-[#050505] border border-[#333] text-gray-300 rounded-sm px-4 py-2.5 w-full md:w-32 focus:outline-none focus:border-red-600 transition-colors" />
          </div>

          <div className="flex-1 w-full md:w-auto">
            <select name="sort" defaultValue={params.sort ?? ""} className="bg-[#050505] border border-[#333] text-gray-300 font-bold rounded-sm px-4 py-2.5 w-full focus:outline-none focus:border-red-600 transition-colors">
              <option value="">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button type="submit" className="font-doom bg-red-800 hover:bg-red-700 text-white text-lg tracking-wider px-8 py-2 rounded-sm transition-colors flex-1 md:flex-none">
              Lọc
            </button>
            <Link href="/products" className="font-doom bg-[#222] hover:bg-[#333] text-gray-300 text-lg tracking-wider px-4 py-2 rounded-sm text-center transition-colors flex-1 md:flex-none border border-[#444]">
              Xóa
            </Link>
          </div>
        </form>
      </div>

      {/* 4. HIỂN THỊ SẢN PHẨM */}
      <div id="products">
        {category ? (
          <>
            <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
              <h2 className="font-doom text-3xl text-white flex items-center gap-3 uppercase tracking-wider">
                <Crosshair className="text-red-600" /> {categories.find(c => c.slug === category)?.name}
                <span className="font-sans text-sm font-normal text-red-500 bg-[#111] px-3 py-1 rounded-sm border border-red-900/50">
                  {list.length} vũ khí
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {list.map((p, index) => <ProductCard key={p.id} p={p} index={index} />)}
            </div>
          </>
        ) : (
          <div className="space-y-20">
            {categories.map((c) => {
              const categoryProducts = list.filter((p) => p.category === c.slug);
              if (categoryProducts.length === 0) return null; 
              const displayProducts = categoryProducts.slice(0, 5);

              return (
                <section key={c.slug}>
                  <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-3">
                    <h2 className="font-doom text-2xl text-white flex items-center gap-3 uppercase tracking-wider">
                      {c.name}
                    </h2>
                    <Link href={`/products?category=${c.slug}`} className="font-doom text-red-500 tracking-wider hover:text-red-400 flex items-center gap-1 group text-lg">
                      Xem tất cả <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {displayProducts.map((p, index) => <ProductCard key={p.id} p={p} index={index} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {list.length === 0 && (
          <div className="text-center py-20 bg-[#111] rounded-sm border border-gray-800 mt-10">
            <p className="font-doom text-red-500 text-2xl tracking-wider mb-4">Không tìm thấy vũ khí nào phù hợp!</p>
            <Link href="/products" className="font-doom inline-block bg-red-800 hover:bg-red-700 text-white tracking-wider px-6 py-2 rounded-sm transition-colors text-lg">
              Xóa bộ lọc
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}