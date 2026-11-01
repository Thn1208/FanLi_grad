/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: SYNC GOOGLE SHEETS & SEND RSVP CONFIRMATION EMAILS
 * Graduation Ceremony: The Quiet Strength — Nguyen Thi Diem Phuong
 * ============================================================================
 *
 * GOOGLE SHEET COLUMNS (Row 1 Headers):
 * Col A (1): No.                         (Guest ID / Sequence: 1, 2, 3...)
 * Col B (2): Name                        (Guest Name: Tran Nguyen Phuoc, Nguyen Thanh Phat,...)
 * Col C (3): Time                        (Ceremony Time from Sheet: 10AM, 08:00 AM – 11:30 AM,...)
 * Col D (4): Nam/nữ                      (Gender / Salutation: Mr. / Ms. / Nam / Nữ)
 * Col E (5): Status                      (Dropdown: Yes, No, Gửi thư, Email (remind), Email (Thank you))
 * Col F (6): Note                        (Internal note - Protected, never overwritten)
 * Col G (7): Email                       (Guest Email address)
 * Col H (8): Message                     (Guest Message / Warm Wishes)
 * Col I (9): Thời gian phản hồi          (Timestamp of RSVP response)
 * Col J (10): Link                       (Personalized invitation link)
 * ============================================================================
 */

// Event Configuration
var EVENT_CONFIG = {
  hostName: "Nguyen Thi Diem Phuong",
  eventName: "Phuong's Graduation Ceremony — The Quiet Strength",
  dateText: "Sunday, November 8, 2026 (SUN, NOV 8, 2026)",
  timeText: "08:00 AM – 11:30 AM",
  venueName: "Hall A, FPT University HCMC",
  venueAddress: "D1 High-Tech Park, Long Thanh My, Thu Duc City, HCMC",
  mapsUrl: "https://maps.app.goo.gl/F1LVCkgJ4KDwRs2bA",
  contactPhone: "0367 989 880",
  websiteUrl: "https://franynguyen.id.vn/"
};

// ----------------------------------------------------------------------------
// 1. DYNAMIC COLUMN MAPPING
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

  // Fallbacks if not detected
  if (cols.no === -1) cols.no = 0;
  if (cols.name === -1) cols.name = 1;
  if (cols.time === -1) cols.time = 2;
  if (cols.gender === -1) cols.gender = 3;
  if (cols.status === -1) cols.status = 4;
  if (cols.note === -1 && headers.length > 5) cols.note = 5;

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
    "Looking forward to the graduation ceremony! Congratulations!",
    "10:00 AM",
    EVENT_CONFIG.websiteUrl
  );

  sendHostNotificationEmail(
    "Mr. Tran Nguyen Phuoc",
    "Yes",
    myEmail,
    "Looking forward to celebrating with you!",
    "10:00 AM",
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  Logger.log("Successfully sent test emails to: " + myEmail);
}

