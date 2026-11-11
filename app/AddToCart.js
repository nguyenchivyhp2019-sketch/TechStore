"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ShoppingCart, Zap, Minus, Plus } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import { CUT_BUTTON } from "@/lib/ui";

const COLOR_CODES = [
  [["đen", "black", "titan"], "#111"],
  [["trắng", "white", "bạc", "silver"], "#f3f4f6"],
  [["xanh", "blue", "green"], "#3b82f6"],
  [["hồng", "pink"], "#ec4899"],
  [["tím", "purple"], "#a855f7"],
  [["vàng", "gold"], "#eab308"],
  [["cam", "orange"], "#f97316"],
  [["xám", "grey", "gray"], "#9ca3af"],
  [["đỏ", "red"], "#ef4444"],
];

const colorCode = (name) => {
  const n = name.toLowerCase();
  return COLOR_CODES.find(([keys]) => keys.some((k) => n.includes(k)))?.[1] ?? "#d1d5db";
};

export default function AddToCart({ product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [idx, setIdx] = useState(0);
  const [color, setColor] = useState(product.colors?.[0] || null);
  const [qty, setQty] = useState(1);

  const variants = product.variants?.length ? product.variants : null;
  const variant = variants ? variants[idx] : null;
  const price = variant ? variant.price : product.price;
  const outOfStock = product.stock != null && product.stock <= 0;

  if (!price) {
    return (
      <p className="text-gray-300">
        Sản phẩm đang cập nhật giá. Vui lòng liên hệ hotline để được báo giá.
      </p>
    );
  }

  const add = () => {
    addItem(product, variant, color, qty);
    toast.success(`Đã thêm ${qty} × ${product.name} vào giỏ`);
  };

  const buyNow = () => {
    addItem(product, variant, color, qty);
    router.push("/cart");
  };

  return (
    <div className="space-y-6">
      {variants && (
        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
          {formatPrice(price)}
        </p>
      )}

      {product.colors?.length > 0 && (
        <div>
          <p className="font-bold text-gray-300 mb-3 uppercase tracking-widest text-sm">
            Màu sắc: <span className="text-red-500">{color}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={`Màu ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all border-2 ${
                  color === c ? "border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)]" : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <span className="w-6 h-6 rounded-sm border border-gray-900" style={{ backgroundColor: colorCode(c) }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {variants && (
        <div>
          <p className="font-bold text-gray-300 mb-3 uppercase tracking-widest text-sm">Phiên bản</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {variants.map((v, i) => (
              <button
                key={v.label}
                type="button"
                aria-pressed={idx === i}
                onClick={() => setIdx(i)}
                className={`text-left px-4 py-3 border transition-colors ${
                  idx === i ? "border-red-600 bg-red-950/30 text-white" : "border-[#333] bg-black/40 text-gray-400 hover:border-gray-500"
                }`}
              >
                <span className="block text-sm font-bold">{v.label}</span>
                <span className="block text-xs text-red-400 mt-0.5">{formatPrice(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="font-bold text-gray-300 uppercase tracking-widest text-sm">Số lượng</span>
        <div className="flex items-center border border-[#333]">
          <button type="button" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-950/30">
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-bold text-white">{qty}</span>
          <button type="button" aria-label="Tăng" onClick={() => setQty((q) => Math.min(100, q + 1))} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-950/30">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {outOfStock ? (
        <p className="py-4 text-center border border-[#333] text-gray-400 font-bold uppercase tracking-widest">Tạm hết hàng</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={buyNow}
            className="flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] active:scale-[0.98]"
            style={{ clipPath: CUT_BUTTON }}
          >
            <Zap size={18} /> Mua ngay
          </button>
          <button
            type="button"
            onClick={add}
            className="flex items-center justify-center gap-2 border border-red-700 bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-white font-black uppercase tracking-widest py-4 transition-colors active:scale-[0.98]"
            style={{ clipPath: CUT_BUTTON }}
          >
            <ShoppingCart size={18} /> Thêm vào giỏ
          </button>
        </div>
      )}
    </div>
  );
}
