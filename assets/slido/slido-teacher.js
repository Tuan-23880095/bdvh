/**
 * slido-teacher.js — Trình điều khiển Sân khấu Trình chiếu Slido Toán 7
 * ThS. Đinh Quốc Tuấn — Bồi Dưỡng Văn Hóa HCMUS
 */

(function () {
  const STUDENT_URL = 'https://bdvh.diemdanhsv.com/sv-toan7.html';
  const EXAM_CODE = 'toan7';

  let currentSlideIdx = 0;
  let isLocked = false;
  let pollInterval = null;
  let slides = [];

  // Tạo mã QR bằng QRCode.js hoặc Fallback SVG
  function createQrSvg(url, sizeLevel) {
    const size = sizeLevel === 3 ? 180 : 80;
    const holderId = `qr-holder-${Math.random().toString(36).substr(2, 9)}`;
    setTimeout(() => {
      const el = document.getElementById(holderId);
      if (el && window.QRCode) {
        el.innerHTML = '';
        new QRCode(el, {
          text: url,
          width: size,
          height: size,
          colorDark: "#102A43",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }, 40);
    return `<div id="${holderId}" style="width:${size}px; height:${size}px; display:inline-block;"></div>`;
  }

  // Khởi tạo danh sách Slide
  function initSlideDeck() {
    slides = [];

    // 1. Slide Bìa
    slides.push({
      type: 'cover',
      title: 'Bìa Trình Chiếu Slido Toán 7',
      render: () => `
        <div class="s-body" style="align-items:center; justify-content:center; text-align:center;">
          <div class="s-kicker sec-q" style="margin: 0 auto 16px auto;">
            🏛️ BỒI DƯỠNG VĂN HÓA HCMUS · ĐẠI HỌC KHOA HỌC TỰ NHIÊN
          </div>
          <h1 class="s-title" style="font-size: 52px; margin-bottom: 12px; color: var(--lam-dam);">
            Toán 7 · Đề Kiểm Tra Cuối Học Kỳ I
          </h1>
          <p style="font-size: 22px; color: #475569; max-width: 900px; line-height: 1.5; margin: 0 auto 28px auto;">
            Hệ thống trình chiếu tương tác Slido kết hợp bình chọn trực tiếp, công bố đáp án và giảng giải kiến thức chuyên sâu.
          </p>

          <div style="display:flex; align-items:center; justify-content:center; gap: 40px; margin-top: 10px;">
            <div style="display:flex; align-items:center; gap: 16px; background:#fff; padding: 14px 24px; border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 4px 16px rgba(0,0,0,0.05); text-align: left;">
              <div style="width: 52px; height: 52px; border-radius: 12px; background: var(--luc); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:22px;">QT</div>
              <div>
                <b style="font-size: 20px; font-family: var(--serif); display:block; color: var(--muc);">ThS. Đinh Quốc Tuấn</b>
                <span style="font-size: 14px; color: #64748B;">Giảng viên Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM</span>
              </div>
            </div>

            <div style="background:#fff; padding: 16px 24px; border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 4px 16px rgba(0,0,0,0.05); display:flex; align-items:center; gap: 18px;">
              <div class="qr-mini" style="width: 100px; height: 100px;">${createQrSvg(STUDENT_URL, 2)}</div>
              <div style="text-align: left;">
                <b style="font-size: 16px; color: var(--muc); display:block;">Học sinh vào bình chọn:</b>
                <code style="font-size: 15px; color: var(--lam); font-weight:700; background:#E2E8F0; padding:4px 10px; border-radius:6px; display:inline-block; margin-top:6px;">${STUDENT_URL.replace('https://', '')}</code>
              </div>
            </div>
          </div>
        </div>
      `
    });

    // 2. Tạo 3 slide cho mỗi câu hỏi
    const questions = window.TOAN7_QUESTIONS || [];
    questions.forEach((q) => {
      // Slide 1: Đề bài + Slido Poll
      slides.push({
        type: 'question',
        q_id: q.id,
        title: `Câu ${q.id}: ${q.title} (Đề bài & Slido)`,
        render: () => `
          <div class="s-kicker sec-q">📝 CÂU HỎI ${q.id} / ${questions.length} · BÌNH CHỌN TRỰC TIẾP SLIDO</div>
          <h2 class="s-title"><b>Câu ${q.id}:</b> ${q.desc}</h2>

          <div class="slido-layout">
            <!-- Cột trái: Đề và phương án -->
            <div class="q-pane">
              ${q.svg ? `<div style="text-align:center; margin-bottom:10px; background:#fff; padding:6px; border-radius:8px; border:1px solid var(--line);">${q.svg}</div>` : ''}
              <div class="opts-grid ${q.opts.some(o => o.t.length > 30) ? 'single-col' : ''}">
                ${q.opts.map(o => `
                  <div class="opt-box" id="opt-box-${q.id}-${o.k}">
                    <div class="opt-label">${o.k}</div>
                    <div class="opt-text">${o.t}</div>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top:auto; font-size:16px; color:#64748B; font-style:italic; padding-top:12px;">
                Học sinh chọn đáp án trên điện thoại ➔ Bấm <b>[→]</b> hoặc <b>[Space]</b> để chốt đáp án.
              </div>
            </div>

            <!-- Cột phải: Thống kê Slido thời gian thực -->
            <div class="slido-pane">
              <div class="slido-head">
                <span class="live-pill active" id="live-status-pill">
                  <span class="live-dot"></span> ĐANG BÌNH CHỌN
                </span>
                <span class="slido-stat" id="slido-total-votes">0 bạn đã nộp</span>
              </div>

              <div class="slido-bars">
                ${['A', 'B', 'C', 'D'].map(k => `
                  <div class="bar-row">
                    <div class="bar-meta">
                      <span>Phương án ${k}</span>
                      <span id="pct-${k}">0% (0)</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill fill-${k}" id="fill-${k}"></div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="slido-join">
                <div class="qr-mini">${createQrSvg(STUDENT_URL, 1)}</div>
                <div class="join-info">
                  <b>Vào làm trực tiếp:</b>
                  <code>${STUDENT_URL.replace('https://', '')}</code>
                </div>
              </div>
            </div>
          </div>
        `
      });

      // Slide 2: Đáp án chính xác
      slides.push({
        type: 'answer',
        q_id: q.id,
        title: `Câu ${q.id}: Đáp án chính xác (${q.correct})`,
        render: () => `
          <div class="s-kicker sec-ans">🎯 ĐÁP ÁN CHÍNH XÁC · BƯỚC 2/3 (CHỐT KẾT QUẢ)</div>
          <h2 class="s-title"><b>Câu ${q.id}:</b> ${q.desc}</h2>

          <div class="slido-layout">
            <!-- Cột trái: Phương án với đáp án đúng được highlight -->
            <div class="q-pane">
              ${q.svg ? `<div style="text-align:center; margin-bottom:10px; background:#fff; padding:6px; border-radius:8px; border:1px solid var(--line);">${q.svg}</div>` : ''}
              <div class="opts-grid ${q.opts.some(o => o.t.length > 30) ? 'single-col' : ''}">
                ${q.opts.map(o => `
                  <div class="opt-box ${o.k === q.correct ? 'correct' : ''}">
                    <div class="opt-label">${o.k} ${o.k === q.correct ? '✓' : ''}</div>
                    <div class="opt-text">${o.t}</div>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top:auto; background:#FEF3C7; border:1.5px solid #F59E0B; border-radius:10px; padding:12px 18px; display:flex; align-items:center; justify-content:space-between;">
                <span style="font-weight:700; color:#B45309; font-size:18px;">
                  ✓ PHƯƠNG ÁN ĐÚNG: ${q.correct}
                </span>
                <span style="font-size:15px; color:#92400E; font-weight:600;">
                  Bấm [→] để xem Lời giải chi tiết ➔
                </span>
              </div>
            </div>

            <!-- Cột phải: Kết quả lớp học -->
            <div class="slido-pane">
              <div class="slido-head">
                <span class="live-pill" style="background:#FEE2E2; color:#DC2626; font-weight:700;">
                  🔒 ĐÃ CHỐT ĐÁP ÁN
                </span>
                <span class="slido-stat" id="slido-total-votes-ans">Kết quả khảo sát lớp</span>
              </div>

              <div class="slido-bars">
                ${['A', 'B', 'C', 'D'].map(k => `
                  <div class="bar-row">
                    <div class="bar-meta">
                      <span ${k === q.correct ? 'style="color:var(--luc); font-weight:800;"' : ''}>
                        ${k === q.correct ? '⭐ ' : ''}Phương án ${k} ${k === q.correct ? '(Đúng)' : ''}
                      </span>
                      <span id="pct-ans-${k}">0% (0)</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill fill-${k}" id="fill-ans-${k}" ${k === q.correct ? 'style="border:2px solid var(--luc);"' : ''}></div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top:auto; padding:12px; background:#F8FAFC; border-radius:8px; border:1px solid var(--line); font-size:14px; color:#64748B; text-align:center;">
                Điện thoại học sinh đã tự động hiển thị kết quả chúc mừng và giải thích.
              </div>
            </div>
          </div>
        `
      });

      // Slide 3: Lời giải chi tiết + Kiến thức liên quan
      slides.push({
        type: 'explain',
        q_id: q.id,
        title: `Câu ${q.id}: Lời giải chi tiết & Trọng tâm kiến thức`,
        render: () => `
          <div class="s-kicker sec-exp">💡 HƯỚNG DẪN GIẢI & TRỌNG TÂM KIẾN THỨC · BƯỚC 3/3</div>
          <h2 class="s-title"><b>Câu ${q.id}:</b> ${q.desc}</h2>

          <div class="explain-layout">
            <div class="exp-box">
              <h3><span>📖</span> Lời Giải Chi Tiết</h3>
              <div class="exp-content">${q.solution}</div>
              ${q.trap ? `<div class="exp-trap"><b>⚠️ Lưu ý bẫy sai lầm:</b> ${q.trap}</div>` : ''}
            </div>

            <div class="exp-box">
              <h3><span>📌</span> Kiến Thức Trọng Tâm Liên Quan</h3>
              <div class="exp-content">${q.theory}</div>
            </div>
          </div>
        `
      });
    });

    // 3. Slide Kết Thúc
    slides.push({
      type: 'conclusion',
      title: 'Tổng kết & Dặn dò',
      render: () => `
        <div class="s-body" style="align-items:center; justify-content:center; text-align:center;">
          <div class="s-kicker sec-ans" style="margin: 0 auto 16px auto;">🎉 HOÀN THÀNH BÀI ÔN TẬP</div>
          <h1 class="s-title" style="font-size: 48px; color: var(--lam-dam); margin-bottom: 16px;">
            Chúc Các Em Làm Bài Thi Cuối Kì Thật Tốt!
          </h1>
          <p style="font-size: 20px; color: #475569; max-width: 800px; line-height: 1.6; margin: 0 auto 28px auto;">
            Hệ thống chấm điểm tự động đã ghi nhận toàn bộ kết quả bình chọn của từng học sinh. Hãy ôn luyện kĩ các lưu ý và bẫy sai lầm của từng câu.
          </p>
          <div style="display:inline-flex; gap:16px;">
            <button class="dock-btn primary" onclick="window.slidoTeacher.goToSlide(0)" style="font-size:16px; padding:12px 24px; border-radius:12px;">
              ↺ Quay lại trang bìa
            </button>
            <a href="index.html" class="dock-btn" style="background:#fff; color:var(--muc); border:1px solid var(--line); font-size:16px; padding:12px 24px; border-radius:12px; text-decoration:none;">
              Về trang chủ đề thi
            </a>
          </div>
        </div>
      `
    });
  }

  // Tỷ lệ co giãn sân khấu 16:9
  function scaleStage() {
    const scaler = document.getElementById('scaler');
    if (!scaler) return;
    const w = 1600;
    const h = 900;
    const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
    scaler.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  // MathJax Typeset an toàn không đụng DOM cũ
  function safeTypeset() {
    if (window.MathJax && window.MathJax.typesetPromise) {
      const scaler = document.getElementById('scaler');
      if (scaler) {
        window.MathJax.typesetPromise([scaler]).catch(() => {});
      }
    }
  }

  // Đồng bộ trạng thái lên Server
  function syncBackend(qId, type) {
    fetch(`slido-api.php?action=set_state&exam=${EXAM_CODE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_q: qId,
        slide_type: type,
        is_locked: isLocked ? 1 : 0
      })
    }).catch(() => {});
  }

  // Lấy kết quả realtime
  function fetchResults(qId) {
    fetch(`slido-api.php?action=get_results&exam=${EXAM_CODE}&q_id=${qId}&_t=${Date.now()}`)
      .then(r => r.json())
      .then(res => {
        if (res.status !== 'success') return;
        const total = res.total || 0;
        const pcts = res.percentages || {};
        const counts = res.counts || {};

        // Slide 1 (Đề)
        const totalEl = document.getElementById('slido-total-votes');
        if (totalEl) totalEl.innerText = `${total} bạn đã nộp`;

        // Slide 2 (Đáp án)
        const totalAnsEl = document.getElementById('slido-total-votes-ans');
        if (totalAnsEl) totalAnsEl.innerText = `Tổng cộng: ${total} phiếu`;

        ['A', 'B', 'C', 'D'].forEach(k => {
          const p = pcts[k] || 0;
          const c = counts[k] || 0;

          const fill = document.getElementById(`fill-${k}`);
          const pct = document.getElementById(`pct-${k}`);
          if (fill) fill.style.width = `${p}%`;
          if (pct) pct.innerText = `${p}% (${c})`;

          const fillAns = document.getElementById(`fill-ans-${k}`);
          const pctAns = document.getElementById(`pct-ans-${k}`);
          if (fillAns) fillAns.style.width = `${p}%`;
          if (pctAns) pctAns.innerText = `${p}% (${c})`;
        });
      })
      .catch(() => {});
  }

  function startPolling(qId) {
    stopPolling();
    fetchResults(qId);
    pollInterval = setInterval(() => fetchResults(qId), 1500);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Chuyển slide
  function goToSlide(idx) {
    if (idx < 0) idx = 0;
    if (idx >= slides.length) idx = slides.length - 1;
    currentSlideIdx = idx;

    const s = slides[idx];
    const scaler = document.getElementById('scaler');
    if (!scaler) return;

    scaler.innerHTML = `
      <div class="slide enter">
        ${s.render()}
        <div class="s-foot">
          <div class="s-foot-brand">
            <img src="https://diemdanhsv.com/images/logo-sen.svg" alt="Logo"/>
            <span>Lớp Toán 7 – ThS. Đinh Quốc Tuấn · Bồi Dưỡng Văn Hóa HCMUS</span>
          </div>
          <div style="font-variant-numeric: tabular-nums;">
            ${idx + 1} / ${slides.length}
          </div>
        </div>
      </div>
    `;

    // Cập nhật Mini Dock
    const posEl = document.getElementById('dock-pos');
    if (posEl) posEl.innerText = `${idx + 1} / ${slides.length}`;

    // Cập nhật mục lục active
    document.querySelectorAll('.toc-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    // Xử lý realtime và lock
    if (s.q_id) {
      if (s.type === 'question') {
        isLocked = false;
        updateLockBtn(false);
      }
      syncBackend(s.q_id, s.type);
      if (s.type === 'question' || s.type === 'answer') {
        startPolling(s.q_id);
      } else {
        stopPolling();
      }
    } else {
      stopPolling();
      syncBackend(1, 'cover');
    }

    safeTypeset();
  }

  function updateLockBtn(locked) {
    const btn = document.getElementById('dock-lock-btn');
    if (!btn) return;
    if (locked) {
      btn.innerHTML = '🔓 Mở';
      btn.classList.add('primary');
    } else {
      btn.innerHTML = '🔒 Khóa';
      btn.classList.remove('primary');
    }
  }

  function toggleLock() {
    isLocked = !isLocked;
    updateLockBtn(isLocked);
    fetch(`slido-api.php?action=toggle_lock&exam=${EXAM_CODE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_locked: isLocked ? 1 : 0 })
    }).catch(() => {});

    const pill = document.getElementById('live-status-pill');
    if (pill) {
      if (isLocked) {
        pill.className = 'live-pill';
        pill.innerHTML = '🔒 ĐÃ KHÓA BÌNH CHỌN';
      } else {
        pill.className = 'live-pill active';
        pill.innerHTML = '<span class="live-dot"></span> ĐANG BÌNH CHỌN';
      }
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleToc(show) {
    const drawer = document.getElementById('toc-drawer');
    if (!drawer) return;
    if (show !== undefined) {
      drawer.classList.toggle('open', show);
    } else {
      drawer.classList.toggle('open');
    }
  }

  // Khởi động
  function init() {
    initSlideDeck();
    scaleStage();
    window.addEventListener('resize', scaleStage);

    // Dựng danh sách Drawer Mục lục
    const tocList = document.getElementById('toc-list');
    if (tocList) {
      tocList.innerHTML = slides.map((s, i) => `
        <div class="toc-item" onclick="window.slidoTeacher.goToSlide(${i}); window.slidoTeacher.toggleToc(false);">
          ${i + 1}. ${s.title}
        </div>
      `).join('');
    }

    // Bắt phím điều khiển
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goToSlide(currentSlideIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToSlide(currentSlideIdx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(slides.length - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleToc();
      }
    });

    goToSlide(0);
  }

  window.slidoTeacher = {
    init,
    goToSlide,
    next: () => goToSlide(currentSlideIdx + 1),
    prev: () => goToSlide(currentSlideIdx - 1),
    toggleLock,
    toggleFullscreen,
    toggleToc
  };

  document.addEventListener('DOMContentLoaded', init);
})();
