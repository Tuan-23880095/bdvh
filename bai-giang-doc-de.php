<?php
declare(strict_types=1);

/**
 * bdvh/bai-giang-doc-de.php — Bản PHP của assets/doc-de-drive.js: tách file đề .html (khuôn A4 trên Drive DAYKEM)
 * thành danh sách câu hỏi. Dùng khi Google Apps Script tự gửi đề lên máy chủ (không có trình duyệt).
 * Hai bản phải cho cùng kết quả — sửa một bên thì sửa cả bên kia (tools/kiem-tra-doc-de.* so sánh hai bản).
 */

if (!defined('BDVH_API')) {
    http_response_code(404);
    exit;
}

function dd_norm(?string $s): string { return trim(preg_replace('/\s+/u', ' ', (string) $s)); }
function dd_khong_dau(?string $s): string
{
    $s = dd_norm($s);
    if (class_exists('Normalizer')) { $s = Normalizer::normalize($s, Normalizer::FORM_D); $s = preg_replace('/\p{Mn}+/u', '', $s); }
    else { $s = strtr($s, ['à'=>'a','á'=>'a','ả'=>'a','ã'=>'a','ạ'=>'a','ă'=>'a','ằ'=>'a','ắ'=>'a','ẳ'=>'a','ẵ'=>'a','ặ'=>'a','â'=>'a','ầ'=>'a','ấ'=>'a','ẩ'=>'a','ẫ'=>'a','ậ'=>'a','è'=>'e','é'=>'e','ẻ'=>'e','ẽ'=>'e','ẹ'=>'e','ê'=>'e','ề'=>'e','ế'=>'e','ể'=>'e','ễ'=>'e','ệ'=>'e','ì'=>'i','í'=>'i','ỉ'=>'i','ĩ'=>'i','ị'=>'i','ò'=>'o','ó'=>'o','ỏ'=>'o','õ'=>'o','ọ'=>'o','ô'=>'o','ồ'=>'o','ố'=>'o','ổ'=>'o','ỗ'=>'o','ộ'=>'o','ơ'=>'o','ờ'=>'o','ớ'=>'o','ở'=>'o','ỡ'=>'o','ợ'=>'o','ù'=>'u','ú'=>'u','ủ'=>'u','ũ'=>'u','ụ'=>'u','ư'=>'u','ừ'=>'u','ứ'=>'u','ử'=>'u','ữ'=>'u','ự'=>'u','ỳ'=>'y','ý'=>'y','ỷ'=>'y','ỹ'=>'y','ỵ'=>'y']); }
    return mb_strtolower(str_replace(['đ', 'Đ'], ['d', 'D'], $s));
}
function dd_inner(DOMNode $n): string { $h = ''; foreach ($n->childNodes as $c) { $h .= $n->ownerDocument->saveHTML($c); } return $h; }
function dd_has_class(DOMNode $n, string $c): bool { return $n instanceof DOMElement && in_array($c, preg_split('/\s+/', (string) $n->getAttribute('class')), true); }
function dd_elems(DOMNode $n): array { $o = []; foreach ($n->childNodes as $c) { if ($c instanceof DOMElement) { $o[] = $c; } } return $o; }
function dd_first_b(DOMNode $n): ?DOMElement
{
    foreach ((new DOMXPath($n->ownerDocument))->query('.//b|.//strong', $n) as $b) { return $b; }
    return null;
}
function dd_ancestor(DOMNode $n, callable $test): bool
{
    for ($p = $n->parentNode; $p; $p = $p->parentNode) { if ($p instanceof DOMElement && $test($p)) { return true; } }
    return false;
}

function dd_phan(string $text): ?string
{
    $t = dd_khong_dau($text);
    if (preg_match('/tu luan/', $t)) return 'tl';
    if (preg_match('/dung\s*sai/', $t)) return 'ds';
    if (preg_match('/tra loi ngan|dien dap so|dien ket qua/', $t)) return 'tln';
    if (preg_match('/trac nghiem/', $t)) return 'tn';
    return null;
}

