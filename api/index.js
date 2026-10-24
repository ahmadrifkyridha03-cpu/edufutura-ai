// server.ts
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// serverKbcBuilder.ts
var COMMON_CSS = `
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
function renderKop(data) {
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
function renderSignatures(data) {
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
function buildKbcFallbackDocument(docType, formData = {}) {
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
    const rmeGanjil = rme.ganjil && rme.ganjil.length ? rme.ganjil : [
      { month: "Juli", totalWeeks: 4, nonEffective: 2, effective: 2, note: "MPLS & Pengenalan Lingkungan Belajar (2 Pekan)" },
      { month: "Agustus", totalWeeks: 5, nonEffective: 0, effective: 5, note: "Pekan Efektif Penuh (Peringatan HUT RI)" },
      { month: "September", totalWeeks: 4, nonEffective: 1, effective: 3, note: "Penilaian Sumatif Tengah Semester (PTS/STS) Ganjil (1 Pekan)" },
      { month: "Oktober", totalWeeks: 5, nonEffective: 0, effective: 5, note: "Pekan Efektif Penuh" },
      { month: "November", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
      { month: "Desember", totalWeeks: 4, nonEffective: 3, effective: 1, note: "Sumatif Akhir Semester (SAS), Pembagian Rapor & Libur Semester 1 (3 Pekan)" }
    ];
    const rmeGenap = rme.genap && rme.genap.length ? rme.genap : [
      { month: "Januari", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
      { month: "Februari", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
      { month: "Maret", totalWeeks: 5, nonEffective: 2, effective: 3, note: "Libur Awal Ramadhan & PTS/STS Genap (2 Pekan)" },
      { month: "April", totalWeeks: 4, nonEffective: 2, effective: 2, note: "Libur Hari Raya Idul Fitri & Ujian Akhir Jenjang (2 Pekan)" },
      { month: "Mei", totalWeeks: 5, nonEffective: 1, effective: 4, note: "Sumatif Akhir Tahun (SAT) Genap (1 Pekan)" },
      { month: "Juni", totalWeeks: 4, nonEffective: 3, effective: 1, note: "Pengolahan Rapor, Wisuda & Libur Kenaikan Kelas (3 Pekan)" }
    ];
    const agendaList = rme.agenda && rme.agenda.length ? rme.agenda : [
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
    let rowsGanjil = rmeGanjil.map((r, idx) => {
      totG1Weeks += Number(r.totalWeeks || 0);
      totG1Non += Number(r.nonEffective || 0);
      totG1Eff += Number(r.effective || 0);
      return `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${r.month}</strong></td>
        <td style="text-align:center;">${r.totalWeeks}</td>
        <td style="text-align:center;">${r.nonEffective}</td>
        <td style="text-align:center; font-weight:bold; color:#1a3a5c;">${r.effective}</td>
        <td>${r.note || "-"}</td>
      </tr>`;
    }).join("");
    let rowsGenap = rmeGenap.map((r, idx) => {
      totG2Weeks += Number(r.totalWeeks || 0);
      totG2Non += Number(r.nonEffective || 0);
      totG2Eff += Number(r.effective || 0);
      return `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${r.month}</strong></td>
        <td style="text-align:center;">${r.totalWeeks}</td>
        <td style="text-align:center;">${r.nonEffective}</td>
        <td style="text-align:center; font-weight:bold; color:#1a3a5c;">${r.effective}</td>
        <td>${r.note || "-"}</td>
      </tr>`;
    }).join("");
    const totEffYear = totG1Eff + totG2Eff;
    const totJpYear = totEffYear * jpNum;
    const jpIntra = Math.round(totJpYear * 0.75);
    const jpP5 = totJpYear - jpIntra;
    let rowsAgenda = agendaList.map((a, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${a.kegiatan}</strong></td>
        <td style="text-align:center;">${a.waktu}</td>
        <td style="text-align:center;">${a.semester || "Ganjil"}</td>
        <td style="text-align:center;"><span style="padding:2px 8px; border-radius:4px; font-size:9pt; background-color:#e0f2fe; color:#0369a1;">${a.kategori || "Kurikuler"}</span></td>
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
  ${rme.catatanKalender || "Kalender Pendidikan berpedoman pada Keputusan Dinas Pendidikan dan Kalender Akademik Resmi Sekolah. Pelaksanaan penilaian formatif dan sumatif menyesuaikan jadwal pekan efektif di atas."}
</div>

${ttd}
`;
  }
  if (docType === "analisis_cp") {
    return `
${COMMON_CSS}
${kop}
<div class="doc-title">ANALISIS CAPAIAN PEMBELAJARAN (ACP)</div>
<div class="doc-subtitle">Kurikulum Berbasis Cinta (KBC) \u2014 Terintegrasi Panca Cinta & 10 Nilai PPRA | Tahun Pelajaran ${d.year}</div>

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
    <tr><td style="text-align:center;">3</td><td><strong>Muwa\u1E6Danah</strong></td><td>Kewarganegaraan & cinta tanah air</td><td>Menjunjung tinggi kebhinekaan NKRI dan melestarikan budaya adiluhung lokal Kerinci.</td></tr>
    <tr><td style="text-align:center;">4</td><td><strong>Tawassu\u1E6D</strong></td><td>Jalan tengah & moderasi</td><td>Menolak pemikiran ekstrem, berpikir berimbang, dan mengedepankan kearifan.</td></tr>
    <tr><td style="text-align:center;">5</td><td><strong>Taw\u0101zun</strong></td><td>Keseimbangan hidup</td><td>Menyeimbangkan kebutuhan spiritual, intelektual, fisik, dan tanggung jawab sosial.</td></tr>
    <tr><td style="text-align:center;">6</td><td><strong>I'tid\u0101l</strong></td><td>Keadilan & integritas teguh</td><td>Menegakkan hak dan kewajiban secara proporsional serta objektif dalam penilaian.</td></tr>
    <tr><td style="text-align:center;">7</td><td><strong>Mus\u0101wah</strong></td><td>Kesetaraan tanpa diskriminasi</td><td>Menghargai martabat sesama peserta didik tanpa membedakan latar belakang sosial.</td></tr>
    <tr><td style="text-align:center;">8</td><td><strong>Sy\u016Br\u0101</strong></td><td>Musyawarah mufakat</td><td>Mendahulukan diskusi demokratis dan kesepakatan dalam kerja kelompok.</td></tr>
    <tr><td style="text-align:center;">9</td><td><strong>Tas\u0101muh</strong></td><td>Toleransi & keterbukaan</td><td>Menerima perbedaan perspektif dan hidup harmonis di tengah kemajemukan.</td></tr>
    <tr><td style="text-align:center;">10</td><td><strong>Tathawwur wa Ibtik\u0101r</strong></td><td>Dinamis & Inovatif</td><td>Menciptakan karya baru, berpikir solutif, dan adaptif terhadap kemajuan sains teknologi.</td></tr>
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
      <td>Cinta kepada Ilmu, <em>Tathawwur wa Ibtik\u0101r</em> (Inovatif)</td>
      <td style="text-align:center;">6 JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td><strong>TP.${d.singkatanMapel}.ELE.10.03</strong></td>
      <td>Akhlak</td>
      <td>Peserta didik mampu mengevaluasi sikap toleransi dan adab interaksi di masyarakat majemuk serta mempraktikkan kearifan lokal secara bijaksana.</td>
      <td>Cinta kepada Sesama, <em>Tas\u0101muh</em> & <em>Muwa\u1E6Danah</em></td>
      <td style="text-align:center;">6 JP</td>
    </tr>
    <tr>
      <td style="text-align:center;">4</td>
      <td><strong>TP.${d.singkatanMapel}.ELE.10.04</strong></td>
      <td>Akhlak & Ekologi</td>
      <td>Peserta didik mampu merancang aksi nyata perlindungan lingkungan hidup dan kearifan ekologis (${d.topikLokal}) sebagai wujud syukur atas ciptaan Tuhan.</td>
      <td>Cinta Alam Semesta, <em>Taw\u0101zun</em> (Keseimbangan)</td>
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
      <td>Tathawwur wa Ibtik\u0101r</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.3</td>
      <td>TP.${d.singkatanMapel}.ELE.10.03</td>
      <td>Menerapkan adab bergaul Islami, dialog santun, dan toleransi sosial dalam lingkungan madrasah dan keluarga.</td>
      <td>Adab Pergaulan Remaja, Tas\u0101muh, & Etika Komunikasi Digital</td>
      <td style="text-align:center;">6 JP</td>
      <td>Tas\u0101muh & Sy\u016Br\u0101</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold;">1.4</td>
      <td>TP.${d.singkatanMapel}.ELE.10.04</td>
      <td>Menginisiasi gerakan peduli alam sekitar dan pelestarian kearifan lokal (${d.topikLokal}).</td>
      <td>Ekoteologi Islam, Konservasi Alam, & Tanggung Jawab Ekologis</td>
      <td style="text-align:center;">6 JP</td>
      <td>Taw\u0101zun & Muwa\u1E6Danah</td>
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
      <td>Panca Cinta Ilmu & Nilai <em>Tathawwur wa Ibtik\u0101r</em></td>
    </tr>
    <tr>
      <td>TP.${d.singkatanMapel}.ELE.10.03</td>
      <td><strong>Etika Pergaulan & Tas\u0101muh:</strong> Adab persaudaraan Islami dan moderasi sosial.</td>
      <td style="text-align:center;">12 JP</td>
      <td>Panca Cinta Sesama & Nilai <em>Tas\u0101muh</em></td>
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
      <td>Panca Cinta Alam Semesta & Nilai <em>Taw\u0101zun</em></td>
    </tr>
    <tr>
      <td>TP.${d.singkatanMapel}.ELE.10.05</td>
      <td><strong>Integritas Diri & Kebangsaan:</strong> Keadilan hukum, kejujuran diri, dan cinta NKRI.</td>
      <td style="text-align:center;">18 JP</td>
      <td>Nilai <em>Muwa\u1E6Danah</em> & <em>I'tid\u0101l</em></td>
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
      <td>Adab Pergaulan Islami & Sikap Tas\u0101muh</td>
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
<div class="doc-subtitle">Kurikulum Berbasis Cinta (KBC) \u2014 Rubrik Deskriptor Progresif Kemenag | Tahun Pelajaran ${d.year}</div>

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
      <td style="background-color:#dcfce7;"><strong>Level 2: Layak (\u2713 Tuntas KKTP)</strong></td>
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
      <th style="width:16%; background-color:#166534;">2 - Layak (\u2713 KKTP)</th>
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
<div class="doc-subtitle">Kurikulum Berbasis Cinta (KBC) \u2014 Deep Learning (Mindful, Meaningful, Joyful) | Tahun Pelajaran ${d.year}</div>

<div class="section-title">IDENTITAS PESERTA DIDIK & KELOMPOK</div>
<table class="kbc-table">
  <tr><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Nama Kelompok</td><td style="width:25%;">............................................</td><td style="width:25%; font-weight:bold; background-color:#f1f5f9;">Kelas / Semester</td><td>${d.level} / Ganjil</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Mata Pelajaran</td><td>${d.subject}</td><td style="font-weight:bold; background-color:#f1f5f9;">Hari / Tanggal</td><td>............................................</td></tr>
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Nama Anggota</td><td colspan="3">1. .................................................... 2. .................................................... 3. .................................................... 4. ....................................................</td></tr>
</table>

<div class="section-title">PETUNJUK PENGERJAAN PENUH CINTA</div>
<p style="font-size:10pt; line-height:1.6; margin-bottom:14px;">
  1. Awali pengerjaan tugas dengan membaca Basmalah dan berdoa bersama kelompok (<em>Ta'addub</em>).<br>
  2. Bekerjasamalah secara rukun, saling menghargai pendapat, dan dengarkan setiap rekan (<em>Sy\u016Br\u0101</em>).<br>
  3. Manfaatkan buku sumber, modul KBC, dan lingkungan sekitar sebagai referensi ilmiah.<br>
  4. Tulislah hasil analisis dengan teliti, rapi, dan bertanggung jawab (<em>I'tid\u0101l</em>).
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
      <td>Contoh konkret sikap <em>Tas\u0101muh</em> (toleransi) yang dapat diterapkan siswa madrasah:</td>
      <td style="height:55px;"></td>
    </tr>
    <tr>
      <td style="text-align:center;">3</td>
      <td>Rencana aksi nyata pelestarian lingkungan lokal yang bernilai ibadah:</td>
      <td style="height:55px;"></td>
    </tr>
  </tbody>
</table>

<div class="section-title">AKTIVITAS II: LEMBAR PENILAIAN SAHABAT (SY\u016AR\u0100)</div>
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
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Kode & Rumusan TP</td><td colspan="3">${d.kodeTp} \u2014 ${d.rumusanTp}</td></tr>
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
      <td><strong>Diskusi Kelompok & Sikap Sy\u016Br\u0101:</strong> Keterampilan bertukar gagasan secara santun.</td>
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
        <td>1. Mengarahkan peserta didik membentuk kelompok diskusi (PPRA: Sy\u016Br\u0101).<br>2. Memberikan lembar kerja kasus ${d.topikLokal}.<br>3. Mendampingi kelompok dengan bimbingan diferensiasi.<br>4. Memfasilitasi presentasi interaktif dan apresiasi.</td>
        <td>1. Duduk bersama kelompok dan membagi peran tugas (PPRA: Mus\u0101wah).<br>2. Mengkaji referensi dan mendiskusikan pemecahan masalah.<br>3. Mempresentasikan hasil temuan di depan kelas dengan percaya diri.</td>
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
<div class="doc-title">MODUL AJAR DEEP LEARNING \u2014 KURIKULUM BERBASIS CINTA (KBC)</div>
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
  <tr><td style="font-weight:bold; background-color:#f1f5f9;">Profil Pelajar Rahmatan lil 'Alamin</td><td><em>Ta'addub</em> (Berkeadaban), <em>Qudwah</em> (Keteladanan), <em>Taw\u0101zun</em> (Keseimbangan), dan <em>Sy\u016Br\u0101</em> (Musyawarah).</td></tr>
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
function buildAthirahIso015FallbackDocument(d = {}) {
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
            <strong style="color: #1e40af; font-size: 8.5pt;">\u{1F535} Mindful Learning (Berkesadaran / Memahami):</strong>
            <ul style="margin: 2px 0 2px 16px; padding: 0; font-size: 8.5pt;">
              <li>Peserta didik mengamati tayangan stimulus atau studi kasus konkret mengenai <em>${topic}</em> dengan penuh konsentrasi.</li>
              <li>Guru memfasilitasi tanya jawab pemantik untuk mengasah nalar kritis dan membangun kesadaran konsep awal.</li>
            </ul>
          </div>

          <div style="background-color: #f0fdf4; border-left: 3px solid #10b981; padding: 4px 8px; margin-bottom: 4px; border-radius: 4px;">
            <strong style="color: #166534; font-size: 8.5pt;">\u{1F7E2} Meaningful Learning (Bermakna / Mengaplikasi):</strong>
            <ul style="margin: 2px 0 2px 16px; padding: 0; font-size: 8.5pt;">
              <li>Peserta didik berkelompok secara kolaboratif mendiskusikan lembar eksplorasi LKPD yang mengaitkan materi dengan solusi nyata di lingkungan sekitar.</li>
              <li>Guru melakukan pendampingan diferensiasi (scaffolding bagi yang butuh bantuan, pengayaan bagi yang cepat memahami).</li>
            </ul>
          </div>

          <div style="background-color: #fff7ed; border-left: 3px solid #f97316; padding: 4px 8px; margin-bottom: 4px; border-radius: 4px;">
            <strong style="color: #9a3412; font-size: 8.5pt;">\u{1F7E0} Joyful Learning (Menggembirakan / Merefleksi):</strong>
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
              <div style="font-size: 22px;">\u{1F33F}</div>
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
          <p style="font-size: 8.5pt; color: #374151; margin: 2px 0;">Mata Pelajaran: ${d.subject || "Mata Pelajaran"} \u2022 Topik: ${topic} \u2022 Fase/Kelas: ${d.level || "Fase D"}</p>
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
              <td style="border: 1px solid #000000; padding: 5px; text-align: center; font-weight: bold; color: #064e3b;">\u2713 Ada</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000000; padding: 5px; font-weight: bold;">Aplikasi Konsep</td>
              <td style="border: 1px solid #000000; padding: 5px;">Menerapkan solusi kontekstual berbasis pemikiran kritis dan terpadu.</td>
              <td style="border: 1px solid #000000; padding: 5px;">Peserta didik mampu menyusun kesimpulan dan rekomendasi perbaikan berbasis data.</td>
              <td style="border: 1px solid #000000; padding: 5px; text-align: center;">Sumatif</td>
              <td style="border: 1px solid #000000; padding: 5px;">Analisis sebuah studi kasus kompleks terkait materi, lalu rumuskan strategi pemecahannya secara runtut dan sistematis!</td>
              <td style="border: 1px solid #000000; padding: 5px;">Penilaian portofolio laporan kerja kelompok dan refleksi metakognitif tertulis.</td>
              <td style="border: 1px solid #000000; padding: 5px; text-align: center; font-weight: bold; color: #064e3b;">\u2713 Ada</td>
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
          <div style="font-size: 22px;">\u{1F33F}</div>
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
        <td style="font-size: 8pt; border: 1px solid #000000; padding: 3px 6px;">1 dari ${pertemuanCount >= 3 ? "4" : "3"}</td>
      </tr>
    </table>

    <!-- TABEL IDENTITAS MODUL -->
    <table class="table-format1-athirah" style="margin-bottom: 12px;">
      <tr>
        <td style="width: 180px; font-weight: bold; background-color: #f9fafb;">Satuan Pendidikan</td>
        <td>${schoolName}</td>
        <td style="width: 140px; font-weight: bold; background-color: #f9fafb;">Mata Pelajaran</td>
        <td>${d.subject || "Mata Pelajaran"}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background-color: #f9fafb;">Fase / Kelas</td>
        <td>${d.level || "Fase D / Kelas VII"}</td>
        <td style="font-weight: bold; background-color: #f9fafb;">Tahun Pelajaran</td>
        <td>${d.year || "2026/2027"}</td>
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
          <strong><u>${d.principal || "Kepala Satuan Pendidikan, M.Pd."}</u></strong><br>
          NIP. ${d.nipPrincipal || "-"}
        </td>
        <td style="border: none; text-align: center; width: 50%; vertical-align: top;">
          ${d.cityDate || "Makassar, 14 Juli 2026"}<br>
          <strong>Guru Mata Pelajaran</strong><br><br><br><br><br>
          <strong><u>${d.teacher || "Guru Pengampu, S.Pd."}</u></strong><br>
          NIP. ${d.nipTeacher || "-"}
        </td>
      </tr>
    </table>

    ${lampiran017Html}
  `;
}

