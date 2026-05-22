# Data Flow Diagram (DFD)

## 1. Informasi Dokumen

| Item | Keterangan |
| --- | --- |
| Nama Sistem | Dashboard Asuransi PT Kuda Jaya Abadi |
| Jenis Dokumen | Data Flow Diagram (DFD) |
| Versi | 1.0 |
| Tanggal | 21 Mei 2026 |
| Penyusun | Tim Pengembang |

## 2. Tujuan

Dokumen Data Flow Diagram (DFD) ini dibuat untuk menggambarkan aliran data pada sistem Dashboard Asuransi PT Kuda Jaya Abadi. DFD menjelaskan bagaimana data masuk ke sistem, diproses, disimpan, dan ditampilkan kembali kepada pengguna.

## 3. External Entity

| Entity | Deskripsi |
| --- | --- |
| User | Pengguna sistem yang mengelola customer, kendaraan, pembayaran, renewal, quotation, invoice, dan kwitansi |
| Backend/API | Layanan server yang menerima request dari dashboard dan menghubungkan sistem dengan database |
| Database | Tempat penyimpanan data user, customer, kendaraan, pembayaran, renewal, dan dokumen |

## 4. Data Store

| Kode | Data Store | Isi Data |
| --- | --- | --- |
| D1 | Data User | Username, email, password terenkripsi, dan profil user |
| D2 | Data Customer | Identitas customer, alamat, kontak, dan data nasabah |
| D3 | Data Kendaraan | Data mobil, nomor plat, pemilik, nilai kendaraan, polis, foto, dan dokumen kendaraan |
| D4 | Data Pembayaran | Data pembayaran premi, nominal, status pembayaran, dan bukti pembayaran |
| D5 | Data Renewal | Data perpanjangan polis, periode baru, premi, status, dan catatan |
| D6 | Data Dokumen | Data quotation, invoice, kwitansi, dan profil perusahaan |

## 5. Context Diagram

Context Diagram menggambarkan sistem sebagai satu proses utama yang berinteraksi dengan pengguna dan penyimpanan data melalui backend/API.

```mermaid
flowchart LR
    user[User]
    system((Dashboard Asuransi<br/>PT Kuda Jaya Abadi))
    api[Backend/API]
    db[(Database)]

    user -->|Login, input data, permintaan laporan/dokumen| system
    system -->|Dashboard, daftar data, notifikasi, PDF/CSV, pesan status| user

    system -->|Request data dan transaksi| api
    api -->|Response data dan status proses| system
    api -->|Simpan, ubah, hapus, ambil data| db
    db -->|Data tersimpan| api
```

## 6. DFD Level 0

DFD Level 0 memecah sistem menjadi beberapa proses utama berdasarkan fitur aplikasi.

```mermaid
flowchart LR
    user[User]

    p1((1.0<br/>Autentikasi))
    p2((2.0<br/>Manajemen Customer))
    p3((3.0<br/>Manajemen Kendaraan))
    p4((4.0<br/>Manajemen Pembayaran))
    p5((5.0<br/>Manajemen Renewal))
    p6((6.0<br/>Pembuatan Dokumen))
    p7((7.0<br/>Dashboard & Notifikasi))

    d1[(D1 Data User)]
    d2[(D2 Data Customer)]
    d3[(D3 Data Kendaraan)]
    d4[(D4 Data Pembayaran)]
    d5[(D5 Data Renewal)]
    d6[(D6 Data Dokumen)]

    user -->|Username/email dan password| p1
    p1 -->|Status login dan token akses| user
    p1 <--> d1

    user -->|Data customer| p2
    p2 -->|Daftar/detail customer| user
    p2 <--> d2

    user -->|Data kendaraan, polis, foto, dokumen| p3
    p3 -->|Daftar/detail kendaraan dan status polis| user
    p3 <--> d3
    p3 -->|Relasi pemilik kendaraan| d2

    user -->|Data pembayaran dan bukti bayar| p4
    p4 -->|Status pembayaran dan detail pembayaran| user
    p4 <--> d4
    p4 -->|Data customer terkait| d2

    user -->|Data renewal polis| p5
    p5 -->|Status renewal dan detail renewal| user
    p5 <--> d5
    p5 -->|Update periode polis kendaraan| d3
    p5 -->|Relasi customer| d2
    p5 -->|Relasi payment jika ada| d4

    user -->|Data quotation, invoice, kwitansi| p6
    p6 -->|PDF quotation, invoice, kwitansi| user
    p6 <--> d6
    p6 -->|Ambil data customer| d2
    p6 -->|Ambil data kendaraan| d3

    user -->|Permintaan ringkasan dan export| p7
    p7 -->|Statistik, chart, CSV, notifikasi jatuh tempo| user
    p7 -->|Ambil data customer| d2
    p7 -->|Ambil data kendaraan| d3

```

## 7. DFD Level 1 - Autentikasi

