import Image from 'next/image';
import type { ModulePreviewItem } from './modulePreviewUtils';

interface ModulePreviewPanelProps {
  moduleItem: ModulePreviewItem | null;
  borderCls: string;
  bgSub: string;
  textPrimary: string;
  textMuted: string;
  className?: string;
  emptyTitle?: string;
  hintText?: string;
}

export function ModulePreviewPanel({
  moduleItem,
  borderCls,
  bgSub,
  textPrimary,
  textMuted,
  className,
  emptyTitle = 'Xem trước module',
  hintText = 'Di chuột vào từng module để xem trước.',
}: ModulePreviewPanelProps) {
  return (
    <div className={`rounded-xl border ${borderCls} p-4 ${bgSub} ${className ?? ''}`.trim()}>
      <p className={`text-sm font-semibold mb-3 ${textPrimary}`}>
        {moduleItem ? moduleItem.label : emptyTitle}
      </p>

      <div className={`aspect-[4/3] rounded-lg border ${borderCls} overflow-hidden bg-white dark:bg-cardPreview`}>
        {moduleItem?.preview ? (
          <Image
            src={moduleItem.preview}
            alt={moduleItem.label}
            width={800}
            height={600}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-sm ${textMuted} px-4 text-center`}>
            Chưa có ảnh preview cho module này.
          </div>
        )}
      </div>

      <p className={`mt-2 text-xs ${textMuted}`}>{hintText}</p>
    </div>
  );
}
