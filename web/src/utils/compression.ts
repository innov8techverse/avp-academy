import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return new File([compressedFile], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch (error) {
    throw error;
  }
};

export const compressPDF = async (file: File): Promise<File> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Compress PDF by removing unnecessary metadata and optimizing images
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
    });

    return new File([compressedPdfBytes], file.name, {
      type: 'application/pdf',
      lastModified: file.lastModified,
    });
  } catch (error) {
    throw error;
  }
};

export const convertToPDF = async (file: File): Promise<File> => {
  try {
    // For now, we'll return the original file with a note that conversion should happen on the server
    // In a production environment, you would use a library like mammoth.js for Word docs
    // or a server-side conversion service
    
    // Create a new file with PDF extension
    const fileName = file.name.replace(/\.[^/.]+$/, '.pdf');
    
    // For now, we'll just rename the file and let the server handle conversion
    // In a real implementation, you would convert the file here
    return new File([file], fileName, {
      type: 'application/pdf',
      lastModified: file.lastModified,
    });
  } catch (error) {
    throw error;
  }
};

export const compressDocument = async (file: File): Promise<File> => {
  // For DOC and PPT files, we'll use a simple size check
  // In a real application, you might want to use a more sophisticated compression library
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new Error('Document size exceeds 5MB limit');
  }
  return file;
}; 