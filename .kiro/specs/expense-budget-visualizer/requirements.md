# Requirements Document

## Introduction

Expense & Budget Visualizer adalah aplikasi web satu halaman (_single-page web app_) yang memungkinkan pengguna mencatat pengeluaran harian, mengkategorikannya, dan memvisualisasikan distribusi pengeluaran melalui grafik interaktif. Aplikasi dibangun murni menggunakan HTML, CSS, dan Vanilla JavaScript tanpa backend server, serta memanfaatkan Local Storage browser untuk menyimpan data secara persisten di sisi klien.

Tujuan utama aplikasi adalah memberikan gambaran cepat dan visual tentang ke mana uang pengguna pergi, sehingga pengguna dapat membuat keputusan keuangan yang lebih baik tanpa kerumitan aplikasi keuangan enterprise.

---

## Glossary

- **Aplikasi**: Website Expense & Budget Visualizer secara keseluruhan.
- **Pengguna**: Individu yang mengakses dan menggunakan Aplikasi melalui browser.
- **Transaksi**: Satu catatan pengeluaran yang memiliki nama item, jumlah uang, dan kategori.
- **Kategori**: Klasifikasi pengeluaran. Nilai yang valid: `Makanan`, `Transportasi`, `Hiburan`.
- **Daftar_Transaksi**: Komponen UI yang menampilkan seluruh Transaksi yang telah dicatat.
- **Form_Input**: Komponen UI berupa formulir untuk memasukkan data Transaksi baru.
- **Validator**: Komponen logika yang memeriksa kelengkapan dan keabsahan input Pengguna.
- **Penyimpanan**: Browser Local Storage API yang digunakan untuk menyimpan data Transaksi.
- **Total_Saldo**: Komponen UI yang menampilkan akumulasi total pengeluaran seluruh Transaksi.
- **Grafik_Pengeluaran**: Komponen UI berupa pie chart yang menampilkan distribusi pengeluaran per Kategori.
- **Ringkasan_Bulanan**: Komponen UI opsional yang menampilkan total pengeluaran dikelompokkan per bulan.
- **Tema**: Mode tampilan Aplikasi, bernilai `terang` atau `gelap`.

---

## Requirements

### Persyaratan 1: Form Input Transaksi

**User Story:** Sebagai Pengguna, saya ingin mengisi formulir untuk mencatat pengeluaran baru, sehingga saya dapat menyimpan detail setiap transaksi dengan cepat dan mudah.

#### Kriteria Penerimaan

1. THE Form_Input SHALL menampilkan tiga field input: nama item (teks, maksimal 100 karakter), jumlah uang (angka positif, nilai minimum Rp 1, nilai maksimum Rp 999.999.999), dan kategori (dropdown dengan pilihan `Makanan`, `Transportasi`, `Hiburan`).
2. WHEN Pengguna menekan tombol submit, THE Validator SHALL memeriksa bahwa semua field nama item, jumlah uang, dan kategori telah diisi.
3. IF salah satu field kosong saat submit, THEN THE Validator SHALL menampilkan pesan kesalahan spesifik di bawah field yang bermasalah yang menjelaskan field mana yang belum diisi.
4. IF jumlah uang yang dimasukkan bukan angka positif atau di luar rentang yang valid, THEN THE Validator SHALL menampilkan pesan kesalahan yang menyatakan bahwa jumlah harus berupa angka antara Rp 1 dan Rp 999.999.999.
5. WHEN seluruh field valid dan Pengguna menekan tombol submit, THE Form_Input SHALL mengosongkan semua field, mengembalikan fokus ke field nama item, dan menampilkan notifikasi singkat bahwa transaksi berhasil ditambahkan.

---

### Persyaratan 2: Penyimpanan dan Pengambilan Data

**User Story:** Sebagai Pengguna, saya ingin data pengeluaran saya tersimpan secara otomatis, sehingga catatan tetap ada meskipun saya menutup atau me-refresh browser.

#### Kriteria Penerimaan

1. WHEN Pengguna berhasil menambahkan Transaksi baru, THE Penyimpanan SHALL menyimpan seluruh daftar Transaksi terbaru ke Local Storage sebelum memperbarui tampilan.
2. WHEN Pengguna menghapus sebuah Transaksi, THE Penyimpanan SHALL memperbarui data di Local Storage untuk mencerminkan penghapusan tersebut sebelum memperbarui tampilan.
3. WHEN Aplikasi pertama kali dimuat di browser dan data valid ditemukan di Local Storage, THE Penyimpanan SHALL membaca seluruh data Transaksi tersebut dan memuat ulang Daftar_Transaksi ke tampilan.
4. IF Local Storage tidak tersedia atau mengalami kesalahan saat penulisan, THEN THE Penyimpanan SHALL menampilkan notifikasi yang terlihat selama minimal 3 detik kepada Pengguna bahwa data tidak dapat disimpan secara persisten.
5. THE Penyimpanan SHALL menyimpan data Transaksi dalam format JSON yang memuat setidaknya properti: `id` (string unik), `namaItem` (string), `jumlah` (number), `kategori` (string), dan `tanggal` (string ISO 8601).
6. IF data di Local Storage tidak dapat diurai (corrupt atau format tidak valid) saat Aplikasi dimuat, THEN THE Penyimpanan SHALL mengabaikan data tersebut, memulai dengan daftar kosong, dan menampilkan notifikasi kepada Pengguna bahwa data sebelumnya tidak dapat dimuat.

