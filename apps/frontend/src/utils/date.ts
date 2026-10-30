/**
 * Định dạng ngày theo giờ địa phương của trình duyệt (YYYY-MM-DD).
 * Không dùng toISOString() vì nó trả về ngày UTC: từ 0h–7h sáng giờ Việt Nam
 * sẽ ra ngày hôm qua và backend từ chối với lỗi "ngày trong quá khứ".
 */
export const toLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getToday = (): string => toLocalDateString(new Date());

export const getDayOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};
