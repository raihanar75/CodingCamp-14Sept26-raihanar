# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi dilakukan secara bertahap dalam satu file `js/app.js` (plus `index.html` dan `css/style.css`) menggunakan Vanilla JavaScript murni tanpa framework dan tanpa bundler. Setiap langkah membangun di atas langkah sebelumnya, dimulai dari fondasi data dan validasi, lalu naik ke layer UI dan chart, dan diakhiri dengan fitur-fitur opsional.

---

## Tasks

- [x] 1. Buat struktur file proyek dan kerangka HTML
  - Buat file `index.html` dengan struktur semantic HTML: section untuk form input, daftar transaksi, total saldo, dan container chart
  - Buat file `css/style.css` dengan layout dasar (flexbox/grid), styling form, daftar, tombol, dan toast notifikasi
  - Buat file `js/app.js` kosong dengan komentar blok section: `// === STORAGE ===`, `// === VALIDATOR ===`, `// === FORMATTER ===`, `// === STATE ===`, `// === UI ===`, `// === INIT ===`
  - Tambahkan tag `<script type="module" src="js/app.js">` di `index.html` dan CDN Chart.js
  - _Requirements: 6.3, 6.4_

- [x] 2. Implementasi modul `StorageManager` dan `Formatter`
  - [x] 2.1 Implementasi `StorageManager`
    - Tulis fungsi `StorageManager.isAvailable()`, `StorageManager.save(key, data)`, dan `StorageManager.load(key)` dalam section `// === STORAGE ===` di `js/app.js`
    - Tangani `DOMException` pada `save` dan `SyntaxError` pada `load` sesuai strategi error handling di desain
    - Definisikan konstanta `STORAGE_KEY_TRANSACTIONS`, `STORAGE_KEY_THEME`, `STORAGE_KEY_THRESHOLD`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_


  - [x] 2.3 Implementasi `Formatter.toRupiah`
    - Tulis fungsi `Formatter.toRupiah(amount)` menggunakan `Intl.NumberFormat` locale `id-ID` atau pemformatan manual dengan pemisah titik
    - Pastikan output diawali `"Rp "` tanpa desimal
    - _Requirements: 3.1, 4.4_


- [x] 3. Implementasi modul `Validator`
  - [x] 3.1 Implementasi fungsi-fungsi validasi
    - Tulis `Validator.validateNamaItem`, `Validator.validateJumlah`, `Validator.validateKategori`, `Validator.validateThreshold`, dan `Validator.validateTransactionData` dalam section `// === VALIDATOR ===`
    - Terapkan aturan: `namaItem` non-kosong setelah trim max 100 karakter; `jumlah` integer positif 1–999999999; `kategori` salah satu dari `['Makanan', 'Transportasi', 'Hiburan']`; `threshold` integer 0–999999999
    - _Requirements: 1.2, 1.3, 1.4, 9.3_

