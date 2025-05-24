
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

// Set workerSrc for pdfjs. This is crucial for it to work.
// We will use esm.sh to ensure compatibility with module loading.
if (typeof window !== 'undefined') {
  // pdfjsLib.version will contain the version string e.g., "5.2.133"
  // The importmap resolves "pdfjs-dist/" to "https://esm.sh/pdfjs-dist@^5.2.133/"
  // So, we construct the worker URL from esm.sh as well.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
    return extractTextFromDocx(file);
  } else if (file.type === 'application/msword') { // .doc
    throw new Error(".doc dosyaları doğrudan desteklenmemektedir. Lütfen .docx formatına dönüştürün veya metni kopyalayıp yapıştırın.");
  } 
  else if (file.type === 'text/plain') {
    return extractTextFromTxt(file);
  }
  else {
    throw new Error(`Desteklenmeyen dosya türü: ${file.type}. Lütfen PDF, DOCX veya TXT dosyası yükleyin.`);
  }
};

const extractTextFromTxt = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('TXT dosyası okunurken bir hata oluştu.'));
      }
    };
    reader.onerror = () => reject(new Error('TXT dosyası okunurken bir hata oluştu.'));
    reader.readAsText(file);
  });
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
    fullText += pageText + '\n';
  }
  if (!fullText.trim()) {
    throw new Error("PDF dosyasından metin çıkarılamadı. Dosya resim tabanlı olabilir veya içeriği boş olabilir.");
  }
  return fullText;
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("DOCX dosyasından metin çıkarılırken bir hata oluştu.");
  }
};
