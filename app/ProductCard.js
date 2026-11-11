import Link from "next/link";
import ProductImage from "./ProductImage";
import { formatPrice } from "@/lib/format";
import { CUT_CARD } from "@/lib/ui";

export default function ProductCard({ p }) {
  const inStock = p.stock == null || p.stock > 0;

  return (
    <Link
      href={`/products/${p.id}`}
      className="group relative bg-[#111] overflow-hidden flex flex-col h-full border border-[#2a2a2a] hover:border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all duration-300"
      style={{ clipPath: CUT_CARD }}
    >
      {p.badge && (
        <span className="absolute top-0 left-0 z-20 bg-red-700 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1">
          {p.badge}
        </span>
      )}

      <div className="p-3 pb-0">
        <ProductImage
          id={p.id}
          category={p.category}
          name={p.name}
          imageSrc={p.image}
          imageUrl={p.image_url}
          className="h-40 md:h-52 w-full"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[11px] text-red-500 font-bold uppercase tracking-widest mb-1">{p.brand ?? " "}</p>
        <h3 className="text-sm md:text-base font-bold text-gray-200 mb-3 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
          {p.name}
        </h3>
        <div className="mt-auto pt-3 border-t border-gray-800">
          <p className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            {p.variants?.length > 1 && <span className="text-xs text-gray-500 font-bold mr-1">Từ</span>}
            {formatPrice(p.price)}
          </p>
          <p className={`flex items-center gap-1.5 text-[11px] font-medium mt-1.5 ${inStock ? "text-gray-500" : "text-gray-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-green-500" : "bg-gray-600"}`} />
            {inStock ? "Còn hàng" : "Tạm hết hàng"}
          </p>
        </div>
      </div>
    </Link>
  );
}
