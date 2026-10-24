import React, { useState } from "react";
import { 
  FileCheck, 
  Sparkles, 
  Printer, 
  Download, 
  BookOpen, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Award,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  UserCheck,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  ArrowRightLeft
} from "lucide-react";
import { Pengaturan, RmeMonthItem, AgendaSekolahItem } from "../types";
import { notifySimpanSuccess, notifySimpanError, notifyUnduhSuccess } from "../lib/swal";
import { buildKurikulumMerdekaDocument } from "../utils/kurikulumMerdekaBuilder";
import { savePerangkatSyncData, extractSyncDataFromPerangkat } from "../utils/perangkatSyncHelper";
import { AiProgressStepper } from "./AiProgressStepper";

interface GeneratorPerangkatAjarAIViewProps {
  config: Pengaturan;
  onNavigateToModulAjar?: () => void;
}

const DEFAULT_RME_GANJIL: RmeMonthItem[] = [
  { month: "Juli", totalWeeks: 4, nonEffective: 2, effective: 2, note: "MPLS & Pengenalan Lingkungan Belajar (2 Pekan)" },
  { month: "Agustus", totalWeeks: 5, nonEffective: 0, effective: 5, note: "Pekan Efektif Penuh (Peringatan HUT RI)" },
  { month: "September", totalWeeks: 4, nonEffective: 1, effective: 3, note: "Penilaian Sumatif Tengah Semester (PTS/STS) Ganjil (1 Pekan)" },
  { month: "Oktober", totalWeeks: 5, nonEffective: 0, effective: 5, note: "Pekan Efektif Penuh" },
  { month: "November", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
  { month: "Desember", totalWeeks: 4, nonEffective: 3, effective: 1, note: "Sumatif Akhir Semester (SAS), Pembagian Rapor & Libur Semester 1 (3 Pekan)" }
];

const DEFAULT_RME_GENAP: RmeMonthItem[] = [
  { month: "Januari", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
  { month: "Februari", totalWeeks: 4, nonEffective: 0, effective: 4, note: "Pekan Efektif Penuh" },
  { month: "Maret", totalWeeks: 5, nonEffective: 2, effective: 3, note: "Libur Awal Ramadhan & PTS/STS Genap (2 Pekan)" },
  { month: "April", totalWeeks: 4, nonEffective: 2, effective: 2, note: "Libur Hari Raya Idul Fitri & Ujian Akhir Jenjang (2 Pekan)" },
  { month: "Mei", totalWeeks: 5, nonEffective: 1, effective: 4, note: "Sumatif Akhir Tahun (SAT) Genap (1 Pekan)" },
  { month: "Juni", totalWeeks: 4, nonEffective: 3, effective: 1, note: "Pengolahan Rapor, Wisuda & Libur Kenaikan Kelas (3 Pekan)" }
];

const DEFAULT_AGENDA_SEKOLAH: AgendaSekolahItem[] = [
  { id: "1", kegiatan: "Masa Pengenalan Lingkungan Sekolah (MPLS)", waktu: "13 - 24 Juli 2026", semester: "Ganjil", kategori: "Kurikuler" },
  { id: "2", kegiatan: "Peringatan HUT RI Ke-81", waktu: "17 Agustus 2026", semester: "Ganjil", kategori: "Karakter/P5" },
  { id: "3", kegiatan: "Penilaian Sumatif Tengah Semester (STS) Ganjil", waktu: "21 - 26 September 2026", semester: "Ganjil", kategori: "Asesmen" },
  { id: "4", kegiatan: "Asesmen Sumatif Akhir Semester (SAS) Ganjil", waktu: "30 Nov - 11 Des 2026", semester: "Ganjil", kategori: "Asesmen" },
  { id: "5", kegiatan: "Penerimaan Rapor & Libur Semester Ganjil", waktu: "18 Des 2026 - 3 Jan 2027", semester: "Ganjil", kategori: "Libur" },
  { id: "6", kegiatan: "Hari Pertama Masuk Semester Genap", waktu: "4 Januari 2027", semester: "Genap", kategori: "Kurikuler" },
  { id: "7", kegiatan: "Perkiraan Libur Awal Ramadhan 1448 H", waktu: "8 - 13 Maret 2027", semester: "Genap", kategori: "Libur" },
  { id: "8", kegiatan: "Penilaian Sumatif Tengah Semester (STS) Genap", waktu: "15 - 20 Maret 2027", semester: "Genap", kategori: "Asesmen" },
  { id: "9", kegiatan: "Libur Hari Raya Idul Fitri 1448 H", waktu: "22 Maret - 3 April 2027", semester: "Genap", kategori: "Libur" },
  { id: "10", kegiatan: "Sumatif Akhir Tahun (SAT) / Asesmen Kenaikan Kelas", waktu: "24 Mei - 4 Juni 2027", semester: "Genap", kategori: "Asesmen" },
  { id: "11", kegiatan: "Penerimaan Rapor & Libur Kenaikan Kelas", waktu: "18 Juni - 10 Juli 2027", semester: "Genap", kategori: "Libur" }
];

const DEFAULT_CATATAN_KALENDER = "Kalender Pendidikan berpedoman pada Keputusan Kepala Dinas Pendidikan Provinsi/Kab/Kota & Kebijakan Kurikulum Sekolah. Kegiatan Proyek Penguatan Profil Pelajar (P5) dilaksanakan secara blok/terpadu pada pekan terjadwal.";

export const GeneratorPerangkatAjarAIView: React.FC<GeneratorPerangkatAjarAIViewProps> = ({ config, onNavigateToModulAjar }) => {
  const [activeDoc, setActiveDoc] = useState<"rme" | "analisis_cp" | "tp" | "atp" | "prota" | "prosem" | "kktp">("rme");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState("");

  // Store generated HTML for each document type
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, string>>({
    rme: "",
    analisis_cp: "",
    tp: "",
    atp: "",
    prota: "",
    prosem: "",
    kktp: ""
  });

  const [formData, setFormData] = useState({
    school: config.Nama_Sekolah || "SMP Islam Athirah Baruga Antang",
    subject: "Matematika",
    singkatanMapel: "MTK",
    level: "Fase D / Kelas VIII",
    year: "2026/2027",
    totalJp: "114 JP / Tahun",
    jpPerMinggu: "3 JP/Minggu",
    teacher: config.Nama_Guru || "Ahmad Rifky Ridha, M.Pd.",
    nipTeacher: config.NIP_Guru || "-",
    cityDate: `${config.Tempat_Tanda_Tangan || "Makassar"}, 14 Juli 2026`,
    principal: config.Nama_Kepsek || "Dr. Suriana, S.Pd., M.Pd.",
    nipPrincipal: config.NIP_Kepsek || "-",
    cpRasional: "Pada akhir Fase D, peserta didik mampu memahami, menyelesaikan masalah, dan bernalar menggunakan pola, relasi, bentuk aljabar, geometri, serta analisis data dan peluang dalam kehidupan sehari-hari.",
    cpElemen: `Elemen 1 — Bilangan:
Peserta didik mampu membaca, menulis, membandingkan bilangan bulat, rasional, dan irasional, serta menggunakannya dalam menyelesaikan masalah kontekstual.

Elemen 2 — Aljabar:
Peserta didik mampu menyatakan situasi ke dalam bentuk aljabar, menggunakan sifat-sifat operasi untuk menghasilkan bentuk aljabar yang ekuivalen, serta menyelesaikan sistem persamaan linier.

Elemen 3 — Pengukuran & Geometri:
Peserta didik mampu menghitung luas lingkaran, volume bangun ruang sisi datar, menggunakan teorema Pythagoras, dan transformasi geometri.

Elemen 4 — Analisis Data dan Peluang:
Peserta didik mampu merumuskan pertanyaan, mengumpulkan, menyajikan, dan menganalisis data untuk menjawab pertanyaan serta menentukan peluang empiris dan teoretis.`
  });

  // State untuk Rencana Minggu Efektif (RME / RPE) & Kalender Pendidikan
  const [rmeGanjil, setRmeGanjil] = useState<RmeMonthItem[]>(DEFAULT_RME_GANJIL);
  const [rmeGenap, setRmeGenap] = useState<RmeMonthItem[]>(DEFAULT_RME_GENAP);
  const [agendaSekolah, setAgendaSekolah] = useState<AgendaSekolahItem[]>(DEFAULT_AGENDA_SEKOLAH);
  const [catatanKalender, setCatatanKalender] = useState<string>(DEFAULT_CATATAN_KALENDER);
  const [isRmeExpanded, setIsRmeExpanded] = useState<boolean>(true);
  const [activeRmeTab, setActiveRmeTab] = useState<"ganjil" | "genap" | "agenda">("ganjil");

  // Kalkulasi Otomatis Total Pekan & Distribusi Jam Pelajaran (JP)
  const parsedJpPerMinggu = parseInt(formData.jpPerMinggu) || 3;

  const totGanjilTotal = rmeGanjil.reduce((acc, m) => acc + (Number(m.totalWeeks) || 0), 0);
  const totGanjilNon = rmeGanjil.reduce((acc, m) => acc + (Number(m.nonEffective) || 0), 0);
  const totGanjilEff = rmeGanjil.reduce((acc, m) => acc + (Number(m.effective) || 0), 0);
  const jpGanjil = totGanjilEff * parsedJpPerMinggu;

  const totGenapTotal = rmeGenap.reduce((acc, m) => acc + (Number(m.totalWeeks) || 0), 0);
  const totGenapNon = rmeGenap.reduce((acc, m) => acc + (Number(m.nonEffective) || 0), 0);
  const totGenapEff = rmeGenap.reduce((acc, m) => acc + (Number(m.effective) || 0), 0);
  const jpGenap = totGenapEff * parsedJpPerMinggu;

  const totTahunanTotal = totGanjilTotal + totGenapTotal;
  const totTahunanNon = totGanjilNon + totGenapNon;
  const totTahunanEff = totGanjilEff + totGenapEff;
  const totalJpCalculated = totTahunanEff * parsedJpPerMinggu;
  const jpIntrakurikuler = Math.round(totalJpCalculated * 0.75);
  const jpP5 = totalJpCalculated - jpIntrakurikuler;

  const handleRmeGanjilChange = (index: number, field: keyof RmeMonthItem, value: any) => {
    setRmeGanjil((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === "totalWeeks" || field === "nonEffective") {
        const total = field === "totalWeeks" ? Number(value) : Number(item.totalWeeks);
        const non = field === "nonEffective" ? Number(value) : Number(item.nonEffective);
        item.effective = Math.max(0, total - non);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleRmeGenapChange = (index: number, field: keyof RmeMonthItem, value: any) => {
    setRmeGenap((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === "totalWeeks" || field === "nonEffective") {
        const total = field === "totalWeeks" ? Number(value) : Number(item.totalWeeks);
        const non = field === "nonEffective" ? Number(value) : Number(item.nonEffective);
        item.effective = Math.max(0, total - non);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleSyncJpToForm = () => {
    const newTotalJpText = `${totalJpCalculated} JP / Tahun (${jpGanjil} JP Sem 1, ${jpGenap} JP Sem 2)`;
    setFormData((prev) => ({
      ...prev,
      totalJp: newTotalJpText
    }));
    notifySimpanSuccess(`Alokasi waktu total form berhasil disinkronkan menjadi ${totalJpCalculated} JP / Tahun!`);
  };

  const handleResetRme = () => {
    setRmeGanjil(DEFAULT_RME_GANJIL);
    setRmeGenap(DEFAULT_RME_GENAP);
    setAgendaSekolah(DEFAULT_AGENDA_SEKOLAH);
    setCatatanKalender(DEFAULT_CATATAN_KALENDER);
    notifySimpanSuccess("Data Rencana Minggu Efektif & Kalender Sekolah dikembalikan ke standar!");
  };

  const handleAddAgenda = () => {
    const newId = String(Date.now());
    setAgendaSekolah((prev) => [
      ...prev,
      {
        id: newId,
        kegiatan: "Kegiatan / Agenda Sekolah Baru",
        waktu: "Pekan Ke-..., Bulan ...",
        semester: "Ganjil",
        kategori: "Kurikuler"
      }
    ]);
  };

  const handleDeleteAgenda = (id: string) => {
    setAgendaSekolah((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAgendaChange = (id: string, field: keyof AgendaSekolahItem, value: any) => {
    setAgendaSekolah((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const docTypeList = [
    { id: "rme", label: "0. RME & Kalender", fullTitle: "Rencana Minggu Efektif (RME / RPE) & Kalender Pendidikan", icon: CalendarDays },
    { id: "analisis_cp", label: "1. Analisis CP", fullTitle: "Analisis Capaian Pembelajaran (CP)", icon: BookOpen },
    { id: "tp", label: "2. Tujuan Pembelajaran (TP)", fullTitle: "Tujuan Pembelajaran (TP)", icon: FileCheck },
    { id: "atp", label: "3. Alur TP (ATP)", fullTitle: "Alur Tujuan Pembelajaran (ATP)", icon: Layers },
    { id: "prota", label: "4. Program Tahunan", fullTitle: "Program Tahunan (Prota)", icon: Calendar },
    { id: "prosem", label: "5. Program Semester", fullTitle: "Program Semester (Prosem)", icon: FileSpreadsheet },
    { id: "kktp", label: "6. KKTP", fullTitle: "Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)", icon: Award }
  ];

  const handleFillSample = () => {
    const newSampleData = {
      school: config.Nama_Sekolah || "SMP Islam Athirah Baruga Antang",
      subject: "Matematika",
      singkatanMapel: "MTK",
      level: "Fase D / Kelas VIII",
      year: "2026/2027",
      totalJp: "114 JP / Tahun",
      jpPerMinggu: "3 JP/Minggu",
      teacher: config.Nama_Guru || "Ahmad Rifky Ridha, M.Pd.",
      nipTeacher: config.NIP_Guru || "-",
      cityDate: `${config.Tempat_Tanda_Tangan || "Makassar"}, 14 Juli 2026`,
      principal: config.Nama_Kepsek || "Dr. Suriana, S.Pd., M.Pd.",
      nipPrincipal: config.NIP_Kepsek || "-",
      cpRasional: "Pada akhir Fase D, peserta didik mampu memahami, menyelesaikan masalah, dan bernalar menggunakan pola, relasi, bentuk aljabar, geometri, serta analisis data dan peluang dalam kehidupan sehari-hari.",
      cpElemen: `Elemen 1 — Bilangan:
Peserta didik mampu membaca, menulis, membandingkan bilangan bulat, rasional, dan irasional, serta menggunakannya dalam menyelesaikan masalah kontekstual.

Elemen 2 — Aljabar:
Peserta didik mampu menyatakan situasi ke dalam bentuk aljabar, menggunakan sifat-sifat operasi untuk menghasilkan bentuk aljabar yang ekuivalen, serta menyelesaikan sistem persamaan linier.

Elemen 3 — Pengukuran & Geometri:
Peserta didik mampu menghitung luas lingkaran, volume bangun ruang sisi datar, menggunakan teorema Pythagoras, dan transformasi geometri.

Elemen 4 — Analisis Data dan Peluang:
Peserta didik mampu merumuskan pertanyaan, mengumpulkan, menyajikan, dan menganalisis data untuk menjawab pertanyaan serta menentukan peluang empiris dan teoretis.`
    };
    setFormData(newSampleData);
    setRmeGanjil(DEFAULT_RME_GANJIL);
    setRmeGenap(DEFAULT_RME_GENAP);
    setAgendaSekolah(DEFAULT_AGENDA_SEKOLAH);
    setCatatanKalender(DEFAULT_CATATAN_KALENDER);
    // Sinkronkan ke Modul Ajar AI
    savePerangkatSyncData(extractSyncDataFromPerangkat(newSampleData));
    notifySimpanSuccess("Contoh data Matematika Kelas VIII & RME Kalender Sekolah berhasil dimuat & disinkronkan ke Modul Ajar!");
  };

  // Helper to sanitize HTML output and ensure school logo in top-left header
  const sanitizeHtmlForOutput = (rawHtml: string) => {
    if (!rawHtml) return "";
    let clean = rawHtml;
    const defaultLogoTag = `<img src="${config.Logo_Kiri || config.Logo_Kanan || 'https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU'}" alt="Logo Sekolah" class="logo-sekolah" style="max-height: 70px; width: auto; float: left; margin-right: 15px; object-fit: contain;" />`;
    
    // Replace logo placeholders with top-left header logo
    clean = clean.replace(/\[\s*LOGO[^\n\]]*\]/gi, defaultLogoTag);
    clean = clean.replace(/\[\s*Gambar Logo[^\n\]]*\]/gi, defaultLogoTag);
    // Remove print buttons/text like "🖨️ Cetak Dokumen"
    clean = clean.replace(/<button[^>]*>.*?cetak.*?<\/button>/gi, "");
    clean = clean.replace(/<a[^>]*>.*?cetak.*?<\/a>/gi, "");
    clean = clean.replace(/🖨️?\s*Cetak\s*Dokumen/gi, "");
    clean = clean.replace(/🖨️/g, "");
    return clean;
  };

  const buildInstantRmeHtml = () => {
    let totG1Weeks = 0, totG1Non = 0, totG1Eff = 0;
    let totG2Weeks = 0, totG2Non = 0, totG2Eff = 0;

    const rowsGanjil = rmeGanjil.map((r, idx) => {
      totG1Weeks += Number(r.totalWeeks || 0);
      totG1Non += Number(r.nonEffective || 0);
      totG1Eff += Number(r.effective || 0);
      return `<tr>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${idx + 1}</td>
        <td style="border:1px solid #333; padding:6px 8px;"><strong>${r.month}</strong></td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${r.totalWeeks}</td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${r.nonEffective}</td>
        <td style="text-align:center; font-weight:bold; color:#1a3a5c; border:1px solid #333; padding:6px 8px;">${r.effective}</td>
        <td style="border:1px solid #333; padding:6px 8px;">${r.note || '-'}</td>
      </tr>`;
    }).join("");

    const rowsGenap = rmeGenap.map((r, idx) => {
      totG2Weeks += Number(r.totalWeeks || 0);
      totG2Non += Number(r.nonEffective || 0);
      totG2Eff += Number(r.effective || 0);
      return `<tr>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${idx + 1}</td>
        <td style="border:1px solid #333; padding:6px 8px;"><strong>${r.month}</strong></td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${r.totalWeeks}</td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${r.nonEffective}</td>
        <td style="text-align:center; font-weight:bold; color:#1a3a5c; border:1px solid #333; padding:6px 8px;">${r.effective}</td>
        <td style="border:1px solid #333; padding:6px 8px;">${r.note || '-'}</td>
      </tr>`;
    }).join("");

    const totEffYear = totG1Eff + totG2Eff;
    const totJpYear = totEffYear * parsedJpPerMinggu;
    const jpIntra = Math.round(totJpYear * 0.75);
    const jpP5Local = totJpYear - jpIntra;

    const rowsAgenda = agendaSekolah.map((a, idx) => `
      <tr>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${idx + 1}</td>
        <td style="border:1px solid #333; padding:6px 8px;"><strong>${a.kegiatan}</strong></td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${a.waktu}</td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;">${a.semester || 'Ganjil'}</td>
        <td style="text-align:center; border:1px solid #333; padding:6px 8px;"><span style="padding:2px 8px; border-radius:4px; font-size:9pt; background-color:#e0f2fe; color:#0369a1;">${a.kategori || 'Kurikuler'}</span></td>
      </tr>
    `).join("");

    const logoHtml = config.Logo_Kiri || config.Logo_Kanan 
      ? `<img src="${config.Logo_Kiri || config.Logo_Kanan}" alt="Logo" class="logo-sekolah" style="max-height:70px; width:auto; float:left; margin-right:15px; object-fit:contain;" />`
      : "";

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.5; font-size: 11pt;">
        <div style="text-align:center; border-bottom:3px double #0f172a; padding-bottom:12px; margin-bottom:20px; overflow:hidden;">
          ${logoHtml}
          <div style="display:inline-block; vertical-align:middle;">
            <h3 style="margin:0; font-size:12pt; font-weight:bold; text-transform:uppercase; color:#334155;">${config.Pemerintah || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h3>
            <h2 style="margin:4px 0; font-size:14pt; font-weight:bold; text-transform:uppercase; color:#1a3a5c;">${formData.school}</h2>
            <p style="margin:2px 0 0; font-size:9.5pt; color:#475569;">${config.Alamat_Sekolah || 'Jl. Raya Pendidikan No. 01'}</p>
          </div>
        </div>

        <div style="text-align:center; font-size:14pt; font-weight:bold; color:#1a3a5c; margin-bottom:4px; text-transform:uppercase;">
          RENCANA MINGGU EFEKTIF (RME / RPE) & KALENDER PENDIDIKAN
        </div>
        <div style="text-align:center; font-size:10pt; color:#64748b; margin-bottom:20px;">
          Analisis Pekan Efektif & Distribusi Jam Pelajaran (JP) | Tahun Pelajaran ${formData.year}
        </div>

        <div style="font-size:11.5pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:4px; margin-top:20px; margin-bottom:10px;">
          A. IDENTITAS PROGRAM & SATUAN PENDIDIKAN
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10.5pt;">
          <tr>
            <td style="width:25%; font-weight:bold; background-color:#f1f5f9; border:1px solid #333; padding:6px 8px;">Satuan Pendidikan</td>
            <td style="border:1px solid #333; padding:6px 8px;">${formData.school}</td>
            <td style="width:25%; font-weight:bold; background-color:#f1f5f9; border:1px solid #333; padding:6px 8px;">Mata Pelajaran</td>
            <td style="border:1px solid #333; padding:6px 8px;">${formData.subject} (${formData.singkatanMapel})</td>
          </tr>
          <tr>
            <td style="font-weight:bold; background-color:#f1f5f9; border:1px solid #333; padding:6px 8px;">Fase / Kelas</td>
            <td style="border:1px solid #333; padding:6px 8px;">${formData.level}</td>
            <td style="font-weight:bold; background-color:#f1f5f9; border:1px solid #333; padding:6px 8px;">Tahun Pelajaran</td>
            <td style="border:1px solid #333; padding:6px 8px;">${formData.year}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; background-color:#f1f5f9; border:1px solid #333; padding:6px 8px;">Beban Tatap Muka</td>
            <td style="border:1px solid #333; padding:6px 8px;">${formData.jpPerMinggu}</td>
            <td style="font-weight:bold; background-color:#f1f5f9; border:1px solid #333; padding:6px 8px;">Guru Pengampu</td>
            <td style="border:1px solid #333; padding:6px 8px;">${formData.teacher}</td>
          </tr>
        </table>

        <div style="font-size:11.5pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:4px; margin-top:20px; margin-bottom:10px;">
          B. ANALISIS MINGGU EFEKTIF SEMESTER GANJIL
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10pt;">
          <thead>
            <tr style="background-color:#1a3a5c; color:#ffffff;">
              <th style="width:6%; border:1px solid #333; padding:8px; text-align:center;">No</th>
              <th style="width:18%; border:1px solid #333; padding:8px;">Nama Bulan</th>
              <th style="width:14%; border:1px solid #333; padding:8px; text-align:center;">Jumlah Minggu</th>
              <th style="width:16%; border:1px solid #333; padding:8px; text-align:center;">Minggu Tdk Efektif</th>
              <th style="width:14%; border:1px solid #333; padding:8px; text-align:center;">Minggu Efektif</th>
              <th style="border:1px solid #333; padding:8px;">Keterangan / Agenda Kegiatan Sekolah</th>
            </tr>
          </thead>
          <tbody>
            ${rowsGanjil}
            <tr style="background-color:#f1f5f9; font-weight:bold;">
              <td colspan="2" style="border:1px solid #333; padding:6px 8px; text-align:center;">Jumlah Semester Ganjil</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">${totG1Weeks}</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">${totG1Non}</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; color:#1a3a5c;">${totG1Eff}</td>
              <td style="border:1px solid #333; padding:6px 8px;">Pekan Efektif Ganjil = ${totG1Eff * parsedJpPerMinggu} Jam Pelajaran (JP)</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size:11.5pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:4px; margin-top:20px; margin-bottom:10px;">
          C. ANALISIS MINGGU EFEKTIF SEMESTER GENAP
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10pt;">
          <thead>
            <tr style="background-color:#1a3a5c; color:#ffffff;">
              <th style="width:6%; border:1px solid #333; padding:8px; text-align:center;">No</th>
              <th style="width:18%; border:1px solid #333; padding:8px;">Nama Bulan</th>
              <th style="width:14%; border:1px solid #333; padding:8px; text-align:center;">Jumlah Minggu</th>
              <th style="width:16%; border:1px solid #333; padding:8px; text-align:center;">Minggu Tdk Efektif</th>
              <th style="width:14%; border:1px solid #333; padding:8px; text-align:center;">Minggu Efektif</th>
              <th style="border:1px solid #333; padding:8px;">Keterangan / Agenda Kegiatan Sekolah</th>
            </tr>
          </thead>
          <tbody>
            ${rowsGenap}
            <tr style="background-color:#f1f5f9; font-weight:bold;">
              <td colspan="2" style="border:1px solid #333; padding:6px 8px; text-align:center;">Jumlah Semester Genap</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">${totG2Weeks}</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">${totG2Non}</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; color:#1a3a5c;">${totG2Eff}</td>
              <td style="border:1px solid #333; padding:6px 8px;">Pekan Efektif Genap = ${totG2Eff * parsedJpPerMinggu} Jam Pelajaran (JP)</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size:11.5pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:4px; margin-top:20px; margin-bottom:10px;">
          D. REKAPITULASI RENCANA PEKAN EFEKTIF (RPE) & DISTRIBUSI JAM PELAJARAN
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10.5pt;">
          <thead>
            <tr style="background-color:#1a3a5c; color:#ffffff;">
              <th style="width:8%; border:1px solid #333; padding:8px; text-align:center;">No</th>
              <th style="border:1px solid #333; padding:8px;">Komponen Distribusi Jam Pembelajaran</th>
              <th style="width:22%; border:1px solid #333; padding:8px; text-align:center;">Jumlah Pekan</th>
              <th style="width:25%; border:1px solid #333; padding:8px; text-align:center;">Alokasi Jam Pelajaran (JP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">1</td>
              <td style="border:1px solid #333; padding:6px 8px;">Jumlah Pekan Efektif Semester Ganjil</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; font-weight:bold;">${totG1Eff} Pekan</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; font-weight:bold;">${totG1Eff * parsedJpPerMinggu} JP</td>
            </tr>
            <tr>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">2</td>
              <td style="border:1px solid #333; padding:6px 8px;">Jumlah Pekan Efektif Semester Genap</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; font-weight:bold;">${totG2Eff} Pekan</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; font-weight:bold;">${totG2Eff * parsedJpPerMinggu} JP</td>
            </tr>
            <tr style="background-color:#f8fafc; font-weight:bold;">
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">3</td>
              <td style="border:1px solid #333; padding:6px 8px;"><strong>Total Pekan Efektif 1 Tahun Ajaran</strong></td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; color:#1a3a5c;">${totEffYear} Pekan</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; color:#1a3a5c;">${totJpYear} JP</td>
            </tr>
            <tr>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">4</td>
              <td style="border:1px solid #333; padding:6px 8px;">Alokasi Tatap Muka Intrakurikuler (75%)</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">${Math.round(totEffYear * 0.75)} Pekan</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; font-weight:bold; color:#166534;">${jpIntra} JP</td>
            </tr>
            <tr>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">5</td>
              <td style="border:1px solid #333; padding:6px 8px;">Alokasi Projek Penguatan Profil Pelajar (P5) / Karakter (25%)</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center;">${totEffYear - Math.round(totEffYear * 0.75)} Pekan</td>
              <td style="border:1px solid #333; padding:6px 8px; text-align:center; font-weight:bold; color:#9a3412;">${jpP5Local} JP</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size:11.5pt; font-weight:bold; color:#1a3a5c; border-bottom:1.5px solid #1a3a5c; padding-bottom:4px; margin-top:20px; margin-bottom:10px;">
          E. KALENDER PENDIDIKAN & AGENDA UTAMA SEKOLAH
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10pt;">
          <thead>
            <tr style="background-color:#1a3a5c; color:#ffffff;">
              <th style="width:6%; border:1px solid #333; padding:8px; text-align:center;">No</th>
              <th style="border:1px solid #333; padding:8px;">Nama Agenda / Kegiatan Sekolah</th>
              <th style="width:25%; border:1px solid #333; padding:8px; text-align:center;">Rentang Waktu / Tanggal</th>
              <th style="width:12%; border:1px solid #333; padding:8px; text-align:center;">Semester</th>
              <th style="width:16%; border:1px solid #333; padding:8px; text-align:center;">Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${rowsAgenda}
          </tbody>
        </table>

        <div style="background-color:#f8fafc; border-left:4px solid #1a3a5c; padding:10px 14px; margin-bottom:20px; font-size:10pt;">
          <strong>Catatan Pedoman Kalender Pendidikan:</strong><br>
          ${catatanKalender || 'Kalender Pendidikan berpedoman pada Keputusan Dinas Pendidikan dan Kalender Akademik Resmi Sekolah.'}
        </div>

        <table style="width:100%; border:none; margin-top:30px; font-size:10pt;">
          <tr>
            <td style="border:none; text-align:center; width:50%; vertical-align:top;">
              Mengetahui,<br>
              <strong>Kepala Satuan Pendidikan</strong><br><br><br><br><br>
              <strong><u>${formData.principal}</u></strong><br>
              NIP. ${formData.nipPrincipal}
            </td>
            <td style="border:none; text-align:center; width:50%; vertical-align:top;">
              ${formData.cityDate}<br>
              <strong>Guru Mata Pelajaran</strong><br><br><br><br><br>
              <strong><u>${formData.teacher}</u></strong><br>
              NIP. ${formData.nipTeacher}
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  // Auto-generate clean initial RME preview on mount & auto-sync to Modul Ajar AI
  React.useEffect(() => {
    if (!generatedDocs.rme) {
      setGeneratedDocs((prev) => ({
        ...prev,
        rme: buildInstantRmeHtml()
      }));
    }
    // Sinkronkan data perangkat ajar ke Modul Ajar AI secara otomatis
    try {
      const syncData = extractSyncDataFromPerangkat(formData);
      savePerangkatSyncData(syncData);
    } catch (syncErr) {
      console.warn("Gagal inisialisasi sinkronisasi perangkat:", syncErr);
    }
  }, []);

  const getPayloadFormData = () => {
    return {
      ...formData,
      rme: {
        ganjil: rmeGanjil,
        genap: rmeGenap,
        agenda: agendaSekolah,
        catatanKalender,
        summary: {
          pekanGanjil: totGanjilEff,
          pekanGenap: totGenapEff,
          totalPekan: totTahunanEff,
          jpGanjil,
          jpGenap,
          totalJp: totalJpCalculated,
          jpIntrakurikuler,
          jpP5
        }
      }
    };
  };

  // Real-time synchronization whenever subject, level, or cpElemen is updated
  React.useEffect(() => {
    try {
      const payload = getPayloadFormData();
      savePerangkatSyncData(extractSyncDataFromPerangkat(payload, generatedDocs));
    } catch (err) {
      console.warn("Auto-sync update notice:", err);
    }
  }, [formData.subject, formData.singkatanMapel, formData.level, formData.year, formData.school, formData.cpElemen]);

  const handleJumpToModulAjar = () => {
    try {
      const payload = getPayloadFormData();
      savePerangkatSyncData(extractSyncDataFromPerangkat(payload, generatedDocs));
      notifySimpanSuccess("Data Perangkat Ajar & Daftar Bab berhasil disinkronkan ke Modul Ajar AI!");
    } catch (e) {
      console.warn("Sync jump notice:", e);
    }
    if (onNavigateToModulAjar) {
      onNavigateToModulAjar();
    }
  };

  const handleGenerateDoc = async (targetType: string) => {
    setIsGenerating(true);
    const docMeta = docTypeList.find((d) => d.id === targetType);
    setGeneratingProgress(`Menyusun ${docMeta?.fullTitle || targetType}...`);

    try {
      const payloadFormData = getPayloadFormData();
      let cleanedHtml = "";
      let isFallbackUsed = false;

      // Special case: instant local RME
      if (targetType === "rme") {
        cleanedHtml = sanitizeHtmlForOutput(buildInstantRmeHtml());
      } else {
        try {
          const res = await fetch("/api/ai/generate-perangkat-ajar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              docType: targetType,
              formData: payloadFormData
            })
          });

          const contentType = res.headers.get("content-type") || "";
          if (res.ok && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.status === "success" && data.html) {
              cleanedHtml = sanitizeHtmlForOutput(data.html);
              if (data.isFallback) isFallbackUsed = true;
            } else {
              throw new Error(data.message || "Gagal menghasilkan dokumen dari AI");
            }
          } else {
            console.warn("Backend API returned non-JSON / timeout response, activating instant Kurikulum Merdeka builder");
            cleanedHtml = sanitizeHtmlForOutput(buildKurikulumMerdekaDocument(targetType, payloadFormData));
            isFallbackUsed = true;
          }
        } catch (fetchErr: any) {
          console.warn("API call failed or timed out, compiling Kurikulum Merdeka document directly:", fetchErr?.message);
          cleanedHtml = sanitizeHtmlForOutput(buildKurikulumMerdekaDocument(targetType, payloadFormData));
          isFallbackUsed = true;
        }
      }

      if (cleanedHtml) {
        setGeneratedDocs((prev) => ({
          ...prev,
          [targetType]: cleanedHtml
        }));

        // Sinkronkan data perangkat & bab ke Modul Ajar AI
        try {
          savePerangkatSyncData(extractSyncDataFromPerangkat(payloadFormData));
        } catch (e) {
          console.warn("Gagal sinkron perangkat pasca generasi:", e);
        }

        notifySimpanSuccess(
          isFallbackUsed
            ? `${docMeta?.fullTitle || "Dokumen"} berhasil disusun otomatis sesuai standar Kurikulum Merdeka!`
            : `${docMeta?.fullTitle || "Dokumen"} berhasil dibuat!`
        );
      }
    } catch (err: any) {
      console.error(err);
      notifySimpanError(`Gagal membuat ${docMeta?.fullTitle}: ` + (err?.message || "Terjadi kesalahan."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAllDocs = async () => {
    setIsGenerating(true);
    const types = ["rme", "analisis_cp", "tp", "atp", "prota", "prosem", "kktp"];
    const payloadFormData = getPayloadFormData();

    for (let i = 0; i < types.length; i++) {
      const t = types[i];
      const docMeta = docTypeList.find((d) => d.id === t);
      setGeneratingProgress(`[${i + 1}/${types.length}] Menyusun ${docMeta?.fullTitle}...`);

      try {
        let cleanedHtml = "";

        if (t === "rme") {
          cleanedHtml = sanitizeHtmlForOutput(buildInstantRmeHtml());
        } else {
          try {
            const res = await fetch("/api/ai/generate-perangkat-ajar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                docType: t,
                formData: payloadFormData
              })
            });

            const contentType = res.headers.get("content-type") || "";
            if (res.ok && contentType.includes("application/json")) {
              const data = await res.json();
              if (data.status === "success" && data.html) {
                cleanedHtml = sanitizeHtmlForOutput(data.html);
              }
            }
          } catch (apiErr) {
            console.warn(`API call for ${t} timed out or failed, using instant builder:`, apiErr);
          }

          // Fallback if API didn't produce html
          if (!cleanedHtml) {
            cleanedHtml = sanitizeHtmlForOutput(buildKurikulumMerdekaDocument(t, payloadFormData));
          }
        }

        if (cleanedHtml) {
          setGeneratedDocs((prev) => ({
            ...prev,
            [t]: cleanedHtml
          }));
        }
      } catch (err) {
        console.error(`Gagal pada ${t}:`, err);
      }
    }

    // Sinkronkan seluruh data perangkat & bab ke Modul Ajar AI
    try {
      savePerangkatSyncData(extractSyncDataFromPerangkat(payloadFormData));
    } catch (e) {
      console.warn("Gagal sinkron perangkat pasca generasi all docs:", e);
    }

    setIsGenerating(false);
    notifySimpanSuccess("Seluruh 7 Dokumen Administrasi Perangkat Ajar Berhasil Disusun & Disinkronkan ke Modul Ajar!");
  };

  // Print A4 Function
  const handlePrintA4 = () => {
    const rawHtml = generatedDocs[activeDoc];
    if (!rawHtml) {
      notifySimpanError("Belum ada dokumen yang dihasilkan untuk dicetak.");
      return;
    }

    const activeHtml = sanitizeHtmlForOutput(rawHtml);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifySimpanError("Gagal membuka jendela cetak. Periksa pembatas pop-up browser Anda.");
      return;
    }

    const isLandscape = activeDoc === "atp" || activeDoc === "prosem" || activeDoc === "kktp";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Perangkat Ajar AI - A4 Presisi</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 ${isLandscape ? "landscape" : "portrait"};
              margin: 1.2cm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            th, td {
              border: 1px solid #333;
              padding: 6px 8px;
              font-size: 10pt;
            }
            th {
              background-color: #1a3a5c !important;
              color: #ffffff !important;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            /* Borderless signature and header tables */
            table[style*="border:none"], table[style*="border: 0"], table.ttd-table, table.signature-table {
              border: none !important;
            }
            table[style*="border:none"] td, table[style*="border: 0"] td, table.ttd-table td, table.signature-table td {
              border: none !important;
            }
            img, .logo-sekolah, .kop-logo {
              display: inline-block !important;
              max-height: 75px;
              width: auto;
              object-fit: contain;
              vertical-align: middle;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              img, .logo-sekolah, .kop-logo {
                display: inline-block !important;
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${activeHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download Word (.doc / .docx)
  const handleDownloadWord = () => {
    const rawHtml = generatedDocs[activeDoc];
    if (!rawHtml) {
      notifySimpanError("Belum ada dokumen yang dihasilkan untuk diunduh.");
      return;
    }

    const activeHtml = sanitizeHtmlForOutput(rawHtml);
    const orientation = activeDoc === "atp" || activeDoc === "prosem" || activeDoc === "kktp" ? "landscape" : "portrait";
    const docTitle = docTypeList.find((d) => d.id === activeDoc)?.fullTitle || "Perangkat_Ajar";
    const wordPageSize = orientation === "landscape" ? "841.9pt 595.3pt" : "595.3pt 841.9pt";

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForCustomXSL/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page WordSection1 {
              size: ${wordPageSize};
              mso-page-orientation: ${orientation};
              margin: 36.0pt 36.0pt 36.0pt 36.0pt;
            }
            div.WordSection1 {
              page: WordSection1;
            }
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              font-size: 11pt;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 15px;
            }
            td, th {
              border: 1px solid #1a3a5c;
              padding: 6px 8px;
              vertical-align: top;
            }
            th, td.header-cell, th.bg-header {
              background-color: #1a3a5c !important;
              background: #1a3a5c !important;
              color: #ffffff !important;
              font-weight: bold;
              text-align: center;
              mso-shading: windowtext transparent;
              mso-pattern: fill #1a3a5c;
            }
            /* Invisible signature table styling for MS Word */
            table[style*="border:none"], table[style*="border: 0"], table[style*="border:none !important"], table.ttd-table, table.signature-table {
              border: none !important;
              mso-border-alt: none !important;
            }
            table[style*="border:none"] td, table[style*="border: 0"] td, table[style*="border:none !important"] td, table.ttd-table td, table.signature-table td {
              border: none !important;
              mso-border-alt: none !important;
            }
            img {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="WordSection1">
            ${activeHtml}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordContent], {
      type: "application/msword;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.toUpperCase()}_${formData.subject.replace(/\s+/g, "_")}_${formData.level.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifyUnduhSuccess(`File Word (.doc) ${docTitle} berhasil diunduh!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Cyber HUD */}
      <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 font-mono font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>OTOMATISASI KURIKULUM MERDEKA AI</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
              Generator Perangkat Ajar AI
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Sintesis 6 Dokumen Lengkap Administrasi Guru (Analisis CP, TP, ATP, Prota, Prosem, dan KKTP) secara presisi, instan, siap cetak PDF A4 dan export Word (.doc).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto relative z-10">
            <button
              onClick={handleFillSample}
              className="bg-white/5 hover:bg-white/10 text-cyan-300 font-mono font-bold px-4 py-3 rounded-xl border border-cyan-500/30 text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Isi Contoh Bahasa Indonesia</span>
            </button>
            <button
              onClick={handleGenerateAllDocs}
              disabled={isGenerating}
              className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center space-x-2 text-xs md:text-sm cursor-pointer disabled:opacity-50 font-display"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Generate Semua 7 Dokumen (AI)</span>
            </button>
            <button
              onClick={handleJumpToModulAjar}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-3 rounded-xl shadow-[0_0_18px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center space-x-2 text-xs md:text-sm cursor-pointer font-display"
              title="Kirim dan sinkronkan hasil bab & tujuan pembelajaran ke Modul Ajar AI"
            >
              <Wand2 className="w-4 h-4 text-emerald-200" />
              <span>Susun Modul Ajar AI →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Input Data Administrasi */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-white/10 pb-3 font-display">
          <Building2 className="w-5 h-5 text-cyan-500" />
          <span>Data Identitas & Capaian Pembelajaran (CP)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Satuan Pendidikan</label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Singkatan Mapel (Kode TP)</label>
            <input
              type="text"
              value={formData.singkatanMapel}
              onChange={(e) => setFormData({ ...formData, singkatanMapel: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fase / Kelas</label>
            <input
              type="text"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tahun Pelajaran</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Alokasi Waktu Total</label>
            <input
              type="text"
              value={formData.totalJp}
              onChange={(e) => setFormData({ ...formData, totalJp: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Guru</label>
            <input
              type="text"
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NIP Guru</label>
            <input
              type="text"
              value={formData.nipTeacher}
              onChange={(e) => setFormData({ ...formData, nipTeacher: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kota / Tanggal TTD</label>
            <input
              type="text"
              value={formData.cityDate}
              onChange={(e) => setFormData({ ...formData, cityDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Kepala Sekolah</label>
            <input
              type="text"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NIP Kepala Sekolah</label>
            <input
              type="text"
              value={formData.nipPrincipal}
              onChange={(e) => setFormData({ ...formData, nipPrincipal: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">JP per Minggu</label>
            <input
              type="text"
              value={formData.jpPerMinggu}
              onChange={(e) => setFormData({ ...formData, jpPerMinggu: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              CP Umum / Rasional Mata Pelajaran
            </label>
            <textarea
              rows={4}
              value={formData.cpRasional}
              onChange={(e) => setFormData({ ...formData, cpRasional: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium leading-relaxed outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Capaian Pembelajaran (CP) Per Elemen
            </label>
            <textarea
              rows={4}
              value={formData.cpElemen}
              onChange={(e) => setFormData({ ...formData, cpElemen: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium leading-relaxed outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Rencana Minggu Efektif (RME / RPE) & Kalender Pendidikan Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
        {/* Header with Title, Badges, and Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <CalendarDays className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                Rencana Minggu Efektif (RME / RPE) &amp; Kalender Pendidikan
              </h3>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                REFERENSI WAJIB PROTA &amp; PROSEM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kalender pendidikan sekolah, rincian pekan efektif/tidak efektif per bulan, dan kalkulator distribusi JP tahunan.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSyncJpToForm}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Terapkan hasil perhitungan JP RME ke kolom Alokasi Waktu Total di form di atas"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Terapkan ke Form ({totalJpCalculated} JP)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const html = buildInstantRmeHtml();
                setGeneratedDocs((prev) => ({ ...prev, rme: html }));
                setActiveDoc("rme");
                notifySimpanSuccess("Pratinjau Dokumen RME & Kalender Pendidikan diperbarui!");
              }}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
              title="Lihat Pratinjau Dokumen A4 RME & Kalender Pendidikan"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pratinjau Dokumen</span>
            </button>

            <button
              type="button"
              onClick={handleResetRme}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 cursor-pointer transition-all"
              title="Kembalikan ke standar kalender pendidikan nasional"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRmeExpanded(!isRmeExpanded)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer"
              title={isRmeExpanded ? "Ciutkan Bagian RME" : "Buka Bagian RME"}
            >
              {isRmeExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* HUD Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Pekan Efektif Ganjil</span>
            <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
              {totGanjilEff} Pekan <span className="text-xs font-normal text-slate-500">({jpGanjil} JP)</span>
            </div>
            <span className="text-[10px] text-slate-400">Total {totGanjilTotal} Pekan (Non: {totGanjilNon})</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Pekan Efektif Genap</span>
            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {totGenapEff} Pekan <span className="text-xs font-normal text-slate-500">({jpGenap} JP)</span>
            </div>
            <span className="text-[10px] text-slate-400">Total {totGenapTotal} Pekan (Non: {totGenapNon})</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Total Efektif Tahunan</span>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {totTahunanEff} Pekan <span className="text-xs font-normal text-slate-500">({totalJpCalculated} JP)</span>
            </div>
            <span className="text-[10px] text-slate-400">Dasar Pengali: {parsedJpPerMinggu} JP/Minggu</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Distribusi Kurikulum</span>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 space-y-0.5 font-mono">
              <div className="text-emerald-600 dark:text-emerald-400">Tatap Muka (75%): {jpIntrakurikuler} JP</div>
              <div className="text-amber-600 dark:text-amber-400">Projek P5 (25%): {jpP5} JP</div>
            </div>
          </div>
        </div>

        {isRmeExpanded && (
          <div className="space-y-4 pt-1">
            {/* Sub-tab navigation */}
            <div className="flex border-b border-slate-200 dark:border-white/10 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveRmeTab("ganjil")}
                className={`px-4 py-2 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeRmeTab === "ganjil"
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester Ganjil (Juli - Des)</span>
                <span className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {totGanjilEff} Pekan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRmeTab("genap")}
                className={`px-4 py-2 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeRmeTab === "genap"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester Genap (Jan - Juni)</span>
                <span className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {totGenapEff} Pekan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRmeTab("agenda")}
                className={`px-4 py-2 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center space-x-2 shrink-0 ${
                  activeRmeTab === "agenda"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Kalender Pendidikan &amp; Agenda Sekolah</span>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {agendaSekolah.length} Event
                </span>
              </button>
            </div>

            {/* Tab 1: Semester Ganjil */}
            {activeRmeTab === "ganjil" && (
              <div className="space-y-4">
                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                        <th className="p-2.5 w-10 text-center font-bold">No</th>
                        <th className="p-2.5 w-32 font-bold">Bulan</th>
                        <th className="p-2.5 w-28 text-center font-bold">Jumlah Pekan</th>
                        <th className="p-2.5 w-32 text-center font-bold">Tdk Efektif</th>
                        <th className="p-2.5 w-28 text-center font-bold text-cyan-700 dark:text-cyan-400">Efektif</th>
                        <th className="p-2.5 font-bold">Keterangan / Agenda Kegiatan Sekolah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {rmeGanjil.map((m, idx) => (
                        <tr key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{m.month}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={m.totalWeeks}
                              onChange={(e) => handleRmeGanjilChange(idx, "totalWeeks", parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-mono font-bold outline-none focus:border-cyan-500"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={m.nonEffective}
                              onChange={(e) => handleRmeGanjilChange(idx, "nonEffective", parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-mono font-bold outline-none focus:border-red-500 text-red-500"
                            />
                          </td>
                          <td className="p-2.5 text-center font-mono font-extrabold text-cyan-700 dark:text-cyan-400 text-sm">
                            {m.effective}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={m.note}
                              onChange={(e) => handleRmeGanjilChange(idx, "note", e.target.value)}
                              placeholder="Contoh: MPLS, PTS, SAS, Libur Semester"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium outline-none focus:border-cyan-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 dark:bg-slate-900/80 font-bold border-t border-slate-300 dark:border-white/10">
                        <td colSpan={2} className="p-2.5 text-center text-slate-700 dark:text-slate-300">
                          Jumlah Semester Ganjil
                        </td>
                        <td className="p-2.5 text-center font-mono">{totGanjilTotal}</td>
                        <td className="p-2.5 text-center font-mono text-red-500">{totGanjilNon}</td>
                        <td className="p-2.5 text-center font-mono text-cyan-700 dark:text-cyan-400 text-sm font-extrabold">
                          {totGanjilEff}
                        </td>
                        <td className="p-2.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                          = {jpGanjil} Jam Pelajaran (JP) @ {parsedJpPerMinggu} JP/Minggu
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Card Deck View (< md) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {rmeGanjil.map((m, idx) => (
                    <div
                      key={m.month}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-mono font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {m.month}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                          {m.effective} Pekan Efektif
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                            Total Pekan
                          </span>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleRmeGanjilChange(idx, "totalWeeks", Math.max(0, m.totalWeeks - 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                              {m.totalWeeks}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRmeGanjilChange(idx, "totalWeeks", Math.min(6, m.totalWeeks + 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                            Tidak Efektif
                          </span>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleRmeGanjilChange(idx, "nonEffective", Math.max(0, m.nonEffective - 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-base text-red-600 dark:text-red-400">
                              {m.nonEffective}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRmeGanjilChange(idx, "nonEffective", Math.min(6, m.nonEffective + 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                          Keterangan / Agenda Kegiatan
                        </label>
                        <input
                          type="text"
                          value={m.note}
                          onChange={(e) => handleRmeGanjilChange(idx, "note", e.target.value)}
                          placeholder="Contoh: MPLS, PTS, SAS, Libur Semester"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-xs font-medium outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Summary Card for Mobile */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-slate-100 to-cyan-500/5 dark:from-cyan-950/40 dark:via-slate-900 dark:to-cyan-900/20 border border-cyan-500/30 space-y-2">
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      Ringkasan Semester Ganjil
                    </h5>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Pekan</span>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{totGanjilTotal}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tdk Efektif</span>
                        <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">{totGanjilNon}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-cyan-500/30">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Efektif</span>
                        <span className="font-mono font-extrabold text-sm text-cyan-700 dark:text-cyan-300">{totGanjilEff}</span>
                      </div>
                    </div>
                    <p className="text-center text-[11px] font-mono text-cyan-800 dark:text-cyan-300 font-bold pt-1">
                      = {jpGanjil} Jam Pelajaran (JP) @ {parsedJpPerMinggu} JP/Minggu
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Semester Genap */}
            {activeRmeTab === "genap" && (
              <div className="space-y-4">
                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                        <th className="p-2.5 w-10 text-center font-bold">No</th>
                        <th className="p-2.5 w-32 font-bold">Bulan</th>
                        <th className="p-2.5 w-28 text-center font-bold">Jumlah Pekan</th>
                        <th className="p-2.5 w-32 text-center font-bold">Tdk Efektif</th>
                        <th className="p-2.5 w-28 text-center font-bold text-indigo-700 dark:text-indigo-400">Efektif</th>
                        <th className="p-2.5 font-bold">Keterangan / Agenda Kegiatan Sekolah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {rmeGenap.map((m, idx) => (
                        <tr key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{m.month}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={m.totalWeeks}
                              onChange={(e) => handleRmeGenapChange(idx, "totalWeeks", parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-mono font-bold outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={m.nonEffective}
                              onChange={(e) => handleRmeGenapChange(idx, "nonEffective", parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-mono font-bold outline-none focus:border-red-500 text-red-500"
                            />
                          </td>
                          <td className="p-2.5 text-center font-mono font-extrabold text-indigo-700 dark:text-indigo-400 text-sm">
                            {m.effective}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={m.note}
                              onChange={(e) => handleRmeGenapChange(idx, "note", e.target.value)}
                              placeholder="Contoh: Libur Ramadhan, PTS Genap, SAT, Libur Kenaikan"
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium outline-none focus:border-indigo-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 dark:bg-slate-900/80 font-bold border-t border-slate-300 dark:border-white/10">
                        <td colSpan={2} className="p-2.5 text-center text-slate-700 dark:text-slate-300">
                          Jumlah Semester Genap
                        </td>
                        <td className="p-2.5 text-center font-mono">{totGenapTotal}</td>
                        <td className="p-2.5 text-center font-mono text-red-500">{totGenapNon}</td>
                        <td className="p-2.5 text-center font-mono text-indigo-700 dark:text-indigo-400 text-sm font-extrabold">
                          {totGenapEff}
                        </td>
                        <td className="p-2.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                          = {jpGenap} Jam Pelajaran (JP) @ {parsedJpPerMinggu} JP/Minggu
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Card Deck View (< md) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {rmeGenap.map((m, idx) => (
                    <div
                      key={m.month}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {m.month}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                          {m.effective} Pekan Efektif
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                            Total Pekan
                          </span>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleRmeGenapChange(idx, "totalWeeks", Math.max(0, m.totalWeeks - 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                              {m.totalWeeks}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRmeGenapChange(idx, "totalWeeks", Math.min(6, m.totalWeeks + 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                            Tidak Efektif
                          </span>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleRmeGenapChange(idx, "nonEffective", Math.max(0, m.nonEffective - 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-base text-red-600 dark:text-red-400">
                              {m.nonEffective}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRmeGenapChange(idx, "nonEffective", Math.min(6, m.nonEffective + 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all text-base cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                          Keterangan / Agenda Kegiatan
                        </label>
                        <input
                          type="text"
                          value={m.note}
                          onChange={(e) => handleRmeGenapChange(idx, "note", e.target.value)}
                          placeholder="Contoh: Libur Ramadhan, PTS Genap, SAT, Libur Kenaikan"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Summary Card for Mobile */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-slate-100 to-indigo-500/5 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-900/20 border border-indigo-500/30 space-y-2">
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      Ringkasan Semester Genap
                    </h5>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Pekan</span>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{totGenapTotal}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tdk Efektif</span>
                        <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">{totGenapNon}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-indigo-500/30">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Efektif</span>
                        <span className="font-mono font-extrabold text-sm text-indigo-700 dark:text-indigo-300">{totGenapEff}</span>
                      </div>
                    </div>
                    <p className="text-center text-[11px] font-mono text-indigo-800 dark:text-indigo-300 font-bold pt-1">
                      = {jpGenap} Jam Pelajaran (JP) @ {parsedJpPerMinggu} JP/Minggu
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Kalender Pendidikan & Agenda Sekolah */}
            {activeRmeTab === "agenda" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Daftar Agenda Kegiatan &amp; Libur Resmi Sekolah (Tahun Pelajaran {formData.year})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAgenda}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all font-mono shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Agenda Kegiatan</span>
                  </button>
                </div>

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                        <th className="p-2.5 w-10 text-center font-bold">No</th>
                        <th className="p-2.5 font-bold">Nama Agenda / Kegiatan Sekolah</th>
                        <th className="p-2.5 w-48 font-bold">Rentang Waktu / Tanggal</th>
                        <th className="p-2.5 w-28 text-center font-bold">Semester</th>
                        <th className="p-2.5 w-32 text-center font-bold">Kategori</th>
                        <th className="p-2.5 w-12 text-center font-bold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {agendaSekolah.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.kegiatan}
                              onChange={(e) => handleAgendaChange(item.id, "kegiatan", e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.waktu}
                              onChange={(e) => handleAgendaChange(item.id, "waktu", e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-mono outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <select
                              value={item.semester}
                              onChange={(e) => handleAgendaChange(item.id, "semester", e.target.value as any)}
                              className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium outline-none text-slate-800 dark:text-slate-200"
                            >
                              <option value="Ganjil">Ganjil</option>
                              <option value="Genap">Genap</option>
                              <option value="Semua">Semua</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <select
                              value={item.kategori}
                              onChange={(e) => handleAgendaChange(item.id, "kategori", e.target.value as any)}
                              className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium outline-none text-slate-800 dark:text-slate-200"
                            >
                              <option value="Kurikuler">Kurikuler</option>
                              <option value="Asesmen">Asesmen</option>
                              <option value="Libur">Libur</option>
                              <option value="Karakter/P5">Karakter/P5</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteAgenda(item.id)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                              title="Hapus Agenda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Deck (< md) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {agendaSekolah.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            {item.semester}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                            {item.kategori}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                          Nama Kegiatan / Agenda
                        </label>
                        <input
                          type="text"
                          value={item.kegiatan}
                          onChange={(e) => handleAgendaChange(item.id, "kegiatan", e.target.value)}
                          placeholder="Nama kegiatan..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                          Rentang Waktu / Tanggal
                        </label>
                        <input
                          type="text"
                          value={item.waktu}
                          onChange={(e) => handleAgendaChange(item.id, "waktu", e.target.value)}
                          placeholder="Contoh: 13 - 24 Juli 2026"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-mono text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Semester
                          </label>
                          <select
                            value={item.semester}
                            onChange={(e) => handleAgendaChange(item.id, "semester", e.target.value as any)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium text-xs outline-none text-slate-800 dark:text-slate-200"
                          >
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                            <option value="Semua">Semua</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Kategori
                          </label>
                          <select
                            value={item.kategori}
                            onChange={(e) => handleAgendaChange(item.id, "kategori", e.target.value as any)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium text-xs outline-none text-slate-800 dark:text-slate-200"
                          >
                            <option value="Kurikuler">Kurikuler</option>
                            <option value="Asesmen">Asesmen</option>
                            <option value="Libur">Libur</option>
                            <option value="Karakter/P5">Karakter/P5</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Catatan Pedoman Kalender Pendidikan Sekolah (Kebijakan Dinas / Yayasan):
                  </label>
                  <textarea
                    rows={2}
                    value={catatanKalender}
                    onChange={(e) => setCatatanKalender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Tab Navigation HUD */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-cyan-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm md:text-base font-display">
              Pilih Dokumen Administrasi AI
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleGenerateDoc(activeDoc)}
              disabled={isGenerating}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate {docTypeList.find((d) => d.id === activeDoc)?.label}</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {docTypeList.map((doc) => {
            const Icon = doc.icon;
            const isTabActive = activeDoc === doc.id;
            const isDone = Boolean(generatedDocs[doc.id]);

            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id as any)}
                className={`flex flex-col items-center text-center p-3 rounded-xl border text-xs font-bold transition-all relative cursor-pointer font-mono ${
                  isTabActive
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] scale-102"
                    : isDone
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-slate-100/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white/10"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isTabActive ? "text-slate-950" : isDone ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="truncate w-full">{doc.label}</span>
                {isDone && (
                  <CheckCircle2 className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-emerald-500 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Stage AI Progress Stepper during generation */}
      {isGenerating && (
        <AiProgressStepper 
          overallProgress={generatingProgress || "Sedang memproses AI Perangkat Ajar..."} 
          estimatedSeconds={30} 
        />
      )}

      {/* Output Document Display & Action Bar */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-sm md:text-base text-cyan-300 font-display">
              {docTypeList.find((d) => d.id === activeDoc)?.fullTitle}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintA4}
              disabled={!generatedDocs[activeDoc]}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 disabled:opacity-40 cursor-pointer shadow-sm font-mono"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF (A4)</span>
            </button>
            <button
              onClick={handleDownloadWord}
              disabled={!generatedDocs[activeDoc]}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 disabled:opacity-40 cursor-pointer shadow-sm font-mono"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Word (.doc)</span>
            </button>
            <button
              onClick={handleJumpToModulAjar}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer font-display"
              title="Kirim bab & tujuan pembelajaran dokumen ini ke Modul Ajar AI"
            >
              <Wand2 className="w-4 h-4 text-slate-950" />
              <span>Susun Modul Ajar AI →</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-x-auto min-h-[500px] bg-slate-100/50 dark:bg-slate-950/70">
          {generatedDocs[activeDoc] ? (
            <div
              className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-300 max-w-5xl mx-auto font-sans leading-relaxed text-sm"
              dangerouslySetInnerHTML={{ __html: generatedDocs[activeDoc] }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-cyan-500/10 text-cyan-500 rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-float-slow">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg font-display">
                Belum ada dokumen {docTypeList.find((d) => d.id === activeDoc)?.label}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Klik tombol "Generate {docTypeList.find((d) => d.id === activeDoc)?.label}" di atas untuk menghasilkan dokumen secara otomatis menggunakan AI.
              </p>
              <button
                onClick={() => handleGenerateDoc(activeDoc)}
                disabled={isGenerating}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center space-x-2 cursor-pointer font-display"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Mulai Generate {docTypeList.find((d) => d.id === activeDoc)?.label}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
