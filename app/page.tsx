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
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      const dataUrl = await toPng(resultRef.current, { 
        cacheBust: true, 
        backgroundColor: '#ffffff', 
        filter: (node) => {
          return !node.className || !node.className.includes || !node.className.includes('ignore-scan');
        }
      });
      
      const link = document.createElement('a');
      link.download = `Jadwal-UAS-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

    } catch (err: any) {
      console.error("Gagal download:", err);
      alert("Gagal menyimpan gambar. Browser mungkin memblokir script.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    setJadwal([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses");
      }

      if (data.result) {
        setJadwal(data.result);
      }
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            Cek Jadwal Ujian Otomatis
          </h1>
          <p className="text-lg text-gray-500">
            Upload screenshot jadwal kuliahmu, biarkan AI yang mencarikan ruangannya.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg mb-10 border border-white/50 backdrop-blur-sm">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : file 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden" 
              id="fileInput"
            />
            <label htmlFor="fileInput" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              {file ? (
                <>
                  <FileIcon />
                  <p className="font-semibold text-green-700 text-center break-all">{file.name}</p>
                  <p className="text-xs text-green-600 mt-1">Klik untuk ganti file</p>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <p className="font-medium text-gray-600">Drag & Drop gambar di sini</p>
                  <p className="text-sm text-gray-400 mt-1">atau klik untuk jelajah file</p>
                </>
              )}
            </label>
          </div>

          <button 
            onClick={handleUpload}
            disabled={loading || !file}
            className={`mt-6 w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              loading || !file 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30'
            }`}
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Sedang Menganalisis...
              </>
            ) : (
              <>
                <SearchIcon />
                Cari Jadwal Saya
              </>
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center animate-pulse">
              {error}
            </div>
          )}
        </div>

        {jadwal.length > 0 && (
          <div className="w-full animate-fade-in-up">
            
            <div ref={resultRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-6">
              
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-white font-bold text-lg">
                    Hasil Pencarian Jadwal
                  </h2>
                  <span className="text-blue-100 text-xs bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                    {jadwal.filter(j => j.status === 'FOUND').length} Ditemukan
                  </span>
                </div>

                <div className="flex gap-2 ignore-scan">
                  <button 
                    onClick={handleDownloadImage}
                    disabled={downloading}
                    className={`flex items-center text-xs px-4 py-2 rounded-lg font-bold shadow-sm transition-colors cursor-pointer ${
                       downloading 
                       ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                       : 'bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {downloading ? (
                      <span className="animate-pulse">Menyimpan...</span>
                    ) : (
                      <>
                        <DownloadIcon /> Simpan Gambar (PNG)
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Mata Kuliah</th>
                      <th className="px-6 py-4 text-center font-semibold">Kelas</th>
                      <th className="px-6 py-4 font-semibold">Waktu Ujian</th>
                      <th className="px-6 py-4 text-center font-semibold">Ruang</th>
                      <th className="px-6 py-4 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jadwal.map((item, index) => {
                      const isFound = item.status === 'FOUND';
                      return (
                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${!isFound ? 'bg-red-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 text-base">
                              {isFound && item.data ? item.data.matkul : item.ocr_name}
                            </div>
                            {!isFound && (
                              <div className="text-xs text-red-500 mt-1 flex items-center">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                                Nama tidak ditemukan
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-xs ${isFound ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                              {isFound && item.data ? item.data.kelas : item.ocr_class || '?'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isFound && item.data ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-700">{item.data.jadwal.hari}, {item.data.jadwal.tanggal}</span>
                                <span className="text-xs text-gray-500 mt-0.5 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit">
                                  {item.data.jadwal.jam_mulai} - {item.data.jadwal.jam_selesai}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isFound && item.data ? (
                              <span className="bg-green-100 text-green-700 text-sm font-bold px-4 py-1.5 rounded-full border border-green-200 shadow-sm">
                                {item.data.ruang}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isFound ? (
                              <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                  <span className="text-green-600 text-lg">✓</span>
                                </div>
                              </div>
                            ) : (
                               <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                  <span className="text-red-500 text-lg">✕</span>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-4 text-xs text-gray-500 text-center border-t border-gray-200">
                Generated by Smart UAS Checker. Harap cek ulang dengan jadwal resmi.
              </div>
            </div>
            
             <p className="text-center text-gray-400 text-sm mb-12">
               * Tekan tombol "Simpan Gambar" di atas untuk mengunduh jadwal.
             </p>
          </div>
        )}

      </div>
    </div>
  );
}