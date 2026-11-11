"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (resetError) {
        setError(
          resetError.message.toLowerCase().includes("rate limit")
            ? "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút."
            : "Chưa gửi được email. Vui lòng thử lại."
        );
      } else {
        setMessage(
          "Nếu email này đã đăng ký, bạn sẽ nhận được link đổi mật khẩu trong ít phút (kiểm tra cả mục Spam)."
        );
        setCooldown(60);
      }
    } catch {
      setError("Không thể kết nối. Bạn vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[radial-gradient(ellipse_at_center,rgba(127,29,29,0.3),transparent_65%)] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0b0b0b] border border-red-700/70 p-8 shadow-[0_0_60px_rgba(220,38,38,0.25)]">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
        <Link href="/login" className="text-gray-500 hover:text-red-500 flex items-center gap-2 mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
        <h1 className="text-3xl font-black italic uppercase tracking-wide text-red-600 [text-shadow:0_0_20px_rgba(220,38,38,0.6)] mb-2">Quên mật khẩu</h1>
        <p className="text-gray-500 mb-6 text-sm">Nhập email đăng ký của bạn, chúng tôi sẽ gửi link để đặt lại mật khẩu.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Nhập email của bạn"
              className="w-full bg-black/70 border border-red-950 rounded-sm px-4 py-3 text-white placeholder-gray-600 outline-none transition-all focus:border-red-600 focus:shadow-[0_0_14px_rgba(220,38,38,0.45)]"
            />
          </div>

          {error && <p role="alert" className="border-l-2 border-red-600 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</p>}
          {message && <p role="status" className="border-l-2 border-green-500 bg-green-950/30 px-3 py-2 text-sm text-green-400">{message}</p>}

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full border border-red-600 bg-red-950/40 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-600 hover:text-white hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Đang gửi..."
              : cooldown > 0
              ? `Gửi lại sau ${cooldown}s`
              : "Gửi link đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}