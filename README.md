# Graduation Ceremony Invitation - Story Experience 🎓✨

Trang web thiệp mời tốt nghiệp và lưu bút tương tác phong cách Instagram/Canva Story, hỗ trợ phản hồi tham dự (RSVP) trực tiếp về Google Sheets và phát video kỉ niệm.

## 🌟 Điểm nổi bật
- **Interactive Story Slides**: 9 slide trải nghiệm liền mạch với hiệu ứng lật mở ruy băng, vuốt chạm và bàn phím.
- **Visual Design**: Typography The Seasons & BDScript tinh tế, ngôi sao lấp lánh (sparkle star), hiệu ứng gõ chữ Typewriter, hạt bụi tiên lấp lánh (stardust particles).
- **Ceremony Hotspots**: Các điểm chạm tương tác mở Google Maps vị trí hội trường, xem lịch trình chi tiết và thêm vào Google Calendar.
- **RSVP Tích hợp Google Sheets**: Khách mời xác nhận "Có" hoặc "Không", nhập tên và lời chúc; dữ liệu được gửi tức thì về Google Sheets qua Apps Script.
- **Memory Video Modal**: Slide kỷ niệm phát video kỷ yếu trực tiếp trong trình phát tùy chỉnh mượt mà.

---

## 📁 Cấu trúc thư mục

```text
├── index.html              # Cấu trúc HTML chính của 9 slide
├── style.css               # Toàn bộ CSS phong cách Canva Story & animations
├── app.js                  # Logic chuyển slide, typewriter, RSVP, particles
├── GoogleAppsScript.gs     # Mã backend Google Apps Script để nhận RSVP
├── The.mp4                 # Video kỷ niệm phát ở slide 7
├── The/                    # Các hình nền slide chính (1, 6, 7, 8, 9, 10)
├── assets_clean/           # Hình nền đã xử lý đồ họa sạch (cover, invite, timeline)
├── fonts/                  # Phông chữ The Seasons & BDScript
├── .gitignore              # Bỏ qua thư mục unused/ và file rác khi push GitHub
└── unused/                 # Thư mục lưu trữ tài nguyên cũ, dev frames (được gitignore)
```

---

## 🚀 Hướng dẫn triển khai

### 1. Chạy trên máy tính (Local)
Mở trực tiếp tệp `index.html` bằng trình duyệt hoặc sử dụng Live Server trong VS Code:
```bash
# Hoặc dùng Python http server
python -m http.server 8080
```
Truy cập `http://localhost:8080` trên trình duyệt.

### 2. Đưa lên GitHub Pages
1. Khởi tạo kho lưu trữ Git và push code lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Graduation invitation story website"
   git branch -M main
   git remote add origin <URL_REPO_CUA_BAN>
   git push -u origin main
   ```
2. Vào **Settings** > **Pages** trên repo GitHub.
3. Tại mục **Branch**, chọn `main` và thư mục `/ (root)`, nhấn **Save**.
4. Website của bạn sẽ hoạt động trực tiếp tại `https://<username>.github.io/<repo-name>/`.

### 3. Cấu hình Google Apps Script cho RSVP
1. Tạo một Google Sheet mới.
2. Vào **Tiện ích mở rộng (Extensions)** > **Apps Script**.
3. Dán toàn bộ nội dung từ tệp `GoogleAppsScript.gs` vào trình soạn thảo.
4. Nhấn **Deploy** (Triển khai) > **New Deployment** (Triển khai mới) > Chọn loại **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy URL Web App vừa tạo và thay thế vào hằng số `SCRIPT_URL` trong file `app.js`.

---

© 2026 Graduation Invitation Experience.
