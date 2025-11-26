import jadwalData from '../data/jadwal_uas.json'; 
import Fuse from 'fuse.js';

const fuse = new Fuse(jadwalData, {
  keys: ['mata kuliah'], 
  threshold: 0.4, 
});

export function cariJadwal(namaMatkulOCR, kelasOCR) {
  const results = fuse.search(namaMatkulOCR);
  if (results.length === 0) return null;

  const match = results.find(res => {
    const kelasDb = res.item.kelas ? res.item.kelas.toString().toLowerCase() : "";
    const kelasCari = kelasOCR ? kelasOCR.toString().toLowerCase() : "";
    return kelasDb === kelasCari;
  });

  return match ? match.item : null;
}