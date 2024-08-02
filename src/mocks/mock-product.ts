import { Category } from 'src/modules/products/entities/category.enum';
import { Materials } from 'src/modules/products/entities/materials.enum';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Styles } from 'src/modules/products/entities/styles.enum';
import { Role } from 'src/modules/roles/role.enum';
import { User } from 'src/modules/users/user.entity';

const mockUser: User = {
  id: '7c9f72b9-e94b-4b6e-8a84-78dc5d2f76b4',
  name: 'Jane Smith',
  photoUrl: '',
  email: '',
  password: '',
  isEmailVerified: false,
  otp: '',
  otpExpiration: undefined,
  role: Role.BUYER,
  googleId: '',
  isAccountActive: false,
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  state: '',
  city: '',
  clothesSize: '',
  jeansSize: '',
  shoesSize: '',
  cardNumber: '',
  expireDate: '',
  cvvCode: '',
  willHideRentalRules: false,
  createdAt: undefined,
  lastUpdatedAt: undefined,
  deletedAt: undefined,
  deactivationTimestamp: null,
  reactivationTimestamp: null,
  onboardingStep: 0,
  rating: 0,
  orders: 0,
  updateDatesBeforeInsert: function (): void {
    throw new Error('Function not implemented.');
  },
  updateDatesBeforeUpdate: function (): void {
    throw new Error('Function not implemented.');
  },
  isOnline: false,
  lastActiveAt: undefined,
  products: [],
  cart: [],
  wishlist: [],
  chatRooms: [],
  messages: [],
  followers: [],
  following: [],
  productsOrder: [],
  buyerOrders: [],
  readMessages: [],
};

export const mockProduct: Product = {
  id: '9224f77b-026b-48f5-93d0-b406288737e4',
  name: 'Diesel Black Dress 00SYWZ0KASX',
  isProductCreationFinished: true,
  slug: 'diesel-black-dress-00sywz0kasx',
  price: 216,
  description:
    'Elegant black dress by Diesel, a versatile and fashionable choice for any occasion.',
  vendorId: '7c9f72b9-e94b-4b6e-8a84-78dc5d2f76b4',
  categories: [Category.CLOTHING],
  style: Styles.CASUAL,
  type: ProductTypes.DRESS,
  size: 'S',
  brand: {
    id: 1,
    brand: 'Diesel',
    products: [],
  },
  material: Materials.COTTON,
  pdfUrl: 'http:/example.com/diesel.pdf',
  status: Status.PUBLISHED,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
  deletedAt: new Date(),
  isAvailable: true,
  images: [],
  user: mockUser,
  color: [],
  cart: [],
  wishlistEntries: [],
  orders: [],
};
