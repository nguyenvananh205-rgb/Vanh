import { useState } from "react";
import { X, Plus, Trash2, Edit2, ChefHat, Clock, Users, Check } from "lucide-react";
import type { Recipe, RecipePurpose, DishRole, RecipeIngredient } from "../types";
import { generateId } from "../utils";

interface Props {
  recipes: Recipe[];
  onSave: (recipes: Recipe[]) => void;
  onClose: () => void;
}

const PURPOSE_LABELS: Record<RecipePurpose, string> = {
  com_gia_dinh: "🏠 Cơm gia đình",
  healthy: "🥗 Healthy",
  dac_biet: "✨ Đặc biệt",
};

const ROLE_LABELS: Record<DishRole, string> = {
  canh: "🍲 Canh",
  rau: "🥦 Rau",
  chinh: "🥩 Chính",
  phu: "🍳 Phụ",
};

const PURPOSES: RecipePurpose[] = ["com_gia_dinh", "healthy", "dac_biet"];
const ROLES: DishRole[] = ["canh", "rau", "chinh", "phu"];

function emptyIngredient(): RecipeIngredient {
  return { name: "", quantity: 1, unit: "gram", optional: false };
}

function emptyRecipe(): Omit<Recipe, "id"> {
  return {
    name: "",
    purpose: "com_gia_dinh",
    role: "chinh",
    cookTime: 20,
    servings: 2,
    ingredients: [emptyIngredient()],
    notes: "",
  };
}

interface RecipeFormProps {
  initial?: Recipe;
  onDone: (r: Recipe) => void;
  onCancel: () => void;
}

function RecipeForm({ initial, onDone, onCancel }: RecipeFormProps) {
  const [form, setForm] = useState<Omit<Recipe, "id">>(initial ? { ...initial } : emptyRecipe());

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setIng = (idx: number, field: keyof RecipeIngredient, val: string | number | boolean) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) =>
        i === idx ? { ...ing, [field]: val } : ing
      ),
    }));
  };

  const addIng = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }));
  const removeIng = (idx: number) => setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));

  const valid = form.name.trim() && form.ingredients.some((i) => i.name.trim());

  const handleSubmit = () => {
    if (!valid) return;
    onDone({
      ...form,
      id: initial?.id ?? generateId(),
      ingredients: form.ingredients.filter((i) => i.name.trim()),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tên món *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Vd: Canh chua cá"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          autoFocus
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Mục đích</label>
          <select
            value={form.purpose}
            onChange={(e) => setField("purpose", e.target.value as RecipePurpose)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {PURPOSES.map((p) => <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Loại món</label>
          <select
            value={form.role}
            onChange={(e) => setField("role", e.target.value as DishRole)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Thời gian (phút)</label>
          <input
            type="number"
            value={form.cookTime}
            onChange={(e) => setField("cookTime", parseInt(e.target.value) || 0)}
            min={1}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Khẩu phần (người)</label>
          <input
            type="number"
            value={form.servings}
            onChange={(e) => setField("servings", parseInt(e.target.value) || 1)}
            min={1}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">Nguyên liệu *</label>
          <button onClick={addIng} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <Plus size={12} /> Thêm
          </button>
        </div>
        <div className="space-y-2">
          {form.ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-1.5 items-center">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => setIng(idx, "name", e.target.value)}
                placeholder="Tên nguyên liệu"
                className="flex-[3] border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
              <input
                type="number"
                value={ing.quantity}
                onChange={(e) => setIng(idx, "quantity", parseFloat(e.target.value) || 0)}
                min={0}
                step={0.5}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => setIng(idx, "unit", e.target.value)}
                placeholder="đvt"
                className="w-14 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
              <button
                onClick={() => setIng(idx, "optional", !ing.optional)}
                title="Tùy chọn"
                className={`text-xs px-1.5 py-1.5 rounded-lg border transition-colors ${
                  ing.optional ? "bg-slate-100 border-slate-300 text-slate-500" : "border-slate-200 text-slate-300 hover:border-slate-300"
                }`}
              >
                tùy
              </button>
              {form.ingredients.length > 1 && (
                <button onClick={() => removeIng(idx)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Nhấn "tùy" để đánh dấu nguyên liệu tùy chọn</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú</label>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Cách làm, mẹo, biến thể..."
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <Check size={15} />
          {initial ? "Lưu thay đổi" : "Thêm công thức"}
        </button>
      </div>
    </div>
  );
}

export default function RecipeManager({ recipes, onSave, onClose }: Props) {
  const [filterPurpose, setFilterPurpose] = useState<RecipePurpose | "all">("all");
  const [filterRole, setFilterRole] = useState<DishRole | "all">("all");
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = recipes.filter(
    (r) =>
      (filterPurpose === "all" || r.purpose === filterPurpose) &&
      (filterRole === "all" || r.role === filterRole)
  );

  const handleAdd = (r: Recipe) => {
    onSave([...recipes, r]);
    setAdding(false);
  };

  const handleEdit = (r: Recipe) => {
    onSave(recipes.map((x) => (x.id === r.id ? r : x)));
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    onSave(recipes.filter((r) => r.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <ChefHat size={20} className="text-emerald-500" />
            <h2 className="text-base font-bold text-slate-800">Quản lý công thức</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{recipes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAdding(true); setEditing(null); }}
              className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Plus size={13} /> Thêm
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Form area */}
        {(adding || editing) && (
          <div className="px-5 py-4 border-b border-slate-100 overflow-y-auto max-h-[60vh]">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              {editing ? `Sửa: ${editing.name}` : "Thêm công thức mới"}
            </h3>
            <RecipeForm
              initial={editing ?? undefined}
              onDone={editing ? handleEdit : handleAdd}
              onCancel={() => { setEditing(null); setAdding(false); }}
            />
          </div>
        )}

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-100 space-y-2 shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterPurpose("all")}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterPurpose === "all" ? "bg-slate-700 text-white border-slate-700" : "border-slate-200 text-slate-600"}`}
            >
              Tất cả
            </button>
            {PURPOSES.map((p) => (
              <button
                key={p}
                onClick={() => setFilterPurpose(p)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterPurpose === p ? "bg-emerald-500 text-white border-emerald-500" : "border-slate-200 text-slate-600"}`}
              >
                {PURPOSE_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterRole("all")}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterRole === "all" ? "bg-slate-700 text-white border-slate-700" : "border-slate-200 text-slate-600"}`}
            >
              Mọi loại
            </button>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterRole === r ? "bg-blue-500 text-white border-blue-500" : "border-slate-200 text-slate-600"}`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <ChefHat size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Không có công thức nào</p>
            </div>
          )}
          {filtered.map((r) => (
            <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{ROLE_LABELS[r.role]}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{PURPOSE_LABELS[r.purpose]}</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mt-1">{r.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-0.5"><Clock size={11} /> {r.cookTime} phút</span>
                  <span className="flex items-center gap-0.5"><Users size={11} /> {r.servings} người</span>
                  <span>{r.ingredients.length} nguyên liệu</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {r.ingredients.filter(i => !i.optional).map(i => i.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditing(r); setAdding(false); }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                {deleteId === r.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Xóa
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="text-xs px-2 py-1 border border-slate-200 rounded-lg text-slate-500"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
