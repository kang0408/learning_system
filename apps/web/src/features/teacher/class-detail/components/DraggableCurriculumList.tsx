import React, { useState } from 'react';
import { CurriculumItemCard } from './CurriculumItemCard';
import type { ClassCurriculum, ReorderCurriculumItem } from '../types/curriculum.types';

interface DraggableCurriculumListProps {
  curriculums: ClassCurriculum[];
  onReorder: (orders: ReorderCurriculumItem[]) => void;
  onPreview: (curriculum: ClassCurriculum) => void;
  onEdit: (curriculum: ClassCurriculum) => void;
  onDelete: (curriculum: ClassCurriculum) => void;
  isReorderDisabled?: boolean;
}

export const DraggableCurriculumList: React.FC<DraggableCurriculumListProps> = ({
  curriculums,
  onReorder,
  onPreview,
  onEdit,
  onDelete,
  isReorderDisabled = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedList = [...curriculums];
    const [movedItem] = updatedList.splice(draggedIndex, 1);
    updatedList.splice(dropIndex, 0, movedItem);

    // Compute new order indexes
    const newOrders: ReorderCurriculumItem[] = updatedList.map((item, idx) => ({
      id: item.id,
      order_index: idx
    }));

    onReorder(newOrders);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {curriculums.map((curriculum, index) => (
        <CurriculumItemCard
          key={curriculum.id}
          curriculum={curriculum}
          index={index}
          isDragging={draggedIndex === index}
          isDragOver={dragOverIndex === index && draggedIndex !== index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onPreview={onPreview}
          onEdit={onEdit}
          onDelete={onDelete}
          isReorderDisabled={isReorderDisabled}
        />
      ))}
    </div>
  );
};
