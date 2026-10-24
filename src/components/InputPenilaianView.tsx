import React, { useState, useEffect, useRef } from "react";
import { 
  Star, 
  Save, 
  CheckCircle2, 
  History, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  ClipboardPaste,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Calculator,
  Layers,
  ArrowRight,
  Printer,
  Table,
  BookOpen,
  Plus,
  AlertCircle,
  HardDrive
} from "lucide-react";
import * as XLSX from "xlsx";
import { Siswa, Mapel, DataNilai, Pengaturan } from "../types";
import { BackupPenilaianModal } from "./BackupPenilaianModal";
import { 
  saveDocument, 
  deleteDocument, 
  batchSaveDocuments, 
  batchDeleteDocuments, 
  COLLECTIONS 
} from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  notifyUnduhSuccess,
  notifyUnduhError,
  notifyCetakSuccess,
  confirmDeleteAlert,
  showToastSuccess,
  showToastError
} from "../lib/swal";

interface InputPenilaianViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: DataNilai[];
  config: Pengaturan;
}

// Helper untuk mengklasifikasikan jenis penilaian
export const categorizeJenisPenilaian = (jenis: string): "sumatif" | "uts" | "uas" => {
  const clean = (jenis || "").toLowerCase().trim();
  if (clean === "uts" || clean.includes("tengah semester") || clean === "sts") {
    return "uts";
  }
  if (clean === "uas" || clean.includes("akhir semester") || clean === "sas") {
    return "uas";
  }
  return "sumatif";
};

// Hitung Nilai Akhir: Sumatif 50%, UTS 35%, UAS 15%
export const hitungNilaiAkhirSiswa = (
  studentGrades: DataNilai[]
): {
  avgSumatif: number | null;
  valUts: number | null;
  valUas: number | null;
  nilaiAkhir: number | null;
  predikat: string;
  keterangan: string;
} => {
  // Ambil nilai sumatif materi
  const sumatifItems = studentGrades.filter(
    (g) => categorizeJenisPenilaian(g.jenis) === "sumatif" && g.nilai !== "" && g.nilai !== undefined && !isNaN(Number(g.nilai))
  );
  const sumatifNums = sumatifItems.map((g) => Number(g.nilai));
  const avgSumatif = sumatifNums.length > 0 
    ? Number((sumatifNums.reduce((a, b) => a + b, 0) / sumatifNums.length).toFixed(1)) 
    : null;

  // Ambil nilai UTS
  const utsItem = studentGrades.find(
    (g) => categorizeJenisPenilaian(g.jenis) === "uts" && g.nilai !== "" && g.nilai !== undefined && !isNaN(Number(g.nilai))
  );
  const valUts = utsItem ? Number(utsItem.nilai) : null;

  // Ambil nilai UAS
  const uasItem = studentGrades.find(
    (g) => categorizeJenisPenilaian(g.jenis) === "uas" && g.nilai !== "" && g.nilai !== undefined && !isNaN(Number(g.nilai))
  );
  const valUas = uasItem ? Number(uasItem.nilai) : null;

  // Perhitungan Nilai Akhir (50% Sumatif, 35% UTS, 15% UAS)
  let nilaiAkhir: number | null = null;
  if (avgSumatif !== null || valUts !== null || valUas !== null) {
    const sPart = (avgSumatif !== null ? avgSumatif : 0) * 0.50;
    const utsPart = (valUts !== null ? valUts : 0) * 0.35;
    const uasPart = (valUas !== null ? valUas : 0) * 0.15;
    nilaiAkhir = Number((sPart + utsPart + uasPart).toFixed(1));
  }

  // Tentukan Predikat & Keterangan
  let predikat = "-";
  let keterangan = "Belum Ada Nilai";
  if (nilaiAkhir !== null) {
    if (nilaiAkhir >= 88) {
      predikat = "A";
      keterangan = "Sangat Baik (Tercapai Maksimal)";
    } else if (nilaiAkhir >= 78) {
      predikat = "B";
      keterangan = "Baik (Tercapai)";
    } else if (nilaiAkhir >= 70) {
      predikat = "C";
      keterangan = "Cukup (Perlu Pemantapan)";
    } else {
      predikat = "D";
      keterangan = "Perlu Bimbingan Khusus";
    }
  }

  return {
    avgSumatif,
    valUts,
    valUas,
    nilaiAkhir,
    predikat,
    keterangan
  };
};

