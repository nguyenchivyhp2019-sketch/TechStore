import { notFound } from "next/navigation";
import { getProduct, formatPrice } from "@/lib/products";
import Link from "next/link";
import AddToCart from "../../AddToCart";
import ProductImage from "../../ProductImage";
import FadeIn from "../../FadeIn";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const p = await getProduct(id);
  
  if (!p) notFound();

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 min-h-screen bg-[#050505]">
      
      {/* Breadcrumb (Đường dẫn) */}
      <FadeIn>
        <nav className="text-xs text-gray-500 mb-8 space-x-2 font-bold uppercase tracking-widest">
          <Link href="/" className="hover:text-red-500 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-red-500 transition-colors">Kho vũ khí</Link>
          <span>/</span>
          <span className="text-red-500">{p.name}</span>
        </nav>
      </FadeIn>
      
      {/* KHỐI TRÊN: ẢNH & THÔNG TIN MUA HÀNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start mb-20">
        
        {/* Cột trái: Ảnh sản phẩm (Phong cách HUD quân sự) */}
        <FadeIn delay={0.1}>
          <div 
            className="sticky top-24 bg-[#111] border border-gray-800 rounded-sm p-6 flex items-center justify-center min-h-[400px] md:min-h-[500px] shadow-[0_0_30px_rgba(220,38,38,0.1)] group hover:border-red-600 transition-colors duration-500"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
          >
            <div className="w-full h-full bg-white p-4 rounded-sm border border-gray-700 group-hover:border-red-500 transition-colors">
              <ProductImage 
                id={p.id} 
                category={p.category} 
                name={p.name} 
                imageSrc={p.image} 
                imageUrl={p.image_url} // LẤY ẢNH TỪ SUPABASE STORAGE
                className="w-full h-full max-h-[450px] object-contain drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
              />
            </div>
          </div>
        </FadeIn>

        {/* Cột phải: Thông tin mua hàng */}
        <FadeIn delay={0.2}>
          <div className="flex flex-col pt-4">
            {p.brand && <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-2 italic">{"// "}{p.brand}{" //"}</p>}
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-white uppercase italic tracking-tighter leading-tight drop-shadow-md">
              {p.name}
            </h1>
            
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-8 drop-shadow-[0_0_10px_rgba(234,88,12,0.3)]">
              {formatPrice(p.price)}
            </p>
            
            {/* Component Thêm vào giỏ */}
            <div className="mb-10 bg-[#111] p-6 border border-gray-800 rounded-sm relative">
               <div className="absolute top-0 left-0 w-2 h-full bg-red-700"></div>
               <AddToCart product={{ id: p.id, name: p.name, price: p.price, variants: p.variants, colors: p.colors }} />
            </div>

            {/* Ưu đãi */}
            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                <div>
                  <p className="font-bold text-gray-200 mb-1 uppercase tracking-wider">Giao hàng hỏa tốc</p>
                  <p>Miễn phí vận chuyển toàn quốc. Nhận hàng trong 2-3 ngày.</p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* KHỐI DƯỚI: THÔNG TIN CHI TIẾT */}
      <div className="border-t border-gray-800 pt-16 space-y-16 mb-24">
        
        {/* Mô tả */}
        {p.description && (
          <FadeIn>
            <section className="max-w-3xl">
              <h2 className="text-3xl font-black mb-6 text-white uppercase italic tracking-widest border-l-4 border-red-600 pl-4">
                Tổng quan
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed font-light">
                {p.description}
              </p>
            </section>
          </FadeIn>
        )}

        {/* Thông số kỹ thuật */}
        {p.specs && p.specs.length > 0 && (
          <FadeIn>
            <section>
              <h2 className="text-3xl font-black mb-8 text-white uppercase italic tracking-widest border-l-4 border-red-600 pl-4">
                Thông số <span className="text-red-600">kỹ thuật</span>
              </h2>
              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {p.specs.map((spec, index) => (
                  <div key={index} className="flex flex-col border-b border-gray-800 pb-3 hover:border-red-900 transition-colors group">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-red-500 transition-colors">{spec.label}</span>
                    <span className="text-base text-gray-200 font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {/* Ưu nhược điểm */}
        {(p.pros || p.cons) && (
          <FadeIn>
            <section className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
              {p.pros && (
                <div className="bg-[#111] p-8 border border-gray-800 border-l-4 border-l-green-600 rounded-sm">
                  <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <CheckCircle2 size={20} className="text-green-500" /> Ưu điểm
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{p.pros}</p>
                </div>
              )}
              {p.cons && (
                <div className="bg-[#111] p-8 border border-gray-800 border-l-4 border-l-red-600 rounded-sm">
                  <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <XCircle size={20} className="text-red-500" /> Nhược điểm
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{p.cons}</p>
                </div>
              )}
            </section>
          </FadeIn>
        )}
      </div>
    </main>
  );
}