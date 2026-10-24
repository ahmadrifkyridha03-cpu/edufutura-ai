/**
 * Server-side fallback generator for Kurikulum Berbasis Cinta (KBC Kemenag)
 * and Kurikulum Merdeka official teaching documents.
 * Ensures the application is 100% resilient and produces complete, official,
 * printable documents even when the Gemini API is temporarily unreachable or unauthenticated.
 */

export interface KbcFormData {
  schoolName?: string;
  kemenagOffice?: string;
  schoolAddress?: string;
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
  learningModel?: string;
  sintakModel?: string;
  kodeTp?: string;
  rumusanTp?: string;
  elemenCp?: string;
  jumlahPertemuan?: string | number;
  jpPerPertemuan?: string | number;
  topikLokal?: string;
  [key: string]: any;
}

const COMMON_CSS = `
<style>
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1e293b;
    line-height: 1.5;
    font-size: 11pt;
  }
  .kop-surat {
    text-align: center;
    border-bottom: 3px double #0f172a;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .kop-surat h3 {
    margin: 0;
    font-size: 12pt;
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
    font-size: 9.5pt;
    color: #475569;
  }
  .doc-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    color: #1a3a5c;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 10pt;
    color: #64748b;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .section-title {
    font-size: 12pt;
    font-weight: bold;
    color: #1a3a5c;
    border-bottom: 1.5px solid #1a3a5c;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  .kbc-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 10.5pt;
  }
  .kbc-table th {
    background-color: #1a3a5c;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
    padding: 8px 10px;
    border: 1px solid #1a3a5c;
    vertical-align: middle;
  }
  .kbc-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    vertical-align: top;
    color: #1e293b;
  }
  .kbc-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .highlight-badge {
    background-color: #e0f2fe;
    color: #0369a1;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9pt;
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
    font-size: 11pt;
  }
  @media print {
    @page { margin: 1.2cm; }
  }
</style>
`;

function renderKop(data: KbcFormData): string {
  const kemenag = data.kemenagOffice || "KANTOR KEMENTERIAN AGAMA KABUPATEN KERINCI";
  const school = data.schoolName || "MAN 1 Kerinci";
  const address = data.schoolAddress || "Jl. Raya Semurup No. 45, Semurup, Kabupaten Kerinci";
  return `
  <div class="kop-surat">
    <h3>KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
    <h3>${kemenag.toUpperCase()}</h3>
    <h2>${school.toUpperCase()}</h2>
    <p>${address}</p>
  </div>`;
}

