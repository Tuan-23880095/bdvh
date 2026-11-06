#!/usr/bin/env python3
"""Kiểm thử chức năng Ngân hàng câu hỏi & Tạo đề (action nh_*) qua HTTP — CHỈ dùng với CSDL SQLite chạy thử.
    cd bdvh && php -S 127.0.0.1:8092 &
    python3 tools/ngan-hang-test.py http://127.0.0.1:8092 MẬT_KHẨU_GV đường_dẫn/ngan_hang_web_THU.json
"""
import json, sys, urllib.request, http.cookiejar

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8092').rstrip('/') + '/api.php'
PASS = sys.argv[2] if len(sys.argv) > 2 else 'Tuan@2026'
FILE = sys.argv[3] if len(sys.argv) > 3 else 'ngan_hang_web_THU.json'
fails = 0


class Client:
    def __init__(self):
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def call(self, action, **kw):
        req = urllib.request.Request(BASE + '?action=' + action, data=json.dumps(kw).encode(), headers={'Content-Type': 'application/json'})
        try:
            raw = self.op.open(req).read()
        except urllib.error.HTTPError as e:
            raw = e.read()
        return json.loads(raw)


def ok(r, label):
    global fails
    if r.get('status') != 'success':
        fails += 1; print('✗', label, '—', r.get('message')); return {}
    print('✓', label); return r.get('data', r)


def bad(r, label):
    global fails
    if r.get('status') == 'success':
        fails += 1; print('✗', label, '— lẽ ra bị từ chối')
    else:
        print('✓', label, '(từ chối đúng:', r.get('message'), ')')


def check(c, label):
    global fails
    print(('✓ ' if c else '✗ ') + label)
    if not c: fails += 1


d = json.load(open(FILE, encoding='utf-8'))
cau = d['cau']
lan = Client()
bad(lan.call('nh_thong_ke'), 'Chưa đăng nhập: không xem được thống kê ngân hàng')
bad(lan.call('nh_nap', phien='x1', cau=cau[:2]), 'Chưa đăng nhập: không nạp được')
bad(lan.call('nh_nap', token='a' * 48, phien='x1', cau=cau[:2]), 'Mã nạp sai: không nạp được')
bad(lan.call('nh_xem_truoc', lop='L11', mon='Toán', ma_tran={'abcd': {'*': 3}}), 'Chưa đăng nhập: không rút đề được')

gv = Client()
ok(gv.call('teacher_login', password=PASS), 'Đăng nhập giảng viên')
tk = ok(gv.call('nh_thong_ke'), 'Thống kê khi ngân hàng rỗng')
check(tk.get('tong') == 0, 'Ngân hàng ban đầu rỗng')

# Nạp 2 lô cùng phiên
phien = d['phien']
k1 = ok(gv.call('nh_nap', phien=phien, cau=cau[:150]), 'Nạp lô 1 (150 câu)')
k2 = ok(gv.call('nh_nap', phien=phien, cau=cau[150:]), f'Nạp lô 2 ({len(cau) - 150} câu)')
check(k1.get('so_loi', 1) + k2.get('so_loi', 1) == 0, f'Không câu nào bị từ chối (lỗi: {k1.get("loi")}{k2.get("loi")})')
x = ok(gv.call('nh_nap_xong', phien=phien), 'Kết thúc phiên nạp')
check(x.get('con') == len(cau), f'Ngân hàng có đúng {len(cau)} câu (có {x.get("con")})')

# Câu hỏng phải bị từ chối, không làm hỏng lô
hong = [dict(cau[0], id='HONG-1', dap_an=''), dict(cau[0], id='HONG-2', loai='abc'), dict(cau[0], id='HONG-3', de_html='<script>alert(1)</script>')]
k = ok(gv.call('nh_nap', phien='p-hong', cau=hong), 'Nạp lô có câu hỏng')
check(k.get('so_loi') == 3 and k.get('moi') == 0, f'Cả 3 câu hỏng bị từ chối ({k.get("loi")})')

tk = ok(gv.call('nh_thong_ke'), 'Thống kê sau khi nạp')
check(tk['tong'] == len(cau), 'Tổng số câu khớp')
loai = {}
for g in tk['nhom']:
    loai[g['loai']] = loai.get(g['loai'], 0) + g['n']
print('   theo loại:', loai)

# Xem trước khuôn 2025
mt = {'abcd': {'*': 12}, 'dung_sai_4': {'*': 4}, 'tra_loi_ngan': {'*': 6}}
xt = ok(gv.call('nh_xem_truoc', lop='L11', mon='Toán', chuong=[], ma_tran=mt), 'Xem trước đề khuôn 2025 (12-4-6)')
ids = [c['id'] for c in xt.get('cau', [])]
check(len(ids) == 22 and len(set(ids)) == 22, f'Đủ 22 câu, không trùng (có {len(ids)})')
check([c['loai'] for c in xt['cau']].count('dung_sai_4') == 4, 'Đúng 4 câu Đúng/Sai')
check(not xt.get('thieu'), 'Không thiếu câu')
# Theo mức độ + chương
ch = sorted({g['chuong'] for g in tk['nhom']})
# chương có nhiều câu Nhận biết nhất
dem_nb = {}
for g in tk['nhom']:
    if g['loai'] == 'abcd' and g['muc_do'] == 'NB': dem_nb[g['chuong']] = dem_nb.get(g['chuong'], 0) + g['n']
