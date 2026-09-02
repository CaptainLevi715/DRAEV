export interface Product {
  id: string;
  name: string;
  colorway: string;
  img: string;
  imgBack?: string;
  price: number;
  oldPrice: number;
  badge: string;
  sold: boolean;
  desc: string;
  modelUrl?: string;
}

export interface CartItem {
  id: string;
  size: string;
  qty: number;
}

export type PayMethod = "cod";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItemLine {
  productId: string;
  name: string;
  colorway: string;
  size: string;
  qty: number;
  lineTotal: number;
}

export interface Order {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  payMethod: PayMethod;
  items: OrderItemLine[];
  subtotal: number;
  status: OrderStatus;
  createdAt: string;
}
