/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: SYNC GOOGLE SHEETS & SEND RSVP CONFIRMATION EMAILS
 * Graduation Ceremony: The Quiet Strength — Nguyen Thi Diem Phuong
 * ============================================================================
 *
 * GOOGLE SHEET COLUMNS (Row 1):
 * Col A (1): No.                         (Guest ID / Sequence: 1, 2, 3...)
 * Col B (2): Name                        (Guest Name: Tran Nguyen Phuoc, Nguyen Thanh Phat,...)
 * Col C (3): Time                        (Ceremony Time from Sheet: 10AM, 08:00 AM – 11:30 AM,...)
 * Col D (4): Nam/nữ                      (Gender / Salutation: Mr. / Ms. / Nam / Nữ)
 * Col E (5): Status                      (Dropdown: Yes, No, Gửi thư, Email (remind), Email (Thank you))
 * Col F (6): Note                        (Internal note - Protected, never overwritten)
 * Col G (7): Email                       (Guest Email address)
 * Col H (8): Message                     (Guest Message / Wish slot 1)
 * Col I (9): Thời gian phản hồi          (Timestamp slot 1)
 * Col J (10): link                       (Personalized invitation link)
 *
 * * TỰ ĐỘNG MỞ RỘNG CỘT LỊCH SỬ PHẢN HỒI (NẾU KHÁCH GỬI THÊM / ĐỔI LỜI NHẮN MỚI):
 * Col K: Message 2 | Col L: Thời gian phản hồi 2
 * Col M: Message 3 | Col N: Thời gian phản hồi 3 ...
 * ============================================================================
 */

// Event Configuration
var EVENT_CONFIG = {
  hostName: "Nguyen Thi Diem Phuong",
  eventName: "Phuong's Graduation Ceremony — The Quiet Strength",
  dateText: "Sunday, November 8th, 2026",
  timeText: "10AM",
  venueName: "FPT University HCMC",
  venueAddress: "D1 High-Tech Park, Long Thanh My, Thu Duc City, HCMC",
  mapsUrl: "https://maps.app.goo.gl/F1LVCkgJ4KDwRs2bA",
  contactPhone: "0367 989 880 (Mr. Đạt)",
  websiteUrl: "https://franynguyen.id.vn/",
  bannerMailUrl: "https://franynguyen.id.vn/banner_mail.gif", // Đổi thành .gif nếu bạn xuất dạng động
  bgMailUrl: "https://franynguyen.id.vn/bg_mail.jpg"
};

// ----------------------------------------------------------------------------
// 1. DYNAMIC COLUMN MAPPING (Hỗ trợ nhiều slot Message & Thời gian phản hồi)
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
    link: -1,
    msgSlots: {},   // { 1: colIndex, 2: colIndex, ... }
    timeSlots: {}   // { 1: colIndex, 2: colIndex, ... }
  };

  for (var i = 0; i < headers.length; i++) {
    var rawH = (headers[i] || "").toString().trim();
    var h = rawH.toLowerCase();
    if (!h) continue;

    if (h === "no" || h === "no." || h === "stt" || h === "id") {
      cols.no = i;
    } else if (h === "name" || h === "tên" || h === "họ và tên" || h === "khách mời") {
      cols.name = i;
    } else if (h === "nam/nữ" || h === "nam/nu" || h === "giới tính" || h === "gender" || h === "phái") {
      cols.gender = i;
    } else if (h === "status" || h === "trạng thái" || h === "xác nhận" || h === "rsvp") {
      cols.status = i;
    } else if (h === "note" || h === "ghi chú" || h === "notes") {
      cols.note = i;
    } else if (h === "email" || h === "e-mail" || h === "mail") {
      cols.email = i;
    } else if (h === "link" || h === "url" || h === "thiệp") {
      cols.link = i;
    } else if (h === "time" || h === "giờ" || h === "khung giờ") {
      cols.time = i;
    } else {
      // Nhận diện các cột Message / Lời nhắn / Lời chúc (Message, Message 2, Message 3,...)
      var mMatch = h.match(/^message\s*(\d+)?$/i) || h.match(/^(?:lời nhắn|lời chúc|phản hồi)\s*(\d+)?$/i);
      // Nhận diện các cột Thời gian phản hồi (Thời gian phản hồi, Thời gian phản hồi 2,...)
      var tMatch = h.match(/^(?:thời gian phản hồi|thời gian|timestamp)\s*(\d+)?$/i);

      if (tMatch) {
        var numT = tMatch[1] ? parseInt(tMatch[1], 10) : 1;
        cols.timeSlots[numT] = i;
      } else if (mMatch) {
        var numM = mMatch[1] ? parseInt(mMatch[1], 10) : 1;
        cols.msgSlots[numM] = i;
      }
    }
  }

  // Fallbacks mặc định nếu bảng chưa có header chuẩn
  if (cols.no === -1) cols.no = 0;       // Col A
  if (cols.name === -1) cols.name = 1;   // Col B
  if (cols.time === -1) cols.time = 2;   // Col C
  if (cols.gender === -1) cols.gender = 3; // Col D
  if (cols.status === -1) cols.status = 4; // Col E
  if (cols.note === -1 && headers.length > 5) cols.note = 5; // Col F
  if (cols.email === -1 && headers.length > 6) cols.email = 6; // Col G
  if (cols.msgSlots[1] === undefined && headers.length > 7) cols.msgSlots[1] = 7; // Col H
  if (cols.timeSlots[1] === undefined && headers.length > 8) cols.timeSlots[1] = 8; // Col I
  if (cols.link === -1 && headers.length > 9) cols.link = 9; // Col J

  return cols;
}

