<?php
declare(strict_types=1);

/**
 * bdvh/ngan-hang-api.php — NGÂN HÀNG CÂU HỎI & TẠO ĐỀ NGẪU NHIÊN (action nh_*).
 * Được api.php nạp sau bai-giang-api.php; dùng lại hàm của bài giảng (bg_upsert, bg_clean_html…).
 *
 * Luồng:
 *   Máy nhà: ngan_hang_v2.db (Ba Sáu bóc tách) + Excel thầy duyệt → xuat_ngan_hang_web.py → file JSON
 *            (chỉ câu da_duyet = 1) → đẩy lên bằng mã nạp, hoặc thầy kéo file JSON vào trang bai-giang.html.
 *   Web:     bảng bdvh_nh_cau giữ câu đã duyệt → thầy chọn lớp, chương, số câu theo loại × mức độ
 *            → nh_xem_truoc rút ngẫu nhiên (ưu tiên câu ít dùng) → nh_tao_de lưu thành MỘT bộ bài giảng
 *            bình thường, nên trình chiếu, điện thoại học sinh, bình chọn và báo cáo đều dùng lại nguyên vẹn.
 *
 * Quyền: mọi thao tác cần đăng nhập giảng viên; riêng nạp dữ liệu nhận thêm "mã nạp ngân hàng" (chỉ lưu bản băm).
 */

if (!defined('BDVH_API')) {
    http_response_code(404);
    exit;
}

const NH_LOAI = ['abcd', 'dung_sai_4', 'tra_loi_ngan', 'dung_sai', 'tu_luan'];
const NH_MUC = ['NB', 'TH', 'VD', 'VDC'];
const NH_PHAN = ['abcd' => 'Phần I. Trắc nghiệm nhiều phương án', 'dung_sai' => 'Phần II. Đúng/Sai', 'dung_sai_4' => 'Phần II. Đúng/Sai',
                 'tra_loi_ngan' => 'Phần III. Trả lời ngắn', 'tu_luan' => 'Phần IV. Tự luận'];
const NH_MAX_LO = 400;          // tối đa số câu mỗi lần nạp
const NH_MAX_CAU_DE = 60;       // tối đa số câu một đề tạo ra

function nh_ensure_tables(): void
{
    global $pdo;
    try { $pdo->query('SELECT 1 FROM bdvh_nh_cau LIMIT 1'); return; } catch (Throwable $e) {}
    if (r_sqlite()) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_nh_cau (id TEXT PRIMARY KEY, lop TEXT NOT NULL, mon TEXT NOT NULL, chuong TEXT NOT NULL,
            muc_do TEXT NOT NULL, loai TEXT NOT NULL, de_html TEXT NOT NULL, lua_chon TEXT NOT NULL, dap_an TEXT NOT NULL,
            dap_an_html TEXT NOT NULL, loi_giai_html TEXT NOT NULL, nguon TEXT NOT NULL, bo_nguon TEXT NOT NULL, bam TEXT NOT NULL,
            phien TEXT NOT NULL, so_lan_dung INTEGER NOT NULL DEFAULT 0, dung_gan_nhat TEXT NULL, nap_luc TEXT NOT NULL)");
        $pdo->exec('CREATE INDEX IF NOT EXISTS ix_nh_loc ON bdvh_nh_cau (lop, mon, loai, muc_do)');
    } else {
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_nh_cau (id VARCHAR(80) NOT NULL PRIMARY KEY, lop VARCHAR(12) NOT NULL, mon VARCHAR(40) NOT NULL,
            chuong VARCHAR(200) NOT NULL, muc_do VARCHAR(4) NOT NULL, loai VARCHAR(20) NOT NULL, de_html MEDIUMTEXT NOT NULL,
            lua_chon MEDIUMTEXT NOT NULL, dap_an VARCHAR(120) NOT NULL, dap_an_html TEXT NOT NULL, loi_giai_html MEDIUMTEXT NOT NULL,
            nguon VARCHAR(255) NOT NULL, bo_nguon VARCHAR(255) NOT NULL, bam VARCHAR(64) NOT NULL, phien VARCHAR(40) NOT NULL,
            so_lan_dung INT NOT NULL DEFAULT 0, dung_gan_nhat DATETIME NULL, nap_luc DATETIME NOT NULL,
            KEY ix_nh_loc (lop, mon, loai, muc_do)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }
}