function renderSignatures(data: KbcFormData): string {
  const cityDate = data.cityDate || "Kerinci, 14 Juli 2026";
  const principal = data.principal || "Hamdani, S.Pd., M.Si.";
  const nipPrincipal = data.nipPrincipal || "19780514 200212 1 003";
  const teacher = data.teacher || "Drs. Yefri Haryanto, M.Pd.";
  const nipTeacher = data.nipTeacher || "19850312 201001 1 008";

  return `
  <table class="ttd-table">
    <tr>
      <td>
        Mengetahui,<br>
        <strong>Kepala Madrasah</strong>
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

export function buildKbcFallbackDocument(docType: string, formData: KbcFormData = {}): string {
  const d = {
    schoolName: formData.schoolName || "MAN 1 Kerinci",
    kemenagOffice: formData.kemenagOffice || "KANTOR KEMENTERIAN AGAMA KABUPATEN KERINCI",
    schoolAddress: formData.schoolAddress || "Jl. Raya Semurup No. 45, Semurup, Kabupaten Kerinci",
    subject: formData.subject || "Akidah Akhlak",
    singkatanMapel: formData.singkatanMapel || "AA",
    level: formData.level || "Fase E / Kelas X",
    year: formData.year || "2026/2027",
    totalJp: formData.totalJp || "72 JP / Tahun",
    jpPerMinggu: formData.jpPerMinggu || "2 JP/Minggu",
    teacher: formData.teacher || "Drs. Yefri Haryanto, M.Pd.",
    nipTeacher: formData.nipTeacher || "19850312 201001 1 008",
    cityDate: formData.cityDate || "Kerinci, 14 Juli 2026",
    principal: formData.principal || "Hamdani, S.Pd., M.Si.",
    nipPrincipal: formData.nipPrincipal || "19780514 200212 1 003",
    cpRasional: formData.cpRasional || "Mata pelajaran ini membina fitrah ketauhidan dan akhlak mulia peserta didik berlandaskan cinta kasih.",
    cpElemen: formData.cpElemen || "Akidah dan Akhlak",
    learningModel: formData.learningModel || "Discovery Learning",
    sintakModel: formData.sintakModel || "1. Stimulasi, 2. Identifikasi Masalah, 3. Pengumpulan Data, 4. Pengolahan Data, 5. Pembuktian, 6. Kesimpulan",
    kodeTp: formData.kodeTp || "TP.AA.ELE.10.01",
    rumusanTp: formData.rumusanTp || "Peserta didik mampu menganalisis konsep ketauhidan dan Asmaul Husna secara mendalam, serta menginternalisasi nilai kasih sayang Allah Swt. dalam kehidupan sehari-hari.",
    elemenCp: formData.elemenCp || "Akidah",
    jumlahPertemuan: formData.jumlahPertemuan || "3",
    jpPerPertemuan: formData.jpPerPertemuan || "2",
    topikLokal: formData.topikLokal || "Pelestarian Lingkungan Hutan TNKS & Budaya Adat Mudik Kerinci"
  };

  const kop = renderKop(d);
  const ttd = renderSignatures(d);

  if (docType === "rme") {
    const rme = formData.rme || {};
    const rmeGanjil = (rme.ganjil && rme.ganjil.length) ? rme.ganjil : [
      { month: "Juli", totalWeeks: 4, nonEffective: 2, effective: 2, note: "MPLS & Pengenalan Lingkungan Belajar (2 Pekan)" },
      { month: "Agustus", totalWeeks: 5, nonEffective: 0, effective: 5, note: "Pekan Efektif Penuh (Peringatan HUT RI)" },
      { month: "September", totalWeeks: 4, nonEffective: 1, effective: 3, note: "Penilaian Sumatif Tengah Semester (PTS/STS) Ganjil (1 Pekan)" },
      { month: "Oktober", totalWeeks: 5, nonEffective: 0, effective: 5, note: "Pekan Efektif Penuh" },
      { month: "November", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
      { month: "Desember", totalWeeks: 4, nonEffective: 3, effective: 1, note: "Sumatif Akhir Semester (SAS), Pembagian Rapor & Libur Semester 1 (3 Pekan)" }
    ];
    const rmeGenap = (rme.genap && rme.genap.length) ? rme.genap : [
      { month: "Januari", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
      { month: "Februari", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
      { month: "Maret", totalWeeks: 5, nonEffective: 2, effective: 3, note: "Libur Awal Ramadhan & PTS/STS Genap (2 Pekan)" },
      { month: "April", totalWeeks: 4, nonEffective: 2, effective: 2, note: "Libur Hari Raya Idul Fitri & Ujian Akhir Jenjang (2 Pekan)" },
      { month: "Mei", totalWeeks: 5, nonEffective: 1, effective: 4, note: "Sumatif Akhir Tahun (SAT) Genap (1 Pekan)" },
      { month: "Juni", totalWeeks: 4, nonEffective: 3, effective: 1, note: "Pengolahan Rapor, Wisuda & Libur Kenaikan Kelas (3 Pekan)" }
    ];
    const agendaList = (rme.agenda && rme.agenda.length) ? rme.agenda : [
      { kegiatan: "Masa Pengenalan Lingkungan Sekolah (MPLS)", waktu: "13 - 24 Juli 2026", semester: "Ganjil", kategori: "Kurikuler" },
      { kegiatan: "Peringatan HUT RI Ke-81", waktu: "17 Agustus 2026", semester: "Ganjil", kategori: "Karakter/P5" },
      { kegiatan: "Penilaian Sumatif Tengah Semester (STS) Ganjil", waktu: "21 - 26 September 2026", semester: "Ganjil", kategori: "Asesmen" },
      { kegiatan: "Sumatif Akhir Semester (SAS) Ganjil", waktu: "30 Nov - 11 Des 2026", semester: "Ganjil", kategori: "Asesmen" },
      { kegiatan: "Penerimaan Rapor & Libur Semester Ganjil", waktu: "18 Des 2026 - 3 Jan 2027", semester: "Ganjil", kategori: "Libur" },
      { kegiatan: "Hari Pertama Masuk Semester Genap", waktu: "4 Januari 2027", semester: "Genap", kategori: "Kurikuler" },
      { kegiatan: "Perkiraan Libur Awal Ramadhan 1448 H", waktu: "8 - 13 Maret 2027", semester: "Genap", kategori: "Libur" },
      { kegiatan: "Penilaian Sumatif Tengah Semester (STS) Genap", waktu: "15 - 20 Maret 2027", semester: "Genap", kategori: "Asesmen" },
      { kegiatan: "Libur Hari Raya Idul Fitri 1448 H", waktu: "22 Maret - 3 April 2027", semester: "Genap", kategori: "Libur" },
      { kegiatan: "Sumatif Akhir Tahun (SAT) Genap", waktu: "24 Mei - 4 Juni 2027", semester: "Genap", kategori: "Asesmen" },
      { kegiatan: "Penerimaan Rapor & Libur Kenaikan Kelas", waktu: "18 Juni - 10 Juli 2027", semester: "Genap", kategori: "Libur" }
    ];

    const jpNum = parseInt(d.jpPerMinggu) || 3;
    let totG1Weeks = 0, totG1Non = 0, totG1Eff = 0;
    let totG2Weeks = 0, totG2Non = 0, totG2Eff = 0;

    let rowsGanjil = rmeGanjil.map((r: any, idx: number) => {
      totG1Weeks += Number(r.totalWeeks || 0);
      totG1Non += Number(r.nonEffective || 0);
      totG1Eff += Number(r.effective || 0);
      return `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${r.month}</strong></td>
        <td style="text-align:center;">${r.totalWeeks}</td>
        <td style="text-align:center;">${r.nonEffective}</td>
        <td style="text-align:center; font-weight:bold; color:#1a3a5c;">${r.effective}</td>
        <td>${r.note || '-'}</td>
      </tr>`;
    }).join("");

    let rowsGenap = rmeGenap.map((r: any, idx: number) => {
      totG2Weeks += Number(r.totalWeeks || 0);
      totG2Non += Number(r.nonEffective || 0);
      totG2Eff += Number(r.effective || 0);
      return `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${r.month}</strong></td>
        <td style="text-align:center;">${r.totalWeeks}</td>
        <td style="text-align:center;">${r.nonEffective}</td>
        <td style="text-align:center; font-weight:bold; color:#1a3a5c;">${r.effective}</td>
        <td>${r.note || '-'}</td>
      </tr>`;
    }).join("");

    const totEffYear = totG1Eff + totG2Eff;
    const totJpYear = totEffYear * jpNum;
    const jpIntra = Math.round(totJpYear * 0.75);
    const jpP5 = totJpYear - jpIntra;

    let rowsAgenda = agendaList.map((a: any, idx: number) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${a.kegiatan}</strong></td>
        <td style="text-align:center;">${a.waktu}</td>
        <td style="text-align:center;">${a.semester || 'Ganjil'}</td>
        <td style="text-align:center;"><span style="padding:2px 8px; border-radius:4px; font-size:9pt; background-color:#e0f2fe; color:#0369a1;">${a.kategori || 'Kurikuler'}</span></td>
      </tr>
    `).join("");

    return `
${COMMON_CSS}
${kop}
<div class="doc-title">RENCANA MINGGU EFEKTIF (RME / RPE) & KALENDER PENDIDIKAN</div>
<div class="doc-subtitle">Analisis Pekan Efektif, Beban Mengajar & Distribusi Jam Pelajaran | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM & SATUAN PENDIDIKAN</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td><td style="font-weight:bold; background-color:#f1f5f9;">Tahun Pelajaran</td><td>${d.year}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Beban Tatap Muka</td><td>${d.jpPerMinggu}</td><td style="font-weight:bold; background-color:#f1f5f9;">Guru Pengampu</td><td>${d.teacher}</td></tr>
</table>

<div class="section-title">B. ANALISIS MINGGU EFEKTIF SEMESTER GANJIL</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:6%;">No</th>
      <th style="width:18%;">Nama Bulan</th>
      <th style="width:14%;">Jumlah Minggu</th>
      <th style="width:16%;">Minggu Tdk Efektif</th>
      <th style="width:14%;">Minggu Efektif</th>
      <th>Keterangan / Agenda Kegiatan Sekolah</th>
    </tr>
  </thead>
  <tbody>
    ${rowsGanjil}
    <tr style="background-color:#f1f5f9; font-weight:bold;">
      <td colspan="2" style="text-align:center;">Jumlah Semester Ganjil</td>
      <td style="text-align:center;">${totG1Weeks}</td>
      <td style="text-align:center;">${totG1Non}</td>
      <td style="text-align:center; color:#1a3a5c;">${totG1Eff}</td>
      <td>Pekan Efektif Ganjil = ${totG1Eff * jpNum} Jam Pelajaran (JP)</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. ANALISIS MINGGU EFEKTIF SEMESTER GENAP</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:6%;">No</th>
      <th style="width:18%;">Nama Bulan</th>
      <th style="width:14%;">Jumlah Minggu</th>
      <th style="width:16%;">Minggu Tdk Efektif</th>
      <th style="width:14%;">Minggu Efektif</th>
      <th>Keterangan / Agenda Kegiatan Sekolah</th>
    </tr>
  </thead>
  <tbody>
    ${rowsGenap}
    <tr style="background-color:#f1f5f9; font-weight:bold;">
      <td colspan="2" style="text-align:center;">Jumlah Semester Genap</td>
      <td style="text-align:center;">${totG2Weeks}</td>
      <td style="text-align:center;">${totG2Non}</td>
      <td style="text-align:center; color:#1a3a5c;">${totG2Eff}</td>
      <td>Pekan Efektif Genap = ${totG2Eff * jpNum} Jam Pelajaran (JP)</td>
    </tr>
  </tbody>
</table>

<div class="section-title">D. REKAPITULASI RENCANA PEKAN EFEKTIF (RPE) & DISTRIBUSI JAM PELAJARAN</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th>Komponen Distribusi Jam Pembelajaran</th>
      <th style="width:22%; text-align:center;">Jumlah Pekan</th>
      <th style="width:25%; text-align:center;">Alokasi Jam Pelajaran (JP)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td>Jumlah Pekan Efektif Semester Ganjil</td>
      <td style="text-align:center; font-weight:bold;">${totG1Eff} Pekan</td>
      <td style="text-align:center; font-weight:bold;">${totG1Eff * jpNum} JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>Jumlah Pekan Efektif Semester Genap</td>
      <td style="text-align:center; font-weight:bold;">${totG2Eff} Pekan</td>
      <td style="text-align:center; font-weight:bold;">${totG2Eff * jpNum} JP</td>
    </tr>
    <tr style="background-color:#f8fafc; font-weight:bold;">
      <td style="text-align:center;">3</td>
      <td><strong>Total Pekan Efektif 1 Tahun Ajaran</strong></td>
      <td style="text-align:center; color:#1a3a5c;">${totEffYear} Pekan</td>
      <td style="text-align:center; color:#1a3a5c;">${totJpYear} JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">4</td>
      <td>Alokasi Tatap Muka Intrakurikuler (75%)</td>
      <td style="text-align:center;">${Math.round(totEffYear * 0.75)} Pekan</td>
      <td style="text-align:center; font-weight:bold; color:#166534;">${jpIntra} JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">5</td>
      <td>Alokasi Projek Penguatan Profil Pelajar (P5) / Karakter (25%)</td>
      <td style="text-align:center;">${totEffYear - Math.round(totEffYear * 0.75)} Pekan</td>
      <td style="text-align:center; font-weight:bold; color:#9a3412;">${jpP5} JP</td>
    </tr>
  </tbody>
</table>

<div class="section-title">E. KALENDER PENDIDIKAN & AGENDA UTAMA SEKOLAH</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:6%;">No</th>
      <th>Nama Agenda / Kegiatan Sekolah</th>
      <th style="width:25%; text-align:center;">Rentang Waktu / Tanggal</th>
      <th style="width:12%; text-align:center;">Semester</th>
      <th style="width:16%; text-align:center;">Kategori</th>
    </tr>
  </thead>
  <tbody>
    ${rowsAgenda}
  </tbody>
</table>

<div style="background-color:#f8fafc; border-left:4px solid #1a3a5c; padding:10px 14px; margin-bottom:20px; font-size:10pt;">
  <strong>Catatan Pedoman Kalender Pendidikan:</strong><br>
  ${rme.catatanKalender || 'Kalender Pendidikan berpedoman pada Keputusan Dinas Pendidikan dan Kalender Akademik Resmi Sekolah. Pelaksanaan penilaian formatif dan sumatif menyesuaikan jadwal pekan efektif di atas.'}
</div>

${ttd}
`;
  }

  if (docType === "analisis_cp") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">ANALISIS CAPAIAN PEMBELAJARAN (ACP)</div>
<div class="doc-subtitle">Kurikulum Berbasis Cinta (KBC) — Terintegrasi Panca Cinta & 10 Nilai PPRA | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS SATUAN PENDIDIKAN</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Tahun Pelajaran</td><td>${d.year}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Waktu</td><td>${d.totalJp} (${d.jpPerMinggu})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Penyusun / NIP</td><td>${d.teacher} / ${d.nipTeacher}</td></tr>
</table>

