import { ATHIRAH_LOGO_BASE64 } from "./athirahLogo";

export interface AthirahModulInput {
  namaGuru?: string;
  nipGuru?: string;
  namaSekolah?: string;
  npsn?: string;
  alamatSekolah?: string;
  pemerintah?: string;
  namaKepsek?: string;
  nipKepsek?: string;
  tempatTtd?: string;
  tanggalTtd?: string;
  logoKiri?: string;
  logoKanan?: string;
  sertakanKop?: boolean;
  sertakanTtd?: boolean;
  sertakanLkpd?: boolean;
  sertakanLampiran017?: boolean;
  tahunAjaran?: string;
  semester?: string;
  jenjang?: string;
  fase?: string;
  kelas?: string;
  mataPelajaran?: string;
  topik?: string;
  waktu?: string;
  jumlahPertemuan?: string | number;
  model?: string;
  karakteristik?: string;
  tujuan?: string;
  formatOutput?: string;
  templateCategory?: "bawaan" | "sekolah";
  docNumberIso?: string;
  programKhas?: string;
  kepemimpinan?: string;
  spiritualisasi?: string;
}

/**
 * Menghasilkan KOP Resmi Sekolah Islam Athirah sesuai persis dengan:
 * - 015 Formulir-Modul Ajar.docx (word/header1.xml)
 * - 017 Formulir-Lampiran Asesmen dalam MA.docx (word/header2.xml)
 *
 * Struktur Tabel: 5 Kolom x 5 Baris, Font Arial 8pt, Border 1px solid #000000,
 * Logo Sekolah Islam Athirah berada di kolom paling kanan (rowspan="5").
 */
export function buildAthirahIsoKopTable(options: {
  formTitle: "MODUL AJAR" | "LAMPIRAN ASESMEN DALAM RPP/MA" | "LEMBAR KERJA PESERTA DIDIK (LKPD)";
  docNumber: string;
  revisi?: string;
  tanggalTerbit?: string;
  halaman?: string;
}): string {
  const {
    formTitle,
    docNumber,
    revisi = "00",
    tanggalTerbit = "17/09/2025",
    halaman = formTitle === "LAMPIRAN ASESMEN DALAM RPP/MA" ? "2 dari 2" : "1 dari 5"
  } = options;

  const cellBase =
    "border: 1px solid #000000; padding: 3px 6px; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #000000; line-height: 1.2;";

  return `
    <table class="iso-kop-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 10px; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #000000;">
      <colgroup>
        <col style="width: 14.5%;" />
        <col style="width: 39.1%;" />
        <col style="width: 15.5%;" />
        <col style="width: 16.4%;" />
        <col style="width: 14.5%;" />
      </colgroup>
      <tbody>
        <tr>
          <td colspan="4" style="${cellBase} text-align: center; vertical-align: middle;">FORMULIR</td>
          <td rowspan="5" style="${cellBase} text-align: center; vertical-align: middle; padding: 4px;">
            <img src="${ATHIRAH_LOGO_BASE64}" alt="Sekolah Islam Athirah" class="logo-athirah-kop" style="width: 66px; max-width: 66px; height: auto; max-height: 66px; display: block; margin: 0 auto; object-fit: contain;" />
          </td>
        </tr>
        <tr>
          <td colspan="4" style="${cellBase} text-align: center; vertical-align: middle;">${formTitle}</td>
        </tr>
        <tr>
          <td rowspan="3" style="${cellBase} text-align: left; vertical-align: middle;">NO. DOKUMEN</td>
          <td rowspan="3" style="${cellBase} text-align: center; vertical-align: middle;">${docNumber}</td>
          <td style="${cellBase} text-align: left; vertical-align: middle;">Revisi</td>
          <td style="${cellBase} text-align: center; vertical-align: middle;">${revisi}</td>
        </tr>
        <tr>
          <td style="${cellBase} text-align: left; vertical-align: middle;">Tanggal Terbit</td>
          <td style="${cellBase} text-align: center; vertical-align: middle;">${tanggalTerbit}</td>
        </tr>
        <tr>
          <td style="${cellBase} text-align: left; vertical-align: middle;">Halaman</td>
          <td style="${cellBase} text-align: center; vertical-align: middle;">${halaman}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Helper ayat & hadits spiritualisasi otomatis sesuai mata pelajaran / topik
 */
export function getDefaultSpiritualisasi(mapel: string = "", topik: string = "", customSpiritualisasi?: string): string {
  if (customSpiritualisasi && customSpiritualisasi.trim()) {
    return customSpiritualisasi.trim();
  }
  const m = `${mapel} ${topik}`.toLowerCase();
  if (m.includes("matematika") || m.includes("bilangan") || m.includes("aljabar") || m.includes("data")) {
    return `<strong>QS. Al-Qamar [54]: 49</strong> — <em>"Sesungguhnya Kami menciptakan segala sesuatu menurut ukuran (perhitungan yang teliti)."</em> &amp; <strong>QS. Yunus [10]: 5</strong> tentang keteraturan perhitungan waktu dan bilangan sebagai tanda kebesaran Allah SWT. Peserta didik menyadari bahwa ketelitian berpikir logis dan matematis merupakan bagian dari syukur atas karunia akal.`;
  }
  if (m.includes("ipa") || m.includes("sains") || m.includes("fisika") || m.includes("biologi") || m.includes("ekosistem") || m.includes("zat")) {
    return `<strong>QS. Ali 'Imran [3]: 190–191</strong> — <em>"Sesungguhnya dalam penciptaan langit dan bumi, dan silih bergantinya malam dan siang terdapat tanda-tanda bagi orang-orang yang berakal (Ulul Albab)..."</em> Peserta didik mentadabburi keteraturan hukum alam (sunnatullah) melalui pengamatan ilmiah yang jujur dan bertanggung jawab menjaga kelestarian alam.`;
  }
  if (m.includes("bahasa") || m.includes("indonesia") || m.includes("inggris") || m.includes("teks") || m.includes("komunikasi")) {
    return `<strong>QS. Ar-Rahman [55]: 1–4</strong> — <em>"(Allah) Yang Maha Pengasih, Yang telah mengajarkan Al-Qur'an. Dia menciptakan manusia, mengajarnya pandai berbicara (al-bayan)."</em> &amp; <strong>QS. Al-Ahzab [33]: 70</strong> tentang berkata benar (<em>qaulan sadida</em>). Peserta didik menggunakan kemampuan berbahasa dan <strong>Public Speaking</strong> untuk menyampaikan kebenaran secara santun dan berdampak positif.`;
  }
  if (m.includes("informatika") || m.includes("komputer") || m.includes("algoritma") || m.includes("tik")) {
    return `<strong>QS. Al-Hujurat [49]: 6</strong> — <em>"Wahai orang-orang yang beriman! Jika seseorang yang fasik datang kepadamu membawa suatu berita, maka telitilah kebenarannya (tabayyun)..."</em> &amp; <strong>QS. Al-Mujadilah [58]: 11</strong>. Peserta didik memanfaatkan teknologi informasi dan berpikir komputasional secara beretika, cerdas, dan bermanfaat bagi umat.`;
  }
  return `<strong>QS. Al-Mujadilah [58]: 11</strong> — <em>"Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat."</em> &amp; Hadits Nabi SAW: <em>"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya."</em> (HR. Ahmad).`;
}

/**
 * Menghasilkan LKPD Lengkap untuk Setiap Pertemuan (Pertemuan 1 s.d. N)
 * Terintegrasi dengan Program Khas "Public Speaking" dan Deep Learning (Mindful, Meaningful, Joyful).
 */
