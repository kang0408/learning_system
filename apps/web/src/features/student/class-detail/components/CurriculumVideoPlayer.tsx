import React from 'react';
import { useTranslation } from 'react-i18next';

interface CurriculumVideoPlayerProps {
  videoUrl?: string | null;
  videoType?: string | null;
  title: string;
}

export const CurriculumVideoPlayer: React.FC<CurriculumVideoPlayerProps> = ({
  videoUrl,
  videoType,
  title
}) => {
  const { t } = useTranslation();

  if (!videoUrl) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-widest text-zinc-500">
        <span>{t('student.classDetail.videoLecture')}</span>
      </div>

      <div className="relative aspect-video w-full bg-black border-2 border-zinc-900 shadow-[4px_4px_0_0_#18181b] overflow-hidden">
        {videoType === 'direct' ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
        ) : (
          <iframe
            src={videoUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};