<div class="section-title">B. RASIONAL MATA PELAJARAN</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:25%;">Uraian Rasional</th>
      <th>Deskripsi Penjabaran Filosofis KBC</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td><strong>Pentingnya Mapel & Panca Cinta</strong></td>
      <td>Pembelajaran ${d.subject} berakar pada penanaman cinta kepada Allah, Rasul, sesama manusia, ilmu pengetahuan, dan kelestarian alam semesta (Panca Cinta Kemenag). Membentuk insan beriman yang santun dan peka nuraninya.</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td><strong>Keterpaduan Profil & Nilai PPRA</strong></td>
      <td>Mengintegrasikan 8 Dimensi Profil Kelulusan dengan 10 Nilai Profil Pelajar Rahmatan lil 'Alamin (PPRA) guna mewujudkan moderasi beragama, kemandirian berpikir, dan integritas moral.</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td><strong>Pendekatan Deep Learning</strong></td>
      <td>Menerapkan 3 pilar: <em>Mindful</em> (kesadaran penuh), <em>Meaningful</em> (kebermaknaan aplikatif), dan <em>Joyful</em> (kegembiraan belajar) sehingga peserta didik antusias mengeksplorasi materi.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. TUJUAN MATA PELAJARAN</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:40%;">Tujuan Utama</th>
      <th>Indikator Ketercapaian Terukur</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td>Mengembangkan pemahaman konsep esensial dan nalar kritis siswa terhadap materi ${d.subject}.</td>
      <td>Mampu menguraikan, menganalisis, dan memecahkan studi kasus kontekstual dengan argumentasi ilmiah dan religius yang kokoh.</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>Membentuk kepribadian yang menjunjung tinggi toleransi, moderasi, dan keteladanan (Qudwah).</td>
      <td>Menampilkan sikap saling menghormati, berkolaborasi dalam kebajikan, serta melestarikan kearifan lokal ${d.topikLokal}.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">D. KARAKTERISTIK MATA PELAJARAN & ELEMEN CP</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:22%;">Elemen CP</th>
      <th style="width:40%;">Deskripsi Karakteristik Elemen</th>
      <th>Cakupan Konten Utama</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td><strong>${d.elemenCp}</strong></td>
      <td>Mengembangkan keteguhan keyakinan, refleksi ketuhanan, dan aktualisasi nilai kemanusiaan dalam kehidupan bermasyarakat.</td>
      <td>Konsep Tauhid, Asmaul Husna, Dalil Naqli & Aqli, serta Internalisasi Nilai Kasih Sayang.</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td><strong>Akhlak & Keteladanan</strong></td>
      <td>Membina etika pergaulan Islami, keadaban (Ta'addub), dan tanggung jawab ekologis terhadap alam semesta.</td>
      <td>Akhlak terpuji kepada sesama, etika digital, dan pelestarian alam lokal (${d.topikLokal}).</td>
    </tr>
  </tbody>
</table>

<div class="section-title">E. INTEGRASI 10 NILAI PROFIL PELAJAR RAHMATAN LIL 'ALAMIN (PPRA)</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:22%;">Nilai PPRA</th>
      <th style="width:30%;">Makna Inti Nilai</th>
      <th>Bentuk Integrasi dalam Pembelajaran</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align:center;">1</td><td><strong>Ta'addub</strong></td><td>Berkeadaban & kesopanan</td><td>Menjaga adab belajar, tutur kata santun, dan penghormatan kepada guru serta sesama.</td></tr>
    <tr><td style="text-align:center;">2</td><td><strong>Qudwah</strong></td><td>Keteladanan moral</td><td>Menjadi pionir dalam ketertiban, kejujuran asesmen, dan inisiatif kebaikan bersama.</td></tr>
    <tr><td style="text-align:center;">3</td><td><strong>Muwaṭanah</strong></td><td>Kewarganegaraan & cinta tanah air</td><td>Menjunjung tinggi kebhinekaan NKRI dan melestarikan budaya adiluhung lokal Kerinci.</td></tr>
    <tr><td style="text-align:center;">4</td><td><strong>Tawassuṭ</strong></td><td>Jalan tengah & moderasi</td><td>Menolak pemikiran ekstrem, berpikir berimbang, dan mengedepankan kearifan.</td></tr>
    <tr><td style="text-align:center;">5</td><td><strong>Tawāzun</strong></td><td>Keseimbangan hidup</td><td>Menyeimbangkan kebutuhan spiritual, intelektual, fisik, dan tanggung jawab sosial.</td></tr>
    <tr><td style="text-align:center;">6</td><td><strong>I'tidāl</strong></td><td>Keadilan & integritas teguh</td><td>Menegakkan hak dan kewajiban secara proporsional serta objektif dalam penilaian.</td></tr>
    <tr><td style="text-align:center;">7</td><td><strong>Musāwah</strong></td><td>Kesetaraan tanpa diskriminasi</td><td>Menghargai martabat sesama peserta didik tanpa membedakan latar belakang sosial.</td></tr>
    <tr><td style="text-align:center;">8</td><td><strong>Syūrā</strong></td><td>Musyawarah mufakat</td><td>Mendahulukan diskusi demokratis dan kesepakatan dalam kerja kelompok.</td></tr>
    <tr><td style="text-align:center;">9</td><td><strong>Tasāmuh</strong></td><td>Toleransi & keterbukaan</td><td>Menerima perbedaan perspektif dan hidup harmonis di tengah kemajemukan.</td></tr>
    <tr><td style="text-align:center;">10</td><td><strong>Tathawwur wa Ibtikār</strong></td><td>Dinamis & Inovatif</td><td>Menciptakan karya baru, berpikir solutif, dan adaptif terhadap kemajuan sains teknologi.</td></tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "tp") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">TUJUAN PEMBELAJARAN (TP) KURIKULUM BERBASIS CINTA</div>
<div class="doc-subtitle">Penjabaran Capaian Pembelajaran Menjadi Tujuan Pembelajaran | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS DOKUMEN</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td><td style="font-weight:bold; background-color:#f1f5f9;">Tahun Pelajaran</td><td>${d.year}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Total</td><td>${d.totalJp}</td><td style="font-weight:bold; background-color:#f1f5f9;">Penyusun</td><td>${d.teacher}</td></tr>
</table>

<div class="section-title">B. DAFTAR TUJUAN PEMBELAJARAN (TP) BERBASIS KBC & PPRA</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:6%;">No</th>
      <th style="width:16%;">Kode TP</th>
      <th style="width:15%;">Elemen</th>
      <th>Rumusan Tujuan Pembelajaran (Kompetensi & Konten)</th>
      <th style="width:22%;">Integrasi Nilai (KBC & PPRA)</th>
      <th style="width:8%;">Alokasi</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td><strong>${d.kodeTp}</strong></td>
      <td>${d.elemenCp}</td>
      <td>${d.rumusanTp}</td>
      <td>Cinta kepada Allah, <em>Qudwah</em> (Keteladanan) & <em>Ta'addub</em></td>
      <td style="text-align:center;">${d.jumlahPertemuan ? Number(d.jumlahPertemuan) * Number(d.jpPerPertemuan) : 6} JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td><strong>TP.${d.singkatanMapel}.ELE.10.02</strong></td>
      <td>${d.elemenCp}</td>
      <td>Peserta didik mampu membuktikan korelasi antara dalil naqli dan aqli mengenai keesaan Allah serta mengaitkannya dengan fenomena kebesaran alam semesta.</td>
      <td>Cinta kepada Ilmu, <em>Tathawwur wa Ibtikār</em> (Inovatif)</td>
      <td style="text-align:center;">6 JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td><strong>TP.${d.singkatanMapel}.ELE.10.03</strong></td>
      <td>Akhlak</td>
      <td>Peserta didik mampu mengevaluasi sikap toleransi dan adab interaksi di masyarakat majemuk serta mempraktikkan kearifan lokal secara bijaksana.</td>
      <td>Cinta kepada Sesama, <em>Tasāmuh</em> & <em>Muwaṭanah</em></td>
      <td style="text-align:center;">6 JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">4</td>
      <td><strong>TP.${d.singkatanMapel}.ELE.10.04</strong></td>
      <td>Akhlak & Ekologi</td>
      <td>Peserta didik mampu merancang aksi nyata perlindungan lingkungan hidup dan kearifan ekologis (${d.topikLokal}) sebagai wujud syukur atas ciptaan Tuhan.</td>
      <td>Cinta Alam Semesta, <em>Tawāzun</em> (Keseimbangan)</td>
      <td style="text-align:center;">6 JP</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. REKAPITULASI ALOKASI WAKTU PER ELEMEN</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th>Elemen Capaian Pembelajaran</th>
      <th style="width:18%;">Jumlah TP</th>
      <th style="width:20%;">Alokasi Waktu (JP)</th>
      <th style="width:16%;">Persentase</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align:center;">1</td><td>${d.elemenCp}</td><td style="text-align:center;">2 TP</td><td style="text-align:center;">12 JP</td><td style="text-align:center;">50%</td></tr>
    <tr><td style="text-align:center;">2</td><td>Akhlak & Adab KBC</td><td style="text-align:center;">2 TP</td><td style="text-align:center;">12 JP</td><td style="text-align:center;">50%</td></tr>
    <tr style="font-weight:bold; background-color:#e2e8f0;"><td colspan="2" style="text-align:right;">TOTAL</td><td style="text-align:center;">4 TP</td><td style="text-align:center;">24 JP</td><td style="text-align:center;">100%</td></tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "atp") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">ALUR TUJUAN PEMBELAJARAN (ATP) KURIKULUM BERBASIS CINTA</div>
<div class="doc-subtitle">Alur Progresif & Hierarki Pencapaian Kompetensi | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS & PRINSIP PENGURUTAN ALUR</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td><td style="font-weight:bold; background-color:#f1f5f9;">Penyusun</td><td>${d.teacher}</td></tr>
</table>
<p style="font-size:10pt; color:#475569; margin-bottom:14px;"><em>Prinsip Alur: Disusun dari konsep konkret ke abstrak (konseptual-aplikatif), menghubungkan kognisi dengan penghayatan batiniah kasih sayang (KBC) serta implementasi di masyarakat.</em></p>

