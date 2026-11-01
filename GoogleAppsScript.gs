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
  dateText: "Sunday, November 8, 2026",
  timeText: "08:00 AM – 11:30 AM",
  venueName: "Hall A, FPT University HCMC",
  venueAddress: "D1 High-Tech Park, Long Thanh My, Thu Duc City, HCMC",
  mapsUrl: "https://maps.app.goo.gl/F1LVCkgJ4KDwRs2bA",
  contactPhone: "0367 989 880",
  websiteUrl: "https://franynguyen.id.vn/"
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
        var pref = "";
        if (cols.gender !== -1 && data[targetRow - 1][cols.gender]) {
          var gLower = data[targetRow - 1][cols.gender].toString().toLowerCase().trim();
          if (gLower === "nam" || gLower === "mr" || gLower === "mr.") pref = "Mr. ";
          else if (gLower === "nữ" || gLower === "nu" || gLower === "ms" || gLower === "ms." || gLower === "miss") pref = "Ms. ";
        }
        if (pref && !/^(mr\.?|ms\.?|miss\.?|mrs\.?|anh|chị)\s+/i.test(baseName)) {
          guestDisplayFullName = pref + baseName;
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
// 5. GỬI EMAIL XÁC NHẬN BẰNG TIẾNG ANH (HOÀN TOÀN KHÔNG DÙNG ICON)
// ----------------------------------------------------------------------------
function sendConfirmationEmail(recipientEmail, guestName, attendance, message, ceremonyTime, cardUrl) {
  // Chỉ gửi khi attendance là Yes
  if (attendance !== "Yes") return;

  // Tiêu đề sạch sẽ, trang trọng, không có icon
  var subject = "[RSVP Confirmation] The Quiet Strength — Phuong's Graduation Ceremony";
  var displayCardUrl = cardUrl || EVENT_CONFIG.websiteUrl;
  var displayTime = ceremonyTime || EVENT_CONFIG.timeText;

  var messageBox = "";
  if (message) {
    messageBox = '<div style="margin: 18px 0; padding: 12px 18px; background-color: #f3ede2; border-radius: 6px; font-style: italic; font-size: 14px;"><strong>Your message:</strong> "' + escapeHtml(message) + '"</div>';
  }

  // Template email tiếng Anh sang trọng, chuẩn typography, KHÔNG SỬ DỤNG BẤT KỲ ICON NÀO
  var htmlContent = [
    '<div style="max-width: 580px; margin: 0 auto; background-color: #fbf9f5; font-family: \'Playfair Display\', \'Georgia\', \'Times New Roman\', serif; color: #2a2825; border: 1px solid #e7ded0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">',
      // Header Banner
      '<div style="background-color: #2a2825; color: #f5efe6; padding: 32px 24px; text-align: center;">',
        '<p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c8b79b;">Graduation Ceremony</p>',
        '<h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.04em;">THE QUIET STRENGTH</h1>',
        '<p style="margin: 8px 0 0 0; font-style: italic; font-size: 14px; color: #e0d5c1;">Nguyen Thi Diem Phuong</p>',
      '</div>',

      // Body Content
      '<div style="padding: 32px 28px; line-height: 1.7; font-size: 15px;">',
        '<p style="font-size: 17px; margin-top: 0;">Dear <strong>' + escapeHtml(guestName) + '</strong>,</p>',
        '<p>Thank you so much for confirming your attendance at my <strong>Graduation Ceremony</strong>.</p>',
        '<p>Your presence means a lot to me and will make this milestone even more memorable and joyful.</p>',

        // Event Info Box (Không có icon)
        '<div style="background-color: #ffffff; border-left: 3px solid #8b3a2b; padding: 18px 22px; margin: 24px 0; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">',
          '<h3 style="margin: 0 0 12px 0; font-size: 15px; color: #8b3a2b; letter-spacing: 0.03em;">CEREMONY DETAILS:</h3>',
          '<p style="margin: 6px 0;"><strong>Date:</strong> ' + EVENT_CONFIG.dateText + '</p>',
          '<p style="margin: 6px 0;"><strong>Time:</strong> ' + escapeHtml(displayTime) + '</p>',
          '<p style="margin: 6px 0;"><strong>Venue:</strong> ' + EVENT_CONFIG.venueName + '</p>',
          '<p style="margin: 4px 0 0 0; font-size: 13px; color: #5a5650;">Address: ' + EVENT_CONFIG.venueAddress + '</p>',
        '</div>',

        messageBox,

        // Call to action buttons (Không có icon)
        '<div style="text-align: center; margin: 30px 0 16px 0;">',
          '<a href="' + EVENT_CONFIG.mapsUrl + '" target="_blank" style="display: inline-block; background-color: #8b3a2b; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 4px; font-size: 14px; font-weight: 500; margin-right: 8px; letter-spacing: 0.03em;">View on Google Maps</a>',
          '<a href="' + displayCardUrl + '" target="_blank" style="display: inline-block; background-color: #e5dbc9; color: #2a2825; text-decoration: none; padding: 11px 22px; border-radius: 4px; font-size: 14px; font-weight: 500; letter-spacing: 0.03em;">View Invitation Card</a>',
        '</div>',

        '<p style="text-align: center; font-size: 13px; color: #767067; margin-top: 14px;">(If your schedule changes, you can reopen your invitation link anytime and click <em>Change response</em> to update.)</p>',
      '</div>',

      // Footer
      '<div style="background-color: #f3ede2; padding: 20px 28px; text-align: center; font-size: 13px; color: #6b645b; border-top: 1px solid #e7ded0;">',
        '<p style="margin: 0 0 4px 0;">Looking forward to celebrating with you.</p>',
        '<p style="margin: 4px 0; font-weight: bold; color: #2a2825;">Nguyen Thi Diem Phuong</p>',
        '<p style="margin: 2px 0 0 0; font-size: 12px;">Contact: ' + EVENT_CONFIG.contactPhone + '</p>',
      '</div>',
    '</div>'
  ].join("");

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
