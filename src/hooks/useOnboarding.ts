import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startOnboardingTour(setActiveTab: (tab: string) => void) {
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
            "Mô tả bằng giọng nói, nhập tay, hoặc để AI nhận diện từ ảnh biên lai — thực phẩm sẽ được tự động phân loại.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="btn-settings"]',
        popover: {
          title: "⚙️ Cài đặt AI",
          description:
            "Nhập Anthropic API key để mở khoá tính năng AI: gợi ý món ăn, nhận diện thực phẩm từ ảnh và phân tích nguyên liệu.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="tab-dashboard"]',
        popover: {
          title: "📊 Tổng quan",
          description:
            "Snapshot nhanh tình trạng tủ lạnh: tổng số thực phẩm, cảnh báo sắp hết hạn và số bữa ăn đã lên kế hoạch tuần này.",
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
            "AI phân tích nguyên liệu có sẵn trong tủ và gợi ý các món có thể nấu ngay hôm nay — tránh lãng phí thực phẩm.",
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
            "Lên thực đơn bữa trưa và bữa tối cho cả tuần. Không còn phải hỏi 'hôm nay ăn gì?' mỗi ngày.",
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
            "Danh sách mua sắm thông minh: thêm tay, nhập từ kế hoạch bữa ăn, hoặc để AI gợi ý dựa trên những gì thiếu trong tủ.",
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
            "Nút tắt luôn hiện ở góc phải màn hình khi bạn đang xem Tổng quan hoặc Tủ lạnh. Một chạm để thêm thực phẩm mới.",
          side: "top",
          align: "end",
        },
        onHighlightStarted: () => setActiveTab("dashboard"),
      },
    ],
  });

  driverObj.drive();
}
