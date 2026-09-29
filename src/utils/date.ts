/**
 * Date and Time utilities formatted for Bangladesh / Dhaka
 */

export function formatDate(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return 'N/A';
  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return 'N/A';
  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return 'Invalid time';

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return 'N/A';
  return `${formatDate(dateStringOrDate)}, ${formatTime(dateStringOrDate)}`;
}

export function formatBookingInterval(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid duration';

  const isSameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (isSameDay) {
    return `${formatDate(start)} (${formatTime(start)} - ${formatTime(end)})`;
  }

  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

/**
 * Calculates default end time given start time, duration quantity, and pricing type
 */
export function calculateEndTime(
  startTime: Date,
  pricingType: 'hourly' | 'daily' | 'weekly' | 'monthly',
  quantity: number
): Date {
  const end = new Date(startTime);
  switch (pricingType) {
    case 'hourly':
      end.setHours(end.getHours() + quantity);
      break;
    case 'daily':
      end.setDate(end.getDate() + quantity);
      break;
    case 'weekly':
      end.setDate(end.getDate() + quantity * 7);
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + quantity);
      break;
  }
  return end;
}
