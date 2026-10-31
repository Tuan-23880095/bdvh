/**
 * ĐỒNG BỘ ĐỀ TỪ GOOGLE DRIVE (DAYKEM) LÊN bdvh.diemdanhsv.com — ThS. Đinh Quốc Tuấn
 *
 * Mỗi giờ script tự:
 *   1. Quét thư mục DAYKEM (cả Toan6, Toan7, Toan8, KHTN6, KHTN8…) tìm file đề .html có ngày ở đầu tên
 *      (ví dụ 2026-10-31_Toan7_OnTap-CK1_T7.html) từ HÔM NAY trở đi, hoặc file đã sửa sau lần gửi trước.
 *   2. Gửi nguyên file lên máy chủ → máy chủ tự tách câu, ghép đáp án, lưu thành bộ bài giảng
 *      (mỗi câu 3 slide: Đề · Đáp án · Giải thích). Gửi lại cùng file chỉ cập nhật, không tạo bản trùng.
 *   3. Nhờ Gemini soạn lời giải từng bước cho các câu chưa có (của bài hôm nay và các ngày tới),
 *      để sáng ra mở là chiếu được. Hết thời gian chạy (6 phút) thì lần sau làm tiếp.
 *
 * CÀI ĐẶT (một lần):
 *   a) Vào https://script.google.com → Dự án mới → xoá mã mẫu → dán toàn bộ file này.
 *   b) Dán MÃ ĐỒNG BỘ (lấy ở bdvh.diemdanhsv.com/bai-giang.html → "Tạo mã đồng bộ") vào MA_DONG_BO bên dưới.
 *   c) Chọn hàm  caiDat  → bấm Chạy → cấp quyền đọc Google Drive và kết nối ra ngoài.
 *   d) (Tuỳ chọn) Chọn hàm  dongBo  → Chạy để đồng bộ ngay và xem nhật ký thực thi.
 */
const CAU_HINH = {
  THU_MUC_ID: '1WvvbPoXrYpkpJBe5vIHwHCBa-5Ok2GZF',          // thư mục DAYKEM trên Drive
  API: 'https://bdvh.diemdanhsv.com/api.php',
  MA_DONG_BO: 'DAN_MA_DONG_BO_VAO_DAY',
  TAO_LOI_GIAI: true,                                      // false: chỉ đưa đề lên, thầy tự bấm tạo lời giải
  SO_NGAY_TRUOC: 0,                                        // 1 = gửi cả bài của hôm qua
  MUI_GIO: 'Asia/Ho_Chi_Minh',
};

function caiDat() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dongBo') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dongBo').timeBased().everyHours(1).create();
  Logger.log('Đã cài: tự đồng bộ mỗi giờ. Chạy thử lần đầu…');
  dongBo();
}

function dongBo() {
  if (!CAU_HINH.MA_DONG_BO || CAU_HINH.MA_DONG_BO.indexOf('DAN_MA') === 0) throw new Error('Chưa dán MÃ ĐỒNG BỘ vào CAU_HINH.MA_DONG_BO.');
  const batDau = Date.now();
  const tuNgay = ngayChuoi_(-CAU_HINH.SO_NGAY_TRUOC);
  const props = PropertiesService.getScriptProperties();
  const daGui = JSON.parse(props.getProperty('daGui') || '{}');

  // 1–2. Đưa đề mới / đề đã sửa lên máy chủ
  const files = [];
  quetThuMuc_(DriveApp.getFolderById(CAU_HINH.THU_MUC_ID), files);
  files.sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
  let gui = 0;
  files.forEach(function (f) {
    const ten = f.getName();
    const m = ten.match(/^(\d{4}-\d{2}-\d{2})_.*\.html?$/i);
    if (!m || m[1] < tuNgay) return;
    const capNhat = f.getLastUpdated().getTime();
    if (daGui[f.getId()] === capNhat) return;
    try {
      const r = goi_({ action: 'bg_nhap', ten_file: ten, html: f.getBlob().getDataAsString('UTF-8'), drive_id: f.getId() });
      daGui[f.getId()] = capNhat; gui++;
      Logger.log((r.moi ? 'Thêm ' : 'Cập nhật ') + ten + ': ' + r.so_cau + ' câu' + (r.canh_bao && r.canh_bao.length ? ' · cảnh báo: ' + r.canh_bao.join('; ') : ''));
    } catch (e) {
      Logger.log('LỖI ' + ten + ': ' + e.message);
    }
  });
  props.setProperty('daGui', JSON.stringify(daGui));
  Logger.log('Đã gửi ' + gui + ' file.');

  // 3. Lời giải từng bước bằng Gemini cho bài hôm nay và các ngày tới
  if (!CAU_HINH.TAO_LOI_GIAI) return;
  const ds = goi_({ action: 'bg_list' }).filter(function (b) { return b.ngay && b.ngay >= tuNgay && b.so_da_giai < b.so_cau; });
  ds.sort(function (a, b) { return a.ngay < b.ngay ? -1 : 1; });            // bài sắp dạy trước
  for (let i = 0; i < ds.length; i++) {
    const bo = goi_({ action: 'bg_get', bo_id: ds[i].bo_id });
    for (let j = 0; j < bo.cau.length; j++) {
      const c = bo.cau[j];
      if (c.giai && c.giai.cac_buoc && c.giai.cac_buoc.length) continue;
      if (Date.now() - batDau > 5 * 60 * 1000) { Logger.log('Hết giờ chạy — lần sau làm tiếp.'); return; }
      try { goi_({ action: 'bg_giai', bo_id: bo.bo_id, cau_id: c.id }); Logger.log('Lời giải: ' + bo.tieu_de + ' · ' + c.so); }
      catch (e) { Logger.log('Lỗi Gemini ' + c.so + ': ' + e.message); if (/khoá|key|đăng nhập/i.test(e.message)) return; }
    }
  }
}

function quetThuMuc_(folder, out) {
  const it = folder.getFiles();
  while (it.hasNext()) out.push(it.next());
  const sub = folder.getFolders();
  while (sub.hasNext()) quetThuMuc_(sub.next(), out);
}

function goi_(body) {
  body.token = CAU_HINH.MA_DONG_BO;
  const res = UrlFetchApp.fetch(CAU_HINH.API + '?action=' + encodeURIComponent(body.action), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  let d;
  try { d = JSON.parse(res.getContentText()); } catch (e) { throw new Error('Máy chủ trả về không phải JSON (HTTP ' + res.getResponseCode() + ').'); }
  if (d.status !== 'success') throw new Error(d.message || 'Lỗi máy chủ');
  return d.data;
}

function ngayChuoi_(lechNgay) {
  return Utilities.formatDate(new Date(Date.now() + lechNgay * 864e5), CAU_HINH.MUI_GIO, 'yyyy-MM-dd');
}
