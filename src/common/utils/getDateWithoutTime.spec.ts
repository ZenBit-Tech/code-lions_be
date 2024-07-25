/* eslint-disable @typescript-eslint/no-magic-numbers */
import getDateWithoutTime from './getDateWithoutTime';

describe('getDateWithoutTime', () => {
  it('should format the date correctly for single digit month and day', () => {
    const date = new Date(2024, 6, 3);
    const formattedDate = getDateWithoutTime(date);

    expect(formattedDate).toBe('03.07.2024');
  });

  it('should format the date correctly for double digit month and day', () => {
    const date = new Date(2023, 10, 13);
    const formattedDate = getDateWithoutTime(date);

    expect(formattedDate).toBe('13.11.2023');
  });

  it('should format the date correctly for the first day of the month', () => {
    const date = new Date(2024, 0, 1);
    const formattedDate = getDateWithoutTime(date);

    expect(formattedDate).toBe('01.01.2024');
  });

  it('should format the date correctly for the last day of the year', () => {
    const date = new Date(2024, 11, 31);
    const formattedDate = getDateWithoutTime(date);

    expect(formattedDate).toBe('31.12.2024');
  });
});
