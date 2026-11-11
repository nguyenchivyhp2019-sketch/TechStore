"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "../CartContext";
import ProductImage from "../ProductImage";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { CUT_CARD, CUT_BUTTON, pageTitle, btnPrimary, btnGhost } from "@/lib/ui";

export default function CartPage() {
  const { items, changeQty, removeItem, clear, total, count } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <ShoppingBag size={72} strokeWidth={1.2} className="text-red-600 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]" />
        <h1 className={`${pageTitle} mb-2`}>Giỏ hàng trống</h1>
        <p className="text-gray-500 mb-8">Bạn chưa chọn sản phẩm nào.</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link href="/products" className={`${btnPrimary} flex-1`} style={{ clipPath: CUT_BUTTON }}>
            Mua sắm ngay
          </Link>
          <Link href="/track" className={`${btnGhost} flex-1`}>Tra cứu đơn hàng</Link>
        </div>
        <p className="text-sm text-gray-500 mt-10">
          Cần hỗ trợ? Gọi <span className="text-red-500 font-bold">{SITE.hotline}</span> ({SITE.hours})
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className={`${pageTitle} mb-8`}>
        Giỏ hàng <span className="text-red-600">({count})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <ul className="border border-[#2a2a2a] divide-y divide-[#2a2a2a] bg-[#0d0d0d]">
          {items.map((i) => (
            <li key={i.key} className="p-4 sm:p-5 flex gap-4">
              <Link href={`/products/${i.id}`} className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 border border-gray-800">
                <ProductImage id={i.id} name={i.name} imageUrl={i.image} className="w-full h-full" />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <Link href={`/products/${i.id}`} className="font-bold text-gray-100 hover:text-red-500 transition-colors line-clamp-2">
                  {i.name}
                </Link>
                {(i.label || i.color) && (
                  <p className="text-xs text-gray-500 mt-1">{[i.label, i.color].filter(Boolean).join(" · ")}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">{formatPrice(i.price)}</p>

                <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center border border-[#333]">
                    <button type="button" aria-label="Giảm số lượng" onClick={() => changeQty(i.key, -1)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-950/30">
                      <Minus size={14} />
                    </button>
                    <span className="w-9 text-center text-sm font-bold text-white">{i.qty}</span>
                    <button type="button" aria-label="Tăng số lượng" onClick={() => changeQty(i.key, 1)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-950/30">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-red-500">{formatPrice(i.price * i.qty)}</span>
                    <button type="button" aria-label={`Xóa ${i.name}`} onClick={() => removeItem(i.key)} className="text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-28 bg-[#111] border border-[#333] p-6" style={{ clipPath: CUT_CARD }}>
          <h2 className="text-lg font-black uppercase tracking-wide text-white border-b border-[#333] pb-3 mb-4">Tóm tắt đơn hàng</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <dt>Tạm tính ({count} sản phẩm)</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between text-gray-400">
              <dt>Phí vận chuyển</dt>
              <dd className="text-green-500">Miễn phí</dd>
            </div>
            <div className="flex justify-between items-baseline border-t border-[#333] pt-3 mt-3">
              <dt className="font-bold text-gray-200">Tổng cộng</dt>
              <dd className="text-2xl font-black text-red-500">{formatPrice(total)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className={`${btnPrimary} w-full mt-6 py-4`} style={{ clipPath: CUT_BUTTON }}>
            Tiến hành đặt hàng <ArrowRight size={18} />
          </Link>
          <Link href="/products" className="block text-center text-sm text-gray-400 hover:text-red-500 mt-4 transition-colors">
            Tiếp tục mua sắm
          </Link>

          <ul className="mt-6 pt-4 border-t border-[#333] space-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-red-600" /> Hàng chính hãng, bảo hành đầy đủ</li>
            <li className="flex items-center gap-2"><Truck size={14} className="text-red-600" /> Miễn phí giao hàng toàn quốc</li>
          </ul>

          <button
            type="button"
            onClick={() => (confirmClear ? clear() : setConfirmClear(true))}
            onBlur={() => setConfirmClear(false)}
            className={`w-full mt-6 text-xs font-bold uppercase tracking-wider transition-colors ${confirmClear ? "text-red-500" : "text-gray-600 hover:text-gray-400"}`}
          >
            {confirmClear ? "Bấm lần nữa để xóa toàn bộ giỏ hàng" : "Xóa toàn bộ giỏ hàng"}
          </button>
        </aside>
      </div>
    </div>
  );
}
