import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Orders } from '../../../services/orders';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export interface CartItem {
  ticketTypeId: number;
  ticketTypeName: string;
  quantity: number;
  price: number;
}

export interface Reservation {
  id: string;
  ticketIds: number[];
  totalAmount: number;
  expiresAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  ticketIds: number[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface PurchasedTicket {
  id: string;
  ticketTypeName: string;
  price: number;
  qrCode: string;
}

export interface CompletedOrder {
  orderId: string;
  tickets: PurchasedTicket[];
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  processingFee: number;
  total: number;
  purchaseDate: string;
  eventId?: string | number;
  eventName?: string;
}

const CART_STORAGE_KEY = 'ticketing_cart';
const COMPLETED_ORDER_KEY = 'ticketing_completed_order';
const PURCHASED_TICKETS_KEY = 'ticketing_purchased_tickets';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly ordersService = inject(Orders);
  private readonly authService = inject(AuthService);

  // Signals
  private readonly _cart = signal<CartItem[]>(this.loadCart());
  private readonly _reservation = signal<Reservation | null>(null);
  private readonly _timeRemaining = signal<number>(0); // seconds
  private readonly _isLoading = signal(false);
  private readonly _completedOrder = signal<CompletedOrder | null>(this.loadCompletedOrder());
  private readonly _eventId = signal<string | number | undefined>(undefined);
  private readonly _eventName = signal<string | undefined>(undefined);

  // Public read-only signals
  readonly cart = this._cart.asReadonly();
  readonly reservation = this._reservation.asReadonly();
  readonly timeRemaining = this._timeRemaining.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly completedOrder = this._completedOrder.asReadonly();

  // Computed signals
  readonly subtotal = computed(() => {
    return this._cart().reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  // Service fee (5%) to align with mock UI
  readonly tax = computed(() => {
    return Math.round(this.subtotal() * 0.05 * 100) / 100; // 5% service fee
  });

  // Fixed processing fee ($5)
  readonly processingFee = computed(() => 5);

  readonly total = computed(() => {
    return Math.round((this.subtotal() + this.tax() + this.processingFee()) * 100) / 100;
  });

  readonly cartItemCount = computed(() => {
    return this._cart().reduce((count, item) => count + item.quantity, 0);
  });

  constructor() {
    // Save cart to localStorage whenever it changes
    effect(() => {
      this.saveCart(this._cart());
    });
  }

  setEventInfo(eventId: string | number | undefined, eventName: string | undefined): void {
    this._eventId.set(eventId);
    this._eventName.set(eventName);
  }

  addToCart(ticketTypeId: number, ticketTypeName: string, quantity: number, price: number): void {
    const cart = this._cart();
    const existingItem = cart.find(item => item.ticketTypeId === ticketTypeId);

    if (existingItem) {
      // Create a new array reference to trigger signal update
      const updatedCart = cart.map(item =>
        item.ticketTypeId === ticketTypeId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      this._cart.set(updatedCart);
    } else {
      this._cart.set([...cart, { ticketTypeId, ticketTypeName, quantity, price }]);
    }
  }

  removeFromCart(ticketTypeId: number): void {
    this._cart.set(this._cart().filter(item => item.ticketTypeId !== ticketTypeId));
  }

  updateQuantity(ticketTypeId: number, quantity: number): void {
    const cart = this._cart();
    const updatedCart = cart.map(item => {
      if (item.ticketTypeId === ticketTypeId && quantity > 0) {
        return { ...item, quantity: quantity };
      }
      return item;
    });
    this._cart.set(updatedCart);
  }

  clearCart(): void {
    this._cart.set([]);
    this._reservation.set(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  setReservation(reservation: Reservation): void {
    this._reservation.set(reservation);
    this.startReservationTimer();
  }

  private startReservationTimer(): void {
    if (!this._reservation()) return;

    const expiresAt = new Date(this._reservation()!.expiresAt).getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      this._timeRemaining.set(remaining);

      if (remaining > 0) {
        setTimeout(updateTimer, 1000);
      } else {
        this.clearCart();
      }
    };
    updateTimer();
  }

  confirmOrder(paymentMethodId: string, buyerEmail?: string, paymentInfo?: { cardNumber: string; expiryDate: string; cvv: string }): void {
    this._isLoading.set(true);

    const cart = this._cart();
    const eventId = this._eventId();
    // Use authenticated user email if available, otherwise use provided email
    const email = this.authService.currentUser()?.email || buyerEmail;

    console.log('=== CONFIRMACIÓN DE ORDEN ===');
    console.log('EventId:', eventId);
    console.log('Email:', email);
    console.log('Carrito:', cart);
    console.log('PaymentInfo:', paymentInfo);

    // Try to call backend for each ticket type in the cart
    if (eventId && email && paymentInfo) {
      console.log('✅ Condición cumplida: yendo al backend');
      this.purchaseFromBackend(cart, String(eventId), email, paymentInfo);
    } else {
      // Fallback to local-only processing if no backend info provided
      console.warn('❌ Falta data para backend purchase:');
      console.warn('  - eventId:', !!eventId);
      console.warn('  - email:', !!email);
      console.warn('  - paymentInfo:', !!paymentInfo);
      this.processLocalOrder();
    }
  }

  private purchaseFromBackend(
    cart: CartItem[],
    eventId: string,
    buyerEmail: string,
    paymentInfo: { cardNumber: string; expiryDate: string; cvv: string }
  ): void {
    // Call backend for each ticket type
    const purchasePromises = cart.map(item => {
      // Match the backend DTO: eventId (UUID), ticketType (enum), quantity, buyerEmail, paymentInfo
      const purchaseDto = {
        eventId,
        ticketType: this.mapTicketTypeName(item.ticketTypeName),
        quantity: item.quantity,
        buyerEmail,
        paymentInfo: {
          cardNumber: paymentInfo.cardNumber,
          expiryDate: paymentInfo.expiryDate,
          cvv: paymentInfo.cvv
        }
      };

      console.log('📤 Enviando POST /tickets/purchase:', purchaseDto);
      return this.http.post<any>(`${environment.apiUrl}/tickets/purchase`, purchaseDto).toPromise();
    });

    Promise.all(purchasePromises)
      .then(results => {
        console.log('✅ Respuesta del backend:', results);
        // Combine all tickets from backend responses
        const allTickets: PurchasedTicket[] = [];
        results.forEach((tickets: any[]) => {
          if (Array.isArray(tickets)) {
            tickets.forEach(t => {
              allTickets.push({
                id: t.id || t.code,
                ticketTypeName: t.type || t.ticketType,
                price: t.price,
                qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${t.qrToken || t.id}`
              });
            });
          }
        });

        this.finalizeOrder(allTickets);
      })
      .catch(error => {
        console.error('Backend purchase failed, falling back to local:', error);
        // Fallback to local processing
        this.processLocalOrder();
      });
  }

  private processLocalOrder(): void {
    // Generate unique order ID
    const orderId = 'ORD-' + Date.now();

    // Generate individual tickets with unique QR codes
    const tickets: PurchasedTicket[] = [];
    const cart = this._cart();

    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        const ticketId = `TKT-${Date.now()}-${item.ticketTypeId}-${i}`;
        tickets.push({
          id: ticketId,
          ticketTypeName: item.ticketTypeName,
          price: item.price,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`
        });
      }
    });

    this.finalizeOrder(tickets);
  }

  private finalizeOrder(tickets: PurchasedTicket[]): void {
    const cart = this._cart();
    const orderId = 'ORD-' + Date.now();

    // Create completed order
    const completedOrder: CompletedOrder = {
      orderId,
      tickets,
      cartItems: [...cart],
      subtotal: this.subtotal(),
      tax: this.tax(),
      processingFee: this.processingFee(),
      total: this.total(),
      purchaseDate: new Date().toISOString(),
      eventId: this._eventId(),
      eventName: this._eventName()
    };

    // Save completed order
    this._completedOrder.set(completedOrder);
    localStorage.setItem(COMPLETED_ORDER_KEY, JSON.stringify(completedOrder));

    // Also save to purchased tickets history
    this.saveToPurchasedTickets(completedOrder);

    // Clear the cart after saving
    setTimeout(() => {
      this._isLoading.set(false);
      this.clearCart();
    }, 1000);
  }

  private saveToPurchasedTickets(order: CompletedOrder): void {
    const existingTickets = localStorage.getItem(PURCHASED_TICKETS_KEY);
    const allTickets: CompletedOrder[] = existingTickets ? JSON.parse(existingTickets) : [];
    allTickets.push(order);
    localStorage.setItem(PURCHASED_TICKETS_KEY, JSON.stringify(allTickets));
  }

  getPurchasedTicketsHistory(): CompletedOrder[] {
    const tickets = localStorage.getItem(PURCHASED_TICKETS_KEY);
    return tickets ? JSON.parse(tickets) : [];
  }

  clearCompletedOrder(): void {
    this._completedOrder.set(null);
    localStorage.removeItem(COMPLETED_ORDER_KEY);
  }

  private loadCart(): CartItem[] {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  }

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  private loadCompletedOrder(): CompletedOrder | null {
    const saved = localStorage.getItem(COMPLETED_ORDER_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Maps ticket type name to the enum format expected by the backend
   * Frontend might use different naming (e.g., "VIP", "General") than the enum
   */
  private mapTicketTypeName(typeName: string): string {
    const normalized = typeName.toUpperCase().trim();
    // Backend expects: VIP, GENERAL, EARLY_BIRD
    if (normalized.includes('VIP')) return 'VIP';
    if (normalized.includes('EARLY')) return 'EARLY_BIRD';
    if (normalized.includes('GENERAL')) return 'GENERAL';
    // Default fallback
    return normalized;
  }
}
