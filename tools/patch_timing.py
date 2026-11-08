# -*- coding: utf-8 -*-
import os

def patch_api():
    path = r'D:\202610-Antigravity\PhatTrien-Repo-github\bdvh\api.php'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update get_exam fallback
    old_get = """        $exam = $stmt->fetch();
        if (!$exam) {
            json_out(['status' => 'error', 'message' => 'Không tìm thấy đề thi.'], 404);
        }"""
    new_get = """        $exam = $stmt->fetch();
        if (!$exam && $examCode !== '') {
            seed_default_exams($pdo);
            $stmt = $pdo->prepare("SELECT exam_id, exam_code, grade, subject, title, description, time_minutes, questions_json, status FROM bdvh_exams WHERE exam_code = ?");
            $stmt->execute([$examCode]);
            $exam = $stmt->fetch();
        }
        if (!$exam) {
            json_out(['status' => 'error', 'message' => 'Không tìm thấy đề thi.'], 404);
        }"""
    if old_get in content:
        content = content.replace(old_get, new_get, 1)
        print("Patched get_exam fallback")

    # 2. Update submit_exam parameters
    old_sub = """        $examId = (int)($inputData['exam_id'] ?? 0);
        $examCode = trim((string)($inputData['exam_code'] ?? ''));
        $userAnswers = $inputData['answers'] ?? []; // mảng đáp án
        $durationSeconds = (int)($inputData['duration_seconds'] ?? 0);"""
    new_sub = """        $examId = (int)($inputData['exam_id'] ?? 0);
        $examCode = trim((string)($inputData['exam_code'] ?? ''));
        $userAnswers = $inputData['answers'] ?? []; // mảng đáp án
        $durationSeconds = (int)($inputData['duration_seconds'] ?? 0);
        $questionTimes = $inputData['question_times'] ?? []; // thời gian từng câu"""
    if old_sub in content:
        content = content.replace(old_sub, new_sub, 1)
        print("Patched submit_exam parameters")

    # 3. Update details items
    old_exp = "'explanation' => $q['exp'] ?? ''"
    new_exp = "'explanation' => $q['exp'] ?? '',\n                'time_spent_seconds' => isset($questionTimes[$idx]) ? (int)$questionTimes[$idx] : 0"
    if old_exp in content:
        content = content.replace(old_exp, new_exp, 1)
        print("Patched details time_spent_seconds")

    # 4. Update time_analysis in fallback
    old_ta = "'time_strategy_advice' => 'Em có thể xin mã lớp từ Thầy/Cô phụ trách để mở khóa hướng dẫn giải chi tiết cho toàn bộ câu hỏi nhé!'"
    new_ta = """'time_strategy_advice' => 'Em có thể xin mã lớp từ Thầy/Cô phụ trách để mở khóa hướng dẫn giải chi tiết cho toàn bộ câu hỏi nhé!',
                    'question_times' => $questionTimes"""
    if old_ta in content:
        content = content.replace(old_ta, new_ta, 1)
        print("Patched time_analysis question_times")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("api.php patched successfully.")

def patch_thi():
    path = r'D:\202610-Antigravity\PhatTrien-Repo-github\bdvh\thi.html'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add global questionTimes and activeQIdx
    old_vars = "let currentStudentName = '';"
    new_vars = "let currentStudentName = '';\n    let questionTimes = {};\n    let activeQIdx = 0;"
    if old_vars in content and "let questionTimes = {};" not in content:
        content = content.replace(old_vars, new_vars, 1)
        print("Added questionTimes and activeQIdx to thi.html")

    # 2. Add question card timer badge in renderExam
    old_card_hdr = """            <div class="flex items-start gap-3">
              <span class="w-8 h-8 rounded-full bg-slate-100 text-lam font-bold text-xs flex items-center justify-center flex-none border border-bac">
                ${idx + 1}
              </span>
              <div class="font-medium text-sm sm:text-base text-muc leading-relaxed pt-1">
                ${esc(q.q)} ${sectionBadge}
              </div>
            </div>"""

    new_card_hdr = """            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1">
                <span class="w-8 h-8 rounded-full bg-slate-100 text-lam font-bold text-xs flex items-center justify-center flex-none border border-bac">
                  ${idx + 1}
                </span>
                <div class="font-medium text-sm sm:text-base text-muc leading-relaxed pt-1">
                  ${esc(q.q)} ${sectionBadge}
                </div>
              </div>
              <div class="flex-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-gray-500 shadow-xs" title="Thời gian làm câu ${idx + 1}">
                <i class="fas fa-stopwatch text-lam text-[10px]"></i>
                <span id="q-time-${idx}">0s</span>
              </div>
            </div>"""
    if old_card_hdr in content:
        content = content.replace(old_card_hdr, new_card_hdr, 1)
        print("Added timer badge to card header in thi.html")

    # 3. Add onclick to card
    content = content.replace('id="q-card-${idx}">', 'id="q-card-${idx}" onclick="setActiveQuestion(${idx})">')

    # 4. Add setActiveQuestion function and update startTimer
    old_timer = """    function startTimer(standardSeconds) {
      targetStandardSeconds = standardSeconds;
      durationSeconds = 0;
      updateTimerDisplay();

      timerInterval = setInterval(() => {
        durationSeconds++;
        updateTimerDisplay();
      }, 1000);
    }"""

    new_timer = """    function setActiveQuestion(idx) {
      activeQIdx = idx;
    }

    function startTimer(standardSeconds) {
      targetStandardSeconds = standardSeconds;
      durationSeconds = 0;
      updateTimerDisplay();

      timerInterval = setInterval(() => {
        durationSeconds++;
        if (activeQIdx !== null && activeQIdx !== undefined && examData && examData.questions && activeQIdx < examData.questions.length) {
          questionTimes[activeQIdx] = (questionTimes[activeQIdx] || 0) + 1;
          const qTimeEl = document.getElementById(`q-time-${activeQIdx}`);
          if (qTimeEl) {
            const sec = questionTimes[activeQIdx];
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            qTimeEl.innerText = m > 0 ? `${m}m ${s}s` : `${s}s`;
          }
        }
        updateTimerDisplay();
      }, 1000);
    }"""
    if old_timer in content:
        content = content.replace(old_timer, new_timer, 1)
        print("Updated startTimer and added setActiveQuestion in thi.html")

    # 5. In selectOption, call setActiveQuestion
    content = content.replace("function selectOption(qIdx, optIdx) {", "function selectOption(qIdx, optIdx) {\n      setActiveQuestion(qIdx);")
    content = content.replace("function selectTFOption(qIdx, sIdx, val) {", "function selectTFOption(qIdx, sIdx, val) {\n      setActiveQuestion(qIdx);")
    content = content.replace("function selectShortAnswer(qIdx, val) {", "function selectShortAnswer(qIdx, val) {\n      setActiveQuestion(qIdx);")

    # 6. Send question_times in submitExam
    old_sub_body = """            answers: userAnswers,
            duration_seconds: durationSeconds
          })"""
    new_sub_body = """            answers: userAnswers,
            duration_seconds: durationSeconds,
            question_times: questionTimes
          })"""
    if old_sub_body in content:
        content = content.replace(old_sub_body, new_sub_body, 1)
        print("Added question_times payload to submitExam in thi.html")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("thi.html patched successfully.")

def patch_ket_qua():
    path = r'D:\202610-Antigravity\PhatTrien-Repo-github\bdvh\ket-qua.html'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Thêm badge hiển thị thời gian làm câu vào từng card trong danh sách kết quả
    old_badge_section = """              <span class="px-2.5 py-0.5 rounded text-[11px] font-bold flex-none ${isRight ? 'bg-emerald-100 text-luc' : 'bg-red-100 text-son'}">
                ${isRight ? '✔ Đúng' : '✖ Sai'}
              </span>"""

    new_badge_section = """              <div class="flex items-center gap-2 flex-none">
                ${d.time_spent_seconds !== undefined ? `
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200" title="Thời gian làm câu này">
                    <i class="fas fa-stopwatch text-lam"></i> ${d.time_spent_seconds}s
                  </span>` : ''}
                <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${isRight ? 'bg-emerald-100 text-luc' : 'bg-red-100 text-son'}">
                  ${isRight ? '✔ Đúng' : '✖ Sai'}
                </span>
              </div>"""

    if old_badge_section in content:
        content = content.replace(old_badge_section, new_badge_section, 1)
        print("Added time spent badge to ket-qua.html question review")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("ket-qua.html patched successfully.")

if __name__ == '__main__':
    patch_api()
    patch_thi()
    patch_ket_qua()