// src/utils/kurikulumMerdekaBuilder.ts
var COMMON_CSS2 = `
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
function renderKop2(d) {
  const school = d.school || d.schoolName || "SMA Negeri 1 Jambi";
  return `
  <div class="kop-surat">
    <h3>PEMERINTAH DAERAH PROVINSI</h3>
    <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
    <h2>${school.toUpperCase()}</h2>
    <p>Jalan Pendidikan Terpadu No. 01 \u2014 Akreditasi A | Email: info@sekolah.sch.id</p>
  </div>`;
}
function renderSignatures2(d) {
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
function buildKurikulumMerdekaDocument(docType, formData = {}) {
  const d = {
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
    cpElemen: formData.cpElemen || `Elemen 1 \u2014 Menyimak: Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan dari berbagai tipe teks lisan.
Elemen 2 \u2014 Membaca dan Memirsa: Peserta didik mampu mengevaluasi gagasan dari berbagai teks nonsastra dan sastra.
Elemen 3 \u2014 Berbicara dan Mempresentasikan: Peserta didik mampu mengolah dan menyajikan gagasan secara santun dan logis.
Elemen 4 \u2014 Menulis: Peserta didik mampu menulis gagasan tertulis secara terstruktur dan kreatif.`,
    rme: formData.rme || {}
  };
  const kop = renderKop2(d);
  const ttd = renderSignatures2(d);
  const elemenLines = (d.cpElemen || "").split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const parsedElemenList = elemenLines.length > 0 ? elemenLines.map((line, idx) => {
    const parts = line.split(":");
    const name = parts[0]?.trim() || `Elemen ${idx + 1}`;
    const desc = parts.slice(1).join(":")?.trim() || line;
    return { name, desc };
  }) : [
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
        <td>Menganalisis (C4), Mengevaluasi (C5), Mengkreasi (C6) \u2014 Terarah pada perumusan TP berbasis pemecahan masalah kontekstual.</td>
      </tr>
    `).join("");
    return `
${COMMON_CSS2}
${kop}
<div class="doc-title">ANALISIS CAPAIAN PEMBELAJARAN (CP)</div>
<div class="doc-subtitle">Kurikulum Merdeka \u2014 Berdasarkan Keputusan BSKAP Kemendikbudristek | Tahun Pelajaran ${d.year}</div>

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
    <tr><td style="text-align:center;">1</td><td><strong>Keimanan & Ketakwaan</strong></td><td>Menyadari keteraturan ciptaan Tuhan dan menjunjung tinggi kejujuran ilmiah serta integritas akademik.</td><td style="text-align:center;" class="badge-check">\u2714 Sangat Kuat</td></tr>
    <tr><td style="text-align:center;">2</td><td><strong>Kewargaan & Kebinekaan</strong></td><td>Menghargai keragaman sosial budaya dan kearifan lokal dalam konteks tantangan global.</td><td style="text-align:center;" class="badge-check">\u2714 Kuat</td></tr>
    <tr><td style="text-align:center;">3</td><td><strong>Penalaran Kritis</strong></td><td>Memproses informasi secara objektif, menganalisis argumen, dan menarik kesimpulan berbasis data valid.</td><td style="text-align:center;" class="badge-check">\u2714 Sangat Kuat</td></tr>
    <tr><td style="text-align:center;">4</td><td><strong>Kreativitas & Inovasi</strong></td><td>Menghasilkan gagasan orisinal, alternatif pemecahan masalah, dan produk belajar inovatif.</td><td style="text-align:center;" class="badge-check">\u2714 Kuat</td></tr>
    <tr><td style="text-align:center;">5</td><td><strong>Kolaborasi & Gotong Royong</strong></td><td>Membangun kemampuan kerja tim, empati, dan kepedulian sosial untuk mencapai tujuan bersama.</td><td style="text-align:center;" class="badge-check">\u2714 Kuat</td></tr>
    <tr><td style="text-align:center;">6</td><td><strong>Kemandirian Belajar</strong></td><td>Mengembangkan regulasi diri, motivasi intrinsik, dan tanggung jawab atas proses pembelajaran.</td><td style="text-align:center;" class="badge-check">\u2714 Kuat</td></tr>
    <tr><td style="text-align:center;">7</td><td><strong>Komunikasi Efektif</strong></td><td>Menyampaikan pendapat dengan runtut, santun, dan mampu mendengarkan secara aktif.</td><td style="text-align:center;" class="badge-check">\u2714 Sangat Kuat</td></tr>
    <tr><td style="text-align:center;">8</td><td><strong>Kesehatan Jiwa & Raga</strong></td><td>Menjaga keseimbangan belajar, resiliensi terhadap kesulitan, dan gaya hidup sehat berkelanjutan.</td><td style="text-align:center;" class="badge-check">\u2714 Terintegrasi</td></tr>
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
        <td>TP.${d.singkatanMapel}.${(idx + 1).toString().padStart(2, "0")}.01</td>
        <td>Peserta didik mampu menganalisis konsep dasar ${e.name} dan mengevaluasi kasus kontekstual secara kritis.</td>
        <td>Konsep Dasar & Struktur ${e.name}</td>
        <td style="text-align:center; font-weight:bold;">${Math.round(18 / Math.max(1, parsedElemenList.length))} JP</td>
        <td>Formatif (Anekdotal/Kuis) & Sumatif Tes Tertulis</td>
      </tr>
      <tr>
        <td style="text-align:center;">${idx + 1}b</td>
        <td><strong>${e.name}</strong></td>
        <td>TP.${d.singkatanMapel}.${(idx + 1).toString().padStart(2, "0")}.02</td>
        <td>Peserta didik mampu mengkreasi solusi inovatif atau karya nyata berbasis pemahaman materi ${e.name}.</td>
        <td>Aplikasi & Praktik ${e.name}</td>
        <td style="text-align:center; font-weight:bold;">${Math.round(18 / Math.max(1, parsedElemenList.length))} JP</td>
        <td>Penilaian Kinerja / Portofolio Proyek</td>
      </tr>
    `).join("");
    return `
${COMMON_CSS2}
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
${COMMON_CSS2}
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
${COMMON_CSS2}
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
${COMMON_CSS2}
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
${COMMON_CSS2}
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
      <td style="text-align:center; font-weight:bold; color:#b91c1c;">0 \u2013 55%</td>
      <td><strong>Perlu Bimbingan</strong></td>
      <td>Peserta didik belum mencapai kriteria ketuntasan minimal; kesulitan memahami konsep esensial.</td>
      <td>Remedial intensif di seluruh materi melalui pendampingan tutor sebaya dan bimbingan guru.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#c2410c;">56 \u2013 70%</td>
      <td><strong>Cukup / Layak (KKTP)</strong></td>
      <td>Peserta didik telah memenuhi kriteria ketuntasan minimal, namun masih memiliki sedikit kelemahan pada sebagian indikator.</td>
      <td>Remedial parsial hanya pada indikator yang belum tuntas, kemudian diberikan kuis penguatan.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#15803d;">71 \u2013 85%</td>
      <td><strong>Baik / Cakap</strong></td>
      <td>Peserta didik telah mencapai tujuan pembelajaran dengan baik, mampu bernalar logis dan menyelesaikan tugas kontekstual.</td>
      <td>Diberikan pengayaan mandiri dan tantangan studi kasus aplikatif.</td>
    </tr>
    <tr>
      <td style="text-align:center; font-weight:bold; color:#0369a1;">86 \u2013 100%</td>
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
  return `
