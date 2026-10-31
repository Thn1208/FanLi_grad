/**
 * ==========================================================================
 * THE QUIET STRENGTH — GRADUATION CEREMONY INVITATION
 * Pure Manual Navigation, Canva Typography, Typewriter & Star Timeline
 * ==========================================================================
 */

(function () {
  'use strict';

  // ========================================================================
  // CONFIGURATION
  // ========================================================================
  const CONFIG = {
    // Google Apps Script Web App URL to receive RSVPs in Google Sheets
    googleSheetScriptUrl: "",

    // Default guest name displayed on Slide 4 (Ceremony)
    defaultGuestName: "Ms. Thuy Linh",

    // Event details for Calendar (.ics) & Google Maps
    event: {
      title: "Phuong's Graduation Ceremony — The Quiet Strength",
      details: "Nguyen Thi Diem Phuong invites you to her Graduation Ceremony at FPT University HCMC. Hall A, Campus.",
      location: "Hall A, FPT University HCMC, D1 High-Tech Park, Long Thanh My, Thu Duc City, HCMC",
      startDate: "20261108T080000",
      endDate: "20261108T113000",
      mapsUrl: "https://maps.app.goo.gl/F1LVCkgJ4KDwRs2bA"
    }
  };

  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  const DOM = {
    storyContainer: document.getElementById('storyContainer'),
    introStars: document.getElementById('introStars'),
    introTapHint: document.getElementById('introTapHint'),
    slides: Array.from(document.querySelectorAll('.slide-item')),

    // Slide 1 (Cover): Crisp Title, Typewriter Script & Blur Meta
    coverHeading: document.getElementById('coverHeading'),
    coverLeadThe: document.getElementById('coverLeadThe'),
    typewriterScriptText: document.getElementById('typewriterScriptText'),
    typewriterCursor: document.getElementById('typewriterCursor'),
    coverSubtitle: document.getElementById('coverSubtitle'),
    coverFooterMeta: document.getElementById('coverFooterMeta'),

    // Slide 2 (Invite): Ribbon, Stars & Invitation Lines
    inviteRibbonImg: document.querySelector('.slide-invite .invite-ribbon-img'),
    inviteStarSparkle: document.querySelector('.slide-invite .invite-star-sparkle'),
    inviteLines: [
      document.querySelector('.slide-invite .invite-line.line-1'),
      document.querySelector('.slide-invite .invite-line.line-2')
    ],

    // Slide 3 (Timeline): Typewriter Heading, Vertical Line & 4 Star Milestones
    timelineTypeLines: [
      document.getElementById('timelineTypeLine1'),
      document.getElementById('timelineTypeLine2'),
      document.getElementById('timelineTypeLine3')
    ],
    timelineVerticalLine: document.getElementById('timelineVerticalLine'),
    milestoneItems: Array.from(document.querySelectorAll('.milestone-item')),

    // Slide 4 (Ceremony - thư.png): Personalization, Hotspots & Divider Line
    customGuestOverlay: document.getElementById('customGuestOverlay'),
    customGuestText: document.getElementById('customGuestText'),
    ceremonyDividerLine: document.getElementById('ceremonyDividerLine'),
    hotspotDateTime: document.getElementById('hotspotDateTime'),
    hotspotVenue: document.getElementById('hotspotVenue'),

    // Slide 5 (RSVP - thư.png): Yes/No Hotspots, Divider & Inline Step
    btnRsvpYes: document.getElementById('btnRsvpYes'),
    btnRsvpNo: document.getElementById('btnRsvpNo'),
    rsvpChoicesGroup: document.getElementById('rsvpChoicesGroup'),
    rsvpFlowInitial: document.getElementById('rsvpFlowInitial'),
    rsvpInlineStep: document.getElementById('rsvpInlineStep'),
    rsvpFieldsYes: document.getElementById('rsvpFieldsYes'),
    rsvpFieldsNo: document.getElementById('rsvpFieldsNo'),
    btnRsvpBack: document.getElementById('btnRsvpBack'),
    rsvpStepPrompt: document.getElementById('rsvpStepPrompt'),
    rsvpInlineEmail: document.getElementById('rsvpInlineEmail'),
    rsvpInlineMessage: document.getElementById('rsvpInlineMessage'),
    rsvpInlineWish: document.getElementById('rsvpInlineWish'),
    btnRsvpInlineSubmit: document.getElementById('btnRsvpInlineSubmit'),
    rsvpInlineFeedback: document.getElementById('rsvpInlineFeedback'),
    rsvpFeedbackMsg: document.getElementById('rsvpFeedbackMsg'),
    rsvpCompletedView: document.getElementById('rsvpCompletedView'),
    rsvpRecordedChoice: document.getElementById('rsvpRecordedChoice'),
    btnRsvpChangeResponse: document.getElementById('btnRsvpChangeResponse'),
    rsvpDividerLine: document.getElementById('rsvpDividerLine'),

    // Slide 6 (Thank you - núi2.png): Star, Text Box, Signature
    thankyouStarWrapper: document.getElementById('thankyouStarWrapper'),
    thankyouTextBox: document.getElementById('thankyouTextBox'),
    thankyouSignWrapper: document.getElementById('thankyouSignWrapper'),

    // Slide 7 (Video - núi2.png): Play Trigger & Modal
    btnTriggerVideo: document.getElementById('btnTriggerVideo'),
    videoModal: document.getElementById('videoModal'),
    memoryVideo: document.getElementById('memoryVideo'),
    btnCloseVideo: document.getElementById('btnCloseVideo'),

    // Navigation Arrows in top 2 corners
    btnNavPrev: document.getElementById('btnNavPrev'),
    btnNavNext: document.getElementById('btnNavNext'),

    // Slide 8 (Outro - Trang 9): Title, Typewriter Script, Meta & Replay
    outroLeadThe: document.getElementById('outroLeadThe'),
    outroHeading: document.getElementById('outroHeading'),
    outroTypewriterScriptText: document.getElementById('outroTypewriterScriptText'),
    outroTypewriterCursor: document.getElementById('outroTypewriterCursor'),
    outroSubtitle: document.getElementById('outroSubtitle'),
    outroFooterMeta: document.getElementById('outroFooterMeta'),
    btnReplayStory: document.getElementById('btnReplayStory'),
    toastBox: document.getElementById('toastBox')
  };

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const STATE = {
    currentSlideIndex: 0,
    totalSlides: DOM.slides.length, // Exactly 9 slides (0 to 8)
    guestName: CONFIG.defaultGuestName,
    selectedAttendance: "Yes",
    hasSubmittedRsvp: false,
    touchStartX: 0,
    touchStartY: 0
  };

  // Timers & Transition Locks
  let typewriterTimers = [];
  let inviteTimers = [];
  let timelineTimers = [];
  let thankyouTimers = [];
  let outroTimers = [];
  let coverExitTimer = null;
  let inviteExitTimer = null;
  let thankyouExitTimer = null;
  let introHintTimer = null;
  let navFlashTimer = null;
  let isTransitioningCover = false;
  let isTransitioningInvite = false;
  let isTransitioningThankyou = false;

  // ========================================================================
  // RESPONSIVE ARTBOARD SCALING (393x852 mobile artboard, uniform on mobile & desktop)
  // ========================================================================
  function updateStoryScale() {
    const winW = window.innerWidth || document.documentElement.clientWidth;
    const winH = window.innerHeight || document.documentElement.clientHeight;
    const baseW = 393;
    const baseH = 852;

    let availW = winW;
    let availH = winH;

    // Trên màn hình rộng (desktop / laptop / tablet), căn giữa và thu phóng vừa vặn khung mobile
    if (winW > 600 && winH > 500) {
      availW = winW * 0.92;
      availH = winH * 0.92;
    }

    const scale = Math.min(availW / baseW, availH / baseH);
    document.documentElement.style.setProperty('--story-scale', scale.toFixed(4));
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  function init() {
    updateStoryScale();
    setupGuestPersonalization();
    bindEvents();
    checkStoredRsvp();
    startIntroHintTimer();
    flashNavArrows();
  }

  // ========================================================================
  // 1. GUEST PERSONALIZATION VIA URL QUERY (?to=... or ?name=...)
  // ========================================================================
  function setupGuestPersonalization() {
    const params = new URLSearchParams(window.location.search);
    let resolvedName = params.get('to');

    // Nếu không có 'to', tự động nhận diện từ 'name' và 'gender'
    if (!resolvedName) {
      const rawName = params.get('name') || params.get('guest') || '';
      const rawGender = (params.get('gender') || params.get('sex') || params.get('phai') || '').toLowerCase().trim();
      const style = (params.get('style') || params.get('lang') || '').toLowerCase().trim();

      if (rawName) {
        let prefix = '';
        const isMale = rawGender === 'nam' || rawGender === 'male' || rawGender === 'mr' || rawGender === 'anh';
        const isFemale = rawGender === 'nu' || rawGender === 'nữ' || rawGender === 'female' || rawGender === 'ms' || rawGender === 'chi' || rawGender === 'chị';

        if (style === 'vi' || rawGender === 'anh' || rawGender === 'chi' || rawGender === 'chị') {
          if (isMale) prefix = 'Anh ';
          else if (isFemale) prefix = 'Chị ';
        } else {
          // Mặc định chuẩn tiếng Anh theo thiệp: Mr. / Ms.
          if (isMale) prefix = 'Mr. ';
          else if (isFemale) prefix = 'Ms. ';
        }

        const cleanName = rawName.trim();
        // Tránh trùng tiền tố nếu tên đã có sẵn
        if (/^(mr\.?|ms\.?|anh|chị)\s+/i.test(cleanName)) {
          resolvedName = cleanName;
        } else {
          resolvedName = prefix + cleanName;
        }
      }
    }

    if (resolvedName && resolvedName.trim() !== '') {
      STATE.guestName = resolvedName.trim();
    } else {
      STATE.guestName = "Name";
    }

    // Hiển thị ở Trang 5 (Slide 4): Dear [Name]. (Tên in đậm, toàn dòng in nghiêng)
    if (DOM.customGuestText) {
      DOM.customGuestText.innerHTML = `Dear <strong class="guest-name-bold">${escapeHtml(STATE.guestName)}</strong>.`;
    }

    // Tuỳ chỉnh khung giờ nếu URL có tham số ?time=...
    const customTime = params.get('time');
    if (customTime && customTime.trim() !== '') {
      const timeEl = document.querySelector('.datetime-time');
      if (timeEl) {
        timeEl.textContent = customTime.trim();
      }
    }
  }

  // ========================================================================
  // 2. ENCHANTED STARLIGHT PARTICLES IN RIBBON INTRO (SLIDE 0)
  // ========================================================================
  function createIntroStars() {
    if (!DOM.introStars) return;
    const count = 28;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'intro-star';
      const size = Math.random() * 2.5 + 1.2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${Math.random() * 2.5 + 2}s`;
      fragment.appendChild(star);
    }

    DOM.introStars.appendChild(fragment);
  }

  // ========================================================================
  // 3. UNTIE SPARKLE BURST (WHEN OPENING FROM SLIDE 0 TO SLIDE 1)
  // ========================================================================
  function triggerUntieSparkles() {
    const slide0 = DOM.slides[0];
    if (!slide0) return;

    const rect = slide0.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const count = 22;

    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'intro-star';
      spark.style.position = 'absolute';
      spark.style.zIndex = '30';
      spark.style.width = '4px';
      spark.style.height = '4px';
      spark.style.left = `${centerX}px`;
      spark.style.top = `${centerY}px`;
      spark.style.backgroundColor = '#ffffff';
      spark.style.borderRadius = '50%';
      spark.style.boxShadow = '0 0 10px #ffffff';
      spark.style.pointerEvents = 'none';
      spark.style.transition = 'transform 0.75s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.75s ease-out';

      slide0.appendChild(spark);

      const angle = (i / count) * Math.PI * 2;
      const dist = Math.random() * 120 + 70;
      const targetX = Math.cos(angle) * dist;
      const targetY = Math.sin(angle) * dist;

      requestAnimationFrame(() => {
        spark.style.transform = `translate(${targetX}px, ${targetY}px) scale(0)`;
        spark.style.opacity = '0';
      });

      setTimeout(() => spark.remove(), 800);
    }
  }

  // ========================================================================
  // 4. ANIMATION CONTROLLERS FOR SLIDES 1, 2, 3
  // ========================================================================

  // --- Slide 1: Crisp "THE QUIET STRENGTH" + Typewriter "Graduation Ceremony" + Blur Meta ---
  function startCoverTypewriter() {
    typewriterTimers.forEach(t => clearTimeout(t));
    typewriterTimers = [];

    const scriptTextEl = DOM.typewriterScriptText;
    const cursorEl = DOM.typewriterCursor;
    const footerMeta = DOM.coverFooterMeta;

    if (!scriptTextEl) return;

    // Reset initial state
    scriptTextEl.textContent = '';
    if (cursorEl) {
      cursorEl.style.display = 'inline-block';
      cursorEl.style.opacity = '1';
      cursorEl.style.transition = 'none';
    }
    if (footerMeta) footerMeta.classList.remove('revealed');

    // Typewriter for "Graduation Ceremony"
    const fullText = "Graduation Ceremony";
    let charIndex = 0;

    function typeNextChar() {
      if (STATE.currentSlideIndex !== 1) return;

      charIndex++;
      scriptTextEl.textContent = fullText.slice(0, charIndex);

      if (charIndex < fullText.length) {
        // Typing cadence: ~48ms per character (nhanh hơn theo yêu cầu)
        typewriterTimers.push(setTimeout(typeNextChar, 48));
      } else {
        // Hoàn thành gõ xong chữ 'y' cuối cùng trong "ceremony":
        // Mất dấu nháy ngay lập tức, không để hiện dấu nháy trỏ
        if (cursorEl) {
          cursorEl.style.display = 'none';
        }

        // Sau khi hoàn tất, hiển thị tên tác giả & lời tri ân mờ dần đến rõ nét
        typewriterTimers.push(setTimeout(() => {
          if (STATE.currentSlideIndex !== 1) return;
          if (footerMeta) footerMeta.classList.add('revealed');
        }, 320));
      }
    }

    // Xuất hiện cùng lúc với hiệu ứng trượt mờ đến rõ nét của "THE QUIET STRENGTH"
    typewriterTimers.push(setTimeout(typeNextChar, 35));
  }

  // --- Slide 2 (Trang 3): Ribbon2 & Sao xuất hiện trước; sau đó các dòng chữ xuất hiện nhanh hơn ---
  function startInviteAnimation() {
    inviteTimers.forEach(t => clearTimeout(t));
    inviteTimers = [];

    const slide2 = DOM.slides[2];
    if (slide2) {
      slide2.classList.remove('exiting-invite');
    }

    DOM.inviteLines.forEach(el => {
      if (el) el.classList.remove('revealed');
    });

    // Các dòng chữ xuất hiện nhanh hơn (450ms và 750ms)
    inviteTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 2) return;
      if (DOM.inviteLines[0]) DOM.inviteLines[0].classList.add('revealed');
    }, 450));

    inviteTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 2) return;
      if (DOM.inviteLines[1]) DOM.inviteLines[1].classList.add('revealed');
    }, 750));
  }

  // --- Slide 3 (Trang 4): Typewriter Heading + Non-overhanging Line + Slow Blur-In Milestones ---
  function startTimelineAnimation() {
    timelineTimers.forEach(t => clearTimeout(t));
    timelineTimers = [];

    const lineEl = DOM.timelineVerticalLine;
    const milestones = DOM.milestoneItems;
    const typeLines = DOM.timelineTypeLines || [];
    const headingTexts = [
      "A journey",
      "of small steps",
      "and big dreams"
    ];

    // Reset initial state
    typeLines.forEach(el => {
      if (el) el.textContent = '';
    });
    if (lineEl) {
      lineEl.style.transition = 'none';
      lineEl.style.height = '0%';
      lineEl.style.width = '1.5px';
    }
    milestones.forEach(m => m.classList.remove('revealed'));

    // Force DOM reflow
    if (lineEl) void lineEl.offsetHeight;

    // 1. Typewriter effect for "A journey / of small steps / and big dreams"
    let lineIdx = 0;
    let charIdx = 0;
    function typeNextTimelineChar() {
      if (STATE.currentSlideIndex !== 3) return;
      if (lineIdx >= headingTexts.length) return;

      const currentLineEl = typeLines[lineIdx];
      const currentText = headingTexts[lineIdx];
      charIdx++;
      if (currentLineEl) {
        currentLineEl.textContent = currentText.slice(0, charIdx);
      }

      if (charIdx < currentText.length) {
        timelineTimers.push(setTimeout(typeNextTimelineChar, 42));
      } else {
        lineIdx++;
        charIdx = 0;
        if (lineIdx < headingTexts.length) {
          timelineTimers.push(setTimeout(typeNextTimelineChar, 90));
        }
      }
    }
    timelineTimers.push(setTimeout(typeNextTimelineChar, 80));

    // 2. Start vertical line drawing
    timelineTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 3) return;
      if (lineEl) {
        lineEl.style.transition = 'height 2.8s cubic-bezier(0.25, 1, 0.5, 1)';
        lineEl.style.height = 'calc(100% + 48px)';
      }
    }, 250));

    // 3. Slow blur-to-clear reveal for each milestone
    const milestoneDelays = [350, 980, 1620, 2260];
    milestones.forEach((item, idx) => {
      const delay = milestoneDelays[idx] || (idx * 640 + 350);
      timelineTimers.push(setTimeout(() => {
        if (STATE.currentSlideIndex !== 3) return;
        item.classList.add('revealed');
      }, delay));
    });
  }

  // --- Slide 6 (Trang 7): Nền núi2.png trước -> Sao sao.png -> Dòng chữ -> Chữ ký sign.png ---
  function startThankyouAnimation() {
    thankyouTimers.forEach(t => clearTimeout(t));
    thankyouTimers = [];

    const star = DOM.thankyouStarWrapper;
    const text = DOM.thankyouTextBox;
    const sign = DOM.thankyouSignWrapper;

    const slide6 = DOM.slides[6];
    if (slide6) {
      slide6.classList.remove('exiting-step1', 'exiting-step2');
    }

    if (star) star.classList.remove('revealed');
    if (text) text.classList.remove('revealed');
    if (sign) {
      sign.classList.remove('revealed');
      sign.style.animation = 'none';
      void sign.offsetHeight;
      sign.style.animation = '';
    }

    // 1. Nền núi2.png hiển thị ngay khi trang kích hoạt (t = 0)
    // 2. Ngôi sao sao.png với hiệu ứng xuất hiện tiếp theo (350ms)
    thankyouTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 6) return;
      if (star) star.classList.add('revealed');
    }, 350));

    // 3. Tiếp theo các dòng chữ xuất hiện (Playfair Display Regular 15pt) (1050ms)
    thankyouTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 6) return;
      if (text) text.classList.add('revealed');
    }, 1050));

    // 4. Cuối cùng sign mới xuất hiện với hiệu ứng cọ vẽ kiểu dáng đường cong (2100ms)
    thankyouTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 6) return;
      if (sign) sign.classList.add('revealed');
    }, 2100));
  }

  // --- Slide 8 (Trang 9): Typewriter "Graduation Ceremony" + Blur Meta (Thank you & Contact) ---
  function startOutroTypewriter() {
    outroTimers.forEach(t => clearTimeout(t));
    outroTimers = [];

    const scriptTextEl = DOM.outroTypewriterScriptText;
    const cursorEl = DOM.outroTypewriterCursor;
    const footerMeta = DOM.outroFooterMeta;

    if (!scriptTextEl) return;

    // Reset initial state
    scriptTextEl.textContent = '';
    if (cursorEl) {
      cursorEl.style.display = 'inline-block';
      cursorEl.style.opacity = '1';
    }
    if (footerMeta) footerMeta.classList.remove('revealed');

    // Typewriter for "Graduation Ceremony" (giữ nguyên hiệu ứng như Trang 2)
    const fullText = "Graduation Ceremony";
    let charIndex = 0;

    function typeNextChar() {
      if (STATE.currentSlideIndex !== 8) return;

      charIndex++;
      scriptTextEl.textContent = fullText.slice(0, charIndex);

      if (charIndex < fullText.length) {
        outroTimers.push(setTimeout(typeNextChar, 48));
      } else {
        if (cursorEl) {
          cursorEl.style.display = 'none';
        }

        // Sau khi hoàn tất gõ chữ, hiển thị 2 dòng dưới (Thank you Cardo Italic 18.9pt & Contact 8.9pt)
        outroTimers.push(setTimeout(() => {
          if (STATE.currentSlideIndex !== 8) return;
          if (footerMeta) footerMeta.classList.add('revealed');
        }, 320));
      }
    }

    outroTimers.push(setTimeout(typeNextChar, 35));
  }

  // ========================================================================
  // 5. MANUAL SCREEN-TAP NAVIGATION (100% CANVA CROSS-DISSOLVE)
  // ========================================================================

  // Gợi ý chạm màn hình sau 3 giây trên Trang 1 (Nơ.png) nếu không có tương tác
  function startIntroHintTimer() {
    clearTimeout(introHintTimer);
    if (DOM.introTapHint) {
      DOM.introTapHint.classList.remove('revealed');
    }
    introHintTimer = setTimeout(() => {
      if (STATE.currentSlideIndex === 0 && DOM.introTapHint) {
        DOM.introTapHint.classList.add('revealed');
      }
    }, 3000);
  }

  // Mũi tên navigation <> chỉ hiển thị 1 lần lúc đầu rồi ẩn đi (sau 2.2s)
  function flashNavArrows() {
    clearTimeout(navFlashTimer);
    if (DOM.btnNavPrev && !DOM.btnNavPrev.classList.contains('hidden-nav')) {
      DOM.btnNavPrev.classList.add('nav-visible');
    }
    if (DOM.btnNavNext && !DOM.btnNavNext.classList.contains('hidden-nav')) {
      DOM.btnNavNext.classList.add('nav-visible');
    }
    navFlashTimer = setTimeout(() => {
      if (DOM.btnNavPrev && !DOM.btnNavPrev.matches(':hover')) {
        DOM.btnNavPrev.classList.remove('nav-visible');
      }
      if (DOM.btnNavNext && !DOM.btnNavNext.matches(':hover')) {
        DOM.btnNavNext.classList.remove('nav-visible');
      }
    }, 2200);
  }

  function performSlideSwitch(index) {
    STATE.currentSlideIndex = index;

    DOM.slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.remove('exiting-title', 'exiting-invite', 'exiting-step1', 'exiting-step2');
        slide.classList.add('active');
      } else {
        slide.classList.remove('active', 'exiting-title', 'exiting-invite', 'exiting-step1', 'exiting-step2');
      }
    });

    // Cập nhật trạng thái hiển thị của các nút mũi tên góc trên màn hình
    if (DOM.btnNavPrev) {
      if (index === 0) {
        DOM.btnNavPrev.classList.add('hidden-nav');
        DOM.btnNavPrev.classList.remove('nav-visible');
      } else {
        DOM.btnNavPrev.classList.remove('hidden-nav');
      }
    }
    if (DOM.btnNavNext) {
      if (index === STATE.totalSlides - 1) {
        DOM.btnNavNext.classList.add('hidden-nav');
        DOM.btnNavNext.classList.remove('nav-visible');
      } else {
        DOM.btnNavNext.classList.remove('hidden-nav');
      }
    }

    // Hiển thị chớp nhoáng mũi tên dẫn hướng khi vừa đổi slide
    flashNavArrows();

    // Quản lý gợi ý chạm màn hình ở Trang 1
    if (index === 0) {
      startIntroHintTimer();
    } else {
      clearTimeout(introHintTimer);
      if (DOM.introTapHint) {
        DOM.introTapHint.classList.remove('revealed');
      }
    }

    // Trigger per-slide animations
    if (index === 1) {
      const ribbonImg = document.querySelector('.cover-ribbon-img');
      if (ribbonImg) {
        ribbonImg.style.animation = 'none';
        void ribbonImg.offsetHeight;
        ribbonImg.style.animation = '';
      }
      startCoverTypewriter();
    } else if (index === 2) {
      startInviteAnimation();
    } else if (index === 3) {
      startTimelineAnimation();
    } else if (index === 4) {
      // Thanh gạt chậm từ trái sang phải trên Trang 5
      if (DOM.ceremonyDividerLine) {
        DOM.ceremonyDividerLine.style.animation = 'none';
        void DOM.ceremonyDividerLine.offsetHeight;
        DOM.ceremonyDividerLine.style.animation = '';
      }
    } else if (index === 5) {
      // Thanh gạt chậm trên Trang 6
      if (DOM.rsvpDividerLine) {
        DOM.rsvpDividerLine.style.animation = 'none';
        void DOM.rsvpDividerLine.offsetHeight;
        DOM.rsvpDividerLine.style.animation = '';
      }
    } else if (index === 6) {
      // Trang 7 (Thank you & Sign): Nền núi 2 -> sao -> dòng chữ -> sign
      startThankyouAnimation();
    } else if (index === 8) {
      // Trang 9: Outro (Giữ nguyên bố cục & hiệu ứng như Trang 2)
      const outroRibbon = document.querySelector('.outro-ribbon-img');
      if (outroRibbon) {
        outroRibbon.style.animation = 'none';
        void outroRibbon.offsetHeight;
        outroRibbon.style.animation = '';
      }
      startOutroTypewriter();
    }

    // If leaving video slide (Slide index 7), close video player
    if (index !== 7 && DOM.videoModal && !DOM.videoModal.classList.contains('hidden')) {
      closeVideoModal();
    }
  }

  function highlightRsvpRequired() {
    showToast("Please respond to RSVP before continuing ✨");
    if (DOM.rsvpFlowInitial) {
      DOM.rsvpFlowInitial.classList.remove('rsvp-shake');
      void DOM.rsvpFlowInitial.offsetHeight;
      DOM.rsvpFlowInitial.classList.add('rsvp-shake');
    }
    if (DOM.rsvpInlineStep && DOM.rsvpInlineStep.classList.contains('revealed')) {
      DOM.rsvpInlineStep.classList.remove('rsvp-shake');
      void DOM.rsvpInlineStep.offsetHeight;
      DOM.rsvpInlineStep.classList.add('rsvp-shake');
    }
  }

  function goToSlide(index) {
    if (index < 0 || index >= STATE.totalSlides) return;
    if (isTransitioningCover || isTransitioningInvite || isTransitioningThankyou) return;

    // Chặn chuyển sang trang sau nếu đang ở Slide 5 (RSVP) mà chưa trả lời Yes/No
    if (STATE.currentSlideIndex === 5 && index > 5 && !STATE.hasSubmittedRsvp) {
      highlightRsvpRequired();
      return;
    }

    // 1. Khi chuyển từ Trang 2 (index 1) sang trang sau (index > 1):
    // Cho dòng THE QUIET STRENGTH mờ dần biến mất từ giữa ra hai bên trước,
    // các dòng chữ khác giữ nguyên rồi chuyển cùng với trang
    if (STATE.currentSlideIndex === 1 && index > 1) {
      const coverSlide = DOM.slides[1];
      if (coverSlide) {
        isTransitioningCover = true;
        coverSlide.classList.add('exiting-title');
        clearTimeout(coverExitTimer);
        coverExitTimer = setTimeout(() => {
          isTransitioningCover = false;
          performSlideSwitch(index);
        }, 620);
        return;
      }
    }

    // 2. Khi chuyển từ Trang 3 (index 2) sang trang khác:
    // sao và ribbon2 đều hiển thị hiệu ứng biến mất khi chuyển trang,
    // chỉ có dòng chữ giữ nguyên cho đến khi chuyển hẳn sang trang khác
    if (STATE.currentSlideIndex === 2 && index !== 2) {
      const inviteSlide = DOM.slides[2];
      if (inviteSlide) {
        isTransitioningInvite = true;
        inviteSlide.classList.add('exiting-invite');
        clearTimeout(inviteExitTimer);
        inviteExitTimer = setTimeout(() => {
          isTransitioningInvite = false;
          performSlideSwitch(index);
        }, 580);
        return;
      }
    }

    // 3. Khi chuyển từ Trang 7 (index 6) sang trang khác:
    // Dòng chữ mất trước, ngôi sao và sign mất sau rồi mới chuyển trang
    if (STATE.currentSlideIndex === 6 && index !== 6) {
      const thankyouSlide = DOM.slides[6];
      if (thankyouSlide) {
        isTransitioningThankyou = true;
        // Bước 1: Dòng chữ mất trước
        thankyouSlide.classList.add('exiting-step1');

        clearTimeout(thankyouExitTimer);
        thankyouExitTimer = setTimeout(() => {
          // Bước 2: Ngôi sao và sign mất sau
          thankyouSlide.classList.add('exiting-step2');

          thankyouExitTimer = setTimeout(() => {
            isTransitioningThankyou = false;
            performSlideSwitch(index);
          }, 420);
        }, 380);
        return;
      }
    }

    // 4. Khi chuyển từ Trang 9 (index 8) về Trang 1 (replay):
    if (STATE.currentSlideIndex === 8 && index === 0) {
      const outroSlide = DOM.slides[8];
      if (outroSlide) {
        outroSlide.classList.add('exiting-title');
        setTimeout(() => {
          outroSlide.classList.remove('exiting-title');
          performSlideSwitch(index);
        }, 400);
        return;
      }
    }

    performSlideSwitch(index);
  }

  function nextSlide() {
    if (STATE.currentSlideIndex < STATE.totalSlides - 1) {
      goToSlide(STATE.currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (STATE.currentSlideIndex > 0) {
      goToSlide(STATE.currentSlideIndex - 1);
    }
  }

  // ========================================================================
  // 6. EVENT LISTENERS
  // ========================================================================
  function bindEvents() {
    // 0. Top Navigation Guidance Arrows (Previous / Next)
    if (DOM.btnNavPrev) {
      DOM.btnNavPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        prevSlide();
      });
      ['mouseenter', 'touchstart'].forEach(evt => {
        DOM.btnNavPrev.addEventListener(evt, () => {
          if (!DOM.btnNavPrev.classList.contains('hidden-nav')) {
            DOM.btnNavPrev.classList.add('nav-visible');
          }
        }, { passive: true });
      });
      DOM.btnNavPrev.addEventListener('mouseleave', () => {
        DOM.btnNavPrev.classList.remove('nav-visible');
      });
    }

    if (DOM.btnNavNext) {
      DOM.btnNavNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextSlide();
      });
      ['mouseenter', 'touchstart'].forEach(evt => {
        DOM.btnNavNext.addEventListener(evt, () => {
          if (!DOM.btnNavNext.classList.contains('hidden-nav')) {
            DOM.btnNavNext.classList.add('nav-visible');
          }
        }, { passive: true });
      });
      DOM.btnNavNext.addEventListener('mouseleave', () => {
        DOM.btnNavNext.classList.remove('nav-visible');
      });
    }

    // Hiển thị mũi tên dẫn hướng khi rê chuột vào khu vực gần 2 mép có mũi tên
    if (DOM.storyContainer) {
      DOM.storyContainer.addEventListener('mousemove', (e) => {
        const rect = DOM.storyContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isNearLeft = x <= 65;
        const isNearRight = x >= (rect.width - 65);

        if (isNearLeft && DOM.btnNavPrev && !DOM.btnNavPrev.classList.contains('hidden-nav')) {
          DOM.btnNavPrev.classList.add('nav-visible');
        } else if (!isNearLeft && DOM.btnNavPrev && !DOM.btnNavPrev.matches(':hover')) {
          DOM.btnNavPrev.classList.remove('nav-visible');
        }

        if (isNearRight && DOM.btnNavNext && !DOM.btnNavNext.classList.contains('hidden-nav')) {
          DOM.btnNavNext.classList.add('nav-visible');
        } else if (!isNearRight && DOM.btnNavNext && !DOM.btnNavNext.matches(':hover')) {
          DOM.btnNavNext.classList.remove('nav-visible');
        }
      }, { passive: true });
    }

    // 1. Click anywhere on screen to manually navigate slides
    if (DOM.storyContainer) {
      DOM.storyContainer.addEventListener('click', (e) => {
        // Trang 6 (RSVP): Khi bấm vào màn hình thì bình thường không có gì xảy ra,
        // không tự reset, không chuyển slide; chỉ trở về khi bấm nút Back,
        // và chỉ chuyển trang sau khi user bấm Yes/No và submit ghi nhận lời chúc.
        if (STATE.currentSlideIndex === 5) {
          return;
        }

        // Do NOT advance slide if clicking on an interactive button, input, hotspot, or modal
        if (e.target.closest('button, a, input, select, textarea, .btn-story-nav, .rsvp-inline-step, .hotspot, .hotspot-choice, .ceremony-link-trigger, .video-trigger-hotspot, .video-modal-overlay, .replay-story-hotspot, .btn-close-video')) {
          return;
        }

        // On Slide 0, clicking ANYWHERE unties the bow and opens Slide 1
        if (STATE.currentSlideIndex === 0) {
          clearTimeout(introHintTimer);
          if (DOM.introTapHint) DOM.introTapHint.classList.remove('revealed');
          nextSlide();
          return;
        }

        const rect = DOM.storyContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        if (clickX < width * 0.28) {
          prevSlide(); // Left 28%: Previous slide
        } else {
          nextSlide(); // Right 72%: Next slide
        }
      });
    }

    // 1.1 Responsive Scale Window Events
    window.addEventListener('resize', updateStoryScale, { passive: true });
    window.addEventListener('orientationchange', updateStoryScale, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateStoryScale, { passive: true });
    }

    // 2. Touch swipe gestures on mobile
    if (DOM.storyContainer) {
      DOM.storyContainer.addEventListener('touchstart', (e) => {
        STATE.touchStartX = e.touches[0].clientX;
        STATE.touchStartY = e.touches[0].clientY;
      }, { passive: true });

      DOM.storyContainer.addEventListener('touchend', (e) => {
        if (STATE.currentSlideIndex === 5) return; // Không swipe qua trang khác trên slide RSVP
        if (e.target.closest('button, a, input, select, textarea, .rsvp-inline-step, .ceremony-link-trigger, .video-modal-overlay')) return;

        const deltaX = e.changedTouches[0].clientX - STATE.touchStartX;
        const deltaY = e.changedTouches[0].clientY - STATE.touchStartY;

        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          if (deltaX < 0) nextSlide();
          else prevSlide();
        }
      }, { passive: true });
    }

    // 3. Keyboard Navigation (Desktop)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    });

    // 4. Ceremony Hotspots (Slide index 4)
    if (DOM.hotspotDateTime) {
      DOM.hotspotDateTime.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAddToCalendar();
      });
    }

    if (DOM.hotspotVenue) {
      DOM.hotspotVenue.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(CONFIG.event.mapsUrl, '_blank');
      });
    }

    // 5. RSVP Choice Hotspots (Slide index 5)
    if (DOM.btnRsvpYes) {
      DOM.btnRsvpYes.addEventListener('click', (e) => {
        e.stopPropagation();
        handleRsvpChoice('Yes');
      });
    }

    if (DOM.btnRsvpNo) {
      DOM.btnRsvpNo.addEventListener('click', (e) => {
        e.stopPropagation();
        handleRsvpChoice('No');
      });
    }

    if (DOM.btnRsvpBack) {
      DOM.btnRsvpBack.addEventListener('click', (e) => {
        e.stopPropagation();
        resetRsvpToInitial();
      });
    }

    if (DOM.btnRsvpChangeResponse) {
      DOM.btnRsvpChangeResponse.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (DOM.rsvpCompletedView) DOM.rsvpCompletedView.classList.add('hidden');
        if (DOM.rsvpChoicesGroup) DOM.rsvpChoicesGroup.classList.remove('hidden');

        // Mở thẳng màn hình điều chỉnh tương ứng với lựa chọn hiện tại (Yes hoặc No)
        const currentChoice = STATE.selectedAttendance || 'Yes';
        handleRsvpChoice(currentChoice);
      });
    }

    if (DOM.rsvpInlineEmail) {
      DOM.rsvpInlineEmail.addEventListener('input', () => {
        DOM.rsvpInlineEmail.classList.remove('input-error');
      });
      DOM.rsvpInlineEmail.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (DOM.rsvpInlineMessage) {
            DOM.rsvpInlineMessage.focus();
          } else {
            handleInlineRsvpSubmit();
          }
        }
      });
    }

    if (DOM.btnRsvpInlineSubmit) {
      DOM.btnRsvpInlineSubmit.addEventListener('click', (e) => {
        e.stopPropagation();
        handleInlineRsvpSubmit();
      });
    }

    // 6. Video Modal Hotspots (Slide index 7)
    if (DOM.btnTriggerVideo) {
      DOM.btnTriggerVideo.addEventListener('click', (e) => {
        e.stopPropagation();
        openVideoModal();
      });
    }

    if (DOM.btnCloseVideo) {
      DOM.btnCloseVideo.addEventListener('click', (e) => {
        e.stopPropagation();
        closeVideoModal();
      });
    }

    // 7. Replay Story (Slide index 8)
    if (DOM.btnReplayStory) {
      DOM.btnReplayStory.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(0);
      });
    }
  }

  // ========================================================================
  // 7. INLINE RSVP (NO POPUPS, SAME CARD & FONT, GOOGLE SHEETS)
  // ========================================================================
  function resetRsvpToInitial() {
    if (DOM.rsvpInlineStep) {
      DOM.rsvpInlineStep.classList.remove('revealed');
      DOM.rsvpInlineStep.classList.add('hidden');
    }
    if (DOM.rsvpInlineFeedback) {
      DOM.rsvpInlineFeedback.classList.remove('revealed');
      DOM.rsvpInlineFeedback.classList.add('hidden');
    }
    if (DOM.rsvpFlowInitial) {
      DOM.rsvpFlowInitial.classList.remove('hidden-flow');
    }
    if (DOM.btnRsvpYes) DOM.btnRsvpYes.classList.remove('selected');
    if (DOM.btnRsvpNo) DOM.btnRsvpNo.classList.remove('selected');
    STATE.selectedAttendance = null;
  }

  function handleRsvpChoice(attendance) {
    STATE.selectedAttendance = attendance;

    if (DOM.btnRsvpYes) DOM.btnRsvpYes.classList.toggle('selected', attendance === 'Yes');
    if (DOM.btnRsvpNo) DOM.btnRsvpNo.classList.toggle('selected', attendance === 'No');

    // Chuyển từ câu hỏi ban đầu sang bước nhập thông tin trực tiếp trên thiệp
    if (DOM.rsvpFlowInitial) {
      DOM.rsvpFlowInitial.classList.add('hidden-flow');
    }

    if (DOM.rsvpInlineStep && DOM.rsvpStepPrompt) {
      DOM.rsvpInlineStep.classList.remove('hidden');
      void DOM.rsvpInlineStep.offsetHeight;
      DOM.rsvpInlineStep.classList.add('revealed');

      const isKnown = STATE.guestName && STATE.guestName !== 'Name';
      const nameDisp = isKnown ? ` <strong>${escapeHtml(STATE.guestName)}</strong>` : '';

      if (attendance === 'Yes') {
        // Khi chọn Yes: 1 khung hỏi Gmail, 1 khung hỏi note/message
        if (DOM.rsvpFieldsYes) DOM.rsvpFieldsYes.classList.remove('hidden');
        if (DOM.rsvpFieldsNo) DOM.rsvpFieldsNo.classList.add('hidden');

        DOM.rsvpStepPrompt.innerHTML = `Thank you${nameDisp}! Looking forward to seeing you at the ceremony. Would you like to leave a message for Phuong?`;
        if (DOM.btnRsvpInlineSubmit) {
          DOM.btnRsvpInlineSubmit.querySelector('span').textContent = 'Confirm & Send';
        }
        if (DOM.rsvpInlineEmail) {
          DOM.rsvpInlineEmail.focus();
        }
      } else {
        // Khi chọn No: 1 khung gửi wish
        if (DOM.rsvpFieldsYes) DOM.rsvpFieldsYes.classList.add('hidden');
        if (DOM.rsvpFieldsNo) DOM.rsvpFieldsNo.classList.remove('hidden');

        DOM.rsvpStepPrompt.innerHTML = `So sorry you can't make it${nameDisp}! Would you like to leave a wish for Phuong?`;
        if (DOM.btnRsvpInlineSubmit) {
          DOM.btnRsvpInlineSubmit.querySelector('span').textContent = 'Send Wishes';
        }
        if (DOM.rsvpInlineWish) {
          DOM.rsvpInlineWish.focus();
        }
      }
    }
  }

  async function handleInlineRsvpSubmit() {
    const attendance = STATE.selectedAttendance || 'Yes';
    const email = DOM.rsvpInlineEmail ? DOM.rsvpInlineEmail.value.trim() : '';
    const message = attendance === 'Yes' 
      ? (DOM.rsvpInlineMessage ? DOM.rsvpInlineMessage.value.trim() : '')
      : (DOM.rsvpInlineWish ? DOM.rsvpInlineWish.value.trim() : '');
    const guestName = STATE.guestName || 'Name';

    // Bắt buộc nhập Email hợp lệ khi chọn Yes (message là optional)
    if (attendance === 'Yes') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        showToast("Please enter your Gmail address to receive confirmation ✨");
        if (DOM.rsvpInlineEmail) {
          DOM.rsvpInlineEmail.focus();
          DOM.rsvpInlineEmail.classList.remove('input-error');
          void DOM.rsvpInlineEmail.offsetHeight;
          DOM.rsvpInlineEmail.classList.add('input-error');
        }
        return;
      }
      if (!emailRegex.test(email)) {
        showToast("Please enter a valid email address (e.g. name@gmail.com) ✨");
        if (DOM.rsvpInlineEmail) {
          DOM.rsvpInlineEmail.focus();
          DOM.rsvpInlineEmail.classList.remove('input-error');
          void DOM.rsvpInlineEmail.offsetHeight;
          DOM.rsvpInlineEmail.classList.add('input-error');
        }
        return;
      }
    }

    const payload = {
      timestamp: new Date().toISOString(),
      guestName: guestName,
      attendance: attendance,
      email: email,
      message: message,
      sourceUrl: window.location.href
    };

    // Ghi nhận đã trả lời RSVP để cho phép chuyển sang trang tiếp theo
    STATE.hasSubmittedRsvp = true;

    // Save to LocalStorage
    try {
      localStorage.setItem('graduation_rsvp_submitted', 'true');
      localStorage.setItem('graduation_rsvp_data', JSON.stringify(payload));
    } catch (err) {
      console.warn(err);
    }

    // Submit to Google Sheets webhook if configured (asynchronous background)
    if (CONFIG.googleSheetScriptUrl && CONFIG.googleSheetScriptUrl.startsWith('http')) {
      try {
        payload.action = 'rsvp';
        fetch(CONFIG.googleSheetScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn(err));
      } catch (networkErr) {
        console.warn('Google Sheet submission warning:', networkErr);
      }
    }

    // Cập nhật giao diện Slide 5 sang trạng thái đã ghi nhận (kèm nút Thay đổi câu trả lời)
    updateRsvpCompletedUI(attendance);

    // Sau khi điền rsvp thì chuyển sang trang sau luôn không cần hiển thị thêm gì cả
    nextSlide();
  }

  function updateRsvpCompletedUI(attendance) {
    if (DOM.rsvpCompletedView) {
      DOM.rsvpCompletedView.classList.remove('hidden');
    }
    if (DOM.rsvpRecordedChoice) {
      DOM.rsvpRecordedChoice.textContent = attendance === 'No' ? 'No' : 'Yes';
    }
    if (DOM.rsvpChoicesGroup) {
      DOM.rsvpChoicesGroup.classList.add('hidden');
    }
    if (DOM.rsvpFlowInitial) {
      DOM.rsvpFlowInitial.classList.remove('hidden-flow');
    }
    if (DOM.rsvpInlineStep) {
      DOM.rsvpInlineStep.classList.add('hidden');
      DOM.rsvpInlineStep.classList.remove('revealed');
    }
    if (DOM.rsvpInlineFeedback) {
      DOM.rsvpInlineFeedback.classList.add('hidden');
    }
  }

  function checkStoredRsvp() {
    try {
      const isSubmitted = localStorage.getItem('graduation_rsvp_submitted');
      const stored = localStorage.getItem('graduation_rsvp_data');

      if (isSubmitted === 'true' || stored) {
        STATE.hasSubmittedRsvp = true;
      }

      if (stored) {
        const data = JSON.parse(stored);
        STATE.selectedAttendance = data.attendance;
        if (DOM.btnRsvpYes) DOM.btnRsvpYes.classList.toggle('selected', data.attendance === 'Yes');
        if (DOM.btnRsvpNo) DOM.btnRsvpNo.classList.toggle('selected', data.attendance === 'No');

        // Điền sẵn thông tin cũ nếu có để người dùng tiện chỉnh sửa
        if (data.email && DOM.rsvpInlineEmail) {
          DOM.rsvpInlineEmail.value = data.email;
        }
        if (data.attendance === 'Yes' && data.message && DOM.rsvpInlineMessage) {
          DOM.rsvpInlineMessage.value = data.message;
        } else if (data.attendance === 'No' && data.message && DOM.rsvpInlineWish) {
          DOM.rsvpInlineWish.value = data.message;
        }

        // Hiển thị trạng thái đã trả lời kèm nút thay đổi, không hiện khung nhập cũ
        updateRsvpCompletedUI(data.attendance);
      }

      // Kiểm tra trạng thái RSVP từ Google Sheets nếu có cấu hình webhook
      if (CONFIG.googleSheetScriptUrl && CONFIG.googleSheetScriptUrl.startsWith('http')) {
        const guestQuery = encodeURIComponent(STATE.guestName || '');
        fetch(`${CONFIG.googleSheetScriptUrl}?action=check&guest=${guestQuery}`)
          .then(res => res.json())
          .then(result => {
            if (result && result.hasRsvp) {
              STATE.hasSubmittedRsvp = true;
              localStorage.setItem('graduation_rsvp_submitted', 'true');
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }

  // ========================================================================
  // 8. VIDEO MODAL (Slide index 7 / The/9.png)
  // ========================================================================
  function openVideoModal() {
    if (DOM.videoModal && DOM.memoryVideo) {
      DOM.videoModal.classList.remove('hidden');
      DOM.memoryVideo.currentTime = 0;
      DOM.memoryVideo.play().catch(e => console.warn(e));
    }
  }

  function closeVideoModal() {
    if (DOM.videoModal && DOM.memoryVideo) {
      DOM.memoryVideo.pause();
      DOM.videoModal.classList.add('hidden');
    }
  }

  // ========================================================================
  // 9. ADD TO CALENDAR (.ICS FILE GENERATION)
  // ========================================================================
  function handleAddToCalendar() {
    const { title, details, location, startDate, endDate } = CONFIG.event;

    try {
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//The Quiet Strength//Graduation Invitation//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `SUMMARY:${title}`,
        `DESCRIPTION:${details}`,
        `LOCATION:${location}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", "Phuong_Graduation_Ceremony.ics");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("📅 Calendar event downloaded!");
    } catch (e) {
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
      window.open(googleCalUrl, '_blank');
    }
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================
  let toastTimer = null;
  function showToast(message) {
    if (!DOM.toastBox) return;
    DOM.toastBox.textContent = message;
    DOM.toastBox.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.toastBox.classList.remove('show');
    }, 2800);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
