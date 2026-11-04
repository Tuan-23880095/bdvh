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
    if (!r_is_teacher() && !bg_token_ok($in)) { json_out(['status' => 'error', 'can_dang_nhap' => true, 'message' => 'Bài giảng có đáp án và lời giải — cần đăng nhập giảng viên.'], 401); }
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
    $loai = in_array($c['loai'] ?? '', ['abcd', 'dung_sai', 'dung_sai_4', 'tra_loi_ngan', 'tu_luan'], true) ? $c['loai'] : 'tu_luan';
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

/** Vá LaTeX Gemini trả về bị hỏng dấu \ (giống suaTex trong assets/trinh-chieu.js). */
const BG_LENH = ['overrightarrow', 'Leftrightarrow', 'rightarrow', 'Rightarrow', 'leftarrow', 'Leftarrow', 'overline', 'setminus', 'widehat',
    'mathbb', 'forall', 'exists', 'dfrac', 'infty', 'times', 'frac', 'sqrt', 'cdot', 'circ', 'perp', 'vec', 'cap', 'cup', 'leq', 'geq', 'neq',
    'sin', 'cos', 'tan', 'le', 'ge', 'ne', 'in', 'pi'];
function bg_tach_lenh(string $w): ?array
{
    if ($w === '') return [];
    foreach (BG_LENH as $l) {
        if (str_starts_with($w, $l)) { $r = bg_tach_lenh(substr($w, strlen($l))); if ($r !== null) return array_merge([$l], $r); }
    }
    return null;
}
function bg_sua_tex(string $t): string
{
    if ($t === '') return $t;
    $t = preg_replace('/\x08\{?(circ|frac|dfrac|beta|bar)\}?/', '\\\\$1', $t);
    $t = strtr($t, ["\x08" => '\b', "\x0c" => '\f']);
    $t = preg_replace(['/\t(?=(?:imes|ext|an|heta|au|o|riangle|frac|op|ilde)(?![a-z]))/', '/\r(?=(?:ho|ight|angle|m|ceil|floor)(?![a-z]))/'], ['\\\\t', '\\\\r'], $t);
    $t = strtr($t, ["\t" => ' ', "\r" => '']);
    $t = preg_replace('/\n(?=(?:eq|abla|otin|ot\b|eg\b|e\b|leq|geq)(?![a-z]))/', '\\\\n', $t);   // \neq bị đọc thành xuống dòng
    $t = preg_replace_callback('/(^|[^\\\\A-Za-z])([A-Za-z]{4,})(?=[^A-Za-z]|$)/', static function ($m) {
        $p = bg_tach_lenh($m[2]);
        return $p !== null ? $m[1] . implode('', array_map(static fn ($x) => '\\' . $x, $p)) : $m[0];
    }, $t);
    $t = preg_replace('/(^|[^\\\\A-Za-z])vec(?=\{)/', '$1\\\\vec', $t);
    $t = bg_sua_do($t);
    if (preg_match('/\\\\[A-Za-z]/', $t) && !preg_match('/\$|\\\\\(|\\\\\[/', $t)) {
        $t = preg_replace_callback('/[^\s]*\\\\[A-Za-z][^\s]*/u', static function ($m) {
            $k = preg_match('/[,.;:]+$/', $m[0], $kk) ? $kk[0] : '';
            return '$' . substr($m[0], 0, strlen($m[0]) - strlen($k)) . '$' . $k;
        }, $t);
    }
    return $t;
}

/** Trước json_decode: LaTeX viết một dấu \ (\frac, \circ…) là chuỗi JSON sai hoặc bị đổi thành ký tự điều khiển (\f, \t, \r, \b, \n)
 *  → nhân đôi dấu \. Với 5 chữ b f n r t chỉ nhân đôi khi phía sau đúng là lệnh LaTeX (\times, \frac, \rho…), để giữ \n xuống dòng thật. */
const BG_LENH_BFNRT = 'b(?:eta|ar|ullet|ig|inom|oxed|ot|egin)|f(?:rac|orall)|n(?:eq|e\b|abla|ot|i\b|u\b|eg|leq|geq|otin)|r(?:ho|ight|angle|m\b|ceil|floor)|t(?:imes|ext|an|heta|au|o\b|riangle|frac|op|ilde|extbf|extit)';
function bg_sua_json(string $text): string
{
    return preg_replace(
        ['/(?<!\\\\)((?:\\\\\\\\)*)\\\\(?=(?:' . BG_LENH_BFNRT . '))/', '/(?<!\\\\)((?:\\\\\\\\)*)\\\\(?=[ac-eg-mo-qsv-zA-Z]|u(?![0-9a-fA-F]{4}))/'],
        ['$1\\\\\\\\', '$1\\\\\\\\'],
        $text
    );
}

/** Ký hiệu độ Gemini hay viết sai: ^\rho, ^\text{o}, ^{o}, ^o → ^\circ */
function bg_sua_do(string $t): string
{
    return preg_replace('/\^\s*(?:\{\s*)?(?:\\\\rho|\\\\text\{\s*o\s*\}|\\\\mathrm\{\s*o\s*\}|o(?![A-Za-z])|°)(?:\s*\})?/u', '^\\\\circ', $t);
}

