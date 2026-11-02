/**
 * doc-de-drive.js — Tách file đề .html (Google Drive / DAYKEM, khuôn A4 của ThS. Đinh Quốc Tuấn)
 * thành danh sách câu hỏi cho bài giảng trình chiếu.
 *
 * Khuôn đề nhận biết:
 *   <div class="q-block"><p><b>Câu 1.</b> nội dung…</p><div class="opts"><div><b>A.</b> …</div>…</div></div>
 *   Phần (h2/p in đậm): "I. TRẮC NGHIỆM", "Phần 2. … đúng sai", "Phần 3. … trả lời ngắn", "II. TỰ LUẬN"
 *   Đáp án: <details class="print-hidden"> có bảng (Câu | 1 2 3 …  /  ĐA | C B …), đoạn ghi chú "Câu 6: …"/"C6: …",
 *           lời giải tự luận theo "Bài N." hoặc "Câu N." (khi đề đánh số tự luận bằng "Câu").
 * Trả về { tieu_de, khoi, mon, cau: [...], canh_bao: [...] }.
 */
(function (root) {
  'use strict';

  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const khongDau = (s) => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

  function nhanCau(el) {
    const b = el.querySelector('b, strong');
    const t = norm((b ? b.textContent : el.textContent) || '');
    const m = t.match(/^(Câu|Bài)\s*(\d+)\s*[.:]?/i);
    return m ? { kieu: m[1].toLowerCase().startsWith('b') ? 'bai' : 'cau', so: parseInt(m[2], 10), nhan: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + ' ' + m[2], b } : null;
  }

  /** Bỏ phần nhãn "Câu 1." ở đầu đoạn đầu tiên. */
  function boNhan(block, b) {
    if (!b) return;
    const p = b.parentNode;
    b.remove();
    if (p && p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s*[.:]?\s*/, '').replace(/^\((Đúng\s*\/\s*Sai|Đúng\s*[–-]\s*Sai|Đ\s*\/\s*S)\)\s*[.:]?\s*/i, '');
  }

  function phanLoaiPhan(text) {
    const t = khongDau(text);
    if (/tu luan/.test(t)) return 'tl';
    if (/dung\s*sai/.test(t)) return 'ds';
    if (/tra loi ngan|dien dap so|dien ket qua/.test(t)) return 'tln';
    if (/trac nghiem/.test(t)) return 'tn';
    return null;
  }

  function docBangDapAn(details) {
    const map = {};
    if (!details) return map;
    details.querySelectorAll('table').forEach((tb) => {
      const rows = [...tb.querySelectorAll('tr')];
      for (let i = 0; i + 1 < rows.length; i++) {
        const head = [...rows[i].children];
        const ans = [...rows[i + 1].children];
        if (!head.length || !/^câu$/i.test(norm(head[0].textContent))) continue;
        if (!/(đa|đáp án|da|dap an)/i.test(khongDau(ans[0] && ans[0].textContent))) continue;
        head.slice(1).forEach((th, j) => {
          const n = parseInt(norm(th.textContent), 10);
          const cell = ans[j + 1];
          if (n && cell) map[n] = { text: norm(cell.textContent), html: cell.innerHTML.trim() };
        });
      }
    });
    return map;
  }

  /** Đáp án trắc nghiệm viết thành dòng: "Trắc nghiệm: 1-C, 2-A, 3-C …" (đề Toán 10). */
  function docDongDapAn(details) {
    const map = {};
    if (!details) return map;
    details.querySelectorAll('p, li, div').forEach((p) => {
      const t = norm(p.textContent);
      if (!/(trắc nghiệm|đáp án)\s*:/i.test(t)) return;
      const re = /(?:^|[\s,;:])(\d{1,2})\s*[-–.:)]\s*([A-D])(?![A-Za-z])/g;
      let m, n = 0;
      const tam = {};
      while ((m = re.exec(t))) { tam[parseInt(m[1], 10)] = m[2]; n++; }
      if (n >= 2) Object.keys(tam).forEach((k) => { if (!map[k]) map[k] = tam[k]; });
    });
    return map;
  }

  /** Lời giải trắc nghiệm dạng "<b>Giải TN:</b> 1) … 2) …". */
  function docGiaiTNSo(details) {
    const out = {};
    if (!details) return out;
    details.querySelectorAll(':scope > p').forEach((p) => {
      const html = p.innerHTML.trim();
      const m0 = html.match(/^<b>\s*Giải\s*(TN|trắc nghiệm)\s*:?\s*<\/b>\s*/i);
      if (!m0) return;
      const body = html.slice(m0[0].length);
      const re = /(?:^|\s)(\d{1,2})\)\s/g;
      const idx = [];
      let m;
      while ((m = re.exec(body))) idx.push({ n: parseInt(m[1], 10), start: m.index, bodyStart: re.lastIndex });
      idx.forEach((it, k) => {
        const seg = body.slice(it.bodyStart, k + 1 < idx.length ? idx[k + 1].start : body.length).trim().replace(/[\s.;]+$/, '');
        if (seg && !out[it.n]) out[it.n] = seg + '.';
      });
    });
    return out;
  }

  /** Câu Đúng/Sai 4 ý: "<b>Câu 13:</b> a) Đúng; b) … → Đ, Đ, S, Đ." */
  function docDapAnDS4(details) {
    const out = {};
    if (!details) return out;
    details.querySelectorAll(':scope > p').forEach((p) => {
      const html = p.innerHTML.trim();
      const m = html.match(/^<b>\s*Câu\s*(\d+)\s*[:.]\s*<\/b>\s*/i);
      if (!m) return;
      const rest = html.slice(m[0].length);
      const t = norm(p.textContent);
      let seq = (t.match(/(?:→|=>)\s*([ĐĐSs](?:\s*[,;]\s*[ĐĐSs]){1,5})\s*\.?\s*$/) || [])[1];
      if (!seq) {
        const ys = [...t.matchAll(/(?:^|\s|;)([a-d])\)\s*(Đúng|Sai)/gi)].map((x) => (/^s/i.test(x[2]) ? 'S' : 'Đ'));
        if (ys.length >= 2) seq = ys.join(',');
      }
      out[parseInt(m[1], 10)] = { html: rest, seq: seq ? seq.toUpperCase().replace(/\s+/g, '').replace(/;/g, ',') : '' };
    });
    return out;
  }

  /** Ghi chú trắc nghiệm dạng "C1: …. C6: …" hoặc "Câu 6: …" trong một đoạn. */
  function docGhiChuTN(details) {
    const out = {};
    if (!details) return out;
    details.querySelectorAll(':scope > p, :scope > div > p').forEach((p) => {
      const html = p.innerHTML;
      const re = /(?:^|[.;]\s*|<i>\s*|<\/i>\s*)(?:Câu\s*|C)(\d{1,2})\s*:/g;
      const idx = [];
      let m;
      while ((m = re.exec(html))) idx.push({ n: parseInt(m[1], 10), start: m.index, bodyStart: re.lastIndex });
      if (idx.length < 1 || /<b>\s*(Câu|Bài)\s*\d+\s*\.?\s*<\/b>/i.test(html.slice(0, 40))) return;
      idx.forEach((it, k) => {
        const end = k + 1 < idx.length ? idx[k + 1].start : html.length;
        let seg = html.slice(it.bodyStart, end).replace(/^\s+|[\s.;]+$/g, '').replace(/<\/?i>/g, '');
        if (seg && !out[it.n]) out[it.n] = seg + '.';
      });
    });
    return out;
  }

  /** Lời giải tự luận: khối bắt đầu bằng <b>Bài N.</b> hoặc <li><b>Câu N.</b>… sau phần trắc nghiệm. */
  function docLoiGiaiTL(details) {
    const out = {};
    if (!details) return out;
    let cur = null;
    let daQuaTuLuan = false;
    const them = (n, html) => { out[n] = (out[n] ? out[n] + '' : '') + html; };
    [...details.children].forEach((el) => {
      if (el.tagName === 'SUMMARY' || el.tagName === 'TABLE') return;
      const txt = khongDau(el.textContent);
      if (/^(ii\.\s*)?tu luan/.test(txt)) { daQuaTuLuan = true; cur = null; return; }
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        const lis = [...el.children];
        const coNhan = lis.some((li) => /^<b>\s*(Câu|Bài)\s*\d+/i.test(li.innerHTML.trim()));
        if (coNhan) {
          lis.forEach((li) => {
            const m = li.innerHTML.trim().match(/^<b>\s*(?:Câu|Bài)\s*(\d+)\s*\.?\s*<\/b>\s*/i);
            if (m) { cur = parseInt(m[1], 10); them(cur, '<p>' + li.innerHTML.trim().slice(m[0].length) + '</p>'); }
            else if (cur) them(cur, '<p>' + li.innerHTML + '</p>');
          });
        } else if (cur) them(cur, el.outerHTML);
        else if (el.tagName === 'OL' && lis.length >= 2 && !Object.keys(out).length) {
          // <ol> không nhãn: mục thứ i là lời giải Bài i
          const batDau = parseInt(el.getAttribute('start') || '1', 10) || 1;
          lis.forEach((li, i) => them(batDau + i, '<p>' + li.innerHTML.trim() + '</p>'));
        }
        return;
      }
      if (el.tagName === 'P') {
        const m = el.innerHTML.trim().match(/^<b>\s*Bài\s*(\d+)\s*\.?\s*<\/b>\s*/i);
        if (m) { cur = parseInt(m[1], 10); const rest = el.innerHTML.trim().slice(m[0].length); if (norm(rest)) them(cur, '<p>' + rest + '</p>'); return; }
        if (el.classList.contains('src')) { cur = null; return; }
        if (cur && (daQuaTuLuan || out[cur])) them(cur, el.outerHTML);
      }
    });
    return out;
  }

  function parse(htmlText, tenFile) {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    const flow = doc.getElementById('flow') || doc.body;
    const details = flow.querySelector('details') || doc.querySelector('details');
    const canhBao = [];

    // Thông tin chung
    const h1 = flow.querySelector('h1');
    const deHead = flow.querySelector('.dehead');
    let tieuDe = norm((doc.title || '') || (h1 && h1.textContent));
    const nguonTen = norm(tenFile || '').replace(/\.html?$/i, '');
    const mKhoi = (nguonTen + ' ' + tieuDe).match(/(?:Toan|Toán|KHTN)\s*(\d{1,2})/i);
    const khoi = mKhoi ? 'L' + String(mKhoi[1]).padStart(2, '0') : '';
    const mon = /KHTN|khoa học tự nhiên/i.test(nguonTen + tieuDe) ? 'KHTN' : 'Toán';
    const ngay = (nguonTen.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || '';

    // Duyệt theo thứ tự tài liệu để biết câu thuộc phần nào
    const all = [...flow.querySelectorAll('h1, h2, h3, p, div.q-block')].filter((el) => !el.closest('details') && !(el.tagName !== 'DIV' && el.closest('.q-block')));
    let phan = 'tn';
    let tenPhan = '';
    const cau = [];
    all.forEach((el) => {
      if (el.tagName !== 'DIV') {
        if (/^H[1-3]$/.test(el.tagName) || el.querySelector(':scope > b:first-child')) {
          const head = el.tagName === 'P' ? norm(el.querySelector('b').textContent) : norm(el.textContent);
          const lp = phanLoaiPhan(head);
          if (lp && (/^H/.test(el.tagName) || /^(phần|phan)\s*\d|^[IVX]+\./i.test(head))) { phan = lp; tenPhan = head.replace(/\(.*?\)\s*\.?$/, '').replace(/\.$/, ''); }
        }
        return;
      }
      const nhan = nhanCau(el);
      if (!nhan) return;                      // ví dụ khối "Bảng trả lời trắc nghiệm"
      const block = el.cloneNode(true);
      boNhan(block, block.querySelector('b, strong'));
      block.querySelectorAll('.workspace, .lines, details, script').forEach((x) => x.remove());

      const optsEl = block.querySelector('.opts');
      const opts = optsEl ? [...optsEl.children] : [];
      let loai = phan === 'tl' || nhan.kieu === 'bai' ? 'tu_luan' : phan === 'ds' ? 'dung_sai' : phan === 'tln' ? 'tra_loi_ngan' : 'abcd';
      const luaChon = [];
      const nhanDS = /đúng\s*\/\s*sai|đúng\s*[–-]\s*sai|\(đ\s*\/\s*s\)/i.test(norm(el.querySelector('p') ? el.querySelector('p').textContent : '').slice(0, 40));
      if (loai !== 'tu_luan' && (nhanDS || phan === 'ds') && opts.length >= 2 && opts.every((o) => /^[a-d]\s*\)/.test(norm(o.textContent)))) {
        opts.forEach((o) => {
          const b = o.querySelector('b, strong');
          const k = norm(o.textContent).charAt(0);
          if (b && /^[a-d]\s*\)?$/.test(norm(b.textContent))) b.remove();
          luaChon.push({ k, html: o.innerHTML.replace(/^\s*[a-d]\s*\)\s*/, '').trim() });
        });
        loai = 'dung_sai_4';
        optsEl.remove();
      } else if (opts.length && opts.every((o) => /^[☐□]\s*[ĐS]\s*$/.test(norm(o.textContent)))) {
        loai = 'dung_sai';
        optsEl.remove();
      } else if (opts.length && loai !== 'tu_luan' && opts.every((o) => /^[A-D]\s*[.)]/.test(norm(o.textContent)))) {
        opts.forEach((o) => {
          const b = o.querySelector('b, strong');
          const k = norm(o.textContent).charAt(0);
          if (b && /^[A-D]\s*[.)]?$/.test(norm(b.textContent))) b.remove();
          luaChon.push({ k, html: o.innerHTML.replace(/^\s*[A-D]\s*[.)]\s*/, '').trim() });
        });
        loai = 'abcd';
        optsEl.remove();
      }
      // Ô trống "……" của câu trả lời ngắn
      block.querySelectorAll('p').forEach((p) => { p.innerHTML = p.innerHTML.replace(/(Trả lời|Đáp số)?\s*:?\s*…{3,}\s*$/u, '').replace(/\s*…{3,}\s*$/u, ''); });

      const deHtml = block.innerHTML.trim();
      const id = (loai === 'tu_luan' ? 'tl' : 'tn') + nhan.so;
      cau.push({ id, so: nhan.nhan, so_n: nhan.so, phan: tenPhan, phan_ma: phan, loai, de_html: deHtml, lua_chon: luaChon,
                 co_hinh: /<svg|<img/i.test(deHtml), dap_an: '', dap_an_html: '', ghi_chu_html: '' });
    });

    // Ghép đáp án
    const bang = docBangDapAn(details);
    const ghiChu = docGhiChuTN(details);
    const loiGiaiTL = docLoiGiaiTL(details);
    const dongDA = docDongDapAn(details);
    const giaiSo = docGiaiTNSo(details);
    const ds4 = docDapAnDS4(details);
    cau.forEach((c) => {
      if (c.loai === 'dung_sai_4') {
        const k = ds4[c.so_n];
        if (k) { c.dap_an = k.seq; c.ghi_chu_html = k.html; }
        if (!c.dap_an) canhBao.push(c.so + ' (Đúng/Sai 4 ý): chưa tìm thấy đáp án.');
        return;
      }
      if (c.loai === 'tu_luan') {
        c.dap_an_html = loiGiaiTL[c.so_n] || '';
        if (!c.dap_an_html) canhBao.push(c.so + ' (tự luận): chưa tìm thấy lời giải trong phần đáp án.');
        return;
      }
      const a = bang[c.so_n];
      if (a) {
        if (c.loai === 'abcd') c.dap_an = a.text.toUpperCase().replace(/[^A-D]/g, '').slice(0, 1);
        else if (c.loai === 'dung_sai') c.dap_an = /^s/i.test(a.text) ? 'Sai' : /^(đ|d)/i.test(a.text) ? 'Đúng' : a.text;
        else { c.dap_an = a.text; c.dap_an_html = a.html; }
      }
      if (!c.dap_an && c.loai === 'abcd' && dongDA[c.so_n]) c.dap_an = dongDA[c.so_n];
      if (ghiChu[c.so_n]) c.ghi_chu_html = ghiChu[c.so_n];
      else if (giaiSo[c.so_n] && c.loai === 'abcd') c.ghi_chu_html = giaiSo[c.so_n];
      if (!c.dap_an) canhBao.push(c.so + ': chưa tìm thấy đáp án trong bảng đáp án.');
      if (c.loai === 'abcd' && c.lua_chon.length !== 4) canhBao.push(c.so + ': có ' + c.lua_chon.length + ' lựa chọn (thường là 4).');
    });
    if (!cau.length) canhBao.push('Không tìm thấy câu hỏi nào (khối q-block). File có thể không theo khuôn đề A4.');
    if (!details) canhBao.push('Không thấy phần đáp án (khối <details>) trong file.');

    // Tên bộ: ưu tiên tiêu đề trang, bỏ phần ngày ở cuối
    tieuDe = tieuDe.replace(/\s*[-–—]\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/, '') || nguonTen;
    const ma = khongDau(nguonTen || tieuDe).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
    return { tieu_de: tieuDe, ma, khoi, mon, nguon: tenFile || '', ngay, cau, canh_bao: canhBao };
  }

  const api = { parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DocDeDrive = api;
})(typeof window !== 'undefined' ? window : globalThis);
