import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Orders } from '../../../services/orders';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { CacheInvalidationService } from '../../../core/services/cache-invalidation.service';

export interface CartItem {
  ticketTypeId: number;
  ticketTypeName: string;
  quantity: number;
  price: number;
}

// HUMAN REVIEW: se agrgar campos necesarios para logica de reserva
export interface Reservation {
  id: string;
  eventId: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
  expiresAt: Date;
  status: string;
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
const PENDING_CHECKOUT_KEY = 'ticketing_pending_checkout';
const RESERVATIONS_KEY = 'ticketing_reservations';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly ordersService = inject(Orders);
  private readonly authService = inject(AuthService);
  private readonly cacheInvalidationService = inject(CacheInvalidationService);

  // Signals
  private readonly _cart = signal<CartItem[]>(this.loadCart());
  private readonly _reservation = signal<Reservation | null>(null);
  private readonly _timeRemaining = signal<number>(0); // seconds
  private readonly _isLoading = signal(false);
  private readonly _completedOrder = signal<CompletedOrder | null>(null);
  private readonly _eventId = signal<string | number | undefined>(undefined);
  private readonly _eventName = signal<string | undefined>(undefined);
  private readonly _reservationExpired = signal<boolean>(false);

  // Timer interval reference
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // Public read-only signals
  readonly cart = this._cart.asReadonly();
  readonly reservation = this._reservation.asReadonly();
  readonly timeRemaining = this._timeRemaining.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly completedOrder = this._completedOrder.asReadonly();
  readonly reservationExpired = this._reservationExpired.asReadonly();

  // Computed signals
  readonly subtotal = computed(() => {
    return this._cart().reduce((total, item) => total + item.price * item.quantity, 0);
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

  /**
   * Save intended checkout payload before authentication.
   */
  savePendingCheckout(items: CartItem[], eventId?: string | number, eventName?: string): void {
    const payload = { items, eventId, eventName };
    localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
  }

  hasPendingCheckout(): boolean {
    return !!localStorage.getItem(PENDING_CHECKOUT_KEY);
  }

  /**
   * If there is a pending checkout, load it into the cart and set event info.
   * Returns true if resumed, false otherwise.
   */
  resumePendingCheckout(): boolean {
    const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return false;
    try {
      const payload: { items: CartItem[]; eventId?: string | number; eventName?: string } =
        JSON.parse(raw);

      // Clear current cart and load pending items
      this.clearCart();
      (payload.items || []).forEach((item) => {
        if (item && item.quantity > 0) {
          this.addToCart(item.ticketTypeId, item.ticketTypeName, item.quantity, item.price);
        }
      });

      // Set event info
      this.setEventInfo(payload.eventId, payload.eventName);

      // Remove pending flag
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
      return true;
    } catch (e) {
      // Invalidate corrupted payload
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
      return false;
    }
  }

  setEventInfo(eventId: string | number | undefined, eventName: string | undefined): void {
    this._eventId.set(eventId);
    this._eventName.set(eventName);
  }

  /**
   * Creates reservations for all items in the cart.
   * This should be called when the user starts checkout (is authenticated).
   * Reservations expire after 15 minutes if payment is not completed.
   */
  async createReservations(): Promise<boolean> {
    const cart = this._cart();
    const eventId = this._eventId();
    const email = this.authService.currentUser()?.email;

    if (!eventId || !email || cart.length === 0) {
      console.warn(
        '[CheckoutService] Cannot create reservations: missing eventId, email, or cart is empty',
      );
      return false;
    }

    this._isLoading.set(true);
    const reservations: Reservation[] = [];

    try {
      // Create a reservation for each ticket type in the cart
      for (const item of cart) {
        const reservationDto = {
          eventId: String(eventId),
          ticketType: this.mapTicketTypeName(item.ticketTypeName),
          quantity: item.quantity,
          buyerEmail: email,
        };

        console.log('📤 [CheckoutService] Creating reservation:', reservationDto);

        const response = await this.http
          .post<any>(`${environment.apiUrl}/reservations`, reservationDto)
          .toPromise();

        console.log('✅ [CheckoutService] Reservation created:', response);

        reservations.push({
          id: response.id,
          eventId: response.eventId,
          ticketType: response.ticketType,
          quantity: response.quantity,
          totalAmount: response.totalAmount,
          expiresAt: new Date(response.expiresAt),
          status: response.status,
        });
      }

      // Store reservations
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));

      // Set the first reservation for the timer (all should have same expiration)
      if (reservations.length > 0) {
        this._reservation.set(reservations[0]);
        this.startReservationTimer();
      }

      this._isLoading.set(false);
      return true;
    } catch (error: any) {
      console.error('❌ [CheckoutService] Error creating reservations:', error);
      this._isLoading.set(false);

      // If reservation fails due to insufficient tickets, show error
      if (error?.error?.message?.includes('Insufficient')) {
        throw new Error(error.error.message);
      }

      return false;
    }
  }