function bg_norm_giai(array $g): array
{
    $buoc = [];
    foreach ((array) ($g['cac_buoc'] ?? []) as $b) {
        if (is_string($b)) { $b = ['tieu_de' => '', 'noi_dung' => $b]; }
        if (!is_array($b)) { continue; }
        $nd = bg_sua_tex(bg_str($b['noi_dung'] ?? '', 1200));
        if ($nd === '') { continue; }
        $buoc[] = ['tieu_de' => bg_sua_tex(bg_str($b['tieu_de'] ?? '', 120)), 'noi_dung' => $nd];
        if (count($buoc) >= 8) { break; }
    }
    $kt = (string) ($g['kiem_tra_dap_an'] ?? '');
    return [
        'dap_an_ngan' => bg_sua_tex(bg_str($g['dap_an_ngan'] ?? '', 600)),
        'kien_thuc' => bg_sua_tex(bg_str($g['kien_thuc'] ?? '', 800)),
        'cac_buoc' => $buoc,
        'loi_thuong_gap' => bg_sua_tex(bg_str($g['loi_thuong_gap'] ?? '', 600)),
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

/**
 * Tìm khoá Gemini theo thứ tự: (1) khoá thầy dán trên trang bai-giang.html (lưu trong CSDL, không bao giờ trả về trình duyệt);
 * (2) mục 'gemini' trong private/config.php của diemdanhsv (dùng chung với KHTD) — thử cả khi api.php chạy SQLite
 * vì thư mục subdomain nằm ngoài public_html; (3) biến môi trường GEMINI_API_KEY.
 */
function bg_gemini_cfg(): array
{
    $key = ''; $prefer = []; $nguon = '';
    try {
        $v = rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['gemini_key']);
        if (is_string($v) && $v !== '') { $key = $v; $nguon = 'web'; }
        $m = rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['gemini_model']);
        if (is_string($m) && $m !== '') { $prefer[] = $m; }
    } catch (Throwable $e) {}
    $cfgs = [];
    if (function_exists('app_config')) { try { $cfgs[] = app_config(); } catch (Throwable $e) {} }
    foreach ([dirname(__DIR__) . '/../private/config.php', dirname(__DIR__) . '/private/config.php',
              dirname(__DIR__, 2) . '/private/config.php', dirname(__DIR__, 3) . '/private/config.php'] as $f) {
        if (!$cfgs && is_file($f)) { try { $c = include $f; if (is_array($c)) { $cfgs[] = $c; } } catch (Throwable $e) {} }
    }
    foreach ($cfgs as $c) {
        $g = $c['gemini'] ?? null;
        if (!is_array($g)) { continue; }
        if ($key === '' && !empty($g['api_key'])) { $key = (string) $g['api_key']; $nguon = 'config'; }
        if (!empty($g['model'])) { $prefer[] = (string) $g['model']; }
        foreach ((array) ($g['models'] ?? []) as $m) { $prefer[] = (string) $m; }
    }
    if ($key === '' && getenv('GEMINI_API_KEY')) { $key = (string) getenv('GEMINI_API_KEY'); $nguon = 'env'; }
    if ($m = getenv('GEMINI_MODEL')) { array_unshift($prefer, (string) $m); }
    return ['key' => $key, 'prefer' => array_values(array_unique(array_filter($prefer))), 'nguon' => $nguon, 'co_config' => (bool) $cfgs];
}

