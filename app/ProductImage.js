"use client";
import { useState } from "react";
import { Smartphone, Tablet, Laptop, Monitor, Cpu, Headphones, Mouse, Keyboard, Speaker, Glasses, ShoppingBag } from "lucide-react";

const ICONS = {
  "dien-thoai": Smartphone, "may-tinh-bang": Tablet, "laptop": Laptop,
  "pc-theo-nganh": Monitor, "linh-kien-pc": Cpu, "tai-nghe": Headphones,
  "chuot": Mouse, "ban-phim": Keyboard, "loa": Speaker, "kinh-ai": Glasses,
};

export default function ProductImage({ id, category, name, imageSrc, imageUrl, className = "", priority = false }) {
  const [error, setError] = useState(false);

  // Ưu tiên ảnh trên Supabase Storage, sau đó ảnh cũ, cuối cùng là ảnh theo id trong /public/images
  const src = imageUrl || imageSrc || `/images/${id}.jpg`;

  if (error) {
    const Icon = ICONS[category] || ShoppingBag;
    return (
      <div className={`flex flex-col items-center justify-center bg-[#1a0505] text-red-600 ${className}`}>
        <Icon size={56} strokeWidth={1} className="drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
        <span className="text-xs mt-2 font-bold uppercase tracking-wider text-red-500">Chưa có ảnh</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ nhiều nguồn ngoài, giữ <img> để fallback onError */}
      <img
        src={src}
        alt={name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="w-full h-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-105"
        onError={() => setError(true)}
      />
    </div>
  );
}
