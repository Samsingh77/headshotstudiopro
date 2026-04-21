import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.9));
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/90 backdrop-blur-md">
      <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full overflow-hidden relative border border-slate-200 ">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 transition-all z-50" >
          <X className="w-4 h-4" />
        </button>
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-1">Take Photo</h2>
            <p className="text-slate-500 font-medium text-[9px] tracking-wider uppercase">Position yourself clearly in the frame</p>
          </div>
          <div className="relative aspect-video bg-slate-100 rounded-md overflow-hidden border border-slate-200 mb-6">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-bold text-red-500 mb-4">{error}</p>
                <button onClick={startCamera} className="btn-secondary">
                  <RefreshCw className="w-3.5 h-3.5" /><span>Try Again</span>
                </button>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex justify-center">
            <button onClick={capture} disabled={!stream} className="w-16 h-16 rounded-full bg-[#16A34A] text-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100" >
              <Camera className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