export function buildPerMeetingLkpdHtml(
  formData: AthirahModulInput,
  optionsOrMeeting?: { selectedMeeting?: number; standalone?: boolean } | number | null,
  standaloneArg?: boolean
): string {
  const options: { selectedMeeting?: number; standalone?: boolean } =
    typeof optionsOrMeeting === "number"
      ? { selectedMeeting: optionsOrMeeting, standalone: standaloneArg }
      : optionsOrMeeting || { standalone: standaloneArg };
  const mapel = formData.mataPelajaran || "Mata Pelajaran";
  const topik = formData.topik || "Materi Pokok Pembelajaran";
  const kelas = formData.kelas || "VII";
  const fase = formData.fase || "Fase D";
  const namaSekolah = formData.namaSekolah || "Sekolah Islam Athirah";
  const namaGuru = formData.namaGuru || "Guru Mata Pelajaran";
  const programKhas = formData.programKhas?.trim() || "Public Speaking";
  const waktu = formData.waktu || "2 x 45 Menit";
  const totalPertemuan = Math.min(8, Math.max(1, parseInt(String(formData.jumlahPertemuan || "2"), 10) || 2));
  const isAthirah = formData.formatOutput === "sekolah_format1_iso" || formData.templateCategory === "sekolah" || formData.sertakanKop !== false;

  const subFocusLabels = [
    "Konsep Fundamental, Observasi Kontekstual & Identifikasi Masalah",
    "Investigasi Terbimbing, Analisis Data & Pemecahan Masalah Kolaboratif",
    "Elaborasi Kasus Lanjutan, Sintesis Solusi & Unjuk Kerja Public Speaking",
    "Evaluasi Komprehensif, Proyek Aksi Nyata & Refleksi Metakognitif",
    "Pendalaman Aplikasi Lintas Disiplin & Gelar Karya Argumentatif",
    "Simulasi Pemecahan Masalah Kompleks & Evaluasi Sejawat",
    "Penguatan Kompetensi Esensial & Presentasi Publik Terbuka",
    "Asesmen Sumatif Terpadu & Refleksi Akhir Bab"
  ];

  const cellStyle =
    "border: 1px solid #000000; padding: 6px 8px; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; vertical-align: top; line-height: 1.35;";
  const headerCellStyle =
    "border: 1px solid #000000; padding: 6px 8px; background-color: #9CC2E5; font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; color: #000000; text-align: center; vertical-align: middle;";

  const lkpdPages: string[] = [];
  const startP = options?.selectedMeeting && options.selectedMeeting >= 1 ? options.selectedMeeting : 1;
  const endP = options?.selectedMeeting && options.selectedMeeting >= 1 ? Math.min(totalPertemuan, options.selectedMeeting) : totalPertemuan;

  for (let p = startP; p <= endP; p++) {
    const subFokus = subFocusLabels[(p - 1) % subFocusLabels.length];
    const kopHtml = isAthirah
      ? buildAthirahIsoKopTable({
          formTitle: "LEMBAR KERJA PESERTA DIDIK (LKPD)",
          docNumber: `015-LKPD-${p}/F/KUR/00/IX/2025`,
          revisi: "00",
          tanggalTerbit: "17/09/2025",
          halaman: `${p} dari ${totalPertemuan}`
        })
      : "";

    const needPageBreak = !(options?.standalone && p === startP);

    lkpdPages.push(`
      ${needPageBreak ? '<div class="page-break" style="page-break-before: always; margin-top: 24px;"></div>' : ""}
      <div class="lkpd-pertemuan-container" style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; line-height: 1.35;">
        ${kopHtml}

        <div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin: 8px 0 10px 0; line-height: 1.35;">
          <div>LEMBAR KERJA PESERTA DIDIK (LKPD) — PERTEMUAN KE-${p}</div>
          <div>${namaSekolah}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="${cellStyle} width: 22%; background-color: #f8fafc;"><strong>Satuan Pendidikan</strong></td>
              <td style="${cellStyle} width: 28%;">${namaSekolah}</td>
              <td style="${cellStyle} width: 22%; background-color: #f8fafc;"><strong>Nama Siswa / Kelompok</strong></td>
              <td style="${cellStyle} width: 28%;">....................................................</td>
            </tr>
            <tr>
              <td style="${cellStyle} background-color: #f8fafc;"><strong>Mata Pelajaran</strong></td>
              <td style="${cellStyle}">${mapel}</td>
              <td style="${cellStyle} background-color: #f8fafc;"><strong>Kelas / Fase / Semester</strong></td>
              <td style="${cellStyle}">${kelas} / ${fase} / ${formData.semester || "Ganjil"}</td>
            </tr>
            <tr>
              <td style="${cellStyle} background-color: #f8fafc;"><strong>Materi Pokok (Bab)</strong></td>
              <td style="${cellStyle}"><strong>${topik}</strong></td>
              <td style="${cellStyle} background-color: #f8fafc;"><strong>Pertemuan / Alokasi</strong></td>
              <td style="${cellStyle}"><strong>Pertemuan Ke-${p} dari ${totalPertemuan}</strong> (${waktu})</td>
            </tr>
            <tr>
              <td style="${cellStyle} background-color: #f8fafc;"><strong>Sub-Fokus Pertemuan ${p}</strong></td>
              <td style="${cellStyle}">${subFokus}</td>
              <td style="${cellStyle} background-color: #f8fafc;"><strong>Program Khas</strong></td>
              <td style="${cellStyle}"><strong>${programKhas}</strong></td>
            </tr>
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 10px;">
          <thead>
            <tr>
              <th style="${headerCellStyle} width: 24%;">Komponen LKPD</th>
              <th style="${headerCellStyle} width: 76%;">Uraian Aktivitas &amp; Lembar Kerja Pertemuan Ke-${p}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${cellStyle} font-weight: bold; text-align: center;">A. Tujuan Pembelajaran &amp; Petunjuk Kerja</td>
              <td style="${cellStyle}">
                <strong>Tujuan Pembelajaran Pertemuan Ke-${p}:</strong><br/>
                Melalui kegiatan eksplorasi, diskusi kolaboratif, dan unjuk kerja <strong>${programKhas}</strong>, peserta didik mampu menguasai <em>${subFokus.toLowerCase()}</em> pada topik <strong>${topik}</strong> secara bernalar kritis dan bertanggung jawab.<br/><br/>
                <strong>Petunjuk Pengerjaan:</strong>
                <ol style="margin: 4px 0 0 18px; padding: 0;">
                  <li>Awali kegiatan dengan berdoa dan membaca pengantar fenomena secara saksama (<span style="color: #0070C0; font-weight: bold;">Berkesadaran / Mindful</span>).</li>
                  <li>Diskusikan permasalahan bersama kelompok dan tuliskan analisis pada kolom yang tersedia (<span style="color: #00B050; font-weight: bold;">Bermakna / Meaningful</span>).</li>
                  <li>Siapkan poin bicara dan tampilkan hasil karya kelompok melalui sesi <strong>${programKhas}</strong> di depan kelas dengan percaya diri (<span style="color: #ED7D31; font-weight: bold;">Menggembirakan / Joyful</span>).</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="${cellStyle} font-weight: bold; text-align: center;">
                B. Aktivitas 1:<br/>
                <span style="color: #0070C0;">Memahami &amp; Eksplorasi Konsep</span>
              </td>
              <td style="${cellStyle}">
                <strong>Stimulus Kontekstual Pertemuan Ke-${p}:</strong><br/>
                Amatilah fenomena/kasus nyata di lingkungan sekitar yang berkaitan dengan <strong>${topik}</strong> (fokus: <em>${subFokus}</em>).<br/>
                <strong>1. Identifikasi konsep penting yang kalian temukan dari pengamatan tersebut:</strong>
                <div style="border: 1px dashed #64748b; padding: 14px; margin: 6px 0; min-height: 44px; background-color: #ffffff;">
                  <em>Jawaban / Hasil Pengamatan Kelompok:</em><br/><br/>
                </div>
                <strong>2. Rumuskan 1 pertanyaan kritis yang ingin kelompok kalian pecahkan pada pertemuan ke-${p} ini:</strong>
                <div style="border: 1px dashed #64748b; padding: 12px; margin: 6px 0 2px 0; min-height: 36px; background-color: #ffffff;">
                  <em>Rumusan Pertanyaan Investigasi:</em><br/><br/>
                </div>
              </td>
            </tr>
            <tr>
              <td style="${cellStyle} font-weight: bold; text-align: center;">
                C. Aktivitas 2:<br/>
                <span style="color: #00B050;">Mengaplikasi &amp; Investigasi Masalah</span>
              </td>
              <td style="${cellStyle}">
                <strong>Langkah Pemecahan Masalah / Analisis Data Pertemuan Ke-${p}:</strong><br/>
                Kerjakan soal tantangan dan pemodelan kasus <strong>${topik}</strong> berikut secara sistematis bersama kelompokmu:
                <div style="border: 1px solid #94a3b8; padding: 16px; margin: 6px 0; min-height: 75px; background-color: #ffffff;">
                  <strong>Analisis Langkah demi Langkah &amp; Bukti Pendukung:</strong><br/><br/><br/>
                </div>
                <strong>Simpulan Solusi Kelompok pada Pertemuan Ke-${p}:</strong>
                <div style="border: 1px dashed #64748b; padding: 12px; margin: 6px 0 2px 0; min-height: 38px; background-color: #ffffff;">
                  <em>Simpulan:</em><br/><br/>
                </div>
              </td>
            </tr>
            <tr>
              <td style="${cellStyle} font-weight: bold; text-align: center;">
                D. Aktivitas 3:<br/>
                <span style="color: #ED7D31;">Program Khas: ${programKhas}</span>
              </td>
              <td style="${cellStyle}">
                <strong>Panggung ${programKhas} (Presentasi Lisan &amp; Argumentasi Ilmiah):</strong><br/>
                Susun kerangka bicara (<em>speech outline</em>) berdurasi 2–3 menit untuk mempresentasikan temuan kelompokmu di depan kelas:
                <ul style="margin: 4px 0 6px 18px; padding: 0;">
                  <li><strong>Pembuka (Hook &amp; Salam):</strong> ............................................................................................................</li>
                  <li><strong>Inti Argumen / Temuan Utama:</strong> ................................................................................................</li>
                  <li><strong>Penutup &amp; Pesan Spiritualisasi / Nilai Hikmah:</strong> ....................................................................</li>
                </ul>
                <div style="font-size: 10pt; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px;">
                  <strong>Indikator Penilaian ${programKhas}:</strong> (1) Kejelasan artikulasi &amp; intonasi suara, (2) Keruntutan logika materi <em>${topik}</em>, (3) Kontak mata &amp; bahasa tubuh percaya diri, (4) Kesantunan menanggapi pertanyaan audiens.
                </div>
              </td>
            </tr>
            <tr>
              <td style="${cellStyle} font-weight: bold; text-align: center;">E. Latihan Mandiri &amp; Refleksi Diri</td>
              <td style="${cellStyle}">
                <strong>Uji Pemahaman Individu Pertemuan Ke-${p}:</strong>
                <ol style="margin: 4px 0 6px 18px; padding: 0;">
                  <li>Jelaskan dengan bahasamu sendiri konsep inti dari <em>${subFokus}</em> pada materi <strong>${topik}</strong>!</li>
                  <li>Bagaimana penerapan konsep pertemuan ke-${p} ini dalam menyelesaikan persoalan nyata sehari-hari?</li>
                </ol>
                <strong>Refleksi Peserta Didik (<span style="color: #0070C0;">Mindful</span>, <span style="color: #00B050;">Meaningful</span>, <span style="color: #ED7D31;">Joyful</span>):</strong><br/>
                &bull; Hal baru paling bermakna yang saya pahami hari ini: ....................................................................................<br/>
                &bull; Perasaan &amp; keberanian saya saat tampil <strong>${programKhas}</strong> hari ini: [ &nbsp; ] Sangat Percaya Diri &nbsp; [ &nbsp; ] Baik &nbsp; [ &nbsp; ] Perlu Latihan<br/>
                &bull; Nilai Paraf Guru (${namaGuru}): ......................... &nbsp; | &nbsp; Skor LKPD Pertemuan ${p}: ............ / 100
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `);
  }

  return lkpdPages.join("\n");
}

