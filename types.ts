
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
  role: 'agente' | 'diseñador' | 'costura' | 'gerencia' | 'otro';
}

export interface Agent {
  id: string;
  name: string;
  responsibleName: string;
  privatePhone: string;
  salesCount: number;
  totalVolume: number;
  efficiency: number;
  assignedStoreId?: string;
  role: 'agente' | 'diseñador' | 'costura' | 'gerencia' | 'otro';
}

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
  paidAmountUSD: number; 
  remainingAmountUSD: number; 
  exchangeRateUsed: number;
  paymentMethod: 'Dólares Efectivo' | 'Pago Móvil' | 'Transferencia' | 'Punto de Venta' | 'Efectivo BS';
  bankReference?: string;
  status: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
  agentId: string;
  assignedToId?: string; 
  storeId: string;
  createdAt: string;
  completedAt?: string;
}

export interface WorkshopGroup {
  id: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  details: string;
}

export interface AppSettings {
  companyName: string;
  companyRif: string;
  companyLogoUrl?: string;
  stores: StoreInfo[];
  designers: Designer[];
  agents: Agent[];
  currentBcvRate: number;
  lastRateUpdate: string;
  masterPin: string;
  aiTone: 'profesional' | 'casual' | 'persuasivo' | 'amigable';
}
