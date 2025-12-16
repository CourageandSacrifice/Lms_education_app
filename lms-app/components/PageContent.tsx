'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Page, Block, User } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BlockItem from './BlockItem';
import AddBlockModal from './AddBlockModal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface PageContentProps {
  page: Page;
  user: User | null;
  pages: Page[];
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function PageContent({ page, user, pages, onNavigate }: PageContentProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();

  const canEdit = user?.role === 'teacher' || user?.role === 'admin';
  const currentPageIndex = pages.findIndex(p => p.id === page.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('order_index');
      
      setBlocks(data || []);
      setLoading(false);
    };

    fetchBlocks();
  }, [page.id, supabase]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      setBlocks(newBlocks);

      // Update order in database
      for (let i = 0; i < newBlocks.length; i++) {
        await supabase
          .from('blocks')
          .update({ order_index: i })
          .eq('id', newBlocks[i].id);
      }
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: Partial<Block>) => {
    const { error } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', blockId);

    if (!error) {
      setBlocks(blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);

    if (!error) {
      setBlocks(blocks.filter(b => b.id !== blockId));
    }
  };

  const handleAddBlock = async (type: Block['type'], title: string, content: string, options?: string[]) => {
    const newBlock = {
      page_id: page.id,
      type,
      title,
      content,
      options: options || null,
      order_index: blocks.length,
    };

    const { data, error } = await supabase
      .from('blocks')
      .insert(newBlock)
      .select()
      .single();

    if (!error && data) {
      setBlocks([...blocks, data]);
    }
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header with Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('prev')}
            disabled={pages.length <= 1}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Page {currentPageIndex + 1} of {pages.length}
            </p>
          </div>

          <button
            onClick={() => onNavigate('next')}
            disabled={pages.length <= 1}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {blocks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No content yet</h3>
              <p className="text-gray-500 mb-6">This page doesn't have any blocks yet</p>
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add First Block
                </button>
              )}
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {blocks.map((block) => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        user={user}
                        canEdit={canEdit}
                        onUpdate={handleBlockUpdate}
                        onDelete={handleBlockDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Block Button */}
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Block
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Block Modal */}
      {showAddModal && (
        <AddBlockModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddBlock}
        />
      )}
    </div>
  );
}
