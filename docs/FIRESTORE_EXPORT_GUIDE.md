# Firestore Export Guide

## Tujuan

Panduan ini digunakan untuk export data Cloud Firestore ke file JSON agar struktur database dapat dianalisis atau dibagikan ke tool lain seperti Claude.

## Prasyarat

1. Buka Firebase Console.
2. Pilih project `pt-kuda-jaya-abadi`.
3. Masuk ke Project Settings > Service accounts.
4. Klik Generate new private key.
5. Simpan file JSON service account di lokal.

Jangan commit file service account ke Git. `.gitignore` sudah ditambahkan untuk membantu mencegah file credential ikut tersimpan.

## Export Aman untuk Dibagikan

Gunakan mode sanitized agar email, nomor HP, password hash, alamat, URL file, dan data sensitif lain disamarkan.

```bash
node scripts/exportFirestore.mjs --serviceAccount ./nama-file-service-account.json --out docs/firestore-export.sanitized.json --sanitize
```

File hasil export:

```text
docs/firestore-export.sanitized.json
```

## Export Mentah

Gunakan ini hanya untuk kebutuhan internal karena data sensitif tidak disamarkan.

```bash
node scripts/exportFirestore.mjs --serviceAccount ./nama-file-service-account.json --out docs/firestore-export.raw.json
```

## Export Koleksi Tertentu

Kalau data terlalu besar, export koleksi tertentu saja.

```bash
node scripts/exportFirestore.mjs --serviceAccount ./nama-file-service-account.json --out docs/firestore-export.sanitized.json --sanitize --collections users,customers,cars,payments,renewals
```

## Catatan

Script ini mengambil daftar root collections dari Firestore, membaca dokumen di setiap collection, lalu membaca subcollection secara rekursif jika ada.