function dd_bang_dap_an(?DOMElement $details): array
{
    $map = [];
    if (!$details) return $map;
    foreach ($details->getElementsByTagName('table') as $tb) {
        $rows = [];
        foreach ((new DOMXPath($tb->ownerDocument))->query('.//tr', $tb) as $tr) { $rows[] = $tr; }
        for ($i = 0; $i + 1 < count($rows); $i++) {
            $head = dd_elems($rows[$i]); $ans = dd_elems($rows[$i + 1]);
            if (!$head || !preg_match('/^câu$/iu', dd_norm($head[0]->textContent))) continue;
            if (!$ans || !preg_match('/(da|dap an)/', dd_khong_dau($ans[0]->textContent))) continue;
            foreach (array_slice($head, 1) as $j => $th) {
                $n = (int) dd_norm($th->textContent);
                $cell = $ans[$j + 1] ?? null;
                if ($n && $cell) $map[$n] = ['text' => dd_norm($cell->textContent), 'html' => trim(dd_inner($cell))];
            }
        }
    }
    return $map;
}

function dd_ghi_chu_tn(?DOMElement $details): array
{
    $out = [];
    if (!$details) return $out;
    $ps = [];
    foreach (dd_elems($details) as $el) {
        if ($el->tagName === 'p') $ps[] = $el;
        if ($el->tagName === 'div') foreach (dd_elems($el) as $x) { if ($x->tagName === 'p') $ps[] = $x; }
    }
    foreach ($ps as $p) {
        $html = dd_inner($p);
        if (preg_match('#<b>\s*(Câu|Bài)\s*\d+\s*\.?\s*</b>#iu', substr($html, 0, 40))) continue;
        if (!preg_match_all('#(?:^|[.;]\s*|<i>\s*|</i>\s*)(?:Câu\s*|C)(\d{1,2})\s*:#u', $html, $m, PREG_OFFSET_CAPTURE)) continue;
        $cnt = count($m[0]);
        for ($k = 0; $k < $cnt; $k++) {
            $n = (int) $m[1][$k][0];
            $bodyStart = $m[0][$k][1] + strlen($m[0][$k][0]);
            $end = $k + 1 < $cnt ? $m[0][$k + 1][1] : strlen($html);
            $seg = substr($html, $bodyStart, $end - $bodyStart);
            $seg = preg_replace('#</?i>#', '', preg_replace('/^\s+|[\s.;]+$/u', '', $seg));
            if ($seg !== '' && !isset($out[$n])) $out[$n] = $seg . '.';
        }
    }
    return $out;
}

function dd_loi_giai_tl(?DOMElement $details): array
{
    $out = []; $cur = null; $daQua = false;
    if (!$details) return $out;
    $them = static function (int $n, string $h) use (&$out) { $out[$n] = ($out[$n] ?? '') . $h; };
    foreach (dd_elems($details) as $el) {
        $tag = $el->tagName;
        if ($tag === 'summary' || $tag === 'table') continue;
        $txt = dd_khong_dau($el->textContent);
        if (preg_match('/^(ii\.\s*)?tu luan/', $txt)) { $daQua = true; $cur = null; continue; }
        if ($tag === 'ul' || $tag === 'ol') {
            $lis = dd_elems($el);
            $coNhan = false;
            foreach ($lis as $li) { if (preg_match('#^<b>\s*(Câu|Bài)\s*\d+#iu', trim(dd_inner($li)))) { $coNhan = true; break; } }
            if ($coNhan) {
                foreach ($lis as $li) {
                    $h = trim(dd_inner($li));
                    if (preg_match('#^<b>\s*(?:Câu|Bài)\s*(\d+)\s*\.?\s*</b>\s*#iu', $h, $mm)) { $cur = (int) $mm[1]; $them($cur, '<p>' . substr($h, strlen($mm[0])) . '</p>'); }
                    elseif ($cur) $them($cur, '<p>' . dd_inner($li) . '</p>');
                }
            } elseif ($cur) $them($cur, $el->ownerDocument->saveHTML($el));
            continue;
        }
        if ($tag === 'p') {
            $h = trim(dd_inner($el));
            if (preg_match('#^<b>\s*Bài\s*(\d+)\s*\.?\s*</b>\s*#iu', $h, $mm)) {
                $cur = (int) $mm[1]; $rest = substr($h, strlen($mm[0]));
                if (dd_norm(strip_tags($rest)) !== '') $them($cur, '<p>' . $rest . '</p>');
                continue;
            }
            if (dd_has_class($el, 'src')) { $cur = null; continue; }
            if ($cur && ($daQua || isset($out[$cur]))) $them($cur, $el->ownerDocument->saveHTML($el));
        }
    }
    return $out;
}

