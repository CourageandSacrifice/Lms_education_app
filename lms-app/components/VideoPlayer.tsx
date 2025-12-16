'use client';

import { X } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

export default function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
        
        <video
          src={videoUrl}
          className="w-full rounded-xl"
          controls
          autoPlay
        />
      </div>
    </div>
  );
}