  /**
   * Gets the stored reservations
   */
  getReservations(): Reservation[] {
    const stored = localStorage.getItem(RESERVATIONS_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  /**
   * Clears stored reservations
   */
  clearReservations(): void {
    localStorage.removeItem(RESERVATIONS_KEY);
    this._reservation.set(null);
    this._timeRemaining.set(0);
  }

  addToCart(ticketTypeId: number, ticketTypeName: string, quantity: number, price: number): void {
    const cart = this._cart();
    const existingItem = cart.find((item) => item.ticketTypeId === ticketTypeId);

    if (existingItem) {
      // Create a new array reference to trigger signal update
      const updatedCart = cart.map((item) =>
        item.ticketTypeId === ticketTypeId ? { ...item, quantity: item.quantity + quantity } : item,
      );
      this._cart.set(updatedCart);
    } else {
      this._cart.set([...cart, { ticketTypeId, ticketTypeName, quantity, price }]);
    }
  }

  removeFromCart(ticketTypeId: number): void {
    this._cart.set(this._cart().filter((item) => item.ticketTypeId !== ticketTypeId));
  }

  updateQuantity(ticketTypeId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(ticketTypeId);
      return;
    }
    const cart = this._cart();
    const updatedCart = cart.map((item) => {
      if (item.ticketTypeId === ticketTypeId) {
        return { ...item, quantity: quantity };
      }
      return item;
    });
    this._cart.set(updatedCart);
  }

  clearCart(): void {
    this.stopReservationTimer();
    this._cart.set([]);
    this._reservation.set(null);
    this._reservationExpired.set(false);
    this.clearReservations();
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  setReservation(reservation: Reservation): void {
    this._reservation.set(reservation);
    this._reservationExpired.set(false);
    this.startReservationTimer();
  }

  private startReservationTimer(): void {
    // Clear any existing timer
    this.stopReservationTimer();

    const reservation = this._reservation();
    if (!reservation) return;

    const expiresAt = new Date(reservation.expiresAt).getTime();

    // Initial calculation
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    this._timeRemaining.set(remaining);

    console.log(
      `⏱️ [CheckoutService] Timer started. Expires at: ${new Date(expiresAt).toISOString()}, Remaining: ${remaining}s`,
    );

    if (remaining <= 0) {
      this.handleReservationExpired();
      return;
    }

    // Use setInterval for consistent updates
    this.timerInterval = setInterval(() => {
      const currentTime = Date.now();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));
      this._timeRemaining.set(secondsLeft);

      if (secondsLeft <= 0) {
        this.handleReservationExpired();
      }
    }, 1000);
  }

  private stopReservationTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleReservationExpired(): void {
    console.log('⏰ [CheckoutService] Reservation expired!');
    this.stopReservationTimer();
    this._reservationExpired.set(true);
    this._timeRemaining.set(0);
    // Don't clear cart immediately - let the component handle the redirect
  }

  /**
   * Reset the expired state (used when user wants to try again)
   */
  resetExpiredState(): void {
    this._reservationExpired.set(false);
  }

  confirmOrder(
    paymentMethodId: string,
    buyerEmail?: string,
    paymentInfo?: { cardNumber: string; expiryDate: string; cvv: string },
  ): void {
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
    paymentInfo: { cardNumber: string; expiryDate: string; cvv: string },
  ): void {
    // Call backend for each ticket type
    const purchasePromises = cart.map((item) => {
      // Match the backend DTO: eventId (UUID), ticketType (enum), quantity, buyerEmail, paymentInfo
      const purchaseDto = {
        eventId,
        ticketType: this.mapTicketTypeName(item.ticketTypeName),
        quantity: item.quantity,
        buyerEmail,
        paymentInfo: {
          cardNumber: paymentInfo.cardNumber,
          expiryDate: paymentInfo.expiryDate,
          cvv: paymentInfo.cvv,
        },
      };

      console.log('📤 Enviando POST /tickets/purchase:', purchaseDto);
      return this.http.post<any>(`${environment.apiUrl}/tickets/purchase`, purchaseDto).toPromise();
    });

    Promise.all(purchasePromises)
      .then((results) => {
        console.log('✅ Respuesta del backend:', results);
        // Combine all tickets from backend responses
        const allTickets: PurchasedTicket[] = [];
        results.forEach((tickets: any[]) => {
          if (Array.isArray(tickets)) {
            tickets.forEach((t) => {
              allTickets.push({
                id: t.id || t.code,
                ticketTypeName: t.type || t.ticketType,
                price: t.price,
                qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${t.qrToken || t.id}`,
              });
            });
          }
        });

        this.finalizeOrder(allTickets);
      })
      .catch((error) => {
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

    cart.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        const ticketId = `TKT-${Date.now()}-${item.ticketTypeId}-${i}`;
        tickets.push({
          id: ticketId,
          ticketTypeName: item.ticketTypeName,
          price: item.price,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`,
        });
      }
    });

    this.finalizeOrder(tickets);
  }

  private finalizeOrder(tickets: PurchasedTicket[]): void {
    const cart = this._cart();
    const orderId = 'ORD-' + Date.now();

    // Create completed order (in memory only, not persisted to localStorage)
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
      eventName: this._eventName(),
    };

    // Save completed order to signal (for confirmation page)
    this._completedOrder.set(completedOrder);

    // Invalidate cache for event availability
    const eventId = this._eventId();
    if (eventId) {
      // Invalidate cache for each ticket type purchased
      cart.forEach((item) => {
        this.cacheInvalidationService.invalidateAfterPurchase(String(eventId), item.ticketTypeName);
      });

      // Also invalidate the general event cache
      this.cacheInvalidationService.invalidateEvent(String(eventId));

      console.log('🔄 [CheckoutService] Cache invalidated after purchase for event:', eventId);
    }

    // Clear the cart after saving
    setTimeout(() => {
      this._isLoading.set(false);
      this.clearCart();
    }, 1000);
  }

  clearCompletedOrder(): void {
    this._completedOrder.set(null);
  }

  private loadCart(): CartItem[] {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) return [];
    try {
      return JSON.parse(savedCart);
    } catch (e) {
      return [];
    }
  }

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
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
