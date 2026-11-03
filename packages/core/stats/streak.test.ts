import { describe, it, expect } from 'vitest';
import { calculateStreak } from './streak.js';

describe('calculateStreak', () => {
  it('handles empty dates', () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('calculates active streak', () => {
    const now = new Date('2024-01-05T12:00:00Z');
    const dates = [
      new Date('2024-01-03T10:00:00Z'),
      new Date('2024-01-04T10:00:00Z'),
      new Date('2024-01-05T10:00:00Z'),
    ];
    const result = calculateStreak(dates, now);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('calculates active streak missing today but having yesterday', () => {
    const now = new Date('2024-01-06T12:00:00Z');
    const dates = [
      new Date('2024-01-03T10:00:00Z'),
      new Date('2024-01-04T10:00:00Z'),
      new Date('2024-01-05T10:00:00Z'),
    ];
    const result = calculateStreak(dates, now);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('calculates broken streak', () => {
    const now = new Date('2024-01-07T12:00:00Z');
    const dates = [
      new Date('2024-01-03T10:00:00Z'),
      new Date('2024-01-04T10:00:00Z'),
      new Date('2024-01-05T10:00:00Z'),
    ];
    const result = calculateStreak(dates, now);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  it('handles same-day multiple sessions', () => {
    const now = new Date('2024-01-04T12:00:00Z');
    const dates = [
      new Date('2024-01-03T10:00:00Z'),
      new Date('2024-01-04T08:00:00Z'),
      new Date('2024-01-04T10:00:00Z'),
      new Date('2024-01-04T15:00:00Z'),
    ];
    const result = calculateStreak(dates, now);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('calculates longest streak correctly with breaks', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    const dates = [
      new Date('2024-01-01T10:00:00Z'),
      new Date('2024-01-02T10:00:00Z'),
      new Date('2024-01-03T10:00:00Z'),
      new Date('2024-01-04T10:00:00Z'), // Longest streak: 4
      new Date('2024-01-06T10:00:00Z'),
      new Date('2024-01-07T10:00:00Z'),
      new Date('2024-01-14T10:00:00Z'),
      new Date('2024-01-15T10:00:00Z'), // Current streak: 2
    ];
    const result = calculateStreak(dates, now);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(4);
  });
});