<div class="section-title">B. TABEL ALUR TUJUAN PEMBELAJARAN (ATP)</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:6%;">Tahap</th>
      <th style="width:14%;">Kode TP</th>
      <th>Tujuan Pembelajaran</th>
      <th style="width:25%;">Materi & Konteks Pembelajaran</th>
      <th style="width:10%;">JP</th>
      <th style="width:18%;">Fokus Nilai PPRA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.1</td>
      <td>${d.kodeTp}</td>
      <td>${d.rumusanTp}</td>
      <td>Konsep Tauhid, Makna Asmaul Husna, & Kasih Sayang Illahi</td>
      <td style="text-align:center;">6 JP</td>
      <td>Ta'addub & Qudwah</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.2</td>
      <td>TP.${d.singkatanMapel}.ELE.10.02</td>
      <td>Menganalisis keteraturan alam semesta sebagai cerminan Asmaul Husna melalui penalaran kritis dan riset mini.</td>
      <td>Dalil Naqli/Aqli, Fenomena Kosmologi & Kebesaran Tuhan</td>
      <td style="text-align:center;">6 JP</td>
      <td>Tathawwur wa Ibtikār</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.3</td>
      <td>TP.${d.singkatanMapel}.ELE.10.03</td>
      <td>Menerapkan adab bergaul Islami, dialog santun, dan toleransi sosial dalam lingkungan madrasah dan keluarga.</td>
      <td>Adab Pergaulan Remaja, Tasāmuh, & Etika Komunikasi Digital</td>
      <td style="text-align:center;">6 JP</td>
      <td>Tasāmuh & Syūrā</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.4</td>
      <td>TP.${d.singkatanMapel}.ELE.10.04</td>
      <td>Menginisiasi gerakan peduli alam sekitar dan pelestarian kearifan lokal (${d.topikLokal}).</td>
      <td>Ekoteologi Islam, Konservasi Alam, & Tanggung Jawab Ekologis</td>
      <td style="text-align:center;">6 JP</td>
      <td>Tawāzun & Muwaṭanah</td>
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
<div class="doc-title">PROGRAM TAHUNAN (PROTA) KURIKULUM BERBASIS CINTA</div>
<div class="doc-subtitle">Distribusi Alokasi Waktu Pembelajaran 2 Semester | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM TAHUNAN</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td><td style="font-weight:bold; background-color:#f1f5f9;">Tahun Pelajaran</td><td>${d.year}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Total Jam</td><td>${d.totalJp}</td><td style="font-weight:bold; background-color:#f1f5f9;">Penyusun</td><td>${d.teacher}</td></tr>
</table>

<div class="section-title">B. DISTRIBUSI ALOKASI WAKTU SEMESTER GANJIL & GENAP</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:10%;">Semester</th>
      <th style="width:14%;">Kode TP</th>
      <th>Lingkup Materi Pokok & Tujuan Pembelajaran</th>
      <th style="width:12%;">Alokasi</th>
      <th style="width:25%;">Keterangan & Integrasi Nilai KBC</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold;" rowspan="3">GANJIL</td>
      <td>${d.kodeTp}</td>
      <td><strong>Konsep Tauhid & Asmaul Husna:</strong> Memahami hakikat ketauhidan yang melahirkan cinta dan kasih sayang.</td>
      <td style="text-align:center;">12 JP</td>
      <td>Panca Cinta (Cinta Allah & Rasul) & Nilai <em>Qudwah</em></td>
    </tr>
    <tr>
      <td>TP.${d.singkatanMapel}.ELE.10.02</td>
      <td><strong>Harmoni Kosmos & Nalar Kritis:</strong> Mengkaji bukti kebesaran Illahi pada alam semesta.</td>
      <td style="text-align:center;">12 JP</td>
      <td>Panca Cinta Ilmu & Nilai <em>Tathawwur wa Ibtikār</em></td>
    </tr>
    <tr>
      <td>TP.${d.singkatanMapel}.ELE.10.03</td>
      <td><strong>Etika Pergaulan & Tasāmuh:</strong> Adab persaudaraan Islami dan moderasi sosial.</td>
      <td style="text-align:center;">12 JP</td>
      <td>Panca Cinta Sesama & Nilai <em>Tasāmuh</em></td>
    </tr>
    <tr style="background-color:#f1f5f9; font-weight:bold;">
      <td colspan="3" style="text-align:right;">Sub-Total Alokasi Semester Ganjil</td>
      <td style="text-align:center;">36 JP</td>
      <td>Termasuk Cadangan Asesmen</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;" rowspan="2">GENAP</td>
      <td>TP.${d.singkatanMapel}.ELE.10.04</td>
      <td><strong>Ekoteologi & Pelestarian Alam:</strong> Harmonisasi manusia dengan lingkungan hidup (${d.topikLokal}).</td>
      <td style="text-align:center;">18 JP</td>
      <td>Panca Cinta Alam Semesta & Nilai <em>Tawāzun</em></td>
    </tr>
    <tr>
      <td>TP.${d.singkatanMapel}.ELE.10.05</td>
      <td><strong>Integritas Diri & Kebangsaan:</strong> Keadilan hukum, kejujuran diri, dan cinta NKRI.</td>
      <td style="text-align:center;">18 JP</td>
      <td>Nilai <em>Muwaṭanah</em> & <em>I'tidāl</em></td>
    </tr>
    <tr style="background-color:#f1f5f9; font-weight:bold;">
      <td colspan="3" style="text-align:right;">Sub-Total Alokasi Semester Genap</td>
      <td style="text-align:center;">36 JP</td>
      <td>Termasuk Proyek KBC & PAT</td>
    </tr>
    <tr style="background-color:#e2e8f0; font-weight:bold; font-size:11pt;">
      <td colspan="3" style="text-align:right;">TOTAL ALOKASI 1 TAHUN AJARAN</td>
      <td style="text-align:center; color:#1a3a5c;">72 JP</td>
      <td>36 Minggu Efektif x 2 JP</td>
    </tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "prosem") {
    return `
${COMMON_CSS}
<style>@media print { @page { size: A4 landscape; margin: 1.0cm; } }</style>
${kop}
<div class="doc-title">PROGRAM SEMESTER (PROSEM) KURIKULUM BERBASIS CINTA</div>
<div class="doc-subtitle">Matriks Jadwal Mingguan Pembelajaran Semester Ganjil | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS PROGRAM SEMESTER</div>
<table class="kbc-table">
  <tr><td style="width:20%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td><td style="width:20%; font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td><td style="font-weight:bold; background-color:#f1f5f9;">Semester</td><td>Ganjil (Tahun ${d.year})</td></tr>
</table>

<div class="section-title">B. MATRIKS DISTRIBUSI BULAN DAN MINGGU EFEKTIF</div>
<table class="kbc-table" style="font-size:9.5pt;">
  <thead>
    <tr>
      <th rowspan="2" style="width:4%;">No</th>
      <th rowspan="2" style="width:10%;">Kode TP</th>
      <th rowspan="2">Tujuan Pembelajaran / Lingkup Materi</th>
      <th rowspan="2" style="width:6%;">JP</th>
      <th colspan="5">Juli</th>
      <th colspan="5">Agustus</th>
      <th colspan="5">September</th>
      <th colspan="5">Oktober</th>
      <th colspan="5">November</th>
      <th colspan="5">Desember</th>
    </tr>
    <tr>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td>${d.kodeTp}</td>
      <td>Konsep Tauhid, Asmaul Husna & Internalisasi Kasih Sayang</td>
      <td style="text-align:center;">6</td>
      <td></td><td></td><td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>TP.${d.singkatanMapel}.02</td>
      <td>Keteraturan Kosmos & Dalil Keagungan Illahi</td>
      <td style="text-align:center;">6</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td>TP.${d.singkatanMapel}.03</td>
      <td>Adab Pergaulan Islami & Sikap Tasāmuh</td>
      <td style="text-align:center;">6</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td>
      <td style="text-align:center; background-color:#bfdbfe;">2</td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <td style="text-align:center;">4</td>
      <td>TP.${d.singkatanMapel}.04</td>
      <td>Ekoteologi & Pelestarian Alam (${d.topikLokal})</td>
      <td style="text-align:center;">6</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td><td style="text-align:center; background-color:#bfdbfe;">2</td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr style="background-color:#fee2e2;">
      <td colspan="3" style="text-align:center; font-weight:bold;">Penilaian Sumatif Akhir Semester (SAS) & Rapor KBC</td>
      <td style="text-align:center;">4</td>
      <td colspan="25"></td>
      <td style="text-align:center; background-color:#fca5a5;">2</td><td style="text-align:center; background-color:#fca5a5;">2</td><td colspan="3"></td>
    </tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "kktp") {
    return `
${COMMON_CSS}
<style>@media print { @page { size: A4 landscape; margin: 1.0cm; } }</style>
${kop}
<div class="doc-title">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</div>
<div class="doc-subtitle">Kurikulum Berbasis Cinta (KBC) — Rubrik Deskriptor Progresif Kemenag | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. PENETAPAN LEVEL CAPAIAN & AMBANG BATAS MINIMAL</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:15%;">Level Capaian</th>
      <th style="width:12%;">Rentang Nilai</th>
      <th style="width:35%;">Deskripsi Umum Ketercapaian</th>
      <th>Rekomendasi Tindak Lanjut Pedagogis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Level 1: Mulai Berkembang</strong></td>
      <td style="text-align:center;">0 - 55</td>
      <td>Peserta didik baru menguasai sebagian kecil kompetensi dasar dan belum konsisten menunjukkan adab.</td>
      <td>Pendampingan intensif (scaffolding) dengan penuh kasih sayang dan tutor sebaya.</td>
    </tr>
    <tr>
      <td style="background-color:#dcfce7;"><strong>Level 2: Layak (✓ Tuntas KKTP)</strong></td>
      <td style="text-align:center; font-weight:bold; color:#15803d; background-color:#dcfce7;">56 - 70</td>
      <td>Peserta didik telah mencapai kriteria minimal ketuntasan, memahami konsep inti, dan beradab baik.</td>
      <td>Diberikan latihan penguatan konsep aplikatif untuk memantapkan pemahaman.</td>
    </tr>
    <tr>
      <td><strong>Level 3: Cakap</strong></td>
      <td style="text-align:center;">71 - 85</td>
      <td>Peserta didik menguasai seluruh tujuan pembelajaran, mampu menganalisis secara kritis, dan santun.</td>
      <td>Diberikan studi kasus yang lebih menantang untuk memperluas wawasan berpikir.</td>
    </tr>
    <tr>
      <td><strong>Level 4: Mahir</strong></td>
      <td style="text-align:center;">86 - 100</td>
      <td>Peserta didik menguasai materi secara mendalam, inovatif, dan menjadi teladan (<em>Qudwah</em>) bagi rekan-rekannya.</td>
      <td>Program pengayaan tingkat lanjut, menjadi tutor sebaya, dan proyek kepemimpinan madrasah.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">B. RUBRIK KKTP PER TUJUAN PEMBELAJARAN</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th rowspan="2" style="width:12%;">Kode TP</th>
      <th rowspan="2" style="width:25%;">Indikator Ketercapaian (IKTP)</th>
      <th colspan="4">Deskriptor Progresi Bertingkat</th>
    </tr>
    <tr>
      <th style="width:15%;">1 - Mulai Berkembang</th>
      <th style="width:16%; background-color:#166534;">2 - Layak (✓ KKTP)</th>
      <th style="width:16%;">3 - Cakap</th>
      <th style="width:16%;">4 - Mahir (Qudwah)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="font-weight:bold;">${d.kodeTp}</td>
      <td>Kemampuan menganalisis konsep ketauhidan dan Asmaul Husna serta mengamalkannya dalam kehidupan.</td>
      <td>Baru mampu menyebutkan definisi dasar ketauhidan dan membutuhkan bimbingan aktif.</td>
      <td style="background-color:#f0fdf4;">Mampu menjelaskan dalil dan menguraikan Asmaul Husna dengan benar sesuai standar minimal.</td>
      <td>Mampu mengaitkan pemahaman Asmaul Husna dengan perilaku nyata kasih sayang di lingkungan.</td>
      <td>Mampu mengevaluasi implementasi nilai kasih sayang secara orisinil dan menjadi <em>Qudwah</em> teladan.</td>
    </tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "lkpd") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">LEMBAR KERJA PESERTA DIDIK (LKPD)</div>