---

### Persyaratan 3: Daftar Transaksi

**User Story:** Sebagai Pengguna, saya ingin melihat semua transaksi yang telah saya catat dalam satu daftar, sehingga saya dapat mereview dan mengelola riwayat pengeluaran saya.

#### Kriteria Penerimaan

1. THE Daftar_Transaksi SHALL menampilkan setiap Transaksi dalam baris terpisah yang memuat nama item, jumlah uang diformat sebagai `Rp X.XXX` (titik sebagai pemisah ribuan, tanpa desimal), dan kategori.
2. WHILE Daftar_Transaksi memiliki lebih dari 6 item yang terlihat, THE Daftar_Transaksi SHALL menyediakan area scrollable dengan tinggi maksimum tetap agar seluruh item dapat dijangkau tanpa mempengaruhi tata letak halaman utama.
3. WHEN Pengguna menekan tombol hapus pada sebuah baris Transaksi, THE Aplikasi SHALL menampilkan konfirmasi (dialog atau inline) sebelum menghapus; IF Pengguna mengonfirmasi, THEN THE Daftar_Transaksi SHALL menghapus baris tersebut dari tampilan; IF Pengguna membatalkan, THEN tidak ada perubahan pada daftar.
4. WHEN sebuah Transaksi dihapus setelah konfirmasi, THE Daftar_Transaksi SHALL memperbarui tampilan daftar dalam waktu kurang dari 100 milidetik tanpa perlu me-reload halaman.
5. IF Daftar_Transaksi kosong, THE Daftar_Transaksi SHALL menampilkan teks "Belum ada transaksi. Tambahkan pengeluaran pertama Anda!" sebagai pengganti daftar.

---

### Persyaratan 4: Total Saldo

**User Story:** Sebagai Pengguna, saya ingin melihat total keseluruhan pengeluaran saya secara real-time, sehingga saya selalu mengetahui berapa total uang yang telah saya keluarkan.

#### Kriteria Penerimaan

1. THE Total_Saldo SHALL menampilkan jumlah akumulasi semua nilai `jumlah` dari seluruh Transaksi yang ada dalam Daftar_Transaksi.
2. WHEN Pengguna berhasil menambahkan Transaksi baru, THE Total_Saldo SHALL memperbarui nilai yang ditampilkan dalam waktu kurang dari 100 milidetik setelah penambahan.
3. WHEN Pengguna berhasil menghapus sebuah Transaksi, THE Total_Saldo SHALL memperbarui nilai yang ditampilkan dalam waktu kurang dari 100 milidetik setelah penghapusan.
4. THE Total_Saldo SHALL memformat nilai yang ditampilkan sebagai `Rp X.XXX` menggunakan titik sebagai pemisah ribuan dan tanpa desimal (contoh: `Rp 150.000`).
5. IF tidak ada Transaksi dalam Daftar_Transaksi, THE Total_Saldo SHALL menampilkan nilai `Rp 0`.

---

### Persyaratan 5: Grafik Distribusi Pengeluaran

**User Story:** Sebagai Pengguna, saya ingin melihat pie chart yang menampilkan distribusi pengeluaran per kategori, sehingga saya dapat memahami secara visual ke mana uang saya paling banyak terpakai.

#### Kriteria Penerimaan

1. THE Grafik_Pengeluaran SHALL menampilkan pie chart dengan satu irisan per Kategori yang memiliki total jumlah lebih dari nol; Kategori dengan total nol SHALL dikecualikan dari chart.
2. THE Grafik_Pengeluaran SHALL menetapkan warna berbeda yang tetap untuk setiap Kategori (`Makanan`, `Transportasi`, `Hiburan`) dan menggunakan warna yang sama secara konsisten di seluruh sesi tanpa bergantung pada urutan data.
3. WHEN Pengguna berhasil menambahkan atau menghapus sebuah Transaksi, THE Grafik_Pengeluaran SHALL memperbarui tampilan chart dalam waktu kurang dari 200 milidetik.
4. WHEN Pengguna mengarahkan kursor (_hover_) ke sebuah irisan chart, THE Grafik_Pengeluaran SHALL menampilkan tooltip yang memuat nama Kategori dan total jumlah pengeluaran untuk Kategori tersebut dalam format `Rp X.XXX`.
5. IF semua Transaksi dihapus sehingga tidak ada data, THE Grafik_Pengeluaran SHALL menampilkan teks placeholder yang terlihat (misalnya "Belum ada data pengeluaran") sebagai pengganti chart.
6. THE Grafik_Pengeluaran SHALL menggunakan library Chart.js atau library chart setara yang dimuat melalui CDN, tanpa dependensi npm atau bundler.