/** GV dán khoá Gemini (lấy ở aistudio.google.com/apikey). Máy chủ thử khoá với Google trước khi lưu; xoá khi gửi khoá rỗng. */
function action_bg_gemini_luu(array $in): void
{
    r_teacher();
    $k = trim((string) ($in['api_key'] ?? ''));
    if ($k === '') { rq('DELETE FROM bdvh_bg_cau_hinh WHERE k = ?', ['gemini_key']); rok(['da_xoa' => true]); }
    if (!preg_match('/^[A-Za-z0-9_\-]{30,80}$/', $k)) { rfail('Khoá không đúng dạng. Khoá Gemini thường bắt đầu bằng "AIza…" và dài khoảng 39 ký tự.'); }
    $r = bg_http('https://generativelanguage.googleapis.com/v1beta/models?pageSize=5', $k, null, 20);
    if ($r['http'] === 0) { rfail('Máy chủ không kết nối được tới Google để thử khoá: ' . $r['msg']); }
    if ($r['http'] !== 200) { rfail('Google từ chối khoá này (HTTP ' . $r['http'] . '): ' . $r['msg']); }
    rq('DELETE FROM bdvh_bg_cau_hinh WHERE k = ?', ['gemini_key']);
    rq('INSERT INTO bdvh_bg_cau_hinh (k, v) VALUES (?, ?)', ['gemini_key', $k]);
    @array_map('unlink', glob(sys_get_temp_dir() . '/bdvh_gemini_models_*') ?: []);
    rok(['duoi' => substr($k, -4)]);
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
                if (str_contains($n, 'lite')) { $v -= 40; }   // bản lite giải toán kém, chỉ dùng khi không còn flash
                if (preg_match('/preview|exp|thinking/i', $n)) { $v -= 8; }
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
/** Cấu hình "suy nghĩ" ít nhất cho từng thế hệ model: Gemini 3.x dùng thinkingLevel, Gemini 2.5 dùng thinkingBudget.
 *  (Gửi thinkingBudget = 0 cho Gemini 3 bị từ chối → trước đây rơi về mức suy nghĩ mặc định "high", rất chậm, quá giờ máy chủ.) */
function bg_thinking_it(string $model): ?array
{
    if (preg_match('/gemini-([3-9])/i', $model)) { return ['thinkingLevel' => stripos($model, 'pro') !== false ? 'low' : 'minimal']; }
    if (preg_match('/gemini-2\.5/i', $model)) { return stripos($model, 'pro') !== false ? ['thinkingBudget' => 128] : ['thinkingBudget' => 0]; }
    return null;
}

function bg_gemini_generate(array $cfg, array $body): array
{
    $last = ''; $het = 0;
    $batDau = time();
    foreach (bg_gemini_models($cfg) as $model) {
        if (time() - $batDau > 120) { break; }   // không chờ quá lâu trên một câu — trả lỗi để trang tự thử lại
        $th = bg_thinking_it($model);
        foreach ($th ? [$th, ['thinkingLevel' => 'low'], null] : [null] as $cfgTh) {
            $b = $body;
            if ($cfgTh) { $b['generationConfig']['thinkingConfig'] = $cfgTh; }
            $r = bg_http('https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent', $cfg['key'], $b, 85);
            if ($r['http'] === 200) {
                $t = '';
                foreach ((array) ($r['data']['candidates'][0]['content']['parts'] ?? []) as $part) {
                    if (empty($part['thought'])) { $t .= (string) ($part['text'] ?? ''); }
                }
                if (trim($t) !== '') { return [$t, $model]; }
                $last = 'Gemini ' . $model . ' trả về rỗng (' . ($r['data']['candidates'][0]['finishReason'] ?? '?') . ').';
                break;
            }
            $last = 'Gemini ' . $model . ' lỗi ' . ($r['http'] ?: 'kết nối') . ': ' . $r['msg'];
            if ($r['http'] === 429) { $het++; }
            if ($r['http'] === 400 && $cfgTh) { continue; }          // tham số suy nghĩ không hợp với model này → thử kiểu khác
            if (in_array($r['http'], [401, 403], true)) { break 2; } // khoá sai / bị chặn: thử model khác cũng vô ích
            break;                                                    // 404, 429, 5xx, quá giờ → sang model kế tiếp
        }
    }
    if ($het > 0 && str_contains($last, '429')) {
        throw new RoomError('Gemini báo hết hạn mức (429) — khoá miễn phí giới hạn số lần gọi mỗi phút/ngày. Chờ 1–2 phút rồi bấm lại, hoặc dùng khoá có trả phí. (' . $last . ')');
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
    $loaiTen = ['abcd' => 'trắc nghiệm 4 lựa chọn', 'dung_sai' => 'trắc nghiệm Đúng/Sai', 'dung_sai_4' => 'Đúng/Sai cho từng ý a, b, c, d', 'tra_loi_ngan' => 'trả lời ngắn', 'tu_luan' => 'tự luận'];
    $p = "Môn: " . ($info['mon'] ?? 'Toán') . " · " . ($info['khoi'] ?? '') . "\n";
    $p .= "Loại câu: " . ($loaiTen[$c['loai']] ?? $c['loai']) . "\n\n";
    $p .= "ĐỀ (" . $c['so'] . "):\n" . bg_html_text($c['de_html']) . "\n";
    foreach ($c['lua_chon'] as $o) {
        if ($c['loai'] === 'abcd') { $p .= $o['k'] . ". " . bg_html_text($o['html']) . "\n"; }
        if ($c['loai'] === 'dung_sai_4') { $p .= $o['k'] . ") " . bg_html_text($o['html']) . "\n"; }
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
        . "6. Công thức viết LaTeX và LUÔN đặt trong \$...\$ (ví dụ \$\\dfrac{3}{4}\$, \$60^\\circ\$). Trong chuỗi JSON mỗi dấu \\ của LaTeX phải viết thành \\\\. Không dùng markdown (**, #). Tiếng Việt chuẩn, xưng \"em\" với học sinh.\n"
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
    bg_quyen($in);   // bài giảng có đáp án + lời giải → chỉ giáo viên
    $rows = rq_all('SELECT bo_id, ma, tieu_de, khoi, mon, nguon, so_cau, sua_luc, du_lieu FROM bdvh_bai_giang ORDER BY sua_luc DESC');
    $ds = array_map(static function ($r) { $r['du_lieu'] = rjd($r['du_lieu'], []); return bg_public($r, false); }, $rows);
    usort($ds, static fn ($a, $b) => [$b['hom_nay'], $b['ngay'], $b['sua_luc']] <=> [$a['hom_nay'], $a['ngay'], $a['sua_luc']]);
    rok($ds);
}

function action_bg_get(array $in): void
{
    bg_quyen($in);   // bài giảng có đáp án + lời giải → chỉ giáo viên
    rok(bg_public(bg_load($in), true));
}

/**
 * Thêm mới hoặc cập nhật một bộ bài giảng. Khi cập nhật: giữ lời giải đã có của câu cùng mã (nhập lại đề không mất lời giải).
 * $theoMa = true: nếu đã có bộ cùng mã thì cập nhật bộ đó (dùng cho đồng bộ tự động từ Drive, tránh tạo bản trùng).
 */
function bg_upsert(array $in, bool $theoMa, ?bool $giuTen = null): array
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
        $ten = ($giuTen ?? $theoMa) ? $old['tieu_de'] : $tieuDe;
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
    // Nhập lại cùng file đề (cùng mã) → cập nhật bộ cũ, giữ lời giải; tên lấy theo ô thầy vừa nhập
    rok(bg_upsert($in, true, false));
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
    bg_quyen($in);   // bài giảng có đáp án + lời giải → chỉ giáo viên
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
    @set_time_limit(180);   // gọi Gemini có thể mất 30–90 giây
    $cfg = bg_gemini_cfg();
    if ($cfg['key'] === '') { rfail('Chưa có khoá Gemini — dán khoá ở trang Bài giảng (khung "Khoá Gemini").'); }
    $row = bg_load($in);
    $cid = (string) ($in['cau_id'] ?? '');
    $idx = null;
    foreach (($row['du_lieu']['cau'] ?? []) as $i => $c) { if ($c['id'] === $cid) { $idx = $i; break; } }
    if ($idx === null) { rfail('Không tìm thấy câu trong bộ bài giảng.'); }
    $c = $row['du_lieu']['cau'][$idx];
    if (!empty($c['giai']['cac_buoc']) && empty($in['ghi_de'])) { rok(['cau_id' => $cid, 'giai' => $c['giai'], 'da_co' => true]); }

    [$text, $model] = bg_gemini_generate($cfg, bg_gemini_body(bg_prompt($c, $row['du_lieu']['thong_tin'] ?? [])));
    $text = trim(preg_replace('/^```(?:json)?|```$/m', '', $text));
    $g = json_decode(bg_sua_json($text), true);
    if (!is_array($g)) { $g = json_decode($text, true); }
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
    $g = $gv ? bg_gemini_cfg() : null;
    rok(['giao_vien' => $gv, 'gemini' => $g ? $g['key'] !== '' : null, 'gemini_nguon' => $g['nguon'] ?? null,
         'gemini_duoi' => $g && $g['key'] !== '' ? substr($g['key'], -4) : null, 'hom_nay' => bg_hom_nay(),
         'token_luc' => $gv ? (rq_val('SELECT v FROM bdvh_bg_cau_hinh WHERE k = ?', ['token_luc']) ?: null) : null]);
}

/* ============================ Tương tác kiểu Slido: học sinh bình chọn bằng điện thoại ============================
 * Mỗi bộ bài giảng có một "phòng" (mã 5 ký tự). Giáo viên chiếu slide nào thì phòng ghi câu + loại slide đó.
 * Học sinh (hs.html?p=MÃ) chỉ thấy đúng câu đang chiếu, KHÔNG thấy đáp án cho tới khi thầy qua slide Đáp án.
 * Thầy bấm Khoá → ngừng nhận bình chọn. Qua slide Đáp án → tự khoá. */

const BG_MA_KY_TU = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function bg_phong_bang(): void
{
    global $pdo;
    static $xong = false;
    if ($xong) { return; }
    $xong = true;
    try { $pdo->query('SELECT buoi FROM bdvh_bg_phieu LIMIT 1'); return; } catch (Throwable $e) {}
    $coSan = true;
    try { $pdo->query('SELECT 1 FROM bdvh_bg_phieu LIMIT 1'); } catch (Throwable $e) { $coSan = false; }
    if ($coSan) {   // bảng đã tạo ở bản trước (chưa có "buổi") → thêm cột buoi, khoá trùng tính theo buổi
        if (r_sqlite()) {
            $pdo->exec('ALTER TABLE bdvh_bg_phong ADD COLUMN buoi INTEGER NOT NULL DEFAULT 1');
            $pdo->exec('ALTER TABLE bdvh_bg_phieu RENAME TO bdvh_bg_phieu_cu');
        } else {
            // Mỗi lệnh bọc riêng: hai yêu cầu cùng lúc cùng nâng cấp thì lệnh thứ hai báo "đã có" — bỏ qua
            foreach (['ALTER TABLE bdvh_bg_phong ADD COLUMN buoi INT NOT NULL DEFAULT 1',
                      'ALTER TABLE bdvh_bg_phieu ADD COLUMN buoi INT NOT NULL DEFAULT 1 AFTER bo_id',
                      'ALTER TABLE bdvh_bg_phieu DROP INDEX uq_bg_phieu, ADD UNIQUE KEY uq_bg_phieu (bo_id, buoi, cau, client_id)'] as $sql) {
                try { $pdo->exec($sql); } catch (Throwable $e) { error_log('[bai-giang] nâng cấp bảng phiếu: ' . $e->getMessage()); }
            }
            return;
        }
    }
    if (r_sqlite()) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_bg_phong (bo_id INTEGER PRIMARY KEY, ma_phong TEXT NOT NULL UNIQUE, cau INTEGER NOT NULL DEFAULT 0,
            loai TEXT NOT NULL DEFAULT 'bia', khoa INTEGER NOT NULL DEFAULT 0, sua_luc INTEGER NOT NULL DEFAULT 0, buoi INTEGER NOT NULL DEFAULT 1)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_bg_phieu (id INTEGER PRIMARY KEY AUTOINCREMENT, bo_id INTEGER NOT NULL, buoi INTEGER NOT NULL DEFAULT 1, cau INTEGER NOT NULL,
            client_id TEXT NOT NULL, ten TEXT NOT NULL DEFAULT '', tra_loi TEXT NOT NULL, luc INTEGER NOT NULL, UNIQUE(bo_id, buoi, cau, client_id))");
        if ($coSan) {
            $pdo->exec('INSERT INTO bdvh_bg_phieu (bo_id, buoi, cau, client_id, ten, tra_loi, luc) SELECT bo_id, 1, cau, client_id, ten, tra_loi, luc FROM bdvh_bg_phieu_cu');
            $pdo->exec('DROP TABLE bdvh_bg_phieu_cu');
        }
    } else {
        $e = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_bg_phong (bo_id INT PRIMARY KEY, ma_phong VARCHAR(8) NOT NULL, cau INT NOT NULL DEFAULT 0,
            loai VARCHAR(10) NOT NULL DEFAULT 'bia', khoa TINYINT NOT NULL DEFAULT 0, sua_luc INT NOT NULL DEFAULT 0, buoi INT NOT NULL DEFAULT 1,
            UNIQUE KEY uq_bg_phong (ma_phong))" . $e);
        $pdo->exec("CREATE TABLE IF NOT EXISTS bdvh_bg_phieu (id INT AUTO_INCREMENT PRIMARY KEY, bo_id INT NOT NULL, buoi INT NOT NULL DEFAULT 1, cau INT NOT NULL,
            client_id VARCHAR(64) NOT NULL, ten VARCHAR(80) NOT NULL DEFAULT '', tra_loi VARCHAR(40) NOT NULL, luc INT NOT NULL,
            UNIQUE KEY uq_bg_phieu (bo_id, buoi, cau, client_id), KEY k_bg_phieu (bo_id, buoi, cau))" . $e);
    }
}

function bg_gv(): void
{
    if (!r_is_teacher()) { json_out(['status' => 'error', 'can_dang_nhap' => true, 'message' => 'Cần đăng nhập giảng viên.'], 401); }
}

/** Phòng của một bộ (tạo mã lần đầu). */
function bg_phong_cua(int $boId): array
{
    bg_phong_bang();
    $p = rq_one('SELECT * FROM bdvh_bg_phong WHERE bo_id = ?', [$boId]);
    if ($p) { return $p; }
    for ($i = 0; $i < 20; $i++) {
        $ma = '';
        for ($j = 0; $j < 5; $j++) { $ma .= BG_MA_KY_TU[random_int(0, strlen(BG_MA_KY_TU) - 1)]; }
        if (!rq_val('SELECT COUNT(*) FROM bdvh_bg_phong WHERE ma_phong = ?', [$ma])) {
            rq('INSERT INTO bdvh_bg_phong (bo_id, ma_phong, cau, loai, khoa, sua_luc) VALUES (?, ?, 0, ?, 0, ?)', [$boId, $ma, 'bia', time()]);
            return rq_one('SELECT * FROM bdvh_bg_phong WHERE bo_id = ?', [$boId]);
        }
    }
    rfail('Không tạo được mã phòng, thử lại.');
}

/** Câu có bình chọn được không và chuẩn hoá câu trả lời của học sinh. null = không hợp lệ. */
function bg_chuan_tra_loi(array $c, string $t): ?string
{
    $t = trim($t);
    switch ($c['loai']) {
        case 'abcd':
            $t = strtoupper($t);
            $keys = array_map(static fn ($o) => strtoupper((string) $o['k']), $c['lua_chon'] ?? []);
            if (!$keys) { $keys = ['A', 'B', 'C', 'D']; }
            return in_array($t, $keys, true) ? $t : null;
        case 'dung_sai':
            $t = strtoupper(str_replace(['Đ', 'đ'], 'D', $t));
            return in_array($t, ['D', 'S'], true) ? $t : null;
        case 'dung_sai_4':
            $t = strtoupper(str_replace(['Đ', 'đ'], 'D', $t));
            $n = max(1, min(8, count($c['lua_chon'] ?? []) ?: 4));
            return preg_match('/^[DS]{' . $n . '}$/', $t) ? $t : null;
        case 'tra_loi_ngan':
            $t = preg_replace('/\s+/u', ' ', $t);
            return ($t !== '' && mb_strlen($t) <= 40) ? $t : null;
    }
    return null;   // tự luận: không bình chọn
}

/** Đáp án đúng ở dạng giống câu trả lời học sinh (để tô đúng/sai). '' = không rõ. */
function bg_dap_an_chuan(array $c): string
{
    $da = (string) ($c['dap_an'] ?? '');
    switch ($c['loai']) {
        case 'abcd':
            if ($da === '' && preg_match('/^\s*([A-D])[.)]/u', (string) ($c['giai']['dap_an_ngan'] ?? ''), $m)) { $da = $m[1]; }
            return strtoupper($da);
        case 'dung_sai':
            return $da === '' ? '' : (preg_match('/^s/iu', $da) ? 'S' : 'D');
        case 'dung_sai_4':
            $out = '';
            foreach (preg_split('/\s*[,;]\s*/u', $da) as $x) {
                if (preg_match('/^s/iu', $x)) { $out .= 'S'; } elseif (preg_match('/^(đ|d)/iu', $x)) { $out .= 'D'; } else { return ''; }
            }
            return $out;
        case 'tra_loi_ngan':
            return trim(strip_tags($da !== '' ? $da : (string) ($c['dap_an_html'] ?? '')));
    }
    return '';
}

/** GV: báo slide đang chiếu (cau = 1..n, 0 = bìa). Qua slide Đáp án/Giải thích thì tự khoá. */
function action_bg_phong_dat(array $in): void
{
    bg_gv();
    $boId = (int) ($in['bo_id'] ?? 0);
    if (!rq_val('SELECT COUNT(*) FROM bdvh_bai_giang WHERE bo_id = ?', [$boId])) { rfail('Không tìm thấy bộ bài giảng.'); }
    $p = bg_phong_cua($boId);
    $cau = max(0, (int) ($in['cau'] ?? 0));
    $loai = in_array($in['loai'] ?? '', ['bia', 'de', 'dap-an', 'giai', 'ket'], true) ? $in['loai'] : 'bia';
    $khoa = array_key_exists('khoa', $in) ? (int) !empty($in['khoa']) : (($loai === 'dap-an' || $loai === 'giai') ? 1 : 0);
    $cuoi = (int) rq_val('SELECT MAX(luc) FROM bdvh_bg_phieu WHERE bo_id = ? AND buoi = ?', [$boId, (int) $p['buoi']]);
    if ($cuoi > 0 && $cuoi < time() - 3 * 3600) {   // lớp mới (cách buổi trước > 3 giờ) → buổi mới, kết quả cũ vẫn giữ
        rq('UPDATE bdvh_bg_phong SET buoi = buoi + 1 WHERE bo_id = ?', [$boId]);
        $p['buoi'] = (int) $p['buoi'] + 1;
    }
    rq('UPDATE bdvh_bg_phong SET cau = ?, loai = ?, khoa = ?, sua_luc = ? WHERE bo_id = ?', [$cau, $loai, $khoa, time(), $boId]);
    rok(['ma_phong' => $p['ma_phong'], 'cau' => $cau, 'loai' => $loai, 'khoa' => (bool) $khoa, 'buoi' => (int) $p['buoi']]);
}

/** GV: kết quả bình chọn một câu. */
function action_bg_phong_kq(array $in): void
{
    bg_gv();
    bg_phong_bang();
    $boId = (int) ($in['bo_id'] ?? $_GET['bo_id'] ?? 0);
    $cau = (int) ($in['cau'] ?? $_GET['cau'] ?? 0);
    $buoi = (int) (rq_val('SELECT buoi FROM bdvh_bg_phong WHERE bo_id = ?', [$boId]) ?: 1);
    $rows = rq_all('SELECT ten, tra_loi, luc FROM bdvh_bg_phieu WHERE bo_id = ? AND buoi = ? AND cau = ? ORDER BY luc DESC', [$boId, $buoi, $cau]);
    $dem = []; $y = [];
    foreach ($rows as $r) {
        $t = (string) $r['tra_loi'];
        $dem[$t] = ($dem[$t] ?? 0) + 1;
        if (preg_match('/^[DS]{2,8}$/', $t)) {
            foreach (str_split($t) as $i => $ch) { $y[$i] = $y[$i] ?? ['D' => 0, 'S' => 0]; $y[$i][$ch]++; }
        }
    }
    arsort($dem);
    $ganDay = array_map(static fn ($r) => ['ten' => $r['ten'], 'tra_loi' => $r['tra_loi']], array_slice($rows, 0, 12));
    rok(['tong' => count($rows), 'dem' => $dem ?: new stdClass(), 'tung_y' => $y, 'gan_day' => $ganDay]);
}

/** GV: xoá bình chọn một câu (cau > 0) hoặc cả bộ (cau = 0). */
function action_bg_phong_xoa(array $in): void
{
    bg_gv();
    bg_phong_bang();
    $boId = (int) ($in['bo_id'] ?? 0); $cau = (int) ($in['cau'] ?? 0);
    $buoi = (int) ($in['buoi'] ?? 0) ?: (int) (rq_val('SELECT buoi FROM bdvh_bg_phong WHERE bo_id = ?', [$boId]) ?: 1);
    if ($cau > 0) { rq('DELETE FROM bdvh_bg_phieu WHERE bo_id = ? AND buoi = ? AND cau = ?', [$boId, $buoi, $cau]); }
    else { rq('DELETE FROM bdvh_bg_phieu WHERE bo_id = ? AND buoi = ?', [$boId, $buoi]); }
    rok(true);
}

/** Học sinh: trạng thái phòng + đúng câu đang chiếu (không kèm đáp án khi còn ở slide Đề).
 *  Gửi kèm k (khoá trạng thái lần trước) → không đổi thì chỉ trả {doi:false}, đỡ tải máy chủ khi cả lớp cùng hỏi. */
function action_bg_hs_xem(array $in): void
{
    bg_phong_bang();
    $ma = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($in['p'] ?? $_GET['p'] ?? '')));
    $p = $ma !== '' ? rq_one('SELECT * FROM bdvh_bg_phong WHERE ma_phong = ?', [$ma]) : null;
    if (!$p) { rfail('Mã phòng không đúng. Em xem lại mã trên màn chiếu.'); }
    $k = $p['cau'] . '|' . $p['loai'] . '|' . $p['khoa'];
    if ((string) ($in['k'] ?? $_GET['k'] ?? '') === $k) { rok(['doi' => false, 'k' => $k]); }
    $row = bg_load(['bo_id' => (int) $p['bo_id']]);
    $ds = $row['du_lieu']['cau'] ?? [];
    $o = ['doi' => true, 'k' => $k, 'tieu_de' => $row['tieu_de'], 'so_cau' => count($ds), 'cau' => (int) $p['cau'],
          'loai_slide' => $p['loai'], 'khoa' => (bool) $p['khoa']];
    $c = $ds[(int) $p['cau'] - 1] ?? null;
    if ($c && (int) $p['cau'] > 0) {
        $q = ['so' => $c['so'], 'loai' => $c['loai'], 'de_html' => $c['de_html'],
              'lua_chon' => array_map(static fn ($x) => ['k' => $x['k'], 'html' => $x['html']], $c['lua_chon'] ?? []),
              'binh_chon' => in_array($c['loai'], ['abcd', 'dung_sai', 'dung_sai_4', 'tra_loi_ngan'], true)];
        if ($p['loai'] !== 'de') {   // đã qua slide Đáp án: mới cho xem đáp án + lời giải tóm tắt
            $g = $c['giai'] ?? [];
            $q['dap_an'] = bg_dap_an_chuan($c);
            $q['dap_an_html'] = $c['dap_an_html'] ?? '';
            $q['dap_an_ngan'] = (string) ($g['dap_an_ngan'] ?? '');
            $q['cac_buoc'] = array_slice((array) ($g['cac_buoc'] ?? []), 0, 8);
        }
        $cid = (string) ($in['client_id'] ?? $_GET['client_id'] ?? '');
        if ($cid !== '') {
            $q['cua_em'] = rq_val('SELECT tra_loi FROM bdvh_bg_phieu WHERE bo_id = ? AND buoi = ? AND cau = ? AND client_id = ?', [(int) $p['bo_id'], (int) $p['buoi'], (int) $p['cau'], $cid]) ?: '';
        }
        $o['cau_hoi'] = $q;
    }
    rok($o);
}