c1 = max(dem_nb, key=dem_nb.get)
xt2 = ok(gv.call('nh_xem_truoc', lop='L11', mon='Toán', chuong=[c1], ma_tran={'abcd': {'NB': 3, 'TH': 2}}), f'Xem trước theo mức độ, chỉ chương "{c1}"')
check(all(c['chuong'] == c1 for c in xt2['cau']), 'Mọi câu đúng chương đã chọn')
check([c['muc_do'] for c in xt2['cau']].count('NB') == 3 and [c['muc_do'] for c in xt2['cau']].count('TH') == 2, 'Đúng 3 câu Nhận biết + 2 Thông hiểu')
xt3 = ok(gv.call('nh_xem_truoc', lop='L11', mon='Toán', chuong=[], ma_tran={'abcd': {'VDC': 50}}), 'Xin quá số câu VDC có')
check(bool(xt3.get('thieu')), f'Báo thiếu câu rõ ràng: {xt3.get("thieu")}')
bad(gv.call('nh_xem_truoc', lop='L11', mon='Toán', ma_tran={}), 'Ma trận rỗng bị từ chối')

# Đổi một câu
c0 = xt['cau'][0]
doi = ok(gv.call('nh_doi_cau', lop='L11', mon='Toán', chuong=[], loai=c0['loai'], o=c0['o'], dang_co=ids), 'Đổi câu 1')
check(doi.get('id') not in ids and doi.get('loai') == c0['loai'], 'Câu mới khác các câu đang có, cùng loại')
ids[0] = doi['id']

# Lưu thành bộ bài giảng
bad(gv.call('nh_tao_de', ids=ids, tieu_de=''), 'Thiếu tên đề bị từ chối')
bo = ok(gv.call('nh_tao_de', ids=ids, tieu_de='Thử ngân hàng – Toán 11 GK1', ngay='2026-11-06'), 'Lưu đề thành bộ bài giảng')
check(bo.get('so_cau') == 22, 'Bộ có 22 câu')
full = ok(gv.call('bg_get', ma=bo.get('ma', '')), 'Mở bộ vừa tạo bằng bg_get (dùng cho trình chiếu)')
cs = full.get('cau', [])
check([c['so'] for c in cs] == [f'Câu {i}' for i in range(1, 23)], 'Đánh số Câu 1…22 liên tục')
check([c['loai'] for c in cs] == ['abcd'] * 12 + ['dung_sai_4'] * 4 + ['tra_loi_ngan'] * 6, 'Xếp đúng thứ tự Phần I → II → III')
check(all(c['dap_an'] for c in cs), 'Mọi câu có đáp án')
check(full.get('khoi') == 'L11' and full.get('thong_tin', {}).get('ngay') == '2026-11-06', 'Lớp và ngày dạy đúng')
tk2 = ok(gv.call('nh_thong_ke'), 'Thống kê sau khi tạo đề')
check(sum(g['da_dung'] for g in tk2['nhom']) == 22, 'Đánh dấu 22 câu đã dùng')
# Ưu tiên câu ít dùng: đề tiếp theo không lặp câu vừa dùng (kho đủ lớn)
xt4 = ok(gv.call('nh_xem_truoc', lop='L11', mon='Toán', chuong=[], ma_tran=mt, uu_tien_it_dung=True), 'Rút đề thứ hai')
check(not set(c['id'] for c in xt4['cau']) & set(ids), 'Đề thứ hai không lặp câu của đề đầu')

# Phòng bình chọn: HS thấy câu Đúng/Sai 4 ý với 4 ý
p = ok(gv.call('bg_phong_dat', bo_id=bo['bo_id'], cau=13, loai='de'), 'Chiếu câu 13 (Đúng/Sai) cho phòng bình chọn')
hs = Client()
xem = ok(hs.call('bg_hs_xem', p=p.get('ma_phong', ''), client_id='hs_test_1'), 'Học sinh xem câu đang chiếu')
q = xem.get('cau_hoi') or {}
check(q.get('loai') == 'dung_sai_4' and len(q.get('lua_chon', [])) == 4 and q.get('binh_chon'), 'HS có 4 ý Đúng/Sai để chọn')
check('dap_an' not in q, 'HS chưa thấy đáp án khi đang ở slide Đề')
ok(hs.call('bg_hs_chon', p=p.get('ma_phong', ''), cau=13, client_id='hs_test_1', ten='HS Thử', tra_loi='DDSS'), 'HS gửi Đúng/Sai 4 ý')
# Trả lời ngắn: đáp số chấm được
ok(gv.call('bg_phong_dat', bo_id=bo['bo_id'], cau=17, loai='dap-an'), 'Chiếu đáp án câu 17 (trả lời ngắn)')
xem = ok(hs.call('bg_hs_xem', p=p.get('ma_phong', ''), client_id='hs_test_1'), 'HS xem đáp án câu 17')
check(bool((xem.get('cau_hoi') or {}).get('dap_an')), f'Có đáp số để chấm: {(xem.get("cau_hoi") or {}).get("dap_an")}')

# Nạp lại phiên mới chỉ còn 200 câu → gỡ phần còn lại, giữ số lần dùng
ok(gv.call('nh_nap', phien='p-moi', cau=cau[:200]), 'Nạp lại phiên mới (200 câu)')
x = ok(gv.call('nh_nap_xong', phien='p-moi'), 'Kết thúc phiên mới')
check(x.get('con') == 200 and x.get('da_go') == len(cau) - 200, f'Gỡ đúng {len(cau) - 200} câu không còn duyệt')
ok(gv.call('bg_get', ma=bo['ma']), 'Bộ bài giảng đã tạo vẫn mở được sau khi ngân hàng đổi')
print('\nKẾT QUẢ:', 'TẤT CẢ ĐẠT' if not fails else f'{fails} LỖI')
sys.exit(1 if fails else 0)