/**
 * Menghasilkan Dokumen Lengkap sesuai 100% tanpa kesalahan dengan:
 * 1. d:\ATHIRAH\015 Formulir-Modul Ajar.docx (KOP Arial 8pt + Logo Athirah kanan rowspan=5, Judul Times New Roman 12pt Bold Center, Tabel 14 Baris R0..R13 dengan Header #9CC2E5, Program Khas = "Public Speaking", warna PM Biru/Hijau/Oranye, serta blok Asesmen MH/MA/MR 1/2/3).
 * 2. d:\ATHIRAH\017 Formulir-Lampiran Asesmen dalam MA.docx (KOP 017 + Tabel 7 Kolom Header #9CC2E5).
 * 3. LKPD Setiap Pertemuan (Pertemuan 1 s.d. N).
 */
export function buildExactAthirahModulHtml(formData: AthirahModulInput): string {
  const namaSekolah = formData.namaSekolah || "Sekolah Islam Athirah";
  const namaGuru = formData.namaGuru || "Ahmad Rifky Ridha, S.Pd., M.Pd.";
  const nipGuru = formData.nipGuru || "-";
  const namaKepsek = formData.namaKepsek || "Kepala Sekolah Islam Athirah";
  const nipKepsek = formData.nipKepsek || "-";
  const tempatTtd = formData.tempatTtd || "Makassar";
  const tanggalTtd =
    formData.tanggalTtd ||
    new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const tahunAjaran = formData.tahunAjaran || "2025/2026";
  const semester = formData.semester || "Ganjil";
  const kelas = formData.kelas || "VIII";
  const fase = formData.fase || "Fase D";
  const mapel = formData.mataPelajaran || "Matematika";
  const topik = formData.topik || "Materi Pokok Pembelajaran";
  const waktu = formData.waktu || "4 x 45 JP";
  const jumlahPertemuan = Math.min(8, Math.max(1, parseInt(String(formData.jumlahPertemuan || "2"), 10) || 2));
  const model = formData.model || "Problem Based Learning (PBL)";
  const karakteristik =
    formData.karakteristik ||
    "Peserta didik reguler dengan keberagaman kesiapan belajar serta gaya belajar visual, auditori, dan kinestetik.";
  const docNumber015 = formData.docNumberIso || "015/F/KUR/00/IX/2025";
  // Program Khas wajib berisi "Public Speaking" sesuai instruksi pengguna
  const programKhas =
    formData.programKhas && formData.programKhas.toLowerCase().includes("public speaking")
      ? formData.programKhas
      : "Public Speaking";

  const spiritualisasiHtml = getDefaultSpiritualisasi(mapel, topik, formData.spiritualisasi);

  const rawTujuan =
    formData.tujuan && formData.tujuan.trim()
      ? formData.tujuan
          .split(/\n+/)
          .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(Boolean)
      : [
          `Peserta didik mampu memahami dan menganalisis konsep fundamental ${topik} dalam mata pelajaran ${mapel} secara mendalam dan bernalar kritis.`,
          `Peserta didik mampu menerapkan konsep ${topik} untuk memecahkan masalah kontekstual serta mempresentasikan solusinya melalui unjuk kerja ${programKhas} secara percaya diri.`
        ];

  const tujuanListHtml = `<ol style="margin: 4px 0 0 18px; padding: 0;">
    ${rawTujuan.map((t) => `<li style="margin-bottom: 3px;">${t}</li>`).join("")}
    <li style="margin-bottom: 3px;"><strong>Tujuan Spiritualisasi &amp; Karakter:</strong> Peserta didik mampu menghayati nilai keislaman terkait materi <em>${topik}</em> serta mengomunikasikan gagasan secara santun dan sistematis melalui program khas <strong>${programKhas}</strong>.</li>
  </ol>`;

  // Rincian per pertemuan untuk baris Memahami, Mengaplikasi, dan Merefleksi
  // Warna Prinsip Pembelajaran Mendalam (PM) sesuai Petunjuk Pengisian 015:
  // Biru (#0070C0) = Berkesadaran (Mindful)
  // Hijau (#00B050) = Bermakna (Meaningful)
  // Oranye (#ED7D31) = Menggembirakan (Joyful)
  const memahamiPerPertemuan: string[] = [];
  const mengaplikasiPerPertemuan: string[] = [];
  const merefleksiPerPertemuan: string[] = [];

  for (let p = 1; p <= jumlahPertemuan; p++) {
    memahamiPerPertemuan.push(`
      <div style="margin-bottom: ${p < jumlahPertemuan ? "8px" : "2px"};">
        <strong>Pertemuan Ke-${p}:</strong>
        <ul style="margin: 2px 0 0 18px; padding: 0;">
          <li><strong>Kegiatan Pembuka (10 Menit):</strong> Guru membuka kelas dengan salam, doa bersama, tadabbur singkat ayat spiritualisasi, presensi, dan pengecekan kesiapan belajar (<span style="color: #0070C0; font-weight: bold;">Berkesadaran / Mindful Learning</span>).</li>
          <li><strong>Apersepsi &amp; Pemantik:</strong> Guru menyajikan fenomena kontekstual terkait <em>${topik}</em> (Bagian ${p}) dan memantik rasa ingin tahu peserta didik melalui tanya jawab interaktif (<span style="color: #00B050; font-weight: bold;">Bermakna / Meaningful Learning</span>).</li>
          <li><strong>Eksplorasi Informasi &amp; Kognitif:</strong> Peserta didik mengamati media pembelajaran, mengidentifikasi konsep kunci pada LKPD Pertemuan Ke-${p} (Aktivitas 1), serta merumuskan pertanyaan investigasi secara antusias (<span style="color: #ED7D31; font-weight: bold;">Menggembirakan / Joyful Learning</span>).</li>
        </ul>
      </div>
    `);

    mengaplikasiPerPertemuan.push(`
      <div style="margin-bottom: ${p < jumlahPertemuan ? "8px" : "2px"};">
        <strong>Pertemuan Ke-${p}:</strong>
        <ul style="margin: 2px 0 0 18px; padding: 0;">
          <li><strong>Investigasi &amp; Elaborasi Kelompok:</strong> Peserta didik bekerja dalam kelompok heterogen menggunakan sintaks <em>${model}</em> untuk menganalisis data dan memecahkan masalah kontekstual pada <strong>LKPD Pertemuan Ke-${p}</strong> (<span style="color: #00B050; font-weight: bold;">Bermakna / Meaningful Learning</span>).</li>
          <li><strong>Transformasi &amp; Asosiatif:</strong> Peserta didik menghubungkan temuan konsep <em>${topik}</em> dengan solusi nyata serta memverifikasi kebenaran langkah penyelesaiannya secara teliti (<span style="color: #0070C0; font-weight: bold;">Berkesadaran / Mindful Learning</span>).</li>
          <li><strong>Integrasi Program Khas (${programKhas}):</strong> Setiap kelompok menyusun poin bicara dan mempresentasikan hasil karya/analisis LKPD Pertemuan Ke-${p} di depan kelas melalui praktik <strong>${programKhas}</strong> yang komunikatif, terstruktur, dan interaktif (<span style="color: #ED7D31; font-weight: bold;">Menggembirakan / Joyful Learning</span>).</li>
        </ul>
      </div>
    `);

    merefleksiPerPertemuan.push(`
      <div style="margin-bottom: ${p < jumlahPertemuan ? "8px" : "2px"};">
        <strong>Pertemuan Ke-${p}:</strong>
        <ul style="margin: 2px 0 0 18px; padding: 0;">
          <li><strong>Konfirmasi &amp; Evaluasi Sejawat:</strong> Guru bersama peserta didik memberikan apresiasi dan umpan balik konstruktif terhadap ketepatan konsep serta performa <strong>${programKhas}</strong> tiap kelompok (<span style="color: #ED7D31; font-weight: bold;">Menggembirakan / Joyful Learning</span>).</li>
          <li><strong>Refleksi Metakognitif &amp; Spiritualisasi:</strong> Peserta didik menuliskan refleksi pemahaman diri pada LKPD Pertemuan Ke-${p} serta mengambil hikmah spiritualisasi dari materi <em>${topik}</em> (<span style="color: #0070C0; font-weight: bold;">Berkesadaran / Mindful Learning</span>).</li>
          <li><strong>Kegiatan Penutup (10 Menit):</strong> Peserta didik menyimpulkan pembelajaran secara mandiri (otonom), menerima informasi tindak lanjut untuk pertemuan berikutnya, dan menutup kelas dengan doa/hamdalah (<span style="color: #00B050; font-weight: bold;">Bermakna / Meaningful Learning</span>).</li>
        </ul>
      </div>
    `);
  }

  // Styles untuk Tabel 015 Formulir-Modul Ajar.docx
  const tdBase =
    "border: 1px solid #000000; padding: 6px 8px; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; vertical-align: top; line-height: 1.35;";
  const thBlue =
    "border: 1px solid #000000; padding: 7px 8px; background-color: #9CC2E5; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; color: #000000; text-align: center; vertical-align: middle;";

  const kop015Html =
    formData.sertakanKop !== false
      ? buildAthirahIsoKopTable({
          formTitle: "MODUL AJAR",
          docNumber: docNumber015,
          revisi: "00",
          tanggalTerbit: "17/09/2025",
          halaman: "1 dari 5"
        })
      : "";

  const ttdHtml =
    formData.sertakanTtd !== false
      ? `
        <table class="ttd-table" style="width: 100%; border: none !important; border-collapse: collapse; margin-top: 22px; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000;">
          <tbody>
            <tr style="border: none !important;">
              <td style="width: 50%; border: none !important; text-align: center; vertical-align: top; padding: 4px;">
                Mengetahui,<br/>
                <strong>Kepala ${namaSekolah}</strong>
                <br/><br/><br/><br/>
                <strong><u>${namaKepsek}</u></strong><br/>
                NIP/NRP. ${nipKepsek}
              </td>
              <td style="width: 50%; border: none !important; text-align: center; vertical-align: top; padding: 4px;">
                ${tempatTtd}, ${tanggalTtd}<br/>
                <strong>Guru Mata Pelajaran</strong>
                <br/><br/><br/><br/>
                <strong><u>${namaGuru}</u></strong><br/>
                NIP/NRP. ${nipGuru}
              </td>
            </tr>
          </tbody>
        </table>
      `
      : "";

  // Baris Lampiran Asesmen 017 (7 Kolom Persis 017 Formulir-Lampiran Asesmen dalam MA.docx)
  const lampiran017Rows = Array.from({ length: jumlahPertemuan }, (_, idx) => {
    const p = idx + 1;
    const tpItem = rawTujuan[idx % rawTujuan.length] || rawTujuan[0];
    return `
      <tr>
        <td style="${tdBase}">
          <strong>${topik}</strong><br/>
          <span style="font-size: 10pt;">(Pertemuan Ke-${p})</span>
        </td>
        <td style="${tdBase}">${tpItem}</td>
        <td style="${tdBase}">
          <ul style="margin: 0 0 0 16px; padding: 0;">
            <li>Mengidentifikasi konsep esensial ${topik} pada pertemuan ke-${p} (MH-${p}).</li>
            <li>Menyelesaikan pemecahan masalah kontekstual pada LKPD Pertemuan Ke-${p} (MA-${p}).</li>
            <li>Mempresentasikan argumen ilmiah melalui unjuk kerja <strong>${programKhas}</strong> (MR-${p}).</li>
          </ul>
        </td>
        <td style="${tdBase} text-align: center;">
          <strong>Tulis</strong> &amp; <strong>Nontulis</strong><br/>
          <span style="font-size: 10pt;">(Tes Tertulis &amp; Unjuk Kerja ${programKhas})</span>
        </td>
        <td style="${tdBase}">
          <ol style="margin: 0 0 0 16px; padding: 0;">
            <li>Jelaskan konsep utama dan prinsip dasar pada materi <em>${topik}</em> pertemuan ke-${p}!</li>
            <li>Selesaikan studi kasus kontekstual pada LKPD Pertemuan Ke-${p} beserta langkah analisisnya secara sistematis!</li>
          </ol>
        </td>
        <td style="${tdBase}">
          <strong>Observasi Diskusi &amp; Unjuk Kerja ${programKhas}:</strong><br/>
          Peserta didik mempresentasikan hasil eksplorasi LKPD Pertemuan Ke-${p} di depan kelas selama 2–3 menit dengan penilaian aspek: (1) Kejelasan artikulasi lisan, (2) Ketepatan argumen konsep <em>${topik}</em>, (3) Kepercayaan diri &amp; adab komunikasi.
        </td>
        <td style="${tdBase} text-align: center; vertical-align: middle; font-size: 14pt; font-weight: bold;">&#10003;</td>
      </tr>
    `;
  }).join("");

  const lampiran017Html =
    formData.sertakanLampiran017 !== false
      ? `
        <div class="page-break" style="page-break-before: always; margin-top: 24px;"></div>
        <div class="lampiran-017-section" style="font-family: 'Times New Roman', Times, serif; color: #000000;">
          ${
            formData.sertakanKop !== false
              ? buildAthirahIsoKopTable({
                  formTitle: "LAMPIRAN ASESMEN DALAM RPP/MA",
                  docNumber: "017/F/KUR/00/IX/2025",
                  revisi: "00",
                  tanggalTerbit: "17/09/2025",
                  halaman: "2 dari 2"
                })
              : ""
          }

          <div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; line-height: 1.35; margin: 10px 0 12px 0; color: #000000;">
            <div>Form Lampiran Asesmen dalam RPP/MA</div>
            <div>Sekolah Islam Athirah</div>
          </div>

          <table class="table-asesmen-017" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000;">
            <colgroup>
              <col style="width: 14.28%;" />
              <col style="width: 14.28%;" />
              <col style="width: 14.28%;" />
              <col style="width: 14.28%;" />
              <col style="width: 14.29%;" />
              <col style="width: 14.29%;" />
              <col style="width: 14.30%;" />
            </colgroup>
            <thead>
              <tr>
                <th style="${thBlue}">Materi</th>
                <th style="${thBlue}">Tujuan Pembelajaran</th>
                <th style="${thBlue}">Indikator Asesmen (soal)</th>
                <th style="${thBlue}">Jenis Asesmen (Tulis/Nontulis)</th>
                <th style="${thBlue}">Uraian Soal Tertulis</th>
                <th style="${thBlue}">Deskripsi Aktivitas Non-tertulis</th>
                <th style="${thBlue}">LKPD (&#10003;/&#10007;)</th>
              </tr>
            </thead>
            <tbody>
              ${lampiran017Rows}
            </tbody>
          </table>
        </div>
      `
      : "";

  const lkpdPerPertemuanHtml =
    formData.sertakanLkpd !== false ? buildPerMeetingLkpdHtml({ ...formData, programKhas }) : "";

  return `
    <div class="athirah-modul-015-wrapper" style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; line-height: 1.35;">
      ${kop015Html}

      <!-- Judul & Identitas sesuai 015 Formulir-Modul Ajar.docx -->
      <div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; line-height: 1.35; margin: 8px 0 6px 0; color: #000000;">
        <div>MODUL AJAR</div>
        <div>Sekolah Islam Athirah</div>
        <div style="margin-top: 6px;">Identitas</div>
      </div>

      <!-- Tabel Identitas Modul Ajar -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 12px; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000;">
        <tbody>
          <tr>
            <td style="${tdBase} width: 22%; font-weight: bold;">Unit / Satuan Pendidikan</td>
            <td style="${tdBase} width: 28%;">${namaSekolah}</td>
            <td style="${tdBase} width: 22%; font-weight: bold;">Kelas / Fase</td>
            <td style="${tdBase} width: 28%;">${kelas} / ${fase}</td>
          </tr>
          <tr>
            <td style="${tdBase} font-weight: bold;">Nama Penyusun</td>
            <td style="${tdBase}">${namaGuru}</td>
            <td style="${tdBase} font-weight: bold;">Rumpun / Mata Pelajaran</td>
            <td style="${tdBase}">${mapel}</td>
          </tr>
          <tr>
            <td style="${tdBase} font-weight: bold;">Tahun Pelajaran / Semester</td>
            <td style="${tdBase}">${tahunAjaran} / ${semester}</td>
            <td style="${tdBase} font-weight: bold;">Materi Pokok</td>
            <td style="${tdBase}"><strong>${topik}</strong></td>
          </tr>
          <tr>
            <td style="${tdBase} font-weight: bold;">Durasi / Jumlah Pertemuan</td>
            <td style="${tdBase}">${waktu} (${jumlahPertemuan} Pertemuan)</td>
            <td style="${tdBase} font-weight: bold;">Program Khas Sekolah</td>
            <td style="${tdBase}"><strong>${programKhas}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- Tabel Utama 14 Baris (R0 - R13) Persis 015 Formulir-Modul Ajar.docx -->
      <table class="table-format1-athirah" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000;">
        <colgroup>
          <col style="width: 15%;" />
          <col style="width: 24%;" />
          <col style="width: 9%;" />
          <col style="width: 16%;" />
          <col style="width: 24%;" />
          <col style="width: 6%;" />
          <col style="width: 6%;" />
        </colgroup>
        <thead>
          <!-- R0: Header Komponen | Deskripsi (#9CC2E5) -->
          <tr>
            <th colspan="1" style="${thBlue}">Komponen</th>
            <th colspan="6" style="${thBlue}">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          <!-- R1: Identifikasi | Dimensi Profil Lulusan | Program Khas (Public Speaking) -->
          <tr>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">Identifikasi</td>
            <td colspan="2" style="${tdBase}">
              <strong>Dimensi Profil Lulusan</strong>
              <ul style="margin: 4px 0 0 16px; padding: 0;">
                <li>Keimanan dan Ketakwaan terhadap Tuhan YME</li>
                <li>Penalaran Kritis</li>
                <li>Kreativitas</li>
                <li>Kolaborasi</li>
                <li>Komunikasi</li>
                <li>Kemandirian</li>
              </ul>
            </td>
            <td colspan="4" style="${tdBase}">
              <strong>Program Khas</strong>
              <div style="margin-top: 4px;">
                <strong>${programKhas}</strong>
              </div>
              <div style="margin-top: 3px; font-size: 10.5pt;">
                Integrasi keterampilan <strong>${programKhas}</strong> dalam setiap pertemuan: peserta didik dilatih menyusun kerangka berpikir runtut, mempresentasikan hasil eksplorasi dan pemecahan masalah materi <em>${topik}</em> secara lisan dengan artikulasi jelas, percaya diri, santun, dan berbasis bukti ilmiah.
              </div>
            </td>
          </tr>

          <!-- R2: Spiritualisasi -->
          <tr>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">Spiritualisasi</td>
            <td colspan="6" style="${tdBase}">
              ${spiritualisasiHtml}
            </td>
          </tr>

          <!-- R3: Desain Pembelajaran (rowspan=4) -> Tujuan Pembelajaran -->
          <tr>
            <td rowspan="4" colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">Desain Pembelajaran</td>
            <td colspan="6" style="${tdBase}">
              <strong>Tujuan Pembelajaran</strong>
              ${tujuanListHtml}
            </td>
          </tr>

          <!-- R4: Praktik Pedagogis (Model, Metode, Strategi, Teknik) -->
          <tr>
            <td colspan="6" style="${tdBase}">
              <strong>Praktik Pedagogis (Model, Metode, Strategi, Teknik)</strong>
              <ul style="margin: 4px 0 0 18px; padding: 0;">
                <li><strong>Model Pembelajaran:</strong> ${model}</li>
                <li><strong>Pendekatan:</strong> Pembelajaran Mendalam (<em>Deep Learning</em>: <span style="color: #0070C0; font-weight: bold;">Berkesadaran/Mindful</span>, <span style="color: #00B050; font-weight: bold;">Bermakna/Meaningful</span>, <span style="color: #ED7D31; font-weight: bold;">Menggembirakan/Joyful</span>) &amp; Diferensiasi (${karakteristik}).</li>
                <li><strong>Metode &amp; Teknik:</strong> Observasi Kontekstual, Diskusi Kolaboratif, Investigasi Terbimbing, Tanya Jawab Sokratik, dan Unjuk Kerja <strong>${programKhas}</strong>.</li>
              </ul>
            </td>
          </tr>

          <!-- R5: Media, Sarana, dan Pemanfaatan Digital -->
          <tr>
            <td colspan="6" style="${tdBase}">
              <strong>Media, Sarana, dan Pemanfaatan Digital</strong>
              <ul style="margin: 4px 0 0 18px; padding: 0;">
                <li><strong>Media &amp; Bahan Ajar:</strong> LKPD Pertemuan 1 s.d. ${jumlahPertemuan}, Slide Interaktif Visualisasi <em>${topik}</em>, Video Fenomena Kontekstual, dan Buku Teks Kurikulum Merdeka ${mapel}.</li>
                <li><strong>Sarana &amp; Prasarana:</strong> Ruang kelas kondusif, proyektor/smart TV, papan tulis, dan mimbar/area presentasi <strong>${programKhas}</strong>.</li>
                <li><strong>Pemanfaatan Digital:</strong> Simulasi interaktif digital, kuis formatif terpadu, serta dokumentasi portofolio presentasi siswa.</li>
              </ul>
            </td>
          </tr>

          <!-- R6: Lingkungan dan Kemitraan Pembelajar -->
          <tr>
            <td colspan="6" style="${tdBase}">
              <strong>Lingkungan dan Kemitraan Pembelajar</strong>
              <ul style="margin: 4px 0 0 18px; padding: 0;">
                <li><strong>Lingkungan Belajar:</strong> Budaya kelas yang aman secara psikologis, inklusif, saling menghargai pendapat, serta mendukung keberanian berbicara di depan umum (<strong>${programKhas}</strong>).</li>
                <li><strong>Kemitraan Pembelajaran:</strong> Kolaborasi antar-peserta didik (tutor sebaya), guru mata pelajaran serumpun, serta keterlibatan orang tua dalam mendampingi refleksi belajar di rumah.</li>
              </ul>
            </td>
          </tr>

          <!-- R7: Pengalaman Belajar (rowspan=3) -> Memahami -->
          <tr>
            <td rowspan="3" colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">
              Pengalaman Belajar<br/><br/>
              <span style="font-size: 9.5pt; font-weight: normal;">
                Integrasi Prinsip PM:<br/>
                <span style="color: #0070C0; font-weight: bold;">&#9632; Biru: Berkesadaran</span><br/>
                <span style="color: #00B050; font-weight: bold;">&#9632; Hijau: Bermakna</span><br/>
                <span style="color: #ED7D31; font-weight: bold;">&#9632; Oranye: Menggembirakan</span>
              </span>
            </td>
            <td colspan="1" style="${tdBase}">
              <strong>Memahami</strong><br/>
              Eksplorasi<br/>
              Instruksional<br/>
              Informasi<br/>
              Kognitif
            </td>
            <td colspan="5" style="${tdBase}">
              ${memahamiPerPertemuan.join("")}
            </td>
          </tr>

          <!-- R8: Mengaplikasi -->
          <tr>
            <td colspan="1" style="${tdBase}">
              <strong>Mengaplikasi</strong><br/>
              Elaborasi<br/>
              Investigational<br/>
              Transformasi<br/>
              Asosiatif
            </td>
            <td colspan="5" style="${tdBase}">
              ${mengaplikasiPerPertemuan.join("")}
            </td>
          </tr>

          <!-- R9: Merefleksi -->
          <tr>
            <td colspan="1" style="${tdBase}">
              <strong>Merefleksi</strong><br/>
              Konfirmasi<br/>
              Immersi<br/>
              Evaluasi<br/>
              Otonom
            </td>
            <td colspan="5" style="${tdBase}">
              ${merefleksiPerPertemuan.join("")}
            </td>
          </tr>

          <!-- R10: Asesmen (rowspan=4) -> Deskripsi & LKPD dilampirkan -->
          <tr>
            <td rowspan="4" colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">Asesmen</td>
            <td colspan="6" style="${tdBase}">
              <strong>- Deskripsi dituliskan, LKPD dilampirkan</strong>
              <div style="margin-top: 4px;">
                Asesmen dilaksanakan secara autentik dan berkelanjutan meliputi: (1) <strong>Asesmen Formatif Awal</strong> (pemetaan kesiapan belajar), (2) <strong>Asesmen Formatif Proses</strong> melalui pengerjaan <strong>LKPD Pertemuan 1 s.d. ${jumlahPertemuan}</strong> dan observasi unjuk kerja <strong>${programKhas}</strong>, serta (3) <strong>Asesmen Sumatif Lingkup Materi</strong> (tes tertulis &amp; evaluasi proyek). Rincian matriks soal dilampirkan pada <strong>Formulir 017</strong> dan lembar <strong>LKPD Setiap Pertemuan</strong> di bawah ini.
              </div>
            </td>
          </tr>

          <!-- R11: Indikator (rowspan=3) | Asesmen (rowspan=3) | Penguatan pada Aktivitas Kode. (rowspan=3) | MH | 1 / 2 / 3 (stacked vertically per 015 docx) -->
          <tr>
            <td rowspan="3" colspan="1" style="${tdBase}">
              <strong>Indikator</strong>
              <ul style="margin: 6px 0 0 16px; padding: 0;">
                <li style="margin-bottom: 4px;">Mengidentifikasi dan menjelaskan konsep esensial pada materi <em>${topik}</em> secara tepat (MH).</li>
                <li style="margin-bottom: 4px;">Menerapkan konsep <em>${topik}</em> dalam memecahkan masalah kontekstual pada LKPD setiap pertemuan (MA).</li>
                <li style="margin-bottom: 4px;">Mengevaluasi simpulan dan mengomunikasikan hasil analisis melalui <strong>${programKhas}</strong> serta refleksi spiritualisasi (MR).</li>
              </ul>
            </td>
            <td rowspan="3" colspan="2" style="${tdBase}">
              <strong>Asesmen</strong>
              <ul style="margin: 6px 0 0 16px; padding: 0;">
                <li style="margin-bottom: 4px;"><strong>Tes Tertulis &amp; Eksplorasi Konsep:</strong> Soal identifikasi dan analisis konsep pada LKPD Pertemuan 1–${jumlahPertemuan} (Aktivitas 1).</li>
                <li style="margin-bottom: 4px;"><strong>Penugasan Investigasi Kelompok:</strong> Pemecahan studi kasus kontekstual pada LKPD Pertemuan 1–${jumlahPertemuan} (Aktivitas 2).</li>
                <li style="margin-bottom: 4px;"><strong>Unjuk Kerja Non-Tertulis (${programKhas}) &amp; Refleksi:</strong> Rubrik performa presentasi lisan, argumentasi ilmiah, dan jurnal refleksi (Aktivitas 3).</li>
              </ul>
            </td>
            <td rowspan="3" colspan="1" style="${tdBase} text-align: center;">
              <strong>Penguatan pada Aktivitas</strong>
              <div style="margin-top: 6px; font-weight: bold;">Kode.</div>
              <div style="margin-top: 6px; font-size: 10pt; text-align: left;">
                &bull; <strong>MH:</strong> Memahami (Pertemuan 1–${jumlahPertemuan})<br/>
                &bull; <strong>MA:</strong> Mengaplikasi &amp; ${programKhas}<br/>
                &bull; <strong>MR:</strong> Merefleksi &amp; Evaluasi
              </div>
            </td>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">MH</td>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; line-height: 1.25;"><strong>1</strong><br/>2<br/>3</td>
          </tr>

          <!-- R12: MA | 1 / 2 / 3 -->
          <tr>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">MA</td>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; line-height: 1.25;">1<br/><strong>2</strong><br/>3</td>
          </tr>

          <!-- R13: MR | 1 / 2 / 3 -->
          <tr>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; font-weight: bold;">MR</td>
            <td colspan="1" style="${tdBase} text-align: center; vertical-align: middle; line-height: 1.25;">1<br/>2<br/><strong>3</strong></td>
          </tr>
        </tbody>
      </table>

      ${ttdHtml}
      ${lampiran017Html}
      ${lkpdPerPertemuanHtml}
    </div>
  `;
}

