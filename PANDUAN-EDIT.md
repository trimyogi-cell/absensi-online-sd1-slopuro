# Panduan Edit Aplikasi Absensi & Nilai SD N 1 Selopuro

Aplikasi web ini (PWA) dikelola lewat file HTML tunggal. Semua tampilan & logika ada di `public/index.html`. Ini panduan singkat untuk mengedit di laptop mana pun.

---

## 1. Lokasi file penting

| File | Fungsi |
|------|--------|
| `public/index.html` | **Semua UI + JavaScript aplikasi** (file utama yang diedit) |
| `public/sw.js` | Service worker (kunci agar update tampil di Android/PWA) |
| `public/manifest.json`, `public/icon-192.svg`, `public/icon-512.svg` | Konfigurasi & ikon PWA |
| `server.js`, `vercel.json`, `railway.json`, `render.yaml` | Konfigurasi deploy (server hosting) |

---

## 2. Cara kerja update versi (PENTING)

Setiap selesai mengedit, **wajib menaikkan nomor versi** di `public/index.html`.

Cari teks seperti: `v2026.09.XX`

Ganti tajuk versi misalnya `v2026.09.17` → `v2026.09.18` (angka terakhir naik satu setiap perubahan).

Kenapa? Service worker (PWA) di Android memakai versi ini sebagai penanda. Tanpa menaikkan versi, perangkat pengguna **tidak akan memuat perubahan terbaru** — mereka tetap melihat versi lama sampai versi dinaikkan.

---

## 3. Alur edit (ringkas)

1. Buka `public/index.html` di editor (VS Code, Notepad++, dll.)
2. Lakukan perubahan.
3. Naikkan versi (`v2026.09.XX` → angka berikutnya) di bagian atas file.
4. Simpan, lalu **push ke GitHub** (otomatis me-*deploy* ke Vercel).

---

## 4. Cara push ke GitHub (wajib sebelum selesai)

Repo sudah terhubung ke GitHub. Dari folder ini (`D:\absensi-repo`), jalankan:

```bash
git add public/index.html
git commit -m "Penjelasan perubahan"
git push origin master
```

Setelah `git push` sukses, Vercel otomatis melakukan build & deploy. Tunggu ±1 menit, lalu buka aplikasi (bisa perlu refresh / tutup-buka aplikasi agar versi baru termuat).

> Catatan: untuk commit, git mungkin butuh identitas. Jika muncul error, jalankan sekali:
> ```bash
> git config user.name "nama"
> git config user.email "email@example.com"
> ```

---

## 5. Mengedit di laptop lain (dua cara)

### Cara A — Clone dari GitHub (paling bersih, disarankan)
Di laptop baru, buka terminal:

```bash
git clone https://github.com/trimyogi-cell/absensi-online-sd1-slopuro.git
```

Lalu edit file `public/index.html`, naikkan versi, commit, dan push seperti di atas.

### Cara B — Salin folder ini
Salin seluruh folder `D:\absensi-repo` ke laptop baru (termasuk folder `.git`, `public`, dst.).
Pastikan `git` sudah ter-install. Untuk tarik perubahan terbaru & sambungkan remote:

```bash
cd absensi-repo
git remote set-url origin https://github.com/trimyogi-cell/absensi-online-sd1-slopuro.git
git pull origin master
```

**Catatan:** pastikan selalu `git pull` dulu sebelum mulai edit di laptop lain, agar tidak menimpa perubahan yang sudah ada di GitHub (menghindari konflik).

---

## 6. Backup otomatis ke Google Drive

Fitur backup memakai Google Apps Script. Script-nya ada di:
`C:\Users\USER\OneDrive\Dokumen\New OpenCode Project\GoogleAppsScript\Code-backup-online.gs`

Jika fitur backup tidak aktif di aplikasi:
1. Buka https://script.google.com
2. Tempel isi `Code-backup-online.gs` ke proyek yang terhubung dengan Drive.
3. Deploy ulang (Deploy → Manage Deployments → New deployment → **Web app**) dengan akses "Anyone".
4. Salin URL deploy ke pengaturan aplikasi (Drive URL).

---

## 7. Tips singkat

- **Menambah siswa / nilai / absensi:** semua lewat menu aplikasi (bukan edit file — data tersimpan di Supabase).
- **File ini hanya untuk tampilan & logika UI.**
- Selalu backup (git push) setelah selesai — jangan tinggalkan perubahan hanya di laptop lokal.
- Jika ragu, jangan ubah bagian yang tidak dipahami; tanyakan atau catat dulu.
