export interface OrderShippingAddress {
  title: string;
  street: string;
  neighbourhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface DeliveryMode {
  id: number;
  code: string;
  name: string;
  etaHours: number;
  surchargeAmount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface OrderEntity {
  id: string;
  userId: string;
  userAddressId: number;
  shippingAddress: OrderShippingAddress;
  userPaymentMethodId: number;
  pickupDate: string;
  pickupTime: string;
  isPostPayment: boolean;
  postPaymentMethod: string;
  status: number;
  totalAmount: number;
  deliveryFee: number;
  deliveryModeId?: number | null;
  deliveryModeCode?: string | null;
  deliveryModeName?: string | null;
  deliveryEtaHours?: number | null;
  deliveryModeSurcharge?: number | null;
  courierName: string;
  courierPhone: string;
  courierGuid: string | null;
  createdAt: string;
  recollectedAt: string | null;
  deliveredAt: string | null;
}

export interface OrderDetail {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  servicePrice: number;
  uoM: string;
  subTotal: number;
}

export interface OrderEvidence {
  id: string;
  orderId: string;
  orderStatusEvidence: number;
  courierId: string | null;
  fileUrl: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  createdAt: string;
}

export interface OrderRecord {
  order: OrderEntity;
  orderDetails: OrderDetail[];
}

export interface ListOrdersResponse {
  message: string;
  data: OrderRecord[];
}
