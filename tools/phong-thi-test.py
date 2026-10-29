#!/usr/bin/env python3
"""Kiểm thử trọn luồng phòng thi bdvh qua HTTP (CHỈ dùng với CSDL SQLite chạy thử).
    cd bdvh && php -S 127.0.0.1:8091 &   (máy không có ../api/lib → tự dùng bdvh_local.sqlite)
    python3 tools/phong-thi-test.py http://127.0.0.1:8091 MẬT_KHẨU_GV
"""
import json, sys, time, urllib.request, http.cookiejar

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8091').rstrip('/') + '/api.php'
PASS = sys.argv[2] if len(sys.argv) > 2 else 'Tuan@2026'
fails = 0

class Client:
    def __init__(self):
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def call(self, action, **kw):
        req = urllib.request.Request(BASE, data=json.dumps(dict(action=action, **kw)).encode(), headers={'Content-Type': 'application/json'})
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

gv = Client()
bad(gv.call('room_list'), 'Chưa đăng nhập GV thì không xem được phòng')
ok(gv.call('teacher_login', password=PASS), 'GV đăng nhập')
rows = [
    {'type': 'choice', 'q': 'Giá trị của $2^3$ là:', 'opts': ['6', '8', '9', '5'], 'ans': 'B', 'exp': '$2^3 = 8$'},
    {'type': 'choice', 'q': 'Số nào chia hết cho 9?', 'opts': ['123', '729', '512', 'Tất cả các ý trên'], 'ans': 'B', 'exp': 'Tổng chữ số 18'},
    {'type': 'true_false', 'q': 'Xét tính đúng sai:', 'opts': ['$\\sqrt{4}=2$', '$1>2$', '$0$ là số tự nhiên', '$\\pi$ là số hữu tỉ'], 'ans': 'Đ,S,Đ,S', 'exp': ''},
    {'type': 'short', 'q': 'Tính $7 \\cdot 8$', 'ans': '56', 'exp': ''},
    {'type': 'choice', 'q': 'Căn bậc hai số học của 9:', 'opts': ['3', '-3', '81', '9'], 'ans': 'A', 'exp': ''},
]
bad_rows = [{'type': 'choice', 'q': 'x', 'opts': ['a', 'b'], 'ans': 'D'}]
r = gv.call('room_import_exam', title='x', rows=bad_rows, dryRun=True)
check(r['data']['errors'] and r['data']['errors'][0]['row'] == 1, 'Báo lỗi đáp án không khớp phương án')
imp = ok(gv.call('room_import_exam', title='Kiểm tra 15 phút Toán 6 (đề kín)', grade='L06', subject='TOAN', time_minutes=15, rows=rows), 'Nhập đề kín 5 câu')
exam_id = imp['exam_id']

hs_spy = Client()
hs_spy.call('guest_login', full_name='Người ngoài', phone='0900000000')
bad(hs_spy.call('get_exam', exam_id=exam_id), 'Đề kín không mở được ở chế độ luyện tập')
bad(hs_spy.call('submit_exam', exam_id=exam_id, answers={}), 'Không nộp thử đề kín để dò đáp án')

room = ok(gv.call('room_save', exam_id=exam_id, label='Lớp 6A', duration_minutes=15, prep_minutes=5, settings={'maxViolations': 2}), 'Tạo phòng')['room_id']
ok(gv.call('room_open', room_id=room), 'Mở phòng (5 phút chuẩn bị)')
mon = ok(gv.call('room_monitor', room_id=room), 'Bảng giám sát')
code, pin = mon['room']['code'], mon['room']['pin']
check(mon['room']['status'] == 'LOBBY', f'Phòng LOBBY, mã {code}')

hs = {}
for i, (name, phone) in enumerate([('Nguyễn An', '0911000001'), ('Trần Bình', '0911000002'), ('Lê Chi', '0911000003')]):
    c = Client()
    bad(c.call('room_join', code=code, deviceId='dev%dabcdefghijklmn' % i), f'{name}: chưa đăng nhập thì không vào được')
    ok(c.call('guest_login', full_name=name, phone=phone), f'{name}: đăng nhập tài khoản bdvh')
    peek = ok(c.call('room_peek', code=code), f'{name}: quét QR xem phòng')
    t = ok(c.call('room_join', code=code, deviceId='dev%dabcdefghijklmn' % i, deviceInfo='Test'), f'{name}: vào phòng')['token']
    hs[name] = (c, t, 'dev%dabcdefghijklmn' % i, phone)
check(peek['room']['questionCount'] == 5, 'Phòng có 5 câu')
bad(hs['Nguyễn An'][0].call('room_paper', t=hs['Nguyễn An'][1]), 'Chưa đến giờ thì không lấy được đề')
for name, (c, t, *_ ) in hs.items():
    ok(c.call('room_ready', t=t), f'{name}: sẵn sàng')
ok(gv.call('room_start', room_id=room), 'GV bắt đầu ngay')
bad(hs_spy.call('get_exam', exam_id=exam_id), 'Trong giờ thi: đề vẫn bị khoá ở chế độ luyện tập')

