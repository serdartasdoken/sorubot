
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractTextFromFile } from '../services/documentParserService';
import Spinner from './Spinner';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onTextExtracted, setLoading, setError, isLoading }) => {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setDragOver(false);
    if (acceptedFiles.length === 0) {
      setError("Lütfen geçerli bir dosya seçin.");
      return;
    }
    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setError("Dosyadan metin çıkarılamadı veya dosya boş. Lütfen farklı bir dosya deneyin.");
        setLoading(false);
        return;
      }
      onTextExtracted(text, file.name);
    } catch (err) {
      const error = err as Error;
      console.error("File processing error:", error);
      setError(error.message || "Dosya işlenirken bir hata oluştu.");
      setLoading(false);
    }
  }, [onTextExtracted, setLoading, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-xl">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Belge Yükle</h2>
      {isLoading ? (
        <Spinner message="Dosya işleniyor, lütfen bekleyin..." />
      ) : (
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300
            ${dragOver || isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <i className={`fas fa-cloud-upload-alt text-5xl mb-4 ${dragOver || isDragActive ? 'text-primary-600' : 'text-gray-400'}`}></i>
            {isDragActive ? (
              <p className="text-lg text-primary-600 font-medium">Dosyayı buraya bırakın...</p>
            ) : (
              <>
                <p className="text-lg text-gray-600 font-medium">Dosyanızı sürükleyip bırakın veya seçmek için tıklayın</p>
                <p className="text-sm text-gray-500 mt-1">Desteklenen formatlar: PDF, DOCX, TXT</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
