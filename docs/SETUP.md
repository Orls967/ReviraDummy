# Panduan Menjalankan Lokal

Panduan ini menjalankan ketiga bagian proyek di satu komputer: API Laravel (`api/`), panel admin (`admin-web/`), dan aplikasi member (`member-app/`). Tidak ada langkah deploy.

## 1. Prasyarat

| Alat | Versi yang dipakai saat pengembangan | Catatan |
|---|---|---|
| PHP | 8.4 (ekstensi `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`) | Laravel 13 membutuhkan PHP ≥ 8.3 |
| Composer | 2.9 | |
| Node.js | 24 LTS | npm 11 |
| Expo Go | versi yang mendukung **SDK 58** | Untuk mencoba di HP Android/iOS |
| Browser modern | Chrome, Safari, Firefox, Edge | Untuk admin web dan member app versi web |

## 2. Variabel lingkungan (nama saja)

File lingkungan **tidak** disertakan di repositori. Buat sendiri file berikut dan isi nilainya sesuai komputer Anda.

### `api/.env`

| Variabel | Wajib | Keterangan |
|---|---|---|
| `APP_NAME` | Tidak | Nama aplikasi |
| `APP_ENV` | **Ya** | Isi `local`. Bila kosong Laravel menganggap `production`, dan seeder data fiktif menolak berjalan |
| `APP_KEY` | **Ya** | Dibuat otomatis dengan `php artisan key:generate` |
| `APP_DEBUG` | Tidak | `true` hanya saat pengembangan. **Wajib `false` di server sungguhan** agar detail error internal tidak terkirim ke klien |
| `APP_URL` | Tidak | Alamat API, mis. alamat `php artisan serve` |
| `APP_TIMEZONE` | Tidak | Bawaan `Asia/Makassar` (WITA). Semua aturan tanggal dan jam sesi memakai zona ini |
| `APP_LOCALE` | Tidak | Bawaan `id` (pesan validasi bahasa Indonesia) |
| `DB_CONNECTION` | Tidak | Bawaan `sqlite` |
| `DB_DATABASE` | Tidak | Path file SQLite. Bawaan `api/database/database.sqlite` |
| `SEED_PASSWORD` | **Ya** untuk seeder | Kata sandi semua akun hasil seeder. Tidak ada nilai bawaan di kode; seeder berhenti bila kosong |
| `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION` | Tidak | Bawaan `database` (tabelnya ikut dibuat oleh migrasi) |
| `LOG_CHANNEL`, `LOG_LEVEL` | Tidak | Pengaturan log Laravel |
| `CORS_ALLOWED_ORIGINS` | Tidak | Origin frontend yang boleh memanggil API dari browser, dipisah koma. Bawaan: alamat dev server admin web (`localhost:5173`) dan member app web (`localhost:8081`), baik `localhost` maupun `127.0.0.1`. Isi dengan domain asli saat di-hosting |
| `ADMIN_TOKEN_TTL_MINUTES` | Tidak | Umur token admin dalam menit. Bawaan 480 (8 jam) |
| `MEMBER_TOKEN_TTL_MINUTES` | Tidak | Umur token member dalam menit. Bawaan 43200 (30 hari) |
| `SANCTUM_TOKEN_PREFIX` | Tidak | Awalan token agar mudah dikenali pemindai rahasia. Bawaan `revira_` |
| `SANCTUM_EXPIRATION` | Tidak | Batas umur maksimum semua token (menit). Kosong = memakai umur per peran di atas |