/** Học sinh gửi bình chọn cho câu đang chiếu (chỉ khi thầy đang ở slide Đề và chưa khoá). */
function action_bg_hs_chon(array $in): void
{
    bg_phong_bang();
    $ma = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($in['p'] ?? '')));
    $p = $ma !== '' ? rq_one('SELECT * FROM bdvh_bg_phong WHERE ma_phong = ?', [$ma]) : null;
    if (!$p) { rfail('Mã phòng không đúng.'); }
    $cau = (int) ($in['cau'] ?? 0);
    if ($cau !== (int) $p['cau'] || $p['loai'] !== 'de') { rfail('Thầy đã chuyển sang câu khác.'); }
    if ((int) $p['khoa'] === 1) { rfail('Thầy đã khoá bình chọn câu này.'); }
    $cid = preg_replace('/[^A-Za-z0-9_\-]/', '', (string) ($in['client_id'] ?? ''));
    if (strlen($cid) < 8) { rfail('Thiếu mã thiết bị, em tải lại trang.'); }
    $row = bg_load(['bo_id' => (int) $p['bo_id']]);
    $c = ($row['du_lieu']['cau'] ?? [])[$cau - 1] ?? null;
    if (!$c) { rfail('Không tìm thấy câu hỏi.'); }
    $t = bg_chuan_tra_loi($c, (string) ($in['tra_loi'] ?? ''));
    if ($t === null) { rfail('Câu trả lời không hợp lệ.'); }
    $ten = mb_substr(trim(strip_tags((string) ($in['ten'] ?? ''))), 0, 80) ?: 'Học sinh';
    $sql = r_sqlite()
        ? 'INSERT INTO bdvh_bg_phieu (bo_id, buoi, cau, client_id, ten, tra_loi, luc) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(bo_id, buoi, cau, client_id) DO UPDATE SET ten = excluded.ten, tra_loi = excluded.tra_loi, luc = excluded.luc'
        : 'INSERT INTO bdvh_bg_phieu (bo_id, buoi, cau, client_id, ten, tra_loi, luc) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE ten = VALUES(ten), tra_loi = VALUES(tra_loi), luc = VALUES(luc)';
    rq($sql, [(int) $p['bo_id'], (int) $p['buoi'], $cau, $cid, $ten, $t, time()]);
    rok(['tra_loi' => $t]);
}

