'use client';

import { useState } from 'react';
import { Block } from '@/types';
import {
  X,
  Type,
  Heading,
  Image,
  Video,
  HelpCircle,
  ListChecks,
  Upload,
  Camera,
} from 'lucide-react';

interface AddBlockModalProps {
  onClose: () => void;
  onAdd: (type: Block['type'], title: string, content: string, options?: string[]) => void;
}

const BLOCK_TYPES: { type: Block['type']; icon: React.ReactNode; label: string; description: string }[] = [
  { type: 'heading', icon: <Heading size={24} />, label: 'Heading', description: 'Add a section heading' },
  { type: 'text', icon: <Type size={24} />, label: 'Text', description: 'Add text content' },
  { type: 'image', icon: <Image size={24} />, label: 'Image', description: 'Add an image' },
  { type: 'video', icon: <Video size={24} />, label: 'Video', description: 'Embed a video' },
  { type: 'yes_no', icon: <HelpCircle size={24} />, label: 'Yes/No Question', description: 'Simple yes/no response' },
  { type: 'multiple_choice', icon: <ListChecks size={24} />, label: 'Multiple Choice', description: 'Multiple choice question' },
  { type: 'file_upload', icon: <Upload size={24} />, label: 'File Upload', description: 'Allow file uploads' },
  { type: 'video_post', icon: <Camera size={24} />, label: 'Video Post', description: 'Record webcam video' },
];

export default function AddBlockModal({ onClose, onAdd }: AddBlockModalProps) {
  const [step, setStep] = useState<'type' | 'content'>('type');
  const [selectedType, setSelectedType] = useState<Block['type'] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [options, setOptions] = useState('');

  const handleTypeSelect = (type: Block['type']) => {
    setSelectedType(type);
    setStep('content');
  };

  const handleSubmit = () => {
    if (selectedType && title) {
      const optionsArray = options.split('\n').filter(o => o.trim());
      onAdd(selectedType, title, content, optionsArray.length > 0 ? optionsArray : undefined);
    }
  };

  const getContentPlaceholder = () => {
    switch (selectedType) {
      case 'heading': return 'Optional subtitle or description';
      case 'text': return 'Enter your text content here...';
      case 'image': return 'Enter image URL';
      case 'video': return 'Enter video embed URL (YouTube, Vimeo, etc.)';
      case 'yes_no': return 'Enter your yes/no question';
      case 'multiple_choice': return 'Enter your question';
      case 'file_upload': return 'Instructions for file upload';
      case 'video_post': return 'Instructions for video recording';
      default: return 'Content';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'type' ? 'Add New Block' : `Add ${BLOCK_TYPES.find(b => b.type === selectedType)?.label}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
          {step === 'type' ? (
            <div className="grid grid-cols-2 gap-3">
              {BLOCK_TYPES.map(({ type, icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                >
                  <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-indigo-100 text-gray-600 group-hover:text-indigo-600 transition-colors">
                    {icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 group-hover:text-indigo-700">{label}</div>
                    <div className="text-sm text-gray-500">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter block title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[120px]"
                  placeholder={getContentPlaceholder()}
                />
              </div>

              {selectedType === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options (one per line)
                  </label>
                  <textarea
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px]"
                    placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('type')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title}
                  className="flex-1 px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  Add Block
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