/* ============================ Quyền ============================ */

function nh_token_ok(array $in): bool
{
    $t = (string) ($in['token'] ?? '');
    if (strlen($t) < 32) { return false; }
    $h = rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_ngan_hang']);
    return is_string($h) && $h !== '' && hash_equals($h, hash('sha256', $t));
}
function nh_gv(): void
{
    if (!r_is_teacher()) { json_out(['status' => 'error', 'can_dang_nhap' => true, 'message' => 'Ngân hàng câu hỏi có đáp án — cần đăng nhập giảng viên.'], 401); }
}

/* ============================ Nạp dữ liệu ============================ */

/** Chuẩn hoá một câu từ file xuất ở máy nhà. Trả null (kèm lý do) nếu không hợp lệ. */
function nh_norm(array $c, ?string &$loi): ?array
{
    $id = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($c['id'] ?? ''));
    $loai = (string) ($c['loai'] ?? '');
    $muc = strtoupper((string) ($c['muc_do'] ?? ''));
    if ($id === '' || strlen($id) > 80) { $loi = 'thiếu id'; return null; }
    if (!in_array($loai, NH_LOAI, true)) { $loi = "$id: loại '$loai' không hợp lệ"; return null; }
    if (!in_array($muc, NH_MUC, true)) { $muc = 'TH'; }
    $de = bg_clean_html((string) ($c['de_html'] ?? ''));
    if ($de === '') { $loi = "$id: không có nội dung đề"; return null; }
    $lc = [];
    foreach ((array) ($c['lua_chon'] ?? []) as $o) {
        if (!is_array($o)) { continue; }
        $lc[] = ['k' => mb_substr(trim((string) ($o['k'] ?? '')), 0, 4), 'html' => bg_clean_html((string) ($o['html'] ?? ''))];
    }
    $da = trim((string) ($c['dap_an'] ?? ''));
    if ($loai === 'abcd' && (count($lc) < 2 || !in_array(strtoupper($da), array_map(static fn ($o) => strtoupper($o['k']), $lc), true))) {
        $loi = "$id: trắc nghiệm thiếu phương án hoặc đáp án"; return null;
    }
    if ($loai === 'dung_sai_4' && (count($lc) < 2 || bg_dap_an_chuan(['loai' => $loai, 'dap_an' => $da]) === '')) {
        $loi = "$id: Đúng/Sai thiếu ý hoặc đáp án"; return null;
    }
    if ($loai === 'tra_loi_ngan' && !preg_match('/^-?\d+([.,]\d+)?$/', $da)) {
        $loi = "$id: trả lời ngắn cần đáp án là số (đang là '$da')"; return null;
    }
    $chuan = mb_strtolower(preg_replace('/\s+/u', '', strip_tags($de . rje($lc))));
    return [
        'id' => $id,
        'lop' => mb_substr(preg_replace('/[^A-Za-z0-9_]/', '', (string) ($c['lop'] ?? '')), 0, 12) ?: 'KHAC',
        'mon' => bg_str($c['mon'] ?? 'Toán', 40) ?: 'Toán',
        'chuong' => bg_str($c['chuong'] ?? '', 200) ?: 'Chưa phân chương',
        'muc_do' => $muc, 'loai' => $loai, 'de_html' => $de, 'lua_chon' => rje($lc), 'dap_an' => mb_substr($da, 0, 120),
        'dap_an_html' => bg_clean_html((string) ($c['dap_an_html'] ?? '')),
        'loi_giai_html' => bg_clean_html((string) ($c['loi_giai_html'] ?? '')),
        'nguon' => bg_str($c['nguon'] ?? '', 255), 'bo_nguon' => bg_str($c['bo_nguon'] ?? '', 255),
        'bam' => substr(hash('sha1', $chuan), 0, 40),
    ];
}

