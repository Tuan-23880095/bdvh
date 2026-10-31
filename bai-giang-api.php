<?php
declare(strict_types=1);

/**
 * bdvh/bai-giang-api.php — BÀI GIẢNG TRÌNH CHIẾU TỪ ĐỀ TRÊN GOOGLE DRIVE + LỜI GIẢI GEMINI.
 * Được api.php nạp (sau phong-thi-api.php, dùng chung các hàm rq/rok/rfail…); xử lý mọi action "bg_".
 *
 * Luồng: GV mở bai-giang.html → chọn file đề .html (tải từ Drive DAYKEM) → trình duyệt tách câu hỏi +
 *        đáp án → bg_save lưu bộ bài giảng → bấm "Tạo lời giải" → bg_giai gọi Gemini cho từng câu,
 *        lưu lại (chỉ gọi một lần, GV sửa được) → trinh-chieu.html?bo=… chiếu mỗi câu 3 slide:
 *        Đề · Đáp án · Giải thích từng bước cho học sinh yếu.
 *
 * Khoá Gemini: dùng CHUNG mục 'gemini' trong private/config.php của diemdanhsv (đã có cho KHTD):
 *   'gemini' => ['api_key' => '...', 'model' => 'gemini-2.5-flash'],
 * Không có file cấu hình (chạy thử trên máy) → đọc biến môi trường GEMINI_API_KEY.
 */

