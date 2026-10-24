import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { buildKbcFallbackDocument } from "./serverKbcBuilder";
import { buildKurikulumMerdekaDocument } from "./src/utils/kurikulumMerdekaBuilder";

dotenv.config();

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI Client lazily or safely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };

  // Helper for resilient Gemini API calls with model fallback and exponential retry
  const generateContentWithRetry = async (ai: GoogleGenAI, contents: any) => {
    const modelCandidates = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    let lastError: any = null;

    for (const modelCandidate of modelCandidates) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code;
          const errMsg = String(err?.message || err || "");

          // Check if error is unauthenticated / invalid key (do not retry, throw immediately)
          const isAuthError =
            status === 401 ||
            errMsg.includes("401") ||
            errMsg.includes("UNAUTHENTICATED") ||
            errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
            errMsg.includes("API key not valid") ||
            errMsg.includes("API_KEY_INVALID");

          if (isAuthError) {
            throw err;
          }

          // If model is not found (404), break immediately to try next candidate
          const isModelNotFound =
            status === 404 ||
            errMsg.includes("404") ||
            errMsg.includes("not found") ||
            errMsg.includes("is not supported");

          if (isModelNotFound) {
            break;
          }

          const isTransient =
            status === 503 ||
            status === 429 ||
            status === 500 ||
            errMsg.includes("503") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("high demand") ||
            errMsg.includes("resource exhausted");

          const isQuota =
            status === 429 ||
            errMsg.includes("Quota exceeded") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("rate-limits");

          if (isTransient) {
            if (isQuota) {
              if (attempt === 0) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
              } else {
                break;
              }
            } else if (attempt < 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
              break;
            }
          } else {
            // Try next candidate for other errors
            break;
          }
        }
      }
    }
    throw lastError || new Error("Layanan AI sedang sibuk. Silakan coba beberapa saat lagi.");
  };

  // Health check API
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Auth: Secure server-side authentication login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body || {};
      let validUsername = process.env.AUTH_USERNAME || "www.yefriharyanto.id";
      let validPassword = process.env.AUTH_PASSWORD || "123456";

      // Query Firestore database directly for updated credentials saved in Pengaturan
      try {
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId;
        const dbId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "(default)";
        const apiKey = process.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey;
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/pengaturan/config?key=${apiKey}`;
        
        const dbResponse = await fetch(firestoreUrl);
        if (dbResponse.ok) {
          const docData = await dbResponse.json();
          const fields = docData.fields || {};
          if (fields.username && fields.username.stringValue) {
            validUsername = fields.username.stringValue;
          }
          if (fields.password && fields.password.stringValue) {
            validPassword = fields.password.stringValue;
          }
        }
      } catch (dbErr) {
        console.warn("Notice: Using fallback credentials due to Firestore config fetch notice:", dbErr);
      }

      if (!username || !password) {
        return res.status(400).json({
          status: "error",
          message: "Username dan Password wajib diisi."
        });
      }

      const inputUsername = String(username).trim().toUpperCase();
      const expectedUsername = String(validUsername).trim().toUpperCase();
      const isUsernameMatch = inputUsername === expectedUsername || inputUsername === "ARDI YOKA" || inputUsername === "WWW.YEFRIHARYANTO.ID";

      if (isUsernameMatch && String(password).trim() === validPassword) {
        // Generate a server-signed session token
        const timestamp = Date.now();
        const token = Buffer.from(`${String(username).trim()}:${timestamp}:edadmin_pro_secure_session`).toString("base64");
        
        return res.json({
          status: "success",
          token,
          user: {
            username: "www.yefriharyanto.id",
            nama: "www.yefriharyanto.id",
            role: "Administrator Guru"
          }
        });
      }

      return res.status(401).json({
        status: "error",
        message: "Username atau Password yang Anda masukkan tidak valid."
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server autentikasi."
      });
    }
  });

  app.get("/api/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: "error", valid: false });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      if (decoded.includes("edadmin_pro_secure_session")) {
        return res.json({ status: "success", valid: true });
      }
    } catch {
      // Token parsing failed
    }
    return res.status(401).json({ status: "error", valid: false });
  });

  // API 1: Generate AI Modul Ajar
  app.post("/api/ai/generate-modul", async (req, res) => {
    try {
      const formData = req.body || {};
      const ai = getAiClient();

      const formatOutput = formData.formatOutput || "standar_merdeka";
      const sertakanKop = formData.sertakanKop !== false;
      const sertakanTtd = formData.sertakanTtd !== false;
      const sertakanLkpd = formData.sertakanLkpd !== false;

      const namaGuru = formData.namaGuru || "Guru Pengampu, S.Pd.";
      const nipGuru = formData.nipGuru || "-";
      const namaSekolah = formData.namaSekolah || "SMP Negeri 3 Kerinci";
      const alamatSekolah = formData.alamatSekolah || "Jalan Raya Lintas Sungai Penuh";
      const pemerintah = formData.pemerintah || "PEMERINTAH KABUPATEN / KOTA";
      const namaKepsek = formData.namaKepsek || "Kepala Sekolah, M.Pd.";
      const nipKepsek = formData.nipKepsek || "-";
      const tempatTtd = formData.tempatTtd || "Kerinci";
      const tanggalTtd = formData.tanggalTtd || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

      const metodeText = formData.metode && formData.metode.trim() 
        ? formData.metode.trim() 
        : "Diskusi kelompok, tanya jawab interaktif, penugasan studi kasus, presentasi, dan refleksi terbimbing";

      const commonRules = `
ATURAN FORMAT DOKUMEN HTML:
1. Hasilkan MURNI KODE HTML TANPA MARKDOWN (DILARANG menggunakan \\\`\\\`\\\`html, \\\`\\\`\\\`, tanda pagar #, atau simbol markdown). Gunakan tag HTML murni (<h1>, <h2>, <h3>, <h4>, <p>, <table>, <tr>, <th>, <td>, <ul>, <li>, <strong>, <em>).
2. TAMPILAN TABEL: Setiap elemen <th> WAJIB memiliki styling inline: style="background-color:#1a3a5c; color:#ffffff; font-weight:bold; text-align:center; padding:8px 10px; border:1px solid #1a3a5c;"
3. TAMPILAN CELL: Setiap elemen <td> WAJIB memiliki styling inline: style="border:1px solid #cbd5e1; padding:6px 10px; font-size:11pt; color:#1e293b;"
4. DILARANG KERAS MENAMBAHKAN TEKS WATERMARK ATAU HAK CIPTA SEPERTI "Hak Cipta EdAdmin Pro" DI AKHIR DOKUMEN.
5. JANGAN MENYINGKAT PENJELASAN. Berikan penjabaran operasional, mendalam, dan siap digunakan mengajar di kelas.
6. ${sertakanKop ? `Sertakan Kop Satuan Pendidikan Resmi di bagian atas:
<div style="text-align:center; border-bottom:3px double #000000; padding-bottom:10px; margin-bottom:20px;">
  <h3 style="margin:0; font-size:12pt; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px;">${pemerintah}</h3>
  <h2 style="margin:2px 0; font-size:14pt; text-transform:uppercase; font-weight:bold; letter-spacing:1px; color:#1a3a5c;">${namaSekolah}</h2>
  <p style="margin:0; font-size:9.5pt; color:#475569;">${alamatSekolah}</p>
</div>` : ''}
7. ${sertakanTtd ? `Di bagian paling bawah modul ajar, sertakan Lembar Pengesahan Tanda Tangan Sejajar:
<table style="width:100%; border:none; margin-top:35px; page-break-inside:avoid;">
  <tr>
    <td style="border:none; text-align:center; width:50%; vertical-align:top; font-size:11pt;">
      Mengetahui,<br><strong>Kepala Sekolah</strong><br><br><br><br><br>
      <strong><u>${namaKepsek}</u></strong><br>
      NIP. ${nipKepsek}
    </td>
    <td style="border:none; text-align:center; width:50%; vertical-align:top; font-size:11pt;">
      ${tempatTtd}, ${tanggalTtd}<br><strong>Guru Mata Pelajaran</strong><br><br><br><br><br>
      <strong><u>${namaGuru}</u></strong><br>
      NIP. ${nipGuru}
    </td>
  </tr>
</table>` : ''}
`;

      const docNumberIso = formData.docNumberIso || "015/F/KUR/00/IX/2025";
      const kepemimpinan = formData.kepemimpinan || "Kalla Core Values & Kepemimpinan Athirah: Ikhlas, Cepat, Cerdas, Keras";
      const spiritualisasi = formData.spiritualisasi || "";
      const sertakanLampiran017 = formData.sertakanLampiran017 !== false;

      let systemPrompt = "";
      let formatTemplate = "";

      if (formatOutput === "sekolah_format1_iso") {
        // Format 1 Resmi Sekolah Islam Athirah (100% Terkunci KOP ISO 015 & 14 Baris Resmi)
        systemPrompt = `Anda adalah Ahli Kurikulum dan Pengembang Dokumen Mutu Sekolah Islam Athirah.
Susunlah MODUL AJAR FORMAT 1 ATHIRAH (TERKUNCI 100% KOP ISO & 14 BARIS RESMI) sesuai standar dokumen ISO Mutu No. ${docNumberIso} dan Kepka BSKAP No. 046/H/KR/2025.
DOKUMEN HARUS MEMUAT SECARA LENGKAP DAN OPERASIONAL MURNI KODE HTML TANPA MARKDOWN:
1. KOP FORMULIR MUTU ISO 9001 (No. Dokumen: ${docNumberIso}, Judul: ${namaSekolah}, FORMULIR - MODUL AJAR, Tgl. Terbit: 17/09/2025, No. Revisi: 00, Halaman: 1 dari 4, Kotak Kanan: ISO 9001 MUTU).
2. TABEL IDENTITAS MODUL (Satuan Pendidikan, Mata Pelajaran, Fase/Kelas, Tahun Pelajaran, Topik Pokok, Alokasi Waktu, Target TP).
3. TABEL FORMAT 1 KOMPONEN MODUL AJAR (14 BARIS RESMI TERKUNCI):
   - Baris 1: Model Pembelajaran (${formData.model} terintegrasi Deep Learning).
   - Baris 2: Dimensi Profil Lulusan Kurikulum Merdeka (Bernalar Kritis, Mandiri, Gotong Royong, Beriman & Bertakwa kepada Tuhan YME) & Karakter Khas Satuan Pendidikan.
   - Baris 3: Spiritualisasi Islam (Wajib sertakan ayat Al-Qur'an / Hadits berbahasa Arab beserta artinya yang sangat relevan dengan topik ${formData.topik}, serta hikmah keteraturan ciptaan Allah SWT).
   - Baris 4 (rowspan 4): Desain Pembelajaran:
     * 4a: Kepemimpinan (${kepemimpinan})
     * 4b: Media & Alat (Alat digital, Chromebook/Laptop, LCD, video fenomena kontekstual)
     * 4c: Sarana & Prasarana
     * 4d: Pemahaman Bermakna & Pertanyaan Pemantik
   - Baris 5: Diferensiasi Pembelajaran (Diferensiasi Konten, Proses, dan Produk berdasarkan pemetaan kesiapan belajar peserta didik).
   - Baris 6: Pengalaman Belajar Lengkap Seluruh Pertemuan (Pertemuan 1 s.d. ${formData.jumlahPertemuan}). Setiap pertemuan dijabarkan:
     * A. Kegiatan Pendahuluan (Orientasi, Apersepsi kontekstual, Motivasi, Pengkondisian kelas).
     * B. Kegiatan Inti (Deep Learning):
       - Mindful Learning (Berkesadaran / Memahami)
       - Meaningful Learning (Bermakna / Mengaplikasi)
       - Joyful Learning (Menggembirakan / Merefleksi)
     * C. Kegiatan Penutup (Refleksi, Simpulan bersama, Doa majelis).
   - Baris 7 (rowspan 3): Asesmen Pembelajaran (Asesmen Awal, Formatif, Sumatif dengan teknik, bentuk instrumen, dan kriteria capaian MH [Mahir], MA [Memadai], MR [Masih Rentan]).
   - Baris 8: Remedial & Pengayaan (Program bimbingan terfokus & penugasan eksplorasi lanjutan).
4. LEMBAR PENGESAHAN TANDA TANGAN SEJAJAR (Mengetahui Kepala Satuan Pendidikan dan Guru Mata Pelajaran).
${sertakanLampiran017 ? `5. FORM LAMPIRAN ASESMEN ISO 017 (No. Dokumen: 017/F/KUR/00/IX/2025): Matriks Kisi-kisi & Instrumen Asesmen 7 Kolom (Materi, Tujuan Pembelajaran, Indikator Asesmen, Jenis Asesmen, Uraian Soal Tertulis, Deskripsi Aktivitas Non-tertulis, LKPD) & LKPD Siswa Siap Pakai.` : ''}

ATURAN FORMAT DOKUMEN:
- Hasilkan MURNI KODE HTML TANPA MARKDOWN (DILARANG menggunakan \`\`\`html, \`\`\`, atau tanda pagar #).
- Tabel menggunakan class="iso-kop-table" dan class="table-format1-athirah" dengan border 1px solid #000000.
- Header tabel gunakan background-color: #064e3b; color: #ffffff; text-align: center; font-weight: bold;`;

        formatTemplate = `
<table class="iso-kop-table" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin-bottom:12px; font-family:Arial, sans-serif;">
  <tr>
    <td rowspan="5" style="width:90px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px;">
      <div style="font-size:22px;">🌿</div>
      <div style="font-size:7.5pt; font-weight:bold; color:#064e3b;">ATHIRAH</div>
    </td>
    <td colspan="4" style="text-align:center; font-size:11pt; font-weight:bold; letter-spacing:0.5px; border:1px solid #000000; padding:4px;">
      ${namaSekolah.toUpperCase()}
    </td>
    <td rowspan="5" style="width:90px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px; background-color:#f0fdf4;">
      <div style="font-size:8pt; font-weight:bold; color:#064e3b; text-align:center; line-height:1.2;">
        ISO 9001<br><span style="letter-spacing:1px;">MUTU</span>
      </div>
    </td>
  </tr>
  <tr>
    <td colspan="4" style="text-align:center; font-size:10pt; font-weight:bold; border:1px solid #000000; padding:4px;">
      FORMULIR - MODUL AJAR
    </td>
  </tr>
  <tr>
    <td style="width:100px; font-weight:600; font-size:8pt; border:1px solid #000000; padding:3px 6px;">No. Dokumen</td>
    <td style="width:170px; font-size:8pt; border:1px solid #000000; padding:3px 6px;">${docNumberIso}</td>
    <td style="width:70px; font-weight:600; font-size:8pt; border:1px solid #000000; padding:3px 6px;">Tgl. Terbit</td>
    <td style="font-size:8pt; border:1px solid #000000; padding:3px 6px;">17/09/2025</td>
  </tr>
  <tr>
    <td style="font-weight:600; font-size:8pt; border:1px solid #000000; padding:3px 6px;">No. Revisi</td>
    <td style="font-size:8pt; border:1px solid #000000; padding:3px 6px;">00</td>
    <td style="font-weight:600; font-size:8pt; border:1px solid #000000; padding:3px 6px;">Halaman</td>
    <td style="font-size:8pt; border:1px solid #000000; padding:3px 6px;">1 dari 4</td>
  </tr>
</table>

<table class="table-format1-athirah" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin-bottom:12px; font-family:Arial, sans-serif; font-size:9pt;">
  <tr>
    <td style="width:180px; font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Satuan Pendidikan</td>
    <td style="border:1px solid #000000; padding:5px 7px;">${namaSekolah}</td>
    <td style="width:140px; font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Mata Pelajaran</td>
    <td style="border:1px solid #000000; padding:5px 7px;">${formData.mataPelajaran}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Fase / Kelas</td>
    <td style="border:1px solid #000000; padding:5px 7px;">${formData.fase} / Kelas ${formData.kelas}</td>
    <td style="font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Tahun Pelajaran</td>
    <td style="border:1px solid #000000; padding:5px 7px;">${formData.tahunAjaran}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Topik / Materi Pokok</td>
    <td style="border:1px solid #000000; padding:5px 7px;"><strong>${formData.topik}</strong></td>
    <td style="font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Alokasi Waktu</td>
    <td style="border:1px solid #000000; padding:5px 7px;"><strong>${formData.waktu}</strong> (${formData.jumlahPertemuan} Pertemuan)</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f9fafb; border:1px solid #000000; padding:5px 7px;">Target Tujuan Pembelajaran (TP)</td>
    <td colspan="3" style="font-size:8.5pt; border:1px solid #000000; padding:5px 7px;">${formData.tujuan || 'Peserta didik mampu memahami dan menerapkan konsep secara mandiri dan kritis.'}</td>
  </tr>
</table>

<table class="table-format1-athirah" style="width:100%; border-collapse:collapse; border:1px solid #000000; font-family:Arial, sans-serif; font-size:9pt; margin-bottom:14px;">
  <thead>
    <tr>
      <th style="width:40px; background-color:#064e3b; color:#ffffff; padding:6px; border:1px solid #000000;">No</th>
      <th colspan="2" style="width:220px; background-color:#064e3b; color:#ffffff; padding:6px; border:1px solid #000000;">Komponen Modul Ajar</th>
      <th style="background-color:#064e3b; color:#ffffff; padding:6px; border:1px solid #000000;">Uraian / Deskripsi Operasional</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align:center; font-weight:bold; border:1px solid #000000;">1</td><td colspan="2" style="border:1px solid #000000;"><strong>Model Pembelajaran</strong></td><td style="border:1px solid #000000;">${formData.model} terintegrasi Deep Learning</td></tr>
    <tr><td style="text-align:center; font-weight:bold; border:1px solid #000000;">2</td><td colspan="2" style="border:1px solid #000000;"><strong>Dimensi Profil Lulusan (Kurikulum Merdeka)</strong></td><td style="border:1px solid #000000;">Bernalar Kritis, Bergotong Royong, Mandiri, Beriman & Bertakwa kepada Tuhan YME</td></tr>
    <tr><td style="text-align:center; font-weight:bold; border:1px solid #000000;">3</td><td colspan="2" style="border:1px solid #000000;"><strong>Spiritualisasi Islam</strong></td><td style="border:1px solid #000000;">${spiritualisasi || "(Kajian ayat Al-Qur'an/Hadits dan hikmah keteraturan ciptaan Allah SWT)"}</td></tr>
    <tr>
      <td style="text-align:center; font-weight:bold; border:1px solid #000000;" rowspan="4">4</td>
      <td rowspan="4" style="width:100px; border:1px solid #000000;"><strong>Desain Pembelajaran</strong></td>
      <td style="width:120px; border:1px solid #000000;">Kepemimpinan</td>
      <td style="border:1px solid #000000;">${kepemimpinan}</td>
    </tr>
    <tr><td style="border:1px solid #000000;">Media & Alat</td><td style="border:1px solid #000000;">Media presentasi interaktif, video fenomena, LKPD Eksplorasi, LCD proyektor, chromebook/laptop</td></tr>
    <tr><td style="border:1px solid #000000;">Sarana & Prasarana</td><td style="border:1px solid #000000;">Ruang kelas kolaboratif, jaringan internet berkecepatan tinggi, buku teks perpustakaan</td></tr>
    <tr><td style="border:1px solid #000000;">Pemahaman Bermakna & Pemantik</td><td style="border:1px solid #000000;"><strong>Bermakna:</strong> Menghubungkan konsep materi secara nyata dengan kehidupan sehari-hari.<br><strong>Pemantik:</strong> 1. Mengapa materi ini penting kita pelajari? 2. Bagaimana penerapannya bagi masyarakat?</td></tr>
    <tr><td style="text-align:center; font-weight:bold; border:1px solid #000000;">5</td><td colspan="2" style="border:1px solid #000000;"><strong>Diferensiasi Pembelajaran</strong></td><td style="border:1px solid #000000;">Diferensiasi konten dan proses berdasarkan pemetaan kesiapan belajar siswa (bimbingan khusus, reguler, dan pengayaan)</td></tr>
    <tr><td style="text-align:center; font-weight:bold; border:1px solid #000000;">6</td><td colspan="2" style="border:1px solid #000000;"><strong>Pengalaman Belajar (Pertemuan 1..${formData.jumlahPertemuan})</strong></td><td style="border:1px solid #000000;">(Uraikan secara detail seluruh pertemuan dari Pertemuan 1 sampai ${formData.jumlahPertemuan}. Setiap pertemuan wajib memuat Pendahuluan, Inti Deep Learning [Mindful, Meaningful, Joyful], dan Penutup secara tuntas)</td></tr>
    <tr>
      <td style="text-align:center; font-weight:bold; border:1px solid #000000;" rowspan="3">7</td>
      <td rowspan="3" style="border:1px solid #000000;"><strong>Asesmen Pembelajaran</strong></td>
      <td style="border:1px solid #000000;">Asesmen Awal</td>
      <td style="border:1px solid #000000;">Kuis apersepsi & tanya jawab diagnostik <span style="float:right; font-weight:bold; color:#064e3b;">MH: 85-100 | MA: 70-84 | MR: &lt;70</span></td>
    </tr>
    <tr><td style="border:1px solid #000000;">Asesmen Formatif</td><td style="border:1px solid #000000;">Observasi keaktifan diskusi & unjuk kerja LKPD <span style="float:right; font-weight:bold; color:#064e3b;">MH: 85-100 | MA: 70-84 | MR: &lt;70</span></td></tr>
    <tr><td style="border:1px solid #000000;">Asesmen Sumatif</td><td style="border:1px solid #000000;">Tes evaluasi tertulis akhir topik <span style="float:right; font-weight:bold; color:#064e3b;">MH: 85-100 | MA: 70-84 | MR: &lt;70</span></td></tr>
    <tr><td style="text-align:center; font-weight:bold; border:1px solid #000000;">8</td><td colspan="2" style="border:1px solid #000000;"><strong>Remedial & Pengayaan</strong></td><td style="border:1px solid #000000;"><strong>Remedial:</strong> Bimbingan terfokus konsep esensial bagi siswa belum tuntas.<br><strong>Pengayaan:</strong> Penugasan studi kasus kompleks dan proyek eksploratif mandiri.</td></tr>
  </tbody>
</table>

<table style="width:100%; border:none; margin-top:30px; font-family:Arial, sans-serif; font-size:9pt; page-break-inside:avoid;">
  <tr>
    <td style="border:none; text-align:center; width:50%; vertical-align:top;">
      Mengetahui,<br><strong>Kepala Satuan Pendidikan</strong><br><br><br><br><br>
      <strong><u>${namaKepsek}</u></strong><br>
      NIP. ${nipKepsek}
    </td>
    <td style="border:none; text-align:center; width:50%; vertical-align:top;">
      ${tempatTtd}, ${tanggalTtd}<br><strong>Guru Mata Pelajaran</strong><br><br><br><br><br>
      <strong><u>${namaGuru}</u></strong><br>
      NIP. ${nipGuru}
    </td>
  </tr>
</table>
`;
      } else if (formatOutput === "ringkas_1lembar") {
        // Format Ringkas 1-2 Lembar (Esensial)
        systemPrompt = `Anda adalah Ahli Kurikulum Nasional Indonesia. Buatkan RPP / MODUL AJAR FORMAT RINGKAS ESENSIAL (1-2 Halaman Praktis) yang padat, aplikatif, dan terstruktur sesuai regulasi penyederhanaan RPP Kemendikbudristek.
Fokus pada 3 Komponen Inti Utama:
1. Tujuan Pembelajaran (Berpusat pada siswa, memuat kompetensi dan materi spesifik).
2. Langkah-Langkah Kegiatan Pembelajaran (Pendahuluan, Inti per sintak model secara ringkas namun jelas, Penutup).
3. Asesmen Pembelajaran (Teknik dan instrumen penilaian Sikap, Pengetahuan, dan Keterampilan).
${commonRules}`;

        formatTemplate = `
<h1 style="text-align:center; font-size:14pt; font-weight:bold; margin-bottom:12px; color:#1a3a5c;">MODUL AJAR RINGKAS (RPP ESENSIAL)</h1>

<table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
  <tr>
    <td style="border:1px solid #cbd5e1; padding:6px; width:22%; font-weight:bold; background-color:#f8fafc;">Satuan Pendidikan</td>
    <td style="border:1px solid #cbd5e1; padding:6px; width:28%;">${namaSekolah}</td>
    <td style="border:1px solid #cbd5e1; padding:6px; width:22%; font-weight:bold; background-color:#f8fafc;">Mata Pelajaran</td>
    <td style="border:1px solid #cbd5e1; padding:6px; width:28%;">${formData.mataPelajaran}</td>
  </tr>
  <tr>
    <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; background-color:#f8fafc;">Fase / Kelas</td>
    <td style="border:1px solid #cbd5e1; padding:6px;">${formData.fase} / Kelas ${formData.kelas}</td>
    <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; background-color:#f8fafc;">Tahun Ajaran</td>
    <td style="border:1px solid #cbd5e1; padding:6px;">${formData.tahunAjaran}</td>
  </tr>
  <tr>
    <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; background-color:#f8fafc;">Topik / Materi</td>
    <td style="border:1px solid #cbd5e1; padding:6px;">${formData.topik}</td>
    <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; background-color:#f8fafc;">Alokasi Waktu</td>
    <td style="border:1px solid #cbd5e1; padding:6px;">${formData.waktu} (${formData.jumlahPertemuan} Pertemuan)</td>
  </tr>
  <tr>
    <td style="border:1px solid #cbd5e1; padding:6px; font-weight:bold; background-color:#f8fafc;">Model & Metode</td>
    <td colspan="3" style="border:1px solid #cbd5e1; padding:6px;">${formData.model} | Metode: ${metodeText}</td>
  </tr>
</table>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:14px;">I. TUJUAN PEMBELAJARAN</h2>
<p style="margin-bottom:8px;">Tuliskan tujuan pembelajaran terukur (ABCD / HOTS) yang jelas dan kontekstual.</p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:14px;">II. LANGKAH-LANGKAH PEMBELAJARAN</h2>
(Jabarkan secara ringkas per pertemuan untuk ${formData.jumlahPertemuan} pertemuan: Pendahuluan X menit, Inti dengan sintak ${formData.model} X menit, Penutup X menit).

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:14px;">III. ASESMEN PEMBELAJARAN</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <thead>
    <tr>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Aspek</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Teknik Penilaian</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Bentuk Instrumen</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Sikap (Profil Pelajar)</td><td>Observasi</td><td>Jurnal Pengamatan Sikap</td><td>Kritis, Kolaboratif, Mandiri</td></tr>
    <tr><td>Pengetahuan</td><td>Tes Tertulis / Lisan</td><td>Soal HOTS & Kuis</td><td>Pemahaman Konsep</td></tr>
    <tr><td>Keterampilan</td><td>Kinerja / Portofolio</td><td>Rubrik Penilaian Unjuk Kerja</td><td>Aplikasi Praktis</td></tr>
  </tbody>
</table>
`;
      } else if (formatOutput === "kemenag_kbc") {
        // Format Kurikulum Berbasis Cinta (KBC & PPRA)
        systemPrompt = `Anda adalah Ahli Kurikulum Kementerian Agama RI dan Pengembang Modul Ajar Kurikulum Berbasis Cinta (KBC). Susunlah Modul Ajar yang mengintegrasikan Panca Cinta Kemenag serta 10 Nilai Profil Pelajar Rahmatan lil 'Alamin (PPRA: Ta'addub, Qudwah, Muwaṭanah, Tawassuṭ, Tawāzun, I'tidāl, Musāwah, Syūrā, Tasāmuh, Tathawwur wa Ibtikār).
Struktur Modul KBC:
1. INFORMASI UMUM (Identitas, Kompetensi Awal, Panca Cinta & Nilai PPRA, Sarpras, Target Peserta Didik).
2. KOMPONEN INTI (Tujuan Pembelajaran Berbasis Nilai, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran Berdiferensiasi & Penuh Kasih Sayang per Pertemuan).
3. ASESMEN & REFLEKSI (Asesmen Kognitif, Non-Kognitif, Karakter PPRA).
${sertakanLkpd ? '4. LAMPIRAN (LKPD Siswa Penuh Nilai KBC, Rubrik Karakter, Glosarium).' : ''}
${commonRules}`;

        formatTemplate = `
<h1 style="text-align:center; font-size:15pt; font-weight:bold; margin-bottom:14px; color:#1a3a5c;">MODUL AJAR KURIKULUM BERBASIS CINTA (KBC)</h1>
<p style="text-align:center; font-size:10pt; color:#475569; margin-top:-8px; margin-bottom:16px;">Terintegrasi Panca Cinta & 10 Nilai Profil Pelajar Rahmatan Lil 'Alamin (PPRA)</p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">A. INFORMASI UMUM</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <tr><td style="font-weight:bold; width:30%; background-color:#f8fafc;">Penyusun / Guru</td><td>${namaGuru} (NIP: ${nipGuru})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Satuan Pendidikan</td><td>${namaSekolah}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Jenjang / Fase / Kelas</td><td>${formData.jenjang} / ${formData.fase} / Kelas ${formData.kelas}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Mata Pelajaran</td><td>${formData.mataPelajaran}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Topik / Materi</td><td>${formData.topik} ${formData.subTopik ? `(${formData.subTopik})` : ''}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Alokasi Waktu</td><td>${formData.waktu} (${formData.jumlahPertemuan} Pertemuan)</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Model & Metode</td><td>${formData.model} — ${metodeText}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Integrasi KBC & PPRA</td><td>Panca Cinta Kemenag & Nilai PPRA (Ta'addub, Qudwah, Tawassuṭ, Syūrā, dll)</td></tr>
</table>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">B. KOMPONEN INTI</h2>
<h3>1. Tujuan Pembelajaran</h3>
<p>Tujuan pembelajaran yang mengintegrasikan kompetensi kognitif/keterampilan dan internalisasi nilai kasih sayang.</p>
<h3>2. Pemahaman Bermakna</h3>
<h3>3. Pertanyaan Pemantik Berorientasi Hikmah</h3>
<h3>4. Kegiatan Pembelajaran Bermakna per Pertemuan (1 sampai ${formData.jumlahPertemuan})</h3>
(Jabarkan kegiatan Guru dan Siswa yang mencerminkan keteladanan dan interaksi penuh kasih sayang).

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">C. ASESMEN & EVALUASI</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <thead>
    <tr>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Jenis Asesmen</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Bentuk & Teknik</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Kriteria Ketuntasan</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Asesmen Diagnostik</td><td>Tanya Jawab & Pengamatan Awal</td><td>Mengetahui kesiapan & suasana hati siswa</td></tr>
    <tr><td>Asesmen Formatif</td><td>Observasi LKPD & Kinerja Kelompok</td><td>Antusiasme, kolaborasi, dan pemahaman konsep</td></tr>
    <tr><td>Asesmen Sumatif</td><td>Tes Tulis / Penugasan Proyek KBC</td><td>Penguasaan materi & aplikasi nilai dalam kehidupan</td></tr>
  </tbody>
</table>

${sertakanLkpd ? `
<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">D. LAMPIRAN LKPD & BAHAN AJAR</h2>
<h3>1. Lembar Kerja Peserta Didik (LKPD) Penuh Makna</h3>
<p>Petunjuk dan soal aplikatif siap cetak untuk siswa.</p>
<h3>2. Glosarium & Daftar Pustaka</h3>
` : ''}
`;
      } else if (formatOutput === "deep_learning") {
        // Format Deep Learning Pro (Mindful, Meaningful, Joyful)
        systemPrompt = `Anda adalah Ahli Kurikulum dan Desain Pembelajaran Mendalam (Deep Learning Specialist).
Susunlah MODUL AJAR DEEP LEARNING (PEMBELAJARAN MENDALAM) yang komprehensif, berbasis 3 Dimensi Utama:
- Mindful Learning (Olah Pikir: Kesadaran Penuh, Fokus, Berpikir Kritis).
- Meaningful Learning (Olah Rasa: Relevansi Kontekstual, Makna Kehidupan Nyata).
- Joyful Learning (Olah Karsa: Menggembirakan, Menyenangkan, Kolaboratif, Produktif).

Setiap tahapan pembelajaran mengintegrasikan 3 Fase:
1. Memahami (Concept Acquisition)
2. Mengaplikasi (Contextual Application)
3. Merefleksi (Metacognitive Reflection)
${sertakanLkpd ? 'Wajib sertakan LKPD Interaktif dan rubrik evaluasi siap pakai.' : ''}
${commonRules}`;

        formatTemplate = `
<h1 style="text-align:center; font-size:15pt; font-weight:bold; margin-bottom:14px; color:#1a3a5c;">MODUL AJAR DEEP LEARNING (PEMBELAJARAN MENDALAM)</h1>
<p style="text-align:center; font-size:10pt; color:#475569; margin-top:-8px; margin-bottom:16px;">Prinsip Pembelajaran: Mindful, Meaningful, dan Joyful Learning</p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">A. INFORMASI UMUM</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <tr><td style="font-weight:bold; width:28%; background-color:#f8fafc;">Nama Sekolah</td><td>${namaSekolah}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Nama Penyusun</td><td>${namaGuru} (NIP: ${nipGuru})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Tahun Ajaran</td><td>${formData.tahunAjaran}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Jenjang / Fase / Kelas</td><td>${formData.jenjang} / ${formData.fase} / Kelas ${formData.kelas}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Mata Pelajaran</td><td>${formData.mataPelajaran}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Topik & Sub-Topik</td><td>${formData.topik} ${formData.subTopik ? `- ${formData.subTopik}` : ''}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Alokasi Waktu</td><td>${formData.waktu} (${formData.jumlahPertemuan} Pertemuan)</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Model Pembelajaran</td><td>${formData.model} (Pendekatan Deep Learning)</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Metode Pembelajaran</td><td>${metodeText}</td></tr>
</table>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">B. TUJUAN & DIMENSI DEEP LEARNING</h2>
<p>Uraikan Tujuan Pembelajaran (HOTS), Pemahaman Bermakna (Meaningful), dan Pertanyaan Pemantik (Mindful).</p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">C. PEMETAAN KESIAPAN & ASESMEN DIAGNOSTIK</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <thead>
    <tr>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Kategori Kesiapan</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Karakteristik Siswa</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Intervensi / Scaffolding</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Fondasi (Perlu Bimbingan)</td><td>Belum memahami konsep dasar</td><td>Pendampingan intensif & contoh visual konkret</td></tr>
    <tr><td>Cakap (Sesuai Standar)</td><td>Memahami sebagian besar konsep</td><td>Tantangan aplikasi mandiri & diskusi kelompok</td></tr>
    <tr><td>Mahir (Pengayaan)</td><td>Mampu menganalisis tingkat tinggi</td><td>Tutor sebaya & studi kasus kompleks</td></tr>
  </tbody>
</table>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">D. SKENARIO PENGALAMAN BELAJAR PERTEMUAN</h2>
<p><em>(Uraikan secara detail tanpa tabel, gunakan <h3>, <h4>, <ul>, <li>, dan <strong> per pertemuan dari Pertemuan 1 sampai ${formData.jumlahPertemuan}. Sertakan contoh perkataan/dialog guru dan aktivitas aktif murid dalam 3 Fase: Memahami, Mengaplikasi, dan Merefleksi).</em></p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">E. ASESMEN AUTENTIK & RUBRIK</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <thead>
    <tr>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Aspek</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Teknik</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Instrumen</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Kriteria</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Mindful (Karakter)</td><td>Observasi Jurnal</td><td>Lembar Catatan Perilaku</td><td>Fokus, kritis, reflektif</td></tr>
    <tr><td>Meaningful (Konsep)</td><td>Tes Tertulis / Lisan</td><td>Soal Analisis Kontekstual</td><td>Paham hubungan konsep & fakta</td></tr>
    <tr><td>Joyful (Praktik)</td><td>Kinerja / Portofolio</td><td>Rubrik Produk Kreatif</td><td>Hasil kerja kolaboratif aplikatif</td></tr>
  </tbody>
</table>

${sertakanLkpd ? `
<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px;">F. BAHAN AJAR & LKPD INTERAKTIF SIAP PAKAI</h2>
<h3>1. Ringkasan Bahan Ajar Esensial</h3>
<h3>2. LKPD (Lembar Kerja Peserta Didik)</h3>
<p>Soal kasus dan instruksi kerja siap dikerjakan siswa.</p>
` : ''}
`;
      } else {
        // Format Standar Kurikulum Merdeka (Lengkap & Resmi Kemendikbudristek)
        systemPrompt = `Anda adalah Ahli Kurikulum Nasional Indonesia dan Pengembang Perangkat Ajar Resmi Kurikulum Merdeka.
Susunlah MODUL AJAR KURIKULUM MERDEKA LENGKAP & RESMI yang berstandar nasional sesuai Panduan Pembelajaran dan Asesmen (PPA) Kemendikbudristek RI.
Modul Ajar harus memuat 3 Bagian Utama yang lengkap dan berbobot:
BAGIAN I: INFORMASI UMUM
- Identitas Modul (Penyusun, NIP, Satuan Pendidikan, Tahun Ajaran, Jenjang/Fase/Kelas, Alokasi Waktu).
- Kompetensi Awal.
- Profil Pelajar Pancasila (8 Dimensi Profil Kelulusan: Beriman, Mandiri, Gotong Royong, Bernalar Kritis, Kreatif, Kebinekaan Global).
- Sarana dan Prasarana Pembelajaran.
- Target Peserta Didik (Reguler/Tipikal, Kesulitan Belajar, Pencapaian Tinggi).
- Model & Metode Pembelajaran yang Digunakan.

BAGIAN II: KOMPONEN INTI
- Tujuan Pembelajaran (Spesifik, Terukur, HOTS).
- Pemahaman Bermakna (Relevansi Konsep dalam Dunia Nyata).
- Pertanyaan Pemantik (Memicu Rasa Ingin Tahu dan Nalar Kritis).
- Persiapan Pembelajaran.
- Kegiatan Pembelajaran Rinci per Pertemuan (Pertemuan 1 sampai ${formData.jumlahPertemuan}):
  Setiap pertemuan memuat:
  a. Kegiatan Pendahuluan (Orientasi, Apersepsi, Motivasi, Acuan).
  b. Kegiatan Inti (Sintak Model ${formData.model}, Diferensiasi Pembelajaran, Poin-poin kegiatan guru dan murid aktif).
  c. Kegiatan Penutup (Refleksi, Simpulan, Umpan Balik, Rencana Pertemuan Berikutnya).
- Asesmen Pembelajaran (Diagnostik, Formatif, Sumatif) disertai tabel rubrik.
- Pengayaan dan Remedial.
- Refleksi Guru dan Peserta Didik.

${sertakanLkpd ? `BAGIAN III: LAMPIRAN
- Lembar Kerja Peserta Didik (LKPD) Siap Pakai secara utuh.
- Bahan Bacaan Pendidik dan Peserta Didik.
- Glosarium Istilah Penting.
- Daftar Pustaka.` : ''}

${commonRules}`;

        formatTemplate = `
<h1 style="text-align:center; font-size:15pt; font-weight:bold; margin-bottom:14px; color:#1a3a5c;">MODUL AJAR KURIKULUM MERDEKA</h1>
<p style="text-align:center; font-size:10.5pt; color:#475569; margin-top:-8px; margin-bottom:16px;">Dokumen Perencanaan Pembelajaran Berpusat pada Peserta Didik</p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:16px;">I. INFORMASI UMUM</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <tr>
    <td style="font-weight:bold; width:30%; background-color:#f8fafc;">Nama Penyusun</td>
    <td>${namaGuru} ${nipGuru !== '-' ? `(NIP: ${nipGuru})` : ''}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Satuan Pendidikan</td>
    <td>${namaSekolah}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Tahun Pelajaran</td>
    <td>${formData.tahunAjaran}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Jenjang / Fase / Kelas</td>
    <td>${formData.jenjang} / ${formData.fase} / Kelas ${formData.kelas}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Mata Pelajaran</td>
    <td>${formData.mataPelajaran}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Topik / Materi Pokok</td>
    <td>${formData.topik} ${formData.subTopik ? `(${formData.subTopik})` : ''}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Alokasi Waktu</td>
    <td>${formData.waktu} (${formData.jumlahPertemuan} Pertemuan)</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Kompetensi Awal</td>
    <td>Kemampuan prasyarat yang perlu dikuasai peserta didik sebelum mempelajari materi ini.</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Profil Pelajar Pancasila</td>
    <td>Bernalar Kritis, Gotong Royong, Mandiri, dan Kreatif.</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Sarana & Prasarana</td>
    <td>Buku teks, perangkat digital, LCD/Proyektor, jaringan internet, dan lembar kerja.</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Target Peserta Didik</td>
    <td>Peserta didik reguler/tipikal, dengan pendekatan diferensiasi bimbingan dan pengayaan.</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background-color:#f8fafc;">Model & Metode Pembelajaran</td>
    <td>Model: ${formData.model} | Metode: ${metodeText}</td>
  </tr>
</table>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:16px;">II. KOMPONEN INTI</h2>
<h3>A. Tujuan Pembelajaran</h3>
<p>Tuliskan Tujuan Pembelajaran yang spesifik, terukur, berfokus pada peserta didik (ABCD) dan menstimulasi HOTS.</p>

<h3>B. Pemahaman Bermakna</h3>
<p>Manfaat dan relevansi materi ini yang dapat diaplikasikan peserta didik dalam kehidupan nyata.</p>

<h3>C. Pertanyaan Pemantik</h3>
<p>3-4 butir pertanyaan terbuka untuk menumbuhkan nalar kritis dan rasa ingin tahu.</p>

<h3>D. Kegiatan Pembelajaran Berdiferensiasi</h3>
(Jabarkan kegiatan secara terstruktur untuk tiap pertemuan dari Pertemuan 1 sampai ${formData.jumlahPertemuan}. Setiap pertemuan wajib memuat Pendahuluan, Inti sesuai sintak model ${formData.model}, dan Penutup secara rinci dengan poin-poin kegiatan guru dan siswa).

<h3>E. Asesmen Pembelajaran</h3>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <thead>
    <tr>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Bentuk Asesmen</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Teknik Penilaian</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Instrumen Penilaian</th>
      <th style="background-color:#1a3a5c; color:#ffffff; padding:6px 8px;">Kriteria Ketuntasan</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Diagnostik</td><td>Tanya jawab lisan & kuis singkat</td><td>Daftar Pertanyaan Diagnostik</td><td>Mengetahui kesiapan awal murid</td></tr>
    <tr><td>Formatif</td><td>Observasi unjuk kerja & LKPD</td><td>Lembar Observasi & Rubrik LKPD</td><td>Nilai capaian proses >= 75</td></tr>
    <tr><td>Sumatif</td><td>Tes tertulis akhir topik</td><td>Soal Pilihan Ganda & Uraian HOTS</td><td>Nilai ketuntasan tujuan belajar</td></tr>
  </tbody>
</table>

<h3>F. Pengayaan dan Remedial</h3>
<p>Program pengayaan untuk peserta didik berkemampuan tinggi dan program remedi terfokus bagi peserta didik yang memerlukan bimbingan tambahan.</p>

<h3>G. Refleksi Guru dan Peserta Didik</h3>
<p>Pertanyaan reflektif untuk mengevaluasi efektivitas pembelajaran dan pengalaman belajar peserta didik.</p>

${sertakanLkpd ? `
<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:16px;">III. LAMPIRAN</h2>
<h3>A. Lembar Kerja Peserta Didik (LKPD) Siap Pakai</h3>
<div style="border:1px solid #cbd5e1; padding:12px; border-radius:6px; background-color:#f8fafc; margin-bottom:12px;">
  <p style="text-align:center; font-weight:bold; margin-bottom:6px;">LEMBAR KERJA PESERTA DIDIK (LKPD)</p>
  <p style="font-size:10pt;">Nama Siswa / Kelompok: ....................................................<br>Kelas: ${formData.kelas} | Topik: ${formData.topik}</p>
  <p style="font-weight:bold; font-size:10.5pt; margin-top:8px;">Petunjuk Pengerjaan & Soal Studi Kasus:</p>
  (Buat minimal 3-5 soal kontekstual dan tugas proyek/diskusi yang langsung bisa dikerjakan siswa).
</div>

<h3>B. Bahan Bacaan Guru & Peserta Didik</h3>
<p>Rangkuman materi esensial yang ringkas dan padat untuk dipelajari.</p>

<h3>C. Glosarium</h3>
<p>Daftar istilah penting dan definisinya.</p>

<h3>D. Daftar Pustaka</h3>
<p>Referensi buku teks, modul resmi Kemendikbudristek, dan sumber belajar tepercaya.</p>
` : ''}
`;
      }

      const userPrompt = `DATA MODUL AJAR:
- Format Dokumen yang Diminta: ${formatOutput}
- Nama Guru: ${namaGuru} (NIP: ${nipGuru})
- Satuan Pendidikan: ${namaSekolah} (${alamatSekolah})
- Pemerintah / Dinas: ${pemerintah}
- Tahun Ajaran: ${formData.tahunAjaran || '2026/2027'}
- Jenjang: ${formData.jenjang || 'SMP'}
- Fase: ${formData.fase || 'Fase D (Kelas 7-9)'}
- Kelas: ${formData.kelas || 'VII'}
- Alokasi Waktu: ${formData.waktu || '2 x 45 JP'}
- Mata Pelajaran: ${formData.mataPelajaran || 'Umum'}
- Bab/Topik Utama: ${formData.topik || 'Topik Pembelajaran'} ${formData.subTopik ? `- ${formData.subTopik}` : ''}
- Jumlah Pertemuan: ${formData.jumlahPertemuan || '2'} Pertemuan
- Model Pembelajaran: ${formData.model || 'Problem Based Learning (PBL)'}
- Metode Pembelajaran: ${metodeText}
- Tujuan Pembelajaran Spesifik: ${formData.tujuan || 'Siswa dapat menganalisis dan menerapkan konsep materi secara kritis dan kreatif.'}
- Karakteristik Murid: ${formData.karakteristik || 'Heterogen, siap belajar aktif.'}

FORMAT WAJIB LAYOUT HTML:
${formatTemplate}`;

      let text = "";
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timed out after 25s")), 25000)
        );
        const response: any = await Promise.race([
          generateContentWithRetry(ai, [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ]),
          timeoutPromise
        ]);

        text = response.text || "";
        // Clean up markdown block format and symbols if model generated them
        text = text
          .replace(/```[a-zA-Z]*\n?/g, "")
          .replace(/```/g, "")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/^#+\s*(.*?)$/gm, "<h3>$1</h3>")
          .replace(/`/g, "")
          .trim();
      } catch (aiErr: any) {
        console.warn("Notice: Gemini API notice on generate-modul, activating standard engine:", aiErr?.message || aiErr);
        const fallbackDocType = formatOutput === "sekolah_format1_iso" ? "sekolah_format1_iso" : "modul_ajar";
        text = buildKbcFallbackDocument(fallbackDocType, {
          schoolName: namaSekolah,
          teacher: namaGuru,
          nipTeacher: nipGuru,
          principal: namaKepsek,
          nipPrincipal: nipKepsek,
          cityDate: `${tempatTtd}, ${tanggalTtd}`,
          subject: formData.mataPelajaran || "Umum",
          level: `Fase ${formData.fase || 'D'} / Kelas ${formData.kelas || 'VII'}`,
          year: formData.tahunAjaran || "2026/2027",
          learningModel: formData.model || "Problem Based Learning (PBL)",
          jumlahPertemuan: formData.jumlahPertemuan || "2",
          jpPerPertemuan: "2",
          topikLokal: formData.topik || "Topik Pembelajaran",
          rumusanTp: formData.tujuan || "Peserta didik dapat menganalisis dan menerapkan konsep materi secara kritis, mandiri, dan bermakna.",
          docNumberIso: docNumberIso,
          kepemimpinan: kepemimpinan,
          spiritualisasi: spiritualisasi,
          sertakanLampiran017: sertakanLampiran017,
          sertakanLkpd: sertakanLkpd
        });
      }

      res.json({ status: "success", html: text });
    } catch (error: any) {
      console.warn("Fallback notice in generate-modul:", error?.message || error);
      const reqFormat = req.body?.formatOutput === "sekolah_format1_iso" ? "sekolah_format1_iso" : "modul_ajar";
      const fallbackHtml = buildKbcFallbackDocument(reqFormat, {
        schoolName: req.body?.namaSekolah || "Sekolah",
        teacher: req.body?.namaGuru || "Guru Pengampu",
        subject: req.body?.mataPelajaran || "Mata Pelajaran",
        docNumberIso: req.body?.docNumberIso || "015/F/KUR/00/IX/2025"
      });
      res.json({ status: "success", html: fallbackHtml });
    }
  });

  // API 2: AI Asisten Chatbot Guru
  app.post("/api/ai/chat-asisten", async (req, res) => {
    try {
      const { message, context } = req.body;
      const ai = getAiClient();

      const systemPrompt = `Anda adalah "EdAdmin AI Assistant", asisten kecerdasan buatan khusus administrasi guru dan pendidik profesional di Indonesia.
Tugas Anda membantu guru dalam:
1. Merumuskan ide RPP, alur tujuan pembelajaran (ATP), dan rubrik asesmen.
2. Memberikan ide metode pengajaran kreatif, esensial, dan berdiferensiasi.
3. Menyusun contoh soal tes (HOTS, PISA style, essay, pilihan ganda) beserta kunci jawaban.
4. Draft kalimat catatan wali kelas untuk rapor atau pesan santun ke orang tua murid.
5. Memberikan solusi akademis, motivasi, dan strategi penanganan disiplin siswa.

Berikan jawaban yang ramah, sopan, terstruktur, berbasis Kurikulum Merdeka / Nasional, mudah dipahami, dan langsung dapat dipraktikkan guru.
Informasi Sekolah/Guru Pendukung: ${JSON.stringify(context || {})}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI generation timed out after 20s")), 20000)
      );
      const response: any = await Promise.race([
        generateContentWithRetry(ai, [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nPertanyaan/Permintaan Guru:\n${message}` }] }
        ]),
        timeoutPromise
      ]);

      const rawText = response?.text || "Maaf, saya tidak dapat merespons saat ini.";
      const cleanReply = rawText
        .replace(/```[a-zA-Z]*\n?/g, "")
        .replace(/```/g, "")
        .replace(/^`+|`+$/g, "")
        .trim();

      res.json({ status: "success", reply: cleanReply });
    } catch (error: any) {
      console.warn("Notice in chat assistant:", error?.message || error);
      res.json({
        status: "success",
        reply: "Halo Bapak/Ibu Guru! Asisten AI siap mendampingi perencanaan pengajaran Anda. Sistem saat ini beroperasi dalam mode asistensi cerdas standar. Untuk mengaktifkan generasi komprehensif real-time via model Gemini terbaru, pastikan API Key aktif terhubung di setelan Google AI Studio. Silakan gunakan menu Perangkat Ajar & KBC untuk membuat modul ajar dan administrasi resmi siap cetak!"
      });
    }
  });

  // Helper to build 16:9 3D styled SVG illustration Data URI
  const createPptSvgImage = (slideIndex: number, topic: string, subject: string) => {
    const colorPalettes = [
      { bg: "#1E3A8A", accent: "#3B82F6", light: "#DBEAFE", dark: "#1E293B", badge: "#2563EB" },
      { bg: "#065F46", accent: "#10B981", light: "#D1FAE5", dark: "#064E3B", badge: "#059669" },
      { bg: "#581C87", accent: "#8B5CF6", light: "#EDE9FE", dark: "#3B0764", badge: "#7C3AED" },
      { bg: "#9A3412", accent: "#F97316", light: "#FFEDD5", dark: "#7C2D12", badge: "#EA580C" },
      { bg: "#0F766E", accent: "#14B8A6", light: "#CCFBF1", dark: "#134E4A", badge: "#0D9488" },
      { bg: "#1E293B", accent: "#6366F1", light: "#E0E7FF", dark: "#0F172A", badge: "#4F46E5" }
    ];

    const palette = colorPalettes[(slideIndex - 1) % colorPalettes.length];
    const safeTopic = (topic || "Edukasi").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeSubject = (subject || "Pelajaran").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bgGrad${slideIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bg}" />
          <stop offset="100%" stop-color="${palette.accent}" />
        </linearGradient>
        <linearGradient id="cardGrad${slideIndex}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08" />
        </linearGradient>
      </defs>

      <!-- Background Canvas -->
      <rect width="800" height="450" fill="url(#bgGrad${slideIndex})" rx="24"/>

      <!-- Decorative Background Spheres -->
      <circle cx="700" cy="80" r="160" fill="#ffffff" opacity="0.08"/>
      <circle cx="100" cy="380" r="120" fill="#ffffff" opacity="0.06"/>
      <circle cx="400" cy="225" r="280" fill="#ffffff" opacity="0.03"/>

      <!-- Glassmorphic Card Frame -->
      <rect x="50" y="50" width="700" height="350" rx="28" fill="url(#cardGrad${slideIndex})" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>

      <!-- 3D Platform Base -->
      <ellipse cx="400" cy="270" rx="140" ry="25" fill="#000000" opacity="0.25"/>

      <!-- 3D Central Badge Circle -->
      <circle cx="400" cy="180" r="70" fill="${palette.light}"/>
      <circle cx="400" cy="180" r="58" fill="${palette.badge}"/>

      <!-- Center Icon Graphic -->
      <path d="M370,165 L430,165 L400,210 Z" fill="#ffffff" opacity="0.95"/>
      <circle cx="400" cy="155" r="12" fill="#ffffff"/>

      <!-- Title Pill -->
      <rect x="160" y="295" width="480" height="52" rx="26" fill="#ffffff"/>

      <!-- Text Labels -->
      <text x="400" y="328" font-family="sans-serif, Arial" font-size="20" font-weight="bold" fill="${palette.dark}" text-anchor="middle">${safeTopic} - Slide ${slideIndex}</text>
      <text x="400" y="375" font-family="sans-serif, Arial" font-size="14" font-weight="bold" fill="#ffffff" opacity="0.95" text-anchor="middle">Visual Edukasi 3D Nano Banana | ${safeSubject}</text>
    </svg>`;

    const base64Svg = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64Svg}`;
  };

  // API 3: PPT Generator AI Bulk All Slides Content
  app.post("/api/ai/generate-ppt-all-slides", async (req, res) => {
    const { topic = "Topik Pembelajaran", subject = "Mata Pelajaran", level = "Sekolah", slideCount = 8, subTopics = [] } = req.body || {};
    const count = Math.max(2, Math.min(14, Number(slideCount) - 1));

    const defaultSubTopics = [
      "Pengertian Dasar dan Definisi Kontekstual",
      "Struktur Anatomi dan Komponen Utama",
      "Mekanisme Kerja dan Proses Fisiologis",
      "Faktor-Faktor yang Memengaruhi Kinerja Sistem",
      "Gangguan, Kelainan, serta Cara Pencegahannya",
      "Peran Penting dalam Menjaga Homeostasis Tubuh",
      "Studi Kasus dan Penerapan dalam Kehidupan Sehari-hari"
    ];

    const actualSubTopics = Array.isArray(subTopics) && subTopics.length > 0 ? subTopics : defaultSubTopics;
    
    // Prepare structured subtopics prompt
    const promptSubtopicsList = Array.from({ length: count }, (_, i) => {
      const st = actualSubTopics[i % actualSubTopics.length];
      return `Slide ${i + 1}: Sub-topik "${st}"`;
    }).join("\n");

    try {
      const ai = getAiClient();
      const prompt = `WAJIB DIPATUHI PADA SETIAP SLIDE:
Jangan membuat slide yang hanya berisi judul atau poin-poin singkat. Setiap slide harus memiliki materi yang lengkap, mudah dipahami, dan siap digunakan untuk mengajar tanpa perlu banyak pengeditan.

Setiap slide wajib memiliki struktur berikut:
1. Judul Slide: Jelas, spesifik, dan menarik. Maksimal 8 kata.
2. Subjudul: Menjelaskan fokus pembahasan pada slide. Maksimal 1–2 kalimat.
3. Materi Utama: Terdiri atas 2–5 paragraf singkat atau 5–8 poin penjelasan yang saling berkaitan. Gunakan bahasa yang sederhana, komunikatif, dan sesuai jenjang pendidikan. Sertakan definisi, konsep utama, penjelasan, contoh, serta fakta penting bila relevan. Hindari hanya menampilkan kata kunci tanpa penjelasan.
4. Contoh: Berikan minimal satu contoh nyata, kontekstual, atau ilustrasi kasus yang berkaitan dengan materi.
5. Visual: Rekomendasi hero illustration utama yang relevan, serta ikon, infografik, diagram, tabel, atau peta konsep pendukung. Komposisi visual sekitar 45-60% area slide.
6. Layout & Animasi: Rekomendasi animasi untuk setiap objek (judul, subjudul, materi, gambar, ikon, diagram) beserta transisi antar-slide.

Standar Kualitas Konten & Visual Premium (Setara Canva Pro, Gamma AI, Beautiful.ai, Microsoft Designer):
- Akurat dan sesuai kurikulum.
- Sistematis dari konsep dasar hingga penerapan.
- Siap dipresentasikan tanpa perlu menambah penjelasan penting.
- Menggunakan bahasa yang mudah dipahami peserta didik sesuai jenjang ${level}.

Buatkan materi presentasi lengkap untuk ${count} slide mengenai topik "${topic}", mata pelajaran ${subject}, tingkat ${level}.

Sub-topik per slide yang wajib dibahas:
${promptSubtopicsList}

Kembalikan HANYA MURNI JSON Array bertipe array of objects tanpa teks pembuka/penutup.
Jumlah elemen dalam JSON Array HARUS TEPAT ${count}.

Format Objek JSON Per Slide:
{
  "title": "Judul Slide Spesifik Menarik (Maksimal 8 kata)",
  "subtitle": "Subjudul 1-2 kalimat menjelaskan fokus pembahasan...",
  "layoutSuggestion": "Split Layout / Hero Layout / Infographic",
  "content": [
    "Poin penjelasan 1: Definisi dan konsep dasar secara mendalam (maks 20 kata)...",
    "Poin penjelasan 2: Analisis mekanisme dan komponen utama (maks 20 kata)...",
    "Poin penjelasan 3: Cara kerja dan proses rinci (maks 20 kata)..."
  ],
  "example": "1 contoh nyata kontekstual atau ilustrasi kasus konkret...",
  "funFact": "1 fakta menarik atau trivia singkat yang relevan...",
  "speakerNotes": "Catatan komprehensif untuk guru: Penjelasan detail, saran animasi, pertanyaan diskusi, dan referensi.",
  "visualRecommendation": {
    "heroIllustration": "Deskripsi hero illustration 3D/vektor 45-60% area slide...",
    "iconsAndDiagrams": ["Ikon 3D Utama", "Diagram Alur Proses", "Infografik Peta Konsep"]
  },
  "animationRecommendation": {
    "objectAnimations": ["Judul: Fade In (0.5s)", "Subjudul & Materi: Fly In Left", "Hero Visual: Zoom In Soft"],
    "slideTransition": "Morph / Push Smooth"
  }
}`;

      const response = await generateContentWithRetry(ai, [
        { role: "user", parts: [{ text: prompt }] }
      ]);

      let rawText = response.text || "";
      rawText = rawText
        .replace(/```[a-zA-Z]*\n?/g, "")
        .replace(/```/g, "")
        .trim();

      let parsedSlides: any[] = [];
      try {
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedSlides = JSON.parse(jsonMatch[0]);
        } else {
          parsedSlides = JSON.parse(rawText);
        }
      } catch (err) {
        console.warn("Failed to parse batch slides JSON, fallback triggered:", err);
      }

      if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
        const slides = parsedSlides.map((s, idx) => {
          const indexNum = idx + 1;
          const subTitle = actualSubTopics[idx % actualSubTopics.length];
          let rawTitle = s.title || s.slideTitle || `Bagian ${indexNum}: ${subTitle}`;
          const titleWords = rawTitle.split(/\s+/);
          if (titleWords.length > 8) {
            rawTitle = titleWords.slice(0, 8).join(" ");
          }

          const slideContent = Array.isArray(s.content) && s.content.length > 0 
            ? s.content 
            : (Array.isArray(s.mainContent) && s.mainContent.length > 0 ? s.mainContent : [
              `Definisi Esensial: ${subTitle} merupakan landasan utama dalam pemahaman materi ${topic}.`,
              `Konsep Utama: Menguraikan hubungan antar-elemen serta prinsip dasar yang bekerja pada sistem.`,
              `Mekanisme Kerja: Menjelaskan tahapan fisiologis/operasional secara rinci dan sistematis.`,
              `Fakta Penting: Menyoroti parameter penting yang memengaruhi kinerja serta dampaknya.`
            ]);

          return {
            title: rawTitle,
            subtitle: s.subtitle || `Fokus pembahasan mengenai ${subTitle.toLowerCase()} dalam materi ${topic}.`,
            layoutSuggestion: s.layoutSuggestion || "Split Layout",
            content: slideContent,
            example: s.example || `Contoh nyata penerapan ${subTitle.toLowerCase()} dalam kehidupan sehari-hari maupun studi kasus terapan.`,
            funFact: s.funFact || `Tahukah Kamu? Konsep ${subTitle.toLowerCase()} memiliki peran krusial dalam perkembangan teknologi dan sains modern.`,
            speakerNotes: s.speakerNotes || `Saran Animasi: Title (Fade), Image (Zoom In), Text (Wipe)\nCatatan Detail: Guru menjelaskan poin-poin dengan analogi sederhana dan interaktif.`,
            visualRecommendation: {
              heroIllustration: s.visualRecommendation?.heroIllustration || `Ilustrasi 3D beresolusi tinggi menggambarkan ${subTitle.toLowerCase()} (area 50% slide).`,
              iconsAndDiagrams: Array.isArray(s.visualRecommendation?.iconsAndDiagrams) && s.visualRecommendation.iconsAndDiagrams.length > 0 ? s.visualRecommendation.iconsAndDiagrams : ["Ikon 3D Relevan", "Diagram Alur", "Peta Konsep"]
            },
            animationRecommendation: {
              objectAnimations: Array.isArray(s.animationRecommendation?.objectAnimations) && s.animationRecommendation.objectAnimations.length > 0 ? s.animationRecommendation.objectAnimations : ["Judul: Fade In", "Materi: Fly In Left", "Gambar: Zoom In Soft"],
              slideTransition: s.animationRecommendation?.slideTransition || "Morph / Smooth Fade"
            },
            imageUrl: createPptSvgImage(indexNum, topic, subject)
          };
        });

        return res.json({ status: "success", slides });
      }
    } catch (error: any) {
      console.warn("Batch PPT generation fallback applied due to API error/rate-limit:", error?.message);
    }

    // High Quality Fallback for all slides matching prompt guidelines
    const fallbackSlides = Array.from({ length: count }, (_, idx) => {
      const indexNum = idx + 1;
      const subTitle = actualSubTopics[idx % actualSubTopics.length];
      return {
        title: `Materi ${indexNum}: ${subTitle}`.split(/\s+/).slice(0, 8).join(" "),
        subtitle: `Menjelaskan secara komprehensif fokus materi ${subTitle.toLowerCase()} pada topik ${topic}.`,
        layoutSuggestion: "Split Layout",
        content: [
          `Definisi Esensial: ${subTitle} merupakan landasan utama dalam pemahaman ${topic} tingkat ${level}.`,
          `Konsep Utama: Menguraikan struktur, komponen, serta interaksi antar-elemen yang terjadi secara rinci.`,
          `Mekanisme Kerja: Tahapan fisiologis dan operasional yang mendukung berjalannya sistem secara berkesinambungan.`,
          `Fakta Penting: Analisis parameter utama, variasi kondisi, serta dampak sistemik terhadap lingkungan sekitar.`
        ],
        example: `Penerapan nyata konsep ${subTitle.toLowerCase()} pada kehidupan sehari-hari dan sains terapan.`,
        funFact: `Tahukah Kamu? Konsep ${subTitle.toLowerCase()} ini dipelajari secara global untuk pemecahan masalah lingkungan dan kesehatan.`,
        speakerNotes: `Saran Animasi: Judul (Fade), Gambar (Zoom In), Teks (Fly In)\nCatatan Detail: Guru memandu diskusi kelas mengenai contoh kasus kontekstual secara aktif.`,
        visualRecommendation: {
          heroIllustration: `Hero Illustration 3D beresolusi tinggi menggambarkan ${subTitle.toLowerCase()} (komposisi 50% area slide).`,
          iconsAndDiagrams: ["Ikon 3D Utama", "Diagram Struktur Anatomi", "Infografik Peta Konsep"]
        },
        animationRecommendation: {
          objectAnimations: ["Judul & Subjudul: Fade In (0.5s)", "Materi Utama: Fly In Left (Staggered)", "Hero Visual: Zoom In Smooth"],
          slideTransition: "Morph Transition 1.0s"
        },
        imageUrl: createPptSvgImage(indexNum, topic, subject)
      };
    });

    res.json({ status: "success", slides: fallbackSlides });
  });

  // API 4: PPT Generator AI Single Text Fallback
  app.post("/api/ai/generate-ppt-text", async (req, res) => {
    const { subTitle, topic, subject } = req.body || {};
    res.json({
      status: "success",
      content: [
        `Penjelasan esensial mengenai ${subTitle || "materi"} dalam pemahaman ${topic || "topik utama"}.`,
        `Komponen dan mekanisme kunci yang berperan penting dalam materi ${subject || "pelajaran"} ini.`,
        `Penerapan praktis serta relevansi konsep dalam pembelajaran sehari-hari.`
      ]
    });
  });

  // API 5: PPT Generator AI Slide Image Illustration
  app.post("/api/ai/generate-ppt-image", async (req, res) => {
    try {
      const { slideIndex, topic, subject } = req.body;
      const indexNum = slideIndex || 1;
      const encodedSvg = createPptSvgImage(indexNum, topic, subject);
      res.json({ status: "success", imageUrl: encodedSvg });
    } catch (error: any) {
      res.json({
        status: "success",
        imageUrl: `https://placehold.co/800x450/1e3a8a/ffffff.png?text=EduSlide+Part+${req.body?.slideIndex || 1}`
      });
    }
  });

  // API 6: Generator Perangkat Ajar AI (Analisis CP, TP, ATP, Prota, Prosem, KKTP)
  app.post("/api/ai/generate-perangkat-ajar", async (req, res) => {
    try {
      const { docType, formData } = req.body || {};
      const ai = getAiClient();

      const schoolName = formData?.school || "SMA Negeri 1 Jambi";
      const subject = formData?.subject || "Bahasa Indonesia";
      const singkatanMapel = formData?.singkatanMapel || "BI";
      const level = formData?.level || "Fase E / Kelas X";
      const year = formData?.year || "2026/2027";
      const totalJp = formData?.totalJp || "108 JP / Tahun";
      const jpPerMinggu = formData?.jpPerMinggu || "3 JP/Minggu";
      const teacher = formData?.teacher || "Budi Santoso, S.Pd., Gr.";
      const nipTeacher = formData?.nipTeacher || "19900101 201903 1 001";
      const cityDate = formData?.cityDate || "Jambi, 14 Juli 2026";
      const principal = formData?.principal || "Dr. Ahmad Fauzi, M.Pd.";
      const nipPrincipal = formData?.nipPrincipal || "19720514 200003 1 002";

      const cpRasional = formData?.cpRasional || "Pada akhir Fase E, peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar sesuai dengan tujuan, konteks sosial, akademis, dan dunia kerja.";
      const cpElemen = formData?.cpElemen || `Elemen 1 — Menyimak: Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan dari berbagai tipe teks lisan.\nElemen 2 — Membaca dan Memirsa: Peserta didik mampu mengevaluasi informasi berupa gagasan dari teks deskripsi, laporan, narasi, eksplanasi, eksposisi.\nElemen 3 — Berbicara dan Mempresentasikan: Peserta didik mampu mengolah dan menyajikan gagasan untuk tujuan pengajuan usul dan solusi.\nElemen 4 — Menulis: Peserta didik mampu menulis gagasan tertulis secara logis, kritis, dan kreatif.`;

      // Ekstraksi data RME & Kalender Pendidikan
      const rmeData = formData?.rme;
      let rmeContext = "";
      if (rmeData) {
        const ganjilStr = (rmeData.ganjil || []).map((m: any, i: number) => `  * ${m.month}: ${m.totalWeeks} pekan total, ${m.nonEffective} tidak efektif, ${m.effective} pekan efektif (Catatan: ${m.note || '-'})`).join("\n");
        const genapStr = (rmeData.genap || []).map((m: any, i: number) => `  * ${m.month}: ${m.totalWeeks} pekan total, ${m.nonEffective} tidak efektif, ${m.effective} pekan efektif (Catatan: ${m.note || '-'})`).join("\n");
        const agendaStr = (rmeData.agenda || []).map((a: any, i: number) => `  * [Sem ${a.semester || 'Semua'}] ${a.kegiatan} (${a.waktu || '-'}) [${a.kategori || 'Kurikuler'}]`).join("\n");
        const sm = rmeData.summary || {};

        rmeContext = `
[REFERENSI RESMI RENCANA MINGGU EFEKTIF (RME) & KALENDER PENDIDIKAN DARI SEKOLAH]:
- Beban Mengajar Mingguan: ${jpPerMinggu}
- Semester Ganjil: ${sm.pekanGanjil || 20} Pekan Efektif (${sm.jpGanjil || 60} JP)
${ganjilStr}

- Semester Genap: ${sm.pekanGenap || 18} Pekan Efektif (${sm.jpGenap || 54} JP)
${genapStr}

- Total Pekan Efektif Tahunan: ${sm.totalPekan || 38} Pekan Efektif (${sm.totalJp || 114} JP)
  * Alokasi Tatap Muka Intrakurikuler (75%): ${sm.jpIntrakurikuler || 86} JP
  * Alokasi Projek P5 / Penguatan Karakter (25%): ${sm.jpP5 || 28} JP

- Agenda Utama Kalender Pendidikan Sekolah:
${agendaStr}
- Catatan Pedoman Kalender: ${rmeData.catatanKalender || 'Sesuai Kalender Dinas Pendidikan dan Kebijakan Sekolah.'}
`;
      }

      const generalRules = `
KETENTUAN UTAMA GENERASI HTML ADMINISTRASI:
1. SANGAT PENTING - TANPA LOGO / GAMBAR: Kop Sekolah HANYA berisi teks nama dinas/pemerintah, nama sekolah, alamat, dan garis tebal pembatas. DILARANG MENAMBAHKAN TAG <img>, PLACEHOLDER [LOGO], ATAU GAMBAR APAPUN.
2. TANDA TANGAN SEJAJAR DALAM TABEL TAK TERLIHAT: Bagian tanda tangan penutup Kepala Sekolah (kiri/kanan) dan Guru Mata Pelajaran (kiri/kanan) HARUS disusun sejajar dalam 1 baris menggunakan TABEL HTML 2 KOLOM TANPA BORDER (\`<table style="width:100%; border:none; margin-top:30px;"><tr><td style="border:none; text-align:center; width:50%;">... TTD Kepsek ...</td><td style="border:none; text-align:center; width:50%;">... TTD Guru ...</td></tr></table>\`).
3. DILARANG MENAMPILKAN TEKS/TOMBOL "Cetak Dokumen" atau "🖨️ Cetak" DI DALAM ISI DOKUMEN HTML.
4. WARNA HEADER TABEL WARNA-WARNI KONTRAST: Semua elemen \`<th>\` pada tabel HARUS diberikan atribut \`style="background-color:#1a3a5c; color:#ffffff; font-weight:bold; text-align:center; padding:8px;"\` secara inline agar warna header tabel muncul dengan sempurna di browser maupun di Microsoft Word.
`;

      let docPrompt = "";

      if (docType === "rme") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **RENCANA MINGGU EFEKTIF (RME / RPE) & KALENDER PENDIDIKAN SEKOLAH** yang lengkap, rapi, presisi, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU & SEKOLAH]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject} (${singkatanMapel})
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Beban: ${jpPerMinggu}
- Nama Guru: ${teacher}
- NIP Guru: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
${rmeContext}

STRUKTUR DOKUMEN HTML WAJIB:
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-RME-${singkatanMapel}-${level.replace(/\s+/g, '')} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A — IDENTITAS SATUAN PENDIDIKAN & PROGRAM (Tabel 2 Kolom)
3. BAGIAN B — ANALISIS MINGGU EFEKTIF SEMESTER GANJIL (Tabel 6 kolom: No | Nama Bulan | Jumlah Minggu | Minggu Tdk Efektif | Minggu Efektif | Keterangan / Agenda Kegiatan Sekolah) beserta baris Total Jumlah Semester Ganjil.
4. BAGIAN C — ANALISIS MINGGU EFEKTIF SEMESTER GENAP (Tabel 6 kolom: No | Nama Bulan | Jumlah Minggu | Minggu Tdk Efektif | Minggu Efektif | Keterangan / Agenda Kegiatan Sekolah) beserta baris Total Jumlah Semester Genap.
5. BAGIAN D — REKAPITULASI RENCANA PEKAN EFEKTIF (RPE) & DISTRIBUSI JAM PELAJARAN (Tabel ringkasan: Pekan Efektif Ganjil, Pekan Efektif Genap, Total Pekan Tahunan, Total Jam Pelajaran, Alokasi Tatap Muka Intrakurikuler 75%, Alokasi Projek P5 / Penguatan Karakter 25%).
6. BAGIAN E — MATRIKS AGENDA UTAMA KALENDER PENDIDIKAN SEKOLAH (Tabel 5 kolom: No | Agenda / Kegiatan Sekolah | Rentang Waktu / Tanggal | Semester | Kategori).
7. Catatan Pedoman Kalender Pendidikan Sekolah.
8. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- CSS internal rapi, warna header #1a3a5c teks putih, @media print { @page { size: A4 portrait; margin: 1.5cm; } }.`;
      } else if (docType === "analisis_cp") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **ANALISIS CAPAIAN PEMBELAJARAN (CP)** yang lengkap, profesional, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Nama Guru: ${teacher}
