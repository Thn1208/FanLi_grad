/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: TỰ ĐỘNG ĐỒNG BỘ GOOGLE SHEET & GỬI EMAIL XÁC NHẬN RSVP
 * Lễ Tốt Nghiệp: The Quiet Strength — Nguyễn Thị Diễm Phương
 * ============================================================================
 *
 * CẤU TRÚC BẢNG TÍNH GOOGLE SHEET KHUYÊN DÙNG (Hàng 1):
 * Cột A (1): No.                         (Số thứ tự: 1, 2, 3...)
 * Cột B (2): Name                        (Tên khách mời: Minh Tuấn, Thùy Linh,...)
 * Cột C (3): Time                        (Khung giờ mời: 08:00 AM – 11:30 AM)
 * Cột D (4): Nam/nữ                      (Giới tính: Nam / Nữ để thiệp xưng hô Mr./Ms.)
 * Cột E (5): Status                      (Trạng thái: Có tham gia / Không tham gia)
 * Cột F (6): Note                        (Ghi chú nội bộ riêng của Phương - KHÔNG BỊ GHI ĐÈ)
 * Cột G (7): Email                       (Email của khách để tự động gửi thư xác nhận)
 * Cột H (8): Message                     (Nội dung phản hồi: Lời nhắn khi Yes hoặc Lời chúc khi No)
 * Cột I (9): Thời gian phản hồi          (Ngày giờ khách bấm gửi RSVP)
 *
 * (LƯU Ý: Nếu bạn muốn tách riêng 2 cột: Cột H là "Message (Khi Yes)" và Cột I là "Wish (Khi No)"
 *  thì script vẫn TỰ ĐỘNG NHẬN DIỆN thông minh theo tên tiêu đề cột mà không lo bị lỗi!)
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
  websiteUrl: "https://franynguyen.id.vn/"
};

// ----------------------------------------------------------------------------
// 1. TỰ ĐỘNG TÌM VỊ TRÍ CỘT THEO TÊN TIÊU ĐỀ (DYNAMIC COLUMN MAPPING)
// ----------------------------------------------------------------------------
function getSheetColumnIndexes(headers) {
  var cols = {
    no: -1,
    name: -1,
    time: -1,
    gender: -1,
    status: -1,
    note: -1,
    email: -1,
    message: -1,
    wish: -1,
    link: -1,
    timestamp: -1
  };

  for (var i = 0; i < headers.length; i++) {
    var h = (headers[i] || "").toString().toLowerCase().trim();
    if (!h) continue;

    if (h === "no" || h === "no." || h === "stt") {
      cols.no = i;
    } else if (h === "name" || h === "tên" || h === "họ và tên" || h === "khách mời") {
      cols.name = i;
    } else if (h === "nam/nữ" || h === "nam/nu" || h === "giới tính" || h === "gender" || h === "phái") {
      cols.gender = i;
    } else if (h === "status" || h === "trạng thái" || h === "xác nhận" || h === "rsvp") {
      cols.status = i;
    } else if (h === "email" || h === "e-mail" || h === "mail") {
      cols.email = i;
    } else if (h.indexOf("wish") !== -1 || h.indexOf("lời chúc") !== -1) {
      cols.wish = i;
    } else if (h.indexOf("message") !== -1 || h.indexOf("lời nhắn") !== -1 || h.indexOf("phản hồi") !== -1) {
      cols.message = i;
    } else if (h === "note" || h === "ghi chú" || h === "notes") {
      cols.note = i;
    } else if (h.indexOf("thời gian") !== -1 || h.indexOf("timestamp") !== -1 || h.indexOf("ngày gửi") !== -1) {
      cols.timestamp = i;
    } else if (h.indexOf("link") !== -1 || h.indexOf("url") !== -1 || h.indexOf("thiệp") !== -1) {
      cols.link = i;
    } else if (h === "time" || h === "giờ" || h === "khung giờ") {
      cols.time = i;
    }
  }

  // Dự phòng mặc định nếu không khớp tiêu đề
  if (cols.no === -1) cols.no = 0;       // Cột A
  if (cols.name === -1) cols.name = 1;   // Cột B
  if (cols.time === -1) cols.time = 2;   // Cột C
  if (cols.gender === -1) cols.gender = 3; // Cột D
  if (cols.status === -1) cols.status = 4; // Cột E
  if (cols.note === -1 && headers.length > 5) cols.note = 5; // Cột F

  return cols;
}