// ----------------------------------------------------------------------------
// 3. GET REQUEST: FETCH GUEST DATA & RSVP STATUS FROM GOOGLE SHEET
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

        var msg = "";
        if (cols.message !== -1 && row[cols.message]) {
          msg = row[cols.message].toString().trim();
        } else if (cols.wish !== -1 && row[cols.wish]) {
          msg = row[cols.wish].toString().trim();
        } else if (cols.note !== -1 && cols.message === -1 && row[cols.note]) {
          msg = row[cols.note].toString().trim();
        }

        var wishVal = (cols.wish !== -1 && row[cols.wish]) ? row[cols.wish].toString().trim() : msg;

        foundGuest = {
          no: rowNo,
          name: rowName,
          time: cols.time !== -1 ? (row[cols.time] || "").toString().trim() : "",
          gender: cols.gender !== -1 ? (row[cols.gender] || "").toString().trim() : "",
          status: normalizedStatus, // "Yes", "No", or ""
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

  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script Web App is active for Phuong's Graduation Ceremony!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// 4. POST REQUEST: SAVE RSVP TO SHEET & SEND CONFIRMATION EMAIL
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
    var payloadNo = (payload.no || payload.id || "").toString().trim();
    var guestName = (payload.guestName || "Name").trim();
    var attendance = payload.attendance || "Yes";
    var email = (payload.email || "").trim();
    var message = (payload.message || "").trim();
    var timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });

    // ACTION: RSVP SUBMISSION
    var data = sheet.getDataRange().getValues();
    var headers = data.length > 0 ? data[0] : [];
    var cols = getSheetColumnIndexes(headers);

    // Ensure Email and Message columns exist
    var currentHeaderLen = headers.length;
    if (cols.email === -1) {
      currentHeaderLen++;
      sheet.getRange(1, currentHeaderLen).setValue("Email");
      cols.email = currentHeaderLen - 1;
    }
    if (cols.message === -1 && cols.wish === -1) {
      currentHeaderLen++;
      sheet.getRange(1, currentHeaderLen).setValue("Message");
      cols.message = currentHeaderLen - 1;
    }
    if (cols.timestamp === -1) {
      currentHeaderLen++;
      sheet.getRange(1, currentHeaderLen).setValue("Thời gian phản hồi");
      cols.timestamp = currentHeaderLen - 1;
    }

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

    // Search by No. first, then by clean name
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
        targetRow = i + 1; // 1-based index in Sheet
        break;
      }
    }

    // MATCH EXACT DROPDOWN VALUES: "Yes" or "No" (Fixes Data Validation Error!)
    var statusText = attendance === "Yes" ? "Yes" : "No";
    var guestCeremonyTime = EVENT_CONFIG.timeText;
    var guestDisplayFullName = guestName;

    if (targetRow > 0) {
      // Get ceremony time from Sheet
      if (cols.time !== -1 && data[targetRow - 1][cols.time]) {
        guestCeremonyTime = data[targetRow - 1][cols.time].toString().trim();
      }

      // Build personalized display name from Sheet (Name + Gender)
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

      // 1. Update Status (Writes "Yes" or "No" to satisfy dropdown validation)
      if (cols.status !== -1) {
        sheet.getRange(targetRow, cols.status + 1).setValue(statusText);
      }

      // 2. Update Email
      if (cols.email !== -1 && email) {
        sheet.getRange(targetRow, cols.email + 1).setValue(email);
      }

      // 3. Update Message / Wish (Never overwrites Note)
      if (attendance === "Yes") {
        if (cols.message !== -1) {
          sheet.getRange(targetRow, cols.message + 1).setValue(message);
        } else if (cols.note !== -1) {
          sheet.getRange(targetRow, cols.note + 1).setValue(message);
        }
      } else {
        if (cols.wish !== -1) {
          sheet.getRange(targetRow, cols.wish + 1).setValue(message);
        } else if (cols.message !== -1) {
          sheet.getRange(targetRow, cols.message + 1).setValue(message);
        } else if (cols.note !== -1) {
          sheet.getRange(targetRow, cols.note + 1).setValue(message);
        }
      }

      // 4. Update Timestamp
      if (cols.timestamp !== -1) {
        sheet.getRange(targetRow, cols.timestamp + 1).setValue(timestamp);
      }

    } else {
      // Append new row if guest not found
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

    // 1. AUTOMATIC EMAIL TO GUEST IN ENGLISH (IF VALID EMAIL AND ATTENDING)
    var emailSentToGuest = false;
    if (email && email.indexOf("@") !== -1 && email.indexOf(".") !== -1) {
      try {
        sendConfirmationEmail(email, guestDisplayFullName, attendance, message, guestCeremonyTime, payload.sourceUrl);
        emailSentToGuest = true;
      } catch (mailError) {
        console.warn("Error sending confirmation email to guest:", mailError);
      }
    }

    // 2. AUTOMATIC NOTIFICATION EMAIL TO HOST (PHUONG) IN ENGLISH
    try {
      sendHostNotificationEmail(guestDisplayFullName, attendance, email, message, guestCeremonyTime, timestamp);
    } catch (hostMailErr) {
      console.warn("Error notifying host:", hostMailErr);
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
// 5. SEND CONFIRMATION EMAIL TO GUEST (100% ELEGANT ENGLISH)
// ----------------------------------------------------------------------------
function sendConfirmationEmail(recipientEmail, guestName, attendance, message, ceremonyTime, cardUrl) {
  var isAttending = attendance === "Yes";
  var subject = isAttending
    ? "[RSVP Confirmation] The Quiet Strength — Phuong's Graduation Ceremony 🎓"
    : "[Warm Wishes] The Quiet Strength — Phuong's Graduation Ceremony 🤍";

  var displayCardUrl = cardUrl || EVENT_CONFIG.websiteUrl;
  var displayTime = ceremonyTime || EVENT_CONFIG.timeText;
  var htmlContent = "";

  if (isAttending) {
    // ELEGANT ENGLISH TEMPLATE FOR ATTENDING (YES)
    htmlContent = [
      '<div style="max-width: 580px; margin: 0 auto; background-color: #fbf9f5; font-family: \'Playfair Display\', \'Georgia\', \'Times New Roman\', serif; color: #2a2825; border: 1px solid #e7ded0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">',
        // Banner Header
        '<div style="background-color: #2a2825; color: #f5efe6; padding: 32px 24px; text-align: center;">',
          '<p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c8b79b;">Graduation Ceremony</p>',
          '<h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.04em;">THE QUIET STRENGTH</h1>',
          '<p style="margin: 8px 0 0 0; font-style: italic; font-size: 14px; color: #e0d5c1;">Nguyen Thi Diem Phuong</p>',
        '</div>',

        // Body Content
        '<div style="padding: 32px 28px; line-height: 1.7; font-size: 15px;">',
          '<p style="font-size: 17px; margin-top: 0;">Dear <strong>' + escapeHtml(guestName) + '</strong>,</p>',
          '<p>Thank you so much for confirming your attendance at my <strong>Graduation Ceremony</strong>!</p>',
          '<p>Your presence means a lot to me and will make this milestone even more memorable and joyful. ✨</p>',

          // Event Info Box
          '<div style="background-color: #ffffff; border-left: 3px solid #8b3a2b; padding: 18px 22px; margin: 24px 0; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">',
            '<h3 style="margin: 0 0 12px 0; font-size: 16px; color: #8b3a2b; letter-spacing: 0.03em;">CEREMONY DETAILS:</h3>',
            '<p style="margin: 6px 0;">📅 <strong>Date:</strong> ' + EVENT_CONFIG.dateText + '</p>',
            '<p style="margin: 6px 0;">⏰ <strong>Time:</strong> ' + escapeHtml(displayTime) + '</p>',
            '<p style="margin: 6px 0;">📍 <strong>Venue:</strong> ' + EVENT_CONFIG.venueName + '</p>',
            '<p style="margin: 4px 0 0 24px; font-size: 13px; color: #5a5650;">' + EVENT_CONFIG.venueAddress + '</p>',
          '</div>',

          (message ? '<div style="margin: 18px 0; padding: 12px 18px; background-color: #f3ede2; border-radius: 6px; font-style: italic; font-size: 14px;"><strong>Your message:</strong> "' + escapeHtml(message) + '"</div>' : ''),

          // Call to action buttons
          '<div style="text-align: center; margin: 30px 0 16px 0;">',
            '<a href="' + EVENT_CONFIG.mapsUrl + '" target="_blank" style="display: inline-block; background-color: #8b3a2b; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 4px; font-size: 14px; font-weight: 500; margin-right: 8px; letter-spacing: 0.03em;">📍 View on Google Maps</a>',
            '<a href="' + displayCardUrl + '" target="_blank" style="display: inline-block; background-color: #e5dbc9; color: #2a2825; text-decoration: none; padding: 11px 22px; border-radius: 4px; font-size: 14px; font-weight: 500; letter-spacing: 0.03em;">💌 View Invitation</a>',
          '</div>',

          '<p style="text-align: center; font-size: 13px; color: #767067; margin-top: 14px;">(If your schedule changes, you can reopen your invitation link anytime and click <em>Change response</em> to update.)</p>',
        '</div>',

        // Footer
        '<div style="background-color: #f3ede2; padding: 20px 28px; text-align: center; font-size: 13px; color: #6b645b; border-top: 1px solid #e7ded0;">',
          '<p style="margin: 0 0 4px 0;">Looking forward to celebrating with you! 🎓</p>',
          '<p style="margin: 4px 0; font-weight: bold; color: #2a2825;">Nguyen Thi Diem Phuong</p>',
          '<p style="margin: 2px 0 0 0; font-size: 12px;">Contact: ' + EVENT_CONFIG.contactPhone + '</p>',
        '</div>',
      '</div>'
    ].join("");

  } else {
    // ELEGANT ENGLISH TEMPLATE FOR DECLINING (NO)
    htmlContent = [
      '<div style="max-width: 580px; margin: 0 auto; background-color: #fbf9f5; font-family: \'Playfair Display\', \'Georgia\', \'Times New Roman\', serif; color: #2a2825; border: 1px solid #e7ded0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">',
        // Header
        '<div style="background-color: #2a2825; color: #f5efe6; padding: 28px 24px; text-align: center;">',
          '<p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c8b79b;">Graduation Ceremony</p>',
          '<h1 style="margin: 0; font-size: 22px; font-weight: 600;">THE QUIET STRENGTH</h1>',
          '<p style="margin: 6px 0 0 0; font-style: italic; font-size: 14px; color: #e0d5c1;">Nguyen Thi Diem Phuong</p>',
        '</div>',

        // Body
        '<div style="padding: 32px 28px; line-height: 1.7; font-size: 15px;">',
          '<p style="font-size: 17px; margin-top: 0;">Dear <strong>' + escapeHtml(guestName) + '</strong>,</p>',
          '<p>Thank you for letting me know. While I\'m sorry you won\'t be able to make it to the ceremony, I truly appreciate your warm thoughts and kind support.</p>',

          (message ? '<div style="margin: 22px 0; padding: 16px 20px; background-color: #f3ede2; border-left: 3px solid #8b3a2b; border-radius: 4px; font-style: italic; font-size: 14px;"><strong>Your warm wishes:</strong><br>"' + escapeHtml(message) + '"</div>' : ''),

          '<p>Wishing you all the very best, happiness, and continued success. I hope to see you again soon! 🤍</p>',

          '<div style="text-align: center; margin: 24px 0 8px 0;">',
            '<a href="' + displayCardUrl + '" target="_blank" style="display: inline-block; background-color: #e5dbc9; color: #2a2825; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: 500;">💌 Open Invitation Card</a>',
          '</div>',
        '</div>',

        // Footer
        '<div style="background-color: #f3ede2; padding: 18px 28px; text-align: center; font-size: 13px; color: #6b645b; border-top: 1px solid #e7ded0;">',
          '<p style="margin: 0 0 4px 0; font-weight: bold; color: #2a2825;">Nguyen Thi Diem Phuong</p>',
          '<p style="margin: 2px 0 0 0; font-size: 12px;">Contact: ' + EVENT_CONFIG.contactPhone + '</p>',
        '</div>',
      '</div>'
    ].join("");
  }

  // Send via GmailApp
  GmailApp.sendEmail(recipientEmail, subject, "", {
    name: EVENT_CONFIG.hostName + " — Graduation",
    htmlBody: htmlContent
  });
}

// ----------------------------------------------------------------------------
// 6. SEND INSTANT NOTIFICATION TO HOST (PHUONG) IN ENGLISH
// ----------------------------------------------------------------------------
function sendHostNotificationEmail(guestName, attendance, guestEmail, message, ceremonyTime, timestamp) {
  var hostEmail = Session.getActiveUser().getEmail();
  if (!hostEmail) return;

  var isYes = attendance === "Yes";
  var subject = isYes
    ? "🎉 [NEW RSVP: ATTENDING] Guest " + guestName + " confirmed attendance!"
    : "🤍 [NEW RSVP: UNABLE TO ATTEND] Guest " + guestName + " sent warm wishes!";

  var statusBadge = isYes
    ? '<span style="display: inline-block; background-color: #2e7d32; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">ATTENDING (YES)</span>'
    : '<span style="display: inline-block; background-color: #c62828; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">UNABLE TO ATTEND (NO)</span>';

  var bodyHtml = [
    '<div style="max-width: 520px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #ffffff;">',
      '<h2 style="margin-top: 0; color: #2a2825; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 12px;">🔔 Graduation Invitation RSVP Update</h2>',
      '<p style="margin: 12px 0;">Phuong, a guest has just submitted their RSVP response:</p>',
      '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">',
        '<tr><td style="padding: 8px 0; color: #666; width: 140px;"><strong>Guest Name:</strong></td><td style="padding: 8px 0; font-size: 16px; font-weight: bold; color: #111;">' + escapeHtml(guestName) + '</td></tr>',
        '<tr><td style="padding: 8px 0; color: #666;"><strong>Response:</strong></td><td style="padding: 8px 0;">' + statusBadge + '</td></tr>',
        '<tr><td style="padding: 8px 0; color: #666;"><strong>Ceremony Time:</strong></td><td style="padding: 8px 0; color: #111;">' + escapeHtml(ceremonyTime || "08:00 AM – 11:30 AM") + '</td></tr>',
        (guestEmail ? '<tr><td style="padding: 8px 0; color: #666;"><strong>Guest Email:</strong></td><td style="padding: 8px 0; color: #1565c0;">' + escapeHtml(guestEmail) + '</td></tr>' : ''),
        (message ? '<tr><td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>' + (isYes ? 'Message:' : 'Wishes:') + '</strong></td><td style="padding: 8px 0; background-color: #f9f9f9; padding: 10px; border-radius: 4px; font-style: italic;">"' + escapeHtml(message) + '"</td></tr>' : ''),
        '<tr><td style="padding: 8px 0; color: #666;"><strong>Submitted At:</strong></td><td style="padding: 8px 0; color: #888;">' + timestamp + '</td></tr>',
      '</table>',
      '<div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #eee; text-align: center;">',
        '<a href="https://docs.google.com/spreadsheets/d/' + SpreadsheetApp.getActiveSpreadsheet().getId() + '/edit" target="_blank" style="display: inline-block; background-color: #2a2825; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; font-weight: bold;">📊 Open Google Sheet Guest List</a>',
      '</div>',
    '</div>'
  ].join("");

  GmailApp.sendEmail(hostEmail, subject, "", {
    name: "Graduation RSVP Notification",
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
