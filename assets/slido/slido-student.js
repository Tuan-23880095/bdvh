/**
 * slido-student.js — Trình điều khiển Phòng Tương Tác Học Sinh (Mobile & Desktop)
 * ThS. Đinh Quốc Tuấn — Bồi Dưỡng Văn Hóa HCMUS
 */

(function () {
  const EXAM_CODE = 'toan7';
  let clientId = localStorage.getItem('slido_client_id');
  if (!clientId) {
    clientId = 'stu_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('slido_client_id', clientId);
  }

  let studentName = localStorage.getItem('slido_student_name') || '';
  let currentState = null;
  let currentVote = null; // { q_id, answer }
  let lastServerStateKey = '';

  // Lấy danh sách câu hỏi
  function getQuestion(qId) {
    const list = window.TOAN7_QUESTIONS || [];
    return list.find(q => q.id === qId) || null;
  }

  function safeTypeset() {
    if (window.MathJax && window.MathJax.typesetPromise) {
      const container = document.getElementById('student-app-root');
      if (container) {
        window.MathJax.typesetPromise([container]).catch(() => {});
      }
    }
  }

  // Đồng bộ trạng thái phòng từ server
  function pollServerState() {
    fetch(`slido-api.php?action=get_state&exam=${EXAM_CODE}&_t=${Date.now()}`)
      .then(r => r.json())
      .then(res => {
        if (res.status !== 'success') return;
        const state = res.state;
        const stateKey = `${state.current_q}_${state.slide_type}_${state.is_locked ? 1 : 0}`;
        if (stateKey !== lastServerStateKey) {
          lastServerStateKey = stateKey;
          currentState = state;
          renderApp();
        }
      })
      .catch(() => {});
  }

  // Gửi bình chọn
  function submitVote(ans) {
    if (!currentState || !currentState.current_q) return;
    if (currentState.is_locked) {
      alert('Giáo viên đã khóa nhận bình chọn cho câu này!');
      return;
    }

    const qId = currentState.current_q;
    const name = studentName || 'Học sinh';

    fetch(`slido-api.php?action=vote&exam=${EXAM_CODE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q_id: qId,
        client_id: clientId,
        student_name: name,
        answer: ans
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.status === 'success') {
          currentVote = { q_id: qId, answer: ans };
          localStorage.setItem(`slido_voted_${EXAM_CODE}_${qId}`, ans);
          if (navigator.vibrate) navigator.vibrate(50);
          renderApp();
        } else {
          alert(res.message || 'Lỗi gửi bình chọn');
        }
      })
      .catch(() => alert('Lỗi kết nối máy chủ!'));
  }

  // Vẽ giao diện học sinh
  function renderApp() {
    const root = document.getElementById('student-app-root');
    if (!root) return;

    if (!studentName) {
      root.innerHTML = renderWelcomeForm();
      return;
    }

    if (!currentState || currentState.slide_type === 'cover') {
      root.innerHTML = renderWaitingCover();
      return;
    }

    if (currentState.slide_type === 'conclusion') {
      root.innerHTML = renderConclusion();
      return;
    }

    const q = getQuestion(currentState.current_q);
    if (!q) {
      root.innerHTML = renderWaitingCover();
      return;
    }

    // Kiểm tra xem học sinh đã bình chọn câu này chưa
    const savedVote = currentVote && currentVote.q_id === q.id ? currentVote.answer : localStorage.getItem(`slido_voted_${EXAM_CODE}_${q.id}`);

    if (currentState.slide_type === 'question') {
      root.innerHTML = renderQuestionView(q, savedVote, currentState.is_locked);
    } else {
      // Slide 'answer' hoặc 'explain'
      root.innerHTML = renderResultView(q, savedVote);
    }

    safeTypeset();
  }

  function renderWelcomeForm() {
    return `
      <div class="stu-card" style="text-align:center; padding: 28px 20px;">
        <div style="width: 58px; height: 58px; border-radius: 16px; background: var(--luc-nhe); color: var(--luc); font-size: 28px; display:inline-flex; align-items:center; justify-content:center; margin-bottom: 14px;">
          ✍️
        </div>
        <h2 style="font-family: var(--serif); font-size: 22px; color: var(--muc); margin-bottom: 6px;">
          Tham Gia Lớp Toán 7
        </h2>
        <p style="font-size: 14px; color: #64748B; margin-bottom: 20px;">
          Nhập họ và tên để thầy Tuấn ghi nhận kết quả bình chọn trực tiếp của em.
        </p>

        <form onsubmit="event.preventDefault(); window.slidoStudent.setName(document.getElementById('inp-name').value);">
          <input type="text" id="inp-name" placeholder="Ví dụ: Nguyễn Văn An" required
            style="width:100%; padding:14px; border:2px solid #CBD5E1; border-radius:12px; font-size:16px; font-family:var(--sans); outline:none; text-align:center; margin-bottom:14px;"
            onfocus="this.style.borderColor='var(--luc)'"
          />
          <button type="submit" class="btn-submit-vote">
            Vào phòng làm bài ➔
          </button>
        </form>
      </div>
    `;
  }

  function renderWaitingCover() {
    return `
      <div class="stu-card" style="text-align:center; padding: 32px 20px;">
        <div class="live-dot" style="margin: 0 auto 14px auto; width: 14px; height: 14px;"></div>
        <h3 style="font-family: var(--serif); font-size: 22px; color: var(--lam-dam); margin-bottom: 8px;">
          Chào mừng em, ${escapeHtml(studentName)}!
        </h3>
        <p style="font-size: 15px; color: #475569; line-height: 1.5;">
          Thầy Tuấn đang giới thiệu bài giảng. Khi thầy bấm qua câu hỏi, màn hình điện thoại của em sẽ tự động hiện đề để chọn đáp án.
        </p>
      </div>
    `;
  }

  function renderQuestionView(q, savedVote, isLocked) {
    return `
      <div class="stu-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:12px; font-weight:700; color:var(--lam); background:#E0F2FE; padding:3px 10px; border-radius:6px;">
            CÂU ${q.id} / 12
          </span>
          <span class="live-pill ${isLocked ? '' : 'active'}">
            ${isLocked ? '🔒 ĐÃ KHÓA NHẬN BÀI' : '<span class="live-dot"></span> ĐANG NHẬN BÌNH CHỌN'}
          </span>
        </div>

        <h3 style="font-family: var(--serif); font-size: 19px; color: var(--muc); line-height: 1.45; margin-bottom: 14px;">
          <b>Câu ${q.id}:</b> ${q.desc}
        </h3>

        ${q.svg ? `<div style="text-align:center; margin: 10px 0; background:#fff; padding:6px; border-radius:8px; border:1px solid var(--line);">${q.svg}</div>` : ''}

        <div style="margin-top: 14px;">
          ${q.opts.map(o => `
            <button class="stu-opt-btn ${savedVote === o.k ? 'selected' : ''}" 
              onclick="window.slidoStudent.chooseOption('${o.k}')"
              ${isLocked ? 'disabled style="opacity:0.7; cursor:not-allowed;"' : ''}
            >
              <div class="stu-opt-badge">${o.k}</div>
              <div style="flex:1; text-align:left;">${o.t}</div>
            </button>
          `).join('')}
        </div>

        ${savedVote ? `
          <div style="margin-top:14px; background:#ECFDF5; border:1.5px solid #10B981; border-radius:10px; padding:10px 14px; text-align:center;">
            <b style="color:var(--luc); font-size:14px;">✓ Đã ghi nhận lựa chọn: Phương án ${savedVote}</b>
            ${!isLocked ? '<div style="font-size:12px; color:#047857; margin-top:2px;">(Em có thể bấm chọn phương án khác để đổi câu trả lời trước khi thầy khóa)</div>' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderResultView(q, savedVote) {
    const isCorrect = savedVote === q.correct;
    return `
      <div class="stu-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:12px; font-weight:700; color:var(--luc); background:#DCFCE7; padding:3px 10px; border-radius:6px;">
            CÂU ${q.id} · CÔNG BỐ ĐÁP ÁN
          </span>
          <span style="font-size:12px; font-weight:700; color:#DC2626;">🔒 ĐÃ CHỐT</span>
        </div>

        <div style="text-align:center; padding: 14px 10px; border-radius:12px; margin-bottom:14px; ${isCorrect ? 'background:#ECFDF5; border:2px solid #10B981;' : 'background:#FEF2F2; border:2px solid #F87171;'}">
          <div style="font-size:32px; margin-bottom:4px;">${isCorrect ? '🎉' : '💡'}</div>
          <h4 style="font-size:18px; font-weight:800; color:${isCorrect ? 'var(--luc)' : '#B91C1C'}; margin-bottom:4px;">
            ${isCorrect ? 'CHÚC MỪNG EM ĐÃ TRẢ LỜI ĐÚNG!' : 'RẤT TIẾC, CHƯA CHÍNH XÁC!'}
          </h4>
          <p style="font-size:14px; color:#475569;">
            Lựa chọn của em: <b>${savedVote || 'Chưa nộp'}</b> · Đáp án đúng: <b style="color:var(--luc); font-size:16px;">${q.correct}</b>
          </p>
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--line); border-radius:10px; padding:12px 14px; font-size:14px; color:#334155; line-height:1.5;">
          <b style="color:var(--lam); display:block; margin-bottom:4px;">📖 Lời giải tóm tắt:</b>
          ${q.solution}
        </div>
      </div>
    `;
  }

  function renderConclusion() {
    return `
      <div class="stu-card" style="text-align:center; padding: 30px 20px;">
        <div style="font-size: 42px; margin-bottom: 8px;">🎓</div>
        <h3 style="font-family: var(--serif); font-size: 22px; color: var(--lam-dam); margin-bottom: 8px;">
          Hoàn Thành Buổi Ôn Tập!
        </h3>
        <p style="font-size: 15px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
          Em đã hoàn thành tốt các câu hỏi tương tác Slido môn Toán 7. Chúc em đạt điểm cao trong kì kiểm tra sắp tới!
        </p>
        <a href="index.html" class="btn-submit-vote" style="text-decoration:none; display:inline-flex;">
          Về trang chủ đề thi ➔
        </a>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // API xuất ra window
  window.slidoStudent = {
    setName: (name) => {
      studentName = name.trim();
      localStorage.setItem('slido_student_name', studentName);
      renderApp();
    },
    chooseOption: (ans) => {
      submitVote(ans);
    },
    changeName: () => {
      const n = prompt('Nhập lại họ và tên của em:', studentName);
      if (n !== null && n.trim()) {
        studentName = n.trim();
        localStorage.setItem('slido_student_name', studentName);
        renderApp();
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    setInterval(pollServerState, 1500);
  });
})();