// ----------------------------------------------------------------------------
// 2. QUICK EMAIL TEST FUNCTION (Run in Apps Script Editor to Grant Permissions)
// ----------------------------------------------------------------------------
function testSendMail() {
  var myEmail = Session.getActiveUser().getEmail();
  Logger.log("Sending English test confirmation email to: " + myEmail);
  
  sendConfirmationEmail(
    myEmail,
    "Ms. Diem Phuong",
    "Yes",
    "Looking forward to the graduation ceremony. Congratulations!",
    "10:00 AM",
    EVENT_CONFIG.websiteUrl
  );

  Logger.log("Successfully sent test email without icons to: " + myEmail);
}

// ----------------------------------------------------------------------------
// 3. GET REQUEST: FETCH GUEST DATA & LATEST RSVP STATUS FROM GOOGLE SHEET
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
        if (/^yes|có/i.test(statusRaw)) {
          normalizedStatus = "Yes";
        } else if (/^no|không/i.test(statusRaw)) {
          normalizedStatus = "No";
        }

        // Tìm lời nhắn mới nhất (quét từ Message, Message 2, Message 3... lấy slot cao nhất có chữ)
        var latestMsg = "";
        var latestTimestamp = "";
        var s = 1;
        while (cols.msgSlots[s] !== undefined || s <= 10) {
          var mCol = cols.msgSlots[s];
          if (mCol !== undefined && mCol < row.length && row[mCol] !== undefined) {
            var val = row[mCol].toString().trim();
            if (val) {
              latestMsg = val;
              var tCol = cols.timeSlots[s];
              if (tCol !== undefined && tCol < row.length && row[tCol] !== undefined) {
                latestTimestamp = row[tCol].toString().trim();
              }
            }
          }
          s++;
        }

        foundGuest = {
          no: rowNo,
          name: rowName,
          time: cols.time !== -1 ? (row[cols.time] || "").toString().trim() : "",
          gender: cols.gender !== -1 ? (row[cols.gender] || "").toString().trim() : "",
          status: normalizedStatus, // "Yes", "No", hoặc rỗng
          rawStatus: statusRaw,
          email: cols.email !== -1 ? (row[cols.email] || "").toString().trim() : "",
          message: latestMsg,
          wish: latestMsg,
          timestamp: latestTimestamp,
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

  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script Web App is running for Phuong's Graduation Ceremony!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// 4. POST REQUEST: GHI NHẬN RSVP, TỰ ĐỘNG TẠO MESSAGE 2/3 NẾU CÓ THAY ĐỔI
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

    var payloadNo = (payload.no || payload.id || "").toString().trim();
    var guestName = (payload.guestName || "Name").trim();
    var attendance = payload.attendance || "Yes";
    var email = (payload.email || "").trim();
    var message = (payload.message || "").trim();
    var timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });

    var data = sheet.getDataRange().getValues();
    var headers = data.length > 0 ? data[0] : [];
    var cols = getSheetColumnIndexes(headers);

    function cleanName(str) {
      return (str || "")
        .toString()
        .toLowerCase()
        .replace(/^(mr\.?|ms\.?|miss\.?|mrs\.?|anh|chị|em|bạn)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    var normalizedGuest = cleanName(guestName);
    var targetRow = -1;

    // Tìm dòng tương ứng theo Số thứ tự (No.) trước, rồi đến Tên
    for (var i = 1; i < data.length; i++) {
      var rowNo = (cols.no !== -1 && data[i][cols.no] !== undefined) ? data[i][cols.no].toString().trim() : "";
      var rowName = (cols.name !== -1 && data[i][cols.name] !== undefined) ? cleanName(data[i][cols.name]) : "";

      var isMatch = false;
      if (payloadNo && rowNo === payloadNo) {
        isMatch = true;
      } else if (normalizedGuest && rowName && (rowName === normalizedGuest || normalizedGuest.indexOf(rowName) !== -1 || rowName.indexOf(normalizedGuest) !== -1)) {
        isMatch = true;
      }

      if (isMatch) {
        targetRow = i + 1; // 1-based index trong Sheet
        break;
      }
    }

    var statusText = attendance === "Yes" ? "Yes" : "No";
    var guestCeremonyTime = EVENT_CONFIG.timeText;
    var guestDisplayFullName = guestName;

    if (targetRow > 0) {
      // 1. Lấy thông tin từ dòng trên Sheet
      if (cols.time !== -1 && data[targetRow - 1][cols.time]) {
        guestCeremonyTime = data[targetRow - 1][cols.time].toString().trim();
      }

      if (cols.name !== -1 && data[targetRow - 1][cols.name]) {
        var baseName = data[targetRow - 1][cols.name].toString().trim();
        var rawGender = (cols.gender !== -1 && data[targetRow - 1][cols.gender] !== undefined)
          ? data[targetRow - 1][cols.gender].toString().trim()
          : "";
        var pref = "";

        if (rawGender) {
          var gLower = rawGender.toLowerCase();
          if (gLower === "nam" || gLower === "mr" || gLower === "mr.") {
            pref = "Mr. ";
          } else if (gLower === "nữ" || gLower === "nu" || gLower === "ms" || gLower === "ms." || gLower === "miss" || gLower === "mrs") {
            pref = "Ms. ";
          } else {
            // Đảm bảo chèn bất kỳ danh xưng/thông tin nào khác từ cột Nam/Nữ (Anh, Chị, Bạn, Thầy, Cô, Bác, Em...)
            pref = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).trim() + " ";
          }
        }

        // Chèn danh xưng vào trước tên (tránh lặp từ nếu tên đã có sẵn từ đó)
        if (pref) {
          var cleanPref = pref.trim().toLowerCase();
          if (baseName.toLowerCase().indexOf(cleanPref) !== 0) {
            guestDisplayFullName = pref + baseName;
          } else {
            guestDisplayFullName = baseName;
          }
        } else {
          guestDisplayFullName = baseName;
        }
      }

      // 2. Cập nhật Status ("Yes" hoặc "No" khớp Dropdown E)
      if (cols.status !== -1) {
        sheet.getRange(targetRow, cols.status + 1).setValue(statusText);
      }

      // 3. Cập nhật Email (khi có nhập)
      if (cols.email !== -1 && email) {
        sheet.getRange(targetRow, cols.email + 1).setValue(email);
      }

      // 4. Xử lý Lời nhắn (Message) và Thời gian phản hồi theo Slot (Message 1, Message 2, Message 3,...)
      if (message) {
        var slot = 1;
        var targetMsgCol = -1;
        var targetTimeCol = -1;

        while (true) {
          var mCol = cols.msgSlots[slot];
          if (mCol === undefined) {
            // Cần tạo thêm cột Message N và Thời gian phản hồi N
            var lastCol = sheet.getLastColumn();
            var mHeaderName = slot === 1 ? "Message" : "Message " + slot;
            var tHeaderName = slot === 1 ? "Thời gian phản hồi" : "Thời gian phản hồi " + slot;

            sheet.getRange(1, lastCol + 1).setValue(mHeaderName);
            sheet.getRange(1, lastCol + 2).setValue(tHeaderName);

            cols.msgSlots[slot] = lastCol;
            cols.timeSlots[slot] = lastCol + 1;

            targetMsgCol = cols.msgSlots[slot];
            targetTimeCol = cols.timeSlots[slot];
            break;
          }

          var existingVal = (mCol < data[targetRow - 1].length && data[targetRow - 1][mCol] !== undefined)
            ? data[targetRow - 1][mCol].toString().trim()
            : "";

          // Nếu ô này còn trống hoặc nội dung mới giống hệt nội dung cũ -> ghi đè vào slot này
          if (!existingVal || existingVal === message) {
            targetMsgCol = mCol;
            targetTimeCol = cols.timeSlots[slot];
            break;
          } else {
            // Khách gửi lời nhắn MỚI KHÁC VỚI LỜI NHẮN TRƯỚC -> chuyển sang slot tiếp theo (Message 2, Message 3,...)
            slot++;
          }
        }

        if (targetMsgCol !== -1) {
          sheet.getRange(targetRow, targetMsgCol + 1).setValue(message);
        }
        if (targetTimeCol !== -1 && targetTimeCol !== undefined) {
          sheet.getRange(targetRow, targetTimeCol + 1).setValue(timestamp);
        }
      } else {
        // Nếu không có message (chỉ chọn Yes/No), cập nhật thời gian phản hồi vào slot 1
        var tCol1 = cols.timeSlots[1];
        if (tCol1 !== undefined && tCol1 !== -1) {
          sheet.getRange(targetRow, tCol1 + 1).setValue(timestamp);
        }
      }

    } else {
      // Nếu khách chưa có dòng trong danh sách -> Tạo dòng mới
      var newNo = sheet.getLastRow();
      var newRow = [];
      var maxCols = Math.max(headers.length, 10);
      for (var c = 0; c < maxCols; c++) newRow.push("");

      if (cols.no !== -1) newRow[cols.no] = newNo;
      if (cols.name !== -1) newRow[cols.name] = guestName;
      if (cols.time !== -1) newRow[cols.time] = EVENT_CONFIG.timeText;
      if (cols.status !== -1) newRow[cols.status] = statusText;
      if (cols.email !== -1) newRow[cols.email] = email;
      if (cols.msgSlots[1] !== undefined) newRow[cols.msgSlots[1]] = message;
      if (cols.timeSlots[1] !== undefined) newRow[cols.timeSlots[1]] = timestamp;

      sheet.appendRow(newRow);
    }

    // 5. CHỈ GỬI EMAIL KHI ATTENDANCE LÀ "YES" VÀ CÓ EMAIL HỢP LỆ (NO THÌ KHÔNG GỬI EMAIL)
    var emailSentToGuest = false;
    if (attendance === "Yes" && email && email.indexOf("@") !== -1 && email.indexOf(".") !== -1) {
      try {
        sendConfirmationEmail(email, guestDisplayFullName, attendance, message, guestCeremonyTime, payload.sourceUrl);
        emailSentToGuest = true;
      } catch (mailError) {
        console.warn("Error sending confirmation email to guest:", mailError);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "RSVP recorded successfully in Google Sheet!",
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
// ----------------------------------------------------------------------------
// 5. GỬI EMAIL XÁC NHẬN BẰNG TIẾNG ANH (THEO ĐÚNG MẪU BANNER_MAIL & BG_MAIL)
// ----------------------------------------------------------------------------
function sendConfirmationEmail(recipientEmail, guestName, attendance, message, ceremonyTime, cardUrl) {
  // Chỉ gửi khi attendance là Yes
  if (attendance !== "Yes") return;

  var subject = "✨ Confirmation | Phuong's Graduation Ceremony🎓";
  var displayTime = ceremonyTime || EVENT_CONFIG.timeText;

  // Giữ nguyên chuẩn Mr. / Ms. và các danh xưng từ Google Sheet; chỉ loại bỏ dấu chấm/phẩy dư thừa nếu ở cuối cùng của tên (ví dụ: "Phước." -> "Phước")
  var cleanGuestName = (guestName || "").toString().trim().replace(/[\,\s]+$/, '');
  cleanGuestName = cleanGuestName.replace(/(?<!\b(Mr|Ms|Mrs|Dr|Prof))\.$/i, '');

  // Template email chuẩn responsive, căn đều lề 2 bên và triệt tiêu hoàn toàn thanh cuộn ngang (horizontal scrollbar):
  // - Bảng ngoài cùng width="100%" với table-layout: fixed để khoá chặt chiều rộng vừa vặn mọi màn hình
  // - Khung thiệp căn giữa tuyệt đối (align="center", margin: 0 auto) với lề 2 bên cân đối
  // - Banner có thuộc tính width="100%" giúp luôn vừa khít khung thư
  // - Cách dòng 1 (line-height: 1), cách đoạn 20px (margin-bottom: 20px)
  // - Lời chào kết thúc bằng dấu phẩy: Dear [Name],
  // - Đường kẻ mảnh ở đáy hoàn thiện bố cục thiệp
  var htmlContent = [
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%; margin: 0; padding: 0; background-color: #12100e; table-layout: fixed; font-family: \'Times New Roman\', Times, serif;">',
      '<tr>',
        '<td align="center" style="padding: 30px 12px; background-color: #12100e; background-image: url(\'' + EVENT_CONFIG.bgMailUrl + '\'); background-repeat: no-repeat; background-position: center top; background-size: cover; font-family: \'Times New Roman\', Times, serif;">',

          // Khung thiệp chính: căn giữa tuyệt đối, cân đều 2 bên lề, co giãn linh hoạt tối đa 440px
          '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="width: 100%; max-width: 440px; margin: 0 auto; background-color: #161413; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); overflow: hidden; font-family: \'Times New Roman\', Times, serif;">',
            '<tr>',
              '<td style="padding: 26px 26px 26px 26px; text-align: left; color: #ede8e1; font-family: \'Times New Roman\', Times, serif;">',

                // Header: Banner Mail vừa vặn chiều rộng dòng thư, không bị tràn ảnh
                '<div style="text-align: center; margin: 0 0 16px 0; line-height: 0;">',
                  '<img src="' + EVENT_CONFIG.bannerMailUrl + '" alt="THE QUIET STRENGTH — Graduation Ceremony" width="100%" style="display: block; width: 100%; max-width: 100%; height: auto; border: 0; margin: 0 auto;" />',
                '</div>',

                // Đường kẻ mỏng
                '<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.22); margin: 0 0 18px 0;" />',

                // Lời chào (Dear Mr. / Ms. [Name], dùng dấu phẩy ở cuối câu chào, in đậm in nghiêng)
                '<p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1; color: #f2eee8; font-family: \'Times New Roman\', Times, serif;">',
                  'Dear <strong><em>' + escapeHtml(cleanGuestName) + '</em></strong>,',
                '</p>',

                // Cảm ơn & thông báo chi tiết (cách dòng 1, cách đoạn 20px)
                '<p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1; color: #ede8e1; font-family: \'Times New Roman\', Times, serif;">',
                  'Thank you for responding to my graduation invitation!<br />',
                  'Here are the event details:',
                '</p>',

                // Chi tiết sự kiện (cách dòng 1, cách đoạn 20px)
                '<p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1; color: #ede8e1; font-family: \'Times New Roman\', Times, serif;">',
                  '<strong style="letter-spacing: 0.05em; color: #ffffff;">GRADUATION CEREMONY</strong><br />',
                  '- Date: ' + EVENT_CONFIG.dateText + '<br />',
                  '- Time: ' + escapeHtml(displayTime) + '<br />',
                  '- Venue: ' + EVENT_CONFIG.venueName + ' (<a href="' + EVENT_CONFIG.mapsUrl + '" target="_blank" style="color: #ffffff; text-decoration: underline;">Google maps</a>)<br />',
                  '- Contact: ' + EVENT_CONFIG.contactPhone,
                '</p>',

                // Lời chúc & cảm xúc (cách dòng 1, cách đoạn 20px)
                '<p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1; color: #ede8e1; font-family: \'Times New Roman\', Times, serif;">',
                  'I&#39;m truly grateful to have you be part of this special milestone.<br />',
                  'Looking forward to sharing this moment with you!',
                '</p>',

                // Ký tên (cách dòng 1, cách đoạn 20px)
                '<p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1; color: #ede8e1; font-family: \'Times New Roman\', Times, serif;">',
                  'With love,<br />',
                  '<span style="font-style: italic; color: #ffffff;">Phuong Nguyen</span>',
                '</p>',

                // Đường kẻ mỏng ở đáy (giống phía trên, giữ cho phần footer trống nhưng vẫn có mặt)
                '<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.22); margin: 0 0 30px 0;" />',

              '</td>',
            '</tr>',
          '</table>',

        '</td>',
      '</tr>',
    '</table>'
  ].join("");

  GmailApp.sendEmail(recipientEmail, subject, "", {
    name: EVENT_CONFIG.hostName,
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
