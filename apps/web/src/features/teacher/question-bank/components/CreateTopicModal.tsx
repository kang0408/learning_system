import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { useCreateTopic } from '../hooks/useTeacherQuestionBank';
import { toast } from '@/utils/toast';
import { TreeSelect } from '@/components/ui/TreeSelect';
import type { TreeSelectOption } from '@/components/ui/TreeSelect';
import type { Topic } from '../types';
import { Dialog } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ isOpen, onClose, topics }) => {
  const { t } = useTranslation();
  const { mutateAsync: createTopic, isPending } = useCreateTopic();
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [enableCustomCode, setEnableCustomCode] = useState(false);
  const [topicCode, setTopicCode] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    
    if (enableCustomCode && topicCode.trim().length !== 6) {
      toast.error(t('teacher.questionBank.createTopic.errorLength'));
      return;
    }

    try {
      await createTopic({
        name: topicName,
        description: topicDescription,
        code: enableCustomCode ? topicCode.trim().toUpperCase() : undefined,
        parent_id: parentId || null
      });
      toast.success(t('teacher.questionBank.createTopic.success'));
      onClose();
      setTopicName('');
      setTopicDescription('');
      setEnableCustomCode(false);
      setTopicCode('');
      setParentId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || t('teacher.questionBank.createTopic.errorCreate'));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('teacher.questionBank.createTopic.title')}
      description={t('teacher.questionBank.createTopic.description')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label required>{t('teacher.questionBank.createTopic.nameLabel')}</Label>
          <Input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder={t('teacher.questionBank.createTopic.namePlaceholder')}
            required
          />
        </div>
        
        <div>
          <Label>Topic Cha</Label>
          <TreeSelect
            value={parentId}
            onChange={setParentId}
            options={[
              { label: 'Không có Topic Cha (Root)', value: '' },
              ...topics.map(function mapTopic(t: Topic): TreeSelectOption {
                return {
                  label: `${t.name} ${t.code ? `(${t.code})` : ''}`.trim(),
                  value: t.id,
                  children: t.children?.map(mapTopic)
                };
              })
            ]}
            placeholder="Chọn Topic Cha..."
          />
        </div>

        <div>
          <Label>{t('teacher.questionBank.createTopic.descLabel')}</Label>
          <Textarea
            value={topicDescription}
            onChange={(e) => setTopicDescription(e.target.value)}
            rows={3}
            placeholder={t('teacher.questionBank.createTopic.descPlaceholder')}
          />
        </div>

        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-3">
          <Switch
            checked={enableCustomCode}
            onCheckedChange={setEnableCustomCode}
            label={t('teacher.questionBank.createTopic.codeLabel')}
            description={t('teacher.questionBank.createTopic.codeDesc')}
          />
          
          <Input
            type="text"
            maxLength={6}
            value={topicCode}
            onChange={(e) => setTopicCode(e.target.value.toUpperCase())}
            disabled={!enableCustomCode}
            className="uppercase tracking-[0.2em] font-medium"
            placeholder={enableCustomCode ? t('teacher.questionBank.createTopic.codePlaceholderExample') : t('teacher.questionBank.createTopic.codePlaceholderAuto')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {t('teacher.questionBank.createTopic.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {t('teacher.questionBank.createTopic.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
