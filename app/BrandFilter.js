"use client";
import { useState } from "react";
import Link from "next/link";

const INITIAL_COUNT = 12;

const chip = (active) =>
  `px-3 py-1.5 text-xs md:text-sm font-bold uppercase tracking-wider border transition-all ${
    active
      ? "bg-red-700 text-white border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.45)]"
      : "bg-[#050505] text-gray-400 border-[#333] hover:border-red-600 hover:text-red-500"
  }`;

export default function BrandFilter({ brands = [], category, currentBrand }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (brands.length === 0) return null;

  const shown = isExpanded ? brands : brands.slice(0, INITIAL_COUNT);

  const getUrl = (brand) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    return `/products?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-5xl mx-auto">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mr-1">Thương hiệu:</span>
      <Link href={getUrl("")} className={chip(!currentBrand)}>Tất cả</Link>
      {shown.map((b) => (
        <Link key={b} href={getUrl(b)} className={chip(currentBrand === b)}>{b}</Link>
      ))}
      {brands.length > INITIAL_COUNT && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 text-xs md:text-sm font-bold uppercase tracking-wider border border-dashed border-gray-600 text-red-500 hover:text-white hover:border-red-500 transition-colors"
        >
          {isExpanded ? "Thu gọn" : `+${brands.length - INITIAL_COUNT} hãng`}
        </button>
      )}
    </div>
  );
}
