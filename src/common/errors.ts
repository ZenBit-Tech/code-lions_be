import { MIN_PASSWORD_LENGTH } from 'src/config';

export const Errors = {
  FAILED_TO_CREATE_USER: 'Failed to create a user',
  FAILED_TO_DELETE_USER: 'Failed to delete a user',
  FAILED_TO_FETCH_USER_BY_EMAIL: 'Failed to fetch the user by email',
  FAILED_TO_FETCH_USERS: 'Failed to fetch users',
  FAILED_TO_HASH: 'Failed to hash the password',
  FAILED_TO_SEND_VERIFICATION_EMAIL: 'Failed to send verification email',
  FAILED_TO_SAVE_VERIFICATION_CODE: 'Failed to save verification code',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INVALID_EMAIL: 'Invalid email',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_TOKEN: 'Your access token is invalid',
  MISSING_CREDENTIALS: 'Missing credentials',
  NAME_IS_STRING: 'Name must be a string',
  PASSWORD_IS_STRING: 'Password must be a string',
  PASSWORD_LENGTH: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
  ROUTE_IS_FORBIDDEN: 'This route is forbidden for unauthorized users',
  USER_DOES_NOT_EXIST: 'User with this email does not exist',
  USER_EXISTS: 'User with this email already exists',
  USERS_NAME_CANNOT_BE_EMPTY: "User's name cannot be empty",
  USER_NOT_FOUND: 'User not found',
};
