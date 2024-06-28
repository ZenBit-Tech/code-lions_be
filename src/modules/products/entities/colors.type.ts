export const colors = {
  black: 1,
  blue: 2,
  brown: 3,
  green: 4,
  grey: 5,
  orange: 6,
  pink: 7,
  purple: 8,
  red: 9,
  white: 10,
  yellow: 11,
} as const;

export type Colors = (typeof colors)[keyof typeof colors];