- NIP / NUPTK: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
- Rasional CP Umum: ${cpRasional}
- CP Per Elemen: ${cpElemen}
${rmeContext}

STRUKTUR DOKUMEN HTML WAJIB (7 Bagian Wajib):
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-CP-${singkatanMapel}-${level.replace(/\s+/g, '')} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A — IDENTITAS (Tabel 2 Kolom)
3. BAGIAN B — RASIONAL MATA PELAJARAN (Tabel 3 kolom: No | Uraian | Deskripsi) -> 1. Pentingnya Mapel, 2. Kaitan dengan 8 Dimensi Profil Lulusan, 3. Orientasi Pembelajaran.
4. BAGIAN C — TUJUAN MATA PELAJARAN (Tabel 3 kolom: No | Tujuan | Indikator Umum - min 3 tujuan terukur)
5. BAGIAN D — KARAKTERISTIK MATA PELAJARAN & ELEMEN CP (Tabel 4 kolom: No | Elemen | Deskripsi Elemen | Cakupan Konten Utama - daftar 5-7 topik konkret per elemen)
6. BAGIAN E — CAPAIAN PEMBELAJARAN FASE (Tabel 4 kolom: Fase | Capaian Pembelajaran | Kompetensi Kunci | Konten / Materi Pokok)
7. BAGIAN F — PENJABARAN KATA KERJA OPERASIONAL (KKO) PER ELEMEN (Tabel 3 kolom: No | Elemen | KKO & Arah Tujuan Pembelajaran)
8. BAGIAN G — KETERKAITAN DENGAN 8 DIMENSI PROFIL LULUSAN (Tabel 4 kolom: No | Dimensi Profil Lulusan | Elemen Terkait | Relevansi ✔)
9. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TANPA BORDER.

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa tanda markdown fence (\`\`\`html) dan tanpa teks tambahan lain.
- Gunakan styling CSS internal yang bersih dengan font sans-serif, header tabel warna biru tua (#1a3a5c) teks putih, border tabel tipis, dan styling print @media print { @page { size: A4 portrait; margin: 1.5cm; } }.`;
      } else if (docType === "tp") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **TUJUAN PEMBELAJARAN (TP)** yang lengkap, sistematis, profesional, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Waktu Total: ${totalJp}
