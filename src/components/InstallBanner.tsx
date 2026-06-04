import { useState, useEffect } from "react";
import { Download, X, Bell } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  onRequestNotifications: () => Promise<boolean>;
}

export default function InstallBanner({ onRequestNotifications }: Props) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("install_banner_dismissed") === "1",
  );
  const [notifPermission, setNotifPermission] = useState(
    () => ("Notification" in window ? Notification.permission : "denied"),
  );
  const [notifAsked, setNotifAsked] = useState(
    () => localStorage.getItem("notif_asked") === "1",
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstallEvent(null);
  };

  const handleNotif = async () => {
    localStorage.setItem("notif_asked", "1");
    setNotifAsked(true);
    const ok = await onRequestNotifications();
    setNotifPermission(ok ? "granted" : "denied");
  };

  const dismiss = () => {
    localStorage.setItem("install_banner_dismissed", "1");
    setDismissed(true);
  };

  const showInstall = installEvent && !dismissed;
  const showNotif = !notifAsked && notifPermission === "default" && "Notification" in window;

  if (!showInstall && !showNotif) return null;

  return (
    <div className="bg-emerald-600 text-white">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          {showInstall && (
            <p className="text-sm font-medium leading-tight">
              📱 Cài app lên màn hình điện thoại — dùng như app thật, không cần mạng
            </p>
          )}
          {!showInstall && showNotif && (
            <p className="text-sm font-medium leading-tight">
              🔔 Bật thông báo để được nhắc khi thực phẩm sắp hết hạn
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showInstall && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-white text-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Download size={14} /> Cài đặt
            </button>
          )}
          {showNotif && (
            <button
              onClick={handleNotif}
              className="flex items-center gap-1.5 bg-white text-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Bell size={14} /> Bật thông báo
            </button>
          )}
          <button onClick={dismiss} className="p-1 hover:bg-emerald-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
