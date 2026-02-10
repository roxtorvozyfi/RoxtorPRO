
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  wholesalePrice?: number;
  fabricType: string;
  deliveryTime: string;
  wholesaleDiscount: string;
  sizePriceAdjustment?: string;
  imageUrl?: string;
}

export interface WorkshopGroup {
  id: string;
  name: string;
  specialty: string;
  dailyCapacity: number;
  contactName?: string;
  contactPhone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  items: { productId: string; quantity: number; price: number; name: string }[];
  total: number;
  paidAmount: number;
  paymentMethod: string;
  status: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
  workshopGroupId: string;
  createdAt: string;
  deliveryDate: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  details: string;
}

export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir'
}

export type AssistantTone = 'cercano' | 'profesional';

export interface SecurityStatus {
  lastBackup: string | null;
  isAutoLockEnabled: boolean;
}

export interface AppSettings {
  companyName: string;
  companyRif: string;
  companyPhone: string;
  companyAddress: string;
  absenceMessage: string;
  companyLogo?: string;
}