export const InputPenilaianView: React.FC<InputPenilaianViewProps> = ({
  siswaList,
  mapelList,
  nilaiList,
  config
}) => {
  // Navigation Tabs: master (Utama), input (Satuan), rekap (Leger Matriks), riwayat (Log)
  const [activeSubTab, setActiveSubTab] = useState<"master" | "input" | "rekap" | "riwayat">("master");
  
  // Selection States
  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();
  const [selectedKelas, setSelectedKelas] = useState<string>(kelasOptions[0] || "");
  const [selectedMapel, setSelectedMapel] = useState<string>(mapelList[0]?.namaMapel || "");

  // -------------------------------------------------------------
  // MASTER INPUT STATE (SEMUA SUMATIF, UTS, DAN UAS SEKALIGUS)
  // -------------------------------------------------------------
  const [masterSumatifCols, setMasterSumatifCols] = useState<string[]>([
    "Sumatif 1",
    "Sumatif 2",
    "Sumatif 3"
  ]);
  // masterGradesMap: [studentId: string] -> { [colKey: string]: number | "" }
  const [masterGradesMap, setMasterGradesMap] = useState<Record<string, Record<string, number | "">>>({});
  const masterFileInputRef = useRef<HTMLInputElement>(null);
  const [isMasterPasteModalOpen, setIsMasterPasteModalOpen] = useState(false);
  const [masterPasteText, setMasterPasteText] = useState("");
  const [newSumatifColName, setNewSumatifColName] = useState("");
  const [isAddingColModalOpen, setIsAddingColModalOpen] = useState(false);

  // -------------------------------------------------------------
  // SINGLE INPUT STATE (SATUAN PER JENIS)
  // -------------------------------------------------------------
  const [kategoriUtama, setKategoriUtama] = useState<"sumatif" | "uts" | "uas">("sumatif");
  const [nomorSumatif, setNomorSumatif] = useState<string>("1");
  const [kustomSumatifMateri, setKustomSumatifMateri] = useState<string>("");
  const [isKustomSumatif, setIsKustomSumatif] = useState<boolean>(false);
  
  const getJenisPenilaianString = (): string => {
    if (kategoriUtama === "uts") return "UTS";
    if (kategoriUtama === "uas") return "UAS";
    if (isKustomSumatif && kustomSumatifMateri.trim()) {
      return `Sumatif Materi - ${kustomSumatifMateri.trim()}`;
    }
    return `Sumatif Materi ${nomorSumatif}`;
  };

  const jenisPenilaianAktif = getJenisPenilaianString();
  const [gradesMap, setGradesMap] = useState<Record<string, number | "">>({});
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const [isSinglePasteModalOpen, setIsSinglePasteModalOpen] = useState(false);
  const [singlePasteText, setSinglePasteText] = useState("");
  const [massFillValue, setMassFillValue] = useState<number | "">("");

  // -------------------------------------------------------------
  // REKAP & RIWAYAT STATES
  // -------------------------------------------------------------
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>("");
  const [rekapMapelFilter, setRekapMapelFilter] = useState<string>("");
  const [rekapSearchFilter, setRekapSearchFilter] = useState<string>("");

  const [logJenisFilter, setLogJenisFilter] = useState<string>("");
  const [editingNilaiId, setEditingNilaiId] = useState<string | null>(null);
  const [editNilaiData, setEditNilaiData] = useState<DataNilai | null>(null);

  // Sync initial selection
  useEffect(() => {
    if (!selectedKelas && kelasOptions.length > 0) {
      setSelectedKelas(kelasOptions[0]);
    }
    if (!selectedMapel && mapelList.length > 0) {
      setSelectedMapel(mapelList[0].namaMapel);
    }
    if (!rekapKelasFilter && kelasOptions.length > 0) {
      setRekapKelasFilter(kelasOptions[0]);
    }
    if (!rekapMapelFilter && mapelList.length > 0) {
      setRekapMapelFilter(mapelList[0]?.namaMapel || "");
    }
  }, [siswaList, mapelList]);

  const studentsInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  // -------------------------------------------------------------
  // SINKRONISASI DATA MASTER DARI FIREBASE KE MASTER INPUT GRID
  // -------------------------------------------------------------
  useEffect(() => {
    if (selectedKelas && selectedMapel) {
      const existingGrades = nilaiList.filter(
        (n) => n.kelas === selectedKelas && n.mapel === selectedMapel
      );

      // Cari kolom sumatif yang sudah pernah tersimpan di database
      const existingSumatifs: string[] = Array.from(
        new Set(
          existingGrades
            .filter((g) => categorizeJenisPenilaian(g.jenis) === "sumatif")
            .map((g) => g.jenis) as string[]
        )
      ).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));

      // Gabungkan dengan default columns jika belum ada
      const initialCols: string[] = existingSumatifs.length > 0 
        ? existingSumatifs 
        : ["Sumatif 1", "Sumatif 2", "Sumatif 3"];
      setMasterSumatifCols(initialCols);

      // Isi masterGradesMap dari existing data
      const newMasterMap: Record<string, Record<string, number | "">> = {};
      studentsInClass.forEach((s) => {
        newMasterMap[s.id] = {};
        const studentGrades = existingGrades.filter((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);

        // Nilai sumatif
        initialCols.forEach((col) => {
          const found = studentGrades.find((g) => g.jenis.toLowerCase() === col.toLowerCase());
          newMasterMap[s.id][col] = found && found.nilai !== "" && found.nilai !== undefined ? found.nilai : "";
        });

        // Nilai UTS
        const foundUts = studentGrades.find((g) => categorizeJenisPenilaian(g.jenis) === "uts");
        newMasterMap[s.id]["UTS"] = foundUts && foundUts.nilai !== "" && foundUts.nilai !== undefined ? foundUts.nilai : "";

        // Nilai UAS
        const foundUas = studentGrades.find((g) => categorizeJenisPenilaian(g.jenis) === "uas");
        newMasterMap[s.id]["UAS"] = foundUas && foundUas.nilai !== "" && foundUas.nilai !== undefined ? foundUas.nilai : "";
      });

      setMasterGradesMap(newMasterMap);
    }
  }, [selectedKelas, selectedMapel, nilaiList, siswaList]);

  // Sync single grade map
  useEffect(() => {
    if (selectedKelas && selectedMapel && jenisPenilaianAktif) {
      const existingGrades = nilaiList.filter(
        (n) => n.kelas === selectedKelas && n.mapel === selectedMapel && n.jenis.toLowerCase() === jenisPenilaianAktif.toLowerCase()
      );

      const map: Record<string, number | ""> = {};
      studentsInClass.forEach((s) => {
        const found = existingGrades.find((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);
        map[s.id] = found && found.nilai !== "" && found.nilai !== undefined ? found.nilai : "";
      });

      setGradesMap(map);
    }
  }, [selectedKelas, selectedMapel, jenisPenilaianAktif, nilaiList, siswaList]);

  // -------------------------------------------------------------
  // MASTER INPUT HANDLERS
  // -------------------------------------------------------------
  const handleMasterGradeChange = (studentId: string, colKey: string, value: string) => {
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setMasterGradesMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [colKey]: num
      }
    }));
  };

  // Tambah Kolom Sumatif Baru ke Master Grid
  const handleAddSumatifColumn = () => {
    const name = newSumatifColName.trim() || `Sumatif ${masterSumatifCols.length + 1}`;
    if (masterSumatifCols.includes(name)) {
      showToastError(`Kolom "${name}" sudah ada.`);
      return;
    }
    setMasterSumatifCols([...masterSumatifCols, name]);
    setNewSumatifColName("");
    setIsAddingColModalOpen(false);
    showToastSuccess(`Kolom "${name}" berhasil ditambahkan.`);
  };

  // Hapus Kolom Sumatif dari Master Grid
  const handleDeleteMasterSumatifCol = (colToDelete: string) => {
    if (masterSumatifCols.length <= 1) {
      showToastError("Minimal harus ada 1 kolom sumatif.");
      return;
    }
    setMasterSumatifCols(masterSumatifCols.filter((c) => c !== colToDelete));
    showToastSuccess(`Kolom "${colToDelete}" dihapus dari tampilan master.`);
  };

  // Unduh Template Master Excel (Semua Sumatif, UTS & UAS)
  const handleDownloadMasterTemplate = () => {
    if (studentsInClass.length === 0) {
      notifyUnduhError("Tidak ada siswa di kelas yang dipilih.");
      return;
    }

    try {
      // Header: No, NISN, Nama Lengkap Siswa, Kelas, Sumatif 1..n, UTS, UAS
      const headers = [
        "No",
        "NISN",
        "Nama Lengkap Siswa",
        "Kelas",
        ...masterSumatifCols,
        "UTS",
        "UAS"
      ];

      const rows = studentsInClass.map((s, idx) => {
        const studentMap = masterGradesMap[s.id] || {};
        const sumatifVals = masterSumatifCols.map((c) => (studentMap[c] !== undefined ? studentMap[c] : ""));
        return [
          idx + 1,
          s.nisn || "-",
          s.nama,
          s.kelas,
          ...sumatifVals,
          studentMap["UTS"] !== undefined ? studentMap["UTS"] : "",
          studentMap["UAS"] !== undefined ? studentMap["UAS"] : ""
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 32 },
        { wch: 10 },
        ...masterSumatifCols.map(() => ({ wch: 14 })),
        { wch: 12 },
        { wch: 12 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Master_Input_Nilai");

      const cleanFileName = `Format_Master_Nilai_${selectedKelas}_${selectedMapel}.xlsx`.replace(/\s+/g, "_");
      XLSX.writeFile(wb, cleanFileName);
      notifyUnduhSuccess("Format Master Excel berhasil diunduh!");
    } catch (err: any) {
      notifyUnduhError("Gagal mengunduh format Master Excel.");
    }
  };

  // Upload Master Excel Sekaligus (Membaca Semua Kolom Sumatif, UTS, UAS)
  const handleUploadMasterExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawRows || rawRows.length < 2) {
          notifySimpanError("File Master Excel kosong atau format tidak sesuai.");
          return;
        }

        // Cari header row
        let headerRowIndex = 0;
        let nisnCol = -1;
        let namaCol = -1;
        const detectedColIndices: { key: string; index: number }[] = [];

        for (let r = 0; r < Math.min(5, rawRows.length); r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          row.forEach((cellVal, cIdx) => {
            const str = String(cellVal || "").toLowerCase().trim();
            if (str.includes("nisn")) nisnCol = cIdx;
            if (str.includes("nama")) namaCol = cIdx;
          });

          if (namaCol !== -1) {
            headerRowIndex = r;
            break;
          }
        }

        // Parse semua kolom nilai dari header
        const headerRow = rawRows[headerRowIndex] || [];
        const detectedSumatifs: string[] = [];

        headerRow.forEach((cellVal, cIdx) => {
          if (cIdx === nisnCol || cIdx === namaCol) return;
          const str = String(cellVal || "").trim();
          const lower = str.toLowerCase();

          if (lower.includes("uts") || lower.includes("sts") || lower.includes("tengah semester")) {
            detectedColIndices.push({ key: "UTS", index: cIdx });
          } else if (lower.includes("uas") || lower.includes("sas") || lower.includes("akhir semester")) {
            detectedColIndices.push({ key: "UAS", index: cIdx });
          } else if (lower.includes("sumatif") || lower.includes("uh") || lower.includes("materi") || lower.includes("ph")) {
            const colName = str || `Sumatif ${detectedSumatifs.length + 1}`;
            detectedColIndices.push({ key: colName, index: cIdx });
            if (!detectedSumatifs.includes(colName)) {
              detectedSumatifs.push(colName);
            }
          }
        });

        // Update list master sumatif columns jika ada kolom baru dari file Excel
        if (detectedSumatifs.length > 0) {
          const mergedCols = Array.from(new Set([...masterSumatifCols, ...detectedSumatifs]));
          setMasterSumatifCols(mergedCols);
        }

        let totalLoaded = 0;
        const updatedMasterMap: Record<string, Record<string, number | "">> = { ...masterGradesMap };

        // Parse baris siswa
        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const rowNisn = nisnCol !== -1 ? String(row[nisnCol] || "").trim() : "";
          const rowNama = namaCol !== -1 ? String(row[namaCol] || "").trim().toLowerCase() : "";

          // Cari siswa
          let matchedStudent = studentsInClass.find((s) => {
            if (rowNisn && s.nisn && s.nisn === rowNisn) return true;
            if (rowNama && s.nama.toLowerCase().trim() === rowNama) return true;
            if (rowNama && s.nama.toLowerCase().includes(rowNama)) return true;
            return false;
          });

          // Fallback urutan baris
          if (!matchedStudent) {
            const sIdx = r - (headerRowIndex + 1);
            if (sIdx >= 0 && sIdx < studentsInClass.length) {
              matchedStudent = studentsInClass[sIdx];
            }
          }

          if (matchedStudent) {
            if (!updatedMasterMap[matchedStudent.id]) {
              updatedMasterMap[matchedStudent.id] = {};
            }

            detectedColIndices.forEach(({ key, index }) => {
              const rawVal = row[index];
              if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                const parsedNum = Number(rawVal);
                if (!isNaN(parsedNum)) {
                  updatedMasterMap[matchedStudent!.id][key] = Math.min(100, Math.max(0, parsedNum));
                  totalLoaded++;
                }
              }
            });
          }
        }

        setMasterGradesMap(updatedMasterMap);
        showToastSuccess(`Berhasil memuat file Master Excel! ${totalLoaded} data nilai terisi. Klik "Simpan Seluruh Nilai Master" untuk menyimpan ke Firebase.`);
      } catch (err: any) {
        notifySimpanError("Gagal membaca file Master Excel: " + (err.message || "Format tidak didukung"));
      } finally {
        if (masterFileInputRef.current) masterFileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  // Tempel Cepat Multi-Kolom dari Spreadsheet
  const handleApplyMasterPaste = () => {
    if (!masterPasteText.trim()) {
      showToastError("Silakan masukkan teks tabel nilai yang disalin terlebih dahulu.");
      return;
    }

    const lines = masterPasteText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const updatedMasterMap = { ...masterGradesMap };
    let filledCount = 0;

    // Kolom urutan: Sumatif 1..n, UTS, UAS
    const targetCols = [...masterSumatifCols, "UTS", "UAS"];

    lines.forEach((line, lineIdx) => {
      if (lineIdx < studentsInClass.length) {
        const s = studentsInClass[lineIdx];
        if (!updatedMasterMap[s.id]) updatedMasterMap[s.id] = {};

        const cells = line.split(/[\t,;]+/).map((c) => c.trim());
        cells.forEach((val, cIdx) => {
          if (cIdx < targetCols.length) {
            const colKey = targetCols[cIdx];
            const num = Number(val);
            if (!isNaN(num) && val !== "") {
              updatedMasterMap[s.id][colKey] = Math.min(100, Math.max(0, num));
              filledCount++;
            }
          }
        });
      }
    });

    setMasterGradesMap(updatedMasterMap);
    setIsMasterPasteModalOpen(false);
    setMasterPasteText("");
    showToastSuccess(`Berhasil menempelkan ${filledCount} nilai siswa ke tabel master!`);
  };

  // Simpan Seluruh Nilai Master (Semua Sumatif, UTS, UAS) ke Firebase Sekaligus
  const handleSaveAllMasterGrades = async () => {
    if (!selectedKelas || !selectedMapel) {
      notifySimpanError("Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.");
      return;
    }

    if (studentsInClass.length === 0) {
      notifySimpanError("Belum ada siswa di kelas ini.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const itemsToSave: DataNilai[] = [];
    const allColsToSave = [...masterSumatifCols, "UTS", "UAS"];

    studentsInClass.forEach((s) => {
      const studentMap = masterGradesMap[s.id] || {};
      allColsToSave.forEach((colKey) => {
        const val = studentMap[colKey];
        if (val !== "" && val !== undefined && !isNaN(Number(val))) {
          const safeJenis = colKey.replace(/[\s\/-]+/g, "_");
          const docId = `${selectedKelas}_${selectedMapel}_${safeJenis}_${s.id}`;
          itemsToSave.push({
            id: docId,
            waktu: todayStr,
            jenis: colKey,
            mapel: selectedMapel,
            kelas: selectedKelas,
            idSiswa: s.id,
            namaSiswa: s.nama,
            nilai: Number(val),
            namaGuru: config.Nama_Guru || "Guru"
          });
        }
      });
    });

    if (itemsToSave.length === 0) {
      notifySimpanError("Belum ada nilai yang diinputkan.");
      return;
    }

    try {
      await batchSaveDocuments(COLLECTIONS.DATA_NILAI, itemsToSave);
      notifySimpanSuccess(
        `Berhasil menyimpan ${itemsToSave.length} rekaman nilai master (Sumatif, UTS, dan UAS) untuk Kelas ${selectedKelas} ke Firebase!`
      );
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan data nilai master ke database.");
    }
  };

  // Hapus semua nilai untuk 1 siswa di master input
  const handleClearStudentMasterRow = async (student: Siswa) => {
    const isConfirmed = await confirmDeleteAlert(
      "Kosongkan Nilai Siswa?",
      `Apakah Anda yakin ingin mengosongkan seluruh nilai (Sumatif, UTS, UAS) untuk ${student.nama}?`
    );

    if (isConfirmed) {
      try {
        const studentExisting = nilaiList.filter(
          (n) => n.kelas === selectedKelas && n.mapel === selectedMapel && (n.idSiswa === student.id || n.idSiswa === student.nisn)
        );
        if (studentExisting.length > 0) {
          const idsToDelete = studentExisting.map((g) => g.id);
          await batchDeleteDocuments(COLLECTIONS.DATA_NILAI, idsToDelete);
        }

        setMasterGradesMap((prev) => ({
          ...prev,
          [student.id]: {}
        }));

        notifyHapusSuccess(`Nilai ${student.nama} berhasil dikosongkan.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal mengosongkan nilai siswa.");
      }
    }
  };

  // -------------------------------------------------------------
  // SINGLE INPUT HANDLERS
  // -------------------------------------------------------------
  const handleSingleGradeChange = (studentId: string, value: string) => {
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setGradesMap((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveSingleNilai = async () => {
    if (!selectedKelas || !selectedMapel || !jenisPenilaianAktif) {
      notifySimpanError("Silakan pilih Kelas, Mapel, dan Jenis Penilaian terlebih dahulu.");
      return;
    }

    if (studentsInClass.length === 0) {
      notifySimpanError("Belum ada siswa di kelas ini.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const itemsToSave: DataNilai[] = studentsInClass.map((s) => {
      const safeJenis = jenisPenilaianAktif.replace(/[\s\/-]+/g, "_");
      const docId = `${selectedKelas}_${selectedMapel}_${safeJenis}_${s.id}`;
      return {
        id: docId,
        waktu: todayStr,
        jenis: jenisPenilaianAktif,
        mapel: selectedMapel,
        kelas: selectedKelas,
        idSiswa: s.id,
        namaSiswa: s.nama,
        nilai: gradesMap[s.id] !== undefined ? gradesMap[s.id] : "",
        namaGuru: config.Nama_Guru || "Guru"
      };
    });

    try {
      await batchSaveDocuments(COLLECTIONS.DATA_NILAI, itemsToSave);
      notifySimpanSuccess(`Nilai ${jenisPenilaianAktif} kelas ${selectedKelas} (${itemsToSave.length} siswa) berhasil disimpan!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan nilai.");
    }
  };

  // Delete Handlers
  const handleDeleteSingleStudentGrade = async (student: Siswa) => {
    const isConfirmed = await confirmDeleteAlert(
      "Hapus Nilai Siswa?",
      `Apakah Anda yakin ingin menghapus nilai ${jenisPenilaianAktif} untuk ${student.nama}?`
    );

    if (isConfirmed) {
      try {
        const safeJenis = jenisPenilaianAktif.replace(/[\s\/-]+/g, "_");
        const docId = `${selectedKelas}_${selectedMapel}_${safeJenis}_${student.id}`;
        await deleteDocument(COLLECTIONS.DATA_NILAI, docId);
        setGradesMap((prev) => ({ ...prev, [student.id]: "" }));
        notifyHapusSuccess(`Nilai ${student.nama} berhasil dihapus.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus nilai.");
      }
    }
  };

  const handleDeleteAllForActiveType = async () => {
    const existingForType = nilaiList.filter(
      (n) => n.kelas === selectedKelas && n.mapel === selectedMapel && n.jenis.toLowerCase() === jenisPenilaianAktif.toLowerCase()
    );

    if (existingForType.length === 0) {
      const emptyMap: Record<string, number | ""> = {};
      studentsInClass.forEach((s) => { emptyMap[s.id] = ""; });
      setGradesMap(emptyMap);
      showToastSuccess("Formulir nilai berhasil dikosongkan.");
      return;
    }

    const isConfirmed = await confirmDeleteAlert(
      `Hapus Seluruh Nilai ${jenisPenilaianAktif}?`,
      `Seluruh data penilaian ${jenisPenilaianAktif} untuk Kelas ${selectedKelas} (${existingForType.length} data) akan dihapus secara permanen.`
    );

    if (isConfirmed) {
      try {
        const idsToDelete = existingForType.map((g) => g.id);
        await batchDeleteDocuments(COLLECTIONS.DATA_NILAI, idsToDelete);

        const emptyMap: Record<string, number | ""> = {};
        studentsInClass.forEach((s) => { emptyMap[s.id] = ""; });
        setGradesMap(emptyMap);

        notifyHapusSuccess(`Seluruh data nilai ${jenisPenilaianAktif} berhasil dihapus!`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus penilaian.");
      }
    }
  };

  const handleDeleteNilaiById = async (id: string, label: string = "Data nilai") => {
    const isConfirmed = await confirmDeleteAlert(
      "Hapus Data Nilai?",
      `Apakah Anda yakin ingin menghapus ${label}?`
    );
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.DATA_NILAI, id);
        notifyHapusSuccess("Data nilai berhasil dihapus.");
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus data nilai.");
      }
    }
  };

  const handleDeletePenilaianColumnFromRekap = async (jenisToDelete: string) => {
    const targetGrades = nilaiList.filter(
      (n) => (!rekapKelasFilter || n.kelas === rekapKelasFilter) && 
             (!rekapMapelFilter || n.mapel === rekapMapelFilter) && 
             n.jenis === jenisToDelete
    );

    if (targetGrades.length === 0) {
      showToastError("Tidak ada rekaman data untuk jenis penilaian ini.");
      return;
    }

    const isConfirmed = await confirmDeleteAlert(
      `Hapus Seluruh Penilaian "${jenisToDelete}"?`,
      `Tindakan ini akan menghapus ${targetGrades.length} data nilai untuk jenis "${jenisToDelete}" pada filter saat ini.`
    );

    if (isConfirmed) {
      try {
        const ids = targetGrades.map((g) => g.id);
        await batchDeleteDocuments(COLLECTIONS.DATA_NILAI, ids);
        notifyHapusSuccess(`Data penilaian "${jenisToDelete}" berhasil dihapus.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus data penilaian.");
      }
    }
  };

  // Edit in Log Table
  const handleStartEditNilai = (item: DataNilai) => {
    setEditingNilaiId(item.id);
    setEditNilaiData({ ...item });
  };

  const handleSaveEditedNilai = async (id: string) => {
    if (!editNilaiData) return;
    try {
      await saveDocument(COLLECTIONS.DATA_NILAI, id, editNilaiData);
      setEditingNilaiId(null);
      setEditNilaiData(null);
      notifyEditSuccess("Data nilai siswa berhasil diperbarui!");
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui data nilai.");
    }
  };

  // -------------------------------------------------------------
  // REKAPITULASI MATRIKS LEGER MEMANJANG KE SAMPING
  // -------------------------------------------------------------
  const rekapStudents = siswaList.filter(
    (s) => (!rekapKelasFilter || s.kelas === rekapKelasFilter) &&
           (!rekapSearchFilter || s.nama.toLowerCase().includes(rekapSearchFilter.toLowerCase()))
  );

  const relevantGradesForRekap = nilaiList.filter(
    (n) => (!rekapKelasFilter || n.kelas === rekapKelasFilter) &&
           (!rekapMapelFilter || n.mapel === rekapMapelFilter)
  );

  const allUniqueJenis: string[] = Array.from(new Set(relevantGradesForRekap.map((g) => g.jenis).filter(Boolean) as string[]));
  
  const sumatifColumns: string[] = allUniqueJenis
    .filter((j: string) => categorizeJenisPenilaian(j) === "sumatif")
    .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));

  const displaySumatifCols: string[] = sumatifColumns.length > 0 ? sumatifColumns : ["Sumatif Materi 1"];

  // Helper untuk menghasilkan Dokumen HTML Leger Nilai dengan Warna dan Model Identik Persis Website Preview
  const generateLegerDocumentHtml = (isForExcel: boolean = false): string => {
    const pemerintah = (config.Pemerintah || "PEMERINTAH KABUPATEN / KOTA").toUpperCase();
    const sekolah = (config.Nama_Sekolah || "SMP NEGERI SATU ATAP").toUpperCase();
    const alamat = config.Alamat_Sekolah || "Jalan Pendidikan No. 1";
    const kepsek = config.Nama_Kepsek || "Kepala Sekolah, M.Pd.";
    const nipKepsek = config.NIP_Kepsek || "";
    const guru = config.Nama_Guru || "Guru Mata Pelajaran";
    const nipGuru = config.NIP_Guru || "";
    const tempat = config.Tempat_Tanda_Tangan || "Kerinci";
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const kelasLabel = rekapKelasFilter ? `KELAS ${rekapKelasFilter}` : "SEMUA KELAS";
    const mapelLabel = rekapMapelFilter ? `MATA PELAJARAN: ${rekapMapelFilter.toUpperCase()}` : "SELURUH MATA PELAJARAN";

    const allNa: number[] = [];
    const allSumatifAvg: number[] = [];
    const allUts: number[] = [];
    const allUas: number[] = [];

    const studentRowsHtml = rekapStudents.map((s, idx) => {
      const studentGrades = relevantGradesForRekap.filter((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);
      const { avgSumatif, valUts, valUas, nilaiAkhir, predikat, keterangan } = hitungNilaiAkhirSiswa(studentGrades);

      if (nilaiAkhir !== null) allNa.push(nilaiAkhir);
      if (avgSumatif !== null) allSumatifAvg.push(avgSumatif);
      if (valUts !== null) allUts.push(valUts);
      if (valUas !== null) allUas.push(valUas);

      const sumatifCells = displaySumatifCols.map((colName) => {
        const found = studentGrades.find((g) => g.jenis === colName);
        const val = found && found.nilai !== "" && found.nilai !== undefined ? found.nilai : "-";
        return `<td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 600; color: #334155;">${val}</td>`;
      }).join("");

      const predikatBg = 
        predikat === "A" ? "#dcfce7" :
        predikat === "B" ? "#dbeafe" :
        predikat === "C" ? "#fef3c7" :
        predikat === "D" ? "#fee2e2" : "#f1f5f9";
      
      const predikatText = 
        predikat === "A" ? "#166534" :
        predikat === "B" ? "#1e40af" :
        predikat === "C" ? "#854d0e" :
        predikat === "D" ? "#991b1b" : "#64748b";

      return `
        <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#fcfdfe"};">
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600; color: #64748b;">${idx + 1}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-family: monospace; color: #334155;">${s.nisn || "-"}</td>
          <td style="padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${s.nama}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600; color: #475569;">${s.kelas}</td>
          ${sumatifCells}
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #eff6ff; font-weight: 800; color: #1d4ed8;">${avgSumatif !== null ? avgSumatif : "-"}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #fffbeb; font-weight: bold; color: #b45309;">${valUts !== null ? valUts : "-"}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #faf5ff; font-weight: bold; color: #7e22ce;">${valUas !== null ? valUas : "-"}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #dcfce7; font-weight: 900; color: #065f46; font-size: 10.5pt;">${nilaiAkhir !== null ? nilaiAkhir : "-"}</td>
          <td style="padding: 4px 4px; text-align: center; border: 1px solid #cbd5e1;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9pt; background-color: ${predikatBg}; color: ${predikatText};">
              ${predikat}
            </span>
          </td>
          <td style="padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; font-size: 8.5pt; color: #334155;">${keterangan}</td>
        </tr>
      `;
    }).join("");

    const avgNa = allNa.length > 0 ? (allNa.reduce((a, b) => a + b, 0) / allNa.length).toFixed(1) : "-";
    const avgSum = allSumatifAvg.length > 0 ? (allSumatifAvg.reduce((a, b) => a + b, 0) / allSumatifAvg.length).toFixed(1) : "-";
    const avgUtsVal = allUts.length > 0 ? (allUts.reduce((a, b) => a + b, 0) / allUts.length).toFixed(1) : "-";
    const avgUasVal = allUas.length > 0 ? (allUas.reduce((a, b) => a + b, 0) / allUas.length).toFixed(1) : "-";

    const colSpanBeforeSum = 4;
    const sumatifColsHeader = displaySumatifCols.map(col => `
      <th style="background-color: #eff6ff; color: #1e40af; padding: 6px 4px; border: 1px solid #bfdbfe; font-weight: bold; text-align: center; font-size: 8.5pt;">
        ${col}
      </th>
    `).join("");

    const excelWorksheetXml = isForExcel ? `
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Leger Nilai</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:Print><x:Orientation>Landscape</x:Orientation></x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    ` : "";

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Leger Nilai - ${kelasLabel}</title>
        ${excelWorksheetXml}
        <style>
          @page { size: A4 landscape; margin: 0.8cm; }
          body { font-family: 'Segoe UI', Calibri, Arial, Helvetica, sans-serif; font-size: 9pt; color: #0f172a; margin: 0; padding: 15px; background-color: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .kop-container { text-align: center; margin-bottom: 12px; }
          .kop-instansi { font-size: 11pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f172a; }
          .kop-sekolah { font-size: 14pt; font-weight: 900; margin: 2px 0; text-transform: uppercase; color: #1e3a8a; }
          .kop-alamat { font-size: 8pt; margin: 0; color: #475569; }
          .kop-divider { border-bottom: 2px solid #0f172a; border-top: 1px solid #0f172a; height: 2px; margin: 6px 0 10px 0; }
          .doc-header { text-align: center; margin-bottom: 10px; }
          .doc-title { font-size: 12pt; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.5px; }
          .doc-subtitle { font-size: 9.5pt; font-weight: bold; color: #2563eb; margin: 3px 0 0 0; }
          .formula-banner { background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 5px 10px; border-radius: 6px; font-size: 8pt; font-weight: bold; margin-bottom: 10px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 8.5pt; }
          th, td { border: 1px solid #cbd5e1; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
          }
        </style>
      </head>
      <body>
        <!-- Kop Surat Resmi -->
        <div class="kop-container">
          <p class="kop-instansi">${pemerintah}<br>DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
          <p class="kop-sekolah">${sekolah}</p>
          <p class="kop-alamat">${alamat}</p>
          <div class="kop-divider"></div>
        </div>

        <!-- Judul Dokumen -->
        <div class="doc-header">
          <h1 class="doc-title">LEGER REKAPITULASI NILAI AKADEMIK KURIKULUM MERDEKA</h1>
          <p class="doc-subtitle">${kelasLabel} &bull; ${mapelLabel}</p>
        </div>

        <div class="formula-banner">
          Formula Perhitungan Nilai Akhir (NA) = (Rata-Rata Sumatif Materi &times; 50%) + (Nilai UTS &times; 35%) + (Nilai UAS &times; 15%)
        </div>

        <!-- Tabel Leger Matriks Multi-Level Warna Penuh -->
        <table>
          <thead>
            <tr style="background-color: #1e293b; color: #ffffff; text-transform: uppercase; font-size: 8.5pt;">
              <th rowspan="2" style="background-color: #1e293b; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 4px; border: 1px solid #475569; width: 35px;">No</th>
              <th rowspan="2" style="background-color: #1e293b; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 4px; border: 1px solid #475569; width: 85px;">NISN</th>
              <th rowspan="2" style="background-color: #1e293b; color: #ffffff; text-align: left; vertical-align: middle; padding: 8px 8px; border: 1px solid #475569; min-width: 170px;">Nama Lengkap Siswa</th>
              <th rowspan="2" style="background-color: #1e293b; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 4px; border: 1px solid #475569; width: 55px;">Kelas</th>
              <th colspan="${displaySumatifCols.length + 1}" style="background-color: #1e3a8a; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 6px; border: 1px solid #1e40af; font-weight: 800;">📘 SUMATIF MATERI (BOBOT 50%)</th>
              <th colspan="1" style="background-color: #b45309; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 6px; border: 1px solid #92400e; font-weight: 800;">📝 UTS (35%)</th>
              <th colspan="1" style="background-color: #6b21a8; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 6px; border: 1px solid #581c87; font-weight: 800;">🎓 UAS (15%)</th>
              <th colspan="3" style="background-color: #065f46; color: #ffffff; text-align: center; vertical-align: middle; padding: 8px 6px; border: 1px solid #047857; font-weight: 800;">🏆 HASIL AKHIR & CAPAIAN</th>
            </tr>
            <tr style="text-align: center; font-size: 8pt; font-weight: bold;">
              ${sumatifColsHeader}
              <th style="background-color: #dbeafe; color: #172554; padding: 6px 4px; border: 1px solid #93c5fd; font-weight: 900;">Rata (50%)</th>
              <th style="background-color: #fef3c7; color: #78350f; padding: 6px 4px; border: 1px solid #fde68a; font-weight: bold;">Nilai UTS</th>
              <th style="background-color: #f3e8ff; color: #581c87; padding: 6px 4px; border: 1px solid #e9d5ff; font-weight: bold;">Nilai UAS</th>
              <th style="background-color: #d1fae5; color: #064e3b; padding: 6px 4px; border: 1px solid #a7f3d0; font-weight: 900;">Nilai Akhir</th>
              <th style="background-color: #ecfdf5; color: #065f46; padding: 6px 4px; border: 1px solid #a7f3d0; font-weight: bold; width: 60px;">Predikat</th>
              <th style="background-color: #ecfdf5; color: #065f46; padding: 6px 6px; border: 1px solid #a7f3d0; font-weight: bold; min-width: 140px;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${studentRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: 900; font-size: 8.5pt;">
              <td colspan="${colSpanBeforeSum}" style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #0f172a;">RATA-RATA KELAS:</td>
              <td colspan="${displaySumatifCols.length}" style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; color: #64748b;">-</td>
              <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #dbeafe; color: #1d4ed8;">${avgSum}</td>
              <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #fef3c7; color: #b45309;">${avgUtsVal}</td>
              <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #f3e8ff; color: #7e22ce;">${avgUasVal}</td>
              <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; background-color: #d1fae5; color: #065f46; font-size: 9.5pt;">${avgNa}</td>
              <td colspan="2" style="padding: 6px 8px; text-align: center; border: 1px solid #cbd5e1; color: #475569;">
                Tercapai: ${allNa.filter(n => n >= 70).length} / ${rekapStudents.length} Siswa
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Lembar Tanda Tangan Pengesahan -->
        <table style="width: 100%; border: none; margin-top: 25px; font-size: 9pt;">
          <tr style="border: none;">
            <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 0;">
              Mengetahui,<br>
              Kepala Sekolah<br><br><br><br><br>
              <b>${kepsek}</b><br>
              NIP. ${nipKepsek || "-"}
            </td>
            <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 0;">
              ${tempat}, ${dateStr}<br>
              Guru Mata Pelajaran<br><br><br><br><br>
              <b>${guru}</b><br>
              NIP. ${nipGuru || "-"}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  // 1. Ekspor Excel .XLS dengan Warna dan Model Identik Web
  const handleExportRekapExcelColored = () => {
    if (rekapStudents.length === 0) {
      notifyUnduhError("Tidak ada data siswa untuk diekspor.");
      return;
    }

    try {
      const fullHtml = generateLegerDocumentHtml(true);
      const blob = new Blob(["\ufeff", fullHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanKelas = (rekapKelasFilter || "SemuaKelas").replace(/\s+/g, "_");
      const cleanMapel = (rekapMapelFilter || "SemuaMapel").replace(/\s+/g, "_");
      link.href = url;
      link.download = `Leger_Nilai_Warna_${cleanKelas}_${cleanMapel}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifyUnduhSuccess("Leger Nilai (.XLS Warna Penuh) berhasil diunduh!");
    } catch (err: any) {
      notifyUnduhError("Gagal mengekspor file Excel berwarna: " + err.message);
    }
  };

  // 2. Ekspor Excel .XLSX Standar dengan Merged Cells
  const handleExportRekapExcelStandard = () => {
    if (rekapStudents.length === 0) {
      notifyUnduhError("Tidak ada data siswa untuk diekspor.");
      return;
    }

    try {
      const headerRow1 = [
        "No", 
        "NISN", 
        "Nama Siswa", 
        "Kelas",
        ...displaySumatifCols.map(() => "SUMATIF MATERI (50%)"),
        "SUMATIF MATERI (50%)", 
        "UTS (35%)", 
        "UAS (15%)", 
        "HASIL AKHIR & CAPAIAN",
        "HASIL AKHIR & CAPAIAN", 
        "HASIL AKHIR & CAPAIAN"
      ];

      const headerRow2 = [
        "", 
        "", 
        "", 
        "",
        ...displaySumatifCols, 
        "Rata-Rata (50%)", 
        "Nilai UTS", 
        "Nilai UAS", 
        "Nilai Akhir (NA)", 
        "Predikat", 
        "Keterangan Capaian"
      ];

      const dataRows = rekapStudents.map((s, idx) => {
        const studentGrades = relevantGradesForRekap.filter((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);
        const { avgSumatif, valUts, valUas, nilaiAkhir, predikat, keterangan } = hitungNilaiAkhirSiswa(studentGrades);

        const sumatifValues = displaySumatifCols.map((col) => {
          const found = studentGrades.find((g) => g.jenis === col);
          return found && found.nilai !== "" && found.nilai !== undefined ? found.nilai : "-";
        });

        return [
          idx + 1,
          s.nisn || "-",
          s.nama,
          s.kelas,
          ...sumatifValues,
          avgSumatif !== null ? avgSumatif : "-",
          valUts !== null ? valUts : "-",
          valUas !== null ? valUas : "-",
          nilaiAkhir !== null ? nilaiAkhir : "-",
          predikat,
          keterangan
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([
        [`LEGER NILAI AKADEMIK - ${rekapKelasFilter ? "KELAS " + rekapKelasFilter : "SEMUA KELAS"}`],
        [`Mata Pelajaran: ${rekapMapelFilter || "Semua Mapel"} | Tahun Ajaran: 2026/2027`],
        [],
        headerRow1,
        headerRow2,
        ...dataRows
      ]);

      const sumatifColCount = displaySumatifCols.length;
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 + sumatifColCount } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 + sumatifColCount } },
        { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
        { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
        { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
        { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
        { s: { r: 3, c: 4 }, e: { r: 3, c: 4 + sumatifColCount } },
        { s: { r: 3, c: 5 + sumatifColCount }, e: { r: 3, c: 5 + sumatifColCount } },
        { s: { r: 3, c: 6 + sumatifColCount }, e: { r: 3, c: 6 + sumatifColCount } },
        { s: { r: 3, c: 7 + sumatifColCount }, e: { r: 3, c: 9 + sumatifColCount } }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leger_Nilai");

      const fileName = `Leger_Nilai_Standar_${rekapKelasFilter || "SemuaKelas"}_${rekapMapelFilter || "SemuaMapel"}.xlsx`.replace(/\s+/g, "_");
      XLSX.writeFile(wb, fileName);
      notifyUnduhSuccess("Leger Nilai (.XLSX Standar) berhasil diunduh!");
    } catch (err: any) {
      notifyUnduhError("Gagal mengekspor file Excel: " + err.message);
    }
  };

  // 3. Cetak / Unduh PDF Lanskap Resmi dengan Warna dan Model Identik Web
  const handlePrintRekap = () => {
    if (rekapStudents.length === 0) {
      showToastError("Tidak ada data siswa untuk dicetak.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToastError("Gagal membuka jendela cetak. Pastikan izin pop-up browser aktif.");
      return;
    }

    const fullHtml = generateLegerDocumentHtml(false);
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      notifyCetakSuccess("Dokumen Leger Nilai resmi siap dicetak atau disimpan ke PDF!");
    }, 500);
  };

  const filteredLogNilaiList = nilaiList.filter((item) => {
    const matchKelas = !rekapKelasFilter || item.kelas === rekapKelasFilter;
    const matchMapel = !rekapMapelFilter || item.mapel === rekapMapelFilter;
    const matchJenis = !logJenisFilter || item.jenis.toLowerCase().includes(logJenisFilter.toLowerCase());
    const matchSearch = !rekapSearchFilter || item.namaSiswa.toLowerCase().includes(rekapSearchFilter.toLowerCase());
    return matchKelas && matchMapel && matchJenis && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={masterFileInputRef}
        onChange={handleUploadMasterExcel}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={singleFileInputRef}
        onChange={(e) => {
          // Fallback single upload
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const wb = XLSX.read(evt.target?.result, { type: "binary" });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
              let count = 0;
              const newMap = { ...gradesMap };
              for (let r = 1; r < data.length; r++) {
                const row = data[r];
                const rawVal = row[row.length - 1];
                const num = Number(rawVal);
                if (!isNaN(num) && r - 1 < studentsInClass.length) {
                  newMap[studentsInClass[r - 1].id] = Math.min(100, Math.max(0, num));
                  count++;
                }
              }
              setGradesMap(newMap);
              showToastSuccess(`Berhasil memuat ${count} nilai siswa!`);
            } catch (err: any) {
              notifySimpanError("Gagal membaca Excel: " + err.message);
            }
          };
          reader.readAsBinaryString(f);
        }}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Main Sub-Navigation Bar */}
      <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveSubTab("master")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "master"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
              : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Format Master Input (Semua Ujian Sekaligus)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("input")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "input"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>Input Satuan (Per Jenis)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("rekap")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "rekap"
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Table className="w-4 h-4 text-emerald-500" />
          <span>Rekap Matriks (Leger Nilai)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("riwayat")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "riwayat"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History className="w-4 h-4 text-indigo-500" />
          <span>Log Riwayat</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB MASTER: FORMAT MASTER INPUT NILAI LENGKAP (SUMATIF, UTS, UAS)   */}
      {/* ========================================================================= */}
      {activeSubTab === "master" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Header Panel */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                  MASTER FORMAT
                </span>
                <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  Input & Unggah Master Nilai Sekaligus
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola dan unggah semua nilai <b>Sumatif Materi (50%)</b>, <b>UTS (35%)</b>, dan <b>UAS (15%)</b> dalam satu format tabel sekaligus.
              </p>
            </div>

            {/* Action Buttons for Master Upload */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMasterTemplate}
                className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Unduh format master Excel lengkap dengan semua kolom Sumatif, UTS, dan UAS"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Unduh Format Master Excel</span>
              </button>

              <button
                type="button"
                onClick={() => masterFileInputRef.current?.click()}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-101"
                title="Unggah file Master Excel untuk mengisi nilai Sumatif, UTS, dan UAS sekaligus"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File Master Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMasterPasteModalOpen(true)}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Tempel tabel nilai dari spreadsheet"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Tempel Tabel (Paste Bulk)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Cadangkan seluruh data nilai ke file .JSON atau simpan ke Google Drive pribadi"
              >
                <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Backup Data (.JSON / Drive)</span>
              </button>
            </div>
          </div>

          {/* Selection Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Pilih Kelas *</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k} ({siswaList.filter((s) => s.kelas === k).length} Siswa)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Pilih Mata Pelajaran *</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Kolom Sumatif Materi</label>
              <button
                type="button"
                onClick={() => setIsAddingColModalOpen(true)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-dashed border-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Tambah Kolom Sumatif</span>
              </button>
            </div>

            <div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                <span className="font-extrabold text-blue-600 block">Bobot Penilaian Otomatis:</span>
                Sumatif <b>50%</b> + UTS <b>35%</b> + UAS <b>15%</b>
              </div>
            </div>
          </div>

          {/* MASTER GRID TABLE (MULTI-KOLOM INPUT LEBAR) */}
          <div 
            tabIndex={0}
            role="region"
            aria-labelledby="master-table-caption"
            className="table-wrapper custom-scrollbar overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <span id="master-table-caption" className="sr-only">Tabel Input Master Nilai Sumatif, UTS, dan UAS</span>
            <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-10 backdrop-blur-md">
                <tr className="bg-slate-900/95 text-white uppercase text-[11px] tracking-wider border-b border-slate-700">
                  <th rowSpan={2} className="p-3 text-center w-12 border-r border-slate-700 font-mono">No</th>
                  <th rowSpan={2} className="p-3 text-center w-28 border-r border-slate-700 font-mono">NISN</th>
                  <th rowSpan={2} className="p-3 min-w-[200px] border-r border-slate-700 font-sans font-bold">Nama Lengkap Siswa</th>

                  {/* Header Group Sumatif Materi */}
                  <th 
                    colSpan={masterSumatifCols.length + 1} 
                    className="p-2.5 text-center bg-blue-900 border-r border-blue-800 text-white font-black"
                  >
                    📘 SUMATIF MATERI (BOBOT 50%)
                  </th>

                  {/* Header Group UTS */}
                  <th 
                    colSpan={1} 
                    className="p-2.5 text-center bg-amber-700 border-r border-amber-600 text-white font-black"
                  >
                    📝 UTS (35%)
                  </th>

                  {/* Header Group UAS */}
                  <th 
                    colSpan={1} 
                    className="p-2.5 text-center bg-purple-800 border-r border-purple-700 text-white font-black"
                  >
                    🎓 UAS (15%)
                  </th>

                  {/* Header Group Hasil Akhir */}
                  <th 
                    colSpan={3} 
                    className="p-2.5 text-center bg-emerald-800 text-white font-black"
                  >
                    🏆 HASIL AKHIR (LIVE)
                  </th>

                  <th rowSpan={2} className="p-3 text-center w-20">Aksi</th>
                </tr>

                {/* Sub-Header: Input Fields Columns */}
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b-2 border-slate-300 dark:border-slate-700">
                  {masterSumatifCols.map((colName) => (
                    <th key={colName} className="p-2 text-center min-w-[95px] border-r border-slate-200 dark:border-slate-700 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200">
                      <div className="flex items-center justify-center gap-1">
                        <span>{colName}</span>
                        {masterSumatifCols.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterSumatifCol(colName)}
                            className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                            title={`Hapus kolom ${colName}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Rata-Rata Sumatif */}
                  <th className="p-2 text-center min-w-[95px] border-r border-slate-300 dark:border-slate-700 bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 font-black">
                    Rata (50%)
                  </th>

                  {/* UTS */}
                  <th className="p-2 text-center min-w-[95px] border-r border-slate-300 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200">
                    Nilai UTS
                  </th>

                  {/* UAS */}
                  <th className="p-2 text-center min-w-[95px] border-r border-slate-300 dark:border-slate-700 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200">
                    Nilai UAS
                  </th>

                  {/* Nilai Akhir */}
                  <th className="p-2 text-center min-w-[95px] border-r border-slate-200 dark:border-slate-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 font-black">
                    Nilai Akhir
                  </th>

                  {/* Predikat */}
                  <th className="p-2 text-center w-16 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">
                    Predikat
                  </th>

                  {/* Keterangan */}
                  <th className="p-2 text-center min-w-[130px] border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {!selectedKelas || !selectedMapel ? (
                  <tr>
                    <td colSpan={masterSumatifCols.length + 9} className="p-12 text-center text-slate-400">
                      Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.
                    </td>
                  </tr>
                ) : studentsInClass.length === 0 ? (
                  <tr>
                    <td colSpan={masterSumatifCols.length + 9} className="p-12 text-center text-slate-400">
                      Tidak ada siswa di Kelas {selectedKelas}.
                    </td>
                  </tr>
                ) : (
                  studentsInClass.map((s, idx) => {
                    const studentMap = masterGradesMap[s.id] || {};

                    // Hitung nilai sumatif siswa
                    const sumatifNums = masterSumatifCols
                      .map((c) => studentMap[c])
                      .filter((v) => v !== "" && v !== undefined && !isNaN(Number(v)))
                      .map(Number);
                    
                    const avgSumatif = sumatifNums.length > 0
                      ? Number((sumatifNums.reduce((a, b) => a + b, 0) / sumatifNums.length).toFixed(1))
                      : null;

                    const valUts = studentMap["UTS"] !== "" && studentMap["UTS"] !== undefined && !isNaN(Number(studentMap["UTS"]))
                      ? Number(studentMap["UTS"])
                      : null;

                    const valUas = studentMap["UAS"] !== "" && studentMap["UAS"] !== undefined && !isNaN(Number(studentMap["UAS"]))
                      ? Number(studentMap["UAS"])
                      : null;

                    // Perhitungan Nilai Akhir (50% Sumatif, 35% UTS, 15% UAS)
                    let na: number | null = null;
                    if (avgSumatif !== null || valUts !== null || valUas !== null) {
                      const sPart = (avgSumatif !== null ? avgSumatif : 0) * 0.50;
                      const uPart = (valUts !== null ? valUts : 0) * 0.35;
                      const asPart = (valUas !== null ? valUas : 0) * 0.15;
                      na = Number((sPart + uPart + asPart).toFixed(1));
                    }

                    const predikat = na === null ? "-" : na >= 88 ? "A" : na >= 78 ? "B" : na >= 70 ? "C" : "D";
                    const isTuntas = na !== null && na >= 70;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-2 text-center font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                        <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{s.nisn || "-"}</td>
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{s.nama}</td>

                        {/* Editable Inputs untuk Sumatif Kolom */}
                        {masterSumatifCols.map((colKey) => (
                          <td key={colKey} className="p-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={studentMap[colKey] !== undefined ? studentMap[colKey] : ""}
                              onChange={(e) => handleMasterGradeChange(s.id, colKey, e.target.value)}
                              className="w-16 text-center px-1.5 py-1 text-xs font-bold border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
                            />
                          </td>
                        ))}

                        {/* Rata-Rata Sumatif */}
                        <td className="p-2 text-center font-black text-blue-700 dark:text-blue-300 border-r border-slate-300 dark:border-slate-700 bg-blue-100/50 dark:bg-blue-950/40">
                          {avgSumatif !== null ? avgSumatif : "-"}
                        </td>

                        {/* Editable Input UTS */}
                        <td className="p-1.5 text-center border-r border-slate-300 dark:border-slate-700 bg-amber-50/30">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={studentMap["UTS"] !== undefined ? studentMap["UTS"] : ""}
                            onChange={(e) => handleMasterGradeChange(s.id, "UTS", e.target.value)}
                            className="w-16 text-center px-1.5 py-1 text-xs font-bold border rounded-lg bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* Editable Input UAS */}
                        <td className="p-1.5 text-center border-r border-slate-300 dark:border-slate-700 bg-purple-50/30">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={studentMap["UAS"] !== undefined ? studentMap["UAS"] : ""}
                            onChange={(e) => handleMasterGradeChange(s.id, "UAS", e.target.value)}
                            className="w-16 text-center px-1.5 py-1 text-xs font-bold border rounded-lg bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 outline-none focus:border-purple-500"
                          />
                        </td>

                        {/* Live Nilai Akhir (50% Sumatif, 35% UTS, 15% UAS) */}
                        <td className="p-2 text-center font-black text-xs border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          {na !== null ? (
                            na >= 90 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-black font-mono text-xs shadow-xs">
                                <span>💎</span>
                                <span>{na}</span>
                              </span>
                            ) : na >= 75 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black font-mono text-xs">
                                <span>✓</span>
                                <span>{na}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black font-mono text-xs">
                                <span>⚠</span>
                                <span>{na}</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Predikat */}
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {predikat !== "-" ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black font-mono ${
                              predikat === "A" ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30" :
                              predikat === "B" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" :
                              predikat === "C" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30" :
                              "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            }`}>
                              {predikat}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Status Tuntas */}
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {na !== null ? (
                            na >= 90 ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                                💎 ISTIMEWA
                              </span>
                            ) : isTuntas ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                ✓ TUNTAS
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                ⚠ REMEDIAL
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Action Hapus Baris */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleClearStudentMasterRow(s)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                            title="Kosongkan nilai seluruh ujian untuk siswa ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Master Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">
              Total Siswa: <b>{studentsInClass.length}</b> orang | Kolom Aktif:{" "}
              <b>{masterSumatifCols.length} Sumatif</b> + <b>UTS</b> + <b>UAS</b>
            </div>

            <button
              onClick={handleSaveAllMasterGrades}
              disabled={studentsInClass.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-xl cursor-pointer transition-all hover:scale-101"
            >
              <Save className="w-4 h-4" />
              <span>SIMPAN SELURUH NILAI MASTER (SUMATIF, UTS & UAS) KE FIREBASE</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: INPUT SATUAN PER JENIS PENILAIAN                              */}
      {/* ========================================================================= */}
      {activeSubTab === "input" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Input Satuan Nilai (Per Jenis Penilaian)
              </h2>
              <p className="text-xs text-slate-500">
                Gunakan tab ini jika hanya ingin memasukkan satu jenis ulangan harian, UTS, atau UAS secara bertahap.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => singleFileInputRef.current?.click()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Excel Jenis Ini</span>
              </button>
            </div>
          </div>

          {/* Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Pilih Kelas *</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Pilih Mata Pelajaran *</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Pilih Kategori Ujian *</label>
              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setKategoriUtama("sumatif")}
                  className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    kategoriUtama === "sumatif" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Sumatif (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setKategoriUtama("uts")}
                  className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    kategoriUtama === "uts" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  UTS (35%)
                </button>
                <button
                  type="button"
                  onClick={() => setKategoriUtama("uas")}
                  className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    kategoriUtama === "uas" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  UAS (15%)
                </button>
              </div>
            </div>
          </div>

          {/* Sub selection for sumatif */}
          {kategoriUtama === "sumatif" && (
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200">Nomor Sumatif:</span>
              {["1", "2", "3", "4", "5"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setIsKustomSumatif(false);
                    setNomorSumatif(num);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                    !isKustomSumatif && nomorSumatif === num ? "bg-blue-600 text-white" : "bg-white border text-slate-700"
                  }`}
                >
                  Sumatif {num}
                </button>
              ))}
              <div className="ml-auto font-extrabold text-blue-700">
                Aktif: <span className="underline">{jenisPenilaianAktif}</span>
              </div>
            </div>
          )}

          {/* Table Single Input */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3 w-28 text-center">NISN</th>
                  <th className="p-3">Nama Lengkap Siswa</th>
                  <th className="p-3 text-center w-36">Nilai {jenisPenilaianAktif}</th>
                  <th className="p-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {studentsInClass.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 text-center font-mono">{s.nisn || "-"}</td>
                    <td className="p-3 font-bold">{s.nama}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={gradesMap[s.id] !== undefined ? gradesMap[s.id] : ""}
                        onChange={(e) => handleSingleGradeChange(s.id, e.target.value)}
                        className="w-24 text-center px-3 py-1.5 font-black text-sm border-2 rounded-xl bg-slate-50 border-slate-300 text-blue-600 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteSingleStudentGrade(s)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                        title="Hapus nilai siswa ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSingleNilai}
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Nilai {jenisPenilaianAktif} ke Firebase</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REKAPITULASI MATRIKS LEGER (MEMANJANG KE SAMPING)             */}
      {/* ========================================================================= */}
      {activeSubTab === "rekap" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-500" />
                Rekapitulasi Leger Nilai Matriks (Tampilan Lebar)
              </h2>
              <p className="text-xs text-slate-500">
                Tampilan memanjang ke samping dengan perhitungan otomatis: <b>Sumatif Materi (50%)</b> + <b>UTS (35%)</b> + <b>UAS (15%)</b> = <b>Nilai Akhir (100%)</b>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintRekap}
                className="px-3.5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Cetak atau simpan ke PDF resmi dengan warna, kop, dan model persis seperti tampilan website"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Unduh PDF (Warna Asli)</span>
              </button>

              <button
                type="button"
                onClick={handleExportRekapExcelColored}
                className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Unduh file Excel yang memiliki warna, font, dan model berjenjang sama persis dengan preview web"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel (.XLS Warna Penuh)</span>
              </button>

              <button
                type="button"
                onClick={handleExportRekapExcelStandard}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Unduh format spreadsheet standar .xlsx dengan multi-level merged cells"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excel (.XLSX Standar)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Cadangkan data penilaian leger ke file .JSON atau Google Drive"
              >
                <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Backup (.JSON / Drive)</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Kelas</label>
              <select
                value={rekapKelasFilter}
                onChange={(e) => setRekapKelasFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">-- Semua Kelas --</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Mata Pelajaran</label>
              <select
                value={rekapMapelFilter}
                onChange={(e) => setRekapMapelFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">-- Semua Mapel --</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Nama Siswa</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama siswa..."
                  value={rekapSearchFilter}
                  onChange={(e) => setRekapSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* TABLE MEMANJANG KE SAMPING (LEGER MATRIKS HORIZONTAL) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900 custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
              <thead>
                <tr className="bg-slate-800 text-white uppercase text-[11px] tracking-wider">
                  <th rowSpan={2} className="p-3 text-center w-12 border-r border-slate-700">No</th>
                  <th rowSpan={2} className="p-3 text-center w-28 border-r border-slate-700">NISN</th>
                  <th rowSpan={2} className="p-3 min-w-[200px] border-r border-slate-700">Nama Lengkap Siswa</th>
                  <th rowSpan={2} className="p-3 text-center w-20 border-r border-slate-700">Kelas</th>

                  <th 
                    colSpan={displaySumatifCols.length + 1} 
                    className="p-2.5 text-center bg-blue-900 border-r border-blue-800 text-white font-black"
                  >
                    📘 SUMATIF MATERI (BOBOT 50%)
                  </th>

                  <th 
                    colSpan={1} 
                    className="p-2.5 text-center bg-amber-700 border-r border-amber-600 text-white font-black"
                  >
                    📝 UTS (35%)
                  </th>

                  <th 
                    colSpan={1} 
                    className="p-2.5 text-center bg-purple-800 border-r border-purple-700 text-white font-black"
                  >
                    🎓 UAS (15%)
                  </th>

                  <th 
                    colSpan={3} 
                    className="p-2.5 text-center bg-emerald-800 text-white font-black"
                  >
                    🏆 NILAI AKHIR & CAPAIAN
                  </th>
                </tr>

                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b-2 border-slate-300 dark:border-slate-700">
                  {displaySumatifCols.map((colName) => (
                    <th key={colName} className="p-2.5 text-center min-w-[90px] border-r border-slate-200 dark:border-slate-700 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>{colName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeletePenilaianColumnFromRekap(colName)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                          title={`Hapus seluruh penilaian "${colName}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}

                  <th className="p-2.5 text-center min-w-[110px] border-r border-slate-300 dark:border-slate-700 bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-200 font-black">
                    Rata-Rata (50%)
                  </th>

                  <th className="p-2.5 text-center min-w-[100px] border-r border-slate-300 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center justify-center gap-1">
                      <span>Nilai UTS</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePenilaianColumnFromRekap("UTS")}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                        title='Hapus seluruh penilaian "UTS"'
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>

                  <th className="p-2.5 text-center min-w-[100px] border-r border-slate-300 dark:border-slate-700 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200">
                    <div className="flex items-center justify-center gap-1">
                      <span>Nilai UAS</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePenilaianColumnFromRekap("UAS")}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                        title='Hapus seluruh penilaian "UAS"'
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>

                  <th className="p-2.5 text-center min-w-[110px] border-r border-slate-200 dark:border-slate-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-black">
                    Nilai Akhir (NA)
                  </th>

                  <th className="p-2.5 text-center w-20 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">
                    Predikat
                  </th>

                  <th className="p-2.5 text-center min-w-[150px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">
                    Keterangan
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rekapStudents.length === 0 ? (
                  <tr>
                    <td colSpan={displaySumatifCols.length + 8} className="p-12 text-center text-slate-400">
                      Tidak ada data siswa ditemukan untuk kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  rekapStudents.map((s, idx) => {
                    const studentGrades = relevantGradesForRekap.filter((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);
                    const { avgSumatif, valUts, valUas, nilaiAkhir, predikat, keterangan } = hitungNilaiAkhirSiswa(studentGrades);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-2.5 text-center font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{s.nisn || "-"}</td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{s.nama}</td>
                        <td className="p-2.5 text-center font-semibold border-r border-slate-200 dark:border-slate-800">{s.kelas}</td>

                        {displaySumatifCols.map((colName) => {
                          const found = studentGrades.find((g) => g.jenis === colName);
                          const val = found && found.nilai !== "" && found.nilai !== undefined ? found.nilai : "-";
                          return (
                            <td key={colName} className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-50/20">
                              {val}
                            </td>
                          );
                        })}

                        <td className="p-2.5 text-center font-black text-blue-700 dark:text-blue-300 border-r border-slate-300 dark:border-slate-700 bg-blue-100/50 dark:bg-blue-950/40">
                          {avgSumatif !== null ? avgSumatif : "-"}
                        </td>

                        <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 border-r border-slate-300 dark:border-slate-700 bg-amber-50/30">
                          {valUts !== null ? valUts : "-"}
                        </td>

                        <td className="p-2.5 text-center font-bold text-purple-700 dark:text-purple-300 border-r border-slate-300 dark:border-slate-700 bg-purple-50/30">
                          {valUas !== null ? valUas : "-"}
                        </td>

                        <td className="p-2.5 text-center font-black text-sm text-emerald-700 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 bg-emerald-100/60 dark:bg-emerald-950/50">
                          {nilaiAkhir !== null ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-200 dark:bg-emerald-900 font-extrabold text-emerald-900 dark:text-emerald-200">
                              {nilaiAkhir}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800">
                          {predikat !== "-" ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-md font-black text-xs ${
                              predikat === "A" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                              predikat === "B" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                              predikat === "C" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                              "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            }`}>
                              {predikat}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="p-2.5 text-xs text-slate-600 dark:text-slate-300">
                          {keterangan}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: LOG RIWAYAT ENTRI NILAI                                      */}
      {/* ========================================================================= */}
      {activeSubTab === "riwayat" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Daftar Riwayat Entri Log Nilai
              </h2>
              <p className="text-xs text-slate-500">
                Pemeriksaan detail rekaman nilai dan opsi hapus penilaian satu per satu per siswa.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Total Entri: <span className="text-blue-600">{filteredLogNilaiList.length}</span> data
            </div>
          </div>

          {/* Table Log Entries */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Jenis Penilaian</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center w-24">Nilai</th>
                  <th className="p-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogNilaiList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada riwayat entri nilai ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredLogNilaiList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold whitespace-nowrap">{item.waktu || "-"}</td>
                      <td className="p-3 text-center font-bold">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{item.kelas}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{item.mapel}</td>
                      <td className="p-3 font-bold text-indigo-700 dark:text-indigo-400">{item.jenis}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.namaSiswa}</td>
                      <td className="p-3 text-center font-black text-sm text-blue-600 dark:text-blue-400">
                        {item.nilai !== "" && item.nilai !== undefined ? item.nilai : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteNilaiById(item.id, `nilai ${item.jenis} ${item.namaSiswa}`)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Hapus Nilai Satu per Satu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TEMPEL TABEL DARI EXCEL (MASTER PASTE)                             */}
      {/* ========================================================================= */}
      {isMasterPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                Tempel Tabel Nilai dari Excel (Semua Sumatif, UTS & UAS)
              </h3>
              <button
                onClick={() => setIsMasterPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Blok dan salin (Copy / Ctrl+C) tabel kolom nilai di Excel Anda dengan urutan kolom:
              <br />
              <b className="text-blue-600">
                {masterSumatifCols.join(" | ")} | UTS | UAS
              </b>
              <br />
              Lalu tempelkan (Ctrl+V) ke dalam kotak teks di bawah ini:
            </p>

            <div>
              <textarea
                rows={8}
                value={masterPasteText}
                onChange={(e) => setMasterPasteText(e.target.value)}
                placeholder={`Contoh baris per siswa (dipisahkan spasi/tab):\n85\t90\t80\t78\t88\n90\t85\t88\t82\t92\n75\t80\t70\t65\t78`}
                className="w-full px-3 py-2 text-xs font-mono font-bold border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMasterPasteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyMasterPaste}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan ke Grid Master</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TAMBAH KOLOM SUMATIF BARU                                          */}
      {/* ========================================================================= */}
      {isAddingColModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Tambah Kolom Sumatif Baru
              </h3>
              <button
                onClick={() => setIsAddingColModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Nama Kolom Sumatif (Contoh: Sumatif 4 / Sumatif Bab 1)
              </label>
              <input
                type="text"
                value={newSumatifColName}
                onChange={(e) => setNewSumatifColName(e.target.value)}
                placeholder={`Sumatif ${masterSumatifCols.length + 1}`}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingColModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 font-bold rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddSumatifColumn}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
              >
                Tambah Kolom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backup Penilaian (.JSON & Google Drive) */}
      <BackupPenilaianModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        nilaiList={nilaiList}
        siswaList={siswaList}
        mapelList={mapelList}
        config={config}
        activeKelas={selectedKelas || rekapKelasFilter || "ALL"}
        activeMapel={selectedMapel || rekapMapelFilter || "ALL"}
      />
    </div>
  );
};