/**
 * Nạp một lô câu (upsert theo id, GIỮ số lần đã dùng). Mỗi lần đồng bộ dùng một mã "phien";
 * gọi nh_nap_xong cùng phien để gỡ những câu không còn trong file (thầy bỏ duyệt).
 */
function action_nh_nap(array $in): void
{
    if (!r_is_teacher() && !nh_token_ok($in)) { json_out(['status' => 'error', 'can_dang_nhap' => true, 'message' => 'Cần đăng nhập giảng viên hoặc mã nạp ngân hàng.'], 401); }
    @set_time_limit(120);
    $phien = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($in['phien'] ?? ''));
    if ($phien === '') { rfail('Thiếu mã phiên nạp.'); }
    $ds = (array) ($in['cau'] ?? []);
    if (!$ds) { rfail('Lô nạp không có câu nào.'); }
    if (count($ds) > NH_MAX_LO) { rfail('Mỗi lô tối đa ' . NH_MAX_LO . ' câu.'); }
    global $pdo;
    $moi = 0; $cap_nhat = 0; $loi = [];
    $pdo->beginTransaction();
    try {
        foreach ($ds as $c) {
            $l = null;
            $n = is_array($c) ? nh_norm($c, $l) : null;
            if (!$n) { $loi[] = $l ?? 'dòng không hợp lệ'; continue; }
            $co = rq_val('SELECT COUNT(*) FROM bdvh_nh_cau WHERE id = ?', [$n['id']]);
            $v = [$n['lop'], $n['mon'], $n['chuong'], $n['muc_do'], $n['loai'], $n['de_html'], $n['lua_chon'], $n['dap_an'],
                  $n['dap_an_html'], $n['loi_giai_html'], $n['nguon'], $n['bo_nguon'], $n['bam'], $phien, rnow()];
            if ($co) {
                rq('UPDATE bdvh_nh_cau SET lop=?, mon=?, chuong=?, muc_do=?, loai=?, de_html=?, lua_chon=?, dap_an=?, dap_an_html=?,
                    loi_giai_html=?, nguon=?, bo_nguon=?, bam=?, phien=?, nap_luc=? WHERE id = ?', array_merge($v, [$n['id']]));
                $cap_nhat++;
            } else {
                rq('INSERT INTO bdvh_nh_cau (lop, mon, chuong, muc_do, loai, de_html, lua_chon, dap_an, dap_an_html, loi_giai_html,
                    nguon, bo_nguon, bam, phien, nap_luc, id, so_lan_dung) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)', array_merge($v, [$n['id']]));
                $moi++;
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    rok(['moi' => $moi, 'cap_nhat' => $cap_nhat, 'loi' => array_slice($loi, 0, 30), 'so_loi' => count($loi)]);
}

/** Kết thúc phiên nạp: gỡ câu không có trong phiên này (câu thầy đã bỏ duyệt). Chỉ gỡ khi phiên đã nạp được ít nhất 1 câu. */
function action_nh_nap_xong(array $in): void
{
    if (!r_is_teacher() && !nh_token_ok($in)) { json_out(['status' => 'error', 'can_dang_nhap' => true, 'message' => 'Cần đăng nhập giảng viên hoặc mã nạp ngân hàng.'], 401); }
    $phien = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($in['phien'] ?? ''));
    $co = (int) rq_val('SELECT COUNT(*) FROM bdvh_nh_cau WHERE phien = ?', [$phien]);
    if ($phien === '' || $co === 0) { rfail('Phiên nạp chưa có câu nào — không gỡ gì.'); }
    $go = 0;
    if (($in['thay_the'] ?? true) !== false) {
        $go = rq('DELETE FROM bdvh_nh_cau WHERE phien <> ?', [$phien])->rowCount();
    }
    rok(['con' => $co, 'da_go' => $go]);
}

/** GV tạo mã nạp cho script ở máy nhà (chỉ hiện một lần; máy chủ giữ bản băm). Khác mã đồng bộ Drive. */
function action_nh_token_tao(array $in): void
{
    r_teacher();
    $t = bin2hex(random_bytes(24));
    rq('DELETE FROM bdvh_bg_cau_hinh WHERE k IN (?, ?)', ['token_ngan_hang', 'token_ngan_hang_luc']);
    rq('INSERT INTO bdvh_bg_cau_hinh (k, v) VALUES (?, ?)', ['token_ngan_hang', hash('sha256', $t)]);
    rq('INSERT INTO bdvh_bg_cau_hinh (k, v) VALUES (?, ?)', ['token_ngan_hang_luc', rnow()]);
    rok(['token' => $t]);
}

/* ============================ Thống kê ============================ */

/** Số câu theo lớp → môn → chương → loại → mức độ (dựng bộ lọc & ma trận trên trang). */
function action_nh_thong_ke(array $in): void
{
    nh_gv();
    $rows = rq_all('SELECT lop, mon, chuong, loai, muc_do, COUNT(*) AS n, SUM(CASE WHEN so_lan_dung > 0 THEN 1 ELSE 0 END) AS da_dung
                    FROM bdvh_nh_cau GROUP BY lop, mon, chuong, loai, muc_do ORDER BY lop, mon, chuong');
    $tong = (int) rq_val('SELECT COUNT(*) FROM bdvh_nh_cau');
    $nap = rq_val('SELECT MAX(nap_luc) FROM bdvh_nh_cau');
    $tk = rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_ngan_hang_luc']);
    rok(['tong' => $tong, 'nap_luc' => $nap ?: null, 'token_luc' => $tk ?: null,
         'nhom' => array_map(static fn ($r) => ['lop' => $r['lop'], 'mon' => $r['mon'], 'chuong' => $r['chuong'], 'loai' => $r['loai'],
                                               'muc_do' => $r['muc_do'], 'n' => (int) $r['n'], 'da_dung' => (int) $r['da_dung']], $rows)]);
}

/* ============================ Rút câu ============================ */

/** Kho câu ứng viên cho bộ lọc (chỉ cột nhẹ). */
function nh_kho(string $lop, string $mon, array $chuong, string $loai, string $muc): array
{
    $sql = 'SELECT id, bam, so_lan_dung FROM bdvh_nh_cau WHERE lop = ? AND mon = ? AND loai = ?';
    $p = [$lop, $mon, $loai];
    if ($muc !== '*') { $sql .= ' AND muc_do = ?'; $p[] = $muc; }
    if ($chuong) { $sql .= ' AND chuong IN (' . implode(',', array_fill(0, count($chuong), '?')) . ')'; $p = array_merge($p, $chuong); }
    return rq_all($sql, $p);
}

/** Rút n câu: ưu tiên câu ít được dùng, trong cùng mức thì ngẫu nhiên; bỏ câu đã chọn và câu trùng nội dung. */
function nh_rut(array $kho, int $n, array &$daChon, array &$daBam, bool $uuTienItDung): array
{
    $kho = array_values(array_filter($kho, static fn ($r) => !isset($daChon[$r['id']]) && !isset($daBam[$r['bam']])));
    shuffle($kho);
    if ($uuTienItDung) { usort($kho, static fn ($a, $b) => (int) $a['so_lan_dung'] <=> (int) $b['so_lan_dung']); }
    $out = [];
    foreach ($kho as $r) {
        if (count($out) >= $n) { break; }
        if (isset($daBam[$r['bam']])) { continue; }
        $out[] = $r['id']; $daChon[$r['id']] = true; $daBam[$r['bam']] = true;
    }
    return $out;
}

function nh_doc_loc(array $in): array
{
    $lop = preg_replace('/[^A-Za-z0-9_]/', '', (string) ($in['lop'] ?? ''));
    $mon = bg_str($in['mon'] ?? 'Toán', 40);
    $chuong = array_values(array_filter(array_map(static fn ($x) => bg_str($x, 200), (array) ($in['chuong'] ?? []))));
    if ($lop === '') { rfail('Chọn lớp.'); }
    return [$lop, $mon, $chuong];
}

/** Câu đầy đủ theo danh sách id, giữ thứ tự. */
function nh_lay(array $ids): array
{
    if (!$ids) { return []; }
    $rows = rq_all('SELECT * FROM bdvh_nh_cau WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')', $ids);
    $map = [];
    foreach ($rows as $r) { $map[$r['id']] = $r; }
    return array_values(array_filter(array_map(static fn ($i) => $map[$i] ?? null, $ids)));
}

function nh_tom_tat(array $r): array
{
    return ['id' => $r['id'], 'loai' => $r['loai'], 'muc_do' => $r['muc_do'], 'chuong' => $r['chuong'], 'de_html' => $r['de_html'],
            'lua_chon' => rjd($r['lua_chon'], []), 'dap_an' => $r['dap_an'], 'nguon' => $r['nguon'], 'so_lan_dung' => (int) $r['so_lan_dung']];
}

/**
 * Xem trước đề theo ma trận: ma_tran = { abcd: {NB:4, TH:4, VD:2, VDC:0, '*':0}, dung_sai_4: {...}, tra_loi_ngan: {...} }.
 * '*' = bất kỳ mức độ. Thiếu câu ở ô nào thì báo rõ ô đó.
 */
function action_nh_xem_truoc(array $in): void
{
    nh_gv();
    [$lop, $mon, $chuong] = nh_doc_loc($in);
    $mt = (array) ($in['ma_tran'] ?? []);
    $uu = ($in['uu_tien_it_dung'] ?? true) !== false;
    $daChon = []; $daBam = []; $ids = []; $thieu = []; $tong = 0;
    foreach (NH_LOAI as $loai) {
        foreach (array_merge(NH_MUC, ['*']) as $muc) {
            $n = max(0, min(NH_MAX_CAU_DE, (int) ($mt[$loai][$muc] ?? 0)));
            if (!$n) { continue; }
            $tong += $n;
            $lay = nh_rut(nh_kho($lop, $mon, $chuong, $loai, $muc), $n, $daChon, $daBam, $uu);
            foreach ($lay as $id) { $ids[] = ['id' => $id, 'loai' => $loai, 'muc' => $muc]; }
            if (count($lay) < $n) { $thieu[] = ['loai' => $loai, 'muc' => $muc, 'can' => $n, 'co' => count($lay)]; }
        }
    }
    if (!$tong) { rfail('Ma trận chưa có câu nào — nhập số câu cho ít nhất một ô.'); }
    if ($tong > NH_MAX_CAU_DE) { rfail('Một đề tối đa ' . NH_MAX_CAU_DE . ' câu.'); }
    $full = nh_lay(array_column($ids, 'id'));
    $o = [];
    foreach ($full as $k => $r) { $t = nh_tom_tat($r); $t['o'] = $ids[$k]['muc']; $o[] = $t; }
    rok(['cau' => $o, 'thieu' => $thieu]);
}

/** Đổi một câu trong bản xem trước: rút câu khác cùng loại + mức (ô ma trận), tránh các câu đang có. */
function action_nh_doi_cau(array $in): void
{
    nh_gv();
    [$lop, $mon, $chuong] = nh_doc_loc($in);
    $loai = (string) ($in['loai'] ?? '');
    if (!in_array($loai, NH_LOAI, true)) { rfail('Loại câu không hợp lệ.'); }
    $muc = in_array($in['o'] ?? '', array_merge(NH_MUC, ['*']), true) ? $in['o'] : '*';
    $daChon = []; $daBam = [];
    foreach (nh_lay(array_map('strval', (array) ($in['dang_co'] ?? []))) as $r) { $daChon[$r['id']] = true; $daBam[$r['bam']] = true; }
    $lay = nh_rut(nh_kho($lop, $mon, $chuong, $loai, $muc), 1, $daChon, $daBam, ($in['uu_tien_it_dung'] ?? true) !== false);
    if (!$lay) { rfail('Hết câu khác cùng loại và mức độ trong phạm vi đã chọn.'); }
    $t = nh_tom_tat(nh_lay($lay)[0]); $t['o'] = $muc;
    rok($t);
}

/** Lưu đề thành một bộ bài giảng (trình chiếu + bình chọn dùng lại nguyên vẹn). Tăng số lần dùng của các câu. */
function action_nh_tao_de(array $in): void
{
    nh_gv();
    $ids = array_values(array_unique(array_map('strval', (array) ($in['ids'] ?? []))));
    if (!$ids) { rfail('Chưa có câu nào trong đề.'); }
    if (count($ids) > NH_MAX_CAU_DE) { rfail('Một đề tối đa ' . NH_MAX_CAU_DE . ' câu.'); }
    $rows = nh_lay($ids);
    if (count($rows) !== count($ids)) { rfail('Có câu không còn trong ngân hàng (vừa nạp lại?) — bấm Xem trước để rút lại.'); }
    $tieuDe = bg_str($in['tieu_de'] ?? '', 200);
    if ($tieuDe === '') { rfail('Nhập tên đề.'); }
    $ngay = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($in['ngay'] ?? '')) ? (string) $in['ngay'] : bg_hom_nay();
    // Xếp theo khuôn đề: Phần I trắc nghiệm → II Đúng/Sai → III trả lời ngắn → IV tự luận; đánh số Câu liên tục.
    $thuTu = array_flip(['abcd', 'dung_sai', 'dung_sai_4', 'tra_loi_ngan', 'tu_luan']);
    usort($rows, static fn ($a, $b) => [$thuTu[$a['loai']], array_search($a['id'], $ids, true)] <=> [$thuTu[$b['loai']], array_search($b['id'], $ids, true)]);
    $cau = [];
    foreach ($rows as $i => $r) {
        $cau[] = ['id' => $r['id'], 'so' => ($r['loai'] === 'tu_luan' ? 'Bài ' : 'Câu ') . ($i + 1), 'phan' => NH_PHAN[$r['loai']] ?? '',
                  'loai' => $r['loai'], 'de_html' => $r['de_html'], 'lua_chon' => rjd($r['lua_chon'], []), 'dap_an' => $r['dap_an'],
                  'dap_an_html' => $r['dap_an_html'], 'ghi_chu_html' => $r['loi_giai_html'], 'co_hinh' => str_contains($r['de_html'], '<img')];
    }
    $lop = (string) $rows[0]['lop'];
    $ma = 'nh-' . $ngay . '-' . preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $tieuDe) ?: 'de'));
    $out = bg_upsert(['tieu_de' => $tieuDe, 'ma' => substr($ma, 0, 90), 'khoi' => preg_match('/^L\d+$/', $lop) ? $lop : '',
                      'mon' => $rows[0]['mon'], 'nguon' => 'Ngân hàng câu hỏi (' . count($cau) . ' câu)', 'ngay' => $ngay, 'cau' => $cau], false);
    rq('UPDATE bdvh_nh_cau SET so_lan_dung = so_lan_dung + 1, dung_gan_nhat = ? WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')',
       array_merge([rnow()], $ids));
    rok($out);
}