```mermaid
flowchart LR
    user[User]
    p11((1.1<br/>Input Kredensial))
    p12((1.2<br/>Validasi Login))
    p13((1.3<br/>Buat Token Akses))
    p14((1.4<br/>Logout))
    d1[(D1 Data User)]

    user -->|Username/email dan password| p11
    p11 -->|Data login| p12
    p12 -->|Cek akun dan role| d1
    d1 -->|Data user valid/tidak valid| p12
    p12 -->|Login valid| p13
    p13 -->|Token akses dan data user| user
    p12 -->|Pesan login gagal| user
    user -->|Perintah logout| p14
    p14 -->|Hapus token/session| user
```

## 8. DFD Level 1 - Manajemen Customer

```mermaid
flowchart LR
    user[User]
    p21((2.1<br/>Tambah Customer))
    p22((2.2<br/>Lihat Customer))
    p23((2.3<br/>Edit Customer))
    p24((2.4<br/>Hapus Customer))
    p25((2.5<br/>Cari Customer))
    d2[(D2 Data Customer)]

    user -->|Input data customer| p21
    p21 -->|Data customer baru| d2
    d2 -->|Konfirmasi simpan| p21
    p21 -->|Pesan sukses/error| user

    user -->|Permintaan daftar/detail| p22
    p22 -->|Ambil data customer| d2
    d2 -->|Daftar/detail customer| p22
    p22 -->|Data customer| user

    user -->|Perubahan data customer| p23
    p23 -->|Update data customer| d2
    d2 -->|Konfirmasi update| p23
    p23 -->|Pesan sukses/error| user

    user -->|Perintah hapus customer| p24
    p24 -->|Hapus data customer| d2
    d2 -->|Konfirmasi hapus| p24
    p24 -->|Pesan sukses/error| user

    user -->|Kata kunci pencarian| p25
    p25 -->|Filter data customer| d2
    d2 -->|Hasil pencarian| p25
    p25 -->|Daftar customer terfilter| user
```

## 9. DFD Level 1 - Manajemen Kendaraan

```mermaid
flowchart LR
    user[User]
    p31((3.1<br/>Tambah Kendaraan))
    p32((3.2<br/>Lihat Kendaraan))
    p33((3.3<br/>Edit Kendaraan))
    p34((3.4<br/>Hapus Kendaraan))
    p35((3.5<br/>Upload Foto/Dokumen))
    p36((3.6<br/>Hitung Status Polis))
    d2[(D2 Data Customer)]
    d3[(D3 Data Kendaraan)]

    user -->|Data kendaraan dan polis| p31
    p31 -->|Cek pemilik/customer| d2
    p31 -->|Simpan kendaraan| d3
    d3 -->|Konfirmasi simpan| p31
    p31 -->|Pesan sukses/error| user

    user -->|Permintaan daftar/detail kendaraan| p32
    p32 -->|Ambil data kendaraan| d3
    d3 -->|Data kendaraan| p32
    p32 -->|Daftar/detail kendaraan| user

    user -->|Perubahan data kendaraan| p33
    p33 -->|Update kendaraan| d3
    d3 -->|Konfirmasi update| p33
    p33 -->|Pesan sukses/error| user

    user -->|Perintah hapus kendaraan| p34
    p34 -->|Hapus kendaraan| d3
    d3 -->|Konfirmasi hapus| p34
    p34 -->|Pesan sukses/error| user

    user -->|File foto/dokumen| p35
    p35 -->|Simpan file kendaraan| d3
    d3 -->|URL/path file| p35
    p35 -->|Status upload| user

    p32 -->|Tanggal jatuh tempo polis| p36
    p36 -->|Status Aktif/Segera Jatuh Tempo/Expired/Cancelled| user
```

## 10. DFD Level 1 - Pembayaran dan Renewal

```mermaid
flowchart LR
    user[User]
    p41((4.1<br/>Tambah Pembayaran))
    p42((4.2<br/>Update Status Pembayaran))
    p43((4.3<br/>Upload Bukti Bayar))
    p51((5.1<br/>Buat Renewal))
    p52((5.2<br/>Batalkan Renewal))
    p53((5.3<br/>Complete Renewal))
    d2[(D2 Data Customer)]
    d3[(D3 Data Kendaraan)]
    d4[(D4 Data Pembayaran)]
    d5[(D5 Data Renewal)]

    user -->|Data pembayaran| p41
    p41 -->|Relasi customer| d2
    p41 -->|Simpan pembayaran| d4
    d4 -->|Status simpan| p41
    p41 -->|Pesan sukses/error| user

    user -->|Perubahan status pembayaran| p42
    p42 -->|Update pembayaran| d4
    d4 -->|Status update| p42
    p42 -->|Status pembayaran terbaru| user

    user -->|File bukti pembayaran| p43
    p43 -->|Simpan bukti pembayaran| d4
    d4 -->|Status upload| p43
    p43 -->|Pesan sukses/error| user

    user -->|Data renewal polis| p51
    p51 -->|Cek customer| d2
    p51 -->|Cek polis kendaraan| d3
    p51 -->|Relasi payment opsional| d4
    p51 -->|Simpan renewal| d5
    d5 -->|Data renewal baru| p51
    p51 -->|Pesan sukses/error| user

    user -->|Perintah batalkan renewal| p52
    p52 -->|Update status Cancelled| d5
    d5 -->|Status renewal| p52
    p52 -->|Pesan sukses/error| user

    user -->|Perintah complete renewal| p53
    p53 -->|Update status Completed| d5
    p53 -->|Update periode polis baru| d3
    d5 -->|Status renewal selesai| p53
    d3 -->|Data polis diperbarui| p53
    p53 -->|Pesan sukses/error| user
```

