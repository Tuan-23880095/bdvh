# -*- coding: utf-8 -*-
"""
Bộ tạo 50 câu trắc nghiệm Hóa học 8 HK1 - Sách Kết nối tri thức với cuộc sống (KNTT)
Tuân thủ chuẩn GDPT 2018: IUPAC, V = n * 24,79 L, thang pH, acid-base-oxide-muối-phân bón
Tác giả: ThS. Đinh Quốc Tuấn - TT Bồi Dưỡng Văn Hóa HCMUS
"""

import json
import os

QUESTIONS = [
    # 1. HIỆN TƯỢNG VẬT LÍ VÀ HIỆN TƯỢNG HÓA HỌC (Câu 1 - 4)
    {
        "q": "Quá trình nào sau đây là hiện tượng hóa học?",
        "opts": [
            "Cồn để trong lọ hở miệng bị bay hơi dần.",
            "Đinh sắt để lâu trong không khí ẩm bị gỉ sét màu nâu đỏ.",
            "Nước lỏng được làm lạnh trong tủ đông hóa thành nước đá.",
            "Hòa tan muối ăn vào nước cất thu được dung dịch trong suốt."
        ],
        "ans": 1,
        "exp": "<b>Phương pháp:</b> Hiện tượng hóa học là hiện tượng có sự biến đổi từ chất này thành chất khác. Hiện tượng vật lí chỉ thay đổi trạng thái, hình dạng mà không tạo chất mới.<br><b>Giải chi tiết:</b> Đinh sắt (Fe) bị gỉ trong không khí ẩm tạo thành hợp chất gỉ sắt (oxit và hiđroxit của sắt) là hiện tượng hóa học. Các quá trình còn lại chỉ là biến đổi trạng thái vật lí.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Dấu hiệu rõ ràng nhất để phân biệt hiện tượng hóa học với hiện tượng vật lí là gì?",
        "opts": [
            "Có sự thay đổi về thể tích của các chất.",
            "Có sự tạo thành chất mới có tính chất khác chất ban đầu.",
            "Có sự biến đổi hình dạng bên ngoài của vật thể.",
            "Có sự tỏa nhiệt hoặc thu nhiệt nhẹ."
        ],
        "ans": 1,
        "exp": "<b>Phương pháp:</b> Khái niệm hiện tượng hóa học trong SGK KHTN 8 KNTT.<br><b>Giải chi tiết:</b> Dấu hiệu quyết định của hiện tượng hóa học là có sự biến đổi chất, tức là sinh ra chất mới có tính chất hóa học và vật lí khác với chất ban đầu.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Trong các hiện tượng tự nhiên và đời sống sau, hiện tượng nào CHỈ là biến đổi vật lí?",
        "opts": [
            "Thắp sáng nến, sáp nến chảy lỏng rồi chuyển thành hơi nến.",
            "Đốt cháy que diêm trong không khí sinh ra tro than và khói cay.",
            "Lên men tinh bột gạo tạo thành cồn (rượu etylic).",
            "Sữa tươi để ngoài nhiệt độ cao lâu ngày bị chua và vón cục."
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Sáp nến chảy lỏng và bay hơi chỉ là sự chuyển thể từ rắn sang lỏng và khí (hiện tượng vật lí). Ba hiện tượng còn lại đều có sự chuyển hóa tạo chất mới.<br><b>Chọn đáp án A.</b>"
    },
    {
        "q": "Đun nóng đường mía (sucrose) trong ống nghiệm, lúc đầu đường chảy lỏng thành chất lỏng màu vàng, sau đó chuyển sang màu đen sủi bọt và có hơi nước đọng lại ở miệng ống nghiệm. Giai đoạn đường bị cháy đen tạo than và hơi nước là:",
        "opts": [
            "Hiện tượng vật lí.",
            "Hiện tượng hóa học.",
            "Hiện tượng quang học.",
            "Hiện tượng cơ học."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Đường mía khi bị nhiệt phân hủy thành carbon (than màu đen) và nước là quá trình tạo chất mới, do đó là hiện tượng hóa học.<br><b>Chọn đáp án B.</b>"
    },

    # 2. PHẢN ỨNG HÓA HỌC & DIỄN BIẾN (Câu 5 - 8)
    {
        "q": "Trong một phản ứng hóa học, đại lượng nào sau đây KHÔNG bị thay đổi trước và sau phản ứng?",
        "opts": [
            "Số lượng phân tử của mỗi chất.",
            "Liên kết hóa học giữa các nguyên tử.",
            "Số lượng nguyên tử của mỗi nguyên tố.",
            "Tính chất vật lí và hóa học của các chất."
        ],
        "ans": 2,
        "exp": "<b>Phương pháp:</b> Bản chất của phản ứng hóa học.<br><b>Giải chi tiết:</b> Trong phản ứng hóa học, chỉ có liên kết giữa các nguyên tử thay đổi, làm phân tử này biến đổi thành phân tử khác. Tổng số nguyên tử của từng nguyên tố được bảo toàn tuyệt đối.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Khi nhỏ dung dịch hydrochloric acid (HCl) vào viên đá vôi (chứa calcium carbonate - $\\text{CaCO}_3$), ta quan sát thấy hiện tượng nào chứng tỏ phản ứng hóa học đã diễn ra?",
        "opts": [
            "Dung dịch chuyển sang màu đỏ tím.",
            "Có chất khí sủi bọt thoát ra mạnh mẽ.",
            "Tạo thành kết tủa màu xanh lam lắng xuống đáy.",
            "Hỗn hợp bị đông đặc thành chất rắn."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Phản ứng $\\text{CaCO}_3 + 2\\text{HCl} \\rightarrow \\text{CaCl}_2 + \\text{CO}_2\\uparrow + \\text{H}_2\\text{O}$ sinh ra bọt khí carbon dioxide ($\\text{CO}_2$) không màu thoát ra.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Chất tham gia phản ứng (chất phản ứng) là:",
        "opts": [
            "Chất mới được sinh ra sau phản ứng hóa học.",
            "Chất ban đầu bị biến đổi trong phản ứng hóa học.",
            "Chất xúc tác làm phản ứng xảy ra nhanh hơn.",
            "Chất chỉ xuất hiện tạm thời ở trạng thái trung gian."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Chất ban đầu bị biến đổi trong phản ứng hóa học gọi là chất tham gia (chất phản ứng). Chất mới sinh ra gọi là sản phẩm.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Cho phản ứng: Khí hydrogen + Khí oxygen $\\rightarrow$ Nước. Khẳng định nào sau đây là ĐÚNG?",
        "opts": [
            "Chất phản ứng là hydrogen và nước.",
            "Sản phẩm của phản ứng là khí hydrogen.",
            "Chất tham gia là khí hydrogen và khí oxygen, sản phẩm là nước.",
            "Khối lượng sản phẩm luôn nhỏ hơn tổng khối lượng chất tham gia."
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Hai chất ban đầu là hydrogen và oxygen (chất tham gia), chất sinh ra là nước (sản phẩm).<br><b>Chọn đáp án C.</b>"
    },

    # 3. NĂNG LƯỢNG TRONG PHẢN ỨNG: TỎA NHIỆT & THU NHIỆT (Câu 9 - 12)
    {
        "q": "Phản ứng tỏa nhiệt là phản ứng hóa học trong đó:",
        "opts": [
            "Hấp thụ năng lượng dưới dạng nhiệt từ môi trường xung quanh.",
            "Giải phóng năng lượng dưới dạng nhiệt ra môi trường xung quanh.",
            "Nhiệt độ của hệ phản ứng và môi trường luôn giảm xuống.",
            "Phải liên tục đun nóng thì phản ứng mới tiếp tục diễn ra."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Theo định nghĩa SGK KHTN 8 KNTT: Phản ứng tỏa nhiệt giải phóng năng lượng (dưới dạng nhiệt) ra môi trường xung quanh, làm môi trường nóng lên.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Phản ứng nào sau đây thuộc loại phản ứng thu nhiệt?",
        "opts": [
            "Phản ứng đốt cháy than đá để đun sôi nước.",
            "Phản ứng cháy của xăng dầu trong động cơ xe máy.",
            "Phản ứng nung đá vôi ($\\text{CaCO}_3$) ở nhiệt độ khoảng $900-1000^\\circ\\text{C}$ để sản xuất vôi sống.",
            "Phản ứng đốt cồn y tế để khử trùng và sưởi ấm."
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Quá trình nung đá vôi cần liên tục cung cấp nhiệt năng từ bên ngoài thì phản ứng mới tiếp diễn; khi ngừng cung cấp nhiệt, phản ứng sẽ dừng lại. Đây là phản ứng thu nhiệt.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Khi quẹt diêm, ngọn lửa bùng cháy và tỏa ra nhiều nhiệt và ánh sáng. Đây là ví dụ của:",
        "opts": [
            "Hiện tượng vật lí thu nhiệt.",
            "Phản ứng hóa học tỏa nhiệt.",
            "Phản ứng hóa học thu nhiệt.",
            "Hiện tượng ngưng tụ năng lượng."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Sự cháy que diêm tạo chất mới kèm theo giải phóng nhiệt và phát sáng là phản ứng hóa học tỏa nhiệt.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Để giảm tiêu hao năng lượng trong các nhà máy sản xuất vôi công nghiệp, người ta thường ứng dụng giải pháp nào?",
        "opts": [
            "Tận dụng nhiệt khí thải nóng của lò nung để sấy nóng đá vôi trước khi nung.",
            "Tưới thêm nước lạnh vào lò nung đá vôi.",
            "Nung đá vôi trong phòng lạnh.",
            "Giảm nồng độ khí oxygen trong lò đốt nhiên liệu."
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Khí thải lò nung mang lượng nhiệt lớn, việc tận dụng dòng nhiệt này để sấy nóng đá vôi nguyên liệu giúp tiết kiệm nhiên liệu đốt lò đáng kể.<br><b>Chọn đáp án A.</b>"
    },

    # 4. ĐỊNH LUẬT BẢO TOÀN KHỐI LƯỢNG (Câu 13 - 16)
    {
        "q": "Nội dung của Định luật bảo toàn khối lượng được phát biểu là:",
        "opts": [
            "Tổng thể tích các chất tham gia bằng tổng thể tích các chất sản phẩm.",
            "Trong một phản ứng hóa học, tổng khối lượng của các chất sản phẩm bằng tổng khối lượng của các chất tham gia phản ứng.",
            "Khối lượng của từng chất rắn trước và sau phản ứng không đổi.",
            "Tổng số mol các chất tham gia luôn bằng tổng số mol các chất sản phẩm."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Định luật bảo toàn khối lượng (Lomonosov - Lavoisier): Trong một phản ứng hóa học, tổng khối lượng của các chất sản phẩm bằng tổng khối lượng của các chất tham gia phản ứng.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Đốt cháy hoàn toàn $6\\text{ g}$ kim loại magnesium (Mg) trong khí oxygen thu được $10\\text{ g}$ magnesium oxide (MgO). Khối lượng khí oxygen đã tham gia phản ứng là:",
        "opts": [
            "$4\\text{ g}$",
            "$16\\text{ g}$",
            "$8\\text{ g}$",
            "$2\\text{ g}$"
        ],
        "ans": 0,
        "exp": "<b>Phương pháp:</b> Áp dụng ĐLBTKL: $m_{\\text{Mg}} + m_{\\text{O}_2} = m_{\\text{MgO}}$.<br><b>Tính toán:</b> $m_{\\text{O}_2} = 10 - 6 = 4\\text{ g}$.<br><b>Chọn đáp án A.</b>"
    },
    {
        "q": "Nung $100\\text{ g}$ đá vôi chứa calcium carbonate ($\\text{CaCO}_3$), thu được $56\\text{ g}$ calcium oxide ($\\text{CaO}$) và khí carbon dioxide ($\\text{CO}_2$). Khối lượng khí $\\text{CO}_2$ bay ra là:",
        "opts": [
            "$56\\text{ g}$",
            "$44\\text{ g}$",
            "$156\\text{ g}$",
            "$22\\text{ g}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $m_{\\text{CO}_2} = m_{\\text{CaCO}_3} - m_{\\text{CaO}} = 100 - 56 = 44\\text{ g}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Cho thanh kẽm (Zinc) nặng $13\\text{ g}$ vào cốc chứa $100\\text{ g}$ dung dịch hydrochloric acid (HCl). Sau phản ứng, thấy khối lượng dung dịch trong cốc tăng lên, đồng thời có $0,4\\text{ g}$ khí hydrogen thoát ra. Tổng khối lượng cốc và dung dịch sau phản ứng là bao nhiêu (bỏ qua khối lượng cốc)?",
        "opts": [
            "$113\\text{ g}$",
            "$112,6\\text{ g}$",
            "$113,4\\text{ g}$",
            "$87\\text{ g}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> Theo ĐLBTKL: $m_{\\text{hỗn hợp sau}} = m_{\\text{Zn}} + m_{\\text{dd HCl}} - m_{\\text{H}_2} = 13 + 100 - 0,4 = 112,6\\text{ g}$.<br><b>Chọn đáp án B.</b>"
    },

    # 5. LẬP VÀ Ý NGHĨA PHƯƠNG TRÌNH HÓA HỌC (Câu 17 - 20)
    {
        "q": "Phương trình hóa học nào sau đây đã được cân bằng ĐÚNG?",
        "opts": [
            "$\\text{Al} + \\text{O}_2 \\rightarrow \\text{Al}_2\\text{O}_3$",
            "$2\\text{Al} + 3\\text{O}_2 \\rightarrow 2\\text{Al}_2\\text{O}_3$",
            "$4\\text{Al} + 3\\text{O}_2 \\rightarrow 2\\text{Al}_2\\text{O}_3$",
            "$4\\text{Al} + 2\\text{O}_2 \\rightarrow 2\\text{Al}_2\\text{O}_3$"
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Vế trái có $4$ nguyên tử Al, $3 \\times 2 = 6$ nguyên tử O. Vế phải có $2 \\times 2 = 4$ nguyên tử Al, $2 \\times 3 = 6$ nguyên tử O. Vậy phương trình $4\\text{Al} + 3\\text{O}_2 \\rightarrow 2\\text{Al}_2\\text{O}_3$ cân bằng đúng.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Hệ số thích hợp điền vào dấu ba chấm trong phương trình: $2\\text{Fe} + \\dots \\text{Cl}_2 \\xrightarrow{t^\\circ} 2\\text{FeCl}_3$ là:",
        "opts": [
            "1",
            "2",
            "3",
            "4"
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Vế phải có $2 \\times 3 = 6$ nguyên tử Cl. Do đó vế trái cần $3$ phân tử $\\text{Cl}_2$ ($3 \\times 2 = 6$).<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Cho phương trình hóa học: $\\text{CH}_4 + 2\\text{O}_2 \\xrightarrow{t^\\circ} \\text{CO}_2 + 2\\text{H}_2\\text{O}$. Tỉ lệ số phân tử $\\text{CH}_4$ : số phân tử $\\text{O}_2$ : số phân tử $\\text{CO}_2$ là:",
        "opts": [
            "$1 : 2 : 1$",
            "$1 : 1 : 1$",
            "$2 : 1 : 2$",
            "$1 : 2 : 2$"
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Tỉ lệ số phân tử tương ứng với hệ số đứng trước mỗi chất trong PTHH đã cân bằng: $1 : 2 : 1$.<br><b>Chọn đáp án A.</b>"
    },
    {
        "q": "Trong phản ứng: $a\\text{Fe}_2\\text{O}_3 + b\\text{CO} \\xrightarrow{t^\\circ} c\\text{Fe} + d\\text{CO}_2$. Tổng hệ số các số nguyên tối giản $(a + b + c + d)$ là:",
        "opts": [
            "6",
            "8",
            "9",
            "7"
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Phương trình cân bằng: $\\text{Fe}_2\\text{O}_3 + 3\\text{CO} \\xrightarrow{t^\\circ} 2\\text{Fe} + 3\\text{CO}_2$. Tổng hệ số: $1 + 3 + 2 + 3 = 9$.<br><b>Chọn đáp án C.</b>"
    },

    # 6. MOL VÀ KHỐI LƯỢNG MOL (Câu 21 - 24)
    {
        "q": "Mol là lượng chất có chứa số hạt vi mô (nguyên tử hoặc phân tử) bằng bao nhiêu?",
        "opts": [
            "$6,022 \\times 10^{22}$",
            "$6,022 \\times 10^{23}$",
            "$6,022 \\times 10^{24}$",
            "$3,011 \\times 10^{23}$"
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Theo chuẩn SI và SGK KHTN 8 KNTT, một mol chất chứa hằng số Avogadro $N_A \\approx 6,022 \\times 10^{23}$ hạt vi mô.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Khối lượng mol phân tử của hợp chất sulfuric acid ($\\text{H}_2\\text{SO}_4$) là (cho $\\text{H}=1, \\text{S}=32, \\text{O}=16$):",
        "opts": [
            "$49\\text{ g/mol}$",
            "$98\\text{ g/mol}$",
            "$96\\text{ g/mol}$",
            "$80\\text{ g/mol}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $M_{\\text{H}_2\\text{SO}_4} = 1 \\times 2 + 32 + 16 \\times 4 = 2 + 32 + 64 = 98\\text{ g/mol}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Số mol của $11,2\\text{ g}$ kim loại sắt (Iron - Fe, khối lượng mol $56\\text{ g/mol}$) là:",
        "opts": [
            "$0,1\\text{ mol}$",
            "$0,2\\text{ mol}$",
            "$0,5\\text{ mol}$",
            "$2,0\\text{ mol}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $n_{\\text{Fe}} = \\frac{m}{M} = \\frac{11,2}{56} = 0,2\\text{ mol}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Khối lượng của $0,15\\text{ mol}$ copper(II) oxide (CuO, cho $\\text{Cu}=64, \\text{O}=16$) là:",
        "opts": [
            "$8,0\\text{ g}$",
            "$12,0\\text{ g}$",
            "$16,0\\text{ g}$",
            "$14,4\\text{ g}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $M_{\\text{CuO}} = 64 + 16 = 80\\text{ g/mol}$. Khối lượng $m = n \\times M = 0,15 \\times 80 = 12,0\\text{ g}$.<br><b>Chọn đáp án B.</b>"
    },

    # 7. THỂ TÍCH MOL CHẤT KHÍ Ở ĐIỀU KIỆN CHUẨN 24,79 L (Câu 25 - 28)
    {
        "q": "Ở điều kiện chuẩn ($25^\\circ\\text{C}$ và $1\\text{ bar}$), thể tích của $0,2\\text{ mol}$ khí oxygen ($\\text{O}_2$) là:",
        "opts": [
            "$4,48\\text{ lít}$",
            "$4,958\\text{ lít}$",
            "$2,479\\text{ lít}$",
            "$5,60\\text{ lít}$"
        ],
        "ans": 1,
        "exp": "<b>Phương pháp:</b> Theo chuẩn GDPT 2018, điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$ có công thức $V = n \\times 24,79$.<br><b>Tính toán:</b> $V = 0,2 \\times 24,79 = 4,958\\text{ lít}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Số mol của $7,437\\text{ lít}$ khí hydrogen ($\\text{H}_2$) đo ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$) là:",
        "opts": [
            "$0,2\\text{ mol}$",
            "$0,3\\text{ mol}$",
            "$0,25\\text{ mol}$",
            "$0,4\\text{ mol}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $n = \\frac{V}{24,79} = \\frac{7,437}{24,79} = 0,3\\text{ mol}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Hỗn hợp khí gồm $0,1\\text{ mol}$ $\\text{N}_2$ và $0,1\\text{ mol}$ $\\text{CO}_2$ ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$) có tổng thể tích là:",
        "opts": [
            "$2,479\\text{ lít}$",
            "$4,958\\text{ lít}$",
            "$9,916\\text{ lít}$",
            "$4,48\\text{ lít}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> Tổng số mol khí $n_{\\text{hh}} = 0,1 + 0,1 = 0,2\\text{ mol}$. Tổng thể tích $V = 0,2 \\times 24,79 = 4,958\\text{ lít}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "So sánh thể tích của $1\\text{ mol}$ khí $\\text{H}_2$ và $1\\text{ mol}$ khí $\\text{CO}_2$ ở cùng điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$):",
        "opts": [
            "Khí $\\text{CO}_2$ có thể tích lớn hơn vì phân tử $\\text{CO}_2$ nặng hơn.",
            "Khí $\\text{H}_2$ có thể tích lớn hơn vì phân tử $\\text{H}_2$ nhỏ nhẹ hơn.",
            "Thể tích hai khí hoàn toàn bằng nhau và đều bằng $24,79\\text{ lít}$.",
            "Không so sánh được vì hai khí khác bản chất."
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Ở cùng điều kiện nhiệt độ và áp suất, các chất khí có số mol bằng nhau đều chiếm những thể tích bằng nhau (ở đkc là $24,79\\text{ L}$).<br><b>Chọn đáp án C.</b>"
    },

    # 8. TỈ KHỐI CỦA CHẤT KHÍ (Câu 29 - 32)
    {
        "q": "Công thức tính tỉ khối của khí A đối với khí B ($d_{A/B}$) là:",
        "opts": [
            "$d_{A/B} = \\frac{M_A}{M_B}$",
            "$d_{A/B} = \\frac{M_B}{M_A}$",
            "$d_{A/B} = M_A \\times M_B$",
            "$d_{A/B} = \\frac{V_A}{V_B}$"
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Tỉ khối của khí A đối với khí B được xác định bởi tỉ số khối lượng mol: $d_{A/B} = \\frac{M_A}{M_B}$.<br><b>Chọn đáp án A.</b>"
    },
    {
        "q": "Tỉ khối của khí sulfur dioxide ($\\text{SO}_2$, khối lượng mol $64\\text{ g/mol}$) đối với không khí (coi $M_{\\text{kk}} = 29\\text{ g/mol}$) xấp xỉ bằng:",
        "opts": [
            "$0,45$",
            "$1,52$",
            "$2,21$",
            "$3,10$"
        ],
        "ans": 2,
        "exp": "<b>Tính toán:</b> $d_{\\text{SO}_2/\\text{kk}} = \\frac{64}{29} \\approx 2,21$.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Khí nào sau đây nhẹ hơn không khí và thường được ứng dụng để bơm vào bóng thám không?",
        "opts": [
            "Khí oxygen ($\\text{O}_2$)",
            "Khí carbon dioxide ($\\text{CO}_2$)",
            "Khí hydrogen ($\\text{H}_2$)",
            "Khí chlorine ($\\text{Cl}_2$)"
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Khí $\\text{H}_2$ có $M = 2\\text{ g/mol} < 29\\text{ g/mol}$, là chất khí nhẹ nhất trong tất cả các chất khí.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Để thu khí oxygen ($\\text{O}_2$) vào lọ bằng phương pháp đẩy không khí, người ta phải đặt lọ như thế nào?",
        "opts": [
            "Đặt ngửa lọ vì khí oxygen nặng hơn không khí ($32 > 29$).",
            "Đặt úp ngược lọ vì khí oxygen nhẹ hơn không khí.",
            "Đặt nằm ngang lọ.",
            "Đặt nghiêng một góc $45^\\circ$."
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Vì $d_{\\text{O}_2/\\text{kk}} = \\frac{32}{29} \\approx 1,1 > 1$, khí $\\text{O}_2$ nặng hơn không khí nên sẽ chìm xuống đáy lọ, do đó cần đặt ngửa lọ để thu khí.<br><b>Chọn đáp án A.</b>"
    },

    # 9. TÍNH THEO PHƯƠNG TRÌNH HÓA HỌC (Câu 33 - 36)
    {
        "q": "Cho phương trình: $\\text{C} + \\text{O}_2 \\xrightarrow{t^\\circ} \\text{CO}_2$. Đốt cháy hoàn toàn $1,2\\text{ g}$ carbon cần dùng bao nhiêu lít khí oxygen (đkc $25^\\circ\\text{C}, 1\\text{ bar}$)?",
        "opts": [
            "$2,24\\text{ lít}$",
            "$2,479\\text{ lít}$",
            "$4,958\\text{ lít}$",
            "$1,2395\\text{ lít}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $n_{\\text{C}} = \\frac{1,2}{12} = 0,1\\text{ mol}$. Theo PTHH: $n_{\\text{O}_2} = n_{\\text{C}} = 0,1\\text{ mol}$. Thể tích khí $\\text{O}_2$ (đkc): $V = 0,1 \\times 24,79 = 2,479\\text{ lít}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Cho mẩu sắt tác dụng với dung dịch hydrochloric acid theo PTHH: $\\text{Fe} + 2\\text{HCl} \\rightarrow \\text{FeCl}_2 + \\text{H}_2\\uparrow$. Nếu thu được $0,2\\text{ mol}$ khí $\\text{H}_2$ thì khối lượng kim loại Fe đã phản ứng là:",
        "opts": [
            "$5,6\\text{ g}$",
            "$11,2\\text{ g}$",
            "$2,8\\text{ g}$",
            "$16,8\\text{ g}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> Theo PTHH: $n_{\\text{Fe}} = n_{\\text{H}_2} = 0,2\\text{ mol}$. Khối lượng Fe: $m_{\\text{Fe}} = 0,2 \\times 56 = 11,2\\text{ g}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Cho $5,4\\text{ g}$ nhôm (Al, $M=27$) tác dụng hết với dung dịch $\\text{H}_2\\text{SO}_4$ loãng: $2\\text{Al} + 3\\text{H}_2\\text{SO}_4 \\rightarrow \\text{Al}_2(\\text{SO}_4)_3 + 3\\text{H}_2\\uparrow$. Thể tích khí $\\text{H}_2$ thu được ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$) là:",
        "opts": [
            "$4,958\\text{ lít}$",
            "$7,437\\text{ lít}$",
            "$9,916\\text{ lít}$",
            "$6,72\\text{ lít}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $n_{\\text{Al}} = \\frac{5,4}{27} = 0,2\\text{ mol}$. Theo PTHH: $n_{\\text{H}_2} = \\frac{3}{2} n_{\\text{Al}} = 0,3\\text{ mol}$. Thể tích khí $\\text{H}_2$ ở đkc: $V = 0,3 \\times 24,79 = 7,437\\text{ lít}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Cho $0,2\\text{ mol}$ kim loại kẽm (Zn) tác dụng với dung dịch chứa $0,3\\text{ mol}$ hydrochloric acid (HCl): $\\text{Zn} + 2\\text{HCl} \\rightarrow \\text{ZnCl}_2 + \\text{H}_2\\uparrow$. Sau phản ứng kết thúc:",
        "opts": [
            "Kim loại Zn phản ứng hết, HCl còn dư.",
            "Acid HCl phản ứng hết, kim loại Zn còn dư.",
            "Cả hai chất cùng phản ứng vừa đủ.",
            "Không xác định được chất nào dư."
        ],
        "ans": 1,
        "exp": "<b>Phương pháp:</b> So sánh tỉ số $\\frac{n_{\\text{đề}}}{hệ\\text{ }số}$: $\\frac{n_{\\text{Zn}}}{1} = 0,2 > \\frac{n_{\\text{HCl}}}{2} = \\frac{0,3}{2} = 0,15$.<br><b>Kết luận:</b> Acid HCl phản ứng hết, kim loại Zn còn dư ($0,2 - 0,15 = 0,05\\text{ mol}$).<br><b>Chọn đáp án B.</b>"
    },

    # 10. BÀI TOÁN HIỆU SUẤT PHẢN ỨNG (Câu 37 - 38)
    {
        "q": "Nung $50\\text{ g}$ calcium carbonate ($\\text{CaCO}_3$, $M=100$) để sản xuất vôi sống (CaO, $M=56$). Biết hiệu suất phản ứng đạt $80\\%$. Khối lượng CaO thực tế thu được là:",
        "opts": [
            "$28\\text{ g}$",
            "$22,4\\text{ g}$",
            "$35\\text{ g}$",
            "$20\\text{ g}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $n_{\\text{CaCO}_3} = \\frac{50}{100} = 0,5\\text{ mol}$. Theo lí thuyết thu được $0,5\\text{ mol}$ CaO tương ứng $m_{\\text{lt}} = 0,5 \\times 56 = 28\\text{ g}$. Vì hiệu suất $80\\%$, khối lượng thực tế: $m_{\\text{tt}} = 28 \\times \\frac{80}{100} = 22,4\\text{ g}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Biết phản ứng nung vôi theo lí thuyết sinh ra $10\\text{ g}$ CaO, nhưng thực tế người ta chỉ thu được $8,5\\text{ g}$ CaO. Hiệu suất $H\\%$ của phản ứng nung vôi là:",
        "opts": [
            "$80\\%$",
            "$85\\%$",
            "$90\\%$",
            "$75\\%$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> $H\\% = \\frac{m_{\\text{thực tế}}}{m_{\\text{lí thuyết}}} \\times 100\\% = \\frac{8,5}{10} \\times 100\\% = 85\\%$.<br><b>Chọn đáp án B.</b>"
    },

    # 11. TỐC ĐỘ PHẢN ỨNG & CHẤT XÚC TÁC (Câu 39 - 41)
    {
        "q": "Yếu tố nào sau đây KHÔNG làm tăng tốc độ của một phản ứng hóa học?",
        "opts": [
            "Tăng nhiệt độ của hệ phản ứng.",
            "Tăng diện tích bề mặt tiếp xúc của chất rắn.",
            "Thêm nước cất để làm giảm nồng độ các chất tan tham gia phản ứng.",
            "Sử dụng chất xúc tác thích hợp."
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Làm giảm nồng độ chất phản ứng sẽ làm giảm số lần va chạm hiệu quả giữa các phân tử, do đó làm giảm tốc độ phản ứng.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Tại sao than tổ ong thường được đục các lỗ rỗng xuyên suốt thân viên than?",
        "opts": [
            "Để giảm trọng lượng khi vận chuyển.",
            "Để làm tăng diện tích bề mặt tiếp xúc của than với oxygen trong không khí, giúp than cháy nhanh và mạnh hơn.",
            "Để than dễ ngấm nước khi cần dập tắt.",
            "Để giảm bớt lượng tro xỉ sau khi đốt."
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Các lỗ rỗng giúp không khí lưu thông và làm tăng mạnh diện tích bề mặt tiếp xúc giữa than (carbon) và khí oxygen, nâng cao tốc độ phản ứng cháy.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Chất xúc tác là chất:",
        "opts": [
            "Làm tăng tốc độ phản ứng hóa học nhưng không bị biến đổi về lượng và chất sau phản ứng.",
            "Làm giảm tốc độ phản ứng và bị tiêu hao hoàn toàn trong phản ứng.",
            "Chỉ làm phản ứng đổi màu mà không ảnh hưởng đến tốc độ.",
            "Bắt buộc phải là chất rắn tan được trong nước."
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Theo định nghĩa: Chất xúc tác là chất làm tăng tốc độ phản ứng hóa học nhưng không bị tiêu hao hay biến đổi hóa học sau khi kết thúc phản ứng.<br><b>Chọn đáp án A.</b>"
    },

    # 12. NỒNG ĐỘ DUNG DỊCH (C% VÀ CM) (Câu 42 - 44)
    {
        "q": "Hòa tan $15\\text{ g}$ muối ăn (NaCl) vào $185\\text{ g}$ nước cất. Nồng độ phần trăm ($C\\%$) của dung dịch nước muối thu được là:",
        "opts": [
            "$7,5\\%$",
            "$8,1\\%$",
            "$7,0\\%$",
            "$10,0\\%$"
        ],
        "ans": 0,
        "exp": "<b>Tính toán:</b> Khối lượng dung dịch $m_{\\text{dd}} = m_{\\text{ct}} + m_{\\text{nước}} = 15 + 185 = 200\\text{ g}$. Nồng độ: $C\\% = \\frac{15}{200} \\times 100\\% = 7,5\\%$.<br><b>Chọn đáp án A.</b>"
    },
    {
        "q": "Hòa tan $0,2\\text{ mol}$ sodium hydroxide (NaOH) vào nước thu được đúng $500\\text{ mL}$ dung dịch. Nồng độ mol ($C_M$) của dung dịch là:",
        "opts": [
            "$0,1\\text{ M}$",
            "$0,4\\text{ M}$",
            "$0,2\\text{ M}$",
            "$0,5\\text{ M}$"
        ],
        "ans": 1,
        "exp": "<b>Tính toán:</b> Đổi $500\\text{ mL} = 0,5\\text{ lít}$. Nồng độ mol: $C_M = \\frac{n}{V} = \\frac{0,2}{0,5} = 0,4\\text{ M}$.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Một bác sĩ cần dùng $500\\text{ g}$ dung dịch nước muối sinh lí NaCl $0,9\\%$ để súc họng sát khuẩn. Khối lượng muối NaCl tinh khiết có trong chai dung dịch đó là:",
        "opts": [
            "$4,5\\text{ g}$",
            "$9,0\\text{ g}$",
            "$0,45\\text{ g}$",
            "$45\\text{ g}$"
        ],
        "ans": 0,
        "exp": "<b>Tính toán:</b> $m_{\\text{NaCl}} = \\frac{m_{\\text{dd}} \\times C\\%}{100\\%} = \\frac{500 \\times 0,9}{100} = 4,5\\text{ g}$.<br><b>Chọn đáp án A.</b>"
    },

    # 13. ACID & BASE & THANG PH (Câu 45 - 48)
    {
        "q": "Theo danh pháp quốc tế IUPAC, hợp chất có công thức hóa học $\\text{HCl}$ có tên gọi chuẩn là:",
        "opts": [
            "Axit clohidric",
            "Hydrochloric acid",
            "Hydrogen chloride lỏng",
            "Chloric acid"
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Chương trình GDPT 2018 quy định dùng danh pháp tiếng Anh chuẩn IUPAC: $\\text{HCl}$ ở dạng dung dịch đọc là Hydrochloric acid.<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Dung dịch chất nào sau đây làm đổi màu quỳ tím sang màu xanh và làm dung dịch phenolphtalein không màu hóa thành màu hồng?",
        "opts": [
            "Hydrochloric acid ($\\text{HCl}$)",
            "Sodium chloride ($\\text{NaCl}$)",
            "Sodium hydroxide ($\\text{NaOH}$)",
            "Sulfuric acid ($\\text{H}_2\\text{SO}_4$)"
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Dung dịch kiềm (base tan) như NaOH làm quỳ tím hóa xanh và làm phenolphtalein không màu hóa hồng.<br><b>Chọn đáp án C.</b>"
    },
    {
        "q": "Nước cốt quả chanh có vị chua gắt. Giá trị pH của nước chanh xấp xỉ nằm trong khoảng nào sau đây?",
        "opts": [
            "$\\text{pH} \\approx 2 - 3$ (môi trường acid)",
            "$\\text{pH} \\approx 7$ (môi trường trung tính)",
            "$\\text{pH} \\approx 9 - 10$ (môi trường kiềm nhẹ)",
            "$\\text{pH} \\approx 12 - 13$ (môi trường kiềm mạnh)"
        ],
        "ans": 0,
        "exp": "<b>Giải chi tiết:</b> Quả chanh chứa citric acid nên có tính acid mạnh, thang pH nằm trong khoảng $2 - 3 < 7$.<br><b>Chọn đáp án A.</b>"
    },
    {
        "q": "Người nông dân kiểm tra thấy đất ruộng có độ $\\text{pH} = 4,8$. Để khử chua cải tạo đất giúp cây trồng phát triển tốt, biện pháp hiệu quả và tiết kiệm nhất là:",
        "opts": [
            "Bón thêm phân đạm urê.",
            "Tưới thêm dung dịch acid sulfuric loãng.",
            "Rắc vôi bột hoặc vôi sống (CaO) lên đất cày ải.",
            "Bón thật nhiều phân lân supephotphat."
        ],
        "ans": 2,
        "exp": "<b>Giải chi tiết:</b> Đất có $\\text{pH} < 7$ là đất chua (thừa acid). Vôi sống (CaO) hoặc vôi bột khi gặp nước tạo dung dịch kiềm $\\text{Ca(OH)}_2$ trung hòa acid trong đất.<br><b>Chọn đáp án C.</b>"
    },

    # 14. OXIDE & MUỐI & PHÂN BÓN HÓA HỌC (Câu 49 - 50)
    {
        "q": "Dãy chất nào sau đây gồm toàn các acidic oxide (oxide acid)?",
        "opts": [
            "$\\text{CaO, CuO, BaO}$",
            "$\\text{CO}_2, \\text{SO}_2, \\text{P}_2\\text{O}_5$",
            "$\\text{Na}_2\\text{O, Fe}_2\\text{O}_3, \\text{K}_2\\text{O}$",
            "$\\text{CaO, CO}_2, \\text{MgO}$"
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Acidic oxide thường là oxit của phi kim tương ứng với một axit: $\\text{CO}_2$ (ứng với $\\text{H}_2\\text{CO}_3$), $\\text{SO}_2$ (ứng với $\\text{H}_2\\text{SO}_3$), $\\text{P}_2\\text{O}_5$ (ứng với $\\text{H}_3\\text{PO}_4$).<br><b>Chọn đáp án B.</b>"
    },
    {
        "q": "Bao bì một loại phân bón hóa học có ghi ký hiệu NPK $16-16-8$. Ký hiệu này cung cấp cho người nông dân thông tin về tỉ lệ dinh dưỡng của những nguyên tố nào?",
        "opts": [
            "Sodium, Phosphorus, Potassium (Natri, Photpho, Kali)",
            "Nitrogen, Phosphorus, Potassium (Đạm, Lân, Kali)",
            "Nitrogen, Potassium, Krypton (Đạm, Kali, Kripton)",
            "Nickel, Phosphorus, Potassium (Niken, Photpho, Kali)"
        ],
        "ans": 1,
        "exp": "<b>Giải chi tiết:</b> Phân NPK cung cấp 3 nguyên tố đa lượng quan trọng nhất cho cây trồng: N (Đạm - kích thích thân lá), P (Lân - kích thích rễ, hoa quả), K (Kali - tăng khả năng chống chịu sâu bệnh, rét hạn).<br><b>Chọn đáp án B.</b>"
    }
]

print(f"Tong so cau hoi: {len(QUESTIONS)}")

# 1. TẠO FILE A4 HTML HOÀN CHỈNH
def build_a4_html():
    html_parts = []
    html_parts.append("""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>50 Câu Trắc Nghiệm Ôn Tập Hóa Học 8 HK1 (KNTT) – 08/11/2026</title>
<link rel="icon" type="image/svg+xml" href="https://diemdanhsv.com/images/logo-sen.svg">
<style>
:root {
  --luc: #0F6B55;
  --luc-dam: #064E3B;
  --lam: #1F4E79;
  --son: #B85042;
  --tho: #D97706;
  --muc: #1d1d1d;
  --xam-line: #CBD5E1;
  --nen-nhe: #F8FAFC;
}

* { box-sizing: border-box; }
html { background: #8a8f94; }
body {
  margin: 0;
  font-family: "Times New Roman", Times, "DejaVu Serif", serif;
  font-size: 12pt;
  line-height: 1.42;
  color: var(--muc);
}

#flow {
  width: 210mm;
  min-height: 297mm;
  margin: 10mm auto;
  background: #fff;
  padding: 15mm 18mm 18mm 25mm;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  position: relative;
}

/* Header nhận diện thương hiệu */
.brand-hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1.5pt solid var(--luc);
  padding-bottom: 6pt;
  margin-bottom: 10pt;
}
.brand-hdr .logos {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-hdr .logos img {
  height: 40px;
  width: auto;
  object-fit: contain;
}
.brand-hdr .info {
  text-align: right;
  font-size: 9.5pt;
  line-height: 1.35;
  color: #4B5563;
}
.brand-hdr .info .org {
  font-weight: bold;
  color: var(--luc-dam);
  text-transform: uppercase;
  font-size: 10pt;
}
.brand-hdr .info .author {
  color: var(--son);
  font-weight: 600;
}

h1 {
  font-size: 15pt;
  text-transform: uppercase;
  text-align: center;
  color: var(--luc-dam);
  margin: 4pt 0 2pt;
}
.subtitle {
  font-size: 10.5pt;
  text-align: center;
  font-style: italic;
  color: #4B5563;
  margin: 0 0 8pt;
}
.exam-meta {
  display: flex;
  justify-content: space-between;
  background: var(--nen-nhe);
  border: 1pt solid #E2E8F0;
  border-radius: 4px;
  padding: 4pt 10pt;
  font-size: 10pt;
  margin-bottom: 10pt;
}

h2 {
  font-size: 12.5pt;
  color: #fff;
  background: var(--luc);
  padding: 4pt 8pt;
  border-radius: 3px;
  margin: 12pt 0 6pt;
  text-transform: uppercase;
}

p {
  margin: 0 0 4pt;
  text-align: justify;
}

.src {
  font-size: 10pt;
  color: #64748B;
  font-style: italic;
  margin-bottom: 8pt;
}

.q-block {
  margin-bottom: 8pt;
  break-inside: avoid;
  page-break-inside: avoid;
}

.opts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2pt 6pt;
  margin: 2pt 0 4pt 5mm;
}
.opts.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.opts.one {
  grid-template-columns: 1fr;
}

.center {
  text-align: center;
  font-weight: bold;
  margin: 14pt 0;
  color: #64748B;
}

/* Bảng đáp án */
.ds {
  border-collapse: collapse;
  margin: 4pt 0 8pt;
  width: 100%;
}
.ds td, .ds th {
  border: 0.5pt solid #64748B;
  padding: 2.5pt 4pt;
  text-align: center;
  font-size: 9.5pt;
}
.ds th {
  background: #F1F5F9;
  font-weight: bold;
}

details.print-hidden {
  background: #F1F5F9;
  border: 1pt solid #CBD5E1;
  border-radius: 5px;
  padding: 8pt 12pt;
  margin-top: 15pt;
}
details.print-hidden summary {
  font-weight: bold;
  color: var(--luc-dam);
  cursor: pointer;
  padding: 4pt 0;
}

.ftr-brand {
  margin-top: 16pt;
  border-top: 0.8pt solid var(--xam-line);
  padding-top: 4pt;
  font-size: 9pt;
  color: #64748B;
  display: flex;
  justify-content: space-between;
  font-style: italic;
}

@media print {
  html { background: #fff; }
  body { font-size: 11pt; line-height: 1.35; }
  #flow {
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }
  .print-hidden { display: none !important; }
  .q-block { break-inside: avoid; page-break-inside: avoid; }
}

@page {
  size: A4;
  margin: 12mm 15mm 15mm 20mm;
}
</style>
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
  }
};
</script>
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
</head>
<body>
<div id="flow">

  <!-- Header nhận diện thương hiệu -->
  <div class="brand-hdr">
    <div class="logos">
      <img src="https://firebasestorage.googleapis.com/v0/b/link-anh-web.firebasestorage.app/o/ttbdvh.jpg?alt=media&token=f270aa9b-a2bc-48e8-8910-80742b542615" alt="TTBDVH Logo"/>
      <img src="https://firebasestorage.googleapis.com/v0/b/link-anh-web.firebasestorage.app/o/Logo-chinh-hcmus.png?alt=media&token=9cf3a1de-75f1-493b-8711-fd22c7b98738" alt="HCMUS Logo"/>
    </div>
    <div class="info">
      <div class="org">TT Bồi Dưỡng Văn Hóa · ĐH KHTN ĐHQG-HCM</div>
      <div>Biên soạn: <span class="author">ThS. Đinh Quốc Tuấn</span></div>
      <div><i>Học hiểu bản chất – Tự tin bứt phá</i></div>
    </div>
  </div>

  <h1>50 CÂU TRẮC NGHIỆM ÔN TẬP HÓA HỌC LỚP 8 – HỌC KỲ 1</h1>
  <p class="subtitle">Khoa học tự nhiên 8 · Phân môn Hóa học · Bộ sách Kết nối tri thức với cuộc sống (KNTT)</p>

  <div class="exam-meta">
    <div><b>Họ và tên học sinh:</b> ..............................................................</div>
    <div><b>Lớp:</b> 8/......</div>
    <div><b>Thời gian khuyến nghị:</b> 60 phút (theo dõi nhịp độ từng câu)</div>
  </div>

  <h2>PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN</h2>
  <p class="src"><i>Thí sinh chọn một phương án trả lời đúng duy nhất trong mỗi câu hỏi từ Câu 1 đến Câu 50.</i></p>
""")

    labels = ["A.", "B.", "C.", "D."]
    for idx, q in enumerate(QUESTIONS):
        q_num = idx + 1
        # Quyết định layout 1 cột, 2 cột hay 4 cột dựa trên độ dài của options
        max_opt_len = max(len(opt) for opt in q["opts"])
        if max_opt_len > 45:
            grid_cls = "opts one"
        elif max_opt_len > 22:
            grid_cls = "opts two"
        else:
            grid_cls = "opts"

        opts_html = []
        for o_idx, opt in enumerate(q["opts"]):
            opts_html.append(f"      <div><b>{labels[o_idx]}</b> {opt}</div>")

        block = f"""  <div class="q-block">
    <p><b>Câu {q_num}:</b> {q['q']}</p>
    <div class="{grid_cls}">
{chr(10).join(opts_html)}
    </div>
  </div>
"""
        html_parts.append(block)

    html_parts.append("""  <p class="center">——— HẾT ———</p>

  <!-- Khối đáp án duy nhất đặt ở cuối flow, ẩn khi in ấn -->
  <details class="print-hidden">
    <summary>Đáp án &amp; Lời giải chi tiết (Dành cho Giáo viên &amp; Phụ huynh — bấm để mở)</summary>

    <p><b>Bảng đáp án trắc nghiệm (Câu 1 – 25):</b></p>
    <table class="ds">
      <tr><th>Câu</th>""" + "".join(f"<th>{i}</th>" for i in range(1, 26)) + """</tr>
      <tr><th>Đáp án</th>""" + "".join(f"<td>{chr(65 + QUESTIONS[i-1]['ans'])}</td>" for i in range(1, 26)) + """</tr>
    </table>

    <p><b>Bảng đáp án trắc nghiệm (Câu 26 – 50):</b></p>
    <table class="ds">
      <tr><th>Câu</th>""" + "".join(f"<th>{i}</th>" for i in range(26, 51)) + """</tr>
      <tr><th>Đáp án</th>""" + "".join(f"<td>{chr(65 + QUESTIONS[i-1]['ans'])}</td>" for i in range(26, 51)) + """</tr>
    </table>

    <p><b>Hướng dẫn giải chi tiết từng câu:</b></p>
    <ul>
""")

    for idx, q in enumerate(QUESTIONS):
        q_num = idx + 1
        ans_char = chr(65 + q["ans"])
        html_parts.append(f"      <li><b>Câu {q_num} (Đáp án {ans_char}):</b> {q['exp']}</li>\n")

    html_parts.append("""    </ul>
  </details>

  <div class="ftr-brand">
    <div>Hệ thống dạy kèm &amp; khảo thí BDVH — bdvh.diemdanhsv.com</div>
    <div>© Bản quyền thuộc ThS. Đinh Quốc Tuấn – Mục đích phi lợi nhuận – Vì giáo dục</div>
  </div>

</div>
</body>
</html>
""")

    full_html = "".join(html_parts)
    return full_html

# 2. CẬP NHẬT VÀO STANDARD_EXAMS.JSON
def update_standard_exams():
    exam_obj = {
        "exam_code": "KHTN8_HOA_HK1_50C",
        "grade": "8",
        "subject": "khtn",
        "title": "50 Câu Trắc Nghiệm Ôn Tập Hóa Học 8 Học Kỳ 1 (KNTT)",
        "description": "Bộ 50 câu trắc nghiệm tổng hợp toàn bộ phân môn Hóa học 8 HK1 - Sách Kết nối tri thức với cuộc sống. Tích hợp đồng hồ đo thời gian chuẩn xác từng câu và phân tích năng lực sâu.",
        "time_minutes": 60,
        "questions": QUESTIONS
    }

    json_path = r"D:\202610-Antigravity\PhatTrien-Repo-github\bdvh\standard_exams.json"
    with open(json_path, "r", encoding="utf-8") as f:
        exams = json.load(f)

    # Kiểm tra xem đã có chưa
    existing_idx = next((i for i, ex in enumerate(exams) if ex.get("exam_code") == "KHTN8_HOA_HK1_50C"), None)
    if existing_idx is not None:
        exams[existing_idx] = exam_obj
        print("Da cap nhat de thi KHTN8_HOA_HK1_50C trong standard_exams.json")
    else:
        exams.append(exam_obj)
        print("Da them moi de thi KHTN8_HOA_HK1_50C vao standard_exams.json")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(exams, f, ensure_ascii=False, indent=2)
    print(f"Tong so de thi hien co trong standard_exams.json: {len(exams)}")

def main():
    html_content = build_a4_html()

    # Lưu file A4 vào D:\2026-Daykem
    path1 = r"D:\2026-Daykem\2026-11-08_KHTN8_50Cau-TracNghiem-HK1_HoaHoc-KNTT-A4.html"
    with open(path1, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Da tao file A4 tai: {path1} ({os.path.getsize(path1)} bytes)")

    # Lưu file A4 vào bdvh/de_thi_a4
    path2 = r"D:\202610-Antigravity\PhatTrien-Repo-github\bdvh\de_thi_a4\2026-11-08_KHTN8_50Cau-TracNghiem-HK1_HoaHoc-KNTT-A4.html"
    with open(path2, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Da sao luu file A4 tai: {path2} ({os.path.getsize(path2)} bytes)")

    # Cập nhật standard_exams.json
    update_standard_exams()

if __name__ == "__main__":
    main()
