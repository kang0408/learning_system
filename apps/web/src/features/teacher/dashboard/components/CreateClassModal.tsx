import React, { useState } from 'react';
import type { CreateClassPayload } from '../types';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

interface CreateClassModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
  isCreating: boolean;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSubmit, isCreating }) => {
  const { t } = useTranslation();
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('English');
  const [newClassDesc, setNewClassDesc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    await onSubmit({
      name: newClassName,
      subject: newClassSubject,
      description: newClassDesc
    });
  };

  return (
    <Dialog 
      isOpen={true} 
      onClose={onClose}
      title={t('teacher.dashboard.modalTitle')}
      description={t('teacher.dashboard.modalDesc')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label required>{t('teacher.dashboard.classNameLabel')}</Label>
          <Input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder={t('teacher.dashboard.classNamePlaceholder')}
            required
          />
        </div>

        <div>
          <Label required>{t('teacher.dashboard.subjectLabel')}</Label>
          <Input
            type="text"
            value={newClassSubject}
            onChange={(e) => setNewClassSubject(e.target.value)}
            placeholder={t('teacher.dashboard.subjectPlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('teacher.dashboard.descriptionLabel')}</Label>
          <Textarea
            value={newClassDesc}
            onChange={(e) => setNewClassDesc(e.target.value)}
            placeholder={t('teacher.dashboard.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('teacher.dashboard.cancelBtn')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isCreating} disabled={!newClassName.trim()}>
            {t('teacher.dashboard.submitBtn')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};


