import { useState } from "react";
import { RefrigeratorIcon, Phone, Lock, Eye, EyeOff, Hash, ArrowRight, UserCheck } from "lucide-react";
import { getFridgeByCode, isSupabaseConfigured } from "../lib/supabase";
import type { UseAuthReturn } from "../hooks/useAuth";

type Tab = "login" | "register" | "guest";

interface AuthScreenProps {
  auth: UseAuthReturn;
  onGuestAccess: (fridgeId: string, fridgeName: string) => void;
}

export default function AuthScreen({ auth, onGuestAccess }: AuthScreenProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const error = localError ?? auth.error;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();
    if (!phone.trim()) { setLocalError("Vui lòng nhập số điện thoại"); return; }
    if (!password) { setLocalError("Vui lòng nhập mật khẩu"); return; }
    setSubmitting(true);
    try {
      await auth.signIn(phone.trim(), password);
    } catch {
      // error set by auth hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();
    if (!phone.trim()) { setLocalError("Vui lòng nhập số điện thoại"); return; }
    if (!/^0\d{9}$/.test(phone.trim())) { setLocalError("Số điện thoại không hợp lệ (VD: 0912345678)"); return; }
    if (password.length < 6) { setLocalError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (password !== confirmPassword) { setLocalError("Mật khẩu xác nhận không khớp"); return; }
    setSubmitting(true);
    try {
      await auth.signUp(phone.trim(), password);
    } catch {
      // error set by auth hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const code = shareCode.trim().toUpperCase();
    if (code.length !== 6) { setLocalError("Mã chia sẻ gồm 6 ký tự"); return; }
    if (!isSupabaseConfigured) { setLocalError("Chưa cấu hình Supabase"); return; }
    setSubmitting(true);
    try {
      const fridge = await getFridgeByCode(code);
      onGuestAccess(fridge.id as string, fridge.name as string);
    } catch {
      setLocalError("Mã không hợp lệ hoặc tủ lạnh không tồn tại");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "login", label: "Đăng nhập" },
    { id: "register", label: "Đăng ký" },
    { id: "guest", label: "Vãng lai" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & App Name */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/peach-chef.webp"
              alt="Peach Chef"
              className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
              onError={(e) => {
                // Fallback to icon if image not found
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <RefrigeratorIcon size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tủ lạnh gia đình</h1>
          </div>
          <p className="text-sm text-slate-500">Quản lý thực phẩm thông minh cho cả gia đình</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setLocalError(null); auth.clearError(); }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Error banner */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Login form ── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || auth.loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Đăng nhập <ArrowRight size={16} /></>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500">
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-emerald-600 font-medium hover:underline">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            )}

            {/* ── Register form ── */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Định dạng: 0912 345 678 (10 chữ số)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || auth.loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Tạo tài khoản <ArrowRight size={16} /></>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500">
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-emerald-600 font-medium hover:underline">
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}

            {/* ── Guest form ── */}
            {tab === "guest" && (
              <form onSubmit={handleGuestAccess} className="space-y-4">
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserCheck size={28} className="text-amber-500" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Nhập mã chia sẻ từ thành viên gia đình để xem và thêm thực phẩm vào tủ lạnh chung — không cần tài khoản.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã chia sẻ tủ lạnh</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                      placeholder="AB12CD"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      maxLength={6}
                      autoComplete="off"
                      autoCapitalize="characters"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">6 ký tự: chữ và số (VD: AB12CD)</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || shareCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Truy cập tủ lạnh <ArrowRight size={16} /></>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500">
                  Muốn tạo tủ lạnh của riêng mình?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-emerald-600 font-medium hover:underline">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center">
            Supabase chưa được cấu hình. Vui lòng thiết lập{" "}
            <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> và{" "}
            <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Tủ lạnh gia đình &copy; 2025 — Quản lý thực phẩm thông minh
        </p>
      </div>
    </div>
  );
}
