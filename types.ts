
export type OrderStatus = 'pendiente' | 'diseño' | 'impresión' | 'taller' | 'bordado' | 'sublimación' | 'completado';

export type TaskStatus = 'esperando' | 'proceso' | 'terminado' | 'confeccion';

export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir'
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  storeId: string;
  specialty?: string;
  phone?: string;
}

export interface Workshop {
  id: string;
  name: string;
  department: 'COSTURA' | 'DTF' | 'GIGANTOGRAFIA' | 'TALONARIOS' | 'OTRO';
  customDepartment?: string;
  phone: string;
  storeId: string;
}

export interface OrderHistory {
  timestamp: number;
  agentId: string;
  action: string;
  status: OrderStatus;
}

export interface ServiceOrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceUsd: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName: string;
  customerCi: string;
  customerPhone: string;
  items: ServiceOrderItem[];
  totalUsd: number;
  totalBs: number;
  abonoUsd: number;
  restanteUsd: number;
  status: OrderStatus;
  taskStatus: TaskStatus;
  history: OrderHistory[];
  bcvRate: number;
  issueDate: string;
  deliveryDate: string;
  technicalDetails: string;
  referenceImages: string[];
  assignedAgentId?: string;
  assignedWorkshopId?: string;
  paymentMethod: 'DOLARES $' | 'PAGO MOVIL' | 'TRANSFERENCIA' | 'EFECTIVO' | 'PUNTO DE VENTA' | 'BIOPAGO';
  paymentReference?: string;
  isDirectSale?: boolean;
  isDelivered?: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  priceRetail: number;
  priceWholesale: number;
  material: string;
  description: string;
  additionalConsiderations?: string;
  imageUrl?: string;
  stock: number;
  category: 'producto' | 'servicio';
}

export interface StoreConfig {
  id: string;
  name: string;
  location: string;
  prefix: string;
  nextOrderNumber: number;
  nextDirectSaleNumber: number;
}

export interface AppSettings {
  masterPin: string;
  loginPin: string;
  businessName: string;
  slogan: string;
  instagram: string;
  companyPhone?: string; // Nuevo: Teléfono oficial de la empresa
  preferredTone: 'profesional' | 'casual' | 'entusiasta' | 'cercano';
  bcvRate: number;
  logoUrl?: string;
  stores: StoreConfig[];
  encryptionKey: string;
  cloudSync?: {
    enabled: boolean;
    provider: 'supabase' | 'firebase';
    apiUrl: string;
    apiKey: string;
  };
  pagoMovil?: {
    bank: string;
    idNumber: string;
    phone: string;
  };
}
