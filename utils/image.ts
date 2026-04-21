import imageCompression from 'browser-image-compression';

export const compressImage = async (base64Data: string, maxWidthOrHeight: number = 1920, quality: number = 0.8): Promise<string> => {
  try {
    // Convert base64 to File
    const response = await fetch(base64Data);
    const blob = await response.blob();
    const file = new File([blob], "image.png", { type: "image/png" });

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: quality,
    };

    const compressedFile = await imageCompression(file, options);
    
    // Convert back to base64 for the existing flow or return as blob/file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('Compression failed:', error);
    return base64Data; // Fallback to original
  }
};

export const generateThumbnail = async (base64Data: string, size: number = 200): Promise<string> => {
  return compressImage(base64Data, size, 0.6);
};