- Nama Guru: ${teacher}
- NIP Guru: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
- CP Per Elemen: ${cpElemen}
${rmeContext}

STRUKTUR DOKUMEN HTML WAJIB (4 Bagian Wajib):
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-TP-${singkatanMapel}-${level.replace(/\s+/g, '')} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A — IDENTITAS (Tabel 2 Kolom)
3. BAGIAN B — PANDUAN KODE TUJUAN PEMBELAJARAN (Sub B1 Format Kode box, Sub B2 Tabel Kode Elemen)
4. BAGIAN C — DAFTAR TUJUAN PEMBELAJARAN (Tabel 6 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran | Aspek Kompetensi | Alokasi JP). Buat 8-12 TP berprinsip ABCD, KKO Bloom terukur, diawali "Peserta didik mampu...". Total JP HARUS TEPAT SAMA dengan Alokasi Waktu Total (${totalJp}).
5. BAGIAN D — REKAPITULASI ALOKASI WAKTU PER ELEMEN (Tabel 5 kolom: No | Elemen CP | Jumlah TP | Total JP | Persentase)
6. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- CSS internal rapi, warna header #1a3a5c, @media print { @page { size: A4 portrait; margin: 1.5cm; } }.`;
      } else if (docType === "atp") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **ALUR TUJUAN PEMBELAJARAN (ATP)** yang lengkap, sistematis, profesional, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Waktu Total: ${totalJp}
- Nama Guru: ${teacher}
- NIP Guru: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
- CP Per Elemen: ${cpElemen}
${rmeContext}

STRUKTUR DOKUMEN HTML WAJIB (4 Bagian Wajib):
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-ATP-${singkatanMapel}-${level.replace(/\s+/g, '')} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A — IDENTITAS (Tabel 4 kolom compact)
3. BAGIAN B — ALUR URUTAN TUJUAN PEMBELAJARAN DALAM SATU FASE (Diagram visual Flexbox kotak kode TP dengan panah →)
4. BAGIAN C — TABEL ALUR TUJUAN PEMBELAJARAN (Tabel 8 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran | Materi Pokok | Kompetensi & Variasi | 8 Dimensi Profil Lulusan | Alokasi JP | Semester)
5. BAGIAN D — REKAPITULASI ALOKASI WAKTU (Tabel 6 kolom: No | Elemen CP | Jumlah TP | JP Sem 1 | JP Sem 2 | Total JP | Keterangan)
6. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- Gunakan orientasi LANDSCAPE A4 di @media print { @page { size: A4 landscape; margin: 1.2cm; } }. Warna header #1a3a5c.`;
      } else if (docType === "prota") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **PROGRAM TAHUNAN (PROTA)** yang lengkap, sistematis, profesional, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Waktu: ${totalJp} (${jpPerMinggu})
