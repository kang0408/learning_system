/**
 * Utilities for formatting Google Drive file sizes and storage metrics
 */

/**
 * Format bytes into human-readable string (B, KB, MB, GB, TB, PB)
 */
export const formatBytes = (bytes?: number | string | null): string => {
  if (bytes === undefined || bytes === null || bytes === '') return '0 B';
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num <= 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(num) / Math.log(k)), sizes.length - 1);
  const val = num / Math.pow(k, i);

  if (val >= 100) {
    return `${val.toFixed(0)} ${sizes[i]}`;
  } else if (val >= 10) {
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `${formatted} ${sizes[i]}`;
  } else {
    const formatted = val % 1 === 0 ? val.toFixed(0) : parseFloat(val.toFixed(2)).toString();
    return `${formatted} ${sizes[i]}`;
  }
};

/**
 * Format storage ratio and percentage
 */
export const formatStorageUsage = (used?: number | null, total?: number | null) => {
  const safeUsed = used && used > 0 ? used : 0;
  const safeTotal = total && total > 0 ? total : 15 * 1024 * 1024 * 1024; // default 15 GB

  if (safeUsed <= 0) {
    return {
      usedText: '0 B',
      totalText: formatBytes(safeTotal),
      percentText: '0%',
      percentValue: 0,
    };
  }

  const ratio = (safeUsed / safeTotal) * 100;
  let percentText = `${Math.round(ratio)}%`;
  let percentValue = Math.min(100, Math.max(0.5, ratio));

  if (ratio < 0.1) {
    percentText = '< 0.1%';
    percentValue = 0.8;
  } else if (ratio < 1) {
    percentText = `${ratio.toFixed(1)}%`;
    percentValue = Math.max(1, ratio);
  } else {
    percentText = `${Math.round(ratio)}%`;
    percentValue = Math.min(100, ratio);
  }

  return {
    usedText: formatBytes(safeUsed),
    totalText: formatBytes(safeTotal),
    percentText,
    percentValue,
  };
};
