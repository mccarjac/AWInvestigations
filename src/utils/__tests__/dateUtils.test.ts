import {
  parseDateString,
  formatEventDate,
  formatEventDateShort,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('parseDateString', () => {
    it('should parse a valid date string', () => {
      const date = parseDateString('2025-11-11');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10); // 0-indexed
      expect(date.getDate()).toBe(11);
    });

    it('should parse leap year dates correctly', () => {
      const date = parseDateString('2024-02-29');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });

    it('should throw error for invalid format', () => {
      expect(() => parseDateString('11-11-2025')).toThrow(
        'Invalid date format'
      );
      expect(() => parseDateString('2025/11/11')).toThrow(
        'Invalid date format'
      );
      expect(() => parseDateString('2025-11-1')).toThrow('Invalid date format');
      expect(() => parseDateString('not-a-date')).toThrow(
        'Invalid date format'
      );
    });

    it('should throw error for non-numeric values', () => {
      expect(() => parseDateString('2025-ab-11')).toThrow(
        'Invalid date format'
      );
      expect(() => parseDateString('abcd-11-11')).toThrow(
        'Invalid date format'
      );
    });

    it('should throw error for invalid dates', () => {
      expect(() => parseDateString('2025-02-30')).toThrow('Invalid date');
      expect(() => parseDateString('2025-13-01')).toThrow('Invalid date');
      expect(() => parseDateString('2023-02-29')).toThrow('Invalid date'); // Non-leap year
      expect(() => parseDateString('2025-04-31')).toThrow('Invalid date');
    });

    it('should handle edge cases for valid dates', () => {
      const date1 = parseDateString('2025-01-01');
      expect(date1.getMonth()).toBe(0);
      expect(date1.getDate()).toBe(1);

      const date2 = parseDateString('2025-12-31');
      expect(date2.getMonth()).toBe(11);
      expect(date2.getDate()).toBe(31);
    });
  });

  describe('formatEventDate', () => {
    it('should format date without time', () => {
      const formatted = formatEventDate('2025-11-11');
      // Should contain the date components in some form
      expect(formatted).toContain('2025');
      expect(formatted).toContain('11');
      expect(formatted).toContain('November');
    });

    it('should format date with time', () => {
      const formatted = formatEventDate('2025-11-11', '14:30');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('11');
      expect(formatted).toContain('at 14:30');
    });

    it('should allow custom formatting options', () => {
      const formatted = formatEventDate('2025-11-11', undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Nov');
      expect(formatted).toContain('11');
    });

    it('should throw error for invalid date string', () => {
      expect(() => formatEventDate('invalid-date')).toThrow();
    });
  });

  describe('formatEventDateShort', () => {
    it('should format date in short format without time', () => {
      const formatted = formatEventDateShort('2025-11-11');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('11');
      expect(formatted).toContain('Nov');
    });

    it('should format date in short format with time', () => {
      const formatted = formatEventDateShort('2025-11-11', '14:30');
      expect(formatted).toContain('Nov');
      expect(formatted).toContain('11');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('at 14:30');
    });

    it('should throw error for invalid date string', () => {
      expect(() => formatEventDateShort('invalid-date')).toThrow();
    });
  });
});