/** Câu trả lời có đúng không: 1 = đúng, 0 = sai, null = chưa có đáp án để so. Đ/S 4 ý: đúng khi cả 4 ý đúng. */
function bg_cham(array $c, string $da, string $t): ?int
{
    if ($da === '') { return null; }
    if ($c['loai'] === 'tra_loi_ngan') {
        $n = static fn ($x) => str_replace([' ', ','], ['', '.'], mb_strtolower(trim(strip_tags($x))));
        return (int) ($n($t) === $n($da));
    }
    return (int) ($t === $da);
}

/** GV: danh sách các buổi đã có học sinh bình chọn (mọi bộ bài giảng) — hiện ở trang Quản trị. */
function action_bg_phong_tong_hop(array $in): void
{
    bg_gv();
    bg_phong_bang();
    $rows = rq_all('SELECT p.bo_id, p.buoi, COUNT(DISTINCT p.client_id) AS so_hs, COUNT(*) AS so_phieu, MIN(p.luc) AS bat_dau, MAX(p.luc) AS ket_thuc,
            b.ma, b.tieu_de FROM bdvh_bg_phieu p JOIN bdvh_bai_giang b ON b.bo_id = p.bo_id
            GROUP BY p.bo_id, p.buoi, b.ma, b.tieu_de ORDER BY MAX(p.luc) DESC LIMIT 60');
    $out = [];
    foreach ($rows as $r) {
        $out[] = ['bo_id' => (int) $r['bo_id'], 'ma' => $r['ma'], 'tieu_de' => $r['tieu_de'], 'buoi' => (int) $r['buoi'],
                  'so_hs' => (int) $r['so_hs'], 'so_phieu' => (int) $r['so_phieu'],
                  'bat_dau' => date('Y-m-d H:i', (int) $r['bat_dau']), 'ket_thuc' => date('Y-m-d H:i', (int) $r['ket_thuc'])];
    }
    rok($out);
}

/** GV: bảng kết quả một buổi — từng học sinh × từng câu, số câu đúng, thống kê từng câu. */
function action_bg_phong_bao_cao(array $in): void
{
    bg_gv();
    bg_phong_bang();
    $row = bg_load($in);
    $boId = (int) $row['bo_id'];
    $hien = (int) (rq_val('SELECT buoi FROM bdvh_bg_phong WHERE bo_id = ?', [$boId]) ?: 1);
    $cacBuoi = array_map('intval', array_column(rq_all('SELECT DISTINCT buoi FROM bdvh_bg_phieu WHERE bo_id = ? ORDER BY buoi DESC', [$boId]), 'buoi'));
    $buoi = (int) ($in['buoi'] ?? $_GET['buoi'] ?? 0) ?: ($cacBuoi[0] ?? $hien);
    $ds = $row['du_lieu']['cau'] ?? [];
    $cau = []; $daChuan = [];
    foreach ($ds as $i => $c) {
        $daChuan[$i + 1] = bg_dap_an_chuan($c);
        $cau[] = ['stt' => $i + 1, 'so' => $c['so'], 'loai' => $c['loai'], 'dap_an' => $daChuan[$i + 1],
                  'binh_chon' => in_array($c['loai'], ['abcd', 'dung_sai', 'dung_sai_4', 'tra_loi_ngan'], true), 'tong' => 0, 'dung' => 0];
    }
    $phieu = rq_all('SELECT client_id, ten, cau, tra_loi, luc FROM bdvh_bg_phieu WHERE bo_id = ? AND buoi = ? ORDER BY luc', [$boId, $buoi]);
    $hs = [];
    foreach ($phieu as $p) {
        $n = (int) $p['cau'];
        if (!isset($ds[$n - 1])) { continue; }
        $id = $p['client_id'];
        $hs[$id] = $hs[$id] ?? ['ten' => '', 'tra_loi' => [], 'dung' => 0, 'da_lam' => 0, 'dau' => (int) $p['luc'], 'cuoi' => 0];
        $hs[$id]['ten'] = $p['ten'];   // tên mới nhất
        $hs[$id]['cuoi'] = max($hs[$id]['cuoi'], (int) $p['luc']);
        $d = bg_cham($ds[$n - 1], $daChuan[$n], (string) $p['tra_loi']);
        $hs[$id]['tra_loi'][$n] = ['t' => $p['tra_loi'], 'd' => $d];
        $hs[$id]['da_lam']++;
        $cau[$n - 1]['tong']++;
        if ($d === 1) { $hs[$id]['dung']++; $cau[$n - 1]['dung']++; }
    }
    $hs = array_values($hs);
    usort($hs, static fn ($a, $b) => [$b['dung'], $a['ten']] <=> [$a['dung'], $b['ten']]);
    $soBc = count(array_filter($cau, static fn ($c) => $c['binh_chon']));
    rok(['bo_id' => $boId, 'ma' => $row['ma'], 'tieu_de' => $row['tieu_de'], 'buoi' => $buoi, 'buoi_hien_tai' => $hien,
         'cac_buoi' => $cacBuoi ?: [$hien], 'so_cau_bc' => $soBc, 'cau' => $cau, 'hoc_sinh' => $hs,
         'bat_dau' => $phieu ? date('Y-m-d H:i', (int) $phieu[0]['luc']) : '', 'ket_thuc' => $phieu ? date('Y-m-d H:i', (int) end($phieu)['luc']) : '']);
}

/** GV: bắt đầu buổi mới cho bộ này (kết quả buổi cũ vẫn giữ để xem lại). */
function action_bg_phong_buoi_moi(array $in): void
{
    bg_gv();
    $boId = (int) ($in['bo_id'] ?? 0);
    bg_phong_cua($boId);
    rq('UPDATE bdvh_bg_phong SET buoi = buoi + 1 WHERE bo_id = ?', [$boId]);
    rok(['buoi' => (int) rq_val('SELECT buoi FROM bdvh_bg_phong WHERE bo_id = ?', [$boId])]);
}

/** GV: chẩn đoán Gemini — thử một yêu cầu nhỏ với từng model trong danh sách, báo mã lỗi + thời gian. */
function action_bg_gemini_thu(array $in): void
{
    r_teacher();
    @set_time_limit(180);
    $cfg = bg_gemini_cfg();
    if ($cfg['key'] === '') { rfail('Chưa có khoá Gemini.'); }
    @array_map('unlink', glob(sys_get_temp_dir() . '/bdvh_gemini_models_*') ?: []);   // lấy lại danh sách model mới nhất
    $out = [];
    $body = bg_gemini_body("Môn: Toán\nLoại câu: trắc nghiệm 4 lựa chọn\n\nĐỀ (Câu 1):\nTính \$2+3\$.\nA. 4\nB. 5\nC. 6\nD. 7\nĐÁP ÁN CỦA GIÁO VIÊN: B");
    foreach (bg_gemini_models($cfg) as $model) {
        $th = bg_thinking_it($model);
        foreach ($th ? [$th, ['thinkingLevel' => 'low'], null] : [null] as $cfgTh) {
            $b = $body;
            if ($cfgTh) { $b['generationConfig']['thinkingConfig'] = $cfgTh; }
            $t0 = microtime(true);
            $r = bg_http('https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent', $cfg['key'], $b, 45);
            $ok = $r['http'] === 200;
            $txt = '';
            if ($ok) { foreach ((array) ($r['data']['candidates'][0]['content']['parts'] ?? []) as $part) { if (empty($part['thought'])) { $txt .= (string) ($part['text'] ?? ''); } } }
            $g = $ok ? json_decode(bg_sua_json(trim(preg_replace('/^```(?:json)?|```$/m', '', $txt))), true) : null;
            $out[] = ['model' => $model, 'suy_nghi' => $cfgTh ? json_encode($cfgTh) : 'mặc định', 'http' => $r['http'], 'giay' => round(microtime(true) - $t0, 1),
                      'ket_qua' => $ok ? (is_array($g) && !empty($g['cac_buoc']) ? 'OK — ' . mb_substr((string) ($g['dap_an_ngan'] ?? ''), 0, 40) : 'trả về sai định dạng: ' . mb_substr($txt, 0, 120)) : $r['msg']];
            if ($ok || !($r['http'] === 400 && $cfgTh)) { break; }
        }
        if (count($out) >= 8) { break; }
    }
    rok(['nguon_khoa' => $cfg['nguon'], 'duoi_khoa' => substr($cfg['key'], -4), 'max_execution_time' => (int) ini_get('max_execution_time'), 'thu' => $out]);
}

function bg_dispatch(string $action, array $in): void
{
    bg_ensure_tables();
    $map = ['bg_list' => 'action_bg_list', 'bg_get' => 'action_bg_get', 'bg_save' => 'action_bg_save', 'bg_delete' => 'action_bg_delete',
            'bg_giai' => 'action_bg_giai', 'bg_sua_giai' => 'action_bg_sua_giai', 'bg_trang_thai' => 'action_bg_trang_thai',
            'bg_nhap' => 'action_bg_nhap', 'bg_gemini_luu' => 'action_bg_gemini_luu', 'bg_hom_nay' => 'action_bg_hom_nay', 'bg_token_tao' => 'action_bg_token_tao',
            'bg_phong_dat' => 'action_bg_phong_dat', 'bg_phong_kq' => 'action_bg_phong_kq', 'bg_phong_xoa' => 'action_bg_phong_xoa',
            'bg_hs_xem' => 'action_bg_hs_xem', 'bg_hs_chon' => 'action_bg_hs_chon',
            'bg_phong_tong_hop' => 'action_bg_phong_tong_hop', 'bg_phong_bao_cao' => 'action_bg_phong_bao_cao', 'bg_phong_buoi_moi' => 'action_bg_phong_buoi_moi',
            'bg_gemini_thu' => 'action_bg_gemini_thu'];
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
