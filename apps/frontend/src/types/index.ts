export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RENTING = 'RENTING',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address?: string;
  role: Role;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  costumeCount?: number;
}

export interface CostumeImage {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface CostumeVariant {
  id: string;
  costumeId: string;
  size: string;
  sku: string;
  totalQuantity: number;
  outOfServiceQuantity: number;
}

export interface Costume {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  characterName?: string;
  seriesName?: string;
  description: string;
  dailyPrice: number;
  depositAmount: number;
  isActive: boolean;
  primaryImage?: string;
  availableSizes?: string[];
  images?: CostumeImage[];
  variants?: CostumeVariant[];
  createdAt?: string;
}

export interface CalculatedQuoteItem {
  costumeVariantId: string;
  costumeId: string;
  costumeName: string;
  size: string;
  dailyPrice: number;
  depositAmount: number;
  quantity: number;
  lineRentalFee: number;
  lineDeposit: number;
}

export interface CalculatedQuote {
  startDate: string;
  endDate: string;
  rentalDays: number;
  items: CalculatedQuoteItem[];
  totalRentalFee: number;
  totalDeposit: number;
  totalDueAtStore: number;
}

export interface AvailabilityResult {
  variantId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalQuantity: number;
  outOfServiceQuantity: number;
  baseStock: number;
  availableQuantity: number;
  isAvailable: boolean;
}

export interface RentalOrderItem {
  id: string;
  rentalOrderId: string;
  costumeVariantId: string;
  costumeVariant?: CostumeVariant & { costume?: Costume };
  costumeNameSnapshot: string;
  sizeSnapshot: string;
  dailyPriceSnapshot: number;
  depositSnapshot: number;
  quantity: number;
  lineRentalFee: number;
  lineDeposit: number;
}

export interface RentalStatusHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedById: string;
  changedByName: string;
  note?: string;
  createdAt: string;
}

export interface RentalOrder {
  id: string;
  orderCode: string;
  userId: string;
  user?: User;
  customerName: string;
  customerPhone: string;
  note?: string;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalRentalFee: number;
  totalDeposit: number;
  actualDepositReturned: number;
  deliveredAt?: string;
  returnedAt?: string;
  createdAt: string;
  items: RentalOrderItem[];
  statusHistories?: RentalStatusHistory[];
}

