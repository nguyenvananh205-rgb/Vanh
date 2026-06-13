import { useState } from "react";
import { RefrigeratorIcon, CalendarDays, ShoppingCart, Lightbulb, LayoutDashboard, RefreshCw, Settings, Plus } from "lucide-react";
import { useFridgeStore } from "./store";
import type { FoodItem, MealPlan, ShoppingItem } from "./types";
import Dashboard from "./components/Dashboard";
import FridgeInventory from "./components/FridgeInventory";
import ApiKeySettings from "./components/ApiKeySettings";
import MealPlanner from "./components/MealPlanner";
import MealSuggestions from "./components/MealSuggestions";
import ShoppingList from "./components/ShoppingList";
import SyncData from "./components/SyncData";
import InstallBanner from "./components/InstallBanner";
import SmartAddModal from "./components/SmartAddModal";
import { useNotifications } from "./hooks/useNotifications";

const TABS = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "fridge", label: "Tủ lạnh", icon: RefrigeratorIcon },
  { id: "suggestions", label: "Gợi ý món", icon: Lightbulb },
  { id: "planner", label: "Kế hoạch", icon: CalendarDays },
  { id: "shopping", label: "Mua sắm", icon: ShoppingCart },
  { id: "sync", label: "Đồng bộ", icon: RefreshCw },
] as const;

type TabId = typeof TABS[number]["id"];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { foods, setFoods, meals, setMeals, shopping, setShopping, recipes, setRecipes } = useFridgeStore();

  const handleAddFood = (item: FoodItem) => {
    setFoods((prev) => [...prev, item]);
    setShowAddModal(false);
  };
  const handleUpdateFood = (item: FoodItem) => setFoods((prev) => prev.map((f) => f.id === item.id ? item : f));
  const handleDeleteFood = (id: string) => setFoods((prev) => prev.filter((f) => f.id !== id));

  const handleAddMeal = (meal: MealPlan) => setMeals((prev) => [...prev, meal]);
  const handleDeleteMeal = (id: string) => setMeals((prev) => prev.filter((m) => m.id !== id));

  const handleAddShopping = (item: ShoppingItem) => setShopping((prev) => [...prev, item]);
  const handleAddManyShopping = (items: ShoppingItem[]) => setShopping((prev) => [...prev, ...items]);
  const handleToggleShopping = (id: string) => setShopping((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  const handleDeleteShopping = (id: string) => setShopping((prev) => prev.filter((i) => i.id !== id));
  const handleClearChecked = () => setShopping((prev) => prev.filter((i) => !i.checked));

  const handleImport = (data: { foods: FoodItem[]; meals: MealPlan[]; shopping: ShoppingItem[] }) => {
    setFoods(data.foods);
    setMeals(data.meals);
    setShopping(data.shopping);
  };

  const uncheckedShopping = shopping.filter((i) => !i.checked).length;
  const { requestPermission } = useNotifications(foods);

  const TAB_TITLES: Record<TabId, string> = {
    dashboard: "Tổng quan",
    fridge: "Tủ lạnh",
    suggestions: "Gợi ý món ăn",
    planner: "Kế hoạch bữa ăn",
    shopping: "Danh sách mua sắm",
    sync: "Đồng bộ dữ liệu",
  };

  const showFab = activeTab === "dashboard" || activeTab === "fridge";

  return (
    <div className="fridge-bg">
      {/* Header — stainless steel exterior */}
      <header className="fridge-header sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <RefrigeratorIcon size={19} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight tracking-tight">Tủ lạnh gia đình</h1>
              <p className="text-[11px] text-slate-400 leading-tight">Quản lý thực phẩm thông minh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 shadow-sm"
            >
              <Plus size={16} />
              Thêm
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              title="Cài đặt AI"
            >
              <Settings size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <InstallBanner onRequestNotifications={requestPermission} />

      {/* Tab nav — door compartment rail */}
      <nav className="fridge-tabs sticky top-[57px] z-30">
        <div className="max-w-4xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === id
                    ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/60"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/80 border-b-2 border-transparent"
                }`}
              >
                <Icon size={15} />
                {label}
                {id === "shopping" && uncheckedShopping > 0 && (
                  <span className="absolute -top-0.5 right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {uncheckedShopping > 9 ? "9+" : uncheckedShopping}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Interior LED light strip */}
        <div className="fridge-light-strip" />
      </nav>

      {/* Main content — animated like fridge door opening */}
      <main className="max-w-4xl mx-auto px-4 pt-5 pb-28">
        <div key={activeTab} className="fridge-enter">
          <h2 className="text-xl font-bold text-slate-700 mb-5 tracking-tight">{TAB_TITLES[activeTab]}</h2>

          {activeTab === "dashboard" && (
            <Dashboard
              foods={foods}
              meals={meals}
              shoppingCount={uncheckedShopping}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
              onAddFood={() => setShowAddModal(true)}
            />
          )}
          {activeTab === "fridge" && (
            <FridgeInventory
              foods={foods}
              onUpdate={handleUpdateFood}
              onDelete={handleDeleteFood}
              onOpenAdd={() => setShowAddModal(true)}
            />
          )}
          {activeTab === "suggestions" && (
            <MealSuggestions
              foods={foods}
              recipes={recipes}
              onCook={setFoods}
              onAddShopping={(items) => setShopping((prev) => [...prev, ...items])}
              onAddFood={handleAddFood}
              onSaveRecipes={setRecipes}
            />
          )}
          {activeTab === "planner" && (
            <MealPlanner
              foods={foods}
              meals={meals}
              onAdd={handleAddMeal}
              onDelete={handleDeleteMeal}
            />
          )}
          {activeTab === "shopping" && (
            <ShoppingList
              items={shopping}
              foods={foods}
              meals={meals}
              recipes={recipes}
              onAdd={handleAddShopping}
              onAddMany={handleAddManyShopping}
              onToggle={handleToggleShopping}
              onDelete={handleDeleteShopping}
              onClearChecked={handleClearChecked}
            />
          )}
          {activeTab === "sync" && (
            <SyncData
              foods={foods}
              meals={meals}
              shopping={shopping}
              onImport={handleImport}
            />
          )}
        </div>
      </main>

      {/* FAB — visible on dashboard & fridge */}
      {showFab && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white pl-4 pr-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm transition-all active:scale-95"
          style={{ boxShadow: "0 4px 20px rgba(16,185,129,0.45)" }}
        >
          <Plus size={20} />
          Thêm thực phẩm
        </button>
      )}

      {/* Global SmartAddModal */}
      {showAddModal && (
        <SmartAddModal
          onSave={handleAddFood}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showSettings && <ApiKeySettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
