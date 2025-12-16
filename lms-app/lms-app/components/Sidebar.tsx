'use client';

import { useState } from 'react';
import { User, CourseSection, Page } from '@/types';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronDown, 
  FileText, 
  GripVertical,
  Layers
} from 'lucide-react';

interface SidebarProps {
  user: User | null;
  sections: CourseSection[];
  selectedSection: CourseSection | null;
  onSectionChange: (section: CourseSection) => void;
  pages: Page[];
  selectedPage: Page | null;
  onPageSelect: (page: Page) => void;
  onPagesReorder: (pages: Page[]) => void;
}

interface SortablePageItemProps {
  page: Page;
  isSelected: boolean;
  onSelect: () => void;
  canDrag: boolean;
}

function SortablePageItem({ page, isSelected, onSelect, canDrag }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`page-item flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-indigo-50 text-indigo-700 border-l-3 border-indigo-500' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} className="text-gray-400" />
        </button>
      )}
      <FileText size={16} className={isSelected ? 'text-indigo-500' : 'text-gray-400'} />
      <span className="text-sm font-medium truncate flex-1">{page.title}</span>
    </div>
  );
}

export default function Sidebar({
  user,
  sections,
  selectedSection,
  onSectionChange,
  pages,
  selectedPage,
  onPageSelect,
  onPagesReorder,
}: SidebarProps) {
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      const newPages = arrayMove(pages, oldIndex, newIndex);
      onPagesReorder(newPages);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Section Selector */}
      <div className="p-4 border-b border-gray-100">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
          Section
        </label>
        <div className="relative">
          <button
            onClick={() => setShowSectionDropdown(!showSectionDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Layers size={18} className="text-indigo-500" />
              <span className="font-medium text-gray-800 truncate">
                {selectedSection?.title || 'Select Section'}
              </span>
            </div>
            <ChevronDown 
              size={18} 
              className={`text-gray-500 transition-transform ${showSectionDropdown ? 'rotate-180' : ''}`} 
            />
          </button>

          {showSectionDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10 dropdown-enter max-h-64 overflow-auto">
              {sections.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No sections available</div>
              ) : (
                sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      onSectionChange(section);
                      setShowSectionDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                      selectedSection?.id === section.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    {section.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Pages
          </label>
          <span className="text-xs text-gray-400">{pages.length} pages</span>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No pages in this section</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {pages.map((page) => (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    isSelected={selectedPage?.id === page.id}
                    onSelect={() => onPageSelect(page)}
                    canDrag={canEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {user?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
