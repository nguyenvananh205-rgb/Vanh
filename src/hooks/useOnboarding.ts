import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const SPARKLE_EMOJIS = ["🥦", "🥕", "🍎", "🧀", "🥚", "🌽", "🍅", "🫐", "🥑", "🍋", "✨", "⭐", "🌟", "🎉", "🎊", "💫"];

function showEndSparkle() {
  const overlay = document.createElement("div");
  overlay.className = "tour-end-overlay";

  // 22 burst particles spread across the screen
  const particles: HTMLSpanElement[] = [];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement("span");
    el.textContent = SPARKLE_EMOJIS[i % SPARKLE_EMOJIS.length];
    el.className = "tour-end-sparkle-particle";
    const delay = Math.random() * 0.45;
    el.style.cssText = `
      left: ${5 + Math.random() * 88}vw;
      top: ${5 + Math.random() * 85}vh;
      font-size: ${14 + Math.random() * 22}px;
      animation-delay: ${delay}s, ${delay + 0.52}s;
      animation-duration: 0.5s, 0.55s;
    `;
    overlay.appendChild(el);
    particles.push(el);
  }

  // Central success banner
  const banner = document.createElement("div");
  banner.className = "tour-end-banner";
  banner.innerHTML = `
    <div class="tour-end-banner-emojis">🎉✨🍀</div>
    <div class="tour-end-banner-title">Bạn đã khám phá xong!</div>
    <div class="tour-end-banner-sub">Bắt đầu quản lý tủ lạnh nào 🚀</div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(banner);

  // Exit animation then cleanup
  setTimeout(() => {
    banner.classList.add("tour-end-banner-exit");
    setTimeout(() => {
      overlay.remove();
      banner.remove();
    }, 380);
  }, 2200);
}

export function startOnboardingTour(setActiveTab: (tab: string) => void) {
  let reachedLastStep = false;

  const driverObj = driver({
    showProgress: true,
    progressText: "{{current}} / {{total}}",
    animate: true,
    overlayOpacity: 0.65,
    smoothScroll: true,
    allowClose: true,
    doneBtnText: "Bắt đầu dùng →",
    nextBtnText: "Tiếp →",
    prevBtnText: "← Quay lại",
    onDestroyed: () => {
      if (reachedLastStep) showEndSparkle();
    },
    steps: [
      {
        element: '[data-tour="header"]',
        popover: {
          title: "🧊 Tủ lạnh gia đình",
          description:
            "Ứng dụng giúp bạn quản lý thực phẩm, lên kế hoạch bữa ăn và mua sắm thông minh hơn mỗi ngày.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="btn-add-header"]',
        popover: {
          title: "➕ Thêm thực phẩm",
          description:
            "Mô tả bằng giọng nói, nhập tay, hoặc để AI nhận diện từ ảnh biên lai — thực phẩm tự động được phân loại.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="btn-settings"]',
        popover: {
          title: "⚙️ Cài đặt AI",
          description:
            "Nhập Anthropic API key để mở khoá tính năng AI: gợi ý món ăn, nhận diện thực phẩm và phân tích nguyên liệu.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="tab-dashboard"]',
        popover: {
          title: "📊 Tổng quan",
          description:
            "Snapshot nhanh tình trạng tủ lạnh: tổng số thực phẩm, cảnh báo sắp hết hạn và bữa ăn đã lên kế hoạch tuần này.",
          side: "bottom",
          align: "start",
        },
        onHighlightStarted: () => setActiveTab("dashboard"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "📋 Khu vực nội dung",
          description:
            "Thông tin chi tiết của từng tab hiện ra tại đây. Nhấn vào các thẻ số liệu để chuyển nhanh sang tab tương ứng.",
          side: "top",
          align: "center",
        },
      },
      {
        element: '[data-tour="tab-fridge"]',
        popover: {
          title: "🧊 Tủ lạnh",
          description:
            "Xem toàn bộ thực phẩm đang có — sắp xếp theo hạn sử dụng. Thực phẩm sắp hỏng được đánh dấu màu để dễ nhận ra.",
          side: "bottom",
          align: "start",
        },
        onHighlightStarted: () => setActiveTab("fridge"),
      },
      {
        element: '[data-tour="tab-suggestions"]',
        popover: {
          title: "💡 Gợi ý món",
          description:
            "AI phân tích nguyên liệu có sẵn và gợi ý món có thể nấu ngay hôm nay — tránh lãng phí thực phẩm.",
          side: "bottom",
          align: "start",
        },
        onHighlightStarted: () => setActiveTab("suggestions"),
      },
      {
        element: '[data-tour="tab-planner"]',
        popover: {
          title: "📅 Kế hoạch bữa ăn",
          description:
            "Lên thực đơn bữa trưa và bữa tối cho cả tuần. Không còn phải hỏi \"hôm nay ăn gì?\" mỗi ngày.",
          side: "bottom",
          align: "start",
        },
        onHighlightStarted: () => setActiveTab("planner"),
      },
      {
        element: '[data-tour="tab-shopping"]',
        popover: {
          title: "🛒 Mua sắm",
          description:
            "Danh sách mua sắm thông minh: thêm tay, nhập từ kế hoạch bữa ăn, hoặc để AI gợi ý khi thiếu nguyên liệu.",
          side: "bottom",
          align: "start",
        },
        onHighlightStarted: () => setActiveTab("shopping"),
      },
      {
        element: '[data-tour="tab-sync"]',
        popover: {
          title: "🔄 Đồng bộ",
          description:
            "Xuất dữ liệu để chia sẻ với người thân cùng quản lý, hoặc nhập lại khi đổi thiết bị — không mất dữ liệu.",
          side: "bottom",
          align: "start",
        },
        onHighlightStarted: () => setActiveTab("sync"),
      },
      {
        element: '[data-tour="fab"]',
        popover: {
          title: "⚡ Thêm nhanh",
          description:
            "Nút tắt luôn hiện ở góc phải khi xem Tổng quan hoặc Tủ lạnh. Một chạm để thêm thực phẩm mới.",
          side: "top",
          align: "end",
        },
        onHighlightStarted: () => {
          setActiveTab("dashboard");
          reachedLastStep = true;
        },
      },
    ],
  });

  driverObj.drive();
}
