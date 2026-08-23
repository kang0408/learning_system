import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { teacherClassDetailApi } from '../api/teacherClassDetailApi';
import { toast } from '@/utils/toast';

interface ExportReportModalProps {
  classId: string;
  className: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  classId,
  className,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      toast.info(t('teacher.classReport.generating', 'Đang tạo báo cáo PDF & phân tích AI chất lượng cao...'));
      await teacherClassDetailApi.downloadClassReportPdf(classId, className);
      toast.success(t('teacher.classReport.success', 'Xuất báo cáo PDF thành công!'));
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.classReport.error', 'Không thể xuất báo cáo PDF. Vui lòng thử lại sau.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => !isExporting && onClose()}
      title={t('teacher.classReport.modalTitle', 'Xuất Báo Cáo Toàn Diện Lớp Học')}
      description={`Hệ thống sẽ tổng hợp số liệu học tập và đánh giá sư phạm của lớp "${className}" thành file PDF chuẩn A4.`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="font-medium"
          >
            {t('common.cancel', 'Hủy')}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={isExporting}
            className="bg-slate-900 hover:bg-indigo-600 text-white font-bold flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>{t('teacher.classReport.processing', 'Đang xử lý PDF...')}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t('teacher.classReport.downloadBtn', 'Tải Báo Cáo PDF')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
