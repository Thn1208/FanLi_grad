// ============================================================================
// GOOGLE APPS SCRIPT CHO THIỆP MỜI TỐT NGHIỆP PHƯƠNG
// ============================================================================
// Hướng dẫn cài đặt 3 bước cực kỳ đơn giản:
//
// 1. Tạo 1 file Google Sheets mới trên Google Drive (đặt tên ví dụ: "RSVP Tốt Nghiệp Phương").
//    Ở dòng đầu tiên (dòng 1), đặt các tiêu đề cột:
//    Cột A: Thời gian (Timestamp)
//    Cột B: Tên khách mời (Guest Name)
//    Cột C: Tham gia (Attendance)
//    Cột D: Số lượng (Guest Count)
//    Cột E: Lời chúc / Tin nhắn (Message)
//    Cột F: Nguồn link (Source URL)
//
// 2. Vào menu "Tiện ích mở rộng" (Extensions) -> "Apps Script".
//    Xóa toàn bộ mã mặc định, copy và dán toàn bộ đoạn mã bên dưới vào.
//
// 3. Bấm nút "Triển khai" (Deploy) ở góc trên bên phải:
//    - Chọn "Tạo mới việc triển khai" (New deployment).
//    - Loại: Chọn "Ứng dụng web" (Web app).
//    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
//    - Ai có quyền truy cập (Who has access): Chọn "Bất kỳ ai" (Anyone).
//    - Bấm "Triển khai" (Deploy) và cấp quyền truy cập nếu Google hỏi.
//    - Copy đường link URL Web app (dạng: https://script.google.com/macros/s/AKfycb.../exec).
//
// 4. Mở file app.js trong thư mục thiệp mời, dán link vừa copy vào dòng:
//    googleSheetScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec",
//
// ============================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Thêm 1 dòng mới vào Google Sheet
    sheet.appendRow([
      new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      data.guestName || "Khách",
      data.attendance === "Yes" ? "Có tham gia (Yes)" : "Không thể tham gia (No)",
      data.guestCount || "1",
      data.message || "",
      data.sourceUrl || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Đã lưu phản hồi thành công!" 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
