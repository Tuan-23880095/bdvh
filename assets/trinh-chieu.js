/**
 * trinh-chieu.js — Trình chiếu bộ bài giảng: mỗi câu 3 slide (Đề · Đáp án · Giải thích từng bước).
 * Chữ trên slide tự co giãn: ước lượng cỡ chữ theo số từ, rồi tìm cỡ LỚN NHẤT vẫn vừa khung (tìm nhị phân),
 * nên câu ngắn chữ rất to, câu dài tự nhỏ lại mà vẫn lấp đầy khung trình chiếu.
 * Phím: → / Space / PageDown: tiếp · ← / PageUp: lùi · 1 2 3: Đề / Đáp án / Giải thích · M: mục lục · F: toàn màn hình.
 */
(function () {
  'use strict';
  const W = 1600, H = 900;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = new URLSearchParams(location.search);
  const SEN = 'assets/logo-sen.svg';

  let bo = null, slides = [], cur = 0, laGV = false, coGemini = false;

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
  function vua(box, noi) { return noi.scrollHeight <= box.clientHeight + 1 && noi.scrollWidth <= box.clientWidth + 1; }
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
  function fitAll(root) { root.querySelectorAll('.fit').forEach(fit); }

  /* ---------- Dựng slide ---------- */
  function top(c, loai) {
    const nhan = { de: 'Đề', 'dap-an': 'Đáp án', giai: 'Giải thích' }[loai];
    const idx = bo.cau.indexOf(c) + 1;
    return `<div class="s-top">
      <span class="sen"><img src="${SEN}" alt=""></span>
      <div class="ten"><b>${esc(bo.tieu_de)}</b><span>ThS. Đinh Quốc Tuấn · Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM</span></div>
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
    return { abcd: 'Trắc nghiệm', dung_sai: 'Đúng hay Sai', tra_loi_ngan: 'Trả lời ngắn', tu_luan: 'Tự luận' }[c.loai] || '';
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
    if (c.loai === 'dung_sai' && !hienDapAn) return '<div class="ds"><div class="o">Đúng</div><div class="o">Sai</div></div>';
    if (c.loai === 'tra_loi_ngan' && !hienDapAn) return '<div class="o-trong">Đáp số: <span>&nbsp;</span></div>';
    return '';
  }

  function slideDe(c) {
    return `${top(c, 'de')}<div class="s-body"><div class="fit"><div>${deHtml(c)}${luaChonHtml(c, false)}</div></div></div>`;
  }

  function slideDapAn(c) {
    let body = '';
    const g = c.giai || {};
    if (c.loai === 'abcd') {
      const o = c.lua_chon.find((x) => x.k === c.dap_an);
      body = `<div class="so-cau">${esc(c.so)} <small>Đáp án đúng</small></div>
        <div class="da-lon"><span class="k">${esc(c.dap_an || '?')}</span><span class="t">${o ? o.html : esc(g.dap_an_ngan || '')}</span></div>
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
        <div class="loi-giai-tl">${c.dap_an_html || (g.dap_an_ngan ? esc(g.dap_an_ngan) : '<p class="chua-co">Chưa có đáp án trong file đề.</p>')}</div>`;
    }
    return `${top(c, 'dap-an')}<div class="s-body"><div class="fit"><div>${body}</div></div></div>`;
  }

  function slideGiai(c) {
    const g = c.giai;
    let body;
    if (g && g.cac_buoc && g.cac_buoc.length) {
      body = `<div class="gt-tieu-de">${esc(c.so)} · Giải thích từng bước</div>
        ${g.kien_thuc ? `<div class="can-nho"><b>Cần nhớ:</b> ${esc(g.kien_thuc)}</div>` : ''}
        <ol class="buoc">${g.cac_buoc.map((b) => `<li><div>${b.tieu_de ? `<b>${esc(b.tieu_de)}:</b> ` : ''}<span>${esc(b.noi_dung)}</span></div></li>`).join('')}</ol>
        ${g.loi_thuong_gap ? `<div class="loi-hay-gap"><b>Lỗi hay gặp:</b> ${esc(g.loi_thuong_gap)}</div>` : ''}`;
    } else {
      const tom = c.ghi_chu_html || (c.loai === 'tu_luan' ? c.dap_an_html : '');
      body = `<div class="gt-tieu-de">${esc(c.so)} · Giải thích</div>
        ${tom ? `<div class="can-nho"><b>Lời giải tóm tắt:</b> ${tom}</div>` : ''}
        <p class="chua-co">Chưa có lời giải từng bước cho câu này.</p>
        ${laGV ? `<button class="btn-gemini" type="button" data-tao="${esc(c.id)}">${coGemini ? 'Tạo lời giải bằng Gemini' : 'Chưa cấu hình khoá Gemini'}</button>` : ''}`;
    }
    return `${top(c, 'giai')}<div class="s-body"><div class="fit"><div>${body}</div></div></div>`;
  }

  function slideBia() {
    return `<div class="bia">
      <span class="sen-lon"><img src="${SEN}" alt="Logo sen ThS. Đinh Quốc Tuấn"></span>
      <div class="eyebrow">${esc([bo.mon, bo.khoi ? 'Lớp ' + String(bo.khoi).replace(/^L0?/, '') : ''].filter(Boolean).join(' · '))} · ${bo.cau.length} câu</div>
      <h1>${esc(bo.tieu_de)}</h1>
      <div class="tac-gia"><b>ThS. Đinh Quốc Tuấn</b>Trung tâm Bồi dưỡng Văn hóa · Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM</div>
      <div class="huong-dan">Mỗi câu 3 slide: Đề → Đáp án → Giải thích từng bước · Phím → để bắt đầu</div></div>`;
  }

  function dungDanhSach() {
    slides = [{ loai: 'bia' }];
    bo.cau.forEach((c) => { slides.push({ loai: 'de', c }, { loai: 'dap-an', c }, { loai: 'giai', c }); });
  }

  async function ve(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
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
      if (slides[cur] === s) fitAll(el);
    }
    $('vt').textContent = s.loai === 'bia' ? 'Bìa' : `Câu ${bo.cau.indexOf(s.c) + 1}/${bo.cau.length} · ${{ de: 'Đề', 'dap-an': 'Đáp án', giai: 'Giải thích' }[s.loai]}`;
    const u = new URL(location.href); u.searchParams.set('s', cur); history.replaceState(null, '', u);
  }

  /* ---------- Tạo lời giải ngay trên slide (chỉ giáo viên) ---------- */
  async function taoLoiGiai(cauId, btn) {
    if (!coGemini) return;
    btn.disabled = true; btn.textContent = 'Gemini đang soạn lời giải…';
    try {
      const r = await fetch('api.php?action=bg_giai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bo_id: bo.bo_id, cau_id: cauId }) });
      const d = await r.json();
      if (d.status !== 'success') throw new Error(d.message);
      const c = bo.cau.find((x) => x.id === cauId);
      c.giai = d.data.giai;
      ve(cur);
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
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) { e.preventDefault(); ve(cur + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].includes(k)) { e.preventDefault(); ve(cur - 1); }
    else if (k === 'Home') ve(0);
    else if (k === 'End') ve(slides.length - 1);
    else if (k.toLowerCase() === 'f') toanManHinh();
    else if (k.toLowerCase() === 'm') moMucLuc(true);
    else if (['1', '2', '3'].includes(k) && slides[cur].c) {
      const base = 1 + bo.cau.indexOf(slides[cur].c) * 3; ve(base + Number(k) - 1);
    }
  }

  async function khoiDong() {
    scale();
    window.addEventListener('resize', scale);
    let ma = qs.get('bo');
    if (!ma && qs.has('hom_nay')) {
      // Mở thẳng bài của hôm nay (ngày ở đầu tên file Drive). Nhiều bài thì lọc theo ?khoi=L07, không thì về danh sách.
      try {
        const h = (await fetch('api.php?action=bg_hom_nay').then((r) => r.json())).data;
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
    await ve(parseInt(qs.get('s') || '0', 10) || 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAll($('khung')));

    document.addEventListener('keydown', phim);
    document.addEventListener('mousemove', hienDock);
    $('khung').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tao]');
      if (b) { taoLoiGiai(b.dataset.tao, b); return; }
      if (!e.target.closest('a,button')) ve(cur + (e.clientX > window.innerWidth / 3 ? 1 : -1));
    });
    $('btn-truoc').onclick = () => ve(cur - 1);
    $('btn-sau').onclick = () => ve(cur + 1);
    $('btn-ml').onclick = () => moMucLuc(true);
    $('btn-fs').onclick = toanManHinh;
    $('muc-luc').addEventListener('click', (e) => {
      const b = e.target.closest('[data-den]');
      if (b) { moMucLuc(false); ve(Number(b.dataset.den)); } else if (e.target.id === 'muc-luc') moMucLuc(false);
    });
    // Vuốt trên màn hình cảm ứng
    let x0 = null;
    document.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) ve(cur + (dx < 0 ? 1 : -1)); x0 = null; });
    hienDock();
  }

  window.TrinhChieu = { fit, tranTheoSoTu };
  document.addEventListener('DOMContentLoaded', khoiDong);
})();
