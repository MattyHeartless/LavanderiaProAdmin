export interface OrderShippingAddress {
  title: string;
  street: string;
  neighbourhood: string;
  city: string;
  state: string;
  zipCode: string;
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

export interface OrderRecord {
  order: OrderEntity;
  orderDetails: OrderDetail[];
}

export interface ListOrdersResponse {
  message: string;
  data: OrderRecord[];
}
