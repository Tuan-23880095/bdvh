/**
 * toan7-data.js — Bộ 12 câu hỏi trắc nghiệm Toán 7 (Đề Cuối Học Kỳ I - THCS Tường Bình Hiệp)
 * ThS. Đinh Quốc Tuấn — Bồi Dưỡng Văn Hóa HCMUS
 */

window.TOAN7_QUESTIONS = [
  {
    id: 1,
    title: "Tập hợp các số hữu tỉ",
    desc: "Tập hợp các số hữu tỉ được kí hiệu là",
    opts: [
      { k: "A", t: "$\\mathbb{N}$" },
      { k: "B", t: "$\\mathbb{Z}$" },
      { k: "C", t: "$\\mathbb{Q}$" },
      { k: "D", t: "$\\mathbb{R}$" }
    ],
    correct: "C",
    solution: "Tập hợp các số tự nhiên là $\\mathbb{N}$, số nguyên là $\\mathbb{Z}$, số hữu tỉ là $\\mathbb{Q}$ và số thực là $\\mathbb{R}$. Kí hiệu $\\mathbb{Q}$ xuất phát từ chữ tiếng Anh <i>'Quotient'</i> (thương số giữa hai số nguyên).",
    theory: "<b>Định nghĩa số hữu tỉ:</b> Số hữu tỉ là số viết được dưới dạng phân số $\\dfrac{a}{b}$ với $a, b \\in \\mathbb{Z}, b \\ne 0$. Tập hợp các số hữu tỉ được kí hiệu là $\\mathbb{Q}$.",
    trap: "Học sinh thường nhầm giữa $\\mathbb{Q}$ (hữu tỉ) và $\\mathbb{R}$ (số thực), hoặc quên mất số nguyên $\\mathbb{Z}$ cũng là tập con của $\\mathbb{Q}$."
  },
  {
    id: 2,
    title: "Căn bậc hai số học",
    desc: "Giá trị của $\\sqrt{225}$ là",
    opts: [
      { k: "A", t: "$-15$" },
      { k: "B", t: "$15$" },
      { k: "C", t: "$225$" },
      { k: "D", t: "$-225$" }
    ],
    correct: "B",
    solution: "Căn bậc hai số học của một số $a \\ge 0$ là số không âm $x$ sao cho $x^2 = a$. Vì $15 \\ge 0$ và $15^2 = 225$ nên $\\sqrt{225} = 15$.",
    theory: "<b>Căn bậc hai số học:</b> Với $a \\ge 0$, $\\sqrt{a} = x \\Leftrightarrow x \\ge 0$ và $x^2 = a$. Lưu ý căn bậc hai số học luôn nhận giá trị không âm!",
    trap: "Rất nhiều học sinh chọn nhầm $\\pm 15$ hoặc $-15$. Kí hiệu dấu căn $\\sqrt{\\dots}$ luôn chỉ giá trị không âm!"
  },
  {
    id: 3,
    title: "Giá trị tuyệt đối của số hữu tỉ",
    desc: "Giá trị tuyệt đối của $\\dfrac{3}{-2}$ là",
    opts: [
      { k: "A", t: "$\\dfrac{-3}{2}$" },
      { k: "B", t: "$\\dfrac{3}{2}$" },
      { k: "C", t: "$\\dfrac{2}{-3}$" },
      { k: "D", t: "$\\dfrac{3}{-2}$" }
    ],
    correct: "B",
    solution: "Ta có $\\dfrac{3}{-2} = -\\dfrac{3}{2}$. Vì $-\\dfrac{3}{2} < 0$ nên giá trị tuyệt đối bằng số đối của nó: $\\left|\\dfrac{3}{-2}\\right| = -\\left(-\\dfrac{3}{2}\\right) = \\dfrac{3}{2}$.",
    theory: "<b>Giá trị tuyệt đối:</b> $|x| = x$ nếu $x \\ge 0$; $|x| = -x$ nếu $x < 0$. Khoảng cách từ điểm $x$ đến gốc $0$ trên trục số luôn là một số không âm: $|x| \\ge 0$.",
    trap: "Học sinh giữ nguyên dấu âm trong phân số hoặc đổi ngược tử mẫu thành $\\dfrac{2}{3}$."
  },
  {
    id: 4,
    title: "Tính chất tỉ lệ thức",
    desc: "Chọn câu đúng. Nếu $a\\cdot d = b\\cdot c$ và $a, b, c, d \\ne 0$ thì",
    opts: [
      { k: "A", t: "$\\dfrac{a}{b} = \\dfrac{c}{d}$" },
      { k: "B", t: "$\\dfrac{d}{a} = \\dfrac{b}{c}$" },
      { k: "C", t: "$\\dfrac{a}{b} = \\dfrac{d}{c}$" },
      { k: "D", t: "$\\dfrac{a}{c} = \\dfrac{d}{b}$" }
    ],
    correct: "A",
    solution: "Từ tích trung tỉ bằng tích ngoại tỉ $a \\cdot d = b \\cdot c$, ta có các tỉ lệ thức: $\\dfrac{a}{b} = \\dfrac{c}{d}$, $\\dfrac{a}{c} = \\dfrac{b}{d}$, $\\dfrac{d}{b} = \\dfrac{c}{a}$, $\\dfrac{d}{c} = \\dfrac{b}{a}$.",
    theory: "<b>Tính chất tỉ lệ thức:</b> Nếu $\\dfrac{a}{b} = \\dfrac{c}{d}$ thì $a\\cdot d = b\\cdot c$. Ngược lại, nếu $a\\cdot d = b\\cdot c$ (với $a,b,c,d \\ne 0$) thì ta lập được 4 tỉ lệ thức.",
    trap: "Nhầm vị trí các số hạng đường chéo dẫn đến tỉ lệ thức sai."
  },
  {
    id: 5,
    title: "Thứ tự thực hiện phép tính có dấu ngoặc",
    desc: "Thứ tự thực hiện đúng trong biểu thức có dấu ngoặc là",
    opts: [
      { k: "A", t: "$\\{\\ \\} \\to (\\ ) \\to [\\ ]$" },
      { k: "B", t: "$\\{\\ \\} \\to [\\ ] \\to (\\ )$" },
      { k: "C", t: "$(\\ ) \\to [\\ ] \\to \\{\\ \\}$" },
      { k: "D", t: "$(\\ ) \\to \\{\\ \\} \\to [\\ ]$" }
    ],
    correct: "C",
    solution: "Quy tắc chuẩn SGK: Khi thực hiện các phép tính trong biểu thức có dấu ngoặc, ta thực hiện theo thứ tự: ngoặc tròn $(\\ )$ trước, rồi đến ngoặc vuông $[\\ ]$, cuối cùng đến ngoặc nhọn $\\{\\ \\}$.",
    theory: "<b>Quy ước thứ tự phép toán:</b><br/>1. Ngoặc: $(\\ ) \\to [\\ ] \\to \\{\\ \\}$<br/>2. Phép tính: Lũy thừa $\\to$ Nhân, chia $\\to$ Cộng, trừ.",
    trap: "Nhầm thứ tự ngược lại (làm từ ngoặc nhọn to nhất vào trong)."
  },
  {
    id: 6,
    title: "Cạnh bên của hình hộp chữ nhật",
    desc: "Các cạnh bên của hình hộp chữ nhật $ABCD.A'B'C'D'$ là:",
    svg: `<svg width="170" height="100" viewBox="0 0 160 104" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif" font-size="12"><g fill="none" stroke="#1F4E79" stroke-width="1.5"><polygon points="30,30 110,30 140,10 60,10"/><polygon points="30,90 110,90 110,30 30,30"/><line x1="110" y1="90" x2="140" y2="70"/><line x1="140" y1="70" x2="140" y2="10"/><line x1="60" y1="70" x2="140" y2="70" stroke-dasharray="3 2"/><line x1="60" y1="70" x2="60" y2="10" stroke-dasharray="3 2"/><line x1="60" y1="70" x2="30" y2="90" stroke-dasharray="3 2"/></g><text x="16" y="30" font-weight="bold">A</text><text x="114" y="30" font-weight="bold">D</text><text x="144" y="12" font-weight="bold">C</text><text x="54" y="8" font-weight="bold">B</text><text x="16" y="98" font-weight="bold">A'</text><text x="114" y="98" font-weight="bold">D'</text><text x="144" y="76" font-weight="bold">C'</text><text x="46" y="80" font-weight="bold">B'</text></svg>`,
    opts: [
      { k: "A", t: "$AA', BB', CC', DD'$" },
      { k: "B", t: "$AB, AA', DD', BC'$" },
      { k: "C", t: "$AC, BA, CC', AD$" },
      { k: "D", t: "$A'C', B'D', AB, CD$" }
    ],
    correct: "A",
    solution: "Hai mặt đáy của hình hộp chữ nhật là $ABCD$ và $A'B'C'D'$. Bốn đoạn thẳng nối các đỉnh tương ứng của hai đáy là $AA', BB', CC', DD'$, gọi là các cạnh bên.",
    theory: "<b>Hình hộp chữ nhật:</b> Có 6 mặt đều là hình chữ nhật, 8 đỉnh và 12 cạnh (gồm 4 cạnh đáy trên, 4 cạnh đáy dưới và 4 cạnh bên song song, bằng nhau).",
    trap: "Nhầm lẫn giữa các cạnh đáy (như $AB, CD$) hoặc đường chéo với cạnh bên."
  },
  {
    id: 7,
    title: "Mặt bên của hình lăng trụ đứng tam giác",
    desc: "Mỗi mặt bên của hình lăng trụ đứng tam giác là",
    opts: [
      { k: "A", t: "Tam giác" },
      { k: "B", t: "Hình thang cân" },
      { k: "C", t: "Hình vuông" },
      { k: "D", t: "Hình chữ nhật" }
    ],
    correct: "D",
    solution: "Theo định nghĩa hình lăng trụ đứng, các mặt bên nối hai đáy song song luôn là các hình chữ nhật vuông góc với đáy.",
    theory: "<b>Hình lăng trụ đứng tam giác:</b><br/>• Hai mặt đáy là hai tam giác song song và bằng nhau.<br/>• Ba mặt bên đều là các hình chữ nhật vuông góc với hai đáy.",
    trap: "Học sinh đọc nhanh chữ 'tam giác' ở tên gọi nên chọn nhầm mặt bên là tam giác, hoặc chọn hình vuông (chỉ là trường hợp riêng)."
  },
  {
    id: 8,
    title: "Góc kề bù trong hình vẽ",
    desc: "Quan sát hình vẽ bên. Góc kề bù với góc $\\widehat{aOb}$ là",
    svg: `<svg width="200" height="90" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif" font-size="13"><g stroke="#1F4E79" stroke-width="1.6" fill="none"><line x1="10" y1="80" x2="190" y2="80"/><line x1="100" y1="80" x2="40" y2="20"/><line x1="100" y1="80" x2="118" y2="12"/></g><text x="28" y="16" font-weight="bold">b</text><text x="122" y="12" font-weight="bold">c</text><text x="6" y="94" font-weight="bold">a</text><text x="96" y="94" font-weight="bold">O</text><text x="186" y="94" font-weight="bold">d</text></svg>`,
    opts: [
      { k: "A", t: "$\\widehat{bOc}$" },
      { k: "B", t: "$\\widehat{bOd}$" },
      { k: "C", t: "$\\widehat{dOc}$" },
      { k: "D", t: "$\\widehat{aOc}$" }
    ],
    correct: "B",
    solution: "Vì tia $Oa$ và $Od$ là hai tia đối nhau tạo thành góc bẹt $\\widehat{aOd} = 180^\\circ$, nên góc kề bù với $\\widehat{aOb}$ là góc có cạnh chung $Ob$ và cạnh kia là tia đối của $Oa$ (tức tia $Od$), đó là $\\widehat{bOd}$.",
    theory: "<b>Hai góc kề bù:</b> Là hai góc vừa kề nhau vừa bù nhau (có một cạnh chung và hai cạnh còn lại là hai tia đối nhau). Tổng số đo của hai góc kề bù luôn bằng $180^\\circ$.",
    trap: "Nhầm với góc kề nhưng không bù (như $\\widehat{bOc}$) hoặc góc bù nhưng không kề."
  },
  {
    id: 9,
    title: "Tiên đề Euclid về đường thẳng song song",
    desc: "Phát biểu đúng nhất của “Tiên đề Euclid” là",
    opts: [
      { k: "A", t: "Qua một điểm ở ngoài một đường thẳng chỉ có một đường thẳng song song với đường thẳng đó" },
      { k: "B", t: "Qua một điểm ở ngoài một đường thẳng có vô số đường thẳng song song với đường thẳng đó" },
      { k: "C", t: "Qua một điểm ở ngoài một đường thẳng có ít nhất một đường thẳng song song với đường thẳng đó" },
      { k: "D", t: "Chỉ có một đường thẳng song song với đường thẳng cho trước" }
    ],
    correct: "A",
    solution: "Nội dung chuẩn của Tiên đề Euclid trong SGK: 'Qua một điểm ở ngoài một đường thẳng chỉ có một đường thẳng song song với đường thẳng đó'.",
    theory: "<b>Ý nghĩa tiên đề Euclid:</b> Tính duy nhất của đường thẳng song song đi qua một điểm ngoài đường thẳng cho trước là nền tảng để chứng minh tính chất các cặp góc so le trong, đồng vị bằng nhau khi hai đường thẳng song song.",
    trap: "Chọn đáp án C ('ít nhất một') hoặc D (bỏ quên điều kiện qua một điểm ở ngoài đường thẳng)."
  },
  {
    id: 10,
    title: "Điều kiện tia phân giác của một góc",
    desc: "Để $Ot$ là tia phân giác của góc $xOy$ thì",
    opts: [
      { k: "A", t: "Tia $Ot$ nằm trong góc $xOy$" },
      { k: "B", t: "$\\widehat{xOt} = \\widehat{yOt}$" },
      { k: "C", t: "Tia $Ot$ nằm trong góc $xOy$ và $\\widehat{xOt} = \\widehat{yOt}$" },
      { k: "D", t: "Tia $Ot$ nằm giữa" }
    ],
    correct: "C",
    solution: "Để là tia phân giác, tia $Ot$ phải thỏa mãn đồng thời hai điều kiện: (1) Tia $Ot$ nằm trong góc $xOy$ (nằm giữa hai tia $Ox, Oy$) và (2) Chia góc thành 2 phần bằng nhau: $\\widehat{xOt} = \\widehat{yOt} = \\dfrac{\\widehat{xOy}}{2}$.",
    theory: "<b>Định nghĩa tia phân giác:</b> Tia phân giác của một góc là tia nằm trong góc đó và tạo với hai cạnh của góc hai góc bằng nhau.",
    trap: "Chỉ chọn điều kiện bằng nhau (đáp án B) mà quên điều kiện nằm trong góc."
  },
  {
    id: 11,
    title: "Giả thiết của định lí hình học",
    desc: "Giả thiết của định lí “Nếu hai đường thẳng phân biệt cùng vuông góc với một đường thẳng khác thì hai đường thẳng đó song song với nhau” là",
    opts: [
      { k: "A", t: "“hai đường thẳng đó song song với nhau”" },
      { k: "B", t: "“hai đường thẳng phân biệt cùng vuông góc với một đường thẳng khác thì hai đường thẳng đó song song với nhau”" },
      { k: "C", t: "“hai đường thẳng phân biệt cùng vuông góc”" },
      { k: "D", t: "“hai đường thẳng phân biệt cùng vuông góc với một đường thẳng khác”" }
    ],
    correct: "D",
    solution: "Cấu trúc định lí 'Nếu [A] thì [B]': Phần [A] sau từ 'Nếu' là Giả thiết. Phần [B] sau từ 'thì' là Kết luận. Do đó Giả thiết là 'hai đường thẳng phân biệt cùng vuông góc với một đường thẳng khác'.",
    theory: "<b>Cấu trúc Định lí:</b><br/>• <b>Giả thiết (GT):</b> Điều cho biết trước.<br/>• <b>Kết luận (KL):</b> Điều được suy ra từ giả thiết.",
    trap: "Nhầm giữa Giả thiết và Kết luận (chọn A), hoặc copy nguyên cả định lí (chọn B)."
  },
  {
    id: 12,
    title: "Tổng ba góc của một tam giác",
    desc: "Tổng ba góc của một tam giác bằng",
    opts: [
      { k: "A", t: "$90^\\circ$" },
      { k: "B", t: "$120^\\circ$" },
      { k: "C", t: "$180^\\circ$" },
      { k: "D", t: "$360^\\circ$" }
    ],
    correct: "C",
    solution: "Trong mọi tam giác, tổng số đo ba góc trong luôn bằng $180^\\circ$. Trong $\\triangle ABC$: $\\widehat{A} + \\widehat{B} + \\widehat{C} = 180^\\circ$.",
    theory: "<b>Hệ quả:</b> Trong tam giác vuông, hai góc nhọn phụ nhau (tổng bằng $90^\\circ$). Góc ngoài của tam giác bằng tổng hai góc trong không kề với nó.",
    trap: "Nhầm sang tổng 4 góc của tứ giác ($360^\\circ$) hoặc tổng 2 góc nhọn ($90^\\circ$)."
  }
];
