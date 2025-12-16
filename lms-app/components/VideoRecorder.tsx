'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Video, Square, RotateCcw, Check } from 'lucide-react';

interface VideoRecorderProps {
  onClose: () => void;
  onSave: (videoBlob: Blob, thumbnailBlob: Blob) => void;
}

export default function VideoRecorder({ onClose, onSave }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please ensure you have granted camera permissions.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startCamera]);

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = async () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    await startCamera();
  };

  const handleSave = async () => {
    if (!recordedBlob || !videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((thumbnailBlob) => {
        if (thumbnailBlob) {
          onSave(recordedBlob, thumbnailBlob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Record Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="relative bg-black aspect-video">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <div>
                <Video size={48} className="mx-auto mb-4 opacity-50" />
                <p>{error}</p>
              </div>
            </div>
          ) : recordedUrl ? (
            <video
              ref={videoRef}
              src={recordedUrl}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}
          
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full video-recording">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-center gap-4">
            {!recordedUrl ? (
              isRecording ? (
                <button
                  onClick={stopRecording}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                >
                  <Square size={24} />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={!!error}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50"
                >
                  <Video size={24} />
                </button>
              )
            ) : (
              <>
                <button
                  onClick={resetRecording}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <RotateCcw size={20} />
                  Re-record
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <Check size={20} />
                  Save Video
                </button>
              </>
            )}
          </div>
          
          {!recordedUrl && !isRecording && !error && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Click the record button to start recording
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