/**
 * Builder Format Modul Ajar 2 sesuai 015 Formulir-Modul Ajar.docx (Tabel 4 Kolom x 5 Baris)
 * + 017 Formulir-Lampiran Asesmen dalam MA.docx + LKPD setiap pertemuan
 */
export function buildExactAthirahFormat2Html(formData: AthirahModulInput): string {
  const namaSekolah = formData.namaSekolah || "SMP Islam Athirah";
  const namaGuru = formData.namaGuru || "Guru Mata Pelajaran";
  const nipGuru = formData.nipGuru || "-";
  const namaKepsek = formData.namaKepsek || "Kepala Sekolah";
  const nipKepsek = formData.nipKepsek || "-";
  const tempatTtd = formData.tempatTtd || "Makassar";
  const tanggalTtd =
    formData.tanggalTtd ||
    new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const mapel = formData.mataPelajaran || "Matematika";
  const kelas = formData.kelas || "VIII";
  const fase = formData.fase || "Fase D";
  const tahunAjaran = formData.tahunAjaran || "2025/2026";
  const semester = formData.semester || "Ganjil";
  const topik = formData.topik || "Materi Pokok Pembelajaran";
  const waktu = formData.waktu || "4 x 45 JP";
  const jumlahPertemuan = Math.min(
    8,
    Math.max(1, parseInt(String(formData.jumlahPertemuan || "2"), 10) || 2)
  );
  const model = formData.model || "Problem Based Learning (PBL)";
  const programKhas = formData.programKhas?.trim() || "Public Speaking";
  const docNumber015 = formData.docNumberIso || "015/F/KUR/00/IX/2025";

  const tujuanRaw =
    formData.tujuan ||
    `1. Peserta didik mampu memahami konsep esensial pada materi ${topik} secara cermat dan berkesadaran.\n2. Peserta didik mampu mengaplikasikan prinsip ${topik} untuk memecahkan permasalahan kontekstual secara kolaboratif.\n3. Peserta didik mampu mengomunikasikan hasil analisis dan simpulan di depan kelas melalui praktik ${programKhas} yang sistematis dan percaya diri.`;
  const tujuanLines = tujuanRaw
    .split(/\n+/)
    .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
  const tujuanListHtml =
    tujuanLines.length > 1
      ? `<ol style="margin: 4px 0 0 18px; padding: 0;">${tujuanLines
          .map((line) => `<li style="margin-bottom: 3px;">${line}</li>`)
          .join("")}</ol>`
      : `<p style="margin: 4px 0 0 0;">${tujuanRaw}</p>`;

  const spiritualisasiHtml = formData.spiritualisasi?.trim()
    ? formData.spiritualisasi.trim().replace(/\n/g, "<br/>")
    : `<strong>Integrasi Nilai Islam &amp; Al-Qur'an (QS. Al-Mujadilah: 11 &amp; QS. Ar-Rahman: 1–4):</strong><br/>
       <em>"Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat."</em><br/>
       Melalui kajian materi <strong>${topik}</strong>, peserta didik menyadari keteraturan sunnatullah di alam semesta sebagai tanda kebesaran Allah SWT serta melatih keterampilan <strong>${programKhas}</strong> (<em>Qaulan Sadida</em> &amp; <em>Qaulan Baligha</em>).`;

  const thBlue =
    "border: 1px solid #000000; padding: 6px 8px; background-color: #9CC2E5; color: #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; text-align: center; vertical-align: middle;";
  const tdBase =
    "border: 1px solid #000000; padding: 6px 8px; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; vertical-align: top; line-height: 1.35;";

  const kop015Html =
    formData.sertakanKop !== false
      ? buildAthirahIsoKopTable({
          formTitle: "MODUL AJAR",
          docNumber: docNumber015,
          revisi: "00",
          tanggalTerbit: "17/09/2025",
          halaman: "2 dari 5",
        })
      : "";

  const memahamiHtml = Array.from({ length: jumlahPertemuan }, (_, idx) => {
    const p = idx + 1;
    return `<div style="margin-bottom: 4px;"><strong>Pertemuan ${p}:</strong> Orientasi <span style="color:#0070C0;font-weight:bold;">(Berkesadaran)</span> &amp; eksplorasi konsep <em>${topik}</em> pada <strong>LKPD Pertemuan ${p}</strong> <span style="color:#00B050;font-weight:bold;">(Bermakna)</span>.</div>`;
  }).join("");

  const mengaplikasiHtml = Array.from({ length: jumlahPertemuan }, (_, idx) => {
    const p = idx + 1;
    return `<div style="margin-bottom: 4px;"><strong>Pertemuan ${p}:</strong> Investigasi studi kasus dengan model <em>${model}</em> <span style="color:#00B050;font-weight:bold;">(Bermakna)</span> &amp; presentasi lisan <strong>${programKhas}</strong> di depan kelas <span style="color:#ED7D31;font-weight:bold;">(Menggembirakan)</span>.</div>`;
  }).join("");

  const merefleksiHtml = Array.from({ length: jumlahPertemuan }, (_, idx) => {
    const p = idx + 1;
    return `<div style="margin-bottom: 4px;"><strong>Pertemuan ${p}:</strong> Konfirmasi konsep, evaluasi umpan balik <strong>${programKhas}</strong> <span style="color:#0070C0;font-weight:bold;">(Berkesadaran)</span>, dan refleksi spiritualisasi.</div>`;
  }).join("");

  // Reuse full 015 builder for 017 and LKPD sections by extracting or generating directly
  const full015 = buildExactAthirahModulHtml({
    ...formData,
    sertakanKop: false,
    sertakanTtd: formData.sertakanTtd,
    sertakanLampiran017: formData.sertakanLampiran017,
    sertakanLkpd: formData.sertakanLkpd,
  });
  const ttdIndex = full015.indexOf('<table class="ttd-table"');
  const lampiranIndex = full015.indexOf('<div style="page-break-before: always;');
  const tailStart = ttdIndex !== -1 ? ttdIndex : lampiranIndex;
  const tailHtml = tailStart !== -1 ? full015.slice(tailStart) : "</div>";

  return `
    <div class="athirah-modul-015-wrapper" style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; line-height: 1.35;">
      ${kop015Html}

      <div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; line-height: 1.35; margin: 8px 0 6px 0; color: #000000;">
        <div>Format Modul Ajar 2</div>
        <div>Sekolah Islam Athirah</div>
        <div style="margin-top: 6px;">Identitas</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 10px; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000;">
        <tbody>
          <tr>
            <td style="${tdBase} width: 22%; font-weight: bold;">Unit / Satuan Pendidikan</td>
            <td style="${tdBase} width: 28%;">${namaSekolah}</td>
            <td style="${tdBase} width: 22%; font-weight: bold;">Kelas / Fase</td>
            <td style="${tdBase} width: 28%;">${kelas} / ${fase}</td>
          </tr>
          <tr>
            <td style="${tdBase} font-weight: bold;">Nama Penyusun</td>
            <td style="${tdBase}">${namaGuru}</td>
            <td style="${tdBase} font-weight: bold;">Rumpun / Mata Pelajaran</td>
            <td style="${tdBase}">${mapel}</td>
          </tr>
          <tr>
            <td style="${tdBase} font-weight: bold;">Tahun Pelajaran / Semester</td>
            <td style="${tdBase}">${tahunAjaran} / ${semester}</td>
            <td style="${tdBase} font-weight: bold;">Materi Pokok &amp; Alokasi</td>
            <td style="${tdBase}"><strong>${topik}</strong> (${waktu} / ${jumlahPertemuan} Pertemuan)</td>
          </tr>
        </tbody>
      </table>

      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin: 8px 0 4px 0; color: #000000;">
        Identifikasi
      </div>
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; margin-bottom: 10px; color: #000000;">
        <strong>Dimensi Profil Lulusan:</strong> Keimanan &amp; Ketakwaan terhadap Tuhan YME, Penalaran Kritis, Kreativitas, Kolaborasi, Komunikasi, Kemandirian.<br/>
        <strong>Program Khas Sekolah:</strong> <strong>${programKhas}</strong>
      </div>

      <!-- Tabel Format Modul Ajar 2 (4 Kolom x 5 Baris sesuai 015 Formulir-Modul Ajar.docx) -->
      <table class="table-format1-athirah table-format2-athirah" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000;">
        <thead>
          <tr>
            <th style="${thBlue} width: 22%;">Tujuan Pembelajaran</th>
            <th style="${thBlue} width: 19%;">Asesmen</th>
            <th style="${thBlue} width: 35%;">Aktivitas, Praktik Pedagogi</th>
            <th style="${thBlue} width: 24%;">Media, Sarana, Digital, Lingkungan, Kemitraan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="4" style="${tdBase}">
              ${tujuanListHtml}
            </td>
            <td rowspan="4" style="${tdBase}">
              <ul style="margin: 0 0 0 16px; padding: 0;">
                <li style="margin-bottom: 4px;"><strong>Asesmen Formatif Awal:</strong> Pemetaan kesiapan belajar.</li>
                <li style="margin-bottom: 4px;"><strong>Asesmen Proses (LKPD):</strong> Eksplorasi &amp; pemecahan kasus Pertemuan 1–${jumlahPertemuan}.</li>
                <li style="margin-bottom: 4px;"><strong>Unjuk Kerja (${programKhas}):</strong> Rubrik presentasi lisan &amp; argumentasi ilmiah.</li>
                <li><strong>Asesmen Sumatif:</strong> Evaluasi penguasaan materi <em>${topik}</em> (Formulir 017).</li>
              </ul>
            </td>
            <td style="${tdBase}">
              <strong>Memahami</strong>
              <div style="margin-top: 4px;">${memahamiHtml}</div>
            </td>
            <td rowspan="3" style="${tdBase}">
              <ul style="margin: 0 0 0 16px; padding: 0;">
                <li style="margin-bottom: 4px;"><strong>Model:</strong> ${model}</li>
                <li style="margin-bottom: 4px;"><strong>Media &amp; Digital:</strong> LKPD Pertemuan 1–${jumlahPertemuan}, Slide Interaktif, Proyektor/Smart TV.</li>
                <li style="margin-bottom: 4px;"><strong>Lingkungan:</strong> Kelas kolaboratif &amp; mimbar <strong>${programKhas}</strong>.</li>
                <li><strong>Kemitraan:</strong> Kolaborasi sebaya, guru serumpun, dan orang tua.</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="${tdBase}">
              <strong>Mengaplikasi</strong>
              <div style="margin-top: 4px;">${mengaplikasiHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="${tdBase}">
              <strong>Merefleksi</strong>
              <div style="margin-top: 4px;">${merefleksiHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="${tdBase}">
              <strong>Deskripsi Integrasi Program Khas (${programKhas})</strong>
              <div style="margin-top: 4px;">
                Setiap pertemuan melatih peserta didik menyusun kerangka gagasan dan mempresentasikan hasil analisis <em>${topik}</em> di depan kelas melalui praktik <strong>${programKhas}</strong> secara runtut, santun, dan komunikatif.
              </div>
            </td>
            <td style="${tdBase}">
              <strong>Spiritualisasi</strong>
              <div style="margin-top: 4px;">${spiritualisasiHtml}</div>
            </td>
          </tr>
        </tbody>
      </table>

      ${tailHtml}
  `;
}

