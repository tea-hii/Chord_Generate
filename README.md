# ChordFlow 🎵 - Web App Vòng Hòa Thanh, Vòng Tròn Bậc 5, Lưới MIDI & General MIDI Studio

Một ứng dụng web client-side hiện đại giúp các nhạc sĩ, nhà sản xuất âm nhạc (producer) và người yêu âm nhạc dễ dàng tạo vòng hòa thanh (chord progression), khám phá vòng tròn bậc 5 (Circle of Fifths), xem và vẽ nốt trên **Lưới MIDI Piano Roll**, trải nghiệm **Cảm ứng lực Velocity** và bộ âm sắc **General MIDI (GM)** chuẩn mực.

Ứng dụng chạy hoàn toàn trên trình duyệt bằng **HTML5 + Web Audio API**, không cần cài đặt backend, sẵn sàng triển khai lên **GitHub Pages** chỉ với 1 cú nhấp chuột.

---

## ✨ Các Tính Năng Đột Phá Mới Được Bổ Sung

### 1. 🎹 Cửa Sổ Lưới MIDI & Piano Roll (Vẽ & Soi Nốt Hòa Thanh)
- Bấm nút **"🎹 Mở Lưới MIDI (Piano Roll)"** hoặc bấm biểu tượng MIDI trên từng ô hợp âm để mở cửa sổ Piano Roll chuyên nghiệp.
- **Lưới Grid chuẩn DAW**: Trục dọc là phím đàn Piano (từ C2 đến C6), trục ngang là các Khuông nhạc (Bars), Phách (Beats) và vạch chia nửa phách.
- **Trực quan hóa vòng lặp (Loop Visualizer)**: Hiển thị các khối nốt nhạc của vòng hòa thanh đang lặp lại.
- **Con trỏ Playhead chạy thời gian thực**: Đường quét laser đỏ di chuyển mượt mà theo nhịp của Web Audio API, các nốt đang vang lên sẽ sáng bừng theo nhịp điệu.
- **Tính năng vẽ MIDI (MIDI Editor)**:
  - Bấm chuột vào ô trống trên lưới để **vẽ/thêm nốt mới** ngay lập tức.
  - Bấm vào nốt đã có để **xóa nốt**.
  - Nhấp vào phím đàn bên trái để nghe thử cao độ của từng nốt.

### 2. ⚡ Cảm Ứng Lực Bấm Velocity (Độ Mạnh Nhẹ Động)
- **Trên Vòng tròn bậc 5 (Circle of Fifths)**:
  - Bấm ở **mép ngoài** của ô cung = **Velocity mạnh (ff / 110 - 127)**: Âm lượng to, bộ lọc âm sáng rực rỡ và đanh thép.
  - Bấm ở **mép trong** của ô cung = **Velocity nhẹ (p / 40 - 65)**: Âm lượng nhỏ nhẹ, ấm áp và êm dịu.
- **Trên Bàn phím hợp âm bậc I - VII**:
  - Bấm nửa trên của phím = Lực mạnh (Forte).
  - Bấm nửa dưới của phím = Lực nhẹ (Piano).
  - Tự động nhận diện độ nhạy lực bấm cứng trên màn hình cảm ứng / bút stylus (Pointer pressure).
- **HUD hiển thị lực thời gian thực**: Góc trên màn hình sẽ hiển thị ngay chỉ số Velocity vừa bấm (`Vel: 115 (ff)` hoặc `Vel: 55 (p)`).
- Chỉ số Velocity được lưu lại theo từng ô hợp âm và xuất ra chuẩn xác trong file `.mid`!

### 3. 🎼 Bộ Âm Sắc Chuẩn General MIDI (GM Instruments)
Tích hợp sẵn 16 nhạc cụ cơ bản tiêu chuẩn của General MIDI:
- **Piano**: 001. Acoustic Grand Piano, 002. Bright Acoustic Piano
- **Electric Piano**: 005. Electric Piano 1 (Rhodes), 006. Electric Piano 2 (DX7 FM Sparkle)
- **Chromatic**: 012. Vibraphone
- **Organ**: 017. Drawbar Organ (Hammond B3), 020. Church Pipe Organ
- **Guitar**: 025. Acoustic Guitar (Nylon), 026. Acoustic Guitar (Steel), 028. Electric Guitar (Clean)
- **Bass**: 033. Acoustic Upright Bass
- **Strings & Ensemble**: 041. Solo Strings / Violin, 049. String Ensemble 1
- **Brass & Pipe**: 057. Trumpet / Brass Section, 074. Flute / Woodwind
- **Synth Pad**: 089. Warm Synth Pad

---

## ⭕ Các Tính Năng Cốt Lõi

1. **Vòng tròn bậc 5 tương tác (Circle of Fifths)**: Chọn giọng Trưởng/Thứ, tự động tô màu Chủ âm (Tonic - I), Hạ át (Subdominant - IV), Át âm (Dominant - V). Chuyển đổi linh hoạt giữa hợp âm 3 nốt (Triads) và hợp âm 7 (7ths: maj7, m7, 7, m7b5).
2. **Hợp âm vay mượn (Borrowed Chords)**: Tự động gợi ý các bậc ngoài âm giai như bậc `iv` thứ, `bVII`, `bVI`, `V/vi` để tạo điểm nhấn bất hủ cho ca khúc.
3. **Bộ Looper & Sequencer**: Lặp lại trơn tru 2 khuông, 4 khuông hoặc 8 khuông; nhịp 4/4 hoặc 3/4.
4. **Mêtrônôm & Bấm nhịp (Tap Tempo)**: Gõ nhịp phách 1 nhấn mạnh rõ ràng, hàng 4 đèn LED nháy nhịp, nút **TAP TEMPO** để nhấp ngón tay và tự bắt nhịp BPM theo giai điệu bạn đang nhẩm trong đầu.
5. **Thư viện vòng hòa thanh kinh điển**: Pop 4 Chords, Emotional Ballad, J-Pop Royal Road, 50s Doo-Wop, Jazz 2-5-1, Andalusian Flamenco, Lofi Chill.
6. **Xuất MIDI (.mid)**: Tải file MIDI chuẩn kéo thả thẳng vào FL Studio, Ableton Live, Logic Pro, GarageBand...

---

## ⌨️ Phím Tắt Nhanh

| Phím | Chức năng |
| :--- | :--- |
| **Space** | Bật / Tạm dừng phát vòng hòa thanh |
| **Phím 1 - 7** | Đánh nhanh hợp âm các bậc 1 đến 7 |
| **T** | Bấm nhịp (Tap Tempo) |
| **L** | Bật / Tắt chế độ lặp (Loop) |
| **R** | Bật / Tắt chế độ ghi âm hợp âm (Record) |
| **M** | Bật / Tắt Mêtrônôm |

---

## 🚀 Hướng Dẫn Đưa Lên GitHub Pages (1 Cú Click)

```bash
git init
git add .
git commit -m "feat: ChordFlow with MIDI Piano Roll, Velocity & General MIDI"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
git push -u origin main
```

Sau đó vào repository trên GitHub: **Settings** -> **Pages** -> chọn nhánh `main` và thư mục `/ (root)` rồi nhấn **Save** là xong!

---

*Chúc bạn có thật nhiều cảm hứng và sáng tác nên những giai điệu tuyệt vời cùng ChordFlow!* 🎹✨
