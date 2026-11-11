/**
 * trinh-chieu.js — Trình chiếu bộ bài giảng: mỗi câu 4 bước — Đề → Gợi ý công thức (hiện thêm ngay trên
 * slide Đề, không đổi slide, kiểu hiệu ứng "Appear" của PowerPoint) → Đáp án → Giải thích từng bước.
 * Chữ trên slide tự co giãn: ước lượng cỡ chữ theo số từ, rồi tìm cỡ LỚN NHẤT vẫn vừa khung (tìm nhị phân),
 * nên câu ngắn chữ rất to, câu dài tự nhỏ lại mà vẫn lấp đầy khung trình chiếu.
 * Phím: → / Space / PageDown: tiếp · ← / PageUp: lùi · 1 2 3 4: Đề / Gợi ý công thức / Đáp án / Giải thích · M: mục lục · F: toàn màn hình.
 */
(function () {
  'use strict';
  const W = 1600, H = 900;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = new URLSearchParams(location.search);
  const SEN = 'assets/logo-sen.svg';

  let bo = null, slides = [], cur = 0, laGV = false, coGemini = false;
  /* Bước hiện thêm trong CÙNG một slide (hiệu ứng xuất hiện kiểu PowerPoint): slide Đề có bước 1 = hiện gợi ý công thức */
  let buoc = 0;
  /* Tương tác kiểu Slido: phòng (mã 5 ký tự), khoá bình chọn, bật/tắt tương tác */
  let phong = '', khoa = false, hoiKq = null, lanBao = 0;
  let tuongTac = (() => { try { return localStorage.getItem('tc_tuong_tac') !== '0'; } catch (e) { return true; } })();

  /* ---------- Vá công thức hệ thống trả về bị hỏng dấu \ (\circ thành ký tự lạ, \overrightarrow mất \) ---------- */
  const LENH = ['overrightarrow', 'Leftrightarrow', 'rightarrow', 'Rightarrow', 'leftarrow', 'Leftarrow', 'overline', 'setminus', 'widehat',
    'mathbb', 'forall', 'exists', 'dfrac', 'infty', 'times', 'frac', 'sqrt', 'cdot', 'circ', 'perp', 'vec', 'cap', 'cup', 'leq', 'geq', 'neq',
    'sin', 'cos', 'tan', 'le', 'ge', 'ne', 'in', 'pi'];
  /** Tách một dãy chữ thành các lệnh LaTeX đã biết (cdotoverrightarrow → cdot + overrightarrow); không tách được → null. */
  function tachLenh(w) {
    if (!w) return [];
    for (const l of LENH) { if (w.startsWith(l)) { const r = tachLenh(w.slice(l.length)); if (r) return [l, ...r]; } }
    return null;
  }
  function suaTex(s) {
    if (!s) return s;
    let t = String(s).replace(/\u0008\{?(circ|frac|dfrac|beta|bar)\}?/g, '\\$1').replace(/\u0008/g, '\\b').replace(/\u000c/g, '\\f')
      .replace(/\t(?=(?:imes|ext|an|heta|au|o|riangle|frac|op|ilde)(?![a-z]))/g, '\\t').replace(/\r(?=(?:ho|ight|angle|m|ceil|floor)(?![a-z]))/g, '\\r')
      .replace(/\t/g, ' ').replace(/\r/g, '')
      .replace(/\n(?=(?:eq|abla|otin|ot|eg|e|leq|geq)(?![a-z]))/g, '\\n');
    // Lệnh bị mất dấu \ (hệ thống trả "overrightarrow{AB}cdot…"): chỉ sửa dãy chữ ≥ 4 ký tự tách trọn được thành lệnh đã biết
    t = t.replace(/(^|[^\\A-Za-z])([A-Za-z]{4,})(?=[^A-Za-z]|$)/g, (m, a, w) => { const p = tachLenh(w); return p ? a + p.map((x) => '\\' + x).join('') : m; });
    t = t.replace(/(^|[^\\A-Za-z])vec(?=\{)/g, '$1\\vec');
    // Ký hiệu độ viết sai (^\rho, ^\text{o}, ^o) → ^\circ
    t = t.replace(/\^\s*(?:\{\s*)?(?:\\rho|\\text\{\s*o\s*\}|\\mathrm\{\s*o\s*\}|o(?![A-Za-z])|°)(?:\s*\})?/g, '^\\circ');
    // Có lệnh mà không nằm trong $…$ → bọc từng cụm công thức (không bọc cả câu chữ)
    if (/\\[A-Za-z]/.test(t) && !/\$|\\\(|\\\[/.test(t)) t = t.replace(/[^\s]*\\[A-Za-z][^\s]*/g, (m) => { const k = m.match(/[,.;:]+$/); const c = k ? m.slice(0, -k[0].length) : m; return '$' + c + '$' + (k ? k[0] : ''); });
    return t;
  }
  const escTex = (s) => esc(suaTex(s));

  /* ---------- Bình chọn trực tiếp (giống Slido) ---------- */
  const LOAI_BC = ['abcd', 'dung_sai', 'dung_sai_4', 'tra_loi_ngan'];
  const coBinhChon = (c) => tuongTac && c && LOAI_BC.includes(c.loai);
  const linkHs = () => location.origin + location.pathname.replace(/[^/]*$/, '') + 'hs.html?p=' + phong;
  const linkHsNgan = () => location.host + location.pathname.replace(/[^/]*$/, '') + 'hs.html';
  function qrSvg(url) {
    try { const q = qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
    catch (e) { return ''; }
  }
  /** Đáp án đúng ở dạng giống câu trả lời học sinh (A / D / S / DSDD / chữ). */
  function dapAnChuan(c) {
    const da = String(c.dap_an || '');
    if (c.loai === 'abcd') return (da || ((c.giai && c.giai.dap_an_ngan || '').match(/^\s*([A-D])[.)]/) || [])[1] || '').toUpperCase();
    if (c.loai === 'dung_sai') return da ? (/^s/i.test(da) ? 'S' : 'D') : '';
    if (c.loai === 'dung_sai_4') { const v = da.split(/\s*[,;]\s*/).map((x) => /^s/i.test(x) ? 'S' : /^(đ|d)/i.test(x) ? 'D' : '?'); return v.includes('?') ? '' : v.join(''); }
    if (c.loai === 'tra_loi_ngan') { const d = document.createElement('div'); d.innerHTML = c.dap_an_html || esc(da); return d.textContent.trim(); }
    return '';
  }
  const chuanSo = (t) => String(t || '').toLowerCase().replace(/\s+/g, '').replace(/,/g, '.').replace(/^\$|\$$/g, '');
  /** Khung bình chọn bên phải slide Đề / Đáp án. */
  function khungSlido(c, loai) {
    const chot = loai === 'dap-an';
    return `<aside class="slido ${chot ? 'chot' : ''}">
      <div class="sl-dau"><span class="pill ${chot || khoa ? '' : 'song'}" data-pill>${chot ? '🔒 Đã chốt đáp án' : khoa ? '🔒 Đã khoá bình chọn' : '<i></i> Đang bình chọn'}</span>
        <b class="sl-tong" data-tong>0 bạn</b></div>
      <div class="sl-cot" data-kq>${veKq(c, { tong: 0, dem: {}, tung_y: [] }, chot)}</div>
      ${chot ? '' : `<div class="sl-ten" data-ten></div>
      <div class="sl-vao"><span class="qr" data-qr>${phong ? qrSvg(linkHs()) : ''}</span>
        <div><small>Vào bình chọn</small><b>${esc(linkHsNgan())}</b><small>Mã phòng</small><b class="ma" data-ma>${phong || '·····'}</b></div></div>`}
    </aside>`;
  }
  function thanh(nhan, n, tong, dung) {
    const pct = tong ? Math.round((n / tong) * 100) : 0;
    return `<div class="sl-hang ${dung ? 'dung' : ''}"><div class="sl-nhan"><span>${nhan}</span><span>${pct}% <small>(${n})</small></span></div>
      <div class="sl-ray"><i style="width:${pct}%"></i></div></div>`;
  }
  function veKq(c, kq, chot) {
    const tong = kq.tong || 0, dem = kq.dem || {}, da = chot ? dapAnChuan(c) : '';
    if (c.loai === 'abcd') return (c.lua_chon.length ? c.lua_chon.map((o) => o.k.toUpperCase()) : ['A', 'B', 'C', 'D'])
      .map((k) => thanh(`${chot && k === da ? '✓ ' : ''}Phương án ${k}`, dem[k] || 0, tong, chot && k === da)).join('');
    if (c.loai === 'dung_sai') return [['D', 'Đúng'], ['S', 'Sai']].map(([k, t]) => thanh(`${chot && k === da ? '✓ ' : ''}${t}`, dem[k] || 0, tong, chot && k === da)).join('');
    if (c.loai === 'dung_sai_4') return c.lua_chon.map((o, i) => {
      const y = (kq.tung_y || [])[i] || { D: 0, S: 0 }, n = (y.D || 0) + (y.S || 0), pd = n ? Math.round((y.D / n) * 100) : 0;
      const dungY = chot && da ? (da[i] === 'D' ? 'Đúng' : 'Sai') : '';
      return `<div class="sl-hang ds"><div class="sl-nhan"><span>Ý ${esc(o.k)}) ${dungY ? `<em class="${da[i] === 'D' ? 'd' : 's'}">${dungY}</em>` : ''}</span><span>${pd}% Đ · ${n ? 100 - pd : 0}% S</span></div>
        <div class="sl-ray ds"><i style="width:${pd}%"></i></div></div>`;
    }).join('');
    // Trả lời ngắn: các đáp số học sinh gửi nhiều nhất
    const ds = Object.entries(dem).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!ds.length) return '<p class="sl-trong">Chưa có câu trả lời</p>';
    return ds.map(([t, n]) => thanh(esc(t), n, tong, chot && da && chuanSo(t) === chuanSo(da))).join('');
  }
  async function goiPhong(than) {
    const r = await fetch('api.php?action=bg_phong_dat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(than) });
    return r.json();
  }
  /** Báo máy chủ slide đang chiếu → điện thoại học sinh tự chuyển theo. */
  async function baoPhong(s) {
    if (!tuongTac) return;
    const lan = ++lanBao;
    try {
      const d = await goiPhong({ bo_id: bo.bo_id, cau: s.c ? bo.cau.indexOf(s.c) + 1 : 0, loai: s.loai });
      if (d.status !== 'success' || lan !== lanBao) return;
      const moi = !phong;
      phong = d.data.ma_phong; khoa = !!d.data.khoa;
      if (moi) $('khung').querySelectorAll('[data-qr]').forEach((x) => { x.innerHTML = qrSvg(linkHs()); });
      $('khung').querySelectorAll('[data-ma]').forEach((x) => { x.textContent = phong; });
      nutKhoa();
    } catch (e) {}
  }
  function nutKhoa() {
    const s = slides[cur], b = $('btn-khoa');
    if (!b) return;
    b.hidden = !(s && s.loai === 'de' && coBinhChon(s.c));
    b.textContent = khoa ? '🔓 Mở bình chọn' : '🔒 Khoá';
    b.classList.toggle('chinh', khoa);
    $('khung').querySelectorAll('[data-pill]').forEach((x) => {
      if (s.loai !== 'de') return;
      x.classList.toggle('song', !khoa);
      x.innerHTML = khoa ? '🔒 Đã khoá bình chọn' : '<i></i> Đang bình chọn';
    });
  }
  async function doiKhoa() {
    const s = slides[cur];
    if (!(s && s.loai === 'de' && coBinhChon(s.c))) return;
    khoa = !khoa; nutKhoa();
    try { await goiPhong({ bo_id: bo.bo_id, cau: bo.cau.indexOf(s.c) + 1, loai: 'de', khoa: khoa ? 1 : 0 }); } catch (e) {}
  }
  function theoDoiKq(s) {
    clearInterval(hoiKq); hoiKq = null;
    if (!(s.c && coBinhChon(s.c) && (s.loai === 'de' || s.loai === 'dap-an'))) return;
    const cau = bo.cau.indexOf(s.c) + 1, chot = s.loai === 'dap-an';
    const lay = async () => {
      try {
        const d = await fetch(`api.php?action=bg_phong_kq&bo_id=${bo.bo_id}&cau=${cau}&_=${Date.now()}`).then((r) => r.json());
        if (d.status !== 'success' || slides[cur] !== s) return;
        const k = d.data, el = $('khung');
        const t = el.querySelector('[data-tong]'); if (t) t.textContent = `${k.tong} bạn`;
        const q = el.querySelector('[data-kq]'); if (q) q.innerHTML = veKq(s.c, k, chot);
        const n = el.querySelector('[data-ten]'); if (n) n.innerHTML = (k.gan_day || []).slice(0, 8).map((x) => `<span>${esc(x.ten)}</span>`).join('');
      } catch (e) {}
    };
    lay(); hoiKq = setInterval(lay, 2000);
  }
  function doiTuongTac() {
    tuongTac = !tuongTac;
    try { localStorage.setItem('tc_tuong_tac', tuongTac ? '1' : '0'); } catch (e) {}
    $('btn-tt').classList.toggle('chinh', tuongTac);
    thongBao(tuongTac ? 'Đã bật bình chọn trên điện thoại học sinh.' : 'Đã tắt bình chọn — chỉ trình chiếu.');
    ve(cur, buoc);
  }

  /* ---------- Sân khấu 16:9 co theo cửa sổ ---------- */
  function scale() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    $('khung').style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  /* ---------- Co giãn chữ ---------- */
  function soTu(el) { return (el.textContent || '').trim().split(/\s+/).filter(Boolean).length; }
  function tranTheoSoTu(n) {
    // Ước lượng ban đầu theo số từ (câu càng ngắn, chữ càng to); sau đó tìm nhị phân để lấp đầy khung.
    if (n <= 6) return 132; if (n <= 12) return 112; if (n <= 22) return 96; if (n <= 40) return 80;
    if (n <= 70) return 66; if (n <= 110) return 56; return 48;
  }
  // Vừa khung = không tràn khung VÀ không ô phương án / đáp án nào bị tràn (công thức MathJax không xuống dòng,
  // tràn ra ngoài ô thì chồng lên ô bên cạnh mà khung ngoài không phát hiện được).
  function oTran(noi) {
    return [...noi.querySelectorAll('.lc .o, .da-lon')].some((o) => o.scrollWidth > o.clientWidth + 1);
  }
  function vua(box, noi) { return noi.scrollHeight <= box.clientHeight + 1 && noi.scrollWidth <= box.clientWidth + 1 && !oTran(noi); }
  function fit(box) {
    const noi = box.firstElementChild;
    if (!noi) return;
    let hi = tranTheoSoTu(soTu(noi)), lo = 18;
    box.style.fontSize = hi + 'px';
    box.style.setProperty('--co', hi + 'px');
    if (vua(box, noi)) return;
    for (let i = 0; i < 9 && hi - lo > 1; i++) {
      const mid = Math.floor((lo + hi) / 2);
      box.style.fontSize = mid + 'px';
      box.style.setProperty('--co', mid + 'px');
      if (vua(box, noi)) lo = mid; else hi = mid;
    }
    box.style.fontSize = lo + 'px';
    box.style.setProperty('--co', lo + 'px');
  }
  /* Lựa chọn A–D: số cột ước lượng theo số ký tự chỉ là điểm xuất phát — công thức (vd \mathbb{R}\setminus\{-2;2\})
     đếm ra ít ký tự nhưng vẽ ra rất rộng. Sau khi đã có chữ/công thức thật, thử 4 → 2 → 1 cột (từ mức ước lượng trở xuống)
     và giữ cách xếp cho chữ TO NHẤT mà không ô nào tràn. */
  const COT = ['c4', 'c2', 'c1'];
  function datCot(lc, c) { COT.forEach((x) => lc.classList.remove(x)); lc.classList.add(c); }
  function fitLuaChon(box) {
    const lcs = [...box.querySelectorAll('.lc')];
    if (!lcs.length) return fit(box);
    const batDau = Math.min(...lcs.map((l) => Math.max(0, COT.findIndex((c) => l.classList.contains(c)))));
    let tot = null;
    for (let i = batDau; i < COT.length; i++) {
      lcs.forEach((l) => datCot(l, COT[i]));
      fit(box);
      const co = parseFloat(box.style.fontSize) || 0;
      if (!tot || co > tot.co + 0.5) tot = { i, co };   // ngang nhau thì giữ ít hàng hơn
    }
    lcs.forEach((l) => datCot(l, COT[tot.i]));
    fit(box);
  }
  function fitAll(root) { root.querySelectorAll('.fit').forEach(fitLuaChon); }

  /* ---------- Dựng slide ---------- */
  function top(c, loai) {
    const nhan = loai === 'de' && buoc > 0 ? 'Gợi ý công thức' : { de: 'Đề', 'dap-an': 'Đáp án', giai: 'Giải thích' }[loai];
    const idx = bo.cau.indexOf(c) + 1;
    return `<div class="s-top">
      <span class="sen"><img src="${SEN}" alt=""></span>
      <div class="ten"><b>${esc(bo.tieu_de)}</b><span>ThS. Đinh Quốc Tuấn</span></div>
      <span class="vi-tri">Câu ${idx}/${bo.cau.length}</span>
      <span class="nhan-slide ${loai}">${nhan}</span></div>`;
  }
  function doDai(html) {
    const d = document.createElement('div'); d.innerHTML = html;
    return (d.textContent || '').replace(/\\[a-z]+/gi, 'x').replace(/[{}^_\\()]/g, '').length;
  }
  function cotLuaChon(lc) {
    const m = Math.max(...lc.map((o) => doDai(o.html)));
    return m <= 14 ? 'c4' : m <= 34 ? 'c2' : 'c1';
  }
  function loaiTen(c) {
    return { abcd: 'Trắc nghiệm', dung_sai: 'Đúng hay Sai', dung_sai_4: 'Đúng / Sai từng ý', tra_loi_ngan: 'Trả lời ngắn', tu_luan: 'Tự luận' }[c.loai] || '';
  }
  function deHtml(c) {
    return `<div class="so-cau">${esc(c.so)} <small>${loaiTen(c)}</small></div><div class="de">${c.de_html}</div>`;
  }
  function luaChonHtml(c, hienDapAn) {
    if (c.loai === 'abcd' && c.lua_chon.length) {
      return `<div class="lc ${cotLuaChon(c.lua_chon)}">${c.lua_chon.map((o) => {
        const cls = hienDapAn ? (o.k === c.dap_an ? 'dung' : 'mo') : '';
        return `<div class="o ${cls}"><span class="k">${esc(o.k)}</span><span class="t">${o.html}</span></div>`;
      }).join('')}</div>`;
    }
    if (c.loai === 'dung_sai_4' && c.lua_chon.length) {
      const da = String(c.dap_an || '').split(/\s*[,;]\s*/);
      return `<div class="ds4">${c.lua_chon.map((o, i) => {
        const v = hienDapAn ? (/^s/i.test(da[i] || '') ? 'S' : /^(đ|d)/i.test(da[i] || '') ? 'Đ' : '?') : '';
        const nhan = v === 'S' ? '<span class="dsb sai">Sai</span>' : v === 'Đ' ? '<span class="dsb dung">Đúng</span>' : v ? '<span class="dsb">?</span>' : '<span class="dsb trong">Đ / S</span>';
        return `<div class="r"><b class="y">${esc(o.k)})</b><span class="t">${o.html}</span>${nhan}</div>`;
      }).join('')}</div>`;
    }
    if (c.loai === 'dung_sai' && !hienDapAn) return '<div class="ds"><div class="o">Đúng</div><div class="o">Sai</div></div>';
    if (c.loai === 'tra_loi_ngan' && !hienDapAn) return '<div class="o-trong">Đáp số: <span>&nbsp;</span></div>';
    return '';
  }

  /** Các dòng gợi ý công thức của câu (hệ thống soạn, thầy duyệt); chưa có cong_thuc thì dùng "Cần nhớ". */
  function dsGoiY(c) {
    const g = (c && c.giai) || {};
    const ds = (g.cong_thuc || []).map((x) => String(x || '').trim()).filter(Boolean);
    if (ds.length) return ds;
    return g.kien_thuc ? [String(g.kien_thuc).trim()] : [];
  }
  const coGoiY = (c) => dsGoiY(c).length > 0;
  /** Ô gợi ý công thức: luôn chiếm chỗ sẵn trong khung (để cỡ chữ không nhảy khi hiện), chỉ mờ đi khi chưa tới bước. */
  function goiYHtml(c) {
    const ds = dsGoiY(c);
    if (!ds.length) return '';
    return `<div class="goi-y" data-goi-y><div class="gy-nhan">💡 Công thức dùng cho câu này</div>
      <ul>${ds.map((x) => `<li>${escTex(x)}</li>`).join('')}</ul></div>`;
  }

  function slideDe(c) {
    const sl = coBinhChon(c);
    return `${top(c, 'de')}<div class="s-body ${sl ? 'co-slido' : ''}"><div class="fit"><div>${deHtml(c)}${luaChonHtml(c, false)}${goiYHtml(c)}</div></div>${sl ? khungSlido(c, 'de') : ''}</div>`;
  }

  function slideDapAn(c) {
    let body = '';
    const g = c.giai || {};
    if (c.loai === 'dung_sai_4') {
      body = `<div class="so-cau">${esc(c.so)} <small>Đáp án từng ý</small></div>
        <div class="de" style="font-size:.62em">${c.de_html}</div>${luaChonHtml(c, true)}`;
    } else if (c.loai === 'abcd') {
      // Thiếu đáp án trong file đề → tạm dùng chữ cái đầu đáp án hệ thống (A. / B. …)
      if (!c.dap_an && /^\s*([A-D])[.)]/.test(g.dap_an_ngan || '')) c.dap_an = g.dap_an_ngan.trim().charAt(0);
      const o = c.lua_chon.find((x) => x.k === c.dap_an);
      body = `<div class="so-cau">${esc(c.so)} <small>Đáp án đúng</small></div>
        <div class="da-lon"><span class="k">${esc(c.dap_an || '?')}</span><span class="t">${o ? o.html : escTex(g.dap_an_ngan || '')}</span></div>
        <div class="de" style="font-size:.62em">${c.de_html}</div>${luaChonHtml(c, true).replace('class="lc', 'style="font-size:.7em" class="lc')}`;
    } else if (c.loai === 'dung_sai') {
      const sai = /^s/i.test(c.dap_an);
      body = `<div class="so-cau">${esc(c.so)} <small>Khẳng định này</small></div>
        <div class="de" style="font-size:.7em">${c.de_html}</div>
        <div class="da-chu ${sai ? 'sai' : ''}">${sai ? 'SAI' : 'ĐÚNG'}</div>
        ${c.ghi_chu_html ? `<div class="ly-do"><b>Vì:</b> ${c.ghi_chu_html}</div>` : ''}`;
    } else if (c.loai === 'tra_loi_ngan') {
      body = `<div class="so-cau">${esc(c.so)} <small>Đáp số</small></div>
        <div class="de" style="font-size:.7em">${c.de_html}</div>
        <div class="da-chu">${c.dap_an_html || esc(c.dap_an)}</div>
        ${c.ghi_chu_html ? `<div class="ly-do">${c.ghi_chu_html}</div>` : ''}`;
    } else {
      body = `<div class="so-cau">${esc(c.so)} <small>Đáp án</small></div>
        <div class="loi-giai-tl">${c.dap_an_html || (g.dap_an_ngan ? escTex(g.dap_an_ngan) : '<p class="chua-co">Chưa có đáp án trong file đề.</p>')}</div>`;
    }
    const sl = coBinhChon(c);
    return `${top(c, 'dap-an')}<div class="s-body ${sl ? 'co-slido' : ''}"><div class="fit"><div>${body}</div></div>${sl ? khungSlido(c, 'dap-an') : ''}</div>`;
  }

  function slideGiai(c) {
    const g = c.giai;
    let body;
    if (g && g.cac_buoc && g.cac_buoc.length) {
      body = `<div class="gt-tieu-de">${esc(c.so)} · Giải thích từng bước</div>
        ${g.kien_thuc ? `<div class="can-nho"><b>Cần nhớ:</b> ${escTex(g.kien_thuc)}</div>` : ''}
        <ol class="buoc">${g.cac_buoc.map((b) => `<li><div>${b.tieu_de ? `<b>${escTex(b.tieu_de)}:</b> ` : ''}<span>${escTex(b.noi_dung)}</span></div></li>`).join('')}</ol>
        ${g.loi_thuong_gap ? `<div class="loi-hay-gap"><b>Lỗi hay gặp:</b> ${escTex(g.loi_thuong_gap)}</div>` : ''}`;
    } else {
      const tom = c.ghi_chu_html || (c.loai === 'tu_luan' ? c.dap_an_html : '');
      body = `<div class="gt-tieu-de">${esc(c.so)} · Giải thích</div>
        ${tom ? `<div class="can-nho"><b>Lời giải tóm tắt:</b> ${tom}</div>` : ''}
        <p class="chua-co">Chưa có lời giải từng bước cho câu này.</p>
        ${laGV ? `<button class="btn-gemini" type="button" data-tao="${esc(c.id)}">${coGemini ? 'Tạo lời giải bằng hệ thống' : 'Chưa có khoá API hệ thống (dán ở trang Bài giảng)'}</button>` : ''}`;
    }
    return `${top(c, 'giai')}<div class="s-body"><div class="fit"><div>${body}</div></div></div>`;
  }

  function slideBia() {
    return `<div class="bia">
      <span class="sen-lon"><img src="${SEN}" alt="Logo sen ThS. Đinh Quốc Tuấn"></span>
      <div class="eyebrow">${esc([bo.mon, bo.khoi ? 'Lớp ' + String(bo.khoi).replace(/^L0?/, '') : ''].filter(Boolean).join(' · '))} · ${bo.cau.length} câu</div>
      <h1>${esc(bo.tieu_de)}</h1>
      <div class="tac-gia"><b>ThS. Đinh Quốc Tuấn</b>Kinh nghiệm giảng dạy, hỗ trợ học sinh Toán &amp; Khoa học tự nhiên</div>
      <div class="huong-dan">Mỗi câu 4 bước: Đề → Gợi ý công thức → Đáp án → Giải thích từng bước · Phím → để bắt đầu</div>
      ${tuongTac ? `<div class="bia-vao"><span class="qr" data-qr>${phong ? qrSvg(linkHs()) : ''}</span>
        <div><small>Học sinh quét mã hoặc vào</small><b>${esc(linkHsNgan())}</b><small>rồi nhập mã phòng</small><b class="ma" data-ma>${phong || '·····'}</b></div></div>` : ''}</div>`;
  }

  function dungDanhSach() {
    slides = [{ loai: 'bia' }];
    bo.cau.forEach((c) => { slides.push({ loai: 'de', c }, { loai: 'dap-an', c }, { loai: 'giai', c }); });
  }

  /** Số bước hiện thêm của một slide (0 = không có bước nào ngoài nội dung chính). */
  function soBuoc(s) { return s && s.loai === 'de' && coGoiY(s.c) ? 1 : 0; }
  /** Hiện/ẩn các khối theo bước — chỉ đổi lớp CSS nên có hiệu ứng xuất hiện, không vẽ lại slide. */
  function apDungBuoc() {
    const el = $('khung').firstElementChild;
    if (!el) return;
    el.querySelectorAll('[data-goi-y]').forEach((x) => x.classList.toggle('hien', buoc >= 1));
    const s = slides[cur], n = el.querySelector('.nhan-slide');
    if (n && s && s.loai === 'de') n.textContent = buoc > 0 ? 'Gợi ý công thức' : 'Đề';
    nhanViTri();
  }
  /** Tiếp: còn bước trong slide thì hiện thêm khối, hết bước mới sang slide sau. */
  function tiep() {
    if (buoc < soBuoc(slides[cur])) { buoc++; apDungBuoc(); return; }
    ve(cur + 1, 0);
  }
  /** Lùi: ẩn bớt khối vừa hiện; đầu slide thì về slide trước và giữ các khối của slide đó đã hiện sẵn. */
  function lui() {
    if (buoc > 0) { buoc--; apDungBuoc(); return; }
    const t = Math.max(0, cur - 1);
    ve(t, soBuoc(slides[t]));
  }
  function nhanViTri() {
    const s = slides[cur];
    const ten = s.loai === 'de' ? (buoc > 0 ? 'Gợi ý công thức' : 'Đề') : { 'dap-an': 'Đáp án', giai: 'Giải thích' }[s.loai];
    $('vt').textContent = s.loai === 'bia' ? 'Bìa' : `Câu ${bo.cau.indexOf(s.c) + 1}/${bo.cau.length} · ${ten}`;
  }

  async function ve(i, b) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    buoc = Math.max(0, Math.min(soBuoc(slides[cur]), b || 0));
    const s = slides[cur];
    const html = s.loai === 'bia' ? slideBia() : s.loai === 'de' ? slideDe(s.c) : s.loai === 'dap-an' ? slideDapAn(s.c) : slideGiai(s.c);
    const el = document.createElement('div');
    el.className = 'slide';
    el.innerHTML = html + `<div class="tien-do" style="width:${(cur / (slides.length - 1)) * 100}%"></div>`;
    // Hình SVG trong đề có kích thước pixel cố định → bỏ đi để hình to theo cỡ chữ (giữ tỉ lệ nhờ viewBox)
    el.querySelectorAll('.de svg[viewBox]').forEach((g) => { g.removeAttribute('width'); g.removeAttribute('height'); });
    const k = $('khung');
    k.replaceChildren(el);
    fitAll(el);
    if (window.MathJax && MathJax.typesetPromise) {
      try { await MathJax.typesetPromise([el]); } catch (e) {}
      boLoiCongThuc(el);
      if (slides[cur] === s) fitAll(el);
    }
    baoPhong(s); theoDoiKq(s); nutKhoa();
    apDungBuoc();
    const u = new URL(location.href); u.searchParams.set('s', cur); history.replaceState(null, '', u);
  }

  /** Công thức MathJax không đọc được → hiện nguyên văn bản thường, không hiện ô vàng "Math input error". */
  function boLoiCongThuc(el) {
    try {
      const items = MathJax.startup.document.getMathItemsWithin(el);
      for (const m of items) {
        const r = m.typesetRoot;
        if (r && r.querySelector && r.querySelector('mjx-merror')) {
          const sp = document.createElement('span');
          sp.className = 'tex-loi';
          sp.textContent = String(m.math || '').replace(/\\(left|right|,|;|!)/g, '').replace(/[{}]/g, '');
          r.replaceWith(sp);
        }
      }
    } catch (e) {
      el.querySelectorAll('mjx-merror').forEach((x) => { const c = x.closest('mjx-container'); if (c) c.replaceWith(document.createTextNode(c.textContent)); });
    }
  }

  /* ---------- Tạo lời giải ngay trên slide (chỉ giáo viên) ---------- */
  async function taoLoiGiai(cauId, btn) {
    if (!coGemini) return;
    btn.disabled = true; btn.textContent = 'Hệ thống đang soạn lời giải…';
    try {
      const r = await fetch('api.php?action=bg_giai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bo_id: bo.bo_id, cau_id: cauId }) });
      const d = await r.json();
      if (d.status !== 'success') throw new Error(d.message);
      const c = bo.cau.find((x) => x.id === cauId);
      c.giai = d.data.giai;
      ve(cur, buoc);
    } catch (e) {
      thongBao(e.message || 'Không tạo được lời giải.');
      btn.disabled = false; btn.textContent = 'Thử tạo lại';
    }
  }
  function thongBao(m) {
    const t = document.createElement('div'); t.className = 'thong-bao'; t.textContent = m;
    document.body.appendChild(t); setTimeout(() => t.remove(), 5000);
  }

  /* ---------- Mục lục ---------- */
  function veMucLuc() {
    $('ml-list').innerHTML = bo.cau.map((c, i) => {
      const d = document.createElement('div'); d.innerHTML = c.de_html;
      const tt = c.giai && c.giai.cac_buoc && c.giai.cac_buoc.length ? 'có lời giải' : '';
      return `<li><button type="button" data-den="${1 + i * 3}"><b>${esc(c.so)}</b><span>${esc((d.textContent || '').trim().slice(0, 90))}</span><em class="tt">${tt}</em></button></li>`;
    }).join('');
  }
  function moMucLuc(mo) { $('muc-luc').classList.toggle('mo', mo); }

  /* ---------- Điều khiển ---------- */
  let anDock;
  function hienDock() {
    $('dock').classList.remove('an'); clearTimeout(anDock);
    anDock = setTimeout(() => $('dock').classList.add('an'), 3000);
  }
  function toanManHinh() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  function phim(e) {
    if ($('muc-luc').classList.contains('mo')) { if (e.key === 'Escape' || e.key.toLowerCase() === 'm') moMucLuc(false); return; }
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) { e.preventDefault(); tiep(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].includes(k)) { e.preventDefault(); lui(); }
    else if (k === 'Home') ve(0, 0);
    else if (k === 'End') ve(slides.length - 1, 0);
    else if (k.toLowerCase() === 'f') toanManHinh();
    else if (k.toLowerCase() === 'm') moMucLuc(true);
    else if (k.toLowerCase() === 'l') doiKhoa();
    else if (['1', '2', '3', '4'].includes(k) && slides[cur].c) {
      // 1 Đề · 2 Gợi ý công thức (cùng slide Đề) · 3 Đáp án · 4 Giải thích
      const base = 1 + bo.cau.indexOf(slides[cur].c) * 3;
      if (k === '1' || k === '2') ve(base, k === '2' ? 1 : 0);
      else ve(base + Number(k) - 2, 0);
    }
  }

  async function khoiDong() {
    scale();
    window.addEventListener('resize', scale);
    let ma = qs.get('bo');
    if (!ma && qs.has('hom_nay')) {
      // Mở thẳng bài của hôm nay (ngày ở đầu tên file Drive). Nhiều bài thì lọc theo ?khoi=L07, không thì về danh sách.
      try {
        const hj = await fetch('api.php?action=bg_hom_nay').then((r) => r.json());
        if (hj.can_dang_nhap) { location.replace('bai-giang.html?tiep=' + encodeURIComponent('trinh-chieu.html' + location.search)); return; }
        const h = hj.data;
        let ds = h.bo;
        if (qs.get('khoi')) ds = ds.filter((b) => b.khoi === qs.get('khoi'));
        if (ds.length === 1) { ma = ds[0].ma; const u = new URL(location.href); u.searchParams.set('bo', ma); history.replaceState(null, '', u); }
      } catch (e) {}
    }
    if (!ma) { location.replace('bai-giang.html'); return; }
    try {
      const [r1, r2] = await Promise.all([
        fetch('api.php?action=bg_get&ma=' + encodeURIComponent(ma)).then((r) => r.json()),
        fetch('api.php?action=bg_trang_thai').then((r) => r.json()).catch(() => ({})),
      ]);
      if (r1.can_dang_nhap) { location.replace('bai-giang.html?tiep=' + encodeURIComponent('trinh-chieu.html' + location.search)); return; }
      if (r1.status !== 'success') throw new Error(r1.message || 'Không tải được bài giảng.');
      bo = r1.data;
      laGV = !!(r2.data && r2.data.giao_vien);
      coGemini = !!(r2.data && r2.data.gemini);
    } catch (e) {
      $('khung').innerHTML = `<div class="bia"><h1>Không mở được bài giảng</h1><div class="tac-gia">${esc(e.message)}</div></div>`;
      return;
    }
    document.title = bo.tieu_de + ' · Trình chiếu · ThS. Đinh Quốc Tuấn';
    dungDanhSach();
    veMucLuc();
    await ve(parseInt(qs.get('s') || '0', 10) || 0, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAll($('khung')));

    document.addEventListener('keydown', phim);
    document.addEventListener('mousemove', hienDock);
    $('khung').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tao]');
      if (b) { taoLoiGiai(b.dataset.tao, b); return; }
      if (!e.target.closest('a,button')) { if (e.clientX > window.innerWidth / 3) tiep(); else lui(); }
    });
    $('btn-truoc').onclick = lui;
    $('btn-sau').onclick = tiep;
    $('btn-ml').onclick = () => moMucLuc(true);
    $('btn-fs').onclick = toanManHinh;
    $('btn-khoa').onclick = doiKhoa;
    $('btn-tt').onclick = doiTuongTac;
    $('btn-kq').href = 'ket-qua-lop.html?bo=' + encodeURIComponent(bo.ma);
    $('btn-tt').classList.toggle('chinh', tuongTac);
    $('muc-luc').addEventListener('click', (e) => {
      const b = e.target.closest('[data-den]');
      if (b) { moMucLuc(false); ve(Number(b.dataset.den), 0); } else if (e.target.id === 'muc-luc') moMucLuc(false);
    });
    // Vuốt trên màn hình cảm ứng
    let x0 = null;
    document.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { if (dx < 0) tiep(); else lui(); } x0 = null; });
    hienDock();
  }

  window.TrinhChieu = { fit, tranTheoSoTu };
  document.addEventListener('DOMContentLoaded', khoiDong);
})();