---

### Persyaratan 6: Kompatibilitas dan Performa

**User Story:** Sebagai Pengguna, saya ingin aplikasi berjalan dengan lancar di browser modern yang saya gunakan, sehingga saya tidak mengalami gangguan saat mencatat pengeluaran.

#### Kriteria Penerimaan

1. THE Aplikasi SHALL berjalan tanpa JavaScript console error atau runtime error di versi terbaru browser Chrome, Firefox, Edge, dan Safari.
2. THE Aplikasi SHALL merender tampilan awal yang sepenuhnya dapat digunakan dalam waktu kurang dari 3 detik pada koneksi broadband minimal 10 Mbps.
3. THE Aplikasi SHALL terdiri dari tepat satu file HTML, tepat satu file CSS di dalam folder `css/`, dan tepat satu file JavaScript di dalam folder `js/`.
4. THE Aplikasi SHALL beroperasi sepenuhnya tanpa koneksi backend server; seluruh logika berjalan di sisi klien.
5. WHILE Pengguna berinteraksi dengan Form_Input, Daftar_Transaksi, atau Grafik_Pengeluaran, THE Aplikasi SHALL merespons setiap aksi Pengguna dalam waktu kurang dari 100 milidetik.

---

### Persyaratan 7: Ringkasan Bulanan _(Opsional)_

**User Story:** Sebagai Pengguna, saya ingin melihat ringkasan pengeluaran yang dikelompokkan per bulan, sehingga saya dapat membandingkan pola pengeluaran antar bulan.

#### Kriteria Penerimaan

1. WHERE fitur Ringkasan_Bulanan diaktifkan, THE Ringkasan_Bulanan SHALL menampilkan daftar bulan yang memiliki setidaknya satu Transaksi beserta total pengeluaran bulan tersebut, diurutkan dari bulan terbaru ke terlama.
2. WHERE fitur Ringkasan_Bulanan diaktifkan, WHEN Pengguna menambahkan atau menghapus Transaksi, THE Ringkasan_Bulanan SHALL memperbarui tampilan ringkasan secara otomatis dalam waktu kurang dari 500 milidetik.
3. WHERE fitur Ringkasan_Bulanan diaktifkan, THE Ringkasan_Bulanan SHALL mengelompokkan Transaksi berdasarkan kombinasi bulan dan tahun sehingga bulan yang sama pada tahun berbeda muncul sebagai entri terpisah.

---

### Persyaratan 8: Mode Tampilan Gelap/Terang _(Opsional)_

**User Story:** Sebagai Pengguna, saya ingin dapat beralih antara mode terang dan gelap, sehingga saya dapat menggunakan aplikasi dengan nyaman di berbagai kondisi pencahayaan.

#### Kriteria Penerimaan

1. WHERE fitur toggle Tema diaktifkan, THE Aplikasi SHALL menampilkan tombol toggle yang memungkinkan Pengguna beralih antara Tema `terang` dan `gelap`; Tema default untuk pengguna baru adalah `terang`.
2. WHERE fitur toggle Tema diaktifkan, WHEN Pengguna mengaktifkan Tema `gelap`, THE Aplikasi SHALL mengubah skema warna seluruh antarmuka ke palet warna gelap dalam waktu kurang dari 150 milidetik.
3. WHERE fitur toggle Tema diaktifkan, WHEN Pengguna me-refresh atau membuka kembali Aplikasi, THE Penyimpanan SHALL mempertahankan preferensi Tema terakhir yang dipilih Pengguna.

---

### Persyaratan 9: Highlight Pengeluaran Melebihi Batas _(Opsional)_

**User Story:** Sebagai Pengguna, saya ingin pengeluaran yang melebihi batas tertentu ditandai secara visual, sehingga saya segera menyadari transaksi yang nilainya di luar kebiasaan.

#### Kriteria Penerimaan

1. WHERE fitur highlight batas diaktifkan, THE Daftar_Transaksi SHALL menampilkan setiap Transaksi dengan jumlah melebihi nilai batas yang ditetapkan menggunakan perubahan warna latar belakang baris yang berbeda dari baris normal.
2. WHERE fitur highlight batas diaktifkan, THE Aplikasi SHALL memungkinkan Pengguna menetapkan nilai batas pengeluaran melalui sebuah field input khusus dengan rentang nilai antara Rp 0 dan Rp 999.999.999.
3. WHERE fitur highlight batas diaktifkan, IF Pengguna memasukkan nilai batas yang tidak valid (bukan angka atau di luar rentang), THEN THE Validator SHALL menampilkan pesan kesalahan dan mempertahankan nilai batas sebelumnya.
4. WHERE fitur highlight batas diaktifkan, WHEN Pengguna mengubah nilai batas dengan input valid, THE Daftar_Transaksi SHALL memperbarui seluruh penanda visual di daftar dalam waktu kurang dari 300 milidetik tanpa perlu me-reload halaman.
