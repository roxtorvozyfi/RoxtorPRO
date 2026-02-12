
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  wholesalePrice?: number;
  fabricType: string;
  deliveryTime: string;
  wholesaleDiscount: string;
  techniques: string;
  imageUrl?: string;
  cloudImageUrl?: string;
  inventory: number; 
}

export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  whatsappId: string;
  lastOrderNumber: number; 
  headerTitle: string;    
}

export interface Designer {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  assignedStoreId: string;
  role: 'diseñador' | 'agente' | 'costura' | 'taller' | 'otro';
}

export type PaymentMethod = 'Dólares Efectivo' | 'Pago Móvil' | 'Transferencia' | 'Punto de Venta' | 'Efectivo BS';

export interface PaymentRecord {
  id: string;
  amountUSD: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
}

export interface AssignmentLog {
  agentId: string;
  agentName: string;
  assignedAt: string;
  role: string;
}

/**
 * Interface representing a potential customer lead detected by the AI radar
 */
export interface ActiveLead {
  id: string;
  clientName: string;
  status: 'hot' | 'warm' | 'cold';
  summary: string;
  suggestedAction: string;
  totalQuoteUSD: number;
  detectedProducts: {
    name: string;
    quantity: number;
    price: number;
  }[];
  lastMessage: string;
  lastUpdate: string;
  accountSource: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientDoc: string; 
  clientPhone: string;
  clientAddress: string;
  deliveryDate?: string;
  jobDescription?: string;
  referenceImages?: string[];
  items: { 
    productId?: string; 
    quantity: number; 
    price: number; 
    name: string;
    customDetails?: string; 
  }[];
  totalUSD: number;
  totalVES: number;
  payments: PaymentRecord[];
  paidAmountUSD: number; 
  remainingAmountUSD: number; 
  exchangeRateUsed: number;
  status: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
  agentId: string;
  assignedToId?: string; 
  assignmentHistory?: AssignmentLog[];
  storeId: string;
  createdAt: string;
  completedAt?: string;
}

export interface AppSettings {
  companyName: string;
  companyRif: string;
  companyLogoUrl?: string;
  companyAddress: string;
  companyPhone: string;
  companyInstagram: string;
  stores: StoreInfo[];
  designers: Designer[];
  agents: any[];
  currentBcvRate: number;
  lastRateUpdate: string;
  accessPin: string; // PIN para entrar a la app
  masterPin: string; // PIN para funciones de gerencia
  aiTone: 'profesional' | 'casual' | 'persuasivo' | 'amigable';
}