function nh_dispatch(string $action, array $in): void
{
    bg_ensure_tables();
    nh_ensure_tables();
    $map = ['nh_nap' => 'action_nh_nap', 'nh_nap_xong' => 'action_nh_nap_xong', 'nh_token_tao' => 'action_nh_token_tao',
            'nh_thong_ke' => 'action_nh_thong_ke', 'nh_xem_truoc' => 'action_nh_xem_truoc', 'nh_doi_cau' => 'action_nh_doi_cau',
            'nh_tao_de' => 'action_nh_tao_de'];
    if (!isset($map[$action])) { json_out(['status' => 'error', 'message' => 'Thao tác ngân hàng không hợp lệ.'], 404); }
    try {
        ($map[$action])($in);
    } catch (RoomError $e) {
        json_out(['status' => 'error', 'message' => $e->getMessage()]);
    } catch (Throwable $e) {
        error_log('[ngan-hang] ' . $action . ': ' . $e->getMessage() . ' @' . $e->getLine());
        json_out(['status' => 'error', 'message' => 'Lỗi máy chủ. Vui lòng thử lại.'], 500);
    }
}

if (isset($action) && is_string($action) && str_starts_with($action, 'nh_')) {
    nh_dispatch($action, is_array($inputData ?? null) ? $inputData : []);
}