papers = {n: ok(c.call('room_paper', t=t), f'{n}: nhận đề') for n, (c, t, *_ ) in hs.items()}
p = papers['Nguyễn An']
check('ans' not in json.dumps(p['questions']) and 'exp' not in json.dumps(p['questions']), 'Đề gửi xuống máy HS không có đáp án / lời giải')
keymap = {0: 1, 1: 1, 2: {'0': 1, '1': 0, '2': 1, '3': 0}, 3: '56', 4: 0}
right = {str(i): v for i, v in keymap.items()}
ok(hs['Nguyễn An'][0].call('room_save_answers', t=hs['Nguyễn An'][1], answers=right), 'An lưu bài (đúng hết)')
ok(hs['Trần Bình'][0].call('room_save_answers', t=hs['Trần Bình'][1], answers={'0': 0, '1': 0, '2': {'0': 0, '1': 0, '2': 0, '3': 0}, '3': '55', '4': 1}), 'Bình lưu bài (sai hết)')
ok(hs['Lê Chi'][0].call('room_save_answers', t=hs['Lê Chi'][1], answers={'0': 1, '3': ' 56 ', '4': 3}), 'Chi lưu bài (2/5)')

c, t, *_ = hs['Lê Chi']
st = ok(c.call('room_state', t=t, events=[{'type': 'hidden'}]), 'Chi chuyển tab lần 1')
check(st['me']['violations'] == 1 and st['me']['status'] == 'DOING', 'Chi: 1 vi phạm, vẫn làm bài')
time.sleep(2.2)
st = ok(c.call('room_state', t=t, events=[{'type': 'copy'}]), 'Chi sao chép')
check(st['me']['status'] == 'LOCKED', 'Chi vượt ngưỡng 2 → BỊ KHOÁ')
bad(c.call('room_save_answers', t=t, answers={'1': 1}), 'Bài bị khoá không lưu được')
bad(c.call('room_pin', t=t, pin='000000' if pin != '000000' else '111111'), 'PIN sai bị từ chối')
st = ok(c.call('room_pin', t=t, pin=pin), 'GV nhập PIN mở khoá')
check(st['me']['status'] == 'DOING' and st['me']['limit'] == 3, 'Mở khoá: làm tiếp, ngưỡng thành 3')

c2 = Client()
c2.call('guest_login', full_name='Trần Bình', phone='0911000002')
bad(c2.call('room_join', code=code, deviceId='mayKhac0123456789xyz'), 'Bình vào từ máy thứ hai bị chặn')
st = ok(hs['Trần Bình'][0].call('room_state', t=hs['Trần Bình'][1]), 'Bình trạng thái')
check(st['me']['violations'] == 1, 'Máy thứ hai tính 1 vi phạm cho Bình')

r1 = ok(hs['Nguyễn An'][0].call('room_submit', t=hs['Nguyễn An'][1]), 'An nộp bài')
check(r1['result'].get('score10') == 10.0, 'An đúng hết → 10 điểm')
r2 = ok(hs['Trần Bình'][0].call('room_submit', t=hs['Trần Bình'][1]), 'Bình nộp bài')
check(r2['result'].get('score10') == 0.0, 'Bình sai hết → 0 điểm')
check('subId' not in r1['result'], 'Chưa công bố: HS chưa có link phiếu kết quả')

res = ok(gv.call('room_results', room_id=room), 'Kết quả (khi phòng còn mở)')
sub_an = [s for s in res['students'] if s['name'] == 'Nguyễn An'][0]['subId']
bad(hs['Nguyễn An'][0].call('get_submission', sub_id=sub_an), 'Chưa công bố: ket-qua bị khoá với HS')
bad(hs_spy.call('get_submission', sub_id=sub_an), 'Người ngoài không xem được lời giải bài trong phòng')

ok(gv.call('room_close', room_id=room), 'GV thu bài (Chi được chấm theo phần đã lưu)')
res = ok(gv.call('room_results', room_id=room), 'Kết quả + phân tích câu')
chi = [s for s in res['students'] if s['name'] == 'Lê Chi'][0]
check(chi['score'] == 4.0 and chi['reason'] == 'gv_thu', f"Chi: 2/5 câu → 4 điểm, lý do GV thu (thực tế {chi['score']}, {chi['reason']})")
check(res['stats']['n'] == 3 and len(res['items']) == 5 and res['items'][0]['p'] is not None, 'Thống kê 3 bài, 5 câu có độ khó p')
ok(gv.call('room_publish', room_id=room, published=True), 'GV công bố đáp án')
st = ok(hs['Nguyễn An'][0].call('room_state', t=hs['Nguyễn An'][1]), 'An xem trạng thái sau công bố')
check(st['result'].get('subId') == sub_an, 'An có link phiếu kết quả')
sub = hs['Nguyễn An'][0].call('get_submission', sub_id=sub_an)
check(sub.get('status') == 'success' and sub['submission']['score'] == 10.0 and sub['submission']['details'][0]['explanation'] != '', 'ket-qua.html: điểm 10, có lời giải')
ex = hs_spy.call('get_exam', exam_id=exam_id)
bad(ex, 'Đề kín vẫn không mở ở chế độ luyện tập sau khi thi')
lst = ok(gv.call('room_list'), 'Danh sách phòng')
check(lst[0]['status'] == 'CLOSED' and int(lst[0]['attempts']) == 3, 'Phòng CLOSED, 3 lượt làm')
dash = gv.call('teacher_dashboard')
check(sum(1 for s in dash.get('submissions', []) if 'đề kín' in (s.get('exam_title') or '')) == 3, 'Bảng điều khiển GV cũ thấy 3 bài nộp từ phòng thi')
print('\nTẤT CẢ ĐỀU ĐẠT' if not fails else f'\n{fails} KIỂM TRA THẤT BẠI')
sys.exit(1 if fails else 0)
