import { useState, useEffect, useCallback } from "react";
import { RefrigeratorIcon, Plus, Hash, Crown, Users, Copy, Check, LogOut, ArrowRight, X } from "lucide-react";
import type { Fridge, UserProfile } from "../types";
import { getMyFridges, createFridge, joinFridgeByCode } from "../lib/supabase";

interface FridgeSelectorProps {
  user: UserProfile;
  onSelect: (fridge: Fridge) => void;
  onSignOut: () => void;
}

export default function FridgeSelector({ user, onSelect, onSignOut }: FridgeSelectorProps) {
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create fridge modal
  const [showCreate, setShowCreate] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState("Tủ lạnh gia đình");
  const [creating, setCreating] = useState(false);

  // Join fridge modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Copied code feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadFridges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { owned, joined } = await getMyFridges(user.id);
      const ownedFridges: Fridge[] = owned.map((f) => ({
        id: f.id as string,
        name: f.name as string,
        owner_id: f.owner_id as string,
        share_code: f.share_code as string,
        role: "owner" as const,
      }));
      const joinedFridges: Fridge[] = joined.map((f) => ({
        id: f.id as string,
        name: f.name as string,
        owner_id: f.owner_id as string,
        share_code: f.share_code as string,
        role: "member" as const,
      }));
      setFridges([...ownedFridges, ...joinedFridges]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadFridges();
  }, [loadFridges]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFridgeName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const fridge = await createFridge(user.id, newFridgeName.trim());
      const newFridge: Fridge = {
        id: fridge.id as string,
        name: fridge.name as string,
        owner_id: fridge.owner_id as string,
        share_code: fridge.share_code as string,
        role: "owner",
      };
      setShowCreate(false);
      onSelect(newFridge);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setError("Mã gồm 6 ký tự"); return; }
    setJoining(true);
    setError(null);
    try {
      const fridge = await joinFridgeByCode(user.id, code);
      const joinedFridge: Fridge = {
        id: fridge.id as string,
        name: fridge.name as string,
        owner_id: fridge.owner_id as string,
        share_code: fridge.share_code as string,
        role: "member",
      };
      setShowJoin(false);
      onSelect(joinedFridge);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("own")) setError("Đây là tủ lạnh của bạn");
      else if (msg.includes("not found") || msg.includes("No rows")) setError("Mã không hợp lệ");
      else setError(msg);
    } finally {
      setJoining(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <RefrigeratorIcon size={19} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Chọn tủ lạnh</h1>
              <p className="text-[11px] text-slate-400 leading-tight">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Fridges list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <span className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Đang tải...</p>
            </div>
          ) : fridges.length === 0 ? (
            <div className="py-12 text-center">
              <RefrigeratorIcon size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Bạn chưa có tủ lạnh nào</p>
              <p className="text-slate-400 text-xs mt-1">Tạo mới hoặc tham gia bằng mã chia sẻ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {fridges.map((fridge) => (
                <div key={fridge.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                    onClick={() => onSelect(fridge)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      fridge.role === "owner" ? "bg-emerald-100" : "bg-blue-100"
                    }`}>
                      {fridge.role === "owner"
                        ? <Crown size={18} className="text-emerald-600" />
                        : <Users size={18} className="text-blue-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{fridge.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          fridge.role === "owner"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {fridge.role === "owner" ? "Chủ sở hữu" : "Thành viên"}
                        </span>
                        {fridge.role === "owner" && (
                          <span className="text-[10px] text-slate-400 font-mono">{fridge.share_code}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {fridge.role === "owner" && (
                      <button
                        onClick={() => copyCode(fridge.share_code, fridge.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Sao chép mã chia sẻ"
                      >
                        {copiedId === fridge.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      </button>
                    )}
                    <button
                      onClick={() => onSelect(fridge)}
                      className="p-2 rounded-lg text-slate-300 group-hover:text-emerald-500 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setShowCreate(true); setError(null); }}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus size={16} />
            Tạo tủ lạnh mới
          </button>
          <button
            onClick={() => { setShowJoin(true); setError(null); }}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          >
            <Hash size={16} />
            Tham gia bằng mã
          </button>
        </div>
      </div>

      {/* ── Create fridge modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800">Tạo tủ lạnh mới</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên tủ lạnh</label>
                <input
                  type="text"
                  value={newFridgeName}
                  onChange={(e) => setNewFridgeName(e.target.value)}
                  placeholder="VD: Tủ lạnh phòng bếp"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newFridgeName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all"
              >
                {creating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Tạo tủ lạnh <Plus size={15} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Join fridge modal ── */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800">Tham gia bằng mã chia sẻ</h3>
              <button onClick={() => setShowJoin(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã chia sẻ</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                    placeholder="AB12CD"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    maxLength={6}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">Nhập mã 6 ký tự từ chủ tủ lạnh</p>
              </div>
              <button
                type="submit"
                disabled={joining || joinCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all"
              >
                {joining ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Tham gia <ArrowRight size={15} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
