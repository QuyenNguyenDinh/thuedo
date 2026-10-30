/**
 * Date utility for CosRent business rules:
 * - Timezone: Asia/Ho_Chi_Minh (UTC+7)
 * - Dates represented as YYYY-MM-DD calendar strings
 * - Inclusive calculation: rentalDays = (diff in calendar days) + 1
 * - Same day rental = 1 day
 */

export class DateUtil {
  /** Số ngày thuê tối đa cho một đơn (chặn khoảng ngày quá dài gây quá tải vòng lặp tính tồn kho). */
  static readonly MAX_RENTAL_DAYS = 30;

  /**
   * Parse a YYYY-MM-DD string into [year, month, day] integers.
   */
  static parseDateString(dateStr: string): { year: number; month: number; day: number } {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    if (!match) {
      throw new Error(`Định dạng ngày không hợp lệ (${dateStr}). Yêu cầu YYYY-MM-DD.`);
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    if (month < 1 || month > 12) {
      throw new Error(`Tháng không hợp lệ: ${month}. Tháng phải từ 01 đến 12.`);
    }

    const testDate = new Date(Date.UTC(year, month - 1, day));
    if (
      testDate.getUTCFullYear() !== year ||
      testDate.getUTCMonth() !== month - 1 ||
      testDate.getUTCDate() !== day
    ) {
      throw new Error(`Ngày ${dateStr} không tồn tại trên lịch thực tế.`);
    }

    return { year, month, day };
  }

  /**
   * Convert YYYY-MM-DD to UTC timestamp for midnight in Asia/Ho_Chi_Minh (UTC+7).
   * Note: We treat each calendar day as an integer epoch-day index to avoid any DST / shift issues.
   */
  static toDayEpoch(dateStr: string): number {
    const { year, month, day } = this.parseDateString(dateStr);
    // Use Date.UTC at 00:00:00
    const utcMs = Date.UTC(year, month - 1, day);
    return Math.floor(utcMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Calculate rental days inclusive:
   * (end - start) in days + 1
   * E.g. 2026-11-10 to 2026-11-10 = 1 day.
   * 2026-11-10 to 2026-11-12 = 3 days.
   */
  static calculateRentalDays(startDateStr: string, endDateStr: string): number {
    const startEpoch = this.toDayEpoch(startDateStr);
    const endEpoch = this.toDayEpoch(endDateStr);

    if (endEpoch < startEpoch) {
      throw new Error('Ngày trả không được trước ngày nhận.');
    }

    return endEpoch - startEpoch + 1;
  }

  /**
   * Get current calendar date string (YYYY-MM-DD) in Asia/Ho_Chi_Minh timezone.
   */
  static getTodayInVietnam(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Outputs YYYY-MM-DD
  }

  /**
   * Check if a date string is in the past compared to today in Vietnam.
   */
  static isDateInPast(dateStr: string): boolean {
    const today = this.getTodayInVietnam();
    return this.toDayEpoch(dateStr) < this.toDayEpoch(today);
  }

  /**
   * Generate array of all YYYY-MM-DD strings between start and end (inclusive).
   */
  static getDatesInRange(startDateStr: string, endDateStr: string): string[] {
    const startEpoch = this.toDayEpoch(startDateStr);
    const endEpoch = this.toDayEpoch(endDateStr);

    if (endEpoch < startEpoch) {
      return [];
    }

    const dates: string[] = [];
    for (let epoch = startEpoch; epoch <= endEpoch; epoch++) {
      const d = new Date(epoch * 24 * 60 * 60 * 1000);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  }

  /**
   * Format YYYY-MM-DD to Vietnamese display dd/MM/yyyy.
   */
  static formatDisplayVN(dateStr: string): string {
    const { year, month, day } = this.parseDateString(dateStr);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
}

