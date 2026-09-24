# FenyHub

Aplikasi web sederhana yang menggabungkan:

1. Expense Tracker
2. Bookmark Manager
3. Quiz App

## Struktur

```text
FenyHub-hub/
├── index.html
└── assets/
    └── script.js
```

## Fitur

### Expense Tracker
- CRUD transaksi
- Pemasukan dan pengeluaran
- Ringkasan saldo
- Search
- Filter tipe
- Sort
- Validasi nominal
- Modal tambah/edit
- localStorage terpisah

### Bookmark Manager
- CRUD bookmark
- Validasi URL http/https
- Buka link di tab baru
- Search
- Sort
- Modal tambah/edit
- localStorage terpisah

### Quiz App
- 6 soal dalam array object
- Perhitungan skor
- High score dengan localStorage
- Bisa mengulang quiz

### Tab
Tab aktif disimpan pada query string:

```text
?tab=expense
?tab=bookmark
?tab=quiz
```

State tab tidak menggunakan localStorage.

## Menjalankan

Buka `index.html` di browser. Tidak membutuhkan backend atau fetch.
