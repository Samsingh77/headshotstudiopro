
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const applyFiltersToImage = (base64: string, filters: any): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation - (filters.vintage * 0.3)}%) grayscale(${filters.grayscale}%) sepia(${filters.vintage * 0.6}%) hue-rotate(${filters.hue - (filters.vintage * 0.2)}deg)`;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      console.error("Filter application failed: image load error");
      resolve(base64);
    };
    img.src = base64;
  });
};

export const applyWatermark = (base64: string, isTransparent: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.floor(canvas.width / 50);
      ctx.font = `800 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(160, 160, 160, 0.22)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = 'HEADSHOT STUDIO';
      const rows = 6;
      const cols = 4;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          ctx.save();
          const x = (canvas.width / (cols + 1)) * c + (r % 2 === 0 ? fontSize * 2 : 0);
          const y = (canvas.height / (rows + 1)) * r;
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 12);
          ctx.fillText(text, 0, 0);
          ctx.font = `700 ${fontSize * 0.6}px Inter, sans-serif`;
          ctx.fillText('PREVIEW ONLY', 0, fontSize * 0.8);
          ctx.restore();
        }
      }
      resolve(canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', isTransparent ? undefined : 0.85));
    };
    img.onerror = () => {
      console.error("Watermark application failed: image load error");
      resolve(base64); // Fallback to original image if watermarking fails
    };
    img.src = base64;
  });
};