${COMMON_CSS2}
${kop}
<div class="doc-title">PERANGKAT ADMINISTRASI PEMBELAJARAN</div>
<div class="doc-subtitle">Kurikulum Merdeka \u2014 ${d.school} | Tahun Pelajaran ${d.year}</div>
<p style="text-align:center;">Dokumen ${docType} berhasil disusun sesuai format standar Kurikulum Merdeka.</p>
${ttd}
`;
}

// server.ts
dotenv.config();
var firebaseConfigData = {
  projectId: "witty-moment-pxctm",
  firestoreDatabaseId: "ai-studio-remixaplikasigur-d65f5706-fc61-4aab-9635-2d037c9c7de3",
  apiKey: "AIzaSyDOxfbraST4mXXUQ-npkk_705nfJJKvMg0"
};
function createApiApp() {
  const app2 = express();
  app2.use(express.json({ limit: "10mb" }));
  app2.use((req, _res, next) => {
    if (req.url.startsWith("/api/index/")) {
      req.url = req.url.replace("/api/index/", "/api/");
    } else if (req.url.startsWith("/index/")) {
      req.url = req.url.replace("/index/", "/api/");
    } else if (req.url === "/api/index" || req.url === "/index" || req.url === "/api/index.js" || req.url.startsWith("/api/index.js")) {
      req.url = req.originalUrl || req.url;
    }
    next();
  });
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
  const generateContentWithRetry = async (ai, contents) => {
    const modelCandidates = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    let lastError = null;
    for (const modelCandidate of modelCandidates) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents
          });
          return response;
        } catch (err) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code;
          const errMsg = String(err?.message || err || "");
          const isAuthError = status === 401 || errMsg.includes("401") || errMsg.includes("UNAUTHENTICATED") || errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || errMsg.includes("API key not valid") || errMsg.includes("API_KEY_INVALID");
          if (isAuthError) {
            throw err;
          }
          const isModelNotFound = status === 404 || errMsg.includes("404") || errMsg.includes("not found") || errMsg.includes("is not supported");
          if (isModelNotFound) {
            break;
          }
          const isTransient = status === 503 || status === 429 || status === 500 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("resource exhausted");
          const isQuota = status === 429 || errMsg.includes("Quota exceeded") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("rate-limits");
          if (isTransient) {
            if (isQuota) {
              if (attempt === 0) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
              } else {
                break;
              }
            } else if (attempt < 1) {
              await new Promise((resolve) => setTimeout(resolve, 1e3));
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    }
    throw lastError || new Error("Layanan AI sedang sibuk. Silakan coba beberapa saat lagi.");
  };
  app2.get(["/api/health", "/health"], (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post(["/api/auth/login", "/auth/login"], async (req, res) => {
    try {
      const { username, password } = req.body || {};
      let validUsername = process.env.AUTH_USERNAME || "www.yefriharyanto.id";
      let validPassword = process.env.AUTH_PASSWORD || "123456";
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
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server autentikasi."
      });
    }
  });
  app2.get(["/api/auth/verify", "/auth/verify"], (req, res) => {
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
    }
    return res.status(401).json({ status: "error", valid: false });
  });
  app2.post(["/api/ai/generate-modul", "/ai/generate-modul"], async (req, res) => {
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
      const tanggalTtd = formData.tanggalTtd || (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const metodeText = formData.metode && formData.metode.trim() ? formData.metode.trim() : "Diskusi kelompok, tanya jawab interaktif, penugasan studi kasus, presentasi, dan refleksi terbimbing";
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
</div>` : ""}
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
</table>` : ""}
`;
      const docNumberIso = formData.docNumberIso || "015/F/KUR/00/IX/2025";
      const kepemimpinan = formData.kepemimpinan || "Kalla Core Values & Kepemimpinan Athirah: Ikhlas, Cepat, Cerdas, Keras";
      const spiritualisasi = formData.spiritualisasi || "";
      const sertakanLampiran017 = formData.sertakanLampiran017 !== false;
      let systemPrompt = "";
      let formatTemplate = "";
      if (formatOutput === "sekolah_format1_iso") {
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
${sertakanLampiran017 ? `5. FORM LAMPIRAN ASESMEN ISO 017 (No. Dokumen: 017/F/KUR/00/IX/2025): Matriks Kisi-kisi & Instrumen Asesmen 7 Kolom (Materi, Tujuan Pembelajaran, Indikator Asesmen, Jenis Asesmen, Uraian Soal Tertulis, Deskripsi Aktivitas Non-tertulis, LKPD) & LKPD Siswa Siap Pakai.` : ""}

ATURAN FORMAT DOKUMEN:
- Hasilkan MURNI KODE HTML TANPA MARKDOWN (DILARANG menggunakan \`\`\`html, \`\`\`, atau tanda pagar #).
- Tabel menggunakan class="iso-kop-table" dan class="table-format1-athirah" dengan border 1px solid #000000.
- Header tabel gunakan background-color: #064e3b; color: #ffffff; text-align: center; font-weight: bold;`;
        formatTemplate = `
<table class="iso-kop-table" style="width:100%; border-collapse:collapse; border:1px solid #000000; margin-bottom:12px; font-family:Arial, sans-serif;">
  <tr>
    <td rowspan="5" style="width:90px; text-align:center; vertical-align:middle; border:1px solid #000000; padding:6px;">
      <div style="font-size:22px;">\u{1F33F}</div>
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
    <td colspan="3" style="font-size:8.5pt; border:1px solid #000000; padding:5px 7px;">${formData.tujuan || "Peserta didik mampu memahami dan menerapkan konsep secara mandiri dan kritis."}</td>
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
        systemPrompt = `Anda adalah Ahli Kurikulum Kementerian Agama RI dan Pengembang Modul Ajar Kurikulum Berbasis Cinta (KBC). Susunlah Modul Ajar yang mengintegrasikan Panca Cinta Kemenag serta 10 Nilai Profil Pelajar Rahmatan lil 'Alamin (PPRA: Ta'addub, Qudwah, Muwa\u1E6Danah, Tawassu\u1E6D, Taw\u0101zun, I'tid\u0101l, Mus\u0101wah, Sy\u016Br\u0101, Tas\u0101muh, Tathawwur wa Ibtik\u0101r).
Struktur Modul KBC:
1. INFORMASI UMUM (Identitas, Kompetensi Awal, Panca Cinta & Nilai PPRA, Sarpras, Target Peserta Didik).
2. KOMPONEN INTI (Tujuan Pembelajaran Berbasis Nilai, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran Berdiferensiasi & Penuh Kasih Sayang per Pertemuan).
3. ASESMEN & REFLEKSI (Asesmen Kognitif, Non-Kognitif, Karakter PPRA).
${sertakanLkpd ? "4. LAMPIRAN (LKPD Siswa Penuh Nilai KBC, Rubrik Karakter, Glosarium)." : ""}
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
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Topik / Materi</td><td>${formData.topik} ${formData.subTopik ? `(${formData.subTopik})` : ""}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Alokasi Waktu</td><td>${formData.waktu} (${formData.jumlahPertemuan} Pertemuan)</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Model & Metode</td><td>${formData.model} \u2014 ${metodeText}</td></tr>
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Integrasi KBC & PPRA</td><td>Panca Cinta Kemenag & Nilai PPRA (Ta'addub, Qudwah, Tawassu\u1E6D, Sy\u016Br\u0101, dll)</td></tr>
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
` : ""}
`;
      } else if (formatOutput === "deep_learning") {
        systemPrompt = `Anda adalah Ahli Kurikulum dan Desain Pembelajaran Mendalam (Deep Learning Specialist).
Susunlah MODUL AJAR DEEP LEARNING (PEMBELAJARAN MENDALAM) yang komprehensif, berbasis 3 Dimensi Utama:
- Mindful Learning (Olah Pikir: Kesadaran Penuh, Fokus, Berpikir Kritis).
- Meaningful Learning (Olah Rasa: Relevansi Kontekstual, Makna Kehidupan Nyata).
- Joyful Learning (Olah Karsa: Menggembirakan, Menyenangkan, Kolaboratif, Produktif).

Setiap tahapan pembelajaran mengintegrasikan 3 Fase:
1. Memahami (Concept Acquisition)
2. Mengaplikasi (Contextual Application)
3. Merefleksi (Metacognitive Reflection)
${sertakanLkpd ? "Wajib sertakan LKPD Interaktif dan rubrik evaluasi siap pakai." : ""}
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
  <tr><td style="font-weight:bold; background-color:#f8fafc;">Topik & Sub-Topik</td><td>${formData.topik} ${formData.subTopik ? `- ${formData.subTopik}` : ""}</td></tr>
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
` : ""}
`;
      } else {
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
- Daftar Pustaka.` : ""}

${commonRules}`;
        formatTemplate = `
<h1 style="text-align:center; font-size:15pt; font-weight:bold; margin-bottom:14px; color:#1a3a5c;">MODUL AJAR KURIKULUM MERDEKA</h1>
<p style="text-align:center; font-size:10.5pt; color:#475569; margin-top:-8px; margin-bottom:16px;">Dokumen Perencanaan Pembelajaran Berpusat pada Peserta Didik</p>

<h2 style="font-size:12pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:3px; margin-top:16px;">I. INFORMASI UMUM</h2>
<table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
  <tr>
    <td style="font-weight:bold; width:30%; background-color:#f8fafc;">Nama Penyusun</td>
    <td>${namaGuru} ${nipGuru !== "-" ? `(NIP: ${nipGuru})` : ""}</td>
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
    <td>${formData.topik} ${formData.subTopik ? `(${formData.subTopik})` : ""}</td>
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
` : ""}
`;
      }
      const userPrompt = `DATA MODUL AJAR (CAKUPAN 1 BAB UTUH DARI AWAL HINGGA AKHIR PERTEMUAN):
- Format Dokumen yang Diminta: ${formatOutput}
- Nama Guru: ${namaGuru} (NIP: ${nipGuru})
- Satuan Pendidikan: ${namaSekolah} (${alamatSekolah})
- Pemerintah / Dinas: ${pemerintah}
- Tahun Ajaran: ${formData.tahunAjaran || "2026/2027"}
- Jenjang: ${formData.jenjang || "SMP"}
- Fase: ${formData.fase || "Fase D (Kelas 7-9)"}
- Kelas: ${formData.kelas || "VII"}
- Alokasi Waktu: ${formData.waktu || "4 x 45 JP"}
- Mata Pelajaran: ${formData.mataPelajaran || "Umum"}
- Bab / Topik Utama (1 Bab Penuh): ${formData.topik || "Topik Pembelajaran"}
- Jumlah Pertemuan Bab: ${formData.jumlahPertemuan || "2"} Pertemuan (Jelaskan seluruh pertemuan 1 s.d. ${formData.jumlahPertemuan || "2"} secara berurutan dan mendalam dari awal hingga penuntasan bab)
- Model Pembelajaran: ${formData.model || "Problem Based Learning (PBL)"}
- Metode Pembelajaran: ${metodeText}
- Tujuan Pembelajaran (TP) Bab: ${formData.tujuan || "Siswa dapat menganalisis dan menerapkan konsep materi bab secara kritis, mandiri, dan bermakna."}
- Karakteristik Murid: ${formData.karakteristik || "Heterogen, siap belajar aktif."}

INSTRUKSI KHUSUS CAKUPAN 1 BAB PENUH:
- Modul Ajar ini mencakup 1 Bab penuh dari awal sampai akhir materi.
- Seluruh pertemuan (Pertemuan 1 s.d. ${formData.jumlahPertemuan || "2"}) harus dijabarkan detail langkah pembelajarannya (Kegiatan Pendahuluan, Kegiatan Inti Mindful-Meaningful-Joyful, dan Kegiatan Penutup Reflektif).
- Lengkapi dengan asesmen formatif berkala dan asesmen sumatif penutup bab.

FORMAT WAJIB LAYOUT HTML:
${formatTemplate}`;
      let text = "";
      try {
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("AI generation timed out after 25s")), 25e3)
        );
        const response = await Promise.race([
          generateContentWithRetry(ai, [
            { role: "user", parts: [{ text: `${systemPrompt}

${userPrompt}` }] }
          ]),
          timeoutPromise
        ]);
        text = response.text || "";
        text = text.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/^#+\s*(.*?)$/gm, "<h3>$1</h3>").replace(/`/g, "").trim();
      } catch (aiErr) {
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
          level: `Fase ${formData.fase || "D"} / Kelas ${formData.kelas || "VII"}`,
          year: formData.tahunAjaran || "2026/2027",
          learningModel: formData.model || "Problem Based Learning (PBL)",
          jumlahPertemuan: formData.jumlahPertemuan || "2",
          jpPerPertemuan: "2",
          topikLokal: formData.topik || "Topik Pembelajaran",
          rumusanTp: formData.tujuan || "Peserta didik dapat menganalisis dan menerapkan konsep materi secara kritis, mandiri, dan bermakna.",
          docNumberIso,
          kepemimpinan,
          spiritualisasi,
          sertakanLampiran017,
          sertakanLkpd
        });
      }
      res.json({ status: "success", html: text });
    } catch (error) {
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
  app2.post(["/api/ai/chat-asisten", "/ai/chat-asisten"], async (req, res) => {
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
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("AI generation timed out after 20s")), 2e4)
      );
      const response = await Promise.race([
        generateContentWithRetry(ai, [
          { role: "user", parts: [{ text: `${systemPrompt}

Pertanyaan/Permintaan Guru:
${message}` }] }
        ]),
        timeoutPromise
      ]);
      const rawText = response?.text || "Maaf, saya tidak dapat merespons saat ini.";
      const cleanReply = rawText.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").replace(/^`+|`+$/g, "").trim();
      res.json({ status: "success", reply: cleanReply });
    } catch (error) {
      console.warn("Notice in chat assistant:", error?.message || error);
      res.json({
        status: "success",
        reply: "Halo Bapak/Ibu Guru! Asisten AI siap mendampingi perencanaan pengajaran Anda. Sistem saat ini beroperasi dalam mode asistensi cerdas standar. Untuk mengaktifkan generasi komprehensif real-time via model Gemini terbaru, pastikan API Key aktif terhubung di setelan Google AI Studio. Silakan gunakan menu Perangkat Ajar & KBC untuk membuat modul ajar dan administrasi resmi siap cetak!"
      });
    }
  });
  const createPptSvgImage = (slideIndex, topic, subject) => {
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
  app2.post("/api/ai/generate-ppt-all-slides", async (req, res) => {
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
2. Subjudul: Menjelaskan fokus pembahasan pada slide. Maksimal 1\u20132 kalimat.
3. Materi Utama: Terdiri atas 2\u20135 paragraf singkat atau 5\u20138 poin penjelasan yang saling berkaitan. Gunakan bahasa yang sederhana, komunikatif, dan sesuai jenjang pendidikan. Sertakan definisi, konsep utama, penjelasan, contoh, serta fakta penting bila relevan. Hindari hanya menampilkan kata kunci tanpa penjelasan.
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
      rawText = rawText.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();
      let parsedSlides = [];
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
          const slideContent = Array.isArray(s.content) && s.content.length > 0 ? s.content : Array.isArray(s.mainContent) && s.mainContent.length > 0 ? s.mainContent : [
            `Definisi Esensial: ${subTitle} merupakan landasan utama dalam pemahaman materi ${topic}.`,
            `Konsep Utama: Menguraikan hubungan antar-elemen serta prinsip dasar yang bekerja pada sistem.`,
            `Mekanisme Kerja: Menjelaskan tahapan fisiologis/operasional secara rinci dan sistematis.`,
            `Fakta Penting: Menyoroti parameter penting yang memengaruhi kinerja serta dampaknya.`
          ];
          return {
            title: rawTitle,
            subtitle: s.subtitle || `Fokus pembahasan mengenai ${subTitle.toLowerCase()} dalam materi ${topic}.`,
            layoutSuggestion: s.layoutSuggestion || "Split Layout",
            content: slideContent,
            example: s.example || `Contoh nyata penerapan ${subTitle.toLowerCase()} dalam kehidupan sehari-hari maupun studi kasus terapan.`,
            funFact: s.funFact || `Tahukah Kamu? Konsep ${subTitle.toLowerCase()} memiliki peran krusial dalam perkembangan teknologi dan sains modern.`,
            speakerNotes: s.speakerNotes || `Saran Animasi: Title (Fade), Image (Zoom In), Text (Wipe)
Catatan Detail: Guru menjelaskan poin-poin dengan analogi sederhana dan interaktif.`,
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
    } catch (error) {
      console.warn("Batch PPT generation fallback applied due to API error/rate-limit:", error?.message);
    }
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
        speakerNotes: `Saran Animasi: Judul (Fade), Gambar (Zoom In), Teks (Fly In)
Catatan Detail: Guru memandu diskusi kelas mengenai contoh kasus kontekstual secara aktif.`,
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
  app2.post(["/api/ai/generate-ppt-text", "/ai/generate-ppt-text"], async (req, res) => {
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
  app2.post(["/api/ai/generate-ppt-image", "/ai/generate-ppt-image"], async (req, res) => {
    try {
      const { slideIndex, topic, subject } = req.body;
      const indexNum = slideIndex || 1;
      const encodedSvg = createPptSvgImage(indexNum, topic, subject);
      res.json({ status: "success", imageUrl: encodedSvg });
    } catch (error) {
      res.json({
        status: "success",
        imageUrl: `https://placehold.co/800x450/1e3a8a/ffffff.png?text=EduSlide+Part+${req.body?.slideIndex || 1}`
      });
    }
  });
  app2.post(["/api/ai/generate-perangkat-ajar", "/ai/generate-perangkat-ajar"], async (req, res) => {
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
      const cpElemen = formData?.cpElemen || `Elemen 1 \u2014 Menyimak: Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan dari berbagai tipe teks lisan.
Elemen 2 \u2014 Membaca dan Memirsa: Peserta didik mampu mengevaluasi informasi berupa gagasan dari teks deskripsi, laporan, narasi, eksplanasi, eksposisi.
Elemen 3 \u2014 Berbicara dan Mempresentasikan: Peserta didik mampu mengolah dan menyajikan gagasan untuk tujuan pengajuan usul dan solusi.
Elemen 4 \u2014 Menulis: Peserta didik mampu menulis gagasan tertulis secara logis, kritis, dan kreatif.`;
      const rmeData = formData?.rme;
      let rmeContext = "";
      if (rmeData) {
        const ganjilStr = (rmeData.ganjil || []).map((m, i) => `  * ${m.month}: ${m.totalWeeks} pekan total, ${m.nonEffective} tidak efektif, ${m.effective} pekan efektif (Catatan: ${m.note || "-"})`).join("\n");
        const genapStr = (rmeData.genap || []).map((m, i) => `  * ${m.month}: ${m.totalWeeks} pekan total, ${m.nonEffective} tidak efektif, ${m.effective} pekan efektif (Catatan: ${m.note || "-"})`).join("\n");
        const agendaStr = (rmeData.agenda || []).map((a, i) => `  * [Sem ${a.semester || "Semua"}] ${a.kegiatan} (${a.waktu || "-"}) [${a.kategori || "Kurikuler"}]`).join("\n");
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
- Catatan Pedoman Kalender: ${rmeData.catatanKalender || "Sesuai Kalender Dinas Pendidikan dan Kebijakan Sekolah."}
`;
      }
      const generalRules = `
KETENTUAN UTAMA GENERASI HTML ADMINISTRASI:
1. SANGAT PENTING - TANPA LOGO / GAMBAR: Kop Sekolah HANYA berisi teks nama dinas/pemerintah, nama sekolah, alamat, dan garis tebal pembatas. DILARANG MENAMBAHKAN TAG <img>, PLACEHOLDER [LOGO], ATAU GAMBAR APAPUN.
2. TANDA TANGAN SEJAJAR DALAM TABEL TAK TERLIHAT: Bagian tanda tangan penutup Kepala Sekolah (kiri/kanan) dan Guru Mata Pelajaran (kiri/kanan) HARUS disusun sejajar dalam 1 baris menggunakan TABEL HTML 2 KOLOM TANPA BORDER (\`<table style="width:100%; border:none; margin-top:30px;"><tr><td style="border:none; text-align:center; width:50%;">... TTD Kepsek ...</td><td style="border:none; text-align:center; width:50%;">... TTD Guru ...</td></tr></table>\`).
3. DILARANG MENAMPILKAN TEKS/TOMBOL "Cetak Dokumen" atau "\u{1F5A8}\uFE0F Cetak" DI DALAM ISI DOKUMEN HTML.
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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-RME-${singkatanMapel}-${level.replace(/\s+/g, "")} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A \u2014 IDENTITAS SATUAN PENDIDIKAN & PROGRAM (Tabel 2 Kolom)
3. BAGIAN B \u2014 ANALISIS MINGGU EFEKTIF SEMESTER GANJIL (Tabel 6 kolom: No | Nama Bulan | Jumlah Minggu | Minggu Tdk Efektif | Minggu Efektif | Keterangan / Agenda Kegiatan Sekolah) beserta baris Total Jumlah Semester Ganjil.
4. BAGIAN C \u2014 ANALISIS MINGGU EFEKTIF SEMESTER GENAP (Tabel 6 kolom: No | Nama Bulan | Jumlah Minggu | Minggu Tdk Efektif | Minggu Efektif | Keterangan / Agenda Kegiatan Sekolah) beserta baris Total Jumlah Semester Genap.
5. BAGIAN D \u2014 REKAPITULASI RENCANA PEKAN EFEKTIF (RPE) & DISTRIBUSI JAM PELAJARAN (Tabel ringkasan: Pekan Efektif Ganjil, Pekan Efektif Genap, Total Pekan Tahunan, Total Jam Pelajaran, Alokasi Tatap Muka Intrakurikuler 75%, Alokasi Projek P5 / Penguatan Karakter 25%).
6. BAGIAN E \u2014 MATRIKS AGENDA UTAMA KALENDER PENDIDIKAN SEKOLAH (Tabel 5 kolom: No | Agenda / Kegiatan Sekolah | Rentang Waktu / Tanggal | Semester | Kategori).
7. Catatan Pedoman Kalender Pendidikan Sekolah.
8. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-CP-${singkatanMapel}-${level.replace(/\s+/g, "")} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A \u2014 IDENTITAS (Tabel 2 Kolom)
3. BAGIAN B \u2014 RASIONAL MATA PELAJARAN (Tabel 3 kolom: No | Uraian | Deskripsi) -> 1. Pentingnya Mapel, 2. Kaitan dengan 8 Dimensi Profil Lulusan, 3. Orientasi Pembelajaran.
4. BAGIAN C \u2014 TUJUAN MATA PELAJARAN (Tabel 3 kolom: No | Tujuan | Indikator Umum - min 3 tujuan terukur)
5. BAGIAN D \u2014 KARAKTERISTIK MATA PELAJARAN & ELEMEN CP (Tabel 4 kolom: No | Elemen | Deskripsi Elemen | Cakupan Konten Utama - daftar 5-7 topik konkret per elemen)
6. BAGIAN E \u2014 CAPAIAN PEMBELAJARAN FASE (Tabel 4 kolom: Fase | Capaian Pembelajaran | Kompetensi Kunci | Konten / Materi Pokok)
7. BAGIAN F \u2014 PENJABARAN KATA KERJA OPERASIONAL (KKO) PER ELEMEN (Tabel 3 kolom: No | Elemen | KKO & Arah Tujuan Pembelajaran)
8. BAGIAN G \u2014 KETERKAITAN DENGAN 8 DIMENSI PROFIL LULUSAN (Tabel 4 kolom: No | Dimensi Profil Lulusan | Elemen Terkait | Relevansi \u2714)
9. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TANPA BORDER.

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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-TP-${singkatanMapel}-${level.replace(/\s+/g, "")} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A \u2014 IDENTITAS (Tabel 2 Kolom)
3. BAGIAN B \u2014 PANDUAN KODE TUJUAN PEMBELAJARAN (Sub B1 Format Kode box, Sub B2 Tabel Kode Elemen)
4. BAGIAN C \u2014 DAFTAR TUJUAN PEMBELAJARAN (Tabel 6 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran | Aspek Kompetensi | Alokasi JP). Buat 8-12 TP berprinsip ABCD, KKO Bloom terukur, diawali "Peserta didik mampu...". Total JP HARUS TEPAT SAMA dengan Alokasi Waktu Total (${totalJp}).
5. BAGIAN D \u2014 REKAPITULASI ALOKASI WAKTU PER ELEMEN (Tabel 5 kolom: No | Elemen CP | Jumlah TP | Total JP | Persentase)
6. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-ATP-${singkatanMapel}-${level.replace(/\s+/g, "")} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A \u2014 IDENTITAS (Tabel 4 kolom compact)
3. BAGIAN B \u2014 ALUR URUTAN TUJUAN PEMBELAJARAN DALAM SATU FASE (Diagram visual Flexbox kotak kode TP dengan panah \u2192)
4. BAGIAN C \u2014 TABEL ALUR TUJUAN PEMBELAJARAN (Tabel 8 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran | Materi Pokok | Kompetensi & Variasi | 8 Dimensi Profil Lulusan | Alokasi JP | Semester)
5. BAGIAN D \u2014 REKAPITULASI ALOKASI WAKTU (Tabel 6 kolom: No | Elemen CP | Jumlah TP | JP Sem 1 | JP Sem 2 | Total JP | Keterangan)
6. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-PROTA-${singkatanMapel}-${level.replace(/\s+/g, "")} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. BAGIAN A \u2014 IDENTITAS
3. BAGIAN B \u2014 DISTRIBUSI MINGGU EFEKTIF \u2014 KALENDER PENDIDIKAN (Tabel 7 kolom: Sem | Bulan | Minggu Kalender | Tdk Efektif | Efektif | JP | Keterangan).
   PENTING: Gunakan tabel rincian data RME dari guru di atas secara persis untuk ke-12 bulan (Juli-Desember & Januari-Juni)! Subtotal Ganjil, Subtotal Genap, dan Total Keseluruhan harus tepat sama dengan data RME guru.
4. BAGIAN C \u2014 RENCANA PROGRAM TAHUNAN (Tabel 5 kolom: No | Kode TP | Tujuan Pembelajaran & Materi Pokok | Elemen CP | Alokasi JP | Semester).
   PENTING: Total Alokasi JP TP Semester 1 HARUS TEPAT SAMA dengan JP Efektif Ganjil, dan Semester 2 TEPAT SAMA dengan JP Efektif Genap. Selisih Prota dan RME dijamin 0 JP!
5. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- DILARANG MENAMPILKAN TOMBOL/TEKS "Cetak Dokumen" atau "\u{1F5A8}\uFE0F Cetak" DI DALAM ISI HTML.
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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-PROSEM-${singkatanMapel}-${level.replace(/\s+/g, "")}-S1 / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. Header Identitas & Legenda Warna Sel Matriks (Biru #d0e4f7 = JP Aktif, Merah #ffd6d6 = Libur, Kuning #fff3cd = PTS, Hijau #d4edda = PAS/PAT)
3. TABEL MATRIKS DISTRIBUSI PEMBELAJARAN PER MINGGU (Kolom: No | Kode TP | Tujuan & Materi Pokok | JP | Kolom-kolom Minggu M1..M5 per Bulan | Keterangan Model Pembelajaran).
   PENTING: Kolom-kolom minggu setiap bulan (Juli\u2013Desember untuk Sem 1, Januari\u2013Juni untuk Sem 2) harus merefleksikan pekan efektif dan agenda tidak efektif (seperti MPLS di Juli M1-M2, PTS di September, SAS di Desember) dari data RME guru di atas!
   PENTING: SEMUA KEPALA KOLOM TABEL (TH) HARUS DIBERI STYLING INLINE: style="background-color:#1a3a5c; color:#ffffff; font-weight:bold; text-align:center;" AGAR TERLIHAT KONTRAST DI WORD DAN BROWSER!
4. Catatan Keterangan Bulan Tidak Efektif & Asesmen
5. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

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
1. Kop Sekolah (TANPA LOGO) & Nomor Dokumen: No. Dok: ADM-KKTP-${singkatanMapel}-${level.replace(/\s+/g, "")} / Rev: 00 / Tgl: ${year.slice(0, 4)}
2. Kotak Dasar Hukum Permendikbudristek No. 21 Tahun 2022 & BAGIAN A \u2014 IDENTITAS
3. BAGIAN A \u2014 DESKRIPSI LEVEL CAPAIAN (Tabel 5 kolom: Level | Skor | Deskripsi Umum | Tindak Lanjut | Rentang Nilai | Predikat - Level 1 Mulai Berkembang 0-55, Level 2 Layak \u2713 KKTP 56-70, Level 3 Cakap 71-85, Level 4 Mahir 86-100)
4. BAGIAN B \u2014 RUBRIK KKTP PER TUJUAN PEMBELAJARAN (Tabel 9 kolom: No | Kode TP | Tujuan Pembelajaran | IKTP Indikator Ketercapaian | Sub-kolom 4 Level: Mulai Berkembang (1), Layak (2) \u2713 KKTP, Cakap (3), Mahir (4)). Buat deskriptor berjenjang yang jelas, kuantitatif/kualitatif untuk setiap TP.
5. Kotak Catatan Penting Ambang Batas Minimal Ketuntasan
6. BAGIAN PENUTUP \u2014 TANDA TANGAN SEJAJAR KEPSEK & GURU DENGAN TABEL TAK TERLIHAT (BORDER 0).

KETENTUAN LAYOUT HTML:
- Hasilkan MURNI KODE HTML tanpa markdown fence.
- SANGAT PENTING: DILARANG MEMASUKKAN LOGO / GAMBAR DI HEADER KOP.
- Gunakan LANDSCAPE A4 di @media print { @page { size: A4 landscape; margin: 1.2cm; } }. Warna header #1a3a5c.`;
      } else {
        docPrompt = `Buatkan Dokumen Analisis Capaian Pembelajaran (CP) dan Administrasi Perangkat Ajar Kurikulum Merdeka untuk sekolah ${schoolName}, mapel ${subject}, ${level}, tahun ${year}, guru ${teacher}. Hasilkan MURNI HTML lengkap dengan Kop Sekolah, Tabel Rapi, dan Tanda Tangan Penutup.`;
      }
      let htmlOutput = "";
      try {
        const contents = [{ role: "user", parts: [{ text: docPrompt }] }];
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("AI generation timed out after 25s")), 25e3)
        );
        const response = await Promise.race([
          generateContentWithRetry(ai, contents),
          timeoutPromise
        ]);
        htmlOutput = response?.text || "";
        htmlOutput = htmlOutput.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      } catch (aiErr) {
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
    } catch (err) {
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
      } catch (fallbackErr) {
        res.status(500).json({
          status: "error",
          message: err?.message || "Terjadi kesalahan saat memproses Perangkat Ajar AI."
        });
      }
    }
  });
  app2.post(["/api/ai/generate-perangkat-ajar-kbc", "/ai/generate-perangkat-ajar-kbc"], async (req, res) => {
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
- Kamu adalah Ahli Kurikulum & Pengembang Perangkat Ajar Kemenag RI, menguasai "Kurikulum Berbasis Cinta (KBC)" (turunan Kurikulum Merdeka yang mengintegrasikan Panca Cinta Kemenag & 10 Nilai PPRA: Ta'addub, Qudwah, Muwa\u1E6Danah, Tawassu\u1E6D, Taw\u0101zun, I'tid\u0101l, Mus\u0101wah, Sy\u016Br\u0101, Tas\u0101muh, Tathawwur wa Ibtik\u0101r).
- Hasil WAJIB MURNI KODE HTML tanpa markdown code fences (\`\`\`html) atau teks pengantar lain.
- Gunakan CSS internal rapi dengan font sans-serif (Arial/Calibri), header tabel warna biru tua (#1a3a5c) teks putih bold.
- Tanda tangan penutup 2 kolom sejajar border 0 (Kepala Sekolah & Guru Mata Pelajaran).
- Tanggal & Kota TTD: ${cityDate}.
      `;
      if (docType === "analisis_cp") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "ANALISIS CAPAIAN PEMBELAJARAN (ACP) KURIKULUM BERBASIS CINTA" dengan struktur, urutan, dan format tabel PERSIS seperti kerangka baku di bawah ini. Jangan mengubah urutan bagian (A\u2013H), jangan menghilangkan kolom, dan jangan menyingkat isi tabel.

[DATA IDENTITAS GURU & MADRASAH]:
- Kantor / Yayasan: ${kemenagOffice}
- Satuan Pendidikan: ${schoolName}
- Mata Pelajaran: ${subject} (${singkatanMapel})
- Fase / Kelas: ${level}
- Tahun Pelajaran: ${year}
- Nama Guru: ${teacher} (NIP/NUPTK: ${nipTeacher})
- Nama Kepala Sekolah: ${principal} (NIP: ${nipPrincipal})
- Rasional & Elemen CP: ${cpRasional} 
 ${cpElemen}

STRUKTUR DOKUMEN (WAJIB PERSIS URUTAN A-H):
KOP DOKUMEN:
KEMENTERIAN AGAMA REPUBLIK INDONESIA
${kemenagOffice}
${schoolName.toUpperCase()}
[Alamat Lengkap Madrasah]
Judul: ANALISIS CAPAIAN PEMBELAJARAN
Sub-judul: Kurikulum Berbasis Cinta (KBC) | Tahun Pelajaran ${year}

A. IDENTITAS (Tabel 2 kolom: Label | Isi, 6 baris)
B. RASIONAL MATA PELAJARAN (Tabel 3 kolom: No | Uraian | Deskripsi \u2014 3 baris: 1. Pentingnya Mapel & Panca Cinta, 2. Kaitan dengan 8 Dimensi Profil Lulusan & 10 Nilai PPRA, 3. Orientasi Pembelajaran)
C. TUJUAN MATA PELAJARAN (Tabel 3 kolom: No | Tujuan | Indikator Umum \u2014 2-3 baris terukur)
D. KARAKTERISTIK MATA PELAJARAN & ELEMEN CP (Tabel 4 kolom: No | Elemen | Deskripsi Elemen | Cakupan Konten Utama)
E. CAPAIAN PEMBELAJARAN FASE ${level} (Tabel 4 kolom: Fase | Capaian Pembelajaran | Kompetensi Kunci | Konten/Materi Pokok)
F. PENJABARAN KATA KERJA OPERASIONAL (KKO) PER ELEMEN (Tabel 3 kolom: No | Elemen | KKO & Arah Tujuan Pembelajaran \u2014 sertakan KKO Bloom tinggi, Panca Cinta, & nilai PPRA konkret)
G. KETERKAITAN DENGAN 10 NILAI PPRA (Tabel 4 kolom: No | Dimensi Profil Lulusan | Elemen Terkait | Relevansi \u2714 \u2014 WAJIB 10 baris urut: Ta'addub, Qudwah, Muwa\u1E6Danah, Tawassu\u1E6D, Taw\u0101zun, I'tid\u0101l, Mus\u0101wah, Sy\u016Br\u0101, Tas\u0101muh, Tathawwur wa Ibtik\u0101r)
H. INTEGRASI NILAI PPRA DALAM PEMBELAJARAN (Tabel 4 kolom: No | Nilai PPRA | Deskripsi Nilai | Integrasi dalam Kegiatan Pembelajaran \u2014 WAJIB 10 baris urut sesuai Bagian G)

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

TUGAS: Buatkan dokumen "ALUR TUJUAN PEMBELAJARAN (ATP) KURIKULUM BERBASIS CINTA" \u2014 pengurutan logis-hierarkis seluruh TP dalam satu fase dengan struktur PERSIS seperti kerangka baku di bawah ini.

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
B. ALUR URUTAN TUJUAN PEMBELAJARAN DALAM SATU FASE (Kotak Diagram Alur Horizontal [KODE-TP-001] \u2192 [KODE-TP-002] \u2192 ... dihubungkan tanda panah, dilengkapi Legenda \u25A0 Hitam = Pembuka, \u25A1 Putih = Lanjutan)
C. TABEL ALUR TUJUAN PEMBELAJARAN (Tabel 9 kolom: No | Kode TP | Elemen CP | Tujuan Pembelajaran | Materi Pokok | Aspek Kompetensi | Integrasi Nilai (PC & PPRA) | Alokasi JP | Semester). Dikelompokkan per baris elemen.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.2cm; } }).
`;
      } else if (docType === "prota") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "PROGRAM TAHUNAN (PROTA) KURIKULUM BERBASIS CINTA" \u2014 pemetaan seluruh TP ke minggu efektif kalender akademik dalam satu tahun ajaran.

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
B. DISTRIBUSI MINGGU EFEKTIF \u2014 KALENDER PENDIDIKAN (Tabel 7 kolom: Sem. | Bulan | Minggu Kalender | Tdk Efektif | Efektif | JP | Keterangan). Sertakan Subtotal Sem 1, Subtotal Sem 2, & TOTAL KESELURUHAN.
C. RENCANA PROGRAM TAHUNAN (Tabel 7 kolom: No | Kode TP | Tujuan Pembelajaran & Materi Pokok | Elemen CP | Integrasi Nilai (KBC & PPRA) | Alokasi JP | Semester). Sertakan header kelompok Semester 1 & Semester 2, serta baris CADANGAN.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "prosem") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "PROGRAM SEMESTER (PROSEM) KURIKULUM BERBASIS CINTA" \u2014 jadwal distribusi pembelajaran mingguan per semester.

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

BLOK INFORMASI HEADER & Legenda Warna: [\u25A0 biru] JP Aktif Pembelajaran, [\u25A0 abu] Libur, [\u25A0 kuning] PTS, [\u25A0 merah] PAS.
TABEL DISTRIBUSI PEMBELAJARAN (Grid mingguan: No | Kode TP | Tujuan Pembelajaran & Materi Pokok | JP | Integrasi Nilai (KBC & PPRA) | Kolom M1..M5 per bulan Juli-Desember & Januari-Juni).
KETERANGAN: Catatan minggu tidak efektif per bulan & Catatan Semester.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.0cm; } }).
`;
      } else if (docType === "kktp") {
        docPrompt = `
${generalKbcRules}

TUGAS: Buatkan dokumen "KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) KURIKULUM BERBASIS CINTA" \u2014 rubrik 4 level capaian untuk setiap TP.

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
A. DESKRIPSI LEVEL CAPAIAN (Tabel 6 kolom: Level | Skor | Deskripsi Umum | Tindak Lanjut | Rentang Nilai | Predikat \u2014 Level 1 Mulai Berkembang 0-55, Level 2 Layak \u2713 KKTP 56-70, Level 3 Cakap 71-85, Level 4 Mahir 86-100).
B. RUBRIK KKTP PER TUJUAN PEMBELAJARAN (Tabel 5 kolom utama dengan sub-kolom 4 level: Mulai Berkembang (1), Layak (2) \u2713 KKTP, Cakap (3), Mahir (4)). Tulis deskriptor progresi bertingkat yang kaya nilai PPRA & Panca Cinta.
CATATAN PENTING AMBANG BATAS KETUNTASAN.
PENUTUP / PENGESAHAN (${cityDate}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.2cm; } }).
`;
      } else if (docType === "modul_ajar") {
        docPrompt = `
${generalKbcRules}

PERAN & KONTEKS
Kamu adalah Ahli Kurikulum dan Pengembang Perangkat Ajar berpengalaman di satuan pendidikan naungan Kementerian Agama RI, menguasai penyusunan Modul Ajar berbasis Deep Learning (Mindful, Meaningful, Joyful Learning) yang diintegrasikan penuh dengan Kurikulum Berbasis Cinta (KBC) \u2014 Panca Cinta dan 10 Nilai PPRA (Profil Pelajar Rahmatan lil 'Alamin).

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

BAGIAN A \u2014 INFORMASI UMUM
- Tabel identitas: Nama Penyusun, Satuan Pendidikan, Mata Pelajaran, Fase/Kelas, Kode & Judul TP, Elemen CP, Alokasi Waktu, Model Pembelajaran, Moda, Tahun Pelajaran
- B. Identifikasi Kesiapan Peserta Didik (1 paragraf naratif mengaitkan capaian belajar sebelumnya dengan TP ini)
- C. Karakteristik Materi Pelajaran (1 paragraf: sifat materi, tingkat kesulitan, relevansi lokal: ${topikLokal})
- 1. Tujuan Pembelajaran (1 kalimat utuh memuat kompetensi + nilai KBC yang ditumbuhkan)
- 2. Kompetensi Awal/Prasyarat (tabel: No | Kompetensi Prasyarat | Cara Mengecek)
- 3. 8 Dimensi Profil Lulusan (pilih 2 dimensi paling relevan; tabel: No | Dimensi | Deskripsi Perwujudan, setiap deskripsi WAJIB diakhiri anotasi "(PC: [Panca Cinta] | PPRA: [Nilai])")
- 3a. Integrasi KBC: baris terpisah "Panca Cinta: [...]" dan "Nilai PPRA: [...]" (pilih 2-3 nilai paling relevan dari 10 Nilai PPRA)
- 4. Sarana & Prasarana (tabel: Kategori | Rincian | Keterangan)
- 5. Target Peserta Didik & Diferensiasi (3 kolom: Reguler/Tipikal | Kesulitan Belajar | Berbakat/Cepat \u2014 masing-masing berisi Sasaran & Perlakuan)

BAGIAN B \u2014 KOMPONEN INTI
- 6. Pemahaman Bermakna (kotak bertekstur naratif-reflektif, mengaitkan materi dengan minimal 1 istilah PPRA, misal Tathawwur wa Ibtik\u0101r / Sy\u016Br\u0101 / I'tid\u0101l)
- 7. Pertanyaan Pemantik (tabel: No | Pertanyaan | Tujuan Pertanyaan, 3 butir)
- 8. Asesmen Diagnostik:
  8a. Non-Kognitif (tabel: No | Pertanyaan Refleksi | Tujuan Diagnostik, 3 butir)
  8b. Kognitif (tabel: No | Indikator | Bentuk Soal | Tindak Lanjut, 3 butir) + 5 contoh soal campuran (isian, PG, terbuka)
- 9. KEGIATAN PEMBELAJARAN \u2014 cantumkan nama model (${learningModel}) & urutan sintak lengkap (${sintakModel}) di awal.
  UNTUK SETIAP PERTEMUAN (Pertemuan 1 s.d. ${jumlahPertemuan}), wajib memuat:
  a. Judul pertemuan bertema naratif + Alokasi (${jpPerPertemuan} JP & ${Number(jpPerPertemuan) * 45} menit) + Sintak yang dicakup + Fokus
  b. Tujuan Pertemuan (3 butir: Keterampilan, Pengetahuan, Sikap)
  c. \u25CF PEMBUKA (15 menit) \u2014 prinsip Deep Learning + integrasi KBC (PC & PPRA), tabel 2 kolom (Aktivitas Guru | Aktivitas Siswa) berpasangan No, 5 baris, SETIAP baris aktivitas guru MAUPUN siswa diakhiri anotasi "(PC: ... | PPRA: ...)"
  d. SINTAK [n] [Nama Sintak] (durasi menit) \u2014 prinsip pembelajaran + integrasi KBC, tabel sama seperti di atas (5 baris)
  e. Ulangi (d) untuk setiap sintak dalam pertemuan tsb (${sintakModel})
  f. \u25CF PENUTUP (15 menit) \u2014 format sama, 5 baris
  Total menit per pertemuan harus sama dengan alokasi ${jpPerPertemuan} JP \xD7 45 menit (${Number(jpPerPertemuan) * 45} menit).
- 10. Asesmen Formatif (tabel: No | Teknik | Instrumen | Waktu Pelaksanaan | Aspek yang Dinilai, satu baris per pertemuan) + 5 contoh soal proses pembelajaran
- 11. Asesmen Sumatif (tabel: No | Komponen | Deskripsi Tugas | Bobot | Acuan KKTP; bobot harus total 100%)
- 12. Pengayaan & Remedial (3 kolom: Remedial | Reguler | Pengayaan, masing-masing berisi Sasaran, Kegiatan, Waktu)
- 13. Refleksi Guru & Peserta Didik (2 kolom, masing-masing 3-4 pertanyaan reflektif, refleksi guru memuat kata "teladan (Qudwah)")

BAGIAN C \u2014 LAMPIRAN
- Deskripsi singkat tiap lampiran (LKPD, lembar penilaian sahabat, dsb.)
- Glosarium (3 istilah kunci materi)
- Daftar Pustaka (format APA, minimal Kemendikbudristek CP + 1 buku ajar)
- Blok tanda tangan: ${cityDate} | Mengetahui Kepala Madrasah (${principal}, NIP: ${nipPrincipal}) \u2014 Dibuat oleh Guru Mata Pelajaran (${teacher}, NIP: ${nipTeacher}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "lkpd") {
        docPrompt = `
${generalKbcRules}

PERAN & KONTEKS
Kamu adalah Ahli Kurikulum dan Pengembang Perangkat Ajar berpengalaman di satuan pendidikan naungan Kementerian Agama RI, menguasai penyusunan LKPD berbasis Deep Learning (Mindful, Meaningful, Joyful Learning) yang diintegrasikan penuh dengan Kurikulum Berbasis Cinta (KBC) \u2014 Panca Cinta dan 10 Nilai PPRA.

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
- Judul LKPD + subjudul tematik (mis. "Lembar Penilaian Sahabat (Sy\u016Br\u0101) & Eksplorasi ${topikLokal}")
- Identitas kelompok & tanggal dalam tabel 2 kolom (Nama Kelompok, Anggota 1-4, Tanggal, Kelas)
- Petunjuk pengerjaan singkat (1 paragraf memuat nilai PPRA yang ditekankan)
- Bagian-bagian LKPD mengikuti PERSIS urutan sintak model pembelajaran ${learningModel} (${sintakModel}) (huruf A, B, C, ...), masing-masing berupa tabel isian atau kotak jawaban kosong bergaris (misal ______________)
- Sertakan bagian Refleksi Akhir Peserta Didik (jika pertemuan terakhir/proyek akhir)
- Lembar Penilaian Sahabat di akhir jika ada nilai Sy\u016Br\u0101/kolaborasi: tabel indikator (4 butir) dengan 3 kolom checklist (Sangat Baik | Baik | Perlu Bimbingan)
- Blok tanda tangan: ${cityDate} | Mengetahui Kepala Madrasah (${principal}, NIP: ${nipPrincipal}) \u2014 Dibuat oleh Guru Mata Pelajaran (${teacher}, NIP: ${nipTeacher}).
Layout: A4 Portrait (@media print { @page { size: A4 portrait; margin: 1.2cm; } }).
`;
      } else if (docType === "rubrik") {
        docPrompt = `
${generalKbcRules}

PERAN & KONTEKS
Kamu adalah Ahli Kurikulum dan Pengembang Perangkat Ajar berpengalaman di satuan pendidikan naungan Kementerian Agama RI, menguasai penyusunan Rubrik Penilaian Formatif & Sumatif berbasis Kurikulum Berbasis Cinta (KBC) \u2014 Panca Cinta dan 10 Nilai PPRA.

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
  C. Penilaian Integrasi Nilai (KBC & PPRA) \u2014 kriteria = Panca Cinta + Nilai PPRA terpilih
- "RUBRIK PENILAIAN SUMATIF KURIKULUM BERBASIS CINTA" \u2014 judul TP sama + metadata, lalu Komponen Penilaian (list persentase, total 100%) dan tabel rubrik 6 kolom (No | Kriteria | 4 | 3 | 2/1 digabung | Bobot), Total Bobot 100%
- Blok tanda tangan: ${cityDate} | Mengetahui Kepala Madrasah (${principal}, NIP: ${nipPrincipal}) \u2014 Dibuat oleh Guru Mata Pelajaran (${teacher}, NIP: ${nipTeacher}).
Layout: A4 Landscape (@media print { @page { size: A4 landscape; margin: 1.0cm; } }).
`;
      } else {
        docPrompt = `Buatkan Dokumen Perangkat Ajar Kurikulum Berbasis Cinta (KBC) Kemenag untuk ${schoolName}, mapel ${subject}, ${level}, tahun ${year}, guru ${teacher}. Hasilkan MURNI HTML lengkap dengan Kop Kemenag/Sekolah, Tabel Rapi, dan Tanda Tangan Penutup.`;
      }
      let htmlOutput = "";
      try {
        const contents = [{ role: "user", parts: [{ text: docPrompt }] }];
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("AI generation timed out after 25s")), 25e3)
        );
        const response = await Promise.race([
          generateContentWithRetry(ai, contents),
          timeoutPromise
        ]);
        htmlOutput = response?.text || "";
        htmlOutput = htmlOutput.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      } catch (aiErr) {
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
    } catch (err) {
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
      } catch (fallbackErr) {
        res.status(500).json({
          status: "error",
          message: err?.message || "Terjadi kesalahan saat memproses Perangkat Ajar KBC."
        });
      }
    }
  });
  return app2;
}
async function startServer() {
  const app2 = createApiApp();
  const PORT = Number(process.env.PORT) || 3e3;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app2.use(express.static(distPath));
    app2.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server EdAdmin Pro running on http://0.0.0.0:${PORT}`);
  });
  return app2;
}
var isServerless = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
);
var isDirectExecution = Boolean(
  process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.cjs") || process.argv[1]?.endsWith("server.js")
);
if (!isServerless && isDirectExecution) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

// src/api-serverless.ts
var app = createApiApp();
var api_serverless_default = app;
export {
  api_serverless_default as default
};
