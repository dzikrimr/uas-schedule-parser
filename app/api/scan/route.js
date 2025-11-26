import { GoogleGenerativeAI } from "@google/generative-ai";
import { cariJadwal } from "../../utils/searchEngine";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper kecil untuk memecah tanggal & jam dari JSON mentah kamu
function formatData(rawItem) {
  if (!rawItem) return null;

  // Pecah "Rabu,12/03/2025"
  let hari = rawItem['hari dan tanggal'] || '-';
  let tanggal = '';
  if (hari.includes(',')) {
    const split = hari.split(',');
    hari = split[0];
    tanggal = split[1];
  }

  // Pecah "07:30-09:30"
  let jamMulai = rawItem['waktu'] || '-';
  let jamSelesai = '';
  if (jamMulai.includes('-')) {
    const split = jamMulai.split('-');
    jamMulai = split[0];
    jamSelesai = split[1];
  }

  // Return format bersih yang disukai Frontend
  return {
    matkul: rawItem['mata kuliah'], // Mapping dari 'mata kuliah' ke 'matkul'
    kelas: rawItem['kelas'],
    ruang: rawItem['Ruang'],        // Mapping dari 'Ruang' (huruf besar)
    jadwal: {
      hari: hari,
      tanggal: tanggal,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai
    }
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Baca gambar jadwal ini. Ambil nama mata kuliah dan kelas. Return JSON Array murni: [{"matkul": "Nama Matkul", "kelas": "A"}]. Jangan pakai markdown.`;

    const result = await model.generateContent([prompt, { inlineData: { data: base64Image, mimeType: file.type } }]);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    
    let ocrData = [];
    try {
      ocrData = JSON.parse(text);
    } catch (err) {
      console.error("Gemini output not JSON:", text);
      return NextResponse.json({ error: "Gagal membaca jadwal (AI Error)" }, { status: 500 });
    }

    // Cocokkan Data
    const hasilAkhir = ocrData.map(item => {
      const dbMatch = cariJadwal(item.matkul, item.kelas);
      
      return {
        input: item,
        status: dbMatch ? "FOUND" : "NOT_FOUND", // Gunakan status biar gampang di frontend
        ocr_name: item.matkul,
        ocr_class: item.kelas,
        // Di sini kita format datanya biar Frontend tinggal tampilkan
        data: dbMatch ? formatData(dbMatch) : null 
      };
    });

    return NextResponse.json({ result: hasilAkhir });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}