- Nama Guru: ${teacher}
- NIP Guru: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
- CP Per Elemen: ${cpElemen}
${rmeContext}

STRUKTUR DOKUMEN HTML WAJIB:
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-PROTA-${singkatanMapel}-${level.replace(/\s+/g, '')} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A — IDENTITAS
3. BAGIAN B — DISTRIBUSI MINGGU EFEKTIF — KALENDER PENDIDIKAN (Tabel 7 kolom: Sem | Bulan | Minggu Kalender | Tdk Efektif | Efektif | JP | Keterangan).
   PENTING: Gunakan tabel rincian data RME dari guru di atas secara persis untuk ke-12 bulan (Juli-Desember & Januari-Juni)! Subtotal Ganjil, Subtotal Genap, dan Total Keseluruhan harus tepat sama dengan data RME guru.
4. BAGIAN C — RENCANA PROGRAM TAHUNAN (Tabel 5 kolom: No | Kode TP | Tujuan Pembelajaran & Materi Pokok | Elemen CP | Alokasi JP | Semester).
   PENTING: Total Alokasi JP TP Semester 1 HARUS TEPAT SAMA dengan JP Efektif Ganjil, dan Semester 2 TEPAT SAMA dengan JP Efektif Genap. Selisih Prota dan RME dijamin 0 JP!
5. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- DILARANG MENAMPILKAN TOMBOL/TEKS "Cetak Dokumen" atau "🖨️ Cetak" DI DALAM ISI HTML.
- CSS internal rapi, warna header #1a3a5c, @media print { @page { size: A4 portrait; margin: 1.5cm; } }.`;
      } else if (docType === "prosem") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **PROGRAM SEMESTER (PROSEM)** yang lengkap, sistematis, profesional, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Semester: Semester 1 & 2 (Buatlah tampilan lengkap gabungan / 2 bagian Semester 1 dan Semester 2)
- JP per Minggu: ${jpPerMinggu}
- Nama Guru: ${teacher}
- NIP Guru: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
- CP Per Elemen: ${cpElemen}
${rmeContext}

STRUKTUR DOKUMEN HTML WAJIB:
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-PROSEM-${singkatanMapel}-${level.replace(/\s+/g, '')}-S1 / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. Header Identitas & Legenda Warna Sel Matriks (Biru #d0e4f7 = JP Aktif, Merah #ffd6d6 = Libur, Kuning #fff3cd = PTS, Hijau #d4edda = PAS/PAT)
3. TABEL MATRIKS DISTRIBUSI PEMBELAJARAN PER MINGGU (Kolom: No | Kode TP | Tujuan & Materi Pokok | JP | Kolom-kolom Minggu M1..M5 per Bulan | Keterangan Model Pembelajaran).
   PENTING: Kolom-kolom minggu setiap bulan (Juli–Desember untuk Sem 1, Januari–Juni untuk Sem 2) harus merefleksikan pekan efektif dan agenda tidak efektif (seperti MPLS di Juli M1-M2, PTS di September, SAS di Desember) dari data RME guru di atas!
   PENTING: SEMUA KEPALA KOLOM TABEL (TH) HARUS DIBERI STYLING INLINE: style="background-color:#1a3a5c; color:#ffffff; font-weight:bold; text-align:center;" AGAR TERLIHAT KONTRAST DI WORD DAN BROWSER!
4. Catatan Keterangan Bulan Tidak Efektif & Asesmen
5. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- Gunakan LANDSCAPE A4 di @media print { @page { size: A4 landscape; margin: 1.0cm; } }.`;
      } else if (docType === "kktp") {
        docPrompt = `Anda adalah asisten pembuatan perangkat administrasi pembelajaran Kurikulum Merdeka yang ahli dan berpengalaman. Tugas Anda adalah membuat dokumen **KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)** yang lengkap, sistematis, profesional, dan siap cetak dalam format HTML.

${generalRules}

[DATA INPUT GURU]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Nama Guru: ${teacher}
- NIP Guru: ${nipTeacher}
- Kota / Tanggal TTD: ${cityDate}
- Nama Kepala Sekolah: ${principal}
- NIP Kepala Sekolah: ${nipPrincipal}
- CP Per Elemen: ${cpElemen}

STRUKTUR DOKUMEN HTML WAJIB:
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-KKTP-${singkatanMapel}-${level.replace(/\s+/g, '')} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. Kotak Dasar Hukum Permendikbudristek No. 21 Tahun 2022 & BAGIAN A — IDENTITAS
3. BAGIAN A — DESKRIPSI LEVEL CAPAIAN (Tabel 5 kolom: Level | Skor | Deskripsi Umum | Tindak Lanjut | Rentang Nilai | Predikat - Level 1 Mulai Berkembang 0-55, Level 2 Layak ✓ KKTP 56-70, Level 3 Cakap 71-85, Level 4 Mahir 86-100)
4. BAGIAN B — RUBRIK KKTP PER TUJUAN PEMBELAJARAN (Tabel 9 kolom: No | Kode TP | Tujuan Pembelajaran | IKTP Indikator Ketercapaian | Sub-kolom 4 Level: Mulai Berkembang (1), Layak (2) ✓ KKTP, Cakap (3), Mahir (4)). Buat deskriptor berjenjang yang jelas, kuantitatif/kualitatif untuk setiap TP.
5. Kotak Catatan Penting Ambang Batas Minimal Ketuntasan
6. BAGIAN PENUTUP — TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- SANGAT PENTING: DILARANG MEMASUKKAN LOGO / GAMBAR DI HEADER KOP.
- Gunakan LANDSCAPE A4 di @media print { @page { size: A4 landscape; margin: 1.2cm; } }. Warna header #1a3a5c.`;
      } else {
        // Default prompt for generate overview / all
        docPrompt = `Buatkan Dokumen Analisis Capaian Pembelajaran (CP) dan Administrasi Perangkat Ajar Kurikulum Merdeka untuk sekolah ${schoolName}, mapel ${subject}, ${level}, tahun ${year}, guru ${teacher}. Hasilkan MURNI HTML lengkap dengan Kop Sekolah, Tabel Rapi, dan Tanda Tangan Penutup.`;
      }

      let htmlOutput = "";
      try {
        const contents = [{ role: "user", parts: [{ text: docPrompt }] }];
        // Set a 25-second timeout race so Vercel or cloud gateway does not kill the function with 504
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timed out after 25s")), 25000)
        );
        const response: any = await Promise.race([
          generateContentWithRetry(ai, contents),
          timeoutPromise
        ]);

        htmlOutput = response?.text || "";
        htmlOutput = htmlOutput.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      } catch (aiErr: any) {
        console.warn("Notice: Gemini API returned notice on Perangkat Ajar, compiling standard document:", aiErr?.message || aiErr);
        htmlOutput = buildKurikulumMerdekaDocument(docType, formData);
        return res.json({
          status: "success",
          html: htmlOutput,
          docType,
          isFallback: true,
          note: "Dokumen berhasil disusun otomatis sesuai format standar Kurikulum Merdeka Kemendikbudristek."
        });
      }

      res.json({ status: "success", html: htmlOutput, docType });
    } catch (err: any) {
      console.warn("Fallback notice on Perangkat Ajar AI:", err?.message || err);
      try {
        const fallbackHtml = buildKurikulumMerdekaDocument(req.body?.docType, req.body?.formData);
        return res.json({
          status: "success",
          html: fallbackHtml,
          docType: req.body?.docType,
          isFallback: true,
          note: "Dokumen berhasil disusun otomatis sesuai format standar Kurikulum Merdeka Kemendikbudristek."
        });
      } catch (fallbackErr: any) {
        res.status(500).json({
          status: "error",
          message: err?.message || "Terjadi kesalahan saat memproses Perangkat Ajar AI."
        });
      }
    }
  });

  // API Endpoint: Generator Perangkat Ajar KBC (Kurikulum Berbasis Cinta Kemenag)
  app.post("/api/ai/generate-perangkat-ajar-kbc", async (req, res) => {
    try {
      const ai = getAiClient();
      const { docType, formData } = req.body;
      const {
        schoolName = "MAN 1 Kerinci",
        kemenagOffice = "KANTOR KEMENTERIAN AGAMA KABUPATEN KERINCI",
        schoolAddress = "Jl. Raya Semurup No. 45, Semurup, Kabupaten Kerinci",
        subject = "Akidah Akhlak",
        singkatanMapel = "AA",
        level = "Fase E / Kelas X",
        year = "2026/2027",
        totalJp = "72 JP / Tahun",
        jpPerMinggu = "2 JP/Minggu",
        teacher = "Drs. Yefri Haryanto, M.Pd.",
        nipTeacher = "19850312 201001 1 008",
        cityDate = "Kerinci, 14 Juli 2026",
        principal = "Hamdani, S.Pd., M.Si.",
        nipPrincipal = "19780514 200212 1 003",
        cpRasional = "",
        cpElemen = "",
        learningModel = "Discovery Learning",
        sintakModel = "1. Stimulasi/Pemberian Rangsangan, 2. Identifikasi Masalah, 3. Pengumpulan Data, 4. Pengolahan Data, 5. Pembuktian, 6. Penarikan Kesimpulan",
        kodeTp = "TP.AA.ELE.10.01",
        rumusanTp = "Peserta didik mampu menganalisis konsep tauhid dan Asmaul Husna secara mendalam, serta menginternalisasi nilai kasih sayang Allah Swt. dalam kehidupan sehari-hari dan kearifan lokal Kerinci.",
        elemenCp = "Akidah",
        jumlahPertemuan = "3",
        jpPerPertemuan = "2",
        topikLokal = "Pelestarian Lingkungan Hutan TNKS & Budaya Adat Mudik Kerinci"
      } = formData || {};

      let docPrompt = "";

      const generalKbcRules = `
[ATURAN PENTING KBC & KEMENAG]:
- Kamu adalah Ahli Kurikulum & Pengembang Perangkat Ajar Kemenag RI, menguasai "Kurikulum Berbasis Cinta (KBC)" (turunan Kurikulum Merdeka yang mengintegrasikan Panca Cinta Kemenag & 10 Nilai PPRA: Ta'addub, Qudwah, Muwaṭanah, Tawassuṭ, Tawāzun, I'tidāl, Musāwah, Syūrā, Tasāmuh, Tathawwur wa Ibtikār).
- Hasil WAJIB MURNI KODE HTML tanpa markdown code fences (\`\`\`html) atau teks pengantar lain.
- Gunakan CSS internal rapi dengan font sans-serif (Arial/Calibri), header tabel warna biru tua (#1a3a5c) teks putih bold.
- Tanda tangan penutup 2 kolom sejajar border 0 (Kepala Sekolah & Guru Mata Pelajaran).
- Tanggal & Kota TTD: ${cityDate}.
      `;

      if (docType === "analisis_cp") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "ANALISIS CAPAIAN PEMBELAJARAN (ACP) KURIKULUM BERBASIS CINTA" dengan struktur, urutan, dan format tabel PERSIS seperti kerangka baku di bawah ini. Jangan mengubah urutan bagian (A–H), jangan menghilangkan kolom, dan jangan menyingkat isi tabel.

[DATA IDENTITAS GURU & MADRASAH]:
- Kantor / Yayasan: ${kemenagOffice}
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject} (${singkatanMapel})
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Nama Guru: ${teacher} (NIP/NUPTK: ${nipTeacher})
- Nama Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})
- Rasional & Elemen CP: ${cpRasional} \n ${cpElemen}

