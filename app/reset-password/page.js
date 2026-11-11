"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    // Supabase bắn sự kiện này khi khách bấm link khôi phục trong email
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY" && active) {
          setReady(true);
          setChecking(false);
        }
      }
    );

    // Dự phòng: nếu sau 1.5s vẫn chưa có phiên thì coi như link không hợp lệ
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setReady(true);
      } else {
        setError("Link đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.");
      }
      setChecking(false);
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        const msg = updateError.message.toLowerCase();
        if (msg.includes("different from the old")) {
          setError("Mật khẩu mới phải khác mật khẩu cũ.");
        } else if (msg.includes("session") || msg.includes("expired")) {
          setError("Phiên đã hết hạn. Vui lòng yêu cầu link mới.");
          setReady(false);
        } else {
          setError("Chưa đổi được mật khẩu. Vui lòng thử lại.");
        }
      } else {
        setMessage("Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...");
        await supabase.auth.signOut(); // bỏ phiên tạm, bắt đăng nhập lại bằng mật khẩu mới
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Không thể kết nối. Bạn vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-black/70 border border-red-950 rounded-sm px-4 py-3 text-white placeholder-gray-600 outline-none transition-all focus:border-red-600 focus:shadow-[0_0_14px_rgba(220,38,38,0.45)]";

  return (
    <div className="min-h-[80vh] bg-[radial-gradient(ellipse_at_center,rgba(127,29,29,0.3),transparent_65%)] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0b0b0b] border border-red-700/70 p-8 shadow-[0_0_60px_rgba(220,38,38,0.25)]">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
        <h1 className="text-3xl font-black italic uppercase tracking-wide text-red-600 [text-shadow:0_0_20px_rgba(220,38,38,0.6)] mb-6">Tạo mật khẩu mới</h1>

        {checking && <p className="text-gray-500 text-sm">Đang kiểm tra link...</p>}

        {!checking && !ready && (
          <div className="space-y-4">
            <p role="alert" className="border-l-2 border-red-600 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</p>
            <Link href="/forgot-password" className="block w-full text-center border border-red-600 bg-red-950/40 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-600 hover:text-white">
              Yêu cầu link mới
            </Link>
          </div>
        )}

        {!checking && ready && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Mật khẩu mới</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Nhập lại mật khẩu</label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {error && <p role="alert" className="border-l-2 border-red-600 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</p>}
            {message && <p role="status" className="border-l-2 border-green-500 bg-green-950/30 px-3 py-2 text-sm text-green-400">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-red-600 bg-red-950/40 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-600 hover:text-white hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}