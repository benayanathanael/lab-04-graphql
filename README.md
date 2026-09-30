# GraphQL Server (Lab 04-05 & Lab 07 - OAuth2 GitHub)

Proyek ini adalah implementasi GraphQL Server berbasis **Node.js**, **Apollo Server v5**, dan **Express** yang terhubung ke PostgreSQL (Neon). Mutation `createProduct` dilindungi menggunakan token JWT yang diperoleh melalui alur **GitHub OAuth2**.

---

## 📌 Daftar Environment Variables

Salin file `.env.example` menjadi `.env` lalu sesuaikan isinya:

```env
# PostgreSQL Neon Database Connection String
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

# GitHub OAuth App Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
CALLBACK_URL=http://localhost:4000/auth/callback

# JWT Secret untuk sign & verify token
JWT_SECRET=your_jwt_secret_key_here

# Port Server (opsional, default 4000)
PORT=4000
```

---

## 🚀 Cara Menjalankan

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Jalankan server**:
   ```bash
   npm run server
   ```
   Server akan aktif di:
   - Apollo Sandbox / Root: `http://localhost:4000/`
   - GraphQL Endpoint: `http://localhost:4000/graphql`
   - Login OAuth: `http://localhost:4000/auth/login`
   - OAuth Callback: `http://localhost:4000/auth/callback`

---

## 🔑 Cara Mendaftarkan GitHub OAuth App

1. Buka akun GitHub Anda, lalu menuju ke:
   **Settings** > **Developer settings** > **OAuth Apps** (atau buka [https://github.com/settings/developers](https://github.com/settings/developers)).
2. Klik tombol **New OAuth App**.
3. Isi formulir pendaftaran:
   - **Application name**: `Lab 07 GraphQL App` (atau sesuai keinginan)
   - **Homepage URL**:
     - Jika pakai Vercel: `https://lab-04-graphql.vercel.app`
     - Jika lokal: `http://localhost:4000` (atau `http://localhost:3000`)
   - **Authorization callback URL**:
     - Jika pakai Vercel: `https://lab-04-graphql.vercel.app/auth/callback`
     - Jika lokal: `http://localhost:4000/auth/callback` (atau `http://localhost:3000/auth/callback`)
4. Klik **Register application**.
5. Salin **Client ID** dan masukkan ke variabel `GITHUB_CLIENT_ID` di file `.env` (dan Environment Variables Vercel).
6. Klik **Generate a new client secret**, lalu salin secret yang muncul ke `GITHUB_CLIENT_SECRET` di `.env` (dan Environment Variables Vercel).

---

## ☁️ Deployment di Vercel

Jika menggunakan Vercel (`https://lab-04-graphql.vercel.app`):
1. Masuk ke **Vercel Dashboard** > Pilih project **`lab-04-graphql`** > **Settings** > **Environment Variables**.
2. Tambahkan variabel berikut:
   - `DATABASE_URL`: Connection string PostgreSQL Neon Anda.
   - `GITHUB_CLIENT_ID`: Client ID dari GitHub OAuth App.
   - `GITHUB_CLIENT_SECRET`: Client Secret dari GitHub OAuth App.
   - `CALLBACK_URL`: `https://lab-04-graphql.vercel.app/auth/callback`
   - `JWT_SECRET`: Secret key JWT (misalnya string hex yang sudah Anda generate).
3. Lakukan **Redeploy** di Vercel agar environment variables baru diterapkan.
4. Akses URL berikut di browser untuk login:
   ```
   https://lab-04-graphql.vercel.app/auth/login
   ```
5. Endpoint GraphQL Apollo Sandbox ada di:
   ```
   https://lab-04-graphql.vercel.app/api/graphql
   ```

---

## 🧪 Alur Autentikasi & Pengujian di Apollo Sandbox

### 1. Dapatkan Token JWT via GitHub
1. Buka browser dan akses:
   ```
   http://localhost:4000/auth/login
   ```
2. Anda akan diarahkan ke halaman login dan konfirmasi izin GitHub.
3. Setelah klik **Authorize**, browser akan diredirect kembali ke `/auth/callback` dan menghasilkan respons JSON berisi token:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
4. Salin string token tersebut.

### 2. Uji Coba di Apollo Sandbox
1. Buka `http://localhost:4000` atau `http://localhost:4000/graphql` di browser.
2. **Query Publik (Tanpa Token)**:
   Jalankan query berikut untuk memastikan data tetap dapat dibaca secara publik:
   ```graphql
   query GetProducts {
     products {
       id
       name
       price
       stock
       status
     }
   }
   ```
3. **Mutation `createProduct` Tanpa Token (DITOLAK)**:
   ```graphql
   mutation CreateProductTest {
     createProduct(input: {
       name: "Mouse Wireless",
       price: 150000,
       stock: 10,
       status: "ACTIVE"
     }) {
       id
       name
       price
     }
   }
   ```
   Hasil: Akan muncul error `Unauthorized: silakan login terlebih dahulu`.

4. **Mutation `createProduct` Dengan Token (BERHASIL)**:
   - Di bagian bawah Apollo Sandbox, buka tab **Headers**.
   - Tambahkan header `Authorization`:
     ```json
     {
       "Authorization": "Bearer <paste_token_anda_di_sini>"
     }
     ```
   - Jalankan kembali mutation `createProduct`.
   - Hasil: Produk berhasil dibuat dan mengembalikan data produk baru.