<div class="doc-subtitle">Kurikulum Berbasis Cinta (KBC) — Deep Learning (Mindful, Meaningful, Joyful) | Tahun Pelajaran ${d.year}</div>

<div class="section-title">IDENTITAS PESERTA DIDIK & KELOMPOK</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Nama Kelompok</td><td style="width:25%;">............................................</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Kelas / Semester</td><td>${d.level} / Ganjil</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject}</td><td style="font-weight:bold; background-color:#f1f5f9;">Hari / Tanggal</td><td>............................................</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Nama Anggota</td><td colspan="3">1. .................................................... 2. .................................................... 3. .................................................... 4. ....................................................</td></tr>
</table>

<div class="section-title">PETUNJUK PENGERJAAN PENUH CINTA</div>
<p style="font-size:10pt; line-height:1.6; margin-bottom:14px;">
  1. Awali pengerjaan tugas dengan membaca Basmalah dan berdoa bersama kelompok (<em>Ta'addub</em>).<br>
  2. Bekerjasamalah secara rukun, saling menghargai pendapat, dan dengarkan setiap rekan (<em>Syūrā</em>).<br>
  3. Manfaatkan buku sumber, modul KBC, dan lingkungan sekitar sebagai referensi ilmiah.<br>
  4. Tulislah hasil analisis dengan teliti, rapi, dan bertanggung jawab (<em>I'tidāl</em>).
</p>

<div class="section-title">AKTIVITAS I: EKSPLORASI SINTAK ${d.learningModel.toUpperCase()}</div>
<p><strong>A. Stimulasi & Pengamatan Masalah Kontekstual</strong></p>
<div style="border:1px solid #cbd5e1; padding:12px; border-radius:6px; background-color:#f8fafc; margin-bottom:12px; font-size:10pt;">
  <em>Kasus Reflektif:</em> Perhatikan interaksi masyarakat di sekitar ${d.topikLokal}. Bagaimana nilai kasih sayang Illahi tercermin dalam kearifan lokal menjaga keharmonisan alam dan sesama manusia? Uraikan tanggapan kelompokmu!
</div>
<div style="border:1px dashed #94a3b8; height:90px; border-radius:4px; margin-bottom:16px; padding:8px; font-size:9pt; color:#94a3b8;">
  (Tuliskan hasil pengamatan awal kelompok di sini...)
</div>

<p><strong>B. Pengumpulan Data & Studi Analisis Kelompok</strong></p>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:32%;">Aspek Pertanyaan Analitis</th>
      <th>Hasil Diskusi & Temuan Solusi Kelompok</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">1</td>
      <td>Bagaimana dalil naqli/aqli memperkuat konsep kasih sayang dalam materi ${d.subject}?</td>
      <td style="height:55px;"></td>
    </tr>
    <tr>
      <td style="text-align:center;">2</td>
      <td>Contoh konkret sikap <em>Tasāmuh</em> (toleransi) yang dapat diterapkan siswa madrasah:</td>
      <td style="height:55px;"></td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td>Rencana aksi nyata pelestarian lingkungan lokal yang bernilai ibadah:</td>
      <td style="height:55px;"></td>
    </tr>
  </tbody>
</table>

<div class="section-title">AKTIVITAS II: LEMBAR PENILAIAN SAHABAT (SYŪRĀ)</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th>Pernyataan Sikap Kolaboratif Sahabat</th>
      <th style="width:18%;">Sangat Baik</th>
      <th style="width:18%;">Baik</th>
      <th style="width:18%;">Perlu Bimbingan</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align:center;">1</td><td>Aktif memberikan ide dan mendengarkan rekan secara santun</td><td></td><td></td><td></td></tr>
    <tr><td style="text-align:center;">2</td><td>Bertanggung jawab menyelesaikan bagian tugas tepat waktu</td><td></td><td></td><td></td></tr>
    <tr><td style="text-align:center;">3</td><td>Menunjukkan sikap saling tolong-menolong tanpa membeda-bedakan</td><td></td><td></td><td></td></tr>
  </tbody>
</table>

${ttd}
`;
  }

  if (docType === "rubrik") {
    return `
${COMMON_CSS}
<style>@media print { @page { size: A4 landscape; margin: 1.0cm; } }</style>
${kop}
<div class="doc-title">RUBRIK ASESMEN FORMATIF & SUMATIF KURIKULUM BERBASIS CINTA</div>
<div class="doc-subtitle">Penilaian Otentik Terpadu (Karakter PPRA, Kognitif & Unjuk Kerja) | Tahun Pelajaran ${d.year}</div>

<div class="section-title">A. IDENTITAS TUJUAN PEMBELAJARAN</div>
<table class="kbc-table">
  <tr><td style="width:20%; font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td><td style="width:20%; font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Kode & Rumusan TP</td><td colspan="3">${d.kodeTp} — ${d.rumusanTp}</td></tr>
</table>

<div class="section-title">B. RUBRIK ASESMEN FORMATIF PER PERTEMUAN (SKALA 4 LEVEL)</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:12%;">Pertemuan</th>
      <th style="width:20%;">Kriteria Kinerja</th>
      <th style="width:17%;">4 - Sangat Berkembang (Qudwah)</th>
      <th style="width:17%;">3 - Berkembang Sesuai Harapan</th>
      <th style="width:17%;">2 - Mulai Berkembang</th>
      <th style="width:17%;">1 - Perlu Pendampingan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center; font-weight:bold;">Pertemuan 1</td>
      <td><strong>Pemahaman Konsep & Dalil:</strong> Mampu menganalisis ayat/hadis dan intisari materi.</td>
      <td>Analisis sangat mendalam, argumentatif, dan menjadi teladan (Qudwah) keilmuan.</td>
      <td>Mampu menganalisis dengan runtut dan benar sesuai tujuan pembelajaran.</td>
      <td>Mampu menyebutkan konsep dasar namun butuh sedikit bantuan dalam uraian dalil.</td>
      <td>Baru mengenali topik awal dan perlu bimbingan penuh kasih sayang dari guru.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">Pertemuan 2</td>
      <td><strong>Diskusi Kelompok & Sikap Syūrā:</strong> Keterampilan bertukar gagasan secara santun.</td>
      <td>Sangat santun, memfasilitasi rekan yang pasif, dan menjunjung musyawarah mufakat.</td>
      <td>Aktif berkontribusi positif dan mendengarkan masukan teman dengan baik.</td>
      <td>Ikut serta dalam kelompok namun sesekali kurang fokus pada kesepakatan.</td>
      <td>Pasif saat diskusi dan memerlukan motivasi personal yang ramah dari guru.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">Pertemuan 3</td>
      <td><strong>Aksi Nyata & Kearifan Lokal:</strong> Mengaitkan materi dengan ${d.topikLokal}.</td>
      <td>Mampu merumuskan solusi orisinil dan siap memimpin gerakan kebaikan di kelas.</td>
      <td>Mampu menghubungkan teori materi dengan realitas lingkungan secara tepat.</td>
      <td>Memahami contoh lokal namun belum mampu memformulasikan solusi mandiri.</td>
      <td>Belum mengaitkan materi dengan lingkungan dan perlu diberikan panduan konkret.</td>
    </tr>
  </tbody>
</table>

<div class="section-title">C. RUBRIK ASESMEN SUMATIF KOMPREHENSIF (BOBOT 100%)</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:8%;">No</th>
      <th style="width:28%;">Komponen Penilaian Sumatif</th>
      <th>Teknik & Deskripsi Tugas</th>
      <th style="width:15%;">Bobot (%)</th>
      <th style="width:15%;">Ambang KKTP</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align:center;">1</td><td><strong>Penguasaan Konsep (Kognitif)</strong></td><td>Tes tertulis soal HOTS integrasi Asmaul Husna & studi kasus kontekstual.</td><td style="text-align:center;">40%</td><td style="text-align:center;">70</td></tr>
    <tr><td style="text-align:center;">2</td><td><strong>Unjuk Kerja / Proyek KBC</strong></td><td>Laporan karya kelompok pelestarian kearifan lokal & etika kasih sayang.</td><td style="text-align:center;">40%</td><td style="text-align:center;">70</td></tr>
    <tr><td style="text-align:center;">3</td><td><strong>Observasi Karakter PPRA</strong></td><td>Jurnal sikap spiritual, kedisiplinan, adab (Ta'addub) dan kepedulian sosial.</td><td style="text-align:center;">20%</td><td style="text-align:center;">70</td></tr>
    <tr style="background-color:#e2e8f0; font-weight:bold;"><td colspan="3" style="text-align:right;">TOTAL BOBOT ASESMEN SUMATIF</td><td style="text-align:center; color:#1a3a5c;">100%</td><td style="text-align:center;">Layak</td></tr>
  </tbody>
</table>

${ttd}
`;
  }

  // Default: Modul Ajar Deep Learning KBC
  const pertemuanCount = Number(d.jumlahPertemuan) || 3;
  const jp = Number(d.jpPerPertemuan) || 2;
  const totalMenit = jp * 45;

  let pertemuanHtml = "";
  for (let i = 1; i <= pertemuanCount; i++) {
    pertemuanHtml += `
<div style="background-color:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:12px; margin-bottom:16px;">
  <h4 style="margin:0 0 8px; color:#1a3a5c; font-size:11.5pt;">Pertemuan ${i}: Eksplorasi Sintak Model ${d.learningModel} (${jp} JP / ${totalMenit} Menit)</h4>
  <p style="font-size:10pt; margin:0 0 8px;"><strong>Tujuan Pertemuan:</strong> Peserta didik mampu menganalisis tahapan materi ${i}, mengeksplorasi konsep esensial, dan menumbuhkan karakter Qudwah serta Ta'addub.</p>
  
  <table class="kbc-table" style="font-size:10pt; margin-bottom:8px;">
    <thead>
      <tr>
        <th style="width:20%;">Tahapan Belajar</th>
        <th style="width:40%;">Aktivitas Pendidik (Guru)</th>
        <th>Aktivitas Peserta Didik (Murid)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pembuka (15 Menit)</strong><br><span class="highlight-badge">Mindful Learning</span></td>
        <td>1. Membuka kelas dengan salam santun dan tadarus bersama (PC: Cinta Allah | PPRA: Ta'addub).<br>2. Menyapa kabar siswa dan asesmen diagnostik singkat.<br>3. Menyampaikan tujuan dan apersepsi kontekstual.</td>
        <td>1. Merespons salam, berdoa dengan khusyuk, dan mempersiapkan perangkat belajar.<br>2. Menyimak pemantik guru dengan rasa ingin tahu tinggi.</td>
      </tr>
      <tr>
        <td><strong>Inti Sintak ${i} (${totalMenit - 30} Menit)</strong><br><span class="highlight-badge">Meaningful & Joyful</span></td>
        <td>1. Mengarahkan peserta didik membentuk kelompok diskusi (PPRA: Syūrā).<br>2. Memberikan lembar kerja kasus ${d.topikLokal}.<br>3. Mendampingi kelompok dengan bimbingan diferensiasi.<br>4. Memfasilitasi presentasi interaktif dan apresiasi.</td>
        <td>1. Duduk bersama kelompok dan membagi peran tugas (PPRA: Musāwah).<br>2. Mengkaji referensi dan mendiskusikan pemecahan masalah.<br>3. Mempresentasikan hasil temuan di depan kelas dengan percaya diri.</td>
      </tr>
      <tr>
        <td><strong>Penutup (15 Menit)</strong><br><span class="highlight-badge">Reflektif Berkelanjutan</span></td>
        <td>1. Bersama murid merumuskan simpulan esensial.<br>2. Memberikan umpan balik positif penuh kasih sayang.<br>3. Doa penutup dan salam keteladanan.</td>
        <td>1. Melakukan refleksi mandiri atas pembelajaran hari ini.<br>2. Mencatat penugasan lanjutan dan berdoa bersama.</td>
      </tr>
    </tbody>
  </table>
</div>
`;
  }

  if (docType === "sekolah_format1_iso") {
    return buildAthirahIso015FallbackDocument(d);
  }

  return `
${COMMON_CSS}
${kop}
<div class="doc-title">MODUL AJAR DEEP LEARNING — KURIKULUM BERBASIS CINTA (KBC)</div>
<div class="doc-subtitle">Terintegrasi Panca Cinta Kemenag, 10 Nilai PPRA & Pendekatan Mindful, Meaningful, Joyful Learning | Tahun Pelajaran ${d.year}</div>

<div class="section-title">BAGIAN I. INFORMASI UMUM</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Nama Penyusun</td><td>${d.teacher} (NIP: ${d.nipTeacher})</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Satuan Pendidikan</td><td>${d.schoolName}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject} (${d.singkatanMapel})</td><td style="font-weight:bold; background-color:#f1f5f9;">Fase / Kelas</td><td>${d.level}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Elemen CP</td><td>${d.elemenCp}</td><td style="font-weight:bold; background-color:#f1f5f9;">Alokasi Waktu</td><td>${pertemuanCount} Pertemuan x ${jp} JP (${pertemuanCount * jp} JP)</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Model Pembelajaran</td><td>${d.learningModel} (Sintak: ${d.sintakModel})</td><td style="font-weight:bold; background-color:#f1f5f9;">Tahun Ajaran</td><td>${d.year}</td></tr>
</table>

<div class="section-title">BAGIAN II. KOMPONEN INTI & TUJUAN PEMBELAJARAN</div>
<div style="background-color:#eff6ff; border-left:4px solid #1a3a5c; padding:10px 14px; margin-bottom:14px;">
  <strong>Rumusan Tujuan Pembelajaran (${d.kodeTp}):</strong><br>
  ${d.rumusanTp}
</div>

<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Pemahaman Bermakna</td><td>Setiap ilmu dan keteraturan ciptaan Illahi mengalirkan rasa cinta, kepedulian terhadap sesama, dan tanggung jawab memelihara alam sekitar (${d.topikLokal}).</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Pertanyaan Pemantik</td><td>1. Mengapa pemahaman Asmaul Husna dapat mendamaikan hati dan mengubah perilaku kita?<br>2. Bagaimana kita mewujudkan kasih sayang Tuhan dalam menjaga lingkungan madrasah kita?</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Profil Pelajar Rahmatan lil 'Alamin</td><td><em>Ta'addub</em> (Berkeadaban), <em>Qudwah</em> (Keteladanan), <em>Tawāzun</em> (Keseimbangan), dan <em>Syūrā</em> (Musyawarah).</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Sarana & Media Belajar</td><td>Buku Teks Resmi Kemenag, Modul KBC, LCD/Proyektor, Lembar Kerja Siswa, dan Lingkungan Sekitar Madrasah.</td></tr>
</table>

<div class="section-title">BAGIAN III. SKENARIO PENGALAMAN BELAJAR PER PERTEMUAN</div>
${pertemuanHtml}

<div class="section-title">BAGIAN IV. ASESMEN & EVALUASI PEMBELAJARAN</div>
<table class="kbc-table">
  <thead>
    <tr>
      <th style="width:20%;">Jenis Asesmen</th>
      <th style="width:25%;">Teknik Penilaian</th>
      <th style="width:30%;">Bentuk Instrumen</th>
      <th>Kriteria Ketuntasan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Asesmen Diagnostik</strong></td>
      <td>Tanya jawab lisan & kuis apersepsi</td>
      <td>Daftar pertanyaan refleksi kesiapan</td>
      <td>Mengetahui profil & suasana hati murid</td>
    </tr>
    <tr>
      <td><strong>Asesmen Formatif</strong></td>
      <td>Observasi diskusi & lembar LKPD</td>
      <td>Rubrik unjuk kerja 4 level ketercapaian</td>
      <td>Capaian proses skor minimal 70 (Layak)</td>
    </tr>
    <tr>
      <td><strong>Asesmen Sumatif</strong></td>
      <td>Tes tulis uraian & penugasan proyek</td>
      <td>Soal HOTS berbasis studi kasus kearifan lokal</td>
      <td>Ketuntasan indikator TP secara komprehensif</td>
    </tr>
  </tbody>
</table>

<div class="section-title">BAGIAN V. PENGAYAAN, REMEDIAL & REFLEKSI</div>
<table class="kbc-table">
  <tr>
    <td style="width:50%; vertical-align:top;">
      <strong>Program Remedial:</strong><br>
      Bimbingan konsep ulang secara personal atau tutor sebaya penuh kesabaran bagi siswa yang belum mencapai ambang KKTP.
    </td>
    <td style="vertical-align:top;">
      <strong>Program Pengayaan:</strong><br>
      Pemberian tugas literasi tingkat lanjut untuk menelaah jurnal atau artikel mengenai kearifan lokal Kerinci dalam perspektif moderasi beragama.
    </td>
  </tr>
</table>

${ttd}
`;
}

/**
 * Fallback generator for Modul Ajar Format 1 Athirah (100% KOP ISO 015 & 14 Baris Terkunci).
 * Sesuai template resmi di D:\project perangkat ajar\2\gas-app.
 */
export function buildAthirahIso015FallbackDocument(d: any = {}): string {
  const pertemuanCount = Math.max(1, Math.min(8, Number(d.jumlahPertemuan) || 2));
  const jp = Number(d.jpPerPertemuan) || 2;
  const docNumberIso = d.docNumberIso || "015/F/KUR/00/IX/2025";
  const docNumberIso017 = "017/F/KUR/00/IX/2025";
  const schoolName = d.schoolName || "SEKOLAH ISLAM ATHIRAH";
  const topic = d.topikLokal || d.topik || "Materi Pokok Pembelajaran";
  const model = d.learningModel || "Problem Based Learning (PBL)";
  const tp = d.rumusanTp || "Peserta didik dapat memahami dan menerapkan konsep materi secara kritis, mandiri, dan bermakna.";
  const kepemimpinan = d.kepemimpinan || "Kalla Core Values & Kepemimpinan Athirah: Ikhlas, Cepat, Cerdas, Keras";
  const spiritualisasi = d.spiritualisasi || `Kajian tadabbur ayat Al-Qur'an dan keteraturan ciptaan Allah SWT dalam materi ${topic} (QS. Yunus: 101).`;

  let meetingsHtml = "";
  for (let i = 1; i <= pertemuanCount; i++) {
    meetingsHtml += `
      <div style="margin-top: 10px; border-top: 1px dashed #94a3b8; padding-top: 8px;">
        <strong style="color: #064e3b; font-size: 9.5pt;">Pertemuan ${i}: ${topic} Sub-bagian ${i} (${jp} JP)</strong>
        <div style="margin: 4px 0 2px 0;"><strong>A. Kegiatan Pendahuluan (15 Menit):</strong></div>
        <ul style="margin: 2px 0 6px 18px; padding: 0; font-size: 9pt;">
          <li>Guru membuka kelas dengan salam Islami, menyapa peserta didik, dan memimpin doa bersama.</li>
          <li>Apersepsi kontekstual menghubungkan materi pertemuan sebelumnya dengan fenomena nyata topik <em>${topic}</em>.</li>
          <li>Menyampaikan tujuan pembelajaran, skenario aktivitas, dan kriteria asesmen yang dinilai.</li>
        </ul>

        <div style="margin: 4px 0 2px 0;"><strong>B. Kegiatan Inti (Deep Learning - ${jp * 45 - 30} Menit):</strong></div>
        <div style="margin-left: 6px;">
          <div style="background-color: #eff6ff; border-left: 3px solid #3b82f6; padding: 4px 8px; margin-bottom: 4px; border-radius: 4px;">
            <strong style="color: #1e40af; font-size: 8.5pt;">🔵 Mindful Learning (Berkesadaran / Memahami):</strong>
            <ul style="margin: 2px 0 2px 16px; padding: 0; font-size: 8.5pt;">
              <li>Peserta didik mengamati tayangan stimulus atau studi kasus konkret mengenai <em>${topic}</em> dengan penuh konsentrasi.</li>
              <li>Guru memfasilitasi tanya jawab pemantik untuk mengasah nalar kritis dan membangun kesadaran konsep awal.</li>
            </ul>
          </div>

          <div style="background-color: #f0fdf4; border-left: 3px solid #10b981; padding: 4px 8px; margin-bottom: 4px; border-radius: 4px;">
            <strong style="color: #166534; font-size: 8.5pt;">🟢 Meaningful Learning (Bermakna / Mengaplikasi):</strong>
            <ul style="margin: 2px 0 2px 16px; padding: 0; font-size: 8.5pt;">
              <li>Peserta didik berkelompok secara kolaboratif mendiskusikan lembar eksplorasi LKPD yang mengaitkan materi dengan solusi nyata di lingkungan sekitar.</li>
              <li>Guru melakukan pendampingan diferensiasi (scaffolding bagi yang butuh bantuan, pengayaan bagi yang cepat memahami).</li>
            </ul>
          </div>

          <div style="background-color: #fff7ed; border-left: 3px solid #f97316; padding: 4px 8px; margin-bottom: 4px; border-radius: 4px;">
            <strong style="color: #9a3412; font-size: 8.5pt;">🟠 Joyful Learning (Menggembirakan / Merefleksi):</strong>
            <ul style="margin: 2px 0 2px 16px; padding: 0; font-size: 8.5pt;">
              <li>Kelompok mempresentasikan hasil karya / temuan menggunakan metode <em>Gallery Walk</em> atau kuis interaktif yang menggembirakan.</li>
              <li>Peserta didik saling memberikan apresiasi dan tanggapan membangun atas karya rekan sejawat.</li>
            </ul>
          </div>
        </div>

        <div style="margin: 4px 0 2px 0;"><strong>C. Kegiatan Penutup (15 Menit):</strong></div>
        <ul style="margin: 2px 0 6px 18px; padding: 0; font-size: 9pt;">
          <li>Peserta didik bersama guru merangkum kesimpulan esensial dari pembelajaran.</li>
          <li>Refleksi metakognitif singkat: apa yang paling bermakna hari ini dan apa yang masih perlu diperbaiki.</li>
          <li>Guru memberikan motivasi penguatan karakter kepemimpinan dan menutup majelis dengan doa kafaratul majelis.</li>
        </ul>
      </div>
    `;
  }

  let lampiran017Html = "";
  if (d.sertakanLampiran017 !== false || d.sertakanLkpd !== false) {
    lampiran017Html = `
      <div style="page-break-before: always; margin-top: 30px;">
        <!-- KOP ISO 017 -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 12px; font-family: Arial, sans-serif;">
          <tr>
            <td rowspan="5" style="width: 90px; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px;">
              <div style="font-size: 22px;">🌿</div>
              <div style="font-size: 7.5pt; font-weight: bold; color: #064e3b;">ATHIRAH</div>
            </td>
            <td colspan="4" style="text-align: center; font-size: 11pt; font-weight: bold; border: 1px solid #000000; padding: 4px;">
              ${schoolName.toUpperCase()}
            </td>
            <td rowspan="5" style="width: 90px; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; background-color: #f0fdf4;">
              <div style="font-size: 8pt; font-weight: bold; color: #064e3b; text-align: center;">
                ISO 9001<br>MUTU
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: center; font-size: 10pt; font-weight: bold; border: 1px solid #000000; padding: 4px;">
              FORMULIR - LAMPIRAN ASESMEN DALAM RPP/MA
            </td>
          </tr>
          <tr>
            <td style="width: 100px; font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">No. Dokumen</td>
            <td style="width: 170px; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">${docNumberIso017}</td>
            <td style="width: 70px; font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">Tgl. Terbit</td>
            <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">17/09/2025</td>
          </tr>
          <tr>
            <td style="font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">No. Revisi</td>
            <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">00</td>
            <td style="font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">Halaman</td>
            <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">1 dari 2</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 10px 0 12px;">
          <h4 style="font-size: 11pt; font-weight: bold; color: #064e3b; margin: 0; text-transform: uppercase;">MATRIKS KISI-KISI & INSTRUMEN ASESMEN</h4>
          <p style="font-size: 8.5pt; color: #374151; margin: 2px 0;">Mata Pelajaran: ${d.subject || 'Mata Pelajaran'} • Topik: ${topic} • Fase/Kelas: ${d.level || 'Fase D'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-family: Arial, sans-serif; font-size: 8.5pt; margin-bottom: 14px;">
          <thead>
            <tr style="background-color: #064e3b; color: #ffffff;">
              <th style="border: 1px solid #000000; padding: 5px; width: 110px;">Materi</th>
              <th style="border: 1px solid #000000; padding: 5px; width: 140px;">Tujuan Pembelajaran</th>
              <th style="border: 1px solid #000000; padding: 5px; width: 140px;">Indikator Asesmen (Soal)</th>
              <th style="border: 1px solid #000000; padding: 5px; width: 75px;">Jenis Asesmen</th>
              <th style="border: 1px solid #000000; padding: 5px;">Uraian Soal Tertulis</th>
              <th style="border: 1px solid #000000; padding: 5px;">Deskripsi Aktivitas Non-tertulis</th>
              <th style="border: 1px solid #000000; padding: 5px; width: 45px; text-align: center;">LKPD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #000000; padding: 5px; font-weight: bold;">${topic}</td>
              <td style="border: 1px solid #000000; padding: 5px;">${tp}</td>
              <td style="border: 1px solid #000000; padding: 5px;">Peserta didik mampu mengidentifikasi dan menganalisis konsep dasar materi dalam pemecahan masalah.</td>
              <td style="border: 1px solid #000000; padding: 5px; text-align: center;">Formatif</td>
              <td style="border: 1px solid #000000; padding: 5px;">Jelaskan keterkaitan konsep ${topic} dengan fenomena kontekstual di lingkungan sekitar dan berikan contoh konkretnya!</td>
              <td style="border: 1px solid #000000; padding: 5px;">Observasi unjuk kerja saat diskusi kelompok dan presentasi gagasan solusi di depan kelas.</td>
              <td style="border: 1px solid #000000; padding: 5px; text-align: center; font-weight: bold; color: #064e3b;">✓ Ada</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 5px; font-weight: bold;">Aplikasi Konsep</td>
              <td style="border: 1px solid #000000; padding: 5px;">Menerapkan solusi kontekstual berbasis pemikiran kritis dan terpadu.</td>
              <td style="border: 1px solid #000000; padding: 5px;">Peserta didik mampu menyusun kesimpulan dan rekomendasi perbaikan berbasis data.</td>
              <td style="border: 1px solid #000000; padding: 5px; text-align: center;">Sumatif</td>
              <td style="border: 1px solid #000000; padding: 5px;">Analisis sebuah studi kasus kompleks terkait materi, lalu rumuskan strategi pemecahannya secara runtut dan sistematis!</td>
              <td style="border: 1px solid #000000; padding: 5px;">Penilaian portofolio laporan kerja kelompok dan refleksi metakognitif tertulis.</td>
              <td style="border: 1px solid #000000; padding: 5px; text-align: center; font-weight: bold; color: #064e3b;">✓ Ada</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <style>
      .iso-kop-table { width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 12px; font-family: Arial, sans-serif; }
      .iso-kop-table td { border: 1px solid #000000; padding: 4px 6px; font-size: 8pt; vertical-align: middle; }
      .table-format1-athirah { width: 100%; border-collapse: collapse; border: 1px solid #000000; font-family: Arial, sans-serif; font-size: 9pt; margin-bottom: 14px; }
      .table-format1-athirah th, .table-format1-athirah td { border: 1px solid #000000; padding: 5px 7px; vertical-align: top; line-height: 1.25; }
      .table-format1-athirah th { background-color: #064e3b; color: #ffffff; font-weight: bold; text-align: center; }
    </style>

    <!-- KOP FORMULIR ISO RESMI ATHIRAH (TERKUNCI 100%) -->
    <table class="iso-kop-table">
      <tr>
        <td rowspan="5" style="width: 90px; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px;">
          <div style="font-size: 22px;">🌿</div>
          <div style="font-size: 7.5pt; font-weight: bold; color: #064e3b;">ATHIRAH</div>
        </td>
        <td colspan="4" style="text-align: center; font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; border: 1px solid #000000; padding: 4px;">
          ${schoolName.toUpperCase()}
        </td>
        <td rowspan="5" style="width: 90px; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; background-color: #f0fdf4;">
          <div style="font-size: 8pt; font-weight: bold; color: #064e3b; text-align: center; line-height: 1.2;">
            ISO 9001<br><span style="letter-spacing: 1px;">MUTU</span>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="4" style="text-align: center; font-size: 10pt; font-weight: bold; border: 1px solid #000000; padding: 4px;">
          FORMULIR - MODUL AJAR
        </td>
      </tr>
      <tr>
        <td style="width: 100px; font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">No. Dokumen</td>
        <td style="width: 170px; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">${docNumberIso}</td>
        <td style="width: 70px; font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">Tgl. Terbit</td>
        <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">17/09/2025</td>
      </tr>
      <tr>
        <td style="font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">No. Revisi</td>
        <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">00</td>
        <td style="font-weight: 600; font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">Halaman</td>
        <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">1 dari ${pertemuanCount >= 3 ? '4' : '3'}</td>
      </tr>
    </table>

    <!-- TABEL IDENTITAS MODUL -->
    <table class="table-format1-athirah" style="margin-bottom: 12px;">
      <tr>
        <td style="width: 180px; font-weight: bold; background-color: #f9fafb;">Satuan Pendidikan</td>
        <td>${schoolName}</td>
        <td style="width: 140px; font-weight: bold; background-color: #f9fafb;">Mata Pelajaran</td>
        <td>${d.subject || 'Mata Pelajaran'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background-color: #f9fafb;">Fase / Kelas</td>
        <td>${d.level || 'Fase D / Kelas VII'}</td>
        <td style="font-weight: bold; background-color: #f9fafb;">Tahun Pelajaran</td>
        <td>${d.year || '2026/2027'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background-color: #f9fafb;">Topik / Materi Pokok</td>
        <td><strong>${topic}</strong></td>
        <td style="font-weight: bold; background-color: #f9fafb;">Alokasi Waktu</td>
        <td><strong>${pertemuanCount * jp} JP</strong> (${pertemuanCount} Pertemuan)</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background-color: #f9fafb;">Target Tujuan Pembelajaran (TP)</td>
        <td colspan="3" style="font-size: 8.5pt; color: #1f2937;">${tp}</td>
      </tr>
    </table>

    <!-- TABEL MODUL AJAR FORMAT 1 ATHIRAH (14 BARIS TERKUNCI) -->
    <table class="table-format1-athirah">
      <thead>
        <tr>
          <th style="width: 40px;">No</th>
          <th colspan="2" style="width: 220px;">Komponen Modul Ajar</th>
          <th>Uraian / Deskripsi Operasional</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; font-weight: bold;">1</td>
          <td colspan="2"><strong>Model Pembelajaran</strong></td>
          <td>${model} terintegrasi pendekatan <em>Deep Learning</em></td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">2</td>
          <td colspan="2"><strong>Dimensi Profil Lulusan (Kurikulum Merdeka)</strong></td>
          <td>Bernalar Kritis, Bergotong Royong, Mandiri, dan Beriman & Bertakwa kepada Tuhan YME</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">3</td>
          <td colspan="2"><strong>Spiritualisasi Islam</strong></td>
          <td>${spiritualisasi}</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;" rowspan="4">4</td>
          <td rowspan="4" style="width: 100px;"><strong>Desain Pembelajaran</strong></td>
          <td style="width: 120px;">Kepemimpinan</td>
          <td>${kepemimpinan}</td>
        </tr>
        <tr>
          <td>Media & Alat</td>
          <td>Slide presentasi interaktif, video fenomena nyata, lembar kerja eksplorasi, LCD Proyektor, Chromebook/Laptop</td>
        </tr>
        <tr>
          <td>Sarana & Prasarana</td>
          <td>Ruang kelas multimedia, jaringan internet kecepatan tinggi, buku teks referensi perpustakaan</td>
        </tr>
        <tr>
          <td>Pemahaman Bermakna & Pemantik</td>
          <td>
            <strong>Pemahaman Bermakna:</strong> Peserta didik menyadari bahwa konsep <em>${topic}</em> memiliki keterkaitan langsung dengan pemecahan persoalan di kehidupan nyata secara berkeadaban.<br>
            <strong>Pertanyaan Pemantik:</strong> 1. Mengapa materi ini penting kita pelajari bersama? 2. Bagaimana kita dapat mengaplikasikan pemahaman ini untuk memberi manfaat bagi masyarakat?
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">5</td>
          <td colspan="2"><strong>Diferensiasi Pembelajaran</strong></td>
          <td>Diferensiasi konten dan proses berdasarkan pemetaan kesiapan belajar murid (bimbingan terfokus, penugasan reguler mandiri, dan pengayaan eksplorasi tingkat lanjut)</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">6</td>
          <td colspan="2"><strong>Pengalaman Belajar (Pertemuan 1..${pertemuanCount})</strong></td>
          <td>${meetingsHtml}</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;" rowspan="3">7</td>
          <td rowspan="3"><strong>Asesmen Pembelajaran</strong></td>
          <td>Asesmen Awal</td>
          <td>
            Kuis apersepsi diagnostik & tanya jawab reflektif
            <span style="float: right; font-weight: bold; color: #064e3b;">MH: 85-100 | MA: 70-84 | MR: &lt;70</span>
          </td>
        </tr>
        <tr>
          <td>Asesmen Formatif</td>
          <td>
            Observasi keaktifan diskusi, lembar LKPD, dan penilaian antar rekan
            <span style="float: right; font-weight: bold; color: #064e3b;">MH: 85-100 | MA: 70-84 | MR: &lt;70</span>
          </td>
        </tr>
        <tr>
          <td>Asesmen Sumatif</td>
          <td>
            Tes tertulis evaluasi capaian akhir topik dan presentasi unjuk kerja
            <span style="float: right; font-weight: bold; color: #064e3b;">MH: 85-100 | MA: 70-84 | MR: &lt;70</span>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">8</td>
          <td colspan="2"><strong>Remedial & Pengayaan</strong></td>
          <td>
            <strong>Remedial:</strong> Pembimbingan ulang konsep esensial secara terfokus atau melalui tutor sebaya bagi siswa yang belum tuntas.<br>
            <strong>Pengayaan:</strong> Pemberian tugas eksploratif studi kasus kompleks dan pengaitan multidisiplin ilmu bagi siswa yang telah mencapai ketuntasan prima.
          </td>
        </tr>
      </tbody>
    </table>

    <!-- LEMBAR PENGESAHAN TANDA TANGAN SEJAJAR -->
    <table style="width: 100%; border: none; margin-top: 30px; font-family: Arial, sans-serif; font-size: 9pt; page-break-inside: avoid;">
      <tr>
        <td style="border: none; text-align: center; width: 50%; vertical-align: top;">
          Mengetahui,<br>
          <strong>Kepala Satuan Pendidikan</strong><br><br><br><br><br>
          <strong><u>${d.principal || 'Kepala Satuan Pendidikan, M.Pd.'}</u></strong><br>
          NIP. ${d.nipPrincipal || '-'}
        </td>
        <td style="border: none; text-align: center; width: 50%; vertical-align: top;">
          ${d.cityDate || 'Makassar, 14 Juli 2026'}<br>
          <strong>Guru Mata Pelajaran</strong><br><br><br><br><br>
          <strong><u>${d.teacher || 'Guru Pengampu, S.Pd.'}</u></strong><br>
          NIP. ${d.nipTeacher || '-'}
        </td>
      </tr>
    </table>

    ${lampiran017Html}
  `;
}

