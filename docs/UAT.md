# Dokumen User Acceptance Test (UAT)

## 1. Informasi Dokumen

| Item | Keterangan |
| --- | --- |
| Nama Sistem | Dashboard Asuransi PT Kuda Jaya Abadi |
| Jenis Pengujian | User Acceptance Test (UAT) |
| Versi Dokumen | 1.0 |
| Tanggal UAT | 21 Mei 2026 |
| Penyusun | Tim Pengembang |
| Penguji | Perwakilan pengguna |

## 2. Tujuan UAT

User Acceptance Test dilakukan untuk memastikan sistem Dashboard Asuransi PT Kuda Jaya Abadi sudah sesuai dengan kebutuhan pengguna, khususnya dalam pengelolaan data customer, kendaraan, pembayaran, renewal polis, dokumen quotation, invoice, dan kwitansi.

UAT ini berfokus pada validasi fitur dari sudut pandang pengguna akhir, bukan pengujian teknis kode program.

## 3. Ruang Lingkup

Fitur yang diuji pada UAT ini meliputi:

1. Login dan logout pengguna.
2. Dashboard ringkasan data kendaraan dan status polis.
3. Notifikasi polis kendaraan yang expired atau mendekati jatuh tempo.
4. Manajemen data customer.
5. Manajemen data kendaraan.
6. Manajemen pembayaran.
7. Manajemen renewal polis.
8. Pembuatan quotation PDF.
9. Pembuatan invoice PDF.
10. Pembuatan kwitansi.
11. Navigasi dan akses halaman utama sistem.

## 4. Kriteria Penerimaan

Sistem dinyatakan diterima apabila:

1. Pengguna dapat login menggunakan kredensial yang valid.
2. Pengguna tidak dapat masuk menggunakan kredensial yang salah.
3. Data utama dapat ditampilkan, ditambahkan, diubah, dan dihapus sesuai hak akses.
4. Sistem menampilkan pesan sukses atau error yang sesuai setelah aksi dilakukan.
5. Dokumen quotation, invoice, dan kwitansi dapat dibuat atau diunduh.
6. Notifikasi jatuh tempo polis tampil sesuai data kendaraan.
7. Tidak ditemukan error kritis yang menghambat alur kerja utama.

## 5. Environment Pengujian

| Komponen | Keterangan |
| --- | --- |
| Browser | Google Chrome / Microsoft Edge versi terbaru |
| Perangkat | Laptop/PC dan perangkat mobile untuk pengecekan responsif |
| Frontend | React + Vite |
| Backend/API | Endpoint API sesuai konfigurasi sistem |
| Database | Database aplikasi PT Kuda Jaya Abadi |
| Role Uji | User |

## 6. Data Uji

| Data | Contoh |
| --- | --- |
| Akun user | user terdaftar yang dapat mengakses sistem |
| Customer | Nama, nomor telepon, email, alamat, dan identitas customer |
| Kendaraan | Merek, model, nomor plat, pemilik, harga, tanggal jatuh tempo polis |
| Pembayaran | Customer, nominal, status pembayaran, bukti pembayaran |
| Renewal | Customer, tipe polis, periode baru, premi, status renewal |
| Dokumen | Data perusahaan, item polis, nilai premi, biaya tambahan |

## 7. Skenario UAT

### A. Autentikasi

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-001 | Login berhasil | Buka halaman login, isi email/username dan password valid, klik Masuk | Pengguna masuk ke dashboard dan muncul pesan selamat datang | Belum diuji |
| UAT-002 | Login gagal | Isi email/username atau password yang salah, klik Masuk | Sistem menolak login dan menampilkan pesan error | Belum diuji |
| UAT-003 | Validasi field login | Kosongkan email/username atau password | Sistem menampilkan validasi bahwa field wajib diisi | Belum diuji |
| UAT-004 | Logout | Klik tombol Logout pada sidebar | Session pengguna berakhir dan sistem kembali ke halaman login | Belum diuji |

### B. Dashboard dan Navigasi

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-005 | Menampilkan dashboard | Login lalu buka menu Dashboard | Sistem menampilkan ringkasan data kendaraan, statistik polis, chart, dan daftar kendaraan | Belum diuji |
| UAT-006 | Refresh data dashboard | Klik tombol Refresh pada dashboard | Data dashboard dimuat ulang tanpa error | Belum diuji |
| UAT-007 | Export CSV dashboard | Klik tombol Export CSV | File CSV kendaraan berhasil diunduh dengan kolom yang sesuai | Belum diuji |
| UAT-008 | Navigasi sidebar | Klik menu Customers, Kendaraan, Payment, Renewal, Quotation, Invoice, dan Kwitansi | Sistem berpindah ke halaman yang dipilih | Belum diuji |
| UAT-009 | Notifikasi jatuh tempo | Klik ikon lonceng notifikasi | Sistem menampilkan daftar polis expired atau akan jatuh tempo jika ada | Belum diuji |