// ----------------------------------------------------------------------------
// 2. HÀM TEST GỬI EMAIL NHANH TRỰC TIẾP TRONG APPS SCRIPT
// ----------------------------------------------------------------------------
function testSendMail() {
  var myEmail = Session.getActiveUser().getEmail();
  Logger.log("Đang gửi email test xác nhận đến: " + myEmail);
  
  // Gửi email mẫu xác nhận cho khách
  sendConfirmationEmail(
    myEmail,
    "Diễm Phương (Chủ Tiệc)",
    "Yes",
    "Đây là lời nhắn kiểm tra quyền gửi thư tự động từ hệ thống thiệp mời!",
    EVENT_CONFIG.websiteUrl
  );

  // Gửi email mẫu thông báo cho chủ tiệc
  sendHostNotificationEmail(
    "Diễm Phương (Khách Mẫu)",
    "Yes",
    myEmail,
    "Hẹn gặp Phương tại Lễ tốt nghiệp! Rất hào hứng chờ đợi buổi lễ.",
    new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  Logger.log("Đã gửi cả 2 email test thành công đến: " + myEmail);
}

// ----------------------------------------------------------------------------
// 3. XỬ LÝ GET REQUEST: LẤY THÔNG TIN KHÁCH TỪ GOOGLE SHEET VỀ THIỆP MỜI
// ----------------------------------------------------------------------------
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "getGuest";

  if (action === "getGuest" || action === "check") {
    var guestParam = (e.parameter.name || e.parameter.guest || e.parameter.to || "").trim();
    var noParam = (e.parameter.no || e.parameter.id || "").trim();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        found: false,
        hasRsvp: false
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var cols = getSheetColumnIndexes(headers);

    function cleanName(str) {
      return (str || "")
        .toString()
        .toLowerCase()
        .replace(/^(mr\.?|ms\.?|miss\.?|mrs\.?|anh|chị|em|bạn)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    var cleanQuery = cleanName(guestParam);
    var foundGuest = null;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowNo = (cols.no !== -1 && row[cols.no] !== undefined) ? row[cols.no].toString().trim() : "";
      var rowName = (cols.name !== -1 && row[cols.name] !== undefined) ? row[cols.name].toString().trim() : "";
      var cleanRowName = cleanName(rowName);

      var isMatch = false;
      if (noParam && rowNo === noParam) {
        isMatch = true;
      } else if (cleanQuery && cleanRowName && (cleanRowName === cleanQuery || cleanQuery.indexOf(cleanRowName) !== -1 || cleanRowName.indexOf(cleanQuery) !== -1)) {
        isMatch = true;
      }

      if (isMatch) {
        var statusRaw = cols.status !== -1 ? (row[cols.status] || "").toString().trim() : "";
        var normalizedStatus = "";
        if (/yes|có/i.test(statusRaw)) {
          normalizedStatus = "Yes";
        } else if (/no|không/i.test(statusRaw)) {
          normalizedStatus = "No";
        }

        // Lấy nội dung phản hồi (ưu tiên cột Message hoặc Wish)
        var msg = "";
        if (cols.message !== -1 && row[cols.message]) {
          msg = row[cols.message].toString().trim();
        } else if (cols.wish !== -1 && row[cols.wish]) {
          msg = row[cols.wish].toString().trim();
        } else if (cols.note !== -1 && cols.message === -1 && row[cols.note]) {
          // Chỉ fallback vào Note nếu sheet chưa có cột Message
          msg = row[cols.note].toString().trim();
        }

        var wishVal = (cols.wish !== -1 && row[cols.wish]) ? row[cols.wish].toString().trim() : msg;

        foundGuest = {
          no: rowNo,
          name: rowName,
          time: cols.time !== -1 ? (row[cols.time] || "").toString().trim() : "",
          gender: cols.gender !== -1 ? (row[cols.gender] || "").toString().trim() : "",
          status: normalizedStatus, // "Yes", "No", hoặc rỗng
          rawStatus: statusRaw,
          email: cols.email !== -1 ? (row[cols.email] || "").toString().trim() : "",
          message: msg,
          wish: wishVal,
          internalNote: cols.note !== -1 ? (row[cols.note] || "").toString().trim() : ""
        };
        break;
      }
    }

    if (foundGuest) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        found: true,
        hasRsvp: (foundGuest.status === "Yes" || foundGuest.status === "No"),
        guest: foundGuest
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        found: false,
        hasRsvp: false
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Test gửi email nhanh từ trình duyệt: ?testEmail=dia_chi_mail@gmail.com
  if (e && e.parameter && e.parameter.testEmail) {
    try {
      sendConfirmationEmail(e.parameter.testEmail, "Khách Quý (Test)", "Yes", "Chúc mừng Phương tốt nghiệp rực rỡ!", EVENT_CONFIG.websiteUrl);
      return ContentService.createTextOutput("Đã gửi email thử nghiệm thành công đến: " + e.parameter.testEmail);
    } catch (testErr) {
      return ContentService.createTextOutput("Lỗi khi test gửi mail: " + testErr.toString());
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script Web App đang hoạt động tốt cho Lễ tốt nghiệp Diễm Phương!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// 4. XỬ LÝ POST REQUEST: LƯU PHẢN HỒI VÀO SHEET & TỰ ĐỘNG GỬI MAIL
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

    // HÀNH ĐỘNG 1: THÊM KHÁCH MỚI TỪ FORM TẠO LINK (NẾU CÓ)
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

    // HÀNH ĐỘNG 2: XỬ LÝ PHẢN HỒI RSVP
    var data = sheet.getDataRange().getValues();
    var headers = data.length > 0 ? data[0] : [];
    var cols = getSheetColumnIndexes(headers);

    // Tự động bổ sung các cột còn thiếu trên Hàng 1 nếu chưa có
    var currentHeaderLen = headers.length;
    var needHeaderUpdate = false;

    if (cols.email === -1) {
      currentHeaderLen++;
      sheet.getRange(1, currentHeaderLen).setValue("Email");
      cols.email = currentHeaderLen - 1;
      needHeaderUpdate = true;
    }

    if (cols.message === -1 && cols.wish === -1) {
      currentHeaderLen++;
      sheet.getRange(1, currentHeaderLen).setValue("Message (Lời nhắn/Lời chúc)");
      cols.message = currentHeaderLen - 1;
      needHeaderUpdate = true;
    }

    if (cols.timestamp === -1) {
      currentHeaderLen++;
      sheet.getRange(1, currentHeaderLen).setValue("Thời gian phản hồi");
      cols.timestamp = currentHeaderLen - 1;
      needHeaderUpdate = true;
    }

    // Tìm dòng tương ứng với tên khách trong cột Name
    var targetRow = -1;

    function cleanName(str) {
      return (str || "")
        .toString()
        .toLowerCase()
        .replace(/^(mr\.?|ms\.?|miss\.?|mrs\.?|anh|chị|em|bạn)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    var normalizedGuest = cleanName(guestName);

    for (var i = 1; i < data.length; i++) {
      var rowName = cleanName(data[i][cols.name]);
      if (rowName && normalizedGuest && (rowName === normalizedGuest || normalizedGuest.indexOf(rowName) !== -1 || rowName.indexOf(normalizedGuest) !== -1)) {
        targetRow = i + 1; // 1-based index trong Google Sheet
        break;
      }
    }

    var statusText = attendance === "Yes" ? "Có tham gia (Yes)" : "Không thể tham gia (No)";

    if (targetRow > 0) {
      // 1. Cập nhật Trạng thái (Status)
      if (cols.status !== -1) {
        sheet.getRange(targetRow, cols.status + 1).setValue(statusText);
      }

      // 2. Cập nhật Email (khi có nhập)
      if (cols.email !== -1 && email) {
        sheet.getRange(targetRow, cols.email + 1).setValue(email);
      }

      // 3. Cập nhật Lời nhắn / Lời chúc (Message / Wish)
      // KHÔNG BAO GIỜ ghi đè lên Cột Note riêng của Phương nếu đã có cột Message/Wish
      if (attendance === "Yes") {
        if (cols.message !== -1) {
          sheet.getRange(targetRow, cols.message + 1).setValue(message);
        } else if (cols.note !== -1) {
          sheet.getRange(targetRow, cols.note + 1).setValue(message);
        }
      } else {
        // Khi No: nếu có cột Wish riêng thì ghi vào Wish, nếu không thì ghi vào Message
        if (cols.wish !== -1) {
          sheet.getRange(targetRow, cols.wish + 1).setValue(message);
        } else if (cols.message !== -1) {
          sheet.getRange(targetRow, cols.message + 1).setValue(message);
        } else if (cols.note !== -1) {
          sheet.getRange(targetRow, cols.note + 1).setValue(message);
        }
      }

      // 4. Cập nhật Thời gian phản hồi
      if (cols.timestamp !== -1) {
        sheet.getRange(targetRow, cols.timestamp + 1).setValue(timestamp);
      }

    } else {
      // Nếu khách chưa có trong danh sách -> Thêm 1 dòng mới vào cuối
      var newNo = sheet.getLastRow();
      var newRow = [];
      var maxCols = Math.max(headers.length, 9);
      for (var c = 0; c < maxCols; c++) newRow.push("");

      if (cols.no !== -1) newRow[cols.no] = newNo;
      if (cols.name !== -1) newRow[cols.name] = guestName;
      if (cols.time !== -1) newRow[cols.time] = EVENT_CONFIG.timeText;
      if (cols.status !== -1) newRow[cols.status] = statusText;
      if (cols.email !== -1) newRow[cols.email] = email;
      if (cols.message !== -1) newRow[cols.message] = message;
      else if (cols.wish !== -1 && attendance === "No") newRow[cols.wish] = message;
      if (cols.timestamp !== -1) newRow[cols.timestamp] = timestamp;

      sheet.appendRow(newRow);
    }

    // 1. TỰ ĐỘNG GỬI EMAIL XÁC NHẬN CHO KHÁCH (NẾU CÓ EMAIL HỢP LỆ VÀ CHỌN YES)
    var emailSentToGuest = false;
    if (email && email.indexOf("@") !== -1 && email.indexOf(".") !== -1) {
      try {
        sendConfirmationEmail(email, guestName, attendance, message, payload.sourceUrl);
        emailSentToGuest = true;
      } catch (mailError) {
        console.warn("Lỗi gửi email xác nhận cho khách:", mailError);
      }
    }

    // 2. TỰ ĐỘNG GỬI EMAIL THÔNG BÁO VỀ GMAIL CỦA CHỦ TIỆC (DIỄM PHƯƠNG)
    // Để bạn nhận được thông báo ngay trên điện thoại khi có khách RSVP!
    try {
      sendHostNotificationEmail(guestName, attendance, email, message, timestamp);
    } catch (hostMailErr) {
      console.warn("Lỗi gửi thông báo cho chủ tiệc:", hostMailErr);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã ghi nhận phản hồi RSVP thành công!",
      emailSent: emailSentToGuest
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
// 5. HÀM GỬI EMAIL XÁC NHẬN CHO KHÁCH MỜI
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

// ----------------------------------------------------------------------------
// 6. HÀM GỬI THÔNG BÁO TỨC THÌ ĐẾN GMAIL CỦA CHỦ TIỆC (DIỄM PHƯƠNG)
// ----------------------------------------------------------------------------
function sendHostNotificationEmail(guestName, attendance, guestEmail, message, timestamp) {
  var hostEmail = Session.getActiveUser().getEmail();
  if (!hostEmail) return;

  var isYes = attendance === "Yes";
  var subject = isYes
    ? "🎉 [RSVP MỚI: CÓ THAM GIA] Khách " + guestName + " vừa phản hồi!"
    : "🤍 [RSVP MỚI: BÁO BẬN] Khách " + guestName + " đã gửi lời chúc!";

  var statusBadge = isYes
    ? '<span style="display: inline-block; background-color: #2e7d32; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">CÓ THAM GIA (YES)</span>'
    : '<span style="display: inline-block; background-color: #c62828; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">KHÔNG THAM GIA (NO)</span>';

  var bodyHtml = [
    '<div style="max-width: 520px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #ffffff;">',
      '<h2 style="margin-top: 0; color: #2a2825; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 12px;">🔔 Thông báo phản hồi thiệp mời tốt nghiệp</h2>',
      '<p style="margin: 12px 0;">Phương ơi, vừa có khách phản hồi trên thiệp mời của bạn:</p>',
      '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">',
        '<tr><td style="padding: 8px 0; color: #666; width: 130px;"><strong>Tên khách:</strong></td><td style="padding: 8px 0; font-size: 16px; font-weight: bold; color: #111;">' + escapeHtml(guestName) + '</td></tr>',
        '<tr><td style="padding: 8px 0; color: #666;"><strong>Trạng thái:</strong></td><td style="padding: 8px 0;">' + statusBadge + '</td></tr>',
        (guestEmail ? '<tr><td style="padding: 8px 0; color: #666;"><strong>Email của khách:</strong></td><td style="padding: 8px 0; color: #1565c0;">' + escapeHtml(guestEmail) + '</td></tr>' : ''),
        (message ? '<tr><td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>' + (isYes ? 'Lời nhắn:' : 'Lời chúc:') + '</strong></td><td style="padding: 8px 0; background-color: #f9f9f9; padding: 10px; border-radius: 4px; font-style: italic;">"' + escapeHtml(message) + '"</td></tr>' : ''),
        '<tr><td style="padding: 8px 0; color: #666;"><strong>Thời gian gửi:</strong></td><td style="padding: 8px 0; color: #888;">' + timestamp + '</td></tr>',
      '</table>',
      '<div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #eee; text-align: center;">',
        '<a href="https://docs.google.com/spreadsheets/d/' + SpreadsheetApp.getActiveSpreadsheet().getId() + '/edit" target="_blank" style="display: inline-block; background-color: #2a2825; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; font-weight: bold;">📊 Mở Google Sheet để xem toàn bộ danh sách</a>',
      '</div>',
    '</div>'
  ].join("");

  GmailApp.sendEmail(hostEmail, subject, "", {
    name: "Thông báo Thiệp Mời Tốt Nghiệp",
    htmlBody: bodyHtml
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
