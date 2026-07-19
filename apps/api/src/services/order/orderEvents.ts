import { EventEmitter } from 'node:events';

export interface OrderEventPayload {
  id: string;
  status: string;
  paymentStatus: string;
  paymentType: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  source: string;
  createdAt: Date;
}

class OrderEventBus extends EventEmitter {
  announceNew(order: OrderEventPayload): void {
    this.emit('new', order);
  }

  announceUpdate(order: OrderEventPayload): void {
    this.emit('update', order);
  }
}

export const orderEvents = new OrderEventBus();
orderEvents.setMaxListeners(50);