### `admin-web/.env.local`

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_API_URL` | **Ya** | Origin server Laravel **tanpa** `/api/v1`, mis. alamat `php artisan serve`. Bila kosong, aplikasi menampilkan layar "Alamat API belum diatur" |

### `member-app/.env`

| Variabel | Wajib | Keterangan |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | **Ya** | Origin server Laravel **tanpa** `/api/v1`. Untuk Expo Go di HP, pakai **IP komputer di jaringan Wi-Fi yang sama** (bukan `localhost`) |

> Saran isi `.gitignore` (buat sendiri sebelum commit): `node_modules/`, `api/vendor/`, `.env`, `.env.*`, `api/database/*.sqlite`, `api/storage/logs/*.log`, `api/storage/framework/**` (kecuali `.gitkeep`), `api/bootstrap/cache/*.php`, `admin-web/dist/`, `member-app/.expo/`, `member-app/dist/`, `.DS_Store`.

## 3. Menjalankan API (`api/`)

```bash
cd api
composer install
```

Buat file `api/.env` berisi variabel di atas, lalu:

```bash
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

- `php artisan migrate --seed` membuat tabel dan mengisi data fiktif. Untuk mengulang dari awal: `php artisan migrate:fresh --seed`.
- Seeder aman dijalankan ulang (`php artisan db:seed`) tanpa menggandakan data.
- Harga dan durasi paket standar ada di satu tempat: [`api/config/membership.php`](../api/config/membership.php). Seeder menyalinnya ke tabel `membership_plans`; setelah itu tabel inilah sumber harga untuk API, admin web, dan member app. Admin tetap bisa mengubah harga lewat menu Paket Membership (perubahan tercatat di Log Aktivitas). Menjalankan seeder ulang mengembalikan paket standar ke nilai di config.

### Memperbarui instalasi lama

Basis data yang dibuat sebelum pembaruan harga cukup dimigrasikan, tanpa reset:

```bash
php artisan migrate
```

Migrasi `add_code_to_membership_plans_table` mengenali paket lama (Bulanan, Triwulan, Tahunan), mengganti nama dan harganya menjadi 1 Bulan, 3 Bulan, 1 Tahun, lalu menambahkan paket Per Datang. Tidak ada baris yang dihapus, paket buatan admin tidak disentuh, dan **nominal transaksi lama tetap** sesuai harga saat member mengajukan. Pengajuan yang masih menunggu dengan harga lama ditandai "Harga paket kini …" di halaman Transaksi admin. Migrasi `create_audit_logs_table` menambah tabel log aktivitas.
- Agar bisa diakses HP lewat Expo Go, jalankan server di semua antarmuka jaringan:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Cek API: buka `/api/v1/health` di browser, hasilnya `{"status":"ok", ...}`.

### Akun hasil seeder

Kata sandi semua akun = nilai `SEED_PASSWORD` yang Anda isi.

| Email | Peran | Kondisi awal |
|---|---|---|
| `admin@revira.test` | admin | Pengelola |
| `budi@revira.test` | member | Aktif (1 Bulan) dan sudah booking beberapa kelas |
| `sari@revira.test` | member | Aktif (3 Bulan) |
| `dewi@revira.test` | member | Kedaluwarsa |
| `rudi@revira.test` | member | Pengajuan pending (transfer) |
| `putri@revira.test` | member | Pengajuan pending (bayar di tempat) |
| `agus@revira.test` | member | Pengajuan ditolak (status terkini: belum ada) |
| `nina@revira.test` | member | Belum punya membership, cocok untuk skenario uji |

Paket hasil seeder:

| Paket | Durasi | Harga |
|---|---|---|
| Per Datang | 1 hari | Rp75.000 |
| 1 Bulan | 30 hari | Rp500.000 |
| 3 Bulan | 90 hari | Rp1.050.000 |
| 1 Tahun | 365 hari | Rp3.075.000 |

Jadwal kelas dibuat relatif terhadap hari ini: satu sesi kemarin (selesai), lalu sesi Yoga, HIIT, dan Zumba selama tujuh hari ke depan, termasuk satu sesi Zumba yang dibatalkan.

## 4. Menjalankan Admin Web (`admin-web/`)

```bash
cd admin-web
npm install
```

Buat `admin-web/.env.local` berisi `VITE_API_URL`, lalu:

```bash
npm run dev
```

Buka alamat yang dicetak Vite (bawaan port 5173), lalu masuk dengan `admin@revira.test`.

## 5. Menjalankan Member App (`member-app/`)

```bash
cd member-app
npm install
```

Buat `member-app/.env` berisi `EXPO_PUBLIC_API_URL`, lalu:

```bash
npx expo start
```

- **HP (Expo Go):** pindai QR code yang muncul. HP dan komputer harus satu jaringan, dan `EXPO_PUBLIC_API_URL` memakai IP komputer.
- **Web:** tekan `w` di terminal Expo, atau jalankan:

```bash
npx expo start --web
```

Setelah mengubah `.env`, hentikan lalu jalankan ulang `npx expo start` agar nilai baru terbaca.

## 6. Menjalankan pengujian

```bash
cd api && php artisan test && ./vendor/bin/pint --test
```

```bash
cd admin-web && npm run typecheck && npm run lint && npm test && npm run build
```

```bash
cd member-app && npm run typecheck && npm run lint && npm test
```

## 7. Skenario uji end-to-end

Jalankan API, admin web, dan member app sekaligus. Skenario ini sudah dijalankan saat pengembangan (lihat bagian "Hasil analisis" di README).

| # | Aktor | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| 1 | Member | Masuk sebagai `nina@revira.test` | Beranda menampilkan status **Belum ada membership** |
| 2 | Member | Buka *Pilih paket & ajukan membership*, pilih **1 Bulan** (kartu menampilkan 30 hari dan Rp500.000), tanggal mulai hari ini, bayar di tempat, *Kirim pengajuan · Rp500.000* | Ringkasan menampilkan total Rp500.000; layar "Pengajuan terkirim"; beranda menampilkan **Menunggu verifikasi** |
| 3 | Admin | Masuk sebagai `admin@revira.test`, buka **Transaksi** tab *Menunggu* | Pengajuan Nina muncul paling atas |
| 4 | Admin | Klik **Setujui** → konfirmasi | Toast "Membership Nina Kartika aktif" dengan periode inklusif, mis. 20 Nov – 19 Des untuk 30 hari |
| 5 | Admin | Buka **Member**, filter status **Aktif** | Nina tampil dengan paket 1 Bulan, periode, dan nomor telepon |
| 6 | Member | Buka tab **Jadwal**, pilih tanggal besok, buka **Yoga Pagi**, *Booking kelas ini* | Snackbar "Booking berhasil", counter peserta bertambah satu, tombol berubah menjadi *Batalkan booking* |
| 7 | Admin | Buka **Jadwal Kelas** → menu sesi → *Lihat peserta* | Counter sama dengan aplikasi member dan Nina ada di daftar peserta |
| 8 | Member | Coba booking sesi yang sama lagi (mis. lewat API) | Ditolak **409** "Anda sudah membooking sesi ini." |
| 9 | Member | Coba booking sesi Zumba yang dibatalkan | Ditolak **422** "Sesi kelas ini sudah dibatalkan." |
| 10 | Member | Masuk sebagai `agus@revira.test`, coba booking | Tombol booking dinonaktifkan dengan alasan; API menolak **422** "Membership Anda tidak aktif pada tanggal sesi ini." |
| 11 | Siapa pun | Panggil endpoint member/admin tanpa token | **401** `{"message":"Unauthenticated."}` |
| 12 | Member | Panggil endpoint `/api/v1/admin/...` dengan token member | **403** |
| 13 | Admin | Buka **Log Aktivitas** | Ada catatan *Transaksi disetujui* untuk Nina (paket, nominal, periode) dan *Admin masuk* |
| 14 | Siapa pun | Login dengan kata sandi salah 6 kali dalam semenit | Percobaan ke-6 ditolak **429** "Terlalu banyak permintaan…" dengan header `Retry-After` |

Contoh uji API dengan `curl` (ganti `TOKEN` dengan token dari respons `POST /api/v1/login`):

```bash
curl -H "Accept: application/json" -H "Authorization: Bearer TOKEN" http://127.0.0.1:8000/api/v1/me
```
