'use client';
import { useState, ChangeEvent, DragEvent, useRef } from 'react';
import { toPng } from 'html-to-image';

interface JadwalDetail {
  matkul: string;
  kelas: string;
  ruang: string;
  jadwal: {
    hari: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
  };
}

interface ScanResult {
  input: {
    matkul: string;
    kelas: string;
  };
  status: 'FOUND' | 'NOT_FOUND';
  ocr_name: string;
  ocr_class: string;
  data: JadwalDetail | null;
}

const UploadIcon = () => (
  // Ganti text-blue-500 jadi text-gray-600
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileIcon = () => (
  // Biarkan hijau agar file terlihat jelas (status sukses)
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jadwal, setJadwal] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!resultRef.current) return;
    setDownloading(true);

    try {
      const element = resultRef.current;
      
      const scrollWidth = element.scrollWidth;
      const scrollHeight = element.scrollHeight;

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(element, { 
        cacheBust: true,
        backgroundColor: '#ffffff', // Background putih saat didownload
        width: scrollWidth, 
        height: scrollHeight,
        style: {
           overflow: 'visible', 
           maxWidth: 'none',
           width: `${scrollWidth}px`,
           height: 'auto'
        },
        filter: (node) => {
          // @ts-ignore
          return !node.className || !node.className.includes || !node.className.includes('ignore-scan');
        }
      });
      
      const link = document.createElement('a');
      link.download = `Jadwal-UAS-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan gambar. Browser mungkin memblokir script.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(''); setJadwal([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Gagal memproses gambar");
      
      if (data.result && data.result.length > 0) {
        setJadwal(data.result);
      } else {
        throw new Error("Tidak ditemukan jadwal kuliah pada gambar tersebut. Pastikan gambar jelas dan berisi tabel mata kuliah.");
      }

    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan: " + (err.message || "Gagal memproses permintaan"));
    } finally {
      setLoading(false);
    }
  };

  return (
    // BACKGROUND: Tetap Slate-50 (Putih agak abu) seperti permintaan
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-8">
          {/* JUDUL: Menggunakan warna Gray-900 (Hitam pekat) */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            Cek Jadwal Ujian Otomatis
          </h1>
          <p className="text-sm md:text-lg text-gray-500">
            Upload screenshot jadwal kuliah, biarkan AI menyusun jadwalmu.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg mb-8 border border-gray-200">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              // DRAG STATE: Ganti biru jadi abu-abu gelap
              isDragging 
                ? 'border-gray-600 bg-gray-100 scale-[1.02]' 
                : file 
                  ? 'border-emerald-400 bg-emerald-50' // Sukses tetap hijau biar jelas
                  : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          >
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              {file ? (
                <>
                  <FileIcon />
                  <p className="font-semibold text-emerald-700 text-center break-all text-sm">{file.name}</p>
                  <p className="text-xs text-emerald-600 mt-1">Tap untuk ganti file</p>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <div className="text-center">
                    <p className="font-medium text-gray-700 text-sm hidden sm:block">Drag & Drop gambar jadwal di sini</p>
                    <p className="font-medium text-gray-700 text-sm sm:hidden">Tap di sini untuk upload gambar</p>
                    <p className="text-xs text-gray-400 mt-1">atau klik untuk jelajah file</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* TOMBOL UTAMA: Ganti Gradient Biru jadi Hitam Solid (Gray-900) */}
          <button 
            onClick={handleUpload} disabled={loading || !file}
            className={`mt-4 w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-sm md:text-base cursor-pointer ${
              loading || !file 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {loading ? <><LoadingSpinner /> Proses AI...</> : <><SearchIcon /> Cari Jadwal</>}
          </button>
          
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs text-center animate-pulse font-medium">{error}</div>}
        </div>

        {jadwal.length > 0 && (
          <div className="w-full animate-fade-in-up">
            
            <div ref={resultRef} className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-6 overflow-hidden">
              
              {/* HEADER HASIL: Ganti Gradient Biru jadi Hitam Solid */}
              <div className="bg-gray-900 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-base">Hasil Pencarian</h2>
                  <span className="text-gray-300 text-[10px] bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                    {jadwal.filter(j => j.status === 'FOUND').length} Ketemu
                  </span>
                </div>

                <div className="flex gap-2 ignore-scan">
                  <button 
                    onClick={handleDownloadImage} disabled={downloading}
                    className={`flex items-center text-[10px] md:text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors cursor-pointer ${
                       downloading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {downloading ? "Menyimpan..." : <><DownloadIcon /> Simpan (PNG)</>}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs md:text-sm text-left min-w-[600px]">
                  <thead className="text-[10px] md:text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Mata Kuliah</th>
                      <th className="px-2 py-3 text-center font-semibold">Kls</th>
                      <th className="px-4 py-3 font-semibold">Waktu</th>
                      <th className="px-4 py-3 text-center font-semibold">Ruang</th>
                      <th className="px-2 py-3 text-center font-semibold">Stat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jadwal.map((item, index) => {
                      const isFound = item.status === 'FOUND';
                      return (
                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${!isFound ? 'bg-red-50/50' : ''}`}>
                          <td className="px-4 py-3 max-w-[150px] md:max-w-none">
                            <div className="font-bold text-gray-900">
                              {isFound && item.data ? item.data.matkul : item.ocr_name}
                            </div>
                            {!isFound && <div className="text-[10px] text-red-500 mt-0.5">Tidak ditemukan</div>}
                          </td>
                          <td className="px-2 py-3 text-center">
                            {/* BADGE KELAS: Ganti Biru jadi Abu-abu Gelap */}
                            <span className={`inline-block w-6 h-6 leading-6 rounded-full font-bold text-[10px] ${
                              isFound ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {isFound && item.data ? item.data.kelas : item.ocr_class || '?'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isFound && item.data ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800 whitespace-nowrap">{item.data.jadwal.hari}, {item.data.jadwal.tanggal}</span>
                                <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">
                                  {item.data.jadwal.jam_mulai} - {item.data.jadwal.jam_selesai}
                                </span>
                              </div>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isFound && item.data ? (
                              // BADGE RUANG: Biarkan hijau untuk status positif/lokasi, atau ganti abu
                              // Saya ganti jadi Hitam Outline agar konsisten monokrom
                              <span className="bg-white text-gray-800 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full border border-gray-300 shadow-sm whitespace-nowrap">
                                {item.data.ruang}
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-2 py-3 text-center">
                            {isFound ? (
                              <span className="text-emerald-600 text-base font-bold">✓</span>
                            ) : (
                              <span className="text-red-500 text-base font-bold">✕</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-2 text-[10px] text-gray-400 text-center border-t border-gray-200">
                AI bisa saja mengalami kesalahan, cek jadwal resmi untuk memvalidasi.
              </div>
            </div>
            
             <p className="text-center text-gray-400 text-xs mb-12">
               * Geser tabel untuk melihat detail. Tekan "Simpan" untuk download full.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}