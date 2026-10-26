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
      mapsUrl: "https://maps.google.com/?q=Dai+Hoc+FPT+TPHCM+Khu+Cong+Nghe+Cao+Long+Thanh+My+Thu+Duc"
    }
  };

  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  const DOM = {
    storyContainer: document.getElementById('storyContainer'),
    introStars: document.getElementById('introStars'),
    slides: Array.from(document.querySelectorAll('.slide-item')),

    // Slide 1 (Cover): Crisp Title, Typewriter Script & Blur Meta
    coverHeading: document.getElementById('coverHeading'),
    coverLeadThe: document.getElementById('coverLeadThe'),
    typewriterScriptText: document.getElementById('typewriterScriptText'),
    typewriterCursor: document.getElementById('typewriterCursor'),
    coverSubtitle: document.getElementById('coverSubtitle'),
    coverFooterMeta: document.getElementById('coverFooterMeta'),

    // Slide 2 (Invite): Sequential Blur-to-Clear Elements
    inviteLines: [
      document.querySelector('.invite-line.line-1'),
      document.querySelector('.invite-line.line-2'),
      document.querySelector('.invite-line.line-3'),
      document.querySelector('.invite-star-sparkle')
    ],

    // Slide 3 (Timeline): Vertical Line & 4 Star Milestones
    timelineVerticalLine: document.getElementById('timelineVerticalLine'),
    milestoneItems: Array.from(document.querySelectorAll('.milestone-item')),

    // Slide 4 (Ceremony - The/6.png): Personalization & Hotspots
    customGuestOverlay: document.getElementById('customGuestOverlay'),
    customGuestText: document.getElementById('customGuestText'),
    hotspotDateTime: document.getElementById('hotspotDateTime'),
    hotspotVenue: document.getElementById('hotspotVenue'),

    // Slide 5 (RSVP - The/7.png): Yes/No Hotspots & Sheet
    btnRsvpYes: document.getElementById('btnRsvpYes'),
    btnRsvpNo: document.getElementById('btnRsvpNo'),
    rsvpStatusBadge: document.getElementById('rsvpStatusBadge'),
    rsvpBadgeText: document.getElementById('rsvpBadgeText'),
    rsvpSheet: document.getElementById('rsvpSheet'),
    sheetBackdrop: document.getElementById('sheetBackdrop'),
    sheetTitle: document.getElementById('sheetTitle'),
    sheetSub: document.getElementById('sheetSub'),
    sheetRsvpForm: document.getElementById('sheetRsvpForm'),
    rsvpInputName: document.getElementById('rsvpInputName'),
    rsvpGuestCountGroup: document.getElementById('rsvpGuestCountGroup'),
    rsvpInputCount: document.getElementById('rsvpInputCount'),
    rsvpInputMessage: document.getElementById('rsvpInputMessage'),
    btnCancelSheet: document.getElementById('btnCancelSheet'),
    btnSubmitSheet: document.getElementById('btnSubmitSheet'),
    sheetSuccessState: document.getElementById('sheetSuccessState'),
    successDetailText: document.getElementById('successDetailText'),
    btnCloseSuccess: document.getElementById('btnCloseSuccess'),

    // Slide 7 (Video - The/9.png): Play Trigger & Modal
    btnTriggerVideo: document.getElementById('btnTriggerVideo'),
    videoModal: document.getElementById('videoModal'),
    memoryVideo: document.getElementById('memoryVideo'),
    btnCloseVideo: document.getElementById('btnCloseVideo'),

    // Slide 8 (Outro - The/10.png): Phone & Replay
    hotspotPhone: document.getElementById('hotspotPhone'),
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
    touchStartX: 0,
    touchStartY: 0
  };

  // Timers
  let typewriterTimers = [];
  let inviteTimers = [];
  let timelineTimers = [];

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  function init() {
    setupGuestPersonalization();
    createIntroStars();
    bindEvents();
    checkStoredRsvp();
  }

  // ========================================================================
  // 1. GUEST PERSONALIZATION VIA URL QUERY (?to=... or ?name=...)
  // ========================================================================
  function setupGuestPersonalization() {
    const params = new URLSearchParams(window.location.search);
    const customName = params.get('to') || params.get('name') || params.get('guest');

    if (customName && customName.trim() !== '') {
      STATE.guestName = customName.trim();

      // Show customized greeting overlay on Ceremony slide (Slide index 4)
      if (DOM.customGuestOverlay && DOM.customGuestText) {
        DOM.customGuestText.textContent = `Dear ${STATE.guestName}.`;
        DOM.customGuestOverlay.classList.remove('hidden');
      }
    }

    if (DOM.rsvpInputName) {
      DOM.rsvpInputName.value = STATE.guestName !== CONFIG.defaultGuestName ? STATE.guestName : '';
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

  // --- Slide 2: Sequential Blur-to-Clear for Invitation Lines ---
  function startInviteAnimation() {
    inviteTimers.forEach(t => clearTimeout(t));
    inviteTimers = [];

    DOM.inviteLines.forEach(el => {
      if (el) el.classList.remove('revealed');
    });

    const delays = [200, 600, 1050, 1500];
    DOM.inviteLines.forEach((el, idx) => {
      if (!el) return;
      inviteTimers.push(setTimeout(() => {
        if (STATE.currentSlideIndex !== 2) return;
        el.classList.add('revealed');
      }, delays[idx]));
    });
  }

  // --- Slide 3: Unified Star Timeline (Glowing Line Drawing + Star Pulse & Blur-to-Clear) ---
  function startTimelineAnimation() {
    timelineTimers.forEach(t => clearTimeout(t));
    timelineTimers = [];

    const lineEl = DOM.timelineVerticalLine;
    const milestones = DOM.milestoneItems;

    // Reset initial state
    if (lineEl) {
      lineEl.style.transition = 'none';
      lineEl.style.height = '0%';
    }
    milestones.forEach(m => m.classList.remove('revealed'));

    // Force DOM reflow
    if (lineEl) void lineEl.offsetHeight;

    // Start line drawing downward from top star to bottom star
    timelineTimers.push(setTimeout(() => {
      if (STATE.currentSlideIndex !== 3) return;
      if (lineEl) {
        lineEl.style.transition = 'height 2.4s cubic-bezier(0.25, 1, 0.5, 1)';
        lineEl.style.height = '100%';
      }
    }, 120));

    // As line travels down, each star lights up and its milestone text reveals from blur to clear
    const milestoneDelays = [260, 860, 1460, 2060];
    milestones.forEach((item, idx) => {
      const delay = milestoneDelays[idx] || (idx * 600 + 300);
      timelineTimers.push(setTimeout(() => {
        if (STATE.currentSlideIndex !== 3) return;
        item.classList.add('revealed');
      }, delay));
    });
  }

  // ========================================================================
  // 5. MANUAL SCREEN-TAP NAVIGATION (100% CANVA CROSS-DISSOLVE)
  // ========================================================================
  function goToSlide(index) {
    if (index < 0 || index >= STATE.totalSlides) return;

    // Untie flourish when transitioning from Slide 0 (Bow) to Slide 1 (Cover)
    if (STATE.currentSlideIndex === 0 && index === 1) {
      triggerUntieSparkles();
    }

    STATE.currentSlideIndex = index;

    DOM.slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Trigger per-slide animations
    if (index === 1) {
      startCoverTypewriter();
    } else if (index === 2) {
      startInviteAnimation();
    } else if (index === 3) {
      startTimelineAnimation();
    }

    // If leaving video slide (Slide index 7), close video player
    if (index !== 7 && DOM.videoModal && !DOM.videoModal.classList.contains('hidden')) {
      closeVideoModal();
    }
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
    // 1. Click anywhere on screen to manually navigate slides
    if (DOM.storyContainer) {
      DOM.storyContainer.addEventListener('click', (e) => {
        // Do NOT advance slide if clicking on an interactive button, input, hotspot, or modal
        if (e.target.closest('button, a, input, select, textarea, .hotspot, .hotspot-choice, .video-trigger-hotspot, .rsvp-bottom-sheet, .video-modal-overlay, .replay-story-hotspot, .btn-close-video')) {
          return;
        }

        // On Slide 0, clicking ANYWHERE unties the bow and opens Slide 1
        if (STATE.currentSlideIndex === 0) {
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

    // 2. Touch swipe gestures on mobile
    if (DOM.storyContainer) {
      DOM.storyContainer.addEventListener('touchstart', (e) => {
        STATE.touchStartX = e.touches[0].clientX;
        STATE.touchStartY = e.touches[0].clientY;
      }, { passive: true });

      DOM.storyContainer.addEventListener('touchend', (e) => {
        if (e.target.closest('button, a, input, select, textarea, .rsvp-bottom-sheet, .video-modal-overlay')) return;

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
        openRsvpSheet('Yes');
      });
    }

    if (DOM.btnRsvpNo) {
      DOM.btnRsvpNo.addEventListener('click', (e) => {
        e.stopPropagation();
        openRsvpSheet('No');
      });
    }

    // Bottom sheet interactions
    if (DOM.btnCancelSheet) {
      DOM.btnCancelSheet.addEventListener('click', (e) => {
        e.stopPropagation();
        closeRsvpSheet();
      });
    }
    if (DOM.sheetBackdrop) {
      DOM.sheetBackdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeRsvpSheet();
      });
    }
    if (DOM.btnCloseSuccess) {
      DOM.btnCloseSuccess.addEventListener('click', (e) => {
        e.stopPropagation();
        closeRsvpSheet();
      });
    }
    if (DOM.sheetRsvpForm) {
      DOM.sheetRsvpForm.addEventListener('submit', handleRsvpSubmit);
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
  // 7. RSVP BOTTOM SHEET & GOOGLE SHEETS SUBMISSION
  // ========================================================================
  function openRsvpSheet(attendance) {
    STATE.selectedAttendance = attendance;

    if (DOM.btnRsvpYes) DOM.btnRsvpYes.classList.toggle('selected', attendance === 'Yes');
    if (DOM.btnRsvpNo) DOM.btnRsvpNo.classList.toggle('selected', attendance === 'No');

    if (attendance === 'Yes') {
      DOM.sheetTitle.textContent = "RSVP: Yes, I will attend ✨";
      DOM.sheetSub.textContent = "Phuong is so happy you'll join! Please confirm your details below:";
      if (DOM.rsvpGuestCountGroup) DOM.rsvpGuestCountGroup.style.display = 'flex';
    } else {
      DOM.sheetTitle.textContent = "RSVP: Cannot Make It";
      DOM.sheetSub.textContent = "Phuong will miss you! You can leave a warm wish or message:";
      if (DOM.rsvpGuestCountGroup) DOM.rsvpGuestCountGroup.style.display = 'none';
    }

    if (DOM.sheetRsvpForm) DOM.sheetRsvpForm.classList.remove('hidden');
    if (DOM.sheetSuccessState) DOM.sheetSuccessState.classList.add('hidden');
    if (DOM.rsvpSheet) DOM.rsvpSheet.classList.remove('hidden');
  }

  function closeRsvpSheet() {
    if (DOM.rsvpSheet) DOM.rsvpSheet.classList.add('hidden');
  }

  async function handleRsvpSubmit(e) {
    e.preventDefault();

    const guestName = DOM.rsvpInputName.value.trim() || STATE.guestName;
    const attendance = STATE.selectedAttendance;
    const guestCount = attendance === 'Yes' ? (DOM.rsvpInputCount.value || '1') : '0';
    const message = DOM.rsvpInputMessage.value.trim();

    if (!guestName) {
      showToast('Please enter your name');
      DOM.rsvpInputName.focus();
      return;
    }

    // Loading State
    const submitBtn = DOM.btnSubmitSheet;
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.btn-spinner');
    if (btnText) btnText.textContent = 'Sending...';
    if (spinner) spinner.classList.remove('hidden');
    submitBtn.disabled = true;

    const payload = {
      timestamp: new Date().toISOString(),
      guestName: guestName,
      attendance: attendance,
      guestCount: guestCount,
      message: message,
      sourceUrl: window.location.href
    };

    // Save to LocalStorage
    try {
      localStorage.setItem('graduation_rsvp_data', JSON.stringify(payload));
    } catch (err) {
      console.warn(err);
    }

    // Submit to Google Sheets Webhook
    if (CONFIG.googleSheetScriptUrl && CONFIG.googleSheetScriptUrl.startsWith('http')) {
      try {
        await fetch(CONFIG.googleSheetScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (networkErr) {
        console.warn('Google Sheet submission warning:', networkErr);
      }
    }

    setTimeout(() => {
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Submit RSVP';
      if (spinner) spinner.classList.add('hidden');

      // Show success in bottom sheet
      if (DOM.sheetRsvpForm) DOM.sheetRsvpForm.classList.add('hidden');
      if (DOM.sheetSuccessState) {
        DOM.sheetSuccessState.classList.remove('hidden');
        if (DOM.successDetailText) {
          DOM.successDetailText.innerHTML = `<strong>${escapeHtml(guestName)}</strong>, your response has been saved to Google Sheets.<br>Thank you so much!`;
        }
      }

      // Update badge on slide
      updateRsvpBadge(attendance, guestName);
    }, 500);
  }

  function updateRsvpBadge(attendance, name) {
    if (DOM.rsvpStatusBadge && DOM.rsvpBadgeText) {
      DOM.rsvpBadgeText.textContent = `✓ ${name}: Responded ${attendance}`;
      DOM.rsvpStatusBadge.classList.remove('hidden');
    }
  }

  function checkStoredRsvp() {
    try {
      const stored = localStorage.getItem('graduation_rsvp_data');
      if (stored) {
        const data = JSON.parse(stored);
        updateRsvpBadge(data.attendance, data.guestName);
        if (DOM.btnRsvpYes) DOM.btnRsvpYes.classList.toggle('selected', data.attendance === 'Yes');
        if (DOM.btnRsvpNo) DOM.btnRsvpNo.classList.toggle('selected', data.attendance === 'No');
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
