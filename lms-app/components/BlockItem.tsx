'use client';

import { useState, useRef } from 'react';
import { Block, User } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase-client';
import VideoRecorder from './VideoRecorder';
import VideoPlayer from './VideoPlayer';
import {
  GripVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Type,
  Heading,
  Image,
  Video,
  HelpCircle,
  ListChecks,
  Upload,
  Camera,
  CheckCircle,
  Circle,
} from 'lucide-react';

interface BlockItemProps {
  block: Block;
  user: User | null;
  canEdit: boolean;
  onUpdate: (blockId: string, updates: Partial<Block>) => void;
  onDelete: (blockId: string) => void;
}

export default function BlockItem({ block, user, canEdit, onUpdate, onDelete }: BlockItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title);
  const [editContent, setEditContent] = useState(block.content);
  const [editOptions, setEditOptions] = useState<string[]>(block.options || []);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoPost, setVideoPost] = useState<{ video_url: string; thumbnail_url: string } | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const supabase = createClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(block.id, {
      title: editTitle,
      content: editContent,
      options: editOptions.length > 0 ? editOptions : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(block.title);
    setEditContent(block.content);
    setEditOptions(block.options || []);
    setIsEditing(false);
  };

  const handleYesNo = async (answer: 'yes' | 'no') => {
    setSelectedAnswer(answer);
    if (user) {
      await supabase.from('student_answers').upsert({
        user_id: user.id,
        block_id: block.id,
        answer,
      });
    }
  };

  const handleMultipleChoice = async (option: string) => {
    setSelectedAnswer(option);
    if (user) {
      await supabase.from('student_answers').upsert({
        user_id: user.id,
        block_id: block.id,
        answer: option,
      });
    }
  };

  const handleVideoRecorded = async (videoBlob: Blob, thumbnailBlob: Blob) => {
    // In a real app, you'd upload these to Supabase storage
    const videoUrl = URL.createObjectURL(videoBlob);
    const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
    
    setVideoPost({ video_url: videoUrl, thumbnail_url: thumbnailUrl });
    setShowVideoRecorder(false);

    // Save to database (in production, save actual URLs from storage)
    if (user) {
      await supabase.from('video_posts').upsert({
        block_id: block.id,
        user_id: user.id,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      });
    }
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case 'text': return <Type size={18} className="text-gray-500" />;
      case 'heading': return <Heading size={18} className="text-blue-500" />;
      case 'image': return <Image size={18} className="text-green-500" />;
      case 'video': return <Video size={18} className="text-purple-500" />;
      case 'yes_no': return <HelpCircle size={18} className="text-orange-500" />;
      case 'multiple_choice': return <ListChecks size={18} className="text-indigo-500" />;
      case 'file_upload': return <Upload size={18} className="text-teal-500" />;
      case 'video_post': return <Camera size={18} className="text-red-500" />;
      default: return <Type size={18} className="text-gray-500" />;
    }
  };

  const renderBlockContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Block title"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px]"
            placeholder="Block content"
          />
          {(block.type === 'multiple_choice') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Options (one per line)</label>
              <textarea
                value={editOptions.join('\n')}
                onChange={(e) => setEditOptions(e.target.value.split('\n').filter(o => o.trim()))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Check size={16} />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    switch (block.type) {
      case 'heading':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900">{block.title}</h2>
            {block.content && <p className="text-gray-600 mt-2">{block.content}</p>}
          </div>
        );

      case 'text':
        return (
          <div>
            {block.title && <h3 className="font-semibold text-gray-800 mb-2">{block.title}</h3>}
            <p className="text-gray-600 whitespace-pre-wrap">{block.content}</p>
          </div>
        );

      case 'image':
        return (
          <div>
            {block.title && <h3 className="font-semibold text-gray-800 mb-3">{block.title}</h3>}
            <div className="rounded-xl overflow-hidden bg-gray-100">
              {block.content ? (
                <img src={block.content} alt={block.title} className="w-full h-auto" />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  <Image size={48} />
                </div>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div>
            {block.title && <h3 className="font-semibold text-gray-800 mb-3">{block.title}</h3>}
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              {block.content ? (
                <iframe
                  src={block.content}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <Video size={48} />
                </div>
              )}
            </div>
          </div>
        );

      case 'yes_no':
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{block.title}</h3>
            <p className="text-gray-600 mb-4">{block.content}</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleYesNo('yes')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  selectedAnswer === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <CheckCircle size={20} className="inline mr-2" />
                Yes
              </button>
              <button
                onClick={() => handleYesNo('no')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  selectedAnswer === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <X size={20} className="inline mr-2" />
                No
              </button>
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{block.title}</h3>
            <p className="text-gray-600 mb-4">{block.content}</p>
            <div className="space-y-2">
              {(block.options || []).map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMultipleChoice(option)}
                  className={`answer-option w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selectedAnswer === option
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {selectedAnswer === option ? (
                    <CheckCircle size={20} className="text-indigo-600" />
                  ) : (
                    <Circle size={20} className="text-gray-400" />
                  )}
                  <span className={selectedAnswer === option ? 'text-indigo-700 font-medium' : 'text-gray-700'}>
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'file_upload':
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{block.title}</h3>
            <p className="text-gray-600 mb-4">{block.content}</p>
            <label className="block w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <span className="text-gray-600">Click to upload or drag and drop</span>
              <input type="file" className="hidden" />
            </label>
          </div>
        );

      case 'video_post':
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{block.title}</h3>
            <p className="text-gray-600 mb-4">{block.content}</p>
            
            {videoPost ? (
              <div className="relative">
                <div
                  className="aspect-video rounded-xl overflow-hidden cursor-pointer relative group"
                  onClick={() => setShowVideoPlayer(true)}
                >
                  <img
                    src={videoPost.thumbnail_url}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Video size={32} className="text-indigo-600 ml-1" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Video recorded successfully
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowVideoRecorder(true)}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-red-400 hover:bg-red-50 transition-all"
              >
                <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                <span className="text-gray-600">Click to record video from webcam</span>
              </button>
            )}

            {showVideoRecorder && (
              <VideoRecorder
                onClose={() => setShowVideoRecorder(false)}
                onSave={handleVideoRecorded}
              />
            )}

            {showVideoPlayer && videoPost && (
              <VideoPlayer
                videoUrl={videoPost.video_url}
                onClose={() => setShowVideoPlayer(false)}
              />
            )}
          </div>
        );

      default:
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{block.title}</h3>
            <p className="text-gray-600">{block.content}</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="block-container bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing mt-1"
          >
            <GripVertical size={18} className="text-gray-400" />
          </button>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getBlockIcon()}
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {block.type.replace('_', ' ')}
              </span>
            </div>
            
            {canEdit && !isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onDelete(block.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {renderBlockContent()}
        </div>
      </div>
    </div>
  );
}