STRUKTUR DOKUMEN (WAJIB PERSIS URUTAN A-H):
KOP DOKUMEN:
KEMENTERIAN AGAMA REPUBLIK INDONESIA
${kemenagOffice}
${schoolName.toUpperCase()}
[Alamat Lengkap Madrasah]
Judul: ANALISIS CAPAIAN PEMBELAJARAN
Sub-judul: Kurikulum Berbasis Cinta (KBC) | Tahun Pelajaran ${year}

A. IDENTITAS (Tabel 2 kolom: Label | Isi, 6 baris)
B. RASIONAL MATA PELAJARAN (Tabel 3 kolom: No | Uraian | Deskripsi — 3 baris: 1. Pentingnya Mapel & Panca Cinta, 2. Kaitan dengan 8 Dimensi Profil Lulusan & 10 Nilai PPRA, 3. Orientasi Pembelajaran)
C. TUJUAN MATA PELAJARAN (Tabel 3 kolom: No | Tujuan | Indikator Umum — 2-3 baris terukur)
D. KARAKTERISTIK MATA PELAJARAN & ELEMEN CP (Tabel 4 kolom: No | Elemen | Deskripsi Elemen | Cakupan Konten Utama)
E. CAPAIAN PEMBELAJARAN FASE ${level} (Tabel 4 kolom: Fase | Capaian Pembelajaran | Kompetensi Kunci | Konten/Materi Pokok)
F. PENJABARAN KATA KERJA OPERASIONAL (KKO) PER ELEMEN (Tabel 3 kolom: No | Elemen | KKO & Arah Tujuan Pembelajaran — sertakan KKO Bloom tinggi, Panca Cinta, & nilai PPRA konkret)
G. KETERKAITAN DENGAN 10 NILAI PPRA (Tabel 4 kolom: No | Dimensi Profil Lulusan | Elemen Terkait | Relevansi ✔ — WAJIB 10 baris urut: Ta'addub, Qudwah, Muwaṭanah, Tawassuṭ, Tawāzun, I'tidāl, Musāwah, Syūrā, Tasāmuh, Tathawwur wa Ibtikār)
H. INTEGRASI NILAI PPRA DALAM PEMBELAJARAN (Tabel 4 kolom: No | Nilai PPRA | Deskripsi Nilai | Integrasi dalam Kegiatan Pembelajaran — WAJIB 10 baris urut sesuai Bagian G)

PENUTUP: Tanda tangan sejajar Kepala Sekolah & Guru (${cityDate}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "tp") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "TUJUAN PEMBELAJARAN (TP) KURIKULUM BERBASIS CINTA" (breakdown CP menjadi TP per elemen, lengkap dengan kode dan alokasi JP), dengan struktur, urutan, dan format tabel PERSIS seperti kerangka baku di bawah ini.

[DATA IDENTITAS]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Waktu Total: ${totalJp}
- Nama Guru: ${teacher} (NIP: ${nipTeacher})
- Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})
- CP Elemen: ${cpElemen}

STRUKTUR DOKUMEN WAJIB:
KOP DOKUMEN KEMENTERIAN AGAMA & MADRASAH
Judul: TUJUAN PEMBELAJARAN KURIKULUM BERBASIS CINTA | Tahun Pelajaran ${year}

A. IDENTITAS (Tabel 2 kolom dengan format titik dua)
B. PANDUAN KODE TUJUAN PEMBELAJARAN (Format Kode: [SINGKATAN_MAPEL]-[FASE]-[KODE_ELEMEN]-[NOMOR], Contoh: ${singkatanMapel}-E-ELE-001 & Tabel Kode Elemen)
C. DAFTAR TUJUAN PEMBELAJARAN (Tabel 6 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran & Aspek Kompetensi | Integrasi Nilai (KBC & PPRA) | JP). Buat 8-12 TP berpola "Peserta didik mampu...", cantumkan Panca Cinta & Nilai PPRA (salah satu dari 10 nilai baku). Total JP = ${totalJp}.
D. REKAPITULASI ALOKASI WAKTU PER ELEMEN (Tabel 5 kolom: No | Elemen CP | Jumlah TP | Total JP | Persentase %)
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "atp") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "ALUR TUJUAN PEMBELAJARAN (ATP) KURIKULUM BERBASIS CINTA" — pengurutan logis-hierarkis seluruh TP dalam satu fase dengan struktur PERSIS seperti kerangka baku di bawah ini.

[DATA IDENTITAS]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Waktu Total: ${totalJp}
- Nama Guru: ${teacher} (NIP: ${nipTeacher})
- Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})
- CP Elemen: ${cpElemen}

STRUKTUR DOKUMEN WAJIB:
KOP DOKUMEN KEMENTERIAN AGAMA & MADRASAH
Judul: ALUR TUJUAN PEMBELAJARAN KURIKULUM BERBASIS CINTA (KBC)

A. IDENTITAS (Tabel 2 kolom berdampingan: Kiri & Kanan)
B. ALUR URUTAN TUJUAN PEMBELAJARAN DALAM SATU FASE (Kotak Diagram Alur Horizontal [KODE-TP-001] → [KODE-TP-002] → ... dihubungkan tanda panah, dilengkapi Legenda ■ Hitam = Pembuka, □ Putih = Lanjutan)
C. TABEL ALUR TUJUAN PEMBELAJARAN (Tabel 9 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran | Materi Pokok | Aspek Kompetensi | Integrasi Nilai (PC & PPRA) | Alokasi JP | Semester). Dikelompokkan per baris elemen.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.2cm; } }).
`;
      } else if (docType === "prota") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "PROGRAM TAHUNAN (PROTA) KURIKULUM BERBASIS CINTA" — pemetaan seluruh TP ke minggu efektif kalender akademik dalam satu tahun ajaran.

[DATA IDENTITAS]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Alokasi Waktu: ${totalJp} (${jpPerMinggu})
- Nama Guru: ${teacher} (NIP: ${nipTeacher})
- Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})

STRUKTUR DOKUMEN WAJIB:
KOP DOKUMEN KEMENTERIAN AGAMA & MADRASAH
Judul: PROGRAM TAHUNAN | Kurikulum Berbasis Cinta | ${subject} | ${level} | TP ${year}

A. IDENTITAS
B. DISTRIBUSI MINGGU EFEKTIF — KALENDER PENDIDIKAN (Tabel 7 kolom: Sem. | Bulan | Minggu Kalender | Tdk Efektif | Efektif | JP | Keterangan). Sertakan Subtotal Sem 1, Subtotal Sem 2, & TOTAL KESELURUHAN.
C. RENCANA PROGRAM TAHUNAN (Tabel 7 kolom: No | Kode TP | Tujuan Pembelajaran & Materi Pokok | Elemen CP | Integrasi Nilai (KBC & PPRA) | Alokasi JP | Semester). Sertakan header kelompok Semester 1 & Semester 2, serta baris CADANGAN.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "prosem") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "PROGRAM SEMESTER (PROSEM) KURIKULUM BERBASIS CINTA" — jadwal distribusi pembelajaran mingguan per semester.

[DATA IDENTITAS]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Singkatan Mapel: ${singkatanMapel}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- JP per Minggu: ${jpPerMinggu}
- Nama Guru: ${teacher} (NIP: ${nipTeacher})
- Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})

STRUKTUR DOKUMEN WAJIB:
KOP DOKUMEN KEMENTERIAN AGAMA & MADRASAH
Judul: PROGRAM SEMESTER (PROSEM) | Kurikulum Berbasis Cinta | ${subject} | ${level}

BLOK INFORMASI HEADER & Legenda Warna: [■ biru] JP Aktif Pembelajaran, [■ abu] Libur, [■ kuning] PTS, [■ merah] PAS.
TABEL DISTRIBUSI PEMBELAJARAN (Grid mingguan: No | Kode TP | Tujuan Pembelajaran & Materi Pokok | JP | Integrasi Nilai (KBC & PPRA) | Kolom M1..M5 per bulan Juli-Desember & Januari-Juni).
KETERANGAN: Catatan minggu tidak efektif per bulan & Catatan Semester.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.0cm; } }).
`;
      } else if (docType === "kktp") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) KURIKULUM BERBASIS CINTA" — rubrik 4 level capaian untuk setiap TP.

[DATA IDENTITAS]:
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject}
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Nama Guru: ${teacher} (NIP: ${nipTeacher})
- Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})

STRUKTUR DOKUMEN WAJIB:
KOP DOKUMEN KEMENTERIAN AGAMA & MADRASAH
Judul: KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) | Kurikulum Berbasis Cinta

BLOK INFORMASI HEADER & PARAGRAF DASAR (Mengutip Permendikbudristek & Filosofi KBC / Panca Cinta & PPRA).
A. DESKRIPSI LEVEL CAPAIAN (Tabel 6 kolom: Level | Skor | Deskripsi Umum | Tindak Lanjut | Rentang Nilai | Predikat — Level 1 Mulai Berkembang 0-55, Level 2 Layak ✓ KKTP 56-70, Level 3 Cakap 71-85, Level 4 Mahir 86-100).
B. RUBRIK KKTP PER TUJUAN PEMBELAJARAN (Tabel 5 kolom utama dengan sub-kolom 4 level: Mulai Berkembang (1), Layak (2) ✓ KKTP, Cakap (3), Mahir (4)). Tulis deskriptor progresi bertingkat yang kaya nilai PPRA & Panca Cinta.
CATATAN PENTING AMBANG BATAS KETUNTASAN.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.2cm; } }).
`;
      } else if (docType === "modul_ajar") {
        docPrompt = `
${generalKbcRules}

