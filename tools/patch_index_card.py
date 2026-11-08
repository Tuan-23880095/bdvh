# -*- coding: utf-8 -*-
path = r'D:\202610-Antigravity\PhatTrien-Repo-github\bdvh\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Thay grid-cols-1 md:grid-cols-3 thành grid-cols-1 md:grid-cols-2 lg:grid-cols-4
old_grid = '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">'
new_grid = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'

card_4 = """
      <!-- CARD 4: KHTN 8 - HÓA HỌC HK1 (KNTT) - 50 CÂU TRẮC NGHIỆM -->
      <div class="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:shadow-2xl transition">
        <div class="absolute top-0 right-0 bg-luc text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span> Mới Nhất
        </div>

        <div>
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-luc flex items-center justify-center text-xl font-black">
              🧪
            </div>
            <div>
              <span class="text-[10px] font-bold text-luc uppercase tracking-wider">KHTN 8 · PHÂN MÔN HÓA HỌC</span>
              <h4 class="text-base font-extrabold text-muc leading-tight mt-0.5">
                50 Câu Trắc Nghiệm Hóa 8 HK1
              </h4>
            </div>
          </div>

          <p class="text-xs text-gray-600 leading-relaxed mb-4">
            Ôn tập toàn diện Chương 1 (Phản ứng hóa học, Mol, đkc 24,79L, Tốc độ pư) & Chương 2 (Acid, Base, pH, Oxide, Muối, Phân bón). Chuẩn sách KNTT & GDPT 2018.
          </p>

          <div class="bg-giay p-3 rounded-xl border border-bac mb-4 space-y-1 text-xs">
            <div class="flex justify-between text-gray-600">
              <span>Quy mô:</span> <b class="text-muc">50 câu phân hóa nhận thức</b>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Tính năng:</span> <b class="text-luc">Đo thời gian từng câu & A4</b>
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t border-bac">
          <!-- Nút học sinh vào thi trực tuyến -->
          <a href="thi.html?exam_code=KHTN8_HOA_HK1_50C" class="w-full bg-luc hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow flex items-center justify-center gap-2">
            <i class="fas fa-play text-amber-300"></i>
            <span>Vào Thi & Đo Thời Gian Từng Câu</span>
          </a>

          <!-- Nút xem và in file A4 -->
          <a href="de_thi_a4/2026-11-08_KHTN8_50Cau-TracNghiem-HK1_HoaHoc-KNTT-A4.html" target="_blank" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-300">
            <i class="fas fa-print text-lam"></i>
            <span>Xem & In Đề Khổ A4 (Chuẩn BDVH)</span>
          </a>
        </div>
      </div>
"""

if old_grid in content:
    content = content.replace(old_grid, new_grid, 1)
    print("Replaced grid cols")

# Chèn Card 4 trước </div> </section> của featured-slido
old_section_end = """          <a href="giao-vien.html" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-300">
            <i class="fas fa-cog text-gray-500"></i>
            <span>Thiết Lập Phòng Chiếu</span>
          </a>
        </div>
      </div>
    </div>
  </section>"""

new_section_end = """          <a href="giao-vien.html" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-300">
            <i class="fas fa-cog text-gray-500"></i>
            <span>Thiết Lập Phòng Chiếu</span>
          </a>
        </div>
      </div>
""" + card_4 + """    </div>
  </section>"""

if old_section_end in content:
    content = content.replace(old_section_end, new_section_end, 1)
    print("Inserted Card 4 into featured section")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("index.html patched successfully!")
