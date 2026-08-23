import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { teacherStudentDetailApi } from '../api/teacherStudentDetailApi';
import { toast } from '@/utils/toast';

interface ExportStudentReportModalProps {
  classId: string;
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportStudentReportModal: React.FC<ExportStudentReportModalProps> = ({
  classId,
  studentId,
  studentName,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      toast.info(t('teacher.studentReport.generating', 'Đang tạo báo cáo chẩn đoán & phân tích AI học sinh...'));
      await teacherStudentDetailApi.downloadStudentReportPdf(classId, studentId, studentName);
      toast.success(t('teacher.studentReport.success', 'Xuất báo cáo học sinh PDF thành công!'));
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.studentReport.error', 'Không thể xuất báo cáo PDF học sinh. Vui lòng thử lại sau.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => !isExporting && onClose()}
      title={t('teacher.studentReport.modalTitle', 'Xuất Báo Cáo Chẩn Đoán Học Sinh')}
      description={`Hệ thống sẽ tổng hợp hồ sơ năng lực, lỗ hổng kiến thức và phân tích sư phạm của học sinh "${studentName}" thành file PDF chuẩn A4.`}
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
                <span>{t('teacher.studentReport.processing', 'Đang xử lý PDF...')}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t('teacher.studentReport.downloadBtn', 'Tải Báo Cáo PDF')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