/** Tách đề. Trả ['tieu_de','ma','khoi','mon','nguon','ngay','cau'=>[...],'canh_bao'=>[...]] (cùng cấu trúc bản JS). */
function bg_parse_html(string $html, string $tenFile): array
{
    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="utf-8"?>' . $html, LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();
    $xp = new DOMXPath($doc);
    $flow = $doc->getElementById('flow') ?: ($doc->getElementsByTagName('body')->item(0) ?: $doc->documentElement);
    $details = null;
    foreach ($xp->query('.//details', $flow) as $d) { $details = $d; break; }
    if (!$details) foreach ($xp->query('//details') as $d) { $details = $d; break; }
    $canhBao = [];

    $titleEl = $doc->getElementsByTagName('title')->item(0);
    $h1 = $xp->query('.//h1', $flow)->item(0);
    $tieuDe = dd_norm($titleEl ? $titleEl->textContent : '') ?: dd_norm($h1 ? $h1->textContent : '');
    $nguonTen = preg_replace('/\.html?$/i', '', dd_norm($tenFile));
    $khoi = preg_match('/(?:Toan|Toán|KHTN)\s*(\d{1,2})/iu', $nguonTen . ' ' . $tieuDe, $m) ? 'L' . str_pad($m[1], 2, '0', STR_PAD_LEFT) : '';
    $mon = preg_match('/KHTN|khoa học tự nhiên/iu', $nguonTen . $tieuDe) ? 'KHTN' : 'Toán';
    $ngay = preg_match('/^(\d{4}-\d{2}-\d{2})/', $nguonTen, $m) ? $m[1] : '';

    $nodes = $xp->query(".//h1|.//h2|.//h3|.//p|.//div[contains(concat(' ', normalize-space(@class), ' '), ' q-block ')]", $flow);
    $phan = 'tn'; $tenPhan = ''; $cau = [];
    foreach ($nodes as $el) {
        /** @var DOMElement $el */
        if (dd_ancestor($el, static fn ($p) => $p->tagName === 'details')) continue;
        $laBlock = $el->tagName === 'div';
        if (!$laBlock) {
            if (dd_ancestor($el, static fn ($p) => dd_has_class($p, 'q-block'))) continue;
            $first = dd_elems($el)[0] ?? null;
            $laH = (bool) preg_match('/^h[1-3]$/', $el->tagName);
            if ($laH || ($first && $first->tagName === 'b')) {
                $head = $el->tagName === 'p' ? dd_norm($first ? $first->textContent : '') : dd_norm($el->textContent);
                $lp = dd_phan($head);
                if ($lp && ($laH || preg_match('/^(phần|phan)\s*\d|^[IVX]+\./iu', $head))) {
                    $phan = $lp;
                    $tenPhan = preg_replace('/\.$/', '', preg_replace('/\(.*?\)\s*\.?$/u', '', $head));
                }
            }
            continue;
        }
        $b = dd_first_b($el);
        $t = dd_norm($b ? $b->textContent : $el->textContent);
        if (!preg_match('/^(Câu|Bài)\s*(\d+)\s*[.:]?/iu', $t, $mm)) continue;
        $kieu = mb_strtolower(mb_substr($mm[1], 0, 1)) === 'b' ? 'bai' : 'cau';
        $so = (int) $mm[2];
        $nhan = mb_strtoupper(mb_substr($mm[1], 0, 1)) . mb_strtolower(mb_substr($mm[1], 1)) . ' ' . $so;

        $block = $el->cloneNode(true);
        $lb = dd_first_b($block);
        if ($lb) {
            $par = $lb->parentNode; $par->removeChild($lb);
            if ($par->firstChild && $par->firstChild->nodeType === XML_TEXT_NODE) {
                $par->firstChild->nodeValue = preg_replace('/^\s*[.:]?\s*/u', '', $par->firstChild->nodeValue);
            }
        }
        foreach (iterator_to_array($xp->query(".//*[contains(concat(' ', normalize-space(@class), ' '), ' workspace ') or contains(concat(' ', normalize-space(@class), ' '), ' lines ')]|.//details|.//script", $block)) as $x) {
            $x->parentNode->removeChild($x);
        }
        $optsEl = $xp->query(".//div[contains(concat(' ', normalize-space(@class), ' '), ' opts ')]", $block)->item(0);
        $opts = $optsEl ? dd_elems($optsEl) : [];
        $loai = ($phan === 'tl' || $kieu === 'bai') ? 'tu_luan' : ($phan === 'ds' ? 'dung_sai' : ($phan === 'tln' ? 'tra_loi_ngan' : 'abcd'));
        $luaChon = [];
        $allDS = $opts && count(array_filter($opts, static fn ($o) => preg_match('/^[☐□]\s*[ĐS]\s*$/u', dd_norm($o->textContent)))) === count($opts);
        $allABCD = $opts && count(array_filter($opts, static fn ($o) => preg_match('/^[A-D]\s*[.)]/u', dd_norm($o->textContent)))) === count($opts);
        if ($allDS) { $loai = 'dung_sai'; $optsEl->parentNode->removeChild($optsEl); }
        elseif ($allABCD && $loai !== 'tu_luan') {
            foreach ($opts as $o) {
                $k = mb_substr(dd_norm($o->textContent), 0, 1);
                $ob = dd_first_b($o);
                if ($ob && preg_match('/^[A-D]\s*[.)]?$/u', dd_norm($ob->textContent))) $ob->parentNode->removeChild($ob);
                $luaChon[] = ['k' => $k, 'html' => trim(preg_replace('/^\s*[A-D]\s*[.)]\s*/u', '', dd_inner($o)))];
            }
            $loai = 'abcd';
            $optsEl->parentNode->removeChild($optsEl);
        }
        $deHtml = trim(dd_inner($block));
        $deHtml = preg_replace('#(Trả lời|Đáp số)?\s*:?\s*…{3,}\s*(?=</p>)#u', '', $deHtml);
        $cau[] = ['id' => ($loai === 'tu_luan' ? 'tl' : 'tn') . $so, 'so' => $nhan, 'so_n' => $so, 'phan' => $tenPhan, 'phan_ma' => $phan,
                  'loai' => $loai, 'de_html' => $deHtml, 'lua_chon' => $luaChon, 'co_hinh' => (bool) preg_match('/<svg|<img/i', $deHtml),
                  'dap_an' => '', 'dap_an_html' => '', 'ghi_chu_html' => ''];
    }

    $bang = dd_bang_dap_an($details);
    $ghiChu = dd_ghi_chu_tn($details);
    $tl = dd_loi_giai_tl($details);
    foreach ($cau as &$c) {
        if ($c['loai'] === 'tu_luan') {
            $c['dap_an_html'] = $tl[$c['so_n']] ?? '';
            if ($c['dap_an_html'] === '') $canhBao[] = $c['so'] . ' (tự luận): chưa tìm thấy lời giải trong phần đáp án.';
            continue;
        }
        $a = $bang[$c['so_n']] ?? null;
        if ($a) {
            if ($c['loai'] === 'abcd') $c['dap_an'] = substr(preg_replace('/[^A-D]/', '', mb_strtoupper($a['text'])), 0, 1);
            elseif ($c['loai'] === 'dung_sai') $c['dap_an'] = preg_match('/^s/iu', $a['text']) ? 'Sai' : (preg_match('/^(đ|d)/iu', $a['text']) ? 'Đúng' : $a['text']);
            else { $c['dap_an'] = $a['text']; $c['dap_an_html'] = $a['html']; }
        }
        if (isset($ghiChu[$c['so_n']])) $c['ghi_chu_html'] = $ghiChu[$c['so_n']];
        if ($c['dap_an'] === '') $canhBao[] = $c['so'] . ': chưa tìm thấy đáp án trong bảng đáp án.';
        if ($c['loai'] === 'abcd' && count($c['lua_chon']) !== 4) $canhBao[] = $c['so'] . ': có ' . count($c['lua_chon']) . ' lựa chọn (thường là 4).';
    }
    unset($c);
    if (!$cau) $canhBao[] = 'Không tìm thấy câu hỏi nào (khối q-block). File có thể không theo khuôn đề A4.';
    if (!$details) $canhBao[] = 'Không thấy phần đáp án (khối <details>) trong file.';

    $tieuDe = preg_replace('/\s*[-–—]\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/u', '', $tieuDe) ?: $nguonTen;
    $ma = substr(trim(preg_replace('/[^a-z0-9]+/', '-', dd_khong_dau($nguonTen !== '' ? $nguonTen : $tieuDe)), '-'), 0, 90);
    return ['tieu_de' => $tieuDe, 'ma' => $ma, 'khoi' => $khoi, 'mon' => $mon, 'nguon' => $tenFile, 'ngay' => $ngay, 'cau' => $cau, 'canh_bao' => $canhBao];
}
