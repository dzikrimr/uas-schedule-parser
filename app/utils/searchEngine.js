import jadwalData from '../data/jadwal_uas.json'; 
import Fuse from 'fuse.js';

const fuse = new Fuse(jadwalData, {
  // PERBAIKAN: Sesuaikan dengan key di JSON kamu ("mata kuliah")
  keys: ['mata kuliah'], 
  threshold: 0.4, 
});

export function cariJadwal(namaMatkulOCR, kelasOCR) {
  const results = fuse.search(namaMatkulOCR);
  if (results.length === 0) return null;

  // Cari yang kelasnya cocok
  const match = results.find(res => {
    // PERBAIKAN: Pastikan data 'kelas' ada sebelum di-lowercase untuk hindari error
    const kelasDb = res.item.kelas ? res.item.kelas.toString().toLowerCase() : "";
    const kelasCari = kelasOCR ? kelasOCR.toString().toLowerCase() : "";
    return kelasDb === kelasCari;
  });

  return match ? match.item : null;
}