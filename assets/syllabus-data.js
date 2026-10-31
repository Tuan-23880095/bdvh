/* Dữ liệu mục lục chương trình — sửa nội dung bài học tại đây, không cần đụng tới giao diện.
 * Mỗi bài: id, week (tuần học), title, examCode (mã đề), theory, exercise,
 * tuỳ chọn: examA4 (đường dẫn đề in), isExamFocus (đề ôn tập), detailTheory / detailExercise (HTML đầy đủ). */
window.SYLLABUS_DATA = {
      'L06': {
        title: 'Chương Trình Toán 6 (Kết Nối Tri Thức / Cánh Diều / Chân Trời)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Bài 10 (Bội chung nhỏ nhất) & LUYỆN ĐỀ ÔN TẬP GIỮA HỌC KÌ I',
        chapters: [
          {
            chapterId: 'c6_1',
            chapterTitle: 'Chương I: Tập Hợp Các Số Tự Nhiên',
            lessons: [
              { id: 'toan6-01', week: 1, title: 'Bài 1 & 2: Tập hợp số tự nhiên & Phép tính lũy thừa (Chương trình GDPT 2018)', examCode: 'TOAN06_CTST_T09_01', examA4: 'de_thi_a4/TOAN06_CTST_T09_01.html', isCurrent: true, isExamFocus: true, theory: 'Khái niệm tập hợp $\\mathbb{N} = \\{0; 1; 2; 3; ...\\}$ (số nhỏ nhất là 0). Phép tính lũy thừa $a^n$, nhân chia lũy thừa cùng cơ số $a^m \\cdot a^n = a^{m+n}$, $a^m : a^n = a^{m-n}$.', exercise: 'Đề kiểm tra chuẩn Bộ GD&ĐT gồm 22 câu chi tiết: 12 trắc nghiệm ABCD + 2 câu Đúng/Sai (8 ý) + 2 câu điền đáp số tự luận.' },
              { id: 'toan6-03', week: 2, title: 'Bài 3: Các phép tính trong tập hợp số tự nhiên', examCode: 'TOAN06_01', theory: 'Tính chất giao hoán, kết hợp, phân phối của phép nhân đối với phép cộng: $a(b + c) = ab + ac$.', exercise: 'Tính nhanh: $25 \\times 37 + 25 \\times 63$; phép chia có dư: $a = b \\cdot q + r (0 \\le r < b)$.' },
              { id: 'toan6-04', week: 3, title: 'Bài 4: Lũy thừa với số mũ tự nhiên', examCode: 'TOAN06_01', theory: '$a^n = a \\cdot a \\dots a$ ($n$ thừa số $a$). Nhân/chia hai lũy thừa cùng cơ số: $a^m \\cdot a^n = a^{m+n}$; $a^m : a^n = a^{m-n}$.', exercise: 'Tính giá trị: $2^3 \\cdot 2^2 = 2^5 = 32$; $3^4 : 3^2 = 9$. Tìm $x$ biết $3^x = 27$.' },
              { id: 'toan6-05', week: 4, title: 'Bài 5: Thứ tự thực hiện các phép tính', examCode: 'TOAN06_01', theory: 'Ưu tiên: Lũy thừa $\\rightarrow$ Nhân & Chia $\\rightarrow$ Cộng & Trừ. Trong ngoặc: $( ) \\rightarrow [ ] \\rightarrow \\{ \\}$.', exercise: 'Tính: $15 + 5 \\cdot 2^2 = 15 + 20 = 35$; $100 - [60 - (9 - 2)^2]$.' },
              { id: 'toan6-06', week: 5, title: 'Bài 6: Chia hết và dấu hiệu chia hết cho 2, cho 5', examCode: 'TOAN06_01', theory: 'Tính chất chia hết của một tổng: $a \\vdots m$ và $b \\vdots m \\Rightarrow (a+b) \\vdots m$. Dấu hiệu chia hết cho 2 (tận cùng chẵn), cho 5 (tận cùng 0 hoặc 5).', exercise: 'Xét xem tổng $120 + 45$ có chia hết cho 5 không? Tìm chữ số $x$ để số $\\overline{47x}$ chia hết cho 2.' },
              { id: 'toan6-07', week: 5, title: 'Bài 7: Dấu hiệu chia hết cho 3, cho 9', examCode: 'TOAN06_01', theory: 'Số chia hết cho 9 khi tổng các chữ số chia hết cho 9. Số chia hết cho 3 khi tổng các chữ số chia hết cho 3.', exercise: 'Tìm chữ số $x$ để $\\overline{1x5}$ chia hết cho 9; số nào chia hết cho cả 2, 3, 5, 9?' },
              { id: 'toan6-08', week: 6, title: 'Bài 8: Số nguyên tố. Hợp số. Phân tích ra thừa số nguyên tố', examCode: 'TOAN06_01', theory: 'Số nguyên tố là số tự nhiên lớn hơn 1 chỉ có 2 ước là 1 và chính nó. Phân tích số ra tích các thừa số nguyên tố.', exercise: 'Các số 2, 3, 5, 7, 11 là số nguyên tố; phân tích số $120 = 2^3 \\cdot 3 \\cdot 5$.' },
              { id: 'toan6-09', week: 7, title: 'Bài 9: Ước chung. Ước chung lớn nhất (ƯCLN)', examCode: 'TOAN06_01', theory: 'ƯCLN là số lớn nhất trong tập hợp các ước chung. Các bước tìm ƯCLN bằng cách phân tích ra thừa số nguyên tố.', exercise: 'Tìm $\\text{ƯCLN}(36, 84)$; bài toán thực tế chia đều 48 cây bút và 72 quyển vở vào các túi quà.' },
              { id: 'toan6-10', week: 8, title: 'Bài 10: Bội chung. Bội chung nhỏ nhất (BCNN)', examCode: 'TOAN06_01', isCurrent: true, theory: 'BCNN là số nhỏ nhất khác 0 trong tập hợp các bội chung. Chọn thừa số chung và riêng với số mũ lớn nhất.', exercise: 'Tìm $\\text{BCNN}(12, 18) = 36$; bài toán chu kỳ xe buýt hoặc đèn tín hiệu giao thông.' },
              { id: 'toan6-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP & KIỂM TRA GIỮA HỌC KỲ I (TRỌNG TÂM TUẦN 8)', examCode: 'TOAN06_01', isExamFocus: true, isCurrent: true, theory: 'Tổng hợp toàn bộ kiến thức Số học (Lũy thừa, Chia hết, ƯCLN, BCNN) & Hình học trực quan (Hình vuông, Tam giác đều, Hình chữ nhật, Hình thoi).', exercise: 'Bộ đề kiểm tra giữa kì tiêu chuẩn 20 câu trắc nghiệm theo ma trận của Bộ GD&ĐT.' }
            ]
          },
          {
            chapterId: 'c6_2',
            chapterTitle: 'Chương II: Số Nguyên (Chuẩn Bị Học)',
            lessons: [
              { id: 'toan6-11', week: 9, title: 'Bài 11: Số nguyên âm và tập hợp các số nguyên', examCode: 'TOAN06_01', theory: 'Tập hợp số nguyên $\\mathbb{Z} = \\{... -3, -2, -1, 0, 1, 2, 3...\\}$. Biểu diễn trên trục số và ứng dụng nhiệt độ dưới 0°C.', exercise: 'Biểu diễn các điểm $-3, 2, -1$ trên trục số; so sánh số nguyên.' },
              { id: 'toan6-12', week: 10, title: 'Bài 12: Thứ tự trong tập hợp các số nguyên', examCode: 'TOAN06_01', theory: 'Mọi số âm đều nhỏ hơn 0 và nhỏ hơn mọi số dương. Số đối của $a$ là $-a$.', exercise: 'Sắp xếp các số sau theo thứ tự tăng dần: $-15, 0, 7, -2, 11$.' }
            ]
          }
        ]
      },
      'L07': {
        title: 'Chương Trình Toán 7 (Kết Nối Tri Thức / Cánh Diều / Chân Trời)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Bài 7 (Tập hợp các số thực) & LUYỆN ĐỀ ÔN TẬP GIỮA HỌC KÌ I',
        chapters: [
          {
            chapterId: 'c7_1',
            chapterTitle: 'Chương I: Số Hữu Tỉ',
            lessons: [
              { id: 'toan7-01', week: 1, title: 'Bài 1: Tập hợp các số hữu tỉ', examCode: 'TOAN07_01', theory: 'Số hữu tỉ là số viết được dưới dạng phân số $\\frac{a}{b}$ với $a, b \\in \\mathbb{Z}, b \\neq 0$. Kí hiệu tập hợp $\\mathbb{Q}$.', exercise: 'So sánh các số hữu tỉ, biểu diễn trên trục số.' },
              { id: 'toan7-02', week: 2, title: 'Bài 2: Các phép tính cộng, trừ, nhân, chia số hữu tỉ', examCode: 'TOAN07_01', theory: 'Quy tắc cộng trừ phân số, quy tắc nhân chia và tính chất phân phối.', exercise: 'Tính giá trị biểu thức phân số và số thập phân.' },
              { id: 'toan7-03', week: 3, title: 'Bài 3: Lũy thừa của một số hữu tỉ', examCode: 'TOAN07_01', theory: 'Lũy thừa với số mũ tự nhiên: $(x \\cdot y)^n = x^n \\cdot y^n$; $(x^m)^n = x^{m \\cdot n}$.', exercise: 'Tính giá trị: $(-\\frac{1}{2})^3 = -\\frac{1}{8}$; so sánh $2^{30}$ và $3^{20}$.' },
              { id: 'toan7-04', week: 4, title: 'Bài 4: Quy tắc dấu ngoặc và quy tắc chuyển vế', examCode: 'TOAN07_01', theory: 'Khi bỏ dấu ngoặc có dấu "-" đằng trước phải đổi dấu tất cả các số hạng. Quy tắc chuyển vế: $x + a = b \\Rightarrow x = b - a$.', exercise: 'Tìm $x$: $x - \\frac{2}{3} = \\frac{1}{2}$; rút gọn biểu thức có nhiều tầng ngoặc.' }
            ]
          },
          {
            chapterId: 'c7_2',
            chapterTitle: 'Chương II: Số Thực & Căn Bậc Hai Số Học',
            lessons: [
              { id: 'toan7-05', week: 5, title: 'Bài 5: Số thập phân vô hạn tuần hoàn', examCode: 'TOAN07_01', theory: 'Mỗi số hữu tỉ biểu diễn bởi số thập phân hữu hạn hoặc vô hạn tuần hoàn.', exercise: 'Chuyển phân số $\\frac{1}{3} = 0,(3)$ sang số thập phân tuần hoàn.' },
              { id: 'toan7-06', week: 6, title: 'Bài 6: Số vô tỉ. Căn bậc hai số học', examCode: 'TOAN07_01', theory: 'Căn bậc hai số học của số $a \\ge 0$ là số $x \\ge 0$ sao cho $x^2 = a$. Kí hiệu $\\sqrt{a}$.', exercise: 'Tính $\\sqrt{25} = 5, \\sqrt{0.64} = 0.8$.' },
              { id: 'toan7-07', week: 8, title: 'Bài 7: Tập hợp các số thực (Tuần 8)', examCode: 'TOAN07_01', isCurrent: true, theory: 'Số thực $\\mathbb{R}$ bao gồm số hữu tỉ và số vô tỉ. Trục số thực biểu diễn liên tục mọi số thực.', exercise: 'So sánh các số thực, tính giá trị tuyệt đối $|x|$.' },
              { id: 'toan7-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP GIỮA HỌC KỲ I TOÁN 7', examCode: 'TOAN07_01', isExamFocus: true, isCurrent: true, theory: 'Toàn bộ Số hữu tỉ, Lũy thừa, Góc đối đỉnh, Tia phân giác, Hai đường thẳng song song.', exercise: 'Đề thi 20 câu trắc nghiệm chuẩn ma trận Sở GD&ĐT TP.HCM.' },
              { id: 'toan7-ck1', week: 8, title: '🔥 ĐỀ THI CUỐI KÌ I TOÁN 7 - THCS TƯỜNG BÌNH HIỆP TP.HCM (SLIDO BÌNH CHỌN)', examCode: 'TOAN07_CK1_KNTT', isCurrent: true, isExamFocus: true, theory: 'Bộ 12 câu trắc nghiệm bao quát toàn diện Số hữu tỉ, Số thực, Hình hộp chữ nhật, Hình lăng trụ đứng và Tiên đề Euclid.', exercise: 'Học sinh làm bài trực tiếp trên điện thoại tại sv-toan7.html hoặc thi trắc nghiệm tính giờ.' }
            ]
          }
        ]
      },
      'L08': {
        title: 'Chương Trình Toán 8 (Kết Nối Tri Thức / Cánh Diều / Chân Trời)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Phân tích đa thức thành nhân tử & LUYỆN ĐỀ ÔN TẬP GIỮA HỌC KÌ I',
        chapters: [
          {
            chapterId: 'c8_1',
            chapterTitle: 'Chương I: Đa Thức Nhiều Biến',
            lessons: [
              { id: 'toan8-01', week: 1, title: 'Bài 1: Đơn thức và đa thức nhiều biến', examCode: 'TOAN08_01', theory: 'Đơn thức nhiều biến là biểu thức gồm tích giữa các số và các biến. Bậc của đơn thức có hệ số khác 0 là tổng số mũ của tất cả các biến.', exercise: 'Thu gọn đơn thức $2x^3y \\cdot (-3xy^2)$, tìm bậc của đa thức.' },
              { id: 'toan8-02', week: 2, title: 'Bài 2: Các phép tính cộng, trừ đa thức nhiều biến', examCode: 'TOAN08_01', theory: 'Quy tắc cộng trừ đa thức: Bỏ dấu ngoặc rồi nhóm các hạng tử đồng dạng lại với nhau.', exercise: 'Cho $P = 2x^2y - 3xy + 1$ và $Q = -x^2y + xy - 5$. Tính $P + Q$ và $P - Q$.' }
            ]
          },
          {
            chapterId: 'c8_2',
            chapterTitle: 'Chương II: Hằng Đẳng Thức Đáng Nhớ & Ứng Dụng',
            lessons: [
              { id: 'toan8-04', week: 4, title: 'Bài 4: Bảy hằng đẳng thức đáng nhớ', examCode: 'TOAN08_01', theory: '$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$; $a^2 - b^2 = (a-b)(a+b)$; $(a \\pm b)^3 = a^3 \\pm 3a^2b + 3ab^2 \\pm b^3$.', exercise: 'Khai triển $(3x - 2)^2$, tính nhanh $101^2$ và $99 \\cdot 101$.' },
              { id: 'toan8-05', week: 6, title: 'Bài 5: Phân tích đa thức thành nhân tử', examCode: 'TOAN08_01', theory: 'Các phương pháp: Đặt nhân tử chung, dùng hằng đẳng thức, nhóm hạng tử và phối hợp nhiều phương pháp.', exercise: 'Phân tích thành nhân tử: $6x^2y - 9xy^2$; $x^2 - 2xy + y^2 - 9$.' },
              { id: 'toan8-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP GIỮA HỌC KỲ I TOÁN 8 (BỘ ĐỀ 120 PHÚT)', examCode: 'TOAN08_01', isExamFocus: true, isCurrent: true, theory: 'Tổng hợp toàn bộ Đa thức, Hằng đẳng thức, Phân tích nhân tử và Tứ giác.', exercise: 'Đề thi chuẩn 15 câu trắc nghiệm + bài tập tự luận có chấm điểm tự động.' }
            ]
          }
        ]
      },
      'L09': {
        title: 'Chương Trình Toán 9 (Chương Trình GDPT 2018 Mới)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Hệ phương trình bậc nhất hai ẩn & HỆ THỨC LƯỢNG TAM GIÁC VUÔNG',
        chapters: [
          {
            chapterId: 'c9_1',
            chapterTitle: 'Chương I: Phương Trình & Hệ Hai Phương Trình Bậc Nhất Hai Ẩn',
            lessons: [
              { id: 'toan9-01', week: 1, title: 'Bài 1: Khái niệm phương trình & hệ phương trình bậc nhất hai ẩn', examCode: 'TOAN09_01', theory: 'Dạng tổng quát $ax + by = c$. Nghiệm của hệ là cặp số $(x_0; y_0)$ thỏa mãn cả hai phương trình.', exercise: 'Kiểm tra cặp số $(2; 1)$ có là nghiệm của hệ phương trình hay không.' },
              { id: 'toan9-02', week: 3, title: 'Bài 2: Phương pháp giải hệ thế & cộng đại số', examCode: 'TOAN09_01', theory: 'Quy tắc thế: Rút một ẩn rồi thế vào phương trình còn lại. Quy tắc cộng: Cân bằng hệ số rồi triệt tiêu một ẩn.', exercise: 'Giải hệ: $\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$.' }
            ]
          },
          {
            chapterId: 'c9_2',
            chapterTitle: 'Chương II: Căn Thức Bậc Hai & Hệ Thức Lượng Tam Giác Vuông',
            lessons: [
              { id: 'toan9-04', week: 6, title: 'Bài 4: Căn bậc hai & Trục căn thức ở mẫu', examCode: 'TOAN09_01', theory: 'Điều kiện $\\sqrt{A}$ có nghĩa là $A \\ge 0$. Nhân liên hợp: $\\frac{c}{\\sqrt{a} \\pm b}$.', exercise: 'Tìm điều kiện xác định của $\\sqrt{2x-6}$; trục căn thức $\\frac{2}{\\sqrt{3}-1}$.' },
              { id: 'toan9-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP GIỮA HỌC KỲ I TOÁN 9', examCode: 'TOAN09_01', isExamFocus: true, isCurrent: true, theory: 'Tổng hợp Hệ phương trình 2 ẩn, Căn thức bậc hai, Tỉ số lượng giác và Giải tam giác vuông.', exercise: 'Đề thi trắc nghiệm bấm giờ 25 phút kèm bài giải chi tiết từng bước.' }
            ]
          }
        ]
      },
      'L10': {
        title: 'Chương Trình Toán 10 (Chương Trình GDPT 2018 Mới)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Bất phương trình bậc nhất hai ẩn & HỆ THỨC LƯỢNG TAM GIÁC',
        chapters: [
          {
            chapterId: 'c10_1',
            chapterTitle: 'Chương I: Mệnh Đề & Tập Hợp',
            lessons: [
              { 
                id: 'toan10-01', 
                week: 1, 
                title: 'Bài 1: Mệnh đề toán học, kéo theo, phủ định', 
                examCode: 'TOAN10_01', 
                theory: 'Mệnh đề là khẳng định đúng hoặc sai. Mệnh đề kéo theo $P \\Rightarrow Q$; mệnh đề đảo $Q \\Rightarrow P$; phủ định $\\overline{P}$.', 
                exercise: 'Xét tính đúng sai của mệnh đề toán học, lập mệnh đề đảo, phủ định mệnh đề chứa $\\forall, \\exists$.',
                detailTheory: `
                  <div class="space-y-4">
                    <div class="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                      <h4 class="font-bold text-sm text-lam border-b border-blue-200/60 pb-1.5 mb-2">
                        <i class="fas fa-bookmark text-blue-600 mr-1.5"></i> I. Định Nghĩa & Phân Loại Mệnh Đề
                      </h4>
                      <ul class="list-disc list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
                        <li><b>Mệnh đề toán học:</b> Là một khẳng định có tính đúng hoặc sai rõ ràng. Một mệnh đề không thể vừa đúng vừa sai.</li>
                        <li><b>Câu không phải mệnh đề:</b> Câu nghi vấn (hỏi?), câu cảm thán (than thở!), câu cầu khiến (mệnh lệnh).</li>
                        <li><b>Mệnh đề chứa biến:</b> Câu khẳng định chứa biến $x, y...$ mà tính đúng sai phụ thuộc vào giá trị cụ thể của biến. Ví dụ: $P(x): \"x + 2 > 5\"$.</li>
                      </ul>
                    </div>

                    <div class="p-4 bg-slate-50 rounded-2xl border border-bac">
                      <h4 class="font-bold text-sm text-lam border-b border-bac pb-1.5 mb-2">
                        <i class="fas fa-cube text-blue-600 mr-1.5"></i> II. Các Dạng Mệnh Đề Thường Gặp
                      </h4>
                      <div class="space-y-2 text-xs text-slate-700 leading-relaxed">
                        <p><b>1. Mệnh đề phủ định $\\overline{P}$:</b> Đúng khi $P$ sai, và sai khi $P$ đúng.</p>
                        <p><b>2. Mệnh đề kéo theo $P \\Rightarrow Q$:</b> \"Nếu $P$ thì $Q$\". Mệnh đề này <i>chỉ sai khi $P$ đúng mà $Q$ sai</i>.</p>
                        <p><b>3. Mệnh đề đảo $Q \\Rightarrow P$:</b> Là mệnh đề đảo của $P \\Rightarrow Q$ (tính đúng sai độc lập với mệnh đề thuận).</p>
                        <p><b>4. Mệnh đề tương đương $P \\Leftrightarrow Q$:</b> \"P khi và chỉ khi Q\" (đúng khi cả hai cùng đúng hoặc cùng sai).</p>
                        <p><b>5. Ký hiệu phổ quát $\\forall$ & Ký hiệu tồn tại $\\exists$:</b> Phủ định của $\\forall x \\in X, P(x)$ là $\\exists x \\in X, \\overline{P(x)}$.</p>
                      </div>
                    </div>
                  </div>
                `,
                detailExercise: `
                  <div class="space-y-4">
                    <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <b class="text-emerald-900 font-bold">Bài 1 (Nhận biết):</b> Trong các câu sau, câu nào là mệnh đề toán học? Xét tính đúng sai của nó:
                      <div class="mt-2 pl-3 space-y-1 text-slate-700">
                        <p>a) $15$ là số nguyên tố.</p>
                        <p>b) $x^2 + 1 > 0$ với mọi số thực $x$.</p>
                        <p>c) Thời tiết hôm nay đẹp quá!</p>
                        <p>d) $2x - 3 = 5$.</p>
                      </div>
                    </div>
                    <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <b class="text-emerald-900 font-bold">Bài 2 (Thông hiểu):</b> Cho mệnh đề $P$: \"Nếu tứ giác $ABCD$ là hình thoi thì $ABCD$ có hai đường chéo vuông góc với nhau\".
                      <div class="mt-2 pl-3 space-y-1 text-slate-700">
                        <p>a) Phát biểu mệnh đề đảo của mệnh đề $P$.</p>
                        <p>b) Mệnh đề đảo có phải là một khẳng định đúng không? Vì sao?</p>
                      </div>
                    </div>
                    <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <b class="text-emerald-900 font-bold">Bài 3 (Vận dụng):</b> Lập mệnh đề phủ định của các mệnh đề sau và xét tính đúng sai:
                      <div class="mt-2 pl-3 space-y-1 text-slate-700">
                        <p>a) $P: \"\\forall x \\in \\mathbb{R}, x^2 - x + 1 > 0\"$.</p>
                        <p>b) $Q: \"\\exists n \\in \\mathbb{N}, n^2 + 1 \\text{ chia hết cho } 3\"$.</p>
                      </div>
                    </div>
                  </div>
                `
              },
              { id: 'toan10-02', week: 2, title: 'Bài 2: Tập hợp và các phép toán tập hợp', examCode: 'TOAN10_01', theory: 'Giao $A \\cap B$, Hợp $A \\cup B$, Hiệu $A \\setminus B$. Khoảng, đoạn, nửa khoảng.', exercise: 'Cho $A = (-3; 4], B = [1; 6)$. Tìm $A \\cap B, A \\cup B$.' }
            ]
          },
          {
            chapterId: 'c10_2',
            chapterTitle: 'Chương II: Bất Phương Trình Bậc Nhất Hai Ẩn',
            lessons: [
              { id: 'toan10-03', week: 4, title: 'Bài 3: Miền nghiệm bất phương trình $ax + by \\le c$', examCode: 'TOAN10_01', theory: 'Biểu diễn miền nghiệm bằng nửa mặt phẳng trên mặt phẳng tọa độ $Oxy$.', exercise: 'Xác định miền nghiệm và kiểm tra điểm thuộc miền nghiệm.' },
              { id: 'toan10-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP GIỮA HỌC KỲ I TOÁN 10', examCode: 'TOAN10_01', isExamFocus: true, isCurrent: true, theory: 'Mệnh đề, Tập hợp, Miền nghiệm BPT bậc nhất hai ẩn, Định lý Sin, Cosin tam giác.', exercise: 'Bộ đề thi rèn tư duy logic và kỹ năng bấm máy Casio.' }
            ]
          }
        ]
      },
      'L11': {
        title: 'Chương Trình Toán 11 (Chương Trình GDPT 2018 Mới)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Hàm số lượng giác, Phương trình lượng giác & HÌNH HỌC KHÔNG GIAN',
        chapters: [
          {
            chapterId: 'c11_1',
            chapterTitle: 'Chương I: Hàm Số Lượng Giác & Phương Trình Lượng Giác',
            lessons: [
              { id: 'toan11-01', week: 1, title: 'Bài 1: Góc lượng giác và công thức biến đổi', examCode: 'TOAN11_01', theory: 'Công thức cơ bản: $\\sin^2\\alpha + \\cos^2\\alpha = 1$, $\\sin 2a = 2\\sin a \\cos a$, $\\cos 2a = \\cos^2 a - \\sin^2 a$.', exercise: 'Cho $\\cos\\alpha = -3/5$, tính $\\sin\\alpha$ và $\\tan 2\\alpha$.' },
              { id: 'toan11-03', week: 5, title: 'Bài 3: Phương trình lượng giác cơ bản', examCode: 'TOAN11_01', theory: '$\\sin x = \\sin\\alpha \\iff x = \\alpha + k2\\pi$ hoặc $x = \\pi - \\alpha + k2\\pi$; $\\cos x = \\cos\\alpha \\iff x = \\pm\\alpha + k2\\pi$.', exercise: 'Giải phương trình: $\\cos x = -1/2$; $\\sin(2x - \\pi/3) = \\sqrt{3}/2$.' },
              { id: 'toan11-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP GIỮA HỌC KỲ I TOÁN 11', examCode: 'TOAN11_01', isExamFocus: true, isCurrent: true, theory: 'Tổng hợp Lượng giác (Góc, Đồ thị, Phương trình) và Hình học không gian quan hệ song song.', exercise: 'Bộ đề trắc nghiệm chuẩn 4 lựa chọn + đúng sai + trả lời ngắn.' }
            ]
          }
        ]
      },
      'L12': {
        title: 'Chương Trình Toán 12 (Chương Trình GDPT 2018 Mới)',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Ứng dụng đạo hàm khảo sát hàm số & TOẠ ĐỘ VECTƠ OXYZ',
        chapters: [
          {
            chapterId: 'c12_1',
            chapterTitle: 'Chương I: Ứng Dụng Đạo Hàm Khảo Sát & Vẽ Đồ Thị Hàm Số',
            lessons: [
              { id: 'toan12-01', week: 1, title: 'Bài 1: Tính đơn điệu & Cực trị hàm số', examCode: 'TOAN12_01', theory: 'Hàm số đồng biến khi $f\'(x) \\ge 0$, nghịch biến khi $f\'(x) \\le 0$. Cực trị đổi dấu $f\'(x)$.', exercise: 'Tìm các khoảng đơn điệu và toạ độ cực trị của hàm $y = x^3 - 3x^2 + 2$.' },
              { id: 'toan12-04', week: 6, title: 'Bài 4: Đường tiệm cận của đồ thị hàm số', examCode: 'TOAN12_01', theory: 'Tiệm cận ngang: $\\lim_{x \\to \\pm\\infty} f(x) = y_0$. Tiệm cận đứng: $\\lim_{x \\to x_0} f(x) = \\pm\\infty$.', exercise: 'Xác định tiệm cận của hàm số $y = \\frac{2x - 1}{x + 3}$.' },
              { id: 'toan12-mid', week: 8, title: '⭐ ĐỀ ÔN TẬP GIỮA HỌC KỲ I TOÁN 12 (TRỌNG TÂM TN THPT)', examCode: 'TOAN12_01', isExamFocus: true, isCurrent: true, theory: 'Khảo sát hàm số, Bảng biến thiên, Cực trị, Tiệm cận và Toạ độ vectơ không gian Oxyz.', exercise: 'Đề thi trắc nghiệm 4 lựa chọn bấm giờ có đo đạc tốc độ tư duy.' }
            ]
          }
        ]
      },
      'DGNL': {
        title: 'Chuyên Đề Luyện Thi ĐGNL ĐHQG-HCM 2026',
        currentWeek: 8,
        currentWeekFocus: 'Tuần 8: Tư duy Định lượng, Suy luận Logic & Xử lý số liệu bảng biểu',
        chapters: [
          {
            chapterId: 'cdgnl_1',
            chapterTitle: 'Phần 1: Tư Duy Định Lượng (Toán Học & Suy Luận Số Liệu)',
            lessons: [
              { id: 'dgnl-01', week: 8, title: 'Đề số 01: Tư duy Định lượng & Logic suy luận (Bộ đề chuẩn)', examCode: 'DGNL_2026_01', isExamFocus: true, isCurrent: true, theory: 'Cấu trúc đề ĐHQG-HCM: Đại số, Hình học, Xác suất thống kê, Đọc hiểu biểu đồ ma trận.', exercise: '30 câu trắc nghiệm 4 lựa chọn, phân tích tốc độ dưới 1.5 phút/câu.' },
              { id: 'dgnl-02', week: 8, title: 'Đề số 02: Xử lý bảng biểu dữ liệu thực tế & Logic sắp xếp', examCode: 'DGNL_2026_02', isExamFocus: true, isCurrent: true, theory: 'Quy tắc suy luận Modus Ponens, bài toán xếp chỗ, tính tỷ trọng doanh thu và xác suất Venn.', exercise: 'Thực hành phân tích ma trận dữ liệu thực tế đề thi 2026.' }
            ]
          }
        ]
      }
    };
