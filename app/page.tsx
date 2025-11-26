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

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-800 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jadwal, setJadwal] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [isSimpleView, setIsSimpleView] = useState(false); 
  
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

  useEffect(() => {
    const text = "Cek Jadwal Ujian Otomatis";
    let index = 0;
    let timeout: NodeJS.Timeout;

    const runTyping = () => {
      if (index <= text.length) {
        setHeaderText(text.slice(0, index));
        index++;
        timeout = setTimeout(runTyping, 100);
      } else {
        timeout = setTimeout(() => {
          index = 0;
          setHeaderText('');
          timeout = setTimeout(runTyping, 500);
        }, 2000);
      }
    };

    runTyping();

    return () => clearTimeout(timeout);
  }, []);

  const formatTanggalLengkap = (hari: string, tanggalRaw: string) => {
    try {
      if (!tanggalRaw) return hari;
      const dateObj = new Date(tanggalRaw);
      if (isNaN(dateObj.getTime())) return `${hari}, ${tanggalRaw}`;
      
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('id-ID', options);
      
      return `${hari}, ${formattedDate}`;
    } catch (e) {
      return `${hari}, ${tanggalRaw}`;
    }
  };

  const formatTanggalSimpel = (tanggalRaw: string) => {
    try {
      if (!tanggalRaw) return '-';
      const dateObj = new Date(tanggalRaw);
      if (isNaN(dateObj.getTime())) return tanggalRaw;
      return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return tanggalRaw;
    }
  };

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
           minWidth: '1024px',
           width: '1024px',
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
        
        const sortedResult = data.result.sort((a: ScanResult, b: ScanResult) => {
          if (a.status === 'FOUND' && b.status !== 'FOUND') return -1;
          if (a.status !== 'FOUND' && b.status === 'FOUND') return 1;

          if (a.status === 'FOUND' && b.status === 'FOUND' && a.data && b.data) {
             const dateA = new Date(a.data.jadwal.tanggal).getTime();
             const dateB = new Date(b.data.jadwal.tanggal).getTime();
             return dateA - dateB;
          }
          
          return 0;
        });

        setJadwal(sortedResult);
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 py-10 px-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight min-h-[48px]">
            {headerText}
            <span className="animate-pulse text-gray-500">|</span>
          </h1>
          <p className="text-lg text-gray-500">
            Upload screenshot jadwal kuliahmu, biarkan AI menyusun jadwalmu.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl mb-10 border border-gray-200">
          
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6 flex items-start gap-3">
            <WarningIcon />
            <p className="text-sm text-gray-700 leading-snug">
              Pastikan upload <strong>screenshot penuh</strong> jadwal dari SIAM (termasuk header tabel) agar AI dapat membaca data dengan akurat.
            </p>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              isDragging ? 'border-black bg-gray-100 scale-[1.02]' : file ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          >
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              {file ? (
                <>
                  <FileIcon />
                  <p className="font-semibold text-gray-900 text-center break-all text-sm mt-2">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Tap untuk ganti file</p>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <div className="text-center">
                    <p className="font-medium text-gray-700 text-sm hidden sm:block">Drag & Drop gambar jadwal di sini</p>
                    <p className="font-medium text-gray-700 text-sm sm:hidden">Tap di sini untuk upload gambar</p>
                    <p className="text-xs text-gray-400 mt-2">Format: JPG, PNG, Screenshot</p>
                  </div>
                </>
              )}
            </label>
          </div>

          <button 
            onClick={handleUpload} disabled={loading || !file}
            className={`mt-6 w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold text-base shadow-md transition-all active:scale-95 cursor-pointer ${
              loading || !file ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {loading ? <><LoadingSpinner /> Sedang Memproses...</> : <><SearchIcon /> Cari Jadwal Saya</>}
          </button>
          
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">{error}</div>}
        </div>

        {jadwal.length > 0 && (
          <div className="w-full animate-fade-in-up">
            
            <div ref={resultRef} className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-8 overflow-hidden w-full mx-auto max-w-5xl">
              
              <div className="bg-black px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-white font-bold text-lg tracking-wide">Hasil Pencarian Jadwal</h2>
                  <span className="text-black text-xs bg-white px-3 py-1 rounded-full font-extrabold">
                    {jadwal.filter(j => j.status === 'FOUND').length} Ditemukan
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sorting Info */}
                  <div className="hidden sm:flex items-center text-gray-400 text-xs gap-1">
                    <SortIcon />
                    <span>Terurut per tanggal</span>
                  </div>

                  {/* Toggle View Button */}
                  <button 
                    onClick={() => setIsSimpleView(!isSimpleView)}
                    className="flex items-center text-xs px-3 py-2 rounded-lg font-bold shadow-sm transition-colors cursor-pointer bg-gray-800 text-white hover:bg-gray-700 ignore-scan"
                  >
                    <TableIcon /> {isSimpleView ? 'Format Standar' : 'Ganti Format'}
                  </button>

                  {/* Download Button */}
                  <button 
                    onClick={handleDownloadImage} disabled={downloading}
                    className={`flex items-center text-xs px-4 py-2 rounded-lg font-bold shadow-sm transition-colors cursor-pointer ignore-scan ${
                       downloading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {downloading ? "Menyimpan..." : <><DownloadIcon /> Simpan Gambar</>}
                  </button>
                </div>
              </div>
              
              <div className="w-full">
                {isSimpleView ? (
                  // --- SIMPLE TABLE VIEW ---
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 border border-gray-200 text-center">Hari</th>
                        <th className="px-4 py-3 border border-gray-200 text-center">Tanggal</th>
                        <th className="px-4 py-3 border border-gray-200 text-center">Jam</th>
                        <th className="px-4 py-3 border border-gray-200">Mata Kuliah</th>
                        <th className="px-4 py-3 border border-gray-200 text-center">Kelas</th>
                        <th className="px-4 py-3 border border-gray-200 text-center">Ruang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {jadwal.map((item, index) => {
                        const isFound = item.status === 'FOUND';
                        return (
                          <tr key={index} className={`${isFound ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-4 py-3 border border-gray-200 text-center font-medium">
                              {isFound && item.data ? item.data.jadwal.hari : '-'}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center">
                              {isFound && item.data ? formatTanggalSimpel(item.data.jadwal.tanggal) : '-'}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center font-mono text-xs">
                              {isFound && item.data ? `${item.data.jadwal.jam_mulai} - ${item.data.jadwal.jam_selesai}` : '-'}
                            </td>
                            <td className="px-4 py-3 border border-gray-200">
                              <div className="font-bold text-gray-900">
                                {isFound && item.data ? item.data.matkul : item.ocr_name}
                              </div>
                              {!isFound && <div className="text-xs text-red-500 italic mt-1">Tidak ditemukan</div>}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center font-bold">
                              {isFound && item.data ? item.data.kelas : item.ocr_class || '?'}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center font-bold">
                              {isFound && item.data ? item.data.ruang : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  // --- STANDARD CARD/TABLE VIEW ---
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-extrabold text-gray-700 w-1/3">Mata Kuliah</th>
                        <th className="px-4 py-4 text-center font-extrabold text-gray-700">Kelas</th>
                        <th className="px-6 py-4 font-extrabold text-gray-700">Waktu Ujian</th>
                        <th className="px-6 py-4 text-center font-extrabold text-gray-700">Ruang</th>
                        <th className="px-4 py-4 text-center font-extrabold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {jadwal.map((item, index) => {
                        const isFound = item.status === 'FOUND';
                        return (
                          <tr key={index} className={`hover:bg-gray-50 transition-colors ${!isFound ? 'bg-red-50/10' : ''}`}>
                            <td className="px-6 py-5">
                              <div className="font-bold text-gray-900 text-base">
                                {isFound && item.data ? item.data.matkul : item.ocr_name}
                              </div>
                              {!isFound && <div className="text-xs text-red-500 mt-1 font-medium italic">Tidak ditemukan di database</div>}
                            </td>
                            <td className="px-4 py-5 text-center">
                              <span className={`inline-block w-9 h-9 leading-9 rounded-full font-bold text-sm ${isFound ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {isFound && item.data ? item.data.kelas : item.ocr_class || '?'}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              {isFound && item.data ? (
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 text-base">
                                    {formatTanggalLengkap(item.data.jadwal.hari, item.data.jadwal.tanggal)}
                                  </span>
                                  <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded w-fit mt-1.5 border border-gray-300 font-medium">
                                    {item.data.jadwal.jam_mulai} - {item.data.jadwal.jam_selesai}
                                  </span>
                                </div>
                              ) : <span className="text-gray-400 font-medium">-</span>}
                            </td>
                            <td className="px-6 py-5 text-center whitespace-nowrap">
                              {isFound && item.data ? (
                                <span className="bg-gray-900 text-white text-sm font-bold px-5 py-2 rounded-full shadow-sm">
                                  {item.data.ruang}
                                </span>
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-4 py-5 text-center">
                              {isFound ? (
                                <span className="text-green-600 text-2xl font-bold">✓</span>
                              ) : (
                                <span className="text-red-500 text-xl font-bold">✕</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 text-xs text-gray-500 border-t border-gray-200">
                <div className="flex items-start space-x-2">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-800">Keterangan Status:</p>
                    <ul className="list-none space-y-1 text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600 font-bold text-lg">✓</span> 
                        <span>Jadwal ditemukan di database.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-500 font-bold text-lg">✕</span> 
                        <span>Jadwal tidak ditemukan / data tidak cocok.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
             <p className="text-center text-gray-400 text-xs mb-12 font-medium">
               * Tekan tombol "Simpan Gambar" di atas tabel untuk mengunduh jadwal lengkap.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}