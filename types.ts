
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
}

export interface Agent {
  id: string;
  name: string;
  responsibleName: string;
  privatePhone: string;
  salesCount: number;
  totalVolume: number;
  efficiency: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientDoc: string; 
  clientPhone: string;
  clientAddress: string;
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
}

export interface ActiveLead {
  id: string;
  clientName: string;
  lastMessage: string;
  status: 'cold' | 'warm' | 'hot';
  summary: string;
  suggestedAction: string;
  detectedProducts: { name: string; quantity: number; price: number }[];
  totalQuoteUSD: number;
  lastUpdate: string;
  accountSource: string;
}

export interface WorkshopGroup {
  id: string;
  name: string;
  description?: string;
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
}