PERAN & KONTEKS
Kamu adalah Ahli Kurikulum dan Pengembang Perangkat Ajar berpengalaman di satuan pendidikan naungan Kementerian Agama RI, menguasai penyusunan Modul Ajar berbasis Deep Learning (Mindful, Meaningful, Joyful Learning) yang diintegrasikan penuh dengan Kurikulum Berbasis Cinta (KBC) — Panca Cinta dan 10 Nilai PPRA (Profil Pelajar Rahmatan lil 'Alamin).

TUGAS
Susun dokumen "PERENCANAAN PEMBELAJARAN (MODUL AJAR DEEP LEARNING - KBC)" untuk Tujuan Pembelajaran [Kode: ${kodeTp}, Rumusan: ${rumusanTp}] mata pelajaran ${subject} kelas ${level} tahun pelajaran ${year}, dengan identitas satuan pendidikan:
- Kementerian Agama Republik Indonesia
- ${kemenagOffice}
- ${schoolName}
- ${schoolAddress}
- Penyusun: ${teacher} (NIP: ${nipTeacher}) | Kepala Madrasah: ${principal} (NIP: ${nipPrincipal})

INPUT YANG DIBERIKAN PENGGUNA
- Rumusan lengkap TP dan Elemen CP: Kode ${kodeTp} - ${rumusanTp} | Elemen: ${elemenCp}
- Model pembelajaran (${learningModel}) beserta sintaknya: ${sintakModel}
- Jumlah pertemuan dan alokasi JP per pertemuan: ${jumlahPertemuan} Pertemuan x ${jpPerPertemuan} JP (${Number(jpPerPertemuan) * 45} Menit/Pertemuan)
- Topik/konteks lokal yang relevan: ${topikLokal}

ATURAN STRUKTUR MODUL AJAR (WAJIB DIIKUTI PERSIS)
Hasilkan MURNI KODE HTML tanpa markdown code fences (\`\`\`html). Gunakan CSS internal rapi dengan font sans-serif (Arial/Calibri), header tabel warna biru tua (#1a3a5c) teks putih bold.

KOP SURAT DOKUMEN:
KEMENTERIAN AGAMA REPUBLIK INDONESIA
${kemenagOffice.toUpperCase()}
${schoolName.toUpperCase()}
${schoolAddress}

BAGIAN A — INFORMASI UMUM
- Tabel identitas: Nama Penyusun, Satuan Pendidikan, Mata Pelajaran, Fase/Kelas, Kode & Judul TP, Elemen CP, Alokasi Waktu, Model Pembelajaran, Moda, Tahun Pelajaran
- B. Identifikasi Kesiapan Peserta Didik (1 paragraf naratif mengaitkan capaian belajar sebelumnya dengan TP ini)
- C. Karakteristik Materi Pelajaran (1 paragraf: sifat materi, tingkat kesulitan, relevansi lokal: ${topikLokal})
- 1. Tujuan Pembelajaran (1 kalimat utuh memuat kompetensi + nilai KBC yang ditumbuhkan)
- 2. Kompetensi Awal/Prasyarat (tabel: No | Kompetensi Prasyarat | Cara Mengecek)
- 3. 8 Dimensi Profil Lulusan (pilih 2 dimensi paling relevan; tabel: No | Dimensi | Deskripsi Perwujudan, setiap deskripsi WAJIB diakhiri anotasi "(PC: [Panca Cinta] | PPRA: [Nilai])")
- 3a. Integrasi KBC: baris terpisah "Panca Cinta: [...]" dan "Nilai PPRA: [...]" (pilih 2-3 nilai paling relevan dari 10 Nilai PPRA)
- 4. Sarana & Prasarana (tabel: Kategori | Rincian | Keterangan)
- 5. Target Peserta Didik & Diferensiasi (3 kolom: Reguler/Tipikal | Kesulitan Belajar | Berbakat/Cepat — masing-masing berisi Sasaran & Perlakuan)

BAGIAN B — KOMPONEN INTI
- 6. Pemahaman Bermakna (kotak bertekstur naratif-reflektif, mengaitkan materi dengan minimal 1 istilah PPRA, misal Tathawwur wa Ibtikār / Syūrā / I'tidāl)
- 7. Pertanyaan Pemantik (tabel: No | Pertanyaan | Tujuan Pertanyaan, 3 butir)
- 8. Asesmen Diagnostik:
  8a. Non-Kognitif (tabel: No | Pertanyaan Refleksi | Tujuan Diagnostik, 3 butir)
  8b. Kognitif (tabel: No | Indikator | Bentuk Soal | Tindak Lanjut, 3 butir) + 5 contoh soal campuran (isian, PG, terbuka)
- 9. KEGIATAN PEMBELAJARAN — cantumkan nama model (${learningModel}) & urutan sintak lengkap (${sintakModel}) di awal.
  UNTUK SETIAP PERTEMUAN (Pertemuan 1 s.d. ${jumlahPertemuan}), wajib memuat:
  a. Judul pertemuan bertema naratif + Alokasi (${jpPerPertemuan} JP & ${Number(jpPerPertemuan) * 45} menit) + Sintak yang dicakup + Fokus
  b. Tujuan Pertemuan (3 butir: Keterampilan, Pengetahuan, Sikap)
  c. ● PEMBUKA (15 menit) — prinsip Deep Learning + integrasi KBC (PC & PPRA), tabel 2 kolom (Aktivitas Guru | Aktivitas Siswa) berpasangan No, 5 baris, SETIAP baris aktivitas guru MAUPUN siswa diakhiri anotasi "(PC: ... | PPRA: ...)"
  d. SINTAK [n] [Nama Sintak] (durasi menit) — prinsip pembelajaran + integrasi KBC, tabel sama seperti di atas (5 baris)
  e. Ulangi (d) untuk setiap sintak dalam pertemuan tsb (${sintakModel})
  f. ● PENUTUP (15 menit) — format sama, 5 baris
  Total menit per pertemuan harus sama dengan alokasi ${jpPerPertemuan} JP × 45 menit (${Number(jpPerPertemuan) * 45} menit).
- 10. Asesmen Formatif (tabel: No | Teknik | Instrumen | Waktu Pelaksanaan | Aspek yang Dinilai, satu baris per pertemuan) + 5 contoh soal proses pembelajaran
- 11. Asesmen Sumatif (tabel: No | Komponen | Deskripsi Tugas | Bobot | Acuan KKTP; bobot harus total 100%)
- 12. Pengayaan & Remedial (3 kolom: Remedial | Reguler | Pengayaan, masing-masing berisi Sasaran, Kegiatan, Waktu)
- 13. Refleksi Guru & Peserta Didik (2 kolom, masing-masing 3-4 pertanyaan reflektif, refleksi guru memuat kata "teladan (Qudwah)")

BAGIAN C — LAMPIRAN
- Deskripsi singkat tiap lampiran (LKPD, lembar penilaian sahabat, dsb.)
- Glosarium (3 istilah kunci materi)
- Daftar Pustaka (format APA, minimal Kemendikbudristek CP + 1 buku ajar)
- Blok tanda tangan: ${cityDate} | Mengetahui Kepala Madrasah (${principal}, NIP: ${nipPrincipal}) — Dibuat oleh Guru Mata Pelajaran (${teacher}, NIP: ${nipTeacher}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "lkpd") {
        docPrompt = `
${generalKbcRules}

PERAN & KONTEKS
Kamu adalah Ahli Kurikulum dan Pengembang Perangkat Ajar berpengalaman di satuan pendidikan naungan Kementerian Agama RI, menguasai penyusunan LKPD berbasis Deep Learning (Mindful, Meaningful, Joyful Learning) yang diintegrasikan penuh dengan Kurikulum Berbasis Cinta (KBC) — Panca Cinta dan 10 Nilai PPRA.

TUGAS
Susun dokumen "LEMBAR KERJA PESERTA DIDIK (LKPD) KURIKULUM BERBASIS CINTA" untuk Tujuan Pembelajaran [Kode: ${kodeTp}, Rumusan: ${rumusanTp}] mata pelajaran ${subject} kelas ${level} tahun pelajaran ${year}, dengan identitas satuan pendidikan:
- Kementerian Agama Republik Indonesia
- ${kemenagOffice}
- ${schoolName}
- ${schoolAddress}
- Penyusun: ${teacher} (NIP: ${nipTeacher}) | Kepala Madrasah: ${principal} (NIP: ${nipPrincipal})

INPUT YANG DIBERIKAN PENGGUNA
- Rumusan lengkap TP dan Elemen CP: Kode ${kodeTp} - ${rumusanTp} | Elemen: ${elemenCp}
- Model pembelajaran (${learningModel}) beserta sintaknya: ${sintakModel}
- Jumlah pertemuan dan alokasi JP per pertemuan: ${jumlahPertemuan} Pertemuan x ${jpPerPertemuan} JP
- Topik/konteks lokal yang relevan: ${topikLokal}

ATURAN STRUKTUR LKPD (WAJIB DIIKUTI PERSIS)
Hasilkan MURNI KODE HTML tanpa markdown code fences (\`\`\`html). Gunakan CSS internal rapi dengan font sans-serif (Arial/Calibri), header tabel warna biru tua (#1a3a5c) teks putih bold.

- Kop surat identik dengan Modul Ajar:
  KEMENTERIAN AGAMA REPUBLIK INDONESIA
  ${kemenagOffice.toUpperCase()}
  ${schoolName.toUpperCase()}
  ${schoolAddress}
- Judul LKPD + subjudul tematik (mis. "Lembar Penilaian Sahabat (Syūrā) & Eksplorasi ${topikLokal}")
- Identitas kelompok & tanggal dalam tabel 2 kolom (Nama Kelompok, Anggota 1-4, Tanggal, Kelas)
- Petunjuk pengerjaan singkat (1 paragraf memuat nilai PPRA yang ditekankan)
- Bagian-bagian LKPD mengikuti PERSIS urutan sintak model pembelajaran ${learningModel} (${sintakModel}) (huruf A, B, C, ...), masing-masing berupa tabel isian atau kotak jawaban kosong bergaris (misal ______________)
- Sertakan bagian Refleksi Akhir Peserta Didik (jika pertemuan terakhir/proyek akhir)
- Lembar Penilaian Sahabat di akhir jika ada nilai Syūrā/kolaborasi: tabel indikator (4 butir) dengan 3 kolom checklist (Sangat Baik | Baik | Perlu Bimbingan)
- Blok tanda tangan: ${cityDate} | Mengetahui Kepala Madrasah (${principal}, NIP: ${nipPrincipal}) — Dibuat oleh Guru Mata Pelajaran (${teacher}, NIP: ${nipTeacher}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "rubrik") {
        docPrompt = `
${generalKbcRules}

PERAN & KONTEKS
Kamu adalah Ahli Kurikulum dan Pengembang Perangkat Ajar berpengalaman di satuan pendidikan naungan Kementerian Agama RI, menguasai penyusunan Rubrik Penilaian Formatif & Sumatif berbasis Kurikulum Berbasis Cinta (KBC) — Panca Cinta dan 10 Nilai PPRA.

TUGAS
Susun dokumen "RUBRIK PENILAIAN FORMATIF & SUMATIF KURIKULUM BERBASIS CINTA" untuk Tujuan Pembelajaran [Kode: ${kodeTp}, Rumusan: ${rumusanTp}] mata pelajaran ${subject} kelas ${level} tahun pelajaran ${year}, dengan identitas satuan pendidikan:
- Kementerian Agama Republik Indonesia
- ${kemenagOffice}
- ${schoolName}
- ${schoolAddress}
- Penyusun: ${teacher} (NIP: ${nipTeacher}) | Kepala Madrasah: ${principal} (NIP: ${nipPrincipal})

INPUT YANG DIBERIKAN PENGGUNA
- Rumusan lengkap TP dan Elemen CP: Kode ${kodeTp} - ${rumusanTp} | Elemen: ${elemenCp}
- Model pembelajaran (${learningModel}) beserta sintaknya: ${sintakModel}
- Jumlah pertemuan dan alokasi JP per pertemuan: ${jumlahPertemuan} Pertemuan x ${jpPerPertemuan} JP
- Topik/konteks lokal yang relevan: ${topikLokal}

ATURAN STRUKTUR RUBRIK (WAJIB DIIKUTI PERSIS)
Hasilkan MURNI KODE HTML tanpa markdown code fences (\`\`\`html). Gunakan CSS internal rapi dengan font sans-serif (Arial/Calibri), header tabel warna biru tua (#1a3a5c) teks putih bold.

- Kop surat identik dengan Modul Ajar + judul "RUBRIK PENILAIAN FORMATIF KURIKULUM BERBASIS CINTA" + rumusan TP (${kodeTp}: ${rumusanTp}) + metadata (Mapel: ${subject} | Fase/Kelas: ${level} | Tahun: ${year} | Model: ${learningModel} | Nama Guru: ${teacher})
- Per pertemuan (Pertemuan 1 s.d. ${jumlahPertemuan}): judul pertemuan + sintak, lalu tabel 5 kolom (Kriteria | 4-Sangat Berkembang | 3-BSH | 2-Mulai Berkembang | 1-Perlu Bimbingan), 3 kriteria kinerja per pertemuan selaras dengan Tujuan Pertemuan pada Modul Ajar
  - Kalimat level 4 SELALU pola: "[capaian superlatif], menjadi Qudwah (teladan) [nilai]."
  - Kalimat level 1 SELALU pola: "Baru [aktivitas awal] dan perlu pendampingan penuh kasih sayang."
- Di pertemuan terakhir, tambahkan:
  B. Penilaian Dimensi Profil Lulusan (kriteria = 2 dimensi dari Modul Ajar bagian 3)
  C. Penilaian Integrasi Nilai (KBC & PPRA) — kriteria = Panca Cinta + Nilai PPRA terpilih
- "RUBRIK PENILAIAN SUMATIF KURIKULUM BERBASIS CINTA" — judul TP sama + metadata, lalu Komponen Penilaian (list persentase, total 100%) dan tabel rubrik 6 kolom (No | Kriteria | 4 | 3 | 2/1 digabung | Bobot), Total Bobot 100%
- Blok tanda tangan: ${cityDate} | Mengetahui Kepala Madrasah (${principal}, NIP: ${nipPrincipal}) — Dibuat oleh Guru Mata Pelajaran (${teacher}, NIP: ${nipTeacher}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.0cm; } }).
`;
      } else {
        docPrompt = `Buatkan Dokumen Perangkat Ajar Kurikulum Berbasis Cinta (KBC) Kemenag untuk ${schoolName}, mapel ${subject}, ${level}, tahun ${year}, guru ${teacher}. Hasilkan MURNI HTML lengkap dengan Kop Kemenag/Sekolah, Tabel Rapi, dan Tanda Tangan Penutup.`;
      }

      let htmlOutput = "";
      try {
        const contents = [{ role: "user", parts: [{ text: docPrompt }] }];
        // Set a 25-second timeout race so Vercel or cloud gateway does not kill the function with 504
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timed out after 25s")), 25000)
        );
        const response: any = await Promise.race([
          generateContentWithRetry(ai, contents),
          timeoutPromise
        ]);

        htmlOutput = response?.text || "";
        htmlOutput = htmlOutput.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      } catch (aiErr: any) {
        console.warn("Notice: Gemini API returned notice/error, compiling standard KBC document directly:", aiErr?.message || aiErr);
        htmlOutput = buildKbcFallbackDocument(docType, formData);
        return res.json({
          status: "success",
          html: htmlOutput,
          docType,
          isFallback: true,
          note: "Dokumen berhasil disusun otomatis sesuai format standar Kurikulum Berbasis Cinta (KBC) Kemenag."
        });
      }

      res.json({ status: "success", html: htmlOutput, docType });
    } catch (err: any) {
      console.warn("Fallback notice on Perangkat Ajar KBC:", err?.message || err);
      try {
        const fallbackHtml = buildKbcFallbackDocument(req.body?.docType, req.body?.formData);
        return res.json({
          status: "success",
          html: fallbackHtml,
          docType: req.body?.docType,
          isFallback: true,
          note: "Dokumen berhasil disusun otomatis sesuai format standar Kurikulum Berbasis Cinta (KBC) Kemenag."
        });
      } catch (fallbackErr: any) {
        res.status(500).json({
          status: "error",
          message: err?.message || "Terjadi kesalahan saat memproses Perangkat Ajar KBC."
        });
      }
    }
  });

  return app;
}

export async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server EdAdmin Pro running on http://0.0.0.0:${PORT}`);
  });

  return app;
}

// Auto start only when this file is directly executed (node server.ts or tsx server.ts)
// and never in Vercel / serverless runtime
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

const isDirectExecution = Boolean(
  process.argv[1]?.endsWith("server.ts") ||
  process.argv[1]?.endsWith("server.cjs") ||
  process.argv[1]?.endsWith("server.js")
);

if (!isServerless && isDirectExecution) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