/**
 * Builder Modul Ajar untuk semua pilihan template (Athirah 015/017 Format 1 & Format 2 maupun Template Bawaan Nasional)
 */
export function buildCompleteModulAjarHtml(formData: AthirahModulInput): string {
  const formatOutput = formData.formatOutput || "sekolah_format1_iso";
  if (formatOutput === "sekolah_format2_iso") {
    return buildExactAthirahFormat2Html(formData);
  }
  if (formatOutput === "sekolah_format1_iso" || formData.templateCategory === "sekolah") {
    return buildExactAthirahModulHtml(formData);
  }

  // Untuk format bawaan nasional (standar_merdeka, deep_learning, ringkas_1lembar, kemenag_kbc)
  // tetap sertakan Program Khas Public Speaking & LKPD setiap pertemuan secara lengkap
  const namaSekolah = formData.namaSekolah || "SMP Islam Athirah";
  const namaGuru = formData.namaGuru || "Guru Mata Pelajaran";
  const nipGuru = formData.nipGuru || "-";
  const namaKepsek = formData.namaKepsek || "Kepala Sekolah";
  const nipKepsek = formData.nipKepsek || "-";
  const tempatTtd = formData.tempatTtd || "Makassar";
  const tanggalTtd =
    formData.tanggalTtd ||
    new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const mapel = formData.mataPelajaran || "Matematika";
  const kelas = formData.kelas || "VIII";
  const fase = formData.fase || "Fase D";
  const topik = formData.topik || "Materi Pokok";
  const waktu = formData.waktu || "4 x 45 JP";
  const jumlahPertemuan = Math.min(8, Math.max(1, parseInt(String(formData.jumlahPertemuan || "2"), 10) || 2));
  const model = formData.model || "Problem Based Learning (PBL)";
  const programKhas = formData.programKhas?.trim() || "Public Speaking";
  const tujuan =
    formData.tujuan ||
    `Peserta didik mampu memahami dan menerapkan konsep ${topik} untuk memecahkan masalah kontekstual serta mempresentasikannya melalui ${programKhas}.`;

  const thStyle =
    "border: 1px solid #1e293b; padding: 7px 10px; background-color: #9CC2E5; color: #000000; font-weight: bold; text-align: center;";
  const tdStyle = "border: 1px solid #1e293b; padding: 7px 10px; vertical-align: top; color: #000000;";

  const pertemuanRows = Array.from({ length: jumlahPertemuan }, (_, idx) => {
    const p = idx + 1;
    return `
      <tr>
        <td style="${tdStyle} text-align: center; font-weight: bold;">Pertemuan Ke-${p}</td>
        <td style="${tdStyle}">
          <strong>1. Kegiatan Pendahuluan (15 Menit) — <span style="color:#0070C0;">Mindful Learning</span>:</strong>
          <ul style="margin: 3px 0 6px 18px;">
            <li>Salam, doa, presensi, pengondisian kesiapan belajar, dan apersepsi kontekstual materi <em>${topik}</em>.</li>
          </ul>
          <strong>2. Kegiatan Inti (60 Menit) — <span style="color:#00B050;">Meaningful</span> &amp; <span style="color:#ED7D31;">Joyful Learning</span>:</strong>
          <ul style="margin: 3px 0 6px 18px;">
            <li>Eksplorasi konsep &amp; pengerjaan <strong>LKPD Pertemuan Ke-${p}</strong> dengan model <em>${model}</em>.</li>
            <li>Praktik <strong>Program Khas (${programKhas})</strong>: Presentasi lisan dan diskusi tanya jawab hasil investigasi kelompok.</li>
          </ul>
          <strong>3. Kegiatan Penutup (15 Menit):</strong>
          <ul style="margin: 3px 0 0 18px;">
            <li>Refleksi hasil belajar, simpulan bersama, umpan balik <em>${programKhas}</em>, dan penutup doa.</li>
          </ul>
        </td>
      </tr>
    `;
  }).join("");

  const lkpdHtml = formData.sertakanLkpd !== false ? buildPerMeetingLkpdHtml({ ...formData, programKhas }) : "";

  return `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; line-height: 1.4;">
      <div style="text-align: center; border-bottom: 3px double #000000; padding-bottom: 10px; margin-bottom: 14px;">
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">${namaSekolah}</div>
        <div style="font-size: 12pt; font-weight: bold; margin-top: 2px;">MODUL AJAR KURIKULUM MERDEKA (${formatOutput.toUpperCase()})</div>
        <div style="font-size: 10pt; margin-top: 2px;">Mata Pelajaran: ${mapel} | Kelas/Fase: ${kelas} (${fase}) | Tahun Pelajaran: ${formData.tahunAjaran || "2025/2026"}</div>
      </div>

      <h3 style="font-size: 11.5pt; font-weight: bold; margin: 10px 0 6px 0;">I. INFORMASI UMUM &amp; IDENTIFIKASI</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tbody>
          <tr>
            <td style="${tdStyle} width: 25%; font-weight: bold;">Nama Penyusun</td>
            <td style="${tdStyle} width: 25%;">${namaGuru}</td>
            <td style="${tdStyle} width: 25%; font-weight: bold;">Alokasi Waktu</td>
            <td style="${tdStyle} width: 25%;">${waktu} (${jumlahPertemuan} Pertemuan)</td>
          </tr>
          <tr>
            <td style="${tdStyle} font-weight: bold;">Topik / Materi Pokok</td>
            <td style="${tdStyle}"><strong>${topik}</strong></td>
            <td style="${tdStyle} font-weight: bold;">Model &amp; Program Khas</td>
            <td style="${tdStyle}">${model} &bull; <strong>${programKhas}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 11.5pt; font-weight: bold; margin: 12px 0 6px 0;">II. TUJUAN &amp; SKENARIO PEMBELAJARAN PER PERTEMUAN</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="${thStyle} width: 22%;">Komponen / Pertemuan</th>
            <th style="${thStyle} width: 78%;">Deskripsi Kegiatan Pembelajaran</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${tdStyle} font-weight: bold; text-align: center;">Tujuan Pembelajaran</td>
            <td style="${tdStyle}">${tujuan.replace(/\n/g, "<br/>")}</td>
          </tr>
          ${pertemuanRows}
        </tbody>
      </table>

      ${
        formData.sertakanTtd !== false
          ? `
        <table class="ttd-table" style="width: 100%; border: none !important; margin-top: 20px;">
          <tr style="border: none !important;">
            <td style="width: 50%; border: none !important; text-align: center;">
              Mengetahui,<br/><strong>Kepala Sekolah</strong><br/><br/><br/><br/>
              <strong><u>${namaKepsek}</u></strong><br/>NIP. ${nipKepsek}
            </td>
            <td style="width: 50%; border: none !important; text-align: center;">
              ${tempatTtd}, ${tanggalTtd}<br/><strong>Guru Mata Pelajaran</strong><br/><br/><br/><br/>
              <strong><u>${namaGuru}</u></strong><br/>NIP. ${nipGuru}
            </td>
          </tr>
        </table>
      `
          : ""
      }

      ${lkpdHtml}
    </div>
  `;
}
