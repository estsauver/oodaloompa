export function formatDistanceToNow(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = targetDate.getTime() - now.getTime();
  
  const seconds = Math.floor(Math.abs(diffMs) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';
  
  if (days > 0) {
    return `${prefix}${days} day${days > 1 ? 's' : ''}${suffix}`;
  }
  if (hours > 0) {
    return `${prefix}${hours} hour${hours > 1 ? 's' : ''}${suffix}`;
  }
  if (minutes > 0) {
    return `${prefix}${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`;
  }
  return `${prefix}${seconds} second${seconds > 1 ? 's' : ''}${suffix}`;
}