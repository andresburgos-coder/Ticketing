import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketsService, Ticket } from '../../core/services/tickets.service';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.css'
})
export class MyTicketsComponent implements OnInit {
  private readonly ticketsService = inject(TicketsService);

  // Signals
  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly activeTab = signal<'upcoming' | 'history'>('upcoming');

  // Computed
  protected readonly filteredTickets = computed(() => {
    const tickets = this.tickets();
    const query = this.searchQuery().toLowerCase();
    const tab = this.activeTab();

    return tickets.filter(ticket => {
      const matchesTab = tab === 'upcoming'
        ? ticket.status === 'upcoming'
        : ticket.status === 'past' || ticket.status === 'cancelled';

      const matchesSearch = query === '' ||
        ticket.eventName.toLowerCase().includes(query) ||
        ticket.venue.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  });

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading.set(true);
    this.ticketsService.getUserTickets().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.isLoading.set(false);
      }
    });
  }

  setActiveTab(tab: 'upcoming' | 'history') {
    this.activeTab.set(tab);
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  downloadTicket(ticketId: string) {
    this.ticketsService.downloadTicket(ticketId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${ticketId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => console.error('Error downloading ticket:', error)
    });
  }

  cancelTicket(ticketId: string) {
    if (confirm('Are you sure you want to cancel this ticket?')) {
      this.ticketsService.cancelTicket(ticketId).subscribe({
        next: () => {
          this.loadTickets();
        },
        error: (error) => console.error('Error cancelling ticket:', error)
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800';
      case 'past': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
