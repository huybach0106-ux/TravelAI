# TravelAI - Khám phá Việt Nam theo cách của riêng bạn 🇻🇳

**TravelAI** là một ứng dụng hỗ trợ du lịch thông minh, kết hợp giữa giao diện hiện đại (UI/UX) và trí tuệ nhân tạo (Llama AI) để gợi ý lịch trình và khám phá các địa điểm nổi tiếng tại Việt Nam.

---

## 📂 Cấu trúc thư mục dự án
Dự án được tổ chức theo cấu trúc Fullstack đơn giản:
- **`/` (Thư mục gốc):** Chứa trang chủ Landing Page (`index.html`) và các tài nguyên UI/UX chính.
- **`frontend/`:** Chứa giao diện chi tiết của ứng dụng Chat AI (`chatai.html`) và hệ thống bản đồ.
- **`backend/`:** Chứa mã nguồn Python Flask xử lý dữ liệu và kết nối mô hình AI.
- **`assets/`:** Kho lưu trữ hình ảnh, icons và logo của ứng dụng.

---

## 🚀 Hướng dẫn chạy dự án trên máy cục bộ (Local)

### Bước 1: Khởi động Backend (AI Server)
Yêu cầu: Máy tính đã cài đặt **Python 3.8 trở lên**.

1. Mở Terminal (hoặc CMD/PowerShell) và di chuyển vào thư mục backend:
   ```bash
   cd backend
2. Chạy trực tiếp file server:

   Bash
   python app.py
Lưu ý: Server sẽ mặc định khởi chạy tại địa chỉ: http://127.0.0.1:5000 (localhost:5000)

Bước 2: Khởi động Frontend (Giao diện)
Yêu cầu: Sử dụng VS Code và extension Live Server.
1.Mở toàn bộ thư mục dự án bằng VS Code.
2.Nhấp chuột phải vào file index.html ở thư mục gốc -> Chọn "Open with Live Server".
3.Trình duyệt sẽ tự động mở trang chủ.
Đến phần chatai
Giao diện ứng dụng được chia thành thanh điều hướng bên trái (Sidebar) và khu vực nội dung chính. Dưới đây là cách sử dụng từng tính năng:

### 1. 💬 Đoạn chat (Chat)
- Đây là trung tâm giao tiếp với AI. 
- Bạn có thể gõ trực tiếp câu hỏi vào thanh input ở dưới cùng (VD: *"Lên lịch trình 3 ngày 2 đêm ở Đà Lạt"*).
- Click vào nút **"New chat"** ở menu trái để xóa trắng đoạn hội thoại và bắt đầu một chủ đề mới.

### 2. 🧳 Chuyến đi (Trips)
- Nơi quản lý các chuyến đi bạn đã lên kế hoạch hoặc đã đặt chỗ.
- Nếu chưa có chuyến đi nào, bạn có thể bấm nút **"Tạo chuyến đi của bạn ngay bây giờ"** để quay lại nhờ AI tư vấn.

### 3. 🔍 Khám phá (Explore)
- Nhập tên tỉnh thành hoặc địa danh vào ô tìm kiếm để AI gợi ý các điểm tham quan ("Things To Do").
- Giao diện chia làm 2 phần: Danh sách các thẻ địa điểm bên trái và Bản đồ trực quan (Map) bên phải.
- **Mẹo:** Click vào biểu tượng trái tim ❤️ trên mỗi thẻ để lưu địa điểm, hoặc click vào chính thẻ đó để tự động yêu cầu AI thuyết minh chi tiết về địa danh.

### 4. ❤️ Lưu trữ (Saved)
- Nơi chứa các "Bộ sưu tập" mà bạn đã thả tim ở mục Khám phá. Giúp bạn dễ dàng xem lại các địa điểm yêu thích trước khi ra quyết định xách ba lô lên và đi.

### 5. 🔔 Thông báo (Updates/Notifications)
- Bảng thông báo dạng trượt (Flyout Panel) hiển thị các bản cập nhật mới từ hệ thống hoặc cảnh báo lịch trình.
- Click ra ngoài khoảng trống để tự động đóng bảng thông báo cực kỳ tiện lợi.

### 6. 💡 Gợi ý (Suggestions/Inspiration)
- Nơi tìm kiếm cảm hứng cho chuyến đi tiếp theo.
- Chiêm ngưỡng dải ảnh chạy ngang (Marquee) tuyệt đẹp về phong cảnh Việt Nam. Di chuột vào dải ảnh để tạm dừng và ngắm nhìn kỹ hơn.
- Nhấn **"Tìm hiểu cùng AI"** để bắt đầu lên kế hoạch cho một cẩm nang du lịch mới.
🛠 Công nghệ sử dụng
Frontend: HTML5, CSS3 (Flexbox, CSS Grid, Keyframes Animation), JavaScript (ES6+).

Maps: Mapbox GL JS (Hiển thị bản đồ vệ tinh 3D).

Backend: Python Flask.

AI Model: Llama-based AI (Xử lý ngôn ngữ tự nhiên và gợi ý địa điểm).

Icons & Fonts: FontAwesome, Boxicons, Google Fonts (Inter), Favicon.
## 📚 Tài liệu tham khảo & Nguồn tài nguyên

Dự án được hoàn thiện nhờ sự hỗ trợ từ các tài nguyên và thư viện mã nguồn mở sau:

* **Trí tuệ nhân tạo (AI & LLM):**
    * [Groq API Documentation](https://console.groq.com/docs/quickstart) - Cung cấp API xử lý ngôn ngữ tự nhiên (NLP) với tốc độ suy luận cực nhanh nhờ kiến trúc LPU.
* **Bản đồ & Định vị (Maps & Location Services):** * [Mapbox GL JS API Documentation](https://docs.mapbox.com/mapbox-gl-js/api/) - Xử lý hiển thị bản đồ và tìm kiếm địa điểm.
* **Giao diện & Đồ họa (UI & Graphics):**
    * [Boxicons](https://boxicons.com/) - Thư viện icon mã nguồn mở, nhẹ và hiện đại.
    * [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter) - Font chữ chủ đạo giúp tối ưu khả năng đọc trên UI/UX.
* **Công cụ phát triển (Development Tools):**
    * [VS Code Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) - Môi trường chạy thử nghiệm dự án Localhost.