- [x] 4. Checkpoint — Pastikan semua tes validator dan formatter lulus
  - Pastikan semua tests lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 5. Implementasi `StateManager`
  - [x] 5.1 Implementasi fungsi-fungsi state inti
    - Tulis `StateManager.getTransactions()`, `StateManager.addTransaction(data)`, `StateManager.deleteTransaction(id)`, `StateManager.getTotal()`, `StateManager.getByCategory()`, dan `StateManager.getByMonth()` dalam section `// === STATE ===`
    - Implementasi `generateId()` menggunakan pola `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    - Tulis `StateManager.loadFromStorage()` dan `StateManager.persistToStorage()` yang memanggil `StorageManager`
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.1, 7.1, 7.3_


- [x] 6. Implementasi UI Renderer — Daftar Transaksi dan Total Saldo
  - [x] 6.1 Implementasi `renderTransactionList` dan `renderEmptyState`
    - Tulis `renderTransactionList(transactions)` yang menghasilkan baris HTML per transaksi dengan nama item, jumlah terformat, kategori, dan tombol hapus
    - Tulis `renderEmptyState()` yang menampilkan teks `"Belum ada transaksi. Tambahkan pengeluaran pertama Anda!"`
    - Pastikan container daftar memiliki `max-height` dan `overflow-y: auto` di CSS untuk scrollable list saat > 6 item
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 6.2 Implementasi `renderTotalSaldo`
    - Tulis `renderTotalSaldo(total)` yang memperbarui elemen total saldo menggunakan `Formatter.toRupiah`
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.3 Implementasi `showNotification`, `showFieldError`, dan `clearFieldErrors`
    - Tulis `showNotification(message, type, duration)` yang menampilkan toast di pojok layar dengan animasi CSS masuk/keluar dan auto-dismiss setelah durasi (default 3000ms)
    - Tulis `showFieldError(fieldId, message)` dan `clearFieldErrors()` untuk inline error di bawah field form
    - _Requirements: 1.3, 1.4, 2.4, 2.6_

- [x] 7. Implementasi Form Input dan event handler
  - [x] 7.1 Hubungkan Form_Input dengan Validator dan StateManager
    - Tulis event listener `submit` pada form yang memanggil `Validator.validateTransactionData`, menampilkan error per field jika gagal, atau memanggil `StateManager.addTransaction` jika valid
    - Setelah transaksi berhasil ditambahkan: reset form, kembalikan fokus ke field nama item, panggil `renderAll()`, tampilkan notifikasi sukses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Implementasi tombol hapus dengan dialog konfirmasi
    - Gunakan event delegation pada container daftar untuk menangkap klik tombol hapus
    - Tampilkan `window.confirm()` atau dialog inline; jika dikonfirmasi panggil `StateManager.deleteTransaction(id)` lalu `renderAll()`
    - _Requirements: 3.3, 3.4_

- [x] 8. Implementasi `renderChart` menggunakan Chart.js
  - [x] 8.1 Implementasi `renderChart` dengan Chart.js
    - Tulis `renderChart(byCategory)` yang membuat atau memperbarui instance `Chart` pada elemen `<canvas>`
    - Tetapkan warna tetap per kategori: `Makanan` → warna A, `Transportasi` → warna B, `Hiburan` → warna C (tidak bergantung urutan data)
    - Konfigurasi tooltip untuk menampilkan nama kategori dan total dalam format `Rp X.XXX`
    - Tangani kasus data kosong dengan menghancurkan chart dan menampilkan teks placeholder `"Belum ada data pengeluaran"`
    - Tangani CDN Chart.js tidak termuat: cek `window.Chart`, tampilkan teks fallback jika tidak ada
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Hubungkan semua komponen — fungsi `renderAll` dan inisialisasi
  - [x] 9.1 Implementasi `renderAll` dan logika inisialisasi aplikasi
    - Tulis fungsi `renderAll()` yang memanggil `renderTransactionList`, `renderTotalSaldo`, `renderChart`, dan `renderMonthlySummary` (jika aktif) secara berurutan
    - Tulis blok `// === INIT ===` yang memanggil `StateManager.loadFromStorage()` lalu `renderAll()` saat DOM siap (`DOMContentLoaded`)
    - Pasang `window.onerror` dan `window.onunhandledrejection` yang mencatat error ke konsol tanpa crash UI
    - _Requirements: 2.3, 5.3, 6.1_

- [x] 10. Checkpoint — Pastikan fitur inti berjalan end-to-end
  - Pastikan semua tests lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 11. Implementasi fitur opsional: `renderMonthlySummary`
  - [x] 11.1 Implementasi `renderMonthlySummary`
    - Tulis `renderMonthlySummary(byMonth)` yang merender daftar bulan dengan total pengeluaran terformat, diurutkan dari terbaru ke terlama
    - Tampilkan hanya bulan yang memiliki setidaknya satu transaksi
    - _Requirements: 7.1, 7.2, 7.3_

- [~] 12. Implementasi fitur opsional: `ThemeManager`
  - [ ] 12.1 Implementasi `ThemeManager` dan tombol toggle
    - Tulis `ThemeManager.apply(theme)`, `ThemeManager.toggle()`, `ThemeManager.getPreferred()` yang bekerja dengan class `dark-mode` pada `<body>` dan menyimpan preferensi via `StorageManager`
    - Tambahkan tombol toggle di HTML dan hubungkan event listener-nya
    - Tambahkan CSS untuk palet warna gelap di `style.css`
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 13. Implementasi fitur opsional: Highlight pengeluaran melebihi batas
  - [ ] 13.1 Implementasi highlight threshold
    - Tambahkan field input threshold di HTML dan event listener yang memvalidasi input via `Validator.validateThreshold`
    - Simpan nilai threshold ke `StorageManager` saat valid; jika tidak valid tampilkan error dan pertahankan nilai sebelumnya
    - Modifikasi `renderTransactionList` agar menambahkan class CSS highlight pada baris yang jumlahnya melebihi threshold
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 14. Final checkpoint — Pastikan semua tes lulus dan fitur terintegrasi
  - Pastikan semua tests lulus, tanyakan kepada pengguna jika ada pertanyaan.

---

## Notes

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan persyaratan spesifik untuk keterlacakan
- Property tests menggunakan `fast-check` dimuat via CDN di file test harness HTML terpisah (misal `tests/index.html`)
- Setiap property test HARUS menyertakan tag komentar referensi: `// Feature: expense-budget-visualizer, Property {n}: {judul}`
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke layer berikutnya
- Fitur opsional (Task 11–13) dapat diimplementasi dalam urutan apapun setelah Task 10

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "6.1", "6.2", "6.3"] },
    { "id": 5, "tasks": ["7.1", "7.2", "8.1"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["11.1", "12.1", "13.1"] }
  ]
}
```
