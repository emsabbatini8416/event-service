export function isInFuture(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

export function isUpcoming(startAt: string): boolean {
  return isInFuture(startAt);
}

export function isValidISODate(dateString: string): boolean {
  // Check if it's a valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Check if the string matches ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ssZ)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!iso8601Regex.test(dateString)) {
    return false;
  }
  
  // Verify the date string represents the same moment as the parsed date
  // Compare timestamps to handle milliseconds differences
  const inputDate = new Date(dateString);
  const parsedISO = date.toISOString();
  const parsedDate = new Date(parsedISO);
  
  return inputDate.getTime() === parsedDate.getTime();
}

export function isDateInRange(dateString: string, from?: string, to?: string): boolean {
  const date = new Date(dateString);
  
  if (from) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    if (date < fromDate) return false;
  }
  
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    if (date > toDate) return false;
  }
  
  return true;
}

