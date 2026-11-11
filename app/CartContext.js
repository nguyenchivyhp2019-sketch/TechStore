"use client";
import { createContext, useContext, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "doom-cart-v1";
const EMPTY = [];

// Giỏ hàng lưu trong localStorage để không mất khi tải lại trang, đồng bộ giữa các tab
let cache = null;
const listeners = new Set();

function readCart() {
  if (cache === null) {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      cache = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function writeCart(update) {
  cache = update(readCart());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const items = useSyncExternalStore(subscribe, readCart, () => EMPTY);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const addItem = (product, variant, color, qty = 1) => {
    const key = `${product.id}|${variant?.label || "default"}|${color || "default"}`;
    const price = variant ? variant.price : product.price;
    writeCart((prev) => {
      if (prev.some((i) => i.key === key)) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, 100) } : i));
      }
      return [
        ...prev,
        { key, id: product.id, name: product.name, image: product.image ?? null, label: variant?.label, color, price, qty },
      ];
    });
  };

  const changeQty = (key, delta) =>
    writeCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + delta, 100) } : i))
        .filter((i) => i.qty > 0)
    );

  const removeItem = (key) => writeCart((prev) => prev.filter((i) => i.key !== key));
  const clear = () => writeCart(() => EMPTY);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, changeQty, removeItem, clear, count, total, isMenuOpen, setIsMenuOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải được dùng bên trong <CartProvider>");
  return ctx;
};