### C. Manajemen Customer

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-010 | Menampilkan daftar customer | Buka menu Customers | Sistem menampilkan daftar customer yang tersimpan | Belum diuji |
| UAT-011 | Tambah customer | Klik tambah customer, isi form dengan data valid, simpan | Data customer baru tersimpan dan muncul pada daftar | Belum diuji |
| UAT-012 | Lihat detail customer | Klik salah satu customer pada daftar | Sistem menampilkan detail customer beserta data terkait | Belum diuji |
| UAT-013 | Edit customer | Buka halaman edit customer, ubah data, simpan | Perubahan data customer berhasil tersimpan | Belum diuji |
| UAT-014 | Hapus customer | Pilih customer, jalankan aksi hapus, konfirmasi | Data customer terhapus dari daftar | Belum diuji |
| UAT-015 | Cari customer | Masukkan kata kunci pada pencarian customer | Daftar customer terfilter sesuai kata kunci | Belum diuji |

### D. Manajemen Kendaraan

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-016 | Menampilkan daftar kendaraan | Buka menu Kendaraan | Sistem menampilkan daftar kendaraan beserta status polis | Belum diuji |
| UAT-017 | Tambah kendaraan | Klik tambah kendaraan, pilih customer, isi data kendaraan dan polis, simpan | Kendaraan baru tersimpan dan tampil di daftar | Belum diuji |
| UAT-018 | Upload foto kendaraan | Pada form kendaraan, unggah foto kendaraan | Foto berhasil diunggah dan terkait dengan data kendaraan | Belum diuji |
| UAT-019 | Upload dokumen kendaraan | Unggah dokumen STNK/SIM/KTP atau dokumen terkait | Dokumen berhasil diunggah dan tersimpan | Belum diuji |
| UAT-020 | Lihat detail kendaraan | Klik detail kendaraan | Sistem menampilkan informasi kendaraan, pemilik, polis, foto, dan dokumen | Belum diuji |
| UAT-021 | Edit kendaraan | Ubah data kendaraan lalu simpan | Perubahan data kendaraan berhasil tersimpan | Belum diuji |
| UAT-022 | Hapus kendaraan | Pilih kendaraan, hapus, lalu konfirmasi | Kendaraan terhapus dari daftar | Belum diuji |
| UAT-023 | Status polis kendaraan | Masukkan data due date aktif, kurang dari 30 hari, dan lewat tanggal | Sistem menampilkan status Aktif, Segera Jatuh Tempo, atau Expired sesuai tanggal | Belum diuji |

### E. Manajemen Pembayaran

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-024 | Menampilkan daftar pembayaran | Buka menu Payment | Sistem menampilkan daftar pembayaran | Belum diuji |
| UAT-025 | Tambah pembayaran | Klik tambah pembayaran, isi data customer, nominal, dan status, simpan | Data pembayaran tersimpan | Belum diuji |
| UAT-026 | Upload bukti pembayaran | Pilih pembayaran, unggah file bukti pembayaran | Bukti pembayaran berhasil diunggah | Belum diuji |
| UAT-027 | Lihat detail pembayaran | Klik salah satu pembayaran | Sistem menampilkan detail pembayaran | Belum diuji |
| UAT-028 | Edit status pembayaran | Ubah status pembayaran lalu simpan | Status pembayaran diperbarui | Belum diuji |
| UAT-029 | Hapus pembayaran | Pilih pembayaran, hapus, lalu konfirmasi | Data pembayaran terhapus | Belum diuji |

### F. Manajemen Renewal

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-030 | Menampilkan daftar renewal | Buka menu Renewal | Sistem menampilkan daftar renewal beserta statusnya | Belum diuji |
| UAT-031 | Buat renewal | Klik Buat Renewal, isi customer, tipe polis, periode baru, premi, dan catatan | Renewal baru berhasil dibuat | Belum diuji |
| UAT-032 | Filter renewal | Pilih filter status atau gunakan pencarian | Daftar renewal terfilter sesuai status/kata kunci | Belum diuji |
| UAT-033 | Lihat detail renewal | Klik detail renewal | Sistem menampilkan informasi renewal secara lengkap | Belum diuji |
| UAT-034 | Batalkan renewal | Pilih renewal yang belum completed/cancelled, klik Batalkan Renewal | Status renewal berubah menjadi Cancelled | Belum diuji |
| UAT-035 | Complete renewal | Jalankan aksi complete renewal pada detail renewal | Status renewal menjadi Completed dan periode polis diperbarui | Belum diuji |