## 11. DFD Level 1 - Pembuatan Dokumen

```mermaid
flowchart LR
    user[User]
    p61((6.1<br/>Pilih Objek Asuransi))
    p62((6.2<br/>Input Data Quotation))
    p63((6.3<br/>Input Data Invoice))
    p64((6.4<br/>Input Data Kwitansi))
    p65((6.5<br/>Generate PDF/Dokumen))
    d2[(D2 Data Customer)]
    d3[(D3 Data Kendaraan)]
    d6[(D6 Data Dokumen)]

    user -->|Cari/pilih customer atau kendaraan| p61
    p61 -->|Ambil customer| d2
    p61 -->|Ambil kendaraan| d3
    d2 -->|Data customer| p61
    d3 -->|Data kendaraan| p61
    p61 -->|Objek terpilih| user

    user -->|Coverage, premi, biaya quotation| p62
    p62 -->|Data quotation| p65

    user -->|Item invoice, nominal, informasi tambahan| p63
    p63 -->|Data invoice| p65

    user -->|Penerima, nominal, keterangan kwitansi| p64
    p64 -->|Data kwitansi| p65

    p65 -->|Simpan metadata dokumen jika diperlukan| d6
    p65 -->|PDF quotation/invoice/kwitansi| user
```

## 12. DFD Level 1 - Dashboard dan Notifikasi

```mermaid
flowchart LR
    user[User]
    p71((7.1<br/>Ambil Data Ringkasan))
    p72((7.2<br/>Hitung Statistik))
    p73((7.3<br/>Tampilkan Grafik))
    p74((7.4<br/>Export CSV))
    p75((7.5<br/>Cek Jatuh Tempo Polis))
    d2[(D2 Data Customer)]
    d3[(D3 Data Kendaraan)]

    user -->|Buka dashboard/refresh| p71
    p71 -->|Ambil customer| d2
    p71 -->|Ambil kendaraan| d3
    d2 -->|Data customer| p71
    d3 -->|Data kendaraan| p71
    p71 -->|Data mentah| p72
    p72 -->|Statistik polis dan kendaraan| p73
    p73 -->|Chart dan ringkasan dashboard| user

    user -->|Klik export CSV| p74
    p74 -->|Ambil data kendaraan| d3
    d3 -->|Data kendaraan| p74
    p74 -->|File CSV| user

    p71 -->|Tanggal jatuh tempo kendaraan| p75
    p75 -->|Notifikasi expired/jatuh tempo| user
```

## 13. Kamus Aliran Data

| Aliran Data | Isi Data |
| --- | --- |
| Data Login | Username/email, password |
| Token Akses | Token autentikasi untuk mengakses endpoint protected |
| Data Customer | Nama, alamat, kontak, email, dan informasi identitas customer |
| Data Kendaraan | Merek, model, nomor plat, harga, pemilik, tanggal jatuh tempo polis, status |
| File Kendaraan | Foto kendaraan dan dokumen pendukung seperti STNK/SIM/KTP |
| Data Pembayaran | Customer, nominal pembayaran, tanggal pembayaran, status, bukti bayar |
| Data Renewal | Customer, tipe polis, polis lama, periode baru, premi, payment, status, catatan |
| Data Quotation | Objek asuransi, coverage, premi, biaya tambahan, profil perusahaan |
| Data Invoice | Objek asuransi, item biaya, nominal, total, profil perusahaan |
| Data Kwitansi | Penerima, nominal, tanggal, keterangan pembayaran |
| Data Dashboard | Statistik kendaraan, status polis, chart, daftar data terbaru |
| Data Notifikasi | Polis expired dan polis yang akan jatuh tempo |
| Data User | Username, email, password terenkripsi, dan profil user |

## 14. Catatan

1. DFD ini dibuat berdasarkan fitur pada aplikasi dashboard dan endpoint API yang digunakan oleh frontend.
2. Penyimpanan fisik data dilakukan melalui Backend/API dan database aplikasi.
3. Dokumen quotation, invoice, dan kwitansi dihasilkan oleh sistem dalam bentuk file PDF/dokumen yang dapat digunakan oleh user.
4. Sistem digunakan oleh user sebagai pengguna utama tanpa modul pengelolaan pengguna terpisah.
