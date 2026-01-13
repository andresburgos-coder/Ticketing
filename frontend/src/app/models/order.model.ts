export interface Order {
  id: number;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  tickets?: any[];
}

export interface CreateOrderDto {
  ticketIds: number[];
  userId: string;
}
