# ChordFlow 🎵 - Web App Vòng Hòa Thanh, Vòng Tròn Bậc 5 & Cảm Hứng Sáng Tác

Một ứng dụng web client-side hiện đại giúp các nhạc sĩ, nhà sản xuất âm nhạc (producer) và người yêu âm nhạc dễ dàng tạo vòng hòa thanh (chord progression), khám phá vòng tròn bậc 5 (Circle of Fifths), lặp lại các ô nhịp hòa thanh và nhẩm giai điệu với Mêtrônôm & Tap Tempo.

Ứng dụng chạy hoàn toàn trên trình duyệt bằng **HTML5 + Web Audio API**, không cần cài đặt backend, sẵn sàng triển khai lên **GitHub Pages** chỉ với vài cú nhấp chuột.

![Giao diện ChordFlow](https://raw.githubusercontent.com/username/repository/main/preview.png)

---

## ✨ Tính Năng Nổi Bật

### 1. ⭕ Vòng tròn bậc 5 tương tác (Circle of Fifths)
- Vòng ngoài chứa các giọng Trưởng (Major), vòng trong chứa các giọng Thứ (Minor).
- Khi chọn 1 giọng (ví dụ C Trưởng hay A Thứ), vòng tròn sẽ tự động làm nổi bật mối quan hệ hòa âm: **Chủ âm (Tonic - I)**, **Hạ át (Subdominant - IV)**, **Át âm (Dominant - V)**, và các giọng tương đương.
- Hỗ trợ nhiều âm giai (Scale Modes): Major (Ionian), Natural Minor (Aeolian), Harmonic Minor (Thứ hòa âm), Dorian, Mixolydian.
- Tùy chọn chuyển đổi nhanh giữa hợp âm 3 nốt (Triads) và **Hợp âm 7 (7th Chords: maj7, m7, 7, m7b5)**.

### 2. 🎹 Bàn phím hợp âm các bậc (I - VII)
- 7 ô hợp âm tương ứng với 7 bậc trong âm giai.
- Hiển thị tên hợp âm (ví dụ: `C`, `Dm`, `Em`, `F`, `G`, `Am`, `Bdim` hoặc `Cmaj7`, `Dm7`...).
- Hiển thị các nốt cấu thành hợp âm và chức năng hòa âm (Chủ âm, Tiền át, Át âm...).
- **Âm thanh chân thực**: Tích hợp bộ tổng hợp âm thanh Polyphonic đa âm sắc (Grand Piano, Rhodes Electric Piano, Lush Ambient Pad, Acoustic Guitar Pluck) với hiệu ứng Reverb phòng thu.
- Hỗ trợ kiểu gõ: Rải ngón tự nhiên (Strumming) hoặc đánh nốt đồng thời (Block Chord).
- **Hợp âm vay mượn (Borrowed Chords)**: Tự động gợi ý các hợp âm ngoài âm giai kinh điển (như bậc `iv` thứ trong giọng trưởng, `bVII`, `bVI`, `V/vi`) giúp tạo điểm nhấn xúc động, độc đáo cho bài hát.

### 3. 🎼 Vòng hòa thanh (Sequencer & Looper)
- Tùy chỉnh số khuông nhạc (2 Khuông = 2 Bars, 4 Khuông, 8 Khuông) và số nhịp (4/4 hoặc 3/4).
- Tùy chỉnh độ dài từng hợp âm (1 phách, 2 phách, 4 phách).
- **Chế độ Lặp (Loop)**: Vòng lặp chạy liên tục, mượt mà với bộ đếm thời gian Web Audio không bị giật lag hay lệch nhịp.
- Con trỏ phát sáng thời gian thực di chuyển qua từng ô hợp âm đang vang lên.
- **Chế độ Ghi âm (Record)**: Bấm nút Ghi và bấm các phím hợp âm theo nhịp để tự động tạo vòng hòa thanh theo cảm xúc.

### 4. ⏱️ Mêtrônôm & Bấm nhịp (Tap Tempo)
- **Mêtrônôm**: Tiếng gõ gõ (click/woodblock) đanh rõ, nhấn mạnh (accent) vào phách 1 đầu mỗi ô nhịp. Có nút chỉnh âm lượng riêng.
- **Hàng đèn LED nhịp**: 4 đèn nháy theo phách 1, 2, 3, 4 giúp bạn dễ dàng bắt nhịp để nhẩm giai điệu (hum melody/topline).
- **Nút "BẤM NHỊP (TAP TEMPO)"**: Nhấp ngón tay theo giai điệu bạn đang nhẩm trong đầu, ứng dụng sẽ tự động tính toán chính xác tốc độ BPM tương ứng!
- Thanh trượt và nút bấm tinh chỉnh BPM từ 30 đến 260 BPM.

### 5. 💡 Gợi ý các vòng hòa thanh bất hủ
Tích hợp sẵn danh sách các vòng hòa thanh nổi tiếng để bạn lấy cảm hứng ngay lập tức:
- **Pop Wonder (I - V - vi - IV)**: Vòng 4 hợp âm kinh điển của hàng ngàn bài hit thế giới và Việt Nam.
- **Emotional / Sad Mood (vi - IV - I - V)**: Bắt đầu bằng bậc vi gợi cảm giác sâu lắng, hoài niệm.
- **Royal Road / Odo Shinkou (IV - V - iii - vi)**: Vòng hoàng kim cảm xúc mãnh liệt trong Anime, J-Pop & V-Pop.
- **50s Doo-Wop (I - vi - IV - V)**: Vòng kinh điển thập niên 50-60 (Stand By Me, Dấu mưa).
- **Jazz Cadence (ii7 - V7 - Imaj7 - VI7)**: Chuyển bậc chuẩn mực của nhạc Jazz & Neo-Soul.
- **Andalusian Cadence (i - VII - VI - V)**: Phong cách Flamenco, kịch tính, lôi cuốn.
- **Lofi Chill / R&B (IVmaj7 - iii7 - ii7 - Imaj7)**: Hạ dần nhẹ nhàng, êm dịu.

### 6. 💾 Xuất file MIDI (.mid) & Sao chép văn bản
- Xuất file `.mid` chuẩn với 1 cú click để bạn kéo thả thẳng vào DAW (FL Studio, Ableton Live, Logic Pro, GarageBand, Cubase, Studio One...).
- Nút sao chép văn bản vòng hòa thanh (ví dụ: `C - G - Am - F`) để lưu vào sổ tay lời bài hát.

---

## ⌨️ Phím Tắt Tiện Lợi

| Phím | Chức năng |
| :--- | :--- |
| **Space** | Bật / Tạm dừng phát vòng hòa thanh |
| **Phím 1 - 7** | Đánh nhanh hợp âm các bậc I đến VII |
| **T** | Bấm nhịp (Tap Tempo) |
| **L** | Bật / Tắt chế độ lặp (Loop) |
| **R** | Bật / Tắt chế độ ghi âm hợp âm (Record) |
| **M** | Bật / Tắt Mêtrônôm |

---

## 🚀 Hướng Dẫn Đưa Lên GitHub Pages (Miễn Phí 100%)

Dự án này là web tĩnh (Static Web App), bạn có thể đưa lên GitHub Pages trong vòng 1 phút theo các bước sau:

### Bước 1: Khởi tạo Git và đẩy mã nguồn lên GitHub
Mở terminal trong thư mục dự án và chạy:

```bash
git init
git add .
git commit -m "Initial commit: ChordFlow web app"
git branch -M main
git remote add origin https://github.com/TÊN_TÀI_KHOẢN_CỦA_BẠN/TÊN_REPO.git
git push -u origin main
```

### Bước 2: Bật GitHub Pages
1. Truy cập vào kho chứa (Repository) của bạn trên GitHub.
2. Nhấp vào tab **Settings** (Cài đặt) ở thanh trên cùng.
3. Ở menu bên trái, chọn mục **Pages**.
4. Tại phần **Build and deployment** -> **Source**: chọn **Deploy from a branch**.
5. Dưới mục **Branch**: chọn nhánh `main` và thư mục `/ (root)`, sau đó bấm **Save**.
6. Chờ khoảng 30 - 60 giây, GitHub sẽ cung cấp cho bạn một đường link web dạng:
   `https://<ten-tai-khoan>.github.io/<ten-repo>/`

Bây giờ bạn có thể mở web app trên cả máy tính và điện thoại để sáng tác nhạc mọi lúc mọi nơi!

---

## 🛠️ Cấu Trúc Dự Án

```
Chord_generate/
├── index.html        # Giao diện chính responsive
├── css/
│   └── style.css     # Thiết kế giao diện phòng thu âm nhạc (Studio dark mode)
├── js/
│   ├── theory.js     # Engine nhạc lý (nốt, âm giai, hợp âm, voicing)
│   ├── audio.js      # Web Audio API (polyphony, piano synth, reverb, metronome)
│   ├── circle.js     # Vòng tròn bậc 5 SVG tương tác
│   ├── sequencer.js  # Bộ lập trình vòng hòa thanh, looper & tap tempo
│   ├── midi.js       # Bộ tạo và xuất file chuẩn MIDI (.mid)
│   └── app.js        # Điều phối giao diện và sự kiện
├── .gitignore
└── README.md         # Hướng dẫn chi tiết
```

---

*Chúc bạn có thật nhiều cảm hứng và sáng tác nên những giai điệu tuyệt vời cùng ChordFlow!* 🎹✨
