'use client';
import { useState, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
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
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-800 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=1280, initial-scale=0.3, maximum-scale=5.0, user-scalable=yes');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'viewport';
      newMeta.content = 'width=1280, initial-scale=0.3, maximum-scale=5.0, user-scalable=yes';
      document.head.appendChild(newMeta);
    }

    return () => {
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');
      }
    };
  }, []);

  const handleDownloadImage = async () => {
    if (!resultRef.current) return;
    setDownloading(true);

    try {
      const element = resultRef.current;
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(element, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
           overflow: 'hidden',
           minWidth: '1200px',
           width: '1200px',
           height: 'auto',
           display: 'block'
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
      alert("Gagal menyimpan gambar. Silakan coba lagi.");
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
        throw new Error("Tidak ditemukan jadwal kuliah pada gambar tersebut. Pastikan gambar jelas.");
      }

    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan: " + (err.message || "Gagal memproses permintaan"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            Cek Jadwal UAS
          </h1>
          <p className="text-sm md:text-lg text-gray-500">
            Upload screenshot jadwal kuliahmu, biarkan AI menyusun jadwalmu.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg mb-8 border border-gray-200">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              isDragging ? 'border-black bg-gray-100 scale-[1.02]' : file ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          >
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              {file ? (
                <>
                  <FileIcon />
                  <p className="font-semibold text-gray-900 text-center break-all text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Tap untuk ganti file</p>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <div className="text-center">
                    <p className="font-medium text-gray-600 text-sm hidden sm:block">Drag & Drop gambar jadwal di sini</p>
                    <p className="font-medium text-gray-600 text-sm sm:hidden">Tap di sini untuk upload gambar</p>
                    <p className="text-xs text-gray-400 mt-1">atau klik untuk jelajah file</p>
                  </div>
                </>
              )}
            </label>
          </div>

          <button 
            onClick={handleUpload} disabled={loading || !file}
            className={`mt-4 w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-sm md:text-base cursor-pointer ${
              loading || !file ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {loading ? <><LoadingSpinner /> Proses...</> : <><SearchIcon /> Cari Jadwal</>}
          </button>
          
          {error && <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 text-xs text-center font-medium">{error}</div>}
        </div>

        {jadwal.length > 0 && (
          <div className="w-full animate-fade-in-up">
            
            <div ref={resultRef} className="bg-white rounded-xl shadow-xl border border-gray-200 mb-6 overflow-x-auto w-full">
              
              <div className="bg-black px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 w-full min-w-[900px]">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-base">Hasil Pencarian</h2>
                  <span className="text-black text-[10px] bg-gray-200 px-2 py-0.5 rounded-full font-bold">
                    {jadwal.filter(j => j.status === 'FOUND').length} Ketemu
                  </span>
                </div>

                <div className="flex gap-2 ignore-scan">
                  <button 
                    onClick={handleDownloadImage} disabled={downloading}
                    className={`flex items-center text-xs px-3 py-2 rounded-lg font-bold shadow-sm transition-colors cursor-pointer ${
                       downloading ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {downloading ? "Menyimpan..." : <><DownloadIcon /> Simpan (PNG)</>}
                  </button>
                </div>
              </div>
              
              <div className="w-full">
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">Mata Kuliah</th>
                      <th className="px-4 py-4 text-center font-semibold text-gray-700">Kelas</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Waktu Ujian</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Ruang</th>
                      <th className="px-4 py-4 text-center font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jadwal.map((item, index) => {
                      const isFound = item.status === 'FOUND';
                      return (
                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${!isFound ? 'bg-gray-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 text-base">
                              {isFound && item.data ? item.data.matkul : item.ocr_name}
                            </div>
                            {!isFound && <div className="text-xs text-gray-400 mt-1 italic">Tidak ditemukan di database</div>}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-xs ${isFound ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {isFound && item.data ? item.data.kelas : item.ocr_class || '?'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isFound && item.data ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">{item.data.jadwal.hari}, {item.data.jadwal.tanggal}</span>
                                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1 border border-gray-200">
                                  {item.data.jadwal.jam_mulai} - {item.data.jadwal.jam_selesai}
                                </span>
                              </div>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {isFound && item.data ? (
                              <span className="bg-gray-800 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                                {item.data.ruang}
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {isFound ? (
                              <span className="text-gray-800 text-xl font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300 text-xl font-bold">✕</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 text-center border-t border-gray-200 min-w-[900px]">
                Hasil ini dihasilkan oleh AI. Selalu cek kembali dengan jadwal resmi fakultas.
              </div>
            </div>
            
             <p className="text-center text-gray-400 text-xs mb-12">
               * Tekan tombol "Simpan (PNG)" untuk mengunduh jadwal lengkap.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}