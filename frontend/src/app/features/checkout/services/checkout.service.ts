import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Orders } from '../../../services/orders';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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

const CART_STORAGE_KEY = 'ticketing_cart';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly ordersService = inject(Orders);

  // Signals
  private readonly _cart = signal<CartItem[]>(this.loadCart());
  private readonly _reservation = signal<Reservation | null>(null);
  private readonly _timeRemaining = signal<number>(0); // seconds
  private readonly _isLoading = signal(false);

  // Public read-only signals
  readonly cart = this._cart.asReadonly();
  readonly reservation = this._reservation.asReadonly();
  readonly timeRemaining = this._timeRemaining.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

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

  confirmOrder(paymentMethodId: string): void {
    // Placeholder for payment confirmation
    this._isLoading.set(true);
    // In real app, call backend to confirm payment
    setTimeout(() => {
      this._isLoading.set(false);
      this.clearCart(); // Clear cart after successful order
    }, 1000);
  }

  private loadCart(): CartItem[] {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  }

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }
}