### G. Quotation

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-036 | Membuka halaman quotation | Buka menu Quotation | Sistem menampilkan form pembuatan quotation | Belum diuji |
| UAT-037 | Pilih objek asuransi | Pilih kendaraan atau properti dari dialog pemilihan | Data objek terpilih masuk ke form quotation | Belum diuji |
| UAT-038 | Isi coverage quotation | Isi informasi coverage, premi, dan biaya tambahan | Sistem menghitung dan menampilkan ringkasan quotation | Belum diuji |
| UAT-039 | Preview quotation | Klik Download PDF sampai dialog preview muncul | Preview/ringkasan quotation tampil sebelum download | Belum diuji |
| UAT-040 | Download quotation PDF | Konfirmasi Download PDF | File PDF quotation berhasil diunduh | Belum diuji |

### H. Invoice

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-041 | Membuka halaman invoice | Buka menu Invoice | Sistem menampilkan form pembuatan invoice | Belum diuji |
| UAT-042 | Pilih objek invoice | Pilih kendaraan atau properti dari dialog pemilihan | Data objek terpilih masuk ke invoice | Belum diuji |
| UAT-043 | Tambah item invoice | Tambahkan item biaya/premi pada invoice | Item tampil pada daftar dan total berubah sesuai input | Belum diuji |
| UAT-044 | Preview invoice | Klik Download PDF | Sistem menampilkan preview invoice | Belum diuji |
| UAT-045 | Download invoice PDF | Konfirmasi download dan simpan jika diperlukan | File PDF invoice berhasil diunduh dan data tersimpan jika opsi simpan dipilih | Belum diuji |

### I. Kwitansi

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-046 | Membuka halaman kwitansi | Buka menu Kwitansi | Sistem menampilkan form kwitansi | Belum diuji |
| UAT-047 | Isi data kwitansi | Isi informasi penerima, nominal, keterangan, dan tanggal | Data kwitansi tampil sesuai input | Belum diuji |
| UAT-048 | Cetak/download kwitansi | Jalankan aksi cetak atau download kwitansi | Kwitansi berhasil dibuat dalam format yang dapat digunakan | Belum diuji |

### J. Responsif dan Error Handling

| ID | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| UAT-049 | Tampilan desktop | Buka sistem pada layar laptop/desktop | Layout sidebar, table, dan konten tampil rapi | Belum diuji |
| UAT-050 | Tampilan mobile | Buka sistem pada ukuran layar mobile | Menu drawer, toolbar, dan konten tetap dapat digunakan | Belum diuji |
| UAT-051 | Halaman tidak ditemukan | Buka URL yang tidak tersedia | Sistem menampilkan halaman 404 | Belum diuji |
| UAT-052 | API gagal memuat data | Simulasikan koneksi/API gagal | Sistem menampilkan pesan gagal memuat data atau error yang sesuai | Belum diuji |

## 8. Format Rekap Hasil UAT

| Total Skenario | Lulus | Gagal | Perlu Perbaikan | Keterangan |
| --- | --- | --- | --- | --- |
| 52 |  |  |  |  |

## 9. Catatan Pengujian

| No | ID UAT | Catatan / Temuan | Tindak Lanjut | Status |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

## 10. Kesimpulan

Berdasarkan pelaksanaan User Acceptance Test, sistem Dashboard Asuransi PT Kuda Jaya Abadi dinyatakan:

| Keputusan | Tanda |
| --- | --- |
| Diterima tanpa revisi |  |
| Diterima dengan revisi minor |  |
| Belum diterima dan perlu revisi |  |

Catatan keputusan:

____________________________________________________________________

____________________________________________________________________

____________________________________________________________________

## 11. Persetujuan

| Pihak | Nama | Jabatan | Tanggal | Tanda Tangan |
| --- | --- | --- | --- | --- |
| Penguji/User |  |  |  |  |
| Perwakilan PT Kuda Jaya Abadi |  |  |  |  |
| Pengembang |  |  |  |  |
| Pembimbing |  |  |  |  |