if (!defined('BDVH_API')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/bai-giang-doc-de.php';

const BG_MAX_BYTES = 2_000_000;   // một bộ bài giảng tối đa ~2 MB (đề có hình SVG)
const BG_MAX_CAU = 80;

function bg_ensure_tables(): void
{
    global $pdo;
    try { $pdo->query('SELECT 1 FROM bdvh_bai_giang LIMIT 1'); return; } catch (Throwable $e) {}
    if (r_sqlite()) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_bai_giang (bo_id INTEGER PRIMARY KEY AUTOINCREMENT, ma TEXT NOT NULL UNIQUE,
            tieu_de TEXT NOT NULL, khoi TEXT, mon TEXT, nguon TEXT, so_cau INTEGER NOT NULL DEFAULT 0, du_lieu TEXT NOT NULL,
            tao_luc TEXT NOT NULL, sua_luc TEXT NOT NULL)");
    } else {
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_bai_giang (bo_id INT AUTO_INCREMENT PRIMARY KEY, ma VARCHAR(120) NOT NULL,
            tieu_de VARCHAR(255) NOT NULL, khoi VARCHAR(10) NULL, mon VARCHAR(40) NULL, nguon VARCHAR(255) NULL,
            so_cau INT NOT NULL DEFAULT 0, du_lieu LONGTEXT NOT NULL, tao_luc DATETIME NOT NULL, sua_luc DATETIME NOT NULL,
            UNIQUE KEY uq_bg_ma (ma)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }
    $pdo->exec(r_sqlite()
        ? "CREATE TABLE IF NOT EXISTS bdvh_bg_cau_hinh (k TEXT PRIMARY KEY, v TEXT NOT NULL)"
        : "CREATE TABLE IF NOT EXISTS bdvh_bg_cau_hinh (k VARCHAR(60) PRIMARY KEY, v VARCHAR(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/* ============================ Quyền: giáo viên hoặc mã đồng bộ ============================ */

/** Mã đồng bộ cho Google Apps Script (tự gửi đề từ Drive mỗi ngày). Chỉ lưu bản băm SHA-256. */
function bg_token_ok(array $in): bool
{
    $t = (string) ($in['token'] ?? '');
    if (strlen($t) < 32) { return false; }
    $h = rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_dong_bo']);
    return is_string($h) && $h !== '' && hash_equals($h, hash('sha256', $t));
}
function bg_quyen(array $in): void
{
    if (!r_is_teacher() && !bg_token_ok($in)) { rfail('Cần đăng nhập giảng viên hoặc mã đồng bộ hợp lệ.'); }
}
function bg_hom_nay(): string { return (new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('Y-m-d'); }

/* ============================ Làm sạch HTML ============================ */

/** Giữ định dạng, công thức và hình SVG của đề; bỏ mọi thứ có thể chạy mã (script, on*, javascript:). */
function bg_clean_html(string $html): string
{
    $html = trim($html);
    if ($html === '') { return ''; }
    if (!class_exists('DOMDocument')) {
        $html = preg_replace('#<(script|iframe|object|embed|style|link|meta|form)\b[^>]*>.*?</\1>#is', '', $html);
        $html = preg_replace('#<(script|iframe|object|embed|link|meta|input|form)\b[^>]*/?>#i', '', $html);
        $html = preg_replace('#\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#i', '', $html);
        return preg_replace('#(href|src|xlink:href)\s*=\s*(["\'])\s*javascript:[^"\']*\2#i', '$1="#"', $html);
    }
    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="utf-8"?><div id="bg-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    $xp = new DOMXPath($doc);
    foreach (['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'form', 'input', 'button', 'textarea', 'select', 'base'] as $tag) {
        foreach (iterator_to_array($doc->getElementsByTagName($tag)) as $n) { $n->parentNode?->removeChild($n); }
    }
    foreach ($xp->query('//@*') as $attr) {
        /** @var DOMAttr $attr */
        $name = strtolower($attr->nodeName);
        $val = strtolower(trim($attr->nodeValue ?? ''));
        if (str_starts_with($name, 'on') || (in_array($name, ['href', 'src', 'xlink:href', 'action', 'formaction'], true) && str_starts_with($val, 'javascript:'))) {
            $attr->ownerElement?->removeAttributeNode($attr);
        }
    }
    $root = $doc->getElementById('bg-root');
    $out = '';
    if ($root) { foreach ($root->childNodes as $c) { $out .= $doc->saveHTML($c); } }
    return $out;
}

function bg_str($v, int $max): string { return mb_substr(trim((string) $v), 0, $max); }

/** Chuẩn hoá một câu hỏi do trình duyệt tách gửi lên. */
function bg_norm_cau(array $c, int $i): array
{
    $loai = in_array($c['loai'] ?? '', ['abcd', 'dung_sai', 'tra_loi_ngan', 'tu_luan'], true) ? $c['loai'] : 'tu_luan';
    $lc = [];
    foreach ((array) ($c['lua_chon'] ?? []) as $o) {
        if (!is_array($o)) { continue; }
        $lc[] = ['k' => bg_str($o['k'] ?? '', 4), 'html' => bg_clean_html((string) ($o['html'] ?? ''))];
        if (count($lc) >= 8) { break; }
    }
    $out = [
        'id' => preg_replace('/[^a-z0-9_-]/i', '', (string) ($c['id'] ?? ('c' . ($i + 1)))) ?: ('c' . ($i + 1)),
        'so' => bg_str($c['so'] ?? ('Câu ' . ($i + 1)), 30),
        'phan' => bg_str($c['phan'] ?? '', 120),
        'loai' => $loai,
        'de_html' => bg_clean_html((string) ($c['de_html'] ?? '')),
        'lua_chon' => $lc,
        'dap_an' => bg_str($c['dap_an'] ?? '', 4000),
        'dap_an_html' => bg_clean_html((string) ($c['dap_an_html'] ?? '')),
        'ghi_chu_html' => bg_clean_html((string) ($c['ghi_chu_html'] ?? '')),
        'co_hinh' => !empty($c['co_hinh']),
    ];
    if ($out['de_html'] === '') { rfail('Câu ' . ($i + 1) . ' không có nội dung đề.'); }
    if (isset($c['giai']) && is_array($c['giai'])) { $out['giai'] = bg_norm_giai($c['giai']); }
    return $out;
}

function bg_norm_giai(array $g): array
{
    $buoc = [];
    foreach ((array) ($g['cac_buoc'] ?? []) as $b) {
        if (is_string($b)) { $b = ['tieu_de' => '', 'noi_dung' => $b]; }
        if (!is_array($b)) { continue; }
        $nd = bg_str($b['noi_dung'] ?? '', 1200);
        if ($nd === '') { continue; }
        $buoc[] = ['tieu_de' => bg_str($b['tieu_de'] ?? '', 120), 'noi_dung' => $nd];
        if (count($buoc) >= 8) { break; }
    }
    $kt = (string) ($g['kiem_tra_dap_an'] ?? '');
    return [
        'dap_an_ngan' => bg_str($g['dap_an_ngan'] ?? '', 600),
        'kien_thuc' => bg_str($g['kien_thuc'] ?? '', 800),
        'cac_buoc' => $buoc,
        'loi_thuong_gap' => bg_str($g['loi_thuong_gap'] ?? '', 600),
        'kiem_tra_dap_an' => in_array($kt, ['khop', 'khong_khop', 'khong_xac_dinh'], true) ? $kt : 'khong_xac_dinh',
        'ghi_chu_giao_vien' => bg_str($g['ghi_chu_giao_vien'] ?? '', 600),
        'nguon' => bg_str($g['nguon'] ?? 'gemini', 60),
        'luc' => bg_str($g['luc'] ?? rnow(), 30),
        'da_duyet' => !empty($g['da_duyet']),
    ];
}

function bg_load(array $in): array
{
    $id = (int) ($in['bo_id'] ?? $_GET['bo_id'] ?? 0);
    $ma = (string) ($in['ma'] ?? $_GET['ma'] ?? '');
    $row = $id > 0 ? rq_one('SELECT * FROM bdvh_bai_giang WHERE bo_id = ?', [$id])
                   : ($ma !== '' ? rq_one('SELECT * FROM bdvh_bai_giang WHERE ma = ?', [$ma]) : null);
    if (!$row) { rfail('Không tìm thấy bộ bài giảng.'); }
    $row['du_lieu'] = rjd($row['du_lieu'], []);
    return $row;
}

function bg_store(array $row): void
{
    $cau = $row['du_lieu']['cau'] ?? [];
    $json = rje($row['du_lieu']);
    if (strlen($json) > BG_MAX_BYTES) { rfail('Bộ bài giảng quá lớn (tối đa 2 MB).'); }
    rq('UPDATE bdvh_bai_giang SET du_lieu = ?, so_cau = ?, sua_luc = ? WHERE bo_id = ?', [$json, count($cau), rnow(), (int) $row['bo_id']]);
}

function bg_public(array $row, bool $full): array
{
    $o = ['bo_id' => (int) $row['bo_id'], 'ma' => $row['ma'], 'tieu_de' => $row['tieu_de'], 'khoi' => $row['khoi'],
          'mon' => $row['mon'], 'nguon' => $row['nguon'], 'so_cau' => (int) $row['so_cau'], 'sua_luc' => $row['sua_luc']];
    $cau = is_array($row['du_lieu']) ? ($row['du_lieu']['cau'] ?? []) : [];
    $o['so_da_giai'] = count(array_filter($cau, static fn ($c) => !empty($c['giai']['cac_buoc'])));
    $o['ngay'] = is_array($row['du_lieu']) ? (string) ($row['du_lieu']['thong_tin']['ngay'] ?? '') : '';
    $o['hom_nay'] = $o['ngay'] !== '' && $o['ngay'] === bg_hom_nay();
    if ($full) { $o['cau'] = $cau; $o['thong_tin'] = $row['du_lieu']['thong_tin'] ?? new stdClass(); }
    return $o;
}

/* ============================ Gemini ============================ */

function bg_gemini_cfg(): array
{
    $key = ''; $prefer = [];
    if (function_exists('app_config')) {
        try {
            $g = app_config()['gemini'] ?? [];
            if (is_array($g)) {
                $key = (string) ($g['api_key'] ?? '');
                if (!empty($g['model'])) { $prefer[] = (string) $g['model']; }
                foreach ((array) ($g['models'] ?? []) as $m) { $prefer[] = (string) $m; }
            }
        } catch (Throwable $e) {}
    }
    if ($key === '') { $key = (string) getenv('GEMINI_API_KEY'); }
    if ($m = getenv('GEMINI_MODEL')) { array_unshift($prefer, (string) $m); }
    return ['key' => $key, 'prefer' => array_values(array_unique(array_filter($prefer)))];
}

function bg_http(string $url, string $key, ?array $body, int $timeout): array
{
    $ch = curl_init($url);
    $opt = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . $key]];
    if ($body !== null) { $opt[CURLOPT_POST] = true; $opt[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE); }
    curl_setopt_array($ch, $opt);
    $resp = curl_exec($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($resp === false) { return ['http' => 0, 'data' => null, 'msg' => 'curl: ' . $err]; }
    $d = json_decode((string) $resp, true);
    return ['http' => $http, 'data' => is_array($d) ? $d : null, 'msg' => substr((string) ($d['error']['message'] ?? $resp), 0, 250)];
}

/** Danh sách model thử lần lượt: model trong cấu hình trước, rồi model flash mới nhất mà khoá dùng được (đệm 6 giờ). */
function bg_gemini_models(array $cfg): array
{
    $list = $cfg['prefer'];
    $cache = sys_get_temp_dir() . '/bdvh_gemini_models_' . substr(sha1($cfg['key']), 0, 12) . '.json';
    $found = null;
    if (is_file($cache) && time() - (int) filemtime($cache) < 6 * 3600) {
        $found = json_decode((string) @file_get_contents($cache), true);
    }
    if (!is_array($found)) {
        $found = [];
        $r = bg_http('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', $cfg['key'], null, 25);
        foreach ((array) ($r['data']['models'] ?? []) as $m) {
            if (!in_array('generateContent', (array) ($m['supportedGenerationMethods'] ?? []), true)) { continue; }
            $id = preg_replace('#^models/#', '', (string) ($m['name'] ?? ''));
            if ($id === '' || preg_match('/embedding|aqa|tts|imagen|veo|audio|live|image|learnlm|gemma/i', $id)) { continue; }
            $found[] = $id;
        }
        usort($found, static function (string $a, string $b): int {
            $s = static function (string $n): float {
                $v = str_contains($n, 'flash') ? 1000 : (str_contains($n, 'pro') ? 500 : 100);
                if (preg_match('/(\d+(?:\.\d+)?)/', $n, $mm)) { $v += (float) $mm[1] * 10; }
                if (str_contains($n, 'lite')) { $v -= 6; }
                if (preg_match('/preview|exp|thinking/i', $n)) { $v -= 12; }
                return $v;
            };
            return $s($b) <=> $s($a);
        });
        if ($found) { @file_put_contents($cache, json_encode($found)); }
    }
    foreach ($found as $m) { $list[] = $m; }
    $list = array_values(array_unique($list));
    return $list ? array_slice($list, 0, 5) : ['gemini-2.5-flash', 'gemini-2.0-flash'];
}

/** Gọi Gemini, trả [text, model]. Thử tắt "suy nghĩ" trước để không tốn token trước khi xuất JSON. */
function bg_gemini_generate(array $cfg, array $body): array
{
    $last = '';
    foreach (bg_gemini_models($cfg) as $model) {
        foreach ([true, false] as $noThink) {
            $b = $body;
            if ($noThink) { $b['generationConfig']['thinkingConfig'] = ['thinkingBudget' => 0]; }
            $r = bg_http('https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent', $cfg['key'], $b, 90);
            if ($r['http'] === 200) {
                $t = (string) ($r['data']['candidates'][0]['content']['parts'][0]['text'] ?? '');
                if (trim($t) !== '') { return [$t, $model]; }
                $last = 'Gemini ' . $model . ' trả về rỗng.';
                break;
            }
            $last = 'Gemini ' . $model . ' lỗi HTTP ' . $r['http'] . ': ' . $r['msg'];
            if ($noThink && $r['http'] === 400) { continue; }
            if (in_array($r['http'], [401, 403], true)) { break 2; }
            break;
        }
    }
    throw new RoomError($last ?: 'Gemini không phản hồi.');
}

/** Chuyển HTML đề thành văn bản cho Gemini: giữ công thức LaTeX, bảng thành dòng, hình thành ghi chú. */
function bg_html_text(string $html): string
{
    // Hình SVG: giữ các nhãn/số đo viết trên hình (6 cm, A, B…) để Gemini có đủ dữ kiện
    $html = preg_replace_callback('#<svg\b.*?</svg>#is', static function ($m) {
        preg_match_all('#<text\b[^>]*>(.*?)</text>#is', $m[0], $t);
        $nhan = array_filter(array_map(static fn ($x) => trim(html_entity_decode(strip_tags($x))), $t[1]));
        return $nhan ? ' [HÌNH VẼ, các nhãn trên hình: ' . implode(', ', $nhan) . '] ' : ' [HÌNH VẼ] ';
    }, $html);
    $html = preg_replace('#</(td|th)>#i', ' | ', $html);
    $html = preg_replace('#</(tr|p|div|li|h\d)>|<br\s*/?>#i', "\n", $html);
    $t = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = preg_replace('/[ \t]+/u', ' ', $t);
    return trim(preg_replace("/\n\s*\n+/u", "\n", $t));
}

function bg_prompt(array $c, array $info): string
{
    $loaiTen = ['abcd' => 'trắc nghiệm 4 lựa chọn', 'dung_sai' => 'trắc nghiệm Đúng/Sai', 'tra_loi_ngan' => 'trả lời ngắn', 'tu_luan' => 'tự luận'];
    $p = "Môn: " . ($info['mon'] ?? 'Toán') . " · " . ($info['khoi'] ?? '') . "\n";
    $p .= "Loại câu: " . ($loaiTen[$c['loai']] ?? $c['loai']) . "\n\n";
    $p .= "ĐỀ (" . $c['so'] . "):\n" . bg_html_text($c['de_html']) . "\n";
    foreach ($c['lua_chon'] as $o) {
        if ($c['loai'] === 'abcd') { $p .= $o['k'] . ". " . bg_html_text($o['html']) . "\n"; }
    }
    if ($c['co_hinh']) { $p .= "(Câu có hình vẽ; chỉ dùng các số liệu được ghi trong đề, không tự thêm dữ kiện.)\n"; }
    $da = trim($c['dap_an'] . ' ' . bg_html_text($c['dap_an_html']));
    $p .= "\nĐÁP ÁN CỦA GIÁO VIÊN: " . ($da !== '' ? $da : '(chưa có — hãy tự giải và ghi rõ trong ghi_chu_giao_vien)') . "\n";
    $gc = bg_html_text($c['ghi_chu_html']);
    if ($gc !== '') { $p .= "GỢI Ý GIẢI CỦA GIÁO VIÊN: " . $gc . "\n"; }
    return $p;
}

function bg_gemini_body(string $prompt): array
{
    $system = "Bạn là giáo viên Toán THCS/THPT ở Việt Nam, đang soạn slide giải thích cho HỌC SINH YẾU trên lớp.\n"
        . "Quy tắc:\n"
        . "1. Bám đúng đáp án của giáo viên. Tự giải lại để kiểm tra: khớp thì kiem_tra_dap_an = \"khop\"; nếu bạn ra kết quả khác thì "
        . "\"khong_khop\" và nêu lý do trong ghi_chu_giao_vien (vẫn trình bày lời giải theo đáp án của giáo viên nếu hợp lý).\n"
        . "2. cac_buoc: 2 đến 6 bước, mỗi bước MỘT thao tác, viết câu ngắn (tối đa 30 từ), ghi rõ phép tính trung gian, không nhảy bước.\n"
        . "3. kien_thuc: quy tắc/công thức cần nhớ để làm câu này, 1–2 câu.\n"
        . "4. loi_thuong_gap: một lỗi học sinh hay mắc ở câu này và cách tránh.\n"
        . "5. dap_an_ngan: câu trả lời gọn (ví dụ: \"C. \$5^5\$\" hoặc \"Sai\" hoặc \"x = 3\").\n"
        . "6. Công thức viết LaTeX trong \$...\$ (ví dụ \$\\dfrac{3}{4}\$). Không dùng markdown (**, #). Tiếng Việt chuẩn, xưng \"em\" với học sinh.\n"
        . "7. Không bịa số liệu không có trong đề.";
    $schema = [
        'type' => 'OBJECT',
        'properties' => [
            'dap_an_ngan' => ['type' => 'STRING'],
            'kien_thuc' => ['type' => 'STRING'],
            'cac_buoc' => ['type' => 'ARRAY', 'items' => ['type' => 'OBJECT', 'properties' => [
                'tieu_de' => ['type' => 'STRING'], 'noi_dung' => ['type' => 'STRING']], 'required' => ['tieu_de', 'noi_dung']]],
            'loi_thuong_gap' => ['type' => 'STRING'],
            'kiem_tra_dap_an' => ['type' => 'STRING', 'enum' => ['khop', 'khong_khop', 'khong_xac_dinh']],
            'ghi_chu_giao_vien' => ['type' => 'STRING'],
        ],
        'required' => ['dap_an_ngan', 'kien_thuc', 'cac_buoc', 'loi_thuong_gap', 'kiem_tra_dap_an'],
    ];
    return [
        'systemInstruction' => ['parts' => [['text' => $system]]],
        'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
        'generationConfig' => ['temperature' => 0.2, 'maxOutputTokens' => 2048,
            'responseMimeType' => 'application/json', 'responseSchema' => $schema],
    ];
}

/* ============================ Các thao tác ============================ */

function action_bg_list(array $in): void
{
    $rows = rq_all('SELECT bo_id, ma, tieu_de, khoi, mon, nguon, so_cau, sua_luc, du_lieu FROM bdvh_bai_giang ORDER BY sua_luc DESC');
    $ds = array_map(static function ($r) { $r['du_lieu'] = rjd($r['du_lieu'], []); return bg_public($r, false); }, $rows);
    usort($ds, static fn ($a, $b) => [$b['hom_nay'], $b['ngay'], $b['sua_luc']] <=> [$a['hom_nay'], $a['ngay'], $a['sua_luc']]);
    rok($ds);
}

function action_bg_get(array $in): void
{
    rok(bg_public(bg_load($in), true));
}

/**
 * Thêm mới hoặc cập nhật một bộ bài giảng. Khi cập nhật: giữ lời giải đã có của câu cùng mã (nhập lại đề không mất lời giải).
 * $theoMa = true: nếu đã có bộ cùng mã thì cập nhật bộ đó (dùng cho đồng bộ tự động từ Drive, tránh tạo bản trùng).
 */
function bg_upsert(array $in, bool $theoMa): array
{
    $cauIn = (array) ($in['cau'] ?? []);
    if (!$cauIn) { rfail('Không có câu hỏi nào để lưu.'); }
    if (count($cauIn) > BG_MAX_CAU) { rfail('Tối đa ' . BG_MAX_CAU . ' câu mỗi bộ.'); }
    $cau = []; $seen = [];
    foreach (array_values($cauIn) as $i => $c) {
        $n = bg_norm_cau((array) $c, $i);
        while (isset($seen[$n['id']])) { $n['id'] .= 'x'; }
        $seen[$n['id']] = true;
        $cau[] = $n;
    }
    $tieuDe = bg_str($in['tieu_de'] ?? '', 255);
    if ($tieuDe === '') { rfail('Thiếu tên bộ bài giảng.'); }
    $ma = preg_replace('/[^a-z0-9-]+/', '-', strtolower(bg_str($in['ma'] ?? '', 100)));
    $ma = trim((string) $ma, '-') ?: ('bg-' . date('ymd-His'));
    $ngay = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($in['ngay'] ?? '')) ? (string) $in['ngay'] : '';
    $info = ['khoi' => bg_str($in['khoi'] ?? '', 10), 'mon' => bg_str($in['mon'] ?? 'Toán', 40), 'nguon' => bg_str($in['nguon'] ?? '', 255),
             'ngay' => $ngay, 'drive_id' => preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($in['drive_id'] ?? ''))];
    $id = (int) ($in['bo_id'] ?? 0);
    if (!$id && $theoMa) { $id = (int) rq_val('SELECT bo_id FROM bdvh_bai_giang WHERE ma = ?', [$ma]); }

    if ($id > 0) {
        $old = bg_load(['bo_id' => $id]);
        $giaiCu = [];
        foreach (($old['du_lieu']['cau'] ?? []) as $c) { if (!empty($c['giai'])) { $giaiCu[$c['id']] = $c['giai']; } }
        foreach ($cau as &$c) { if (empty($c['giai']) && isset($giaiCu[$c['id']])) { $c['giai'] = $giaiCu[$c['id']]; } }
        unset($c);
        $old['du_lieu'] = ['thong_tin' => $info, 'cau' => $cau];
        // Đồng bộ tự động giữ tên GV đã đặt; lưu tay thì lấy tên mới
        $ten = $theoMa ? $old['tieu_de'] : $tieuDe;
        rq('UPDATE bdvh_bai_giang SET tieu_de = ?, khoi = ?, mon = ?, nguon = ? WHERE bo_id = ?', [$ten, $info['khoi'], $info['mon'], $info['nguon'], $id]);
        bg_store($old);
        $moi = false;
    } else {
        $base = $ma; $k = 2;
        while (rq_val('SELECT COUNT(*) FROM bdvh_bai_giang WHERE ma = ?', [$ma])) { $ma = $base . '-' . $k++; }
        $json = rje(['thong_tin' => $info, 'cau' => $cau]);
        if (strlen($json) > BG_MAX_BYTES) { rfail('Bộ bài giảng quá lớn (tối đa 2 MB).'); }
        rq('INSERT INTO bdvh_bai_giang (ma, tieu_de, khoi, mon, nguon, so_cau, du_lieu, tao_luc, sua_luc) VALUES (?,?,?,?,?,?,?,?,?)',
           [$ma, $tieuDe, $info['khoi'], $info['mon'], $info['nguon'], count($cau), $json, rnow(), rnow()]);
        global $pdo;
        $id = (int) $pdo->lastInsertId();
        $moi = true;
    }
    $row = bg_load(['bo_id' => $id]);
    $out = bg_public($row, false);
    $out['moi'] = $moi;
    $out['can_giai'] = array_values(array_map(static fn ($c) => $c['id'],
        array_filter($row['du_lieu']['cau'], static fn ($c) => empty($c['giai']['cac_buoc']))));
    return $out;
}

function action_bg_save(array $in): void
{
    r_teacher();
    rok(bg_upsert($in, false));
}

/** Google Apps Script gửi nguyên file đề .html từ Drive → máy chủ tự tách câu và lưu (cập nhật nếu đã có). */
function action_bg_nhap(array $in): void
{
    bg_quyen($in);
    $html = (string) ($in['html'] ?? '');
    $ten = bg_str($in['ten_file'] ?? '', 200);
    if ($html === '' || $ten === '') { rfail('Thiếu nội dung file hoặc tên file.'); }
    if (strlen($html) > BG_MAX_BYTES) { rfail('File đề quá lớn.'); }
    $r = bg_parse_html($html, $ten);
    if (!$r['cau']) { rfail('Không tách được câu hỏi: ' . implode(' ', $r['canh_bao'])); }
    $r['drive_id'] = $in['drive_id'] ?? '';
    $out = bg_upsert($r, true);
    $out['canh_bao'] = $r['canh_bao'];
    rok($out);
}

/** Bài giảng của ngày hôm nay (theo ngày ở đầu tên file Drive: 2026-10-31_Toan7_…). */
function action_bg_hom_nay(array $in): void
{
    $hom = bg_hom_nay();
    $rows = rq_all('SELECT bo_id, ma, tieu_de, khoi, mon, nguon, so_cau, sua_luc, du_lieu FROM bdvh_bai_giang');
    $ds = [];
    foreach ($rows as $r) {
        $r['du_lieu'] = rjd($r['du_lieu'], []);
        if (($r['du_lieu']['thong_tin']['ngay'] ?? '') === $hom) { $ds[] = bg_public($r, false); }
    }
    rok(['ngay' => $hom, 'bo' => $ds]);
}

/** GV tạo (hoặc đổi) mã đồng bộ cho Apps Script. Mã chỉ hiện MỘT lần; máy chủ chỉ giữ bản băm. */
function action_bg_token_tao(array $in): void
{
    r_teacher();
    $t = bin2hex(random_bytes(24));
    rq('DELETE FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_dong_bo']);
    rq('INSERT INTO bdvh_bg_cau_hinh (k, v) VALUES (?, ?)', ['token_dong_bo', hash('sha256', $t)]);
    rq('DELETE FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_luc']);
    rq('INSERT INTO bdvh_bg_cau_hinh (k, v) VALUES (?, ?)', ['token_luc', rnow()]);
    rok(['token' => $t]);
}

