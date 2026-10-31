/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: TỰ ĐỘNG ĐỒNG BỘ GOOGLE SHEET & GỬI EMAIL XÁC NHẬN RSVP
 * Lễ Tốt Nghiệp: The Quiet Strength — Nguyễn Thị Diễm Phương
 * ============================================================================
 *
 * CÁC CỘT TRONG GOOGLE SHEET CỦA BẠN:
 * Cột A: No.                (Số thứ tự: 1, 2, 3...)
 * Cột B: Name               (Tên khách mời: Minh Tuấn, Thùy Linh,...)
 * Cột C: Time               (Khung giờ mời: 08:00 AM – 11:30 AM)
 * Cột D: Nam/nữ             (Giới tính: Nam / Nữ)
 * Cột E: Status             (Trạng thái: Có tham gia / Không tham gia)
 * Cột F: Note               (Lời nhắn / Lời chúc của khách gửi Phương)
 * Cột G: Email              (Email của khách để tự động gửi thư cảm ơn)
 * Cột H: Link Thiệp Mời     (Đường link thiệp mời cá nhân hóa)
 * Cột I: Thời gian phản hồi (Ngày giờ khách bấm gửi RSVP)
 *
 * ============================================================================
 * HƯỚNG DẪN CÀI ĐẶT 4 BƯỚC:
 * 1. Mở file Google Sheet chứa danh sách khách mời của bạn.
 * 2. Vào menu "Tiện ích mở rộng" (Extensions) -> chọn "Apps Script".
 * 3. Xoá hết mã cũ, dán toàn bộ đoạn mã trong file này vào rồi bấm Lưu (Ctrl + S).
 * 4. Bấm nút "Triển khai" (Deploy) ở góc trên bên phải:
 *    - Chọn "Quản lý việc triển khai" hoặc "Tạo mới việc triển khai" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web app).
 *    - Mô tả: "RSVP & Auto Email Confirmation".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone). -> RẤT QUAN TRỌNG!
 *    - Bấm "Triển khai" (Deploy) -> Cấp quyền cho Google Tài khoản của bạn.
 *    - Sao chép đường link Web App (dạng: https://script.google.com/macros/s/.../exec).
 *    - Dán đường link này vào biến `googleSheetScriptUrl` trong file app.js!
 * ============================================================================
 */

// Cấu hình thông tin sự kiện
var EVENT_CONFIG = {
  hostName: "Nguyễn Thị Diễm Phương",
  eventName: "Phuong's Graduation Ceremony — The Quiet Strength",
  dateText: "Chủ Nhật, ngày 08 tháng 11 năm 2026 (SUN, NOV 8, 2026)",
  timeText: "08:00 AM – 11:30 AM",
  venueName: "Hội trường A, Trường Đại học FPT TP.HCM",
  venueAddress: "Đường D1, Khu Công nghệ cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM",
  mapsUrl: "https://maps.app.goo.gl/F1LVCkgJ4KDwRs2bA",
  contactPhone: "0367 989 880",
  // Link website thiệp mời chính của bạn (thay thế bằng link GitHub Pages thực tế nếu có)
  websiteUrl: "https://your-domain.github.io/FanLi_grad/"
};

// ----------------------------------------------------------------------------
// 1. XỬ LÝ POST REQUEST: NHẬN RSVP VÀ GỬI EMAIL TỰ ĐỘNG
// ----------------------------------------------------------------------------
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || "rsvp";
    var guestName = (payload.guestName || "Name").trim();
    var attendance = payload.attendance || "Yes";
    var email = (payload.email || "").trim();
    var message = (payload.message || "").trim();
    var timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // HÀNH ĐỘNG 1: THÊM KHÁCH MỜI MỚI TỪ FORM TẠO LINK (action: "addGuest")
    if (action === "addGuest") {
      var nextNo = sheet.getLastRow();
      sheet.appendRow([
        nextNo,
        payload.name || "Khách",
        payload.time || EVENT_CONFIG.timeText,
        payload.gender || "",
        "Chờ phản hồi",
        payload.note || "",
        payload.email || "",
        payload.cardUrl || "",
        timestamp
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Đã thêm khách mời vào danh sách thành công!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // HÀNH ĐỘNG 2: XỬ LÝ PHẢN HỒI RSVP TỪ KHÁCH MỜI (action: "rsvp")
    var data = sheet.getDataRange().getValues();
    var targetRow = -1;

    // Hàm chuẩn hóa tên để so sánh (loại bỏ các tiền tố danh xưng Mr., Ms., Anh, Chị)
    function cleanName(str) {
      return (str || "")
        .toString()
        .toLowerCase()
        .replace(/^(mr\.?|ms\.?|anh|chị|em|bạn)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    var normalizedGuest = cleanName(guestName);

    // Tìm dòng tương ứng với tên khách trong Cột B (index 1)
    for (var i = 1; i < data.length; i++) {
      var rowName = cleanName(data[i][1]);
      if (rowName && normalizedGuest && (rowName === normalizedGuest || normalizedGuest.indexOf(rowName) !== -1 || rowName.indexOf(normalizedGuest) !== -1)) {
        targetRow = i + 1; // 1-based index trong Google Sheet
        break;
      }
    }

    var statusText = attendance === "Yes" ? "Có tham gia (Yes)" : "Không thể tham gia (No)";

    if (targetRow > 0) {
      // Cập nhật dòng đã có sẵn trong danh sách
      sheet.getRange(targetRow, 5).setValue(statusText); // Cột E: Status
      sheet.getRange(targetRow, 6).setValue(message);    // Cột F: Note / Lời chúc
      if (email) {
        sheet.getRange(targetRow, 7).setValue(email);   // Cột G: Email
      }
      sheet.getRange(targetRow, 9).setValue(timestamp); // Cột I: Thời gian phản hồi
    } else {
      // Nếu khách chưa có trong danh sách -> Thêm 1 dòng mới vào cuối
      var newNo = sheet.getLastRow();
      sheet.appendRow([
        newNo,
        guestName,
        EVENT_CONFIG.timeText,
        "",
        statusText,
        message,
        email,
        payload.sourceUrl || "",
        timestamp
      ]);
    }

    // TỰ ĐỘNG GỬI EMAIL XÁC NHẬN NẾU CÓ ĐỊA CHỈ EMAIL
    var emailSent = false;
    if (email && email.indexOf("@") !== -1 && email.indexOf(".") !== -1) {
      try {
        sendConfirmationEmail(email, guestName, attendance, message, payload.sourceUrl);
        emailSent = true;
      } catch (mailError) {
        console.warn("Lỗi gửi email xác nhận:", mailError);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã ghi nhận phản hồi RSVP thành công!",
      emailSent: emailSent
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

// ----------------------------------------------------------------------------
// 2. XỬ LÝ GET REQUEST: KIỂM TRA TRẠNG THÁI RSVP & TEST EMAIL
// ----------------------------------------------------------------------------
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  // 2.1 Kiểm tra trạng thái đã phản hồi: ?action=check&guest=...
  if (action === "check") {
    var guest = (e.parameter.guest || "").trim();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();

    function cleanName(str) {
      return (str || "").toString().toLowerCase().replace(/^(mr\.?|ms\.?|anh|chị|em|bạn)\s+/i, "").replace(/\s+/g, " ").trim();
    }

    var normalizedGuest = cleanName(guest);
    var hasRsvp = false;
    var recordedStatus = "";

    for (var i = 1; i < data.length; i++) {
      var rowName = cleanName(data[i][1]);
      if (rowName && normalizedGuest && (rowName === normalizedGuest || normalizedGuest.indexOf(rowName) !== -1)) {
        var statusVal = (data[i][4] || "").toString().trim(); // Cột E: Status
        if (statusVal !== "" && statusVal !== "Chờ phản hồi") {
          hasRsvp = true;
          recordedStatus = statusVal;
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      hasRsvp: hasRsvp,
      recordedStatus: recordedStatus
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2.2 Test gửi email nhanh từ trình duyệt: ?testEmail=dia_chi_mail_cua_ban@gmail.com
  if (e && e.parameter && e.parameter.testEmail) {
    try {
      sendConfirmationEmail(e.parameter.testEmail, "Khách Quý (Test)", "Yes", "Chúc mừng Phương tốt nghiệp rực rỡ!", EVENT_CONFIG.websiteUrl);
      return ContentService.createTextOutput("Đã gửi email thử nghiệm thành công đến: " + e.parameter.testEmail);
    } catch (testErr) {
      return ContentService.createTextOutput("Lỗi khi test gửi mail: " + testErr.toString());
    }
  }

  // Mặc định: Trả về trạng thái hoạt động của Web App
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script Web App đang hoạt động tốt cho Lễ tốt nghiệp Diễm Phương!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// 3. HÀM TỰ ĐỘNG GỬI EMAIL XÁC NHẬN VỚI GIAO DIỆN HTML SANG TRỌNG
// ----------------------------------------------------------------------------
function sendConfirmationEmail(recipientEmail, guestName, attendance, message, cardUrl) {
  var isAttending = attendance === "Yes";
  var subject = isAttending
    ? "[Xác nhận tham dự] Lễ tốt nghiệp Diễm Phương — The Quiet Strength 🎓"
    : "[Cảm ơn lời chúc] Lễ tốt nghiệp Diễm Phương — The Quiet Strength 🤍";

  var displayCardUrl = cardUrl || EVENT_CONFIG.websiteUrl;

  var htmlContent = "";

  if (isAttending) {
    // TEMPLATE EMAIL CHO KHÁCH XÁC NHẬN THAM GIA (YES)
    htmlContent = [
      '<div style="max-width: 580px; margin: 0 auto; background-color: #fbf9f5; font-family: \'Playfair Display\', \'Georgia\', \'Times New Roman\', serif; color: #2a2825; border: 1px solid #e7ded0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">',
        // Banner Header
        '<div style="background-color: #2a2825; color: #f5efe6; padding: 32px 24px; text-align: center;">',
          '<p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c8b79b;">Graduation Ceremony</p>',
          '<h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.04em;">THE QUIET STRENGTH</h1>',
          '<p style="margin: 8px 0 0 0; font-style: italic; font-size: 14px; color: #e0d5c1;">Nguyễn Thị Diễm Phương</p>',
        '</div>',

        // Body Content
        '<div style="padding: 32px 28px; line-height: 1.7; font-size: 15px;">',
          '<p style="font-size: 17px; margin-top: 0;">Kính gửi <strong>' + escapeHtml(guestName) + '</strong>,</p>',
          '<p>Phương xin gửi lời cảm ơn chân thành nhất đến bạn vì đã xác nhận sẽ đến tham dự buổi <strong>Lễ tốt nghiệp</strong> của Phương!</p>',
          '<p>Sự hiện diện của bạn là niềm vinh dự, niềm vui và là cột mốc đáng nhớ nhất đối với Phương trong hành trình đánh dấu sự trưởng thành này. ✨</p>',

          // Event Info Box
          '<div style="background-color: #ffffff; border-left: 3px solid #8b3a2b; padding: 18px 22px; margin: 24px 0; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">',
            '<h3 style="margin: 0 0 12px 0; font-size: 16px; color: #8b3a2b; letter-spacing: 0.03em;">THÔNG TIN BUỔI LỄ:</h3>',
            '<p style="margin: 6px 0;">📅 <strong>Thời gian:</strong> ' + EVENT_CONFIG.dateText + '</p>',
            '<p style="margin: 6px 0;">⏰ <strong>Khung giờ:</strong> ' + EVENT_CONFIG.timeText + '</p>',
            '<p style="margin: 6px 0;">📍 <strong>Địa điểm:</strong> ' + EVENT_CONFIG.venueName + '</p>',
            '<p style="margin: 4px 0 0 24px; font-size: 13px; color: #5a5650;">' + EVENT_CONFIG.venueAddress + '</p>',
          '</div>',

          (message ? '<div style="margin: 18px 0; padding: 12px 18px; background-color: #f3ede2; border-radius: 6px; font-style: italic; font-size: 14px;"><strong>Lời nhắn của bạn:</strong> "' + escapeHtml(message) + '"</div>' : ''),

          // Call to action buttons
          '<div style="text-align: center; margin: 30px 0 16px 0;">',
            '<a href="' + EVENT_CONFIG.mapsUrl + '" target="_blank" style="display: inline-block; background-color: #8b3a2b; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 4px; font-size: 14px; font-weight: 500; margin-right: 8px; letter-spacing: 0.03em;">📍 Xem chỉ đường Google Maps</a>',
            '<a href="' + displayCardUrl + '" target="_blank" style="display: inline-block; background-color: #e5dbc9; color: #2a2825; text-decoration: none; padding: 11px 22px; border-radius: 4px; font-size: 14px; font-weight: 500; letter-spacing: 0.03em;">💌 Xem lại thiệp mời</a>',
          '</div>',

          '<p style="text-align: center; font-size: 13px; color: #767067; margin-top: 14px;">(Nếu có bất kỳ thay đổi nào về lịch trình, bạn hoàn toàn có thể mở lại thiệp mời và bấm <em>Change response</em> để cập nhật nhé!)</p>',
        '</div>',

        // Footer
        '<div style="background-color: #f3ede2; padding: 20px 28px; text-align: center; font-size: 13px; color: #6b645b; border-top: 1px solid #e7ded0;">',
          '<p style="margin: 0 0 4px 0;">Rất mong được gặp và chụp ảnh lưu niệm cùng bạn tại buổi lễ! 🎓</p>',
          '<p style="margin: 4px 0; font-weight: bold; color: #2a2825;">Nguyễn Thị Diễm Phương</p>',
          '<p style="margin: 2px 0 0 0; font-size: 12px;">Hotline / Zalo: ' + EVENT_CONFIG.contactPhone + '</p>',
        '</div>',
      '</div>'
    ].join("");

  } else {
    // TEMPLATE EMAIL CHO KHÁCH BÁO BẬN (NO)
    htmlContent = [
      '<div style="max-width: 580px; margin: 0 auto; background-color: #fbf9f5; font-family: \'Playfair Display\', \'Georgia\', \'Times New Roman\', serif; color: #2a2825; border: 1px solid #e7ded0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">',
        // Header
        '<div style="background-color: #2a2825; color: #f5efe6; padding: 28px 24px; text-align: center;">',
          '<p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c8b79b;">Graduation Ceremony</p>',
          '<h1 style="margin: 0; font-size: 22px; font-weight: 600;">THE QUIET STRENGTH</h1>',
          '<p style="margin: 6px 0 0 0; font-style: italic; font-size: 14px; color: #e0d5c1;">Nguyễn Thị Diễm Phương</p>',
        '</div>',

        // Body
        '<div style="padding: 32px 28px; line-height: 1.7; font-size: 15px;">',
          '<p style="font-size: 17px; margin-top: 0;">Kính gửi <strong>' + escapeHtml(guestName) + '</strong>,</p>',
          '<p>Phương đã nhận được lời nhắn của bạn gửi đến buổi Lễ tốt nghiệp.</p>',
          '<p>Dù rất tiếc vì bạn không thể sắp xếp tham gia cùng Phương trong ngày này, nhưng Phương vô cùng trân quý tình cảm và sự quan tâm của bạn dành cho Phương.</p>',

          (message ? '<div style="margin: 22px 0; padding: 16px 20px; background-color: #f3ede2; border-left: 3px solid #8b3a2b; border-radius: 4px; font-style: italic; font-size: 14px;"><strong>Lời chúc của bạn:</strong><br>"' + escapeHtml(message) + '"</div>' : ''),

          '<p>Phương xin chúc bạn luôn thật nhiều sức khỏe, niềm vui và gặt hái được nhiều thành công rực rỡ trong cuộc sống. Hy vọng sẽ sớm được gặp lại bạn trong một dịp thật gần! 🤍</p>',

          '<div style="text-align: center; margin: 24px 0 8px 0;">',
            '<a href="' + displayCardUrl + '" target="_blank" style="display: inline-block; background-color: #e5dbc9; color: #2a2825; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: 500;">💌 Mở lại thiệp mời</a>',
          '</div>',
        '</div>',

        // Footer
        '<div style="background-color: #f3ede2; padding: 18px 28px; text-align: center; font-size: 13px; color: #6b645b; border-top: 1px solid #e7ded0;">',
          '<p style="margin: 0 0 4px 0; font-weight: bold; color: #2a2825;">Nguyễn Thị Diễm Phương</p>',
          '<p style="margin: 2px 0 0 0; font-size: 12px;">Contact: ' + EVENT_CONFIG.contactPhone + '</p>',
        '</div>',
      '</div>'
    ].join("");
  }

  // Gửi email qua GmailApp
  GmailApp.sendEmail(recipientEmail, subject, "", {
    name: EVENT_CONFIG.hostName + " — Graduation",
    htmlBody: htmlContent
  });
}

function escapeHtml(text) {
  if (!text) return "";
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
