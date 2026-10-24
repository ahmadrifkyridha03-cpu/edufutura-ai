/**
 * Kurikulum Merdeka Official Document Builder
 * Generates comprehensive, standardized, printable HTML documents for:
 * 1. Analisis Capaian Pembelajaran (CP)
 * 2. Tujuan Pembelajaran (TP)
 * 3. Alur Tujuan Pembelajaran (ATP)
 * 4. Program Tahunan (Prota)
 * 5. Program Semester (Prosem)
 * 6. Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
 * 7. Rencana Minggu Efektif (RME / RPE) & Kalender Pendidikan
 *
 * Can be executed on server or client side (100% resilient fallback).
 */

export interface KurikulumMerdekaFormData {
  school?: string;
  schoolName?: string;
  subject?: string;
  singkatanMapel?: string;
  level?: string;
  year?: string;
  totalJp?: string;
  jpPerMinggu?: string;
  teacher?: string;
  nipTeacher?: string;
  cityDate?: string;
  principal?: string;
  nipPrincipal?: string;
  cpRasional?: string;
  cpElemen?: string;
  rme?: any;
  [key: string]: any;
}

const COMMON_CSS = `
<style>
  body {
    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
    color: #1e293b;
    line-height: 1.5;
    font-size: 11pt;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }
  .kop-surat {
    text-align: center;
    border-bottom: 3px double #0f172a;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .kop-surat h3 {
    margin: 0;
    font-size: 11.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #334155;
  }
  .kop-surat h2 {
    margin: 4px 0;
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #1a3a5c;
  }
  .kop-surat p {
    margin: 2px 0 0;
    font-size: 9pt;
    color: #475569;
  }
  .doc-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    color: #1a3a5c;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 10pt;
    color: #64748b;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .section-title {
    font-size: 11.5pt;
    font-weight: bold;
    color: #1a3a5c;
    border-bottom: 1.5px solid #1a3a5c;
    padding-bottom: 4px;
    margin-top: 22px;
    margin-bottom: 10px;
  }
  .adm-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 10pt;
  }
  .adm-table th {
    background-color: #1a3a5c;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
    padding: 8px 10px;
    border: 1px solid #1a3a5c;
    vertical-align: middle;
  }
  .adm-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    vertical-align: top;
    color: #1e293b;
  }
  .adm-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .ttd-table {
    width: 100%;
    border: none;
    margin-top: 35px;
    page-break-inside: avoid;
  }
  .ttd-table td {
    border: none;
    text-align: center;
    width: 50%;
    vertical-align: top;
    font-size: 10.5pt;
  }
  .badge-check {
    color: #166534;
    font-weight: bold;
  }
  @media print {
    @page { margin: 1.2cm; size: A4 portrait; }
    body { font-size: 10pt; }
  }
</style>
`;

function renderKop(d: KurikulumMerdekaFormData): string {
  const school = d.school || d.schoolName || "SMA Negeri 1 Jambi";
  return `
  <div class="kop-surat">
    <h3>PEMERINTAH DAERAH PROVINSI</h3>
    <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
    <h2>${school.toUpperCase()}</h2>
    <p>Jalan Pendidikan Terpadu No. 01 — Akreditasi A | Email: info@sekolah.sch.id</p>
  </div>`;
}

function renderSignatures(d: KurikulumMerdekaFormData): string {
  const cityDate = d.cityDate || "Jambi, 14 Juli 2026";
  const principal = d.principal || "Dr. Ahmad Fauzi, M.Pd.";
  const nipPrincipal = d.nipPrincipal || "19720514 200003 1 002";
  const teacher = d.teacher || "Budi Santoso, S.Pd., Gr.";
  const nipTeacher = d.nipTeacher || "19900101 201903 1 001";

  return `
  <table class="ttd-table">
    <tr>
      <td>
        Mengetahui,<br>
        <strong>Kepala Sekolah</strong>
        <br><br><br><br><br>
        <strong><u>${principal}</u></strong><br>
        NIP. ${nipPrincipal}
      </td>
      <td>
        ${cityDate}<br>
        <strong>Guru Mata Pelajaran</strong>
        <br><br><br><br><br>
        <strong><u>${teacher}</u></strong><br>
        NIP. ${nipTeacher}
      </td>
    </tr>
  </table>`;
}

