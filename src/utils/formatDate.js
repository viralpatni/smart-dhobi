import { format, formatDistanceToNow } from 'date-fns';

export const formatStandardDate = (date) => {
  if (!date) return '';
  return format(date instanceof Date ? date : date.toDate(), 'dd MMM yyyy, hh:mm a');
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  return `${formatDistanceToNow(date instanceof Date ? date : date.toDate())} ago`;
};