function action_bg_delete(array $in): void
{
    r_teacher();
    $row = bg_load($in);
    rq('DELETE FROM bdvh_bai_giang WHERE bo_id = ?', [(int) $row['bo_id']]);
    rok(true);
}

/** Tạo lời giải cho MỘT câu bằng Gemini và lưu lại. ghi_de = true để tạo lại khi đã có. */
function action_bg_giai(array $in): void
{
    bg_quyen($in);
    $cfg = bg_gemini_cfg();
    if ($cfg['key'] === '') { rfail('Chưa có khoá Gemini: thêm mục \'gemini\' => [\'api_key\' => …] vào private/config.php.'); }
    $row = bg_load($in);
    $cid = (string) ($in['cau_id'] ?? '');
    $idx = null;
    foreach (($row['du_lieu']['cau'] ?? []) as $i => $c) { if ($c['id'] === $cid) { $idx = $i; break; } }
    if ($idx === null) { rfail('Không tìm thấy câu trong bộ bài giảng.'); }
    $c = $row['du_lieu']['cau'][$idx];
    if (!empty($c['giai']['cac_buoc']) && empty($in['ghi_de'])) { rok(['cau_id' => $cid, 'giai' => $c['giai'], 'da_co' => true]); }

    [$text, $model] = bg_gemini_generate($cfg, bg_gemini_body(bg_prompt($c, $row['du_lieu']['thong_tin'] ?? [])));
    $text = trim(preg_replace('/^```(?:json)?|```$/m', '', $text));
    $g = json_decode($text, true);
    if (!is_array($g) || empty($g['cac_buoc'])) { rfail('Gemini trả về không đúng định dạng, bấm tạo lại.'); }
    $g['nguon'] = $model;
    $g['luc'] = rnow();
    $g['da_duyet'] = false;
    $giai = bg_norm_giai($g);

    // Ghi trong giao dịch, đọc lại bản mới nhất (khoá dòng) để không đè lời giải của câu khác đang tạo song song
    $boId = (int) $row['bo_id'];
    rtx(static function () use ($boId, $cid, $giai) {
        $fresh = rq_one('SELECT * FROM bdvh_bai_giang WHERE bo_id = ?' . r_forupdate(), [$boId]);
        if (!$fresh) { rfail('Bộ bài giảng đã bị xoá.'); }
        $fresh['du_lieu'] = rjd($fresh['du_lieu'], []);
        foreach ($fresh['du_lieu']['cau'] as &$fc) { if ($fc['id'] === $cid) { $fc['giai'] = $giai; } }
        unset($fc);
        bg_store($fresh);
    });
    rok(['cau_id' => $cid, 'giai' => $giai, 'da_co' => false]);
}

/** GV sửa tay lời giải (hoặc đánh dấu đã duyệt). */
function action_bg_sua_giai(array $in): void
{
    r_teacher();
    $row = bg_load($in);
    $cid = (string) ($in['cau_id'] ?? '');
    $ok = false;
    foreach ($row['du_lieu']['cau'] as &$c) {
        if ($c['id'] !== $cid) { continue; }
        $g = (array) ($in['giai'] ?? []);
        $g['nguon'] = ($c['giai']['nguon'] ?? 'giao-vien');
        $g['luc'] = rnow();
        $c['giai'] = bg_norm_giai($g);
        $ok = true;
    }
    unset($c);
    if (!$ok) { rfail('Không tìm thấy câu.'); }
    bg_store($row);
    rok(true);
}

function action_bg_trang_thai(array $in): void
{
    $gv = r_is_teacher();
    rok(['giao_vien' => $gv, 'gemini' => $gv ? bg_gemini_cfg()['key'] !== '' : null, 'hom_nay' => bg_hom_nay(),
         'token_luc' => $gv ? (rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_luc']) ?: null) : null]);
}

function bg_dispatch(string $action, array $in): void
{
    bg_ensure_tables();
    $map = ['bg_list' => 'action_bg_list', 'bg_get' => 'action_bg_get', 'bg_save' => 'action_bg_save', 'bg_delete' => 'action_bg_delete',
            'bg_giai' => 'action_bg_giai', 'bg_sua_giai' => 'action_bg_sua_giai', 'bg_trang_thai' => 'action_bg_trang_thai',
            'bg_nhap' => 'action_bg_nhap', 'bg_hom_nay' => 'action_bg_hom_nay', 'bg_token_tao' => 'action_bg_token_tao'];
    if (!isset($map[$action])) { json_out(['status' => 'error', 'message' => 'Thao tác bài giảng không hợp lệ.'], 404); }
    try {
        ($map[$action])($in);
    } catch (RoomError $e) {
        json_out(['status' => 'error', 'message' => $e->getMessage()]);
    } catch (Throwable $e) {
        error_log('[bai-giang] ' . $action . ': ' . $e->getMessage() . ' @' . $e->getLine());
        json_out(['status' => 'error', 'message' => 'Lỗi máy chủ. Vui lòng thử lại.'], 500);
    }
}

if (isset($action) && is_string($action) && str_starts_with($action, 'bg_')) {
    bg_dispatch($action, is_array($inputData ?? null) ? $inputData : []);
}