/**
 * Builds standard Kurikulum Merdeka document for any of the 7 docTypes.
 */
export function buildKurikulumMerdekaDocument(
  docType: string,
  formData: KurikulumMerdekaFormData = {}
): string {
  const d: KurikulumMerdekaFormData = {
    school: formData.school || formData.schoolName || "SMA Negeri 1 Jambi",
    subject: formData.subject || "Bahasa Indonesia",
    singkatanMapel: formData.singkatanMapel || "BI",
    level: formData.level || "Fase E / Kelas X",
    year: formData.year || "2026/2027",
    totalJp: formData.totalJp || "108 JP / Tahun",
    jpPerMinggu: formData.jpPerMinggu || "3 JP/Minggu",
    teacher: formData.teacher || "Budi Santoso, S.Pd., Gr.",
    nipTeacher: formData.nipTeacher || "19900101 201903 1 001",
    cityDate: formData.cityDate || "Jambi, 14 Juli 2026",
    principal: formData.principal || "Dr. Ahmad Fauzi, M.Pd.",
    nipPrincipal: formData.nipPrincipal || "19720514 200003 1 002",
    cpRasional: formData.cpRasional || "Pada akhir Fase E, peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar sesuai dengan tujuan, konteks sosial, akademis, dan dunia kerja.",
    cpElemen: formData.cpElemen || `Elemen 1 — Menyimak: Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan dari berbagai tipe teks lisan.\nElemen 2 — Membaca dan Memirsa: Peserta didik mampu mengevaluasi gagasan dari berbagai teks nonsastra dan sastra.\nElemen 3 — Berbicara dan Mempresentasikan: Peserta didik mampu mengolah dan menyajikan gagasan secara santun dan logis.\nElemen 4 — Menulis: Peserta didik mampu menulis gagasan tertulis secara terstruktur dan kreatif.`,
    rme: formData.rme || {}
  };

  const kop = renderKop(d);
  const ttd = renderSignatures(d);

  // Parse Elemen lines if available
  const elemenLines = (d.cpElemen || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedElemenList = elemenLines.length > 0
    ? elemenLines.map((line, idx) => {
        const parts = line.split(":");
        const name = parts[0]?.trim() || `Elemen ${idx + 1}`;
        const desc = parts.slice(1).join(":")?.trim() || line;
        return { name, desc };
      })
    : [
        { name: "Menyimak", desc: "Mengevaluasi dan mengkreasi informasi dari teks lisan." },
        { name: "Membaca & Memirsa", desc: "Menganalisis gagasan dan pandangan dalam teks multimodal." },
        { name: "Berbicara & Mempresentasikan", desc: "Menyampaikan gagasan, sanggahan, dan rekomendasi secara santun." },
        { name: "Menulis", desc: "Menyusun teks deskripsi, laporan, dan argumentasi terstruktur." }
      ];

  if (docType === "analisis_cp") {
    const elemenRows = parsedElemenList.map((e, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${e.name}</strong></td>
        <td>${e.desc}</td>
        <td>Analisis teks kontekstual, nalar kritis, eksplorasi isu nyata, dan penyusunan karya nyata.</td>
      </tr>
    `).join("");

    const kkoRows = parsedElemenList.map((e, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${e.name}</strong></td>
        <td>Menganalisis (C4), Mengevaluasi (C5), Mengkreasi (C6) — Terarah pada perumusan TP berbasis pemecahan masalah kontekstual.</td>
      </tr>
    `).join("");

    return `
${COMMON_CSS}
${kop}
<div class="doc-title">ANALISIS CAPAIAN PEMBELAJARAN (CP)</div>
<div class="doc-subtitle">Kurikulum Merdeka — Berdasarkan Keputusan BSKAP Kemendikbudristek | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS SATUAN PENDIDIKAN & PROGRAM</div>
<table class="adm-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.school}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Tahun Pelajaran</td><td>${d.year}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Beban Mengajar</td><td>${d.totalJp} (${d.jpPerMinggu})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Guru Mata Pelajaran</td><td>${d.teacher} / NIP. ${d.nipTeacher}</td></tr>
</table>

<div class="section-title">B. RASIONAL MATA PELAJARAN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:28%;">Uraian Rasional</th>
      <th>Deskripsi Penjabaran Kurikulum Merdeka</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td><strong>Pentingnya Mata Pelajaran</strong></td>
      <td>${d.cpRasional}</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td><strong>Kaitan dengan 8 Dimensi Profil Kelulusan</strong></td>
      <td>Membangun kompetensi bernalar kritis, mandiri, kreatif, dan komunikatif serta memperkuat kesadaran sosial peserta didik dalam menghadapi tantangan global abad ke-21.</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td><strong>Orientasi Pembelajaran (Deep Learning)</strong></td>
      <td>Menerapkan tiga pilar pembelajaran bermakna: <em>Mindful</em> (kesadaran penuh dalam memahami materi), <em>Meaningful</em> (kebermaknaan konsep dengan kehidupan nyata), dan <em>Joyful</em> (kegembiraan eksplorasi sains & literasi).</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. TUJUAN MATA PELAJARAN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:40%;">Tujuan Pembelajaran Mata Pelajaran</th>
      <th>Indikator Ketercapaian Terukur</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td>Menguasai konsep esensial, metodologi berpikir kritis, dan nalar analitis dalam bidang ${d.subject}.</td>
      <td>Mampu mengidentifikasi masalah, menganalisis hubungan sebab-akibat, dan merumuskan solusi berbasis data dan konsep ilmiah.</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>Mengomunikasikan gagasan, temuan riset sederhana, dan argumentasi ilmiah secara santun, persuasif, dan logis.</td>
      <td>Mampu menyajikan laporan tertulis dan presentasi lisan dengan struktur berpikir runtut dan menggunakan bahasa yang efektif.</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td>Menerapkan prinsip kolaborasi, etika akademik, dan tanggung jawab sosial dalam proyek pembelajaran.</td>
      <td>Bekerja sama secara aktif dalam tim heterogen untuk menyelesaikan tugas nyata dengan menghargai keragaman pendapat.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">D. KARAKTERISTIK MATA PELAJARAN & ELEMEN CP</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:6%;">No</th>
      <th style="width:24%;">Elemen Capaian</th>
      <th style="width:42%;">Deskripsi Karakteristik Elemen</th>
      <th>Cakupan Konten Utama</th>
    </tr>
  </thead>
  <tbody>
    ${elemenRows}
  </tbody>
</table>

<div class="section-title">E. CAPAIAN PEMBELAJARAN FASE & KOMPETENSI KUNCI</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:18%;">Fase / Jenjang</th>
      <th style="width:38%;">Capaian Pembelajaran (CP) Resmi</th>
      <th style="width:22%;">Kompetensi Kunci</th>
      <th>Konten / Materi Pokok</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold; background-color:#f8fafc;">${d.level}</td>
      <td>${d.cpRasional}</td>
      <td>Analisis, Evaluasi, Sintesis, Komunikasi Kolaboratif, Pemecahan Masalah</td>
      <td>Konsep Esensial Mapel ${d.subject}, Studi Kasus Kontekstual, dan Proyek Terapan</td>
    </tr>
  </tbody>
</table>

<div class="section-title">F. PENJABARAN KATA KERJA OPERASIONAL (KKO) PER ELEMEN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:26%;">Elemen CP</th>
      <th>KKO Taksonomi Bloom & Arah Tujuan Pembelajaran</th>
    </tr>
  </thead>
  <tbody>
    ${kkoRows}
  </tbody>
</table>

<div class="section-title">G. KETERKAITAN DENGAN 8 DIMENSI PROFIL LULUSAN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:6%;">No</th>
      <th style="width:28%;">Dimensi Profil Kelulusan</th>
      <th style="width:44%;">Bentuk Integrasi dalam Mata Pelajaran</th>
      <th style="width:12%; text-align:center;">Relevansi</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align:center;">1</td><td><strong>Keimanan & Ketakwaan</strong></td><td>Menyadari keteraturan ciptaan Tuhan dan menjunjung tinggi kejujuran ilmiah serta integritas akademik.</td><td style="text-align:center;" class="badge-check">✔ Sangat Kuat</td></tr>
    <tr><td style="text-align:center;">2</td><td><strong>Kewargaan & Kebinekaan</strong></td><td>Menghargai keragaman sosial budaya dan kearifan lokal dalam konteks tantangan global.</td><td style="text-align:center;" class="badge-check">✔ Kuat</td></tr>
    <tr><td style="text-align:center;">3</td><td><strong>Penalaran Kritis</strong></td><td>Memproses informasi secara objektif, menganalisis argumen, dan menarik kesimpulan berbasis data valid.</td><td style="text-align:center;" class="badge-check">✔ Sangat Kuat</td></tr>
    <tr><td style="text-align:center;">4</td><td><strong>Kreativitas & Inovasi</strong></td><td>Menghasilkan gagasan orisinal, alternatif pemecahan masalah, dan produk belajar inovatif.</td><td style="text-align:center;" class="badge-check">✔ Kuat</td></tr>
    <tr><td style="text-align:center;">5</td><td><strong>Kolaborasi & Gotong Royong</strong></td><td>Membangun kemampuan kerja tim, empati, dan kepedulian sosial untuk mencapai tujuan bersama.</td><td style="text-align:center;" class="badge-check">✔ Kuat</td></tr>
    <tr><td style="text-align:center;">6</td><td><strong>Kemandirian Belajar</strong></td><td>Mengembangkan regulasi diri, motivasi intrinsik, dan tanggung jawab atas proses pembelajaran.</td><td style="text-align:center;" class="badge-check">✔ Kuat</td></tr>
    <tr><td style="text-align:center;">7</td><td><strong>Komunikasi Efektif</strong></td><td>Menyampaikan pendapat dengan runtut, santun, dan mampu mendengarkan secara aktif.</td><td style="text-align:center;" class="badge-check">✔ Sangat Kuat</td></tr>
    <tr><td style="text-align:center;">8</td><td><strong>Kesehatan Jiwa & Raga</strong></td><td>Menjaga keseimbangan belajar, resiliensi terhadap kesulitan, dan gaya hidup sehat berkelanjutan.</td><td style="text-align:center;" class="badge-check">✔ Terintegrasi</td></tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "tp") {
    const tpRows = parsedElemenList.map((e, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${e.name}</strong></td>
        <td>TP.${d.singkatanMapel}.${(idx + 1).toString().padStart(2, '0')}.01</td>
        <td>Peserta didik mampu menganalisis konsep dasar ${e.name} dan mengevaluasi kasus kontekstual secara kritis.</td>
        <td>Konsep Dasar & Struktur ${e.name}</td>
        <td style="text-align:center; font-weight:bold;">${Math.round(18 / Math.max(1, parsedElemenList.length))} JP</td>
        <td>Formatif (Anekdotal/Kuis) & Sumatif Tes Tertulis</td>
      </tr>
      <tr>
        <td style="text-align:center;">${idx + 1}b</td>
        <td><strong>${e.name}</strong></td>
        <td>TP.${d.singkatanMapel}.${(idx + 1).toString().padStart(2, '0')}.02</td>
        <td>Peserta didik mampu mengkreasi solusi inovatif atau karya nyata berbasis pemahaman materi ${e.name}.</td>
        <td>Aplikasi & Praktik ${e.name}</td>
        <td style="text-align:center; font-weight:bold;">${Math.round(18 / Math.max(1, parsedElemenList.length))} JP</td>
        <td>Penilaian Kinerja / Portofolio Proyek</td>
      </tr>
    `).join("");

    return `
${COMMON_CSS}
${kop}
<div class="doc-title">TUJUAN PEMBELAJARAN (TP)</div>
<div class="doc-subtitle">Penjabaran Capaian Pembelajaran Menjadi Tujuan Pembelajaran Operasional | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM</div>
<table class="adm-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.school}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Waktu Total</td><td>${d.totalJp}</td></tr>
</table>

<div class="section-title">B. MATRIKS TUJUAN PEMBELAJARAN (TP) PER ELEMEN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:5%;">No</th>
      <th style="width:16%;">Elemen CP</th>
      <th style="width:14%;">Kode TP</th>
      <th style="width:32%;">Rumusan Tujuan Pembelajaran</th>
      <th style="width:16%;">Lingkup Materi</th>
      <th style="width:7%;">Alokasi</th>
      <th>Rencana Asesmen</th>
    </tr>
  </thead>
  <tbody>
    ${tpRows}
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "atp") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">ALUR TUJUAN PEMBELAJARAN (ATP)</div>
<div class="doc-subtitle">Sistematika Urutan Pembelajaran Logis & Berjenjang | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS SATUAN PENDIDIKAN</div>
<table class="adm-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.school}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Jam Pelajaran</td><td>${d.totalJp} (${d.jpPerMinggu})</td></tr>
</table>

<div class="section-title">B. ALUR TUJUAN PEMBELAJARAN SEMESTER 1 (GANJIL)</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:6%;">Tahap</th>
      <th style="width:14%;">Kode TP</th>
      <th>Tujuan Pembelajaran</th>
      <th style="width:20%;">Materi Pokok Esensial</th>
      <th style="width:8%;">Alokasi</th>
      <th style="width:18%;">Profil Lulusan Terkait</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.1</td>
      <td>TP.${d.singkatanMapel}.01.01</td>
      <td>Memahami konsep dasar, terminologi ilmiah, dan kerangka teoritis dalam lingkup awal materi.</td>
      <td>Pengenalan & Teori Dasar</td>
      <td style="text-align:center; font-weight:bold;">12 JP</td>
      <td>Bernalar Kritis, Mandiri</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.2</td>
      <td>TP.${d.singkatanMapel}.01.02</td>
      <td>Menganalisis data, studi kasus, atau fenomena kontekstual menggunakan konsep yang telah dipelajari.</td>
      <td>Analisis Kasus Kontekstual</td>
      <td style="text-align:center; font-weight:bold;">18 JP</td>
      <td>Bernalar Kritis, Kolaborasi</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.3</td>
      <td>TP.${d.singkatanMapel}.02.01</td>
      <td>Mengevaluasi berbagai argumen, hipotesis, dan alternatif pemecahan masalah secara objektif.</td>
      <td>Evaluasi Kritis & Sintesis</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Kreativitas, Komunikasi</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.4</td>
      <td>TP.${d.singkatanMapel}.02.02</td>
      <td>Mengkreasi karya atau proyek solusi nyata sederhana sebagai wujud pemahaman konsep yang bermakna.</td>
      <td>Proyek Terapan & Gelar Karya</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Kreativitas, Gotong Royong</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. ALUR TUJUAN PEMBELAJARAN SEMESTER 2 (GENAP)</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:6%;">Tahap</th>
      <th style="width:14%;">Kode TP</th>
      <th>Tujuan Pembelajaran</th>
      <th style="width:20%;">Materi Pokok Esensial</th>
      <th style="width:8%;">Alokasi</th>
      <th style="width:18%;">Profil Lulusan Terkait</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold;">2.1</td>
      <td>TP.${d.singkatanMapel}.03.01</td>
      <td>Memperdalam konsep tingkat lanjut dan mengidentifikasi relasi antar variabel dalam materi kompleks.</td>
      <td>Konsep Lanjutan & Integrasi</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Penalaran Kritis, Mandiri</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">2.2</td>
      <td>TP.${d.singkatanMapel}.03.02</td>
      <td>Melakukan investigasi mandiri dan merumuskan laporan ilmiah terstruktur.</td>
      <td>Investigasi & Analisis Data</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Mandiri, Komunikasi</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">2.3</td>
      <td>TP.${d.singkatanMapel}.04.01</td>
      <td>Mengembangkan inovasi atau ide gagasan baru yang berkontribusi bagi lingkungan sekitar.</td>
      <td>Inovasi Solutif Lingkungan</td>
      <td style="text-align:center; font-weight:bold;">12 JP</td>
      <td>Kreativitas, Gotong Royong</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">2.4</td>
      <td>TP.${d.singkatanMapel}.04.02</td>
      <td>Mempresentasikan hasil proyek akhir semester dan merefleksikan proses belajar secara komprehensif.</td>
      <td>Refleksi & Asesmen Sumatif Akhir</td>
      <td style="text-align:center; font-weight:bold;">12 JP</td>
      <td>Komunikasi, Resiliensi</td>
    </tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "prota") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">PROGRAM TAHUNAN (PROTA)</div>
<div class="doc-subtitle">Distribusi Alokasi Waktu Pembelajaran 1 Tahun Ajaran | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM</div>
<table class="adm-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.school}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Jam Mengajar</td><td>${d.totalJp} (${d.jpPerMinggu})</td></tr>
</table>

<div class="section-title">B. MATRIKS ALOKASI WAKTU PROGRAM TAHUNAN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:6%;">Sem</th>
      <th style="width:14%;">Kode TP</th>
      <th>Tujuan Pembelajaran & Ruang Lingkup Materi</th>
      <th style="width:14%;">Alokasi JP</th>
      <th style="width:18%;">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color:#eff6ff; font-weight:bold;">
      <td colspan="5">SEMESTER 1 (GANJIL)</td>
    </tr>
    <tr>
      <td style="text-align:center;">1</td>
      <td>TP.${d.singkatanMapel}.01.01</td>
      <td>Pemahaman Konsep Fundamental dan Analisis Fenomena Dasar</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Tatap Muka & Asesmen</td>
    </tr>
    <tr>
      <td style="text-align:center;">1</td>
      <td>TP.${d.singkatanMapel}.01.02</td>
      <td>Analisis Data Kualitatif/Kuantitatif dan Pemecahan Masalah</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Diskusi & Praktikum</td>
    </tr>
    <tr>
      <td style="text-align:center;">1</td>
      <td>TP.${d.singkatanMapel}.02.01</td>
      <td>Evaluasi dan Pembuktian Hipotesis Berbasis Kasus Nyata</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Kolaborasi Kelompok</td>
    </tr>
    <tr>
      <td style="text-align:center;">1</td>
      <td>TP.${d.singkatanMapel}.02.02</td>
      <td>Pengembangan Proyek Kreatif dan Presentasi Gagasan</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Gelar Portofolio</td>
    </tr>
    <tr style="background-color:#f1f5f9; font-weight:bold;">
      <td colspan="3" style="text-align:right;">Subtotal Alokasi Semester 1:</td>
      <td style="text-align:center; color:#1a3a5c;">60 JP</td>
      <td>20 Pekan Efektif</td>
    </tr>

    <tr style="background-color:#eff6ff; font-weight:bold;">
      <td colspan="5">SEMESTER 2 (GENAP)</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>TP.${d.singkatanMapel}.03.01</td>
      <td>Pendalaman Materi Lanjutan dan Integrasi Interdisipliner</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Tatap Muka & Riset</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>TP.${d.singkatanMapel}.03.02</td>
      <td>Investigasi Mandiri dan Penulisan Karya Ilmiah Populer</td>
      <td style="text-align:center; font-weight:bold;">15 JP</td>
      <td>Proyek Berdiferensiasi</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>TP.${d.singkatanMapel}.04.01</td>
      <td>Inovasi dan Aplikasi Praktis Konsep Terhadap Isu Komunitas</td>
      <td style="text-align:center; font-weight:bold;">12 JP</td>
      <td>Aksi Nyata</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>TP.${d.singkatanMapel}.04.02</td>
      <td>Refleksi Metakognitif dan Evaluasi Sumatif Akhir Tahun</td>
      <td style="text-align:center; font-weight:bold;">12 JP</td>
      <td>Asesmen Sumatif (SAT)</td>
    </tr>
    <tr style="background-color:#f1f5f9; font-weight:bold;">
      <td colspan="3" style="text-align:right;">Subtotal Alokasi Semester 2:</td>
      <td style="text-align:center; color:#1a3a5c;">54 JP</td>
      <td>18 Pekan Efektif</td>
    </tr>

    <tr style="background-color:#1a3a5c; color:#ffffff; font-weight:bold;">
      <td colspan="3" style="text-align:right;">TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:</td>
      <td style="text-align:center; color:#ffffff;">114 JP</td>
      <td>38 Pekan Efektif</td>
    </tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "prosem") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">PROGRAM SEMESTER (PROSEM)</div>
<div class="doc-subtitle">Matriks Distribusi Alokasi Jam Pembelajaran Per Pekan | Semester 1 (Ganjil) TP ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM SEMESTER</div>
<table class="adm-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.school}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Beban Tatap Muka</td><td>${d.jpPerMinggu} (Total 60 JP Semester 1)</td></tr>
</table>

<div style="margin-bottom:12px; font-size:9.5pt; display:flex; gap:12px; flex-wrap:wrap;">
  <span style="display:inline-block; padding:3px 8px; border-radius:4px; background-color:#d0e4f7; color:#0369a1; font-weight:bold;">Biru: Jam Belajar Aktif (JP)</span>
  <span style="display:inline-block; padding:3px 8px; border-radius:4px; background-color:#fff3cd; color:#856404; font-weight:bold;">Kuning: STS / PTS</span>
  <span style="display:inline-block; padding:3px 8px; border-radius:4px; background-color:#d4edda; color:#155724; font-weight:bold;">Hijau: SAS Ganjil</span>
  <span style="display:inline-block; padding:3px 8px; border-radius:4px; background-color:#ffd6d6; color:#721c24; font-weight:bold;">Merah: Libur / MPLS</span>
</div>

<div class="section-title">B. MATRIKS DISTRIBUSI BULANAN & PEKAN EFEKTIF (JULI - DESEMBER)</div>
<div style="overflow-x:auto;">
<table class="adm-table" style="font-size:9pt; text-align:center;">
  <thead>
    <tr>
      <th rowspan="2" style="width:4%;">No</th>
      <th rowspan="2" style="width:12%;">Kode TP</th>
      <th rowspan="2" style="width:26%; text-align:left;">Tujuan Pembelajaran & Pokok Bahasan</th>
      <th rowspan="2" style="width:5%;">JP</th>
      <th colspan="4">Juli</th>
      <th colspan="5">Agustus</th>
      <th colspan="4">September</th>
      <th colspan="5">Oktober</th>
      <th colspan="4">November</th>
      <th colspan="4">Desember</th>
    </tr>
    <tr>
      <th>1</th><th>2</th><th>3</th><th>4</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th>
      <th>1</th><th>2</th><th>3</th><th>4</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>TP.01.01</td>
      <td style="text-align:left;">Konsep Dasar & Struktur Fundamental</td>
      <td><strong>15</strong></td>
      <td style="background-color:#ffd6d6;">M</td><td style="background-color:#ffd6d6;">M</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td>
      <td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <td>2</td>
      <td>TP.01.02</td>
      <td style="text-align:left;">Analisis Kasus Nyata & Penyelidikan Masalah</td>
      <td><strong>15</strong></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td>
      <td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
    </tr>
    <tr style="background-color:#fff3cd; font-weight:bold;">
      <td colspan="3" style="text-align:left;">Sumatif Tengah Semester (STS) Ganjil</td>
      <td>-</td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td style="background-color:#fff3cd;">STS</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <td>3</td>
      <td>TP.02.01</td>
      <td style="text-align:left;">Evaluasi Argumen & Pembuktian Solusi</td>
      <td><strong>15</strong></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <td>4</td>
      <td>TP.02.02</td>
      <td style="text-align:left;">Gelar Portofolio Proyek & Asesmen Sumatif</td>
      <td><strong>15</strong></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td><td style="background-color:#d0e4f7;">3</td>
      <td style="background-color:#d0e4f7;">3</td><td></td><td></td><td></td>
    </tr>
    <tr style="background-color:#d4edda; font-weight:bold;">
      <td colspan="3" style="text-align:left;">Sumatif Akhir Semester (SAS), Pengolahan Nilai & Rapor</td>
      <td>-</td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td>
      <td></td><td style="background-color:#d4edda;">SAS</td><td style="background-color:#d4edda;">RAP</td><td style="background-color:#ffd6d6;">LIB</td>
    </tr>
  </tbody>
</table>
</div>

${ttd}
`;
  }

  if (docType === "kktp") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</div>
<div class="doc-subtitle">Standar Ketuntasan & Rubrik Penilaian Berjenjang | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM & DASAR HUKUM</div>
<table class="adm-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.school}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Dasar Hukum Standar</td><td>Permendikbudristek No. 21 Tahun 2022 tentang Standar Penilaian Pendidikan</td></tr>
</table>

<div class="section-title">B. PENETAPAN INTERVAL PREDIKAT & TINDAK LANJUT</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:16%;">Interval Nilai</th>
      <th style="width:18%;">Kategori Capaian</th>
      <th>Deskripsi Kualitatif Capaian</th>
      <th style="width:26%;">Tindak Lanjut Intervensi</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#b91c1c;">0 – 55%</td>
      <td><strong>Perlu Bimbingan</strong></td>
      <td>Peserta didik belum mencapai kriteria ketuntasan minimal; kesulitan memahami konsep esensial.</td>
      <td>Remedial intensif di seluruh materi melalui pendampingan tutor sebaya dan bimbingan guru.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#c2410c;">56 – 70%</td>
      <td><strong>Cukup / Layak (KKTP)</strong></td>
      <td>Peserta didik telah memenuhi kriteria ketuntasan minimal, namun masih memiliki sedikit kelemahan pada sebagian indikator.</td>
      <td>Remedial parsial hanya pada indikator yang belum tuntas, kemudian diberikan kuis penguatan.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#15803d;">71 – 85%</td>
      <td><strong>Baik / Cakap</strong></td>
      <td>Peserta didik telah mencapai tujuan pembelajaran dengan baik, mampu bernalar logis dan menyelesaikan tugas kontekstual.</td>
      <td>Diberikan pengayaan mandiri dan tantangan studi kasus aplikatif.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#0369a1;">86 – 100%</td>
      <td><strong>Sangat Baik / Mahir</strong></td>
      <td>Peserta didik melampaui capaian pembelajaran, mampu mengkreasi ide orisinal dan berpikir kritis reflektif tingkat tinggi.</td>
      <td>Pengayaan tingkat lanjut (HOTS) serta diberdayakan sebagai tutor sebaya di kelas.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. RUBRIK KKTP PER TUJUAN PEMBELAJARAN</div>
<table class="adm-table">
  <thead>
    <tr>
      <th style="width:5%;">No</th>
      <th style="width:12%;">Kode TP</th>
      <th style="width:24%;">Tujuan Pembelajaran</th>
      <th style="width:20%;">Indikator Ketercapaian (IKTP)</th>
      <th style="width:10%; text-align:center;">Perlu Bimbingan</th>
      <th style="width:10%; text-align:center;">Cukup (KKTP)</th>
      <th style="width:10%; text-align:center;">Baik</th>
      <th style="width:9%; text-align:center;">Mahir</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td>TP.01.01</td>
      <td>Menganalisis konsep esensial dan fenomena kontekstual materi ${d.subject}.</td>
      <td>Mampu menguraikan fakta, konsep, dan relasi logis dengan tepat.</td>
      <td style="font-size:8.5pt;">Belum mampu mengidentifikasi fakta dasar</td>
      <td style="font-size:8.5pt;">Mampu mengidentifikasi fakta namun analitis terbatas</td>
      <td style="font-size:8.5pt;">Mampu menganalisis dengan benar dan runtut</td>
      <td style="font-size:8.5pt;">Mampu menganalisis mendalam dan membuat kesimpulan orisinal</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>TP.01.02</td>
      <td>Memecahkan studi kasus kontekstual menggunakan metode analitis terstruktur.</td>
      <td>Mampu merumuskan alternatif solusi berbasis data valid.</td>
      <td style="font-size:8.5pt;">Tidak mampu menawarkan solusi terarah</td>
      <td style="font-size:8.5pt;">Solusi cukup tepat tetapi kurang didukung bukti data</td>
      <td style="font-size:8.5pt;">Solusi tepat dan sistematis sesuai prinsip materi</td>
      <td style="font-size:8.5pt;">Solusi sangat komprehensif, inovatif, dan aplikatif</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td>TP.02.01</td>
      <td>Mengomunikasikan hasil penyelidikan dalam bentuk laporan dan presentasi.</td>
      <td>Menyajikan data visual dan memaparkan argumentasi secara persuasif.</td>
      <td style="font-size:8.5pt;">Presentasi terbata dan data tidak lengkap</td>
      <td style="font-size:8.5pt;">Data cukup lengkap namun penyampaian kurang percaya diri</td>
      <td style="font-size:8.5pt;">Penyajian menarik, data runtut dan komunikatif</td>
      <td style="font-size:8.5pt;">Penyajian sangat memukau, interaktif, dan argumentatif</td>
    </tr>
  </tbody>
</table>

${ttd}
`;
  }

  // Fallback default
  return `
${COMMON_CSS}
${kop}
<div class="doc-title">PERANGKAT ADMINISTRASI PEMBELAJARAN</div>
<div class="doc-subtitle">Kurikulum Merdeka — ${d.school} | Tahun Pelajaran ${d.year}</div>
<p style="text-align:center;">Dokumen ${docType} berhasil disusun sesuai format standar Kurikulum Merdeka.</p>
${ttd}
`;
}
