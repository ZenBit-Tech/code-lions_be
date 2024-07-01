import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  VERIFICATION_CODE_LENGTH,
} from 'src/config';

export const Errors = {
  CODE_LENGTH: `Otp must be exactly ${VERIFICATION_CODE_LENGTH} characters long`,
  DIGITS_ONLY: 'Otp must contain only digits',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  FAILED_TO_CHANGE_PASSWORD: 'Failed to change password',
  FAILED_TO_CONFIRM_USER: 'Failed to confirm a user',
  FAILED_TO_CREATE_USER: 'Failed to create a user',
  FAILED_TO_DELETE_USER: 'Failed to delete a user',
  FAILED_TO_FETCH_USER_BY_EMAIL: 'Failed to fetch the user by email',
  FAILED_TO_FETCH_USER_BY_ID: 'Failed to fetch the user by id',
  FAILED_TO_FETCH_USERS: 'Failed to fetch users',
  FAILED_TO_FETCH_PRODUCTS: 'Failed to fetch products',
  FAILED_TO_HASH: 'Failed to hash the password',
  FAILED_TO_SEND_FORGET_PASSWORD_EMAIL: 'Failed to send forgot password email',
  FAILED_TO_SEND_VERIFICATION_EMAIL: 'Failed to send verification email',
  FAILED_TO_SAVE_VERIFICATION_CODE: 'Failed to save verification code',
  FAILED_TO_SEND_EMAIL_TO_DELETED_USER:
    'Failed to send email to the user deleted by admin',
  FAILED_TO_SEND_EMAIL_TO_SUSPENDED_USER:
    'Failed to send email to the user suspended by admin',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_EMAIL: 'Invalid email',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INVALID_TOKEN:
    'You are not authorized to access this resource, valid token is required',
  INVALID_USER_ID: 'Invalid user id',
  MISSING_CREDENTIALS: 'Missing credentials',
  NAME_IS_STRING: 'Name must be a string',
  PASSWORD_IS_STRING: 'Password must be a string',
  PASSWORD_LENGTH: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
  NAME_MAX_LENGTH: `Name must not exceed ${MAX_NAME_LENGTH} characters`,
  EMAIL_MAX_LENGTH: `Email must not exceed ${MAX_EMAIL_LENGTH} characters`,
  REFRESH_TOKEN_SHOULD_BE_JWT:
    'Refresh token should be a string with valid jwt token',
  ROUTE_IS_FORBIDDEN: 'This route is forbidden for unauthorized users',
  USER_DOES_NOT_EXIST: 'User with this email does not exist',
  USER_BY_ID_DOES_NOT_EXIST: 'User with this id does not exist',
  USER_EXISTS: 'User with this email already exists',
  USERS_NAME_CANNOT_BE_EMPTY: "User's name cannot be empty",
  EMAIL_CANNOT_BE_EMPTY: 'Email cannot be empty',
  USER_NOT_FOUND: 'User not found',
  USER_NOT_VERIFIED: 'User not verified email yet',
  WRONG_CODE: 'Wrong or expired OTP code',
  ACCOUNT_DELETED_BY_ADMIN: 'Your account was deleted by admin',
  ACCOUNT_SUSPENDED_BY_ADMIN: 'Your account was suspended by admin',
  FAILED_TO_CREATE_USER_VIA_GOOGLE: 'Failed to create user via google',
  INVALID_GOOGLE_TOKEN: 'Invalid Google token payload',
  INVALID_GOOGLE_ID: 'Invalid google id',
  USER_UNAUTHORIZED: 'User is unauthorized',
  FAILED_TO_UPDATE_ROLE: 'Failed to update user role',
  INCORRECT_ROLE: 'There is no such role',
  FAILED_TO_UPDATE_PHONE_NUMBER: 'Failed to update user phone number',
  INCORRECT_PHONE: 'Phone number must be in E.164 format',
  FAILED_TO_UPDATE_PHOTO_URL: 'Incorrect photo',
  FAILED_TO_CHANGE_PHOTO: 'Failed to change photo',
  PHONE_IS_STRING: 'Phone number must be a string',
  PHONE_CANNOT_BE_EMPTY: "User's phone number cannot be empty",
  ADDRESS_IS_STRING: 'Address must be a string',
  ADDRESS_CANNOT_BE_EMPTY: 'Address cannot be empty',
  FAILED_TO_UPDATE_ADDRESS_LINE: 'Failed to update user address line',
  INCORRECT_ADDRESS_LINE1: 'Address line 1 contains invalid characters',
  INCORRECT_ADDRESS_LINE2: 'Address line 2 contains invalid characters',
  FAILED_TO_UPDATE_ADDRESS_LINE1: 'Failed to change address line 1',
  FAILED_TO_UPDATE_ADDRESS_LINE2: 'Failed to change address line 2',
  TOO_LONG_ADDRESS_LINE1: 'Address line 1 is too long',
  TOO_LONG_ADDRESS_LINE2: 'Address line 2 is too long',
  NO_STATES_FOUND: 'States not found',
  NO_CITIES_FOUND: 'Cities not found',
  FAILED_TO_FETCH_CITIES: 'Failed to fetch cities',
  FAILED_TO_FETCH_ADMIN_CODE: 'Failed to fetch admin code for state',
  FAILED_TO_FETCH_STATES_CANADA: 'Failed to fetch states in Canada',
  INCORRECT_ADDRESS: "The user's address is incorrect",
  FAILED_TO_UPDATE_ADDRESS: 'Failed to set user`s address',
  USERS_STATE_CANNOT_BE_EMPTY: 'State cannot be empty',
  USERS_STATE_IS_STRING: 'State must be a string',
  USERS_CITY_CANNOT_BE_EMPTY: 'City cannot be empty',
  USERS_CITY_IS_STRING: 'City must be a string',
  USERS_COUNTRY_CANNOT_BE_EMPTY: 'Country cannot be empty',
  USERS_COUNTRY_IS_STRING: 'Country must be a string',
  ACCESS_DENIED: 'You can only make changes to your own profile',
  ADMIN_NOT_FOUND: 'Admin user not found',
  FAILED_TO_UPDATE_PROFILE: 'Failed to update user profile',
  CLOTHES_SIZE_CANNOT_BE_EMPTY: 'Clothes size cannot be empty',
  CLOTHES_SIZE_IS_STRING: 'Clothes size must be a string',
  JEANS_SIZE_CANNOT_BE_EMPTY: 'Jeans size cannot be empty',
  JEANS_SIZE_IS_STRING: 'Jeans size must be a string',
  SHOES_SIZE_CANNOT_BE_EMPTY: 'Shoes size cannot be empty',
  SHOES_SIZE_IS_STRING: 'Shoes size must be a string',
  CARD_NUMBER_CANNOT_BE_EMPTY: 'Card number cannot be empty',
  CARD_NUMBER_IS_STRING: 'Card number must be a string',
  EXPIRE_DATE_CANNOT_BE_EMPTY: 'Expire date cannot be empty',
  EXPIRE_DATE_IS_STRING: 'Expire date must be a string',
  CVV_CODE_CANNOT_BE_EMPTY: 'CVV code cannot be empty',
  CVV_CODE_IS_STRING: 'CVV code must be a string',
  FAILED_TO_FETCH_CARD_DATA: 'Failed to fetch card data of the user',
  FAILED_TO_UPDATE_SIZE: 'Failed to set user`s size information',
  FAILED_TO_UPDATE_CARD: 'Failed to set user`s credit card information',
  INCORRECT_SIZE: "The user's size information is incorrect",
  INCORRECT_CREDIT_CARD: "The user's credit card information is incorrect",
  COUNTRY_CANNOT_BE_EMPTY: 'Country cannot be empty',
  COUNTRY_IS_STRING: 'Country must be a string',
  ONLY_JPG_JPEG_PNG_HEIC: 'Only jpg, jpeg, png, heic files are allowed',
  REVIEW_TEXT_NOT_STRING: 'Review text must be a string',
  REVIEW_TEXT_NOT_EMPTY: 'Review text must not be empty',
  RATING_MUST_BE_AN_INT: 'Rating must be an integer',
  RATING_MIN: 'Rating must be at least 1',
  RATING_MAX: 'Rating must not exceed 5',
  USER_ID_NOT_STRING: 'User ID must be a string',
  USER_ID_NOT_EMPTY: 'User ID must not be empty',
  REVIEWER_ID_NOT_STRING: 'Reviewer ID must be a string',
  REVIEWER_ID_NOT_EMPTY: 'Reviewer ID must not be empty',
  FAILED_TO_CREATE_REVIEW: 'Failed to create review',
  FAILED_TO_FETCH_REVIEWS: 'Failed to fetch reviews',
  FAILED_TO_FETCH_REVIEWS_BY_USER_ID: 'Failed to fetch reviews by user ID',
  FAILED_TO_UPDATE_USER_RATING: 'Failed to update user rating',
  FAILED_TO_DELETE_REVIEW: 'Failed to delete review',
  CONFLICT_REVIEW_SAME_ROLE: (role: string): string =>
    `You cannot review the other ${role}s`,
  CONFLICT_REVIEW_EXAMPLE: 'You cannot review the other user role',
  FAILED_TO_ADD_ORDER: 'Failed to add an order',
  REVIEW_ON_BEHALF_OF_OTHER_USER: 'You cannot review on behalf of another user',
  REVIEW_YOURSELF: 'You cannot review yourself',
  PRODUCT_NOT_FOUND: 'Product not found',
  USER_OR_PRODUCT_NOT_FOUND: 'User or Product not found',
  PRODUCT_ALREADY_IN_WISHLIST: 'Product already exists in the wishlist',
  WISHLIST_ENTRY_NOT_FOUND: 'Wishlist entry not found',
  WISHLIST_NOT_FOUND: 'Wishlist not found',
  FAILED_TO_ADD_PRODUCT_TO_WISHLIST: 'Failed to add product to wishlist',
  FAILED_TO_REMOVE_PRODUCT_FROM_WISHLIST:
    'Failed to remove product from wishlist',
  FAILED_TO_RETRIEVE_WISHLIST: 'Failed to retrieve wishlist',
};
