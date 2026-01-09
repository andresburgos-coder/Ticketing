export interface TicketConfiguration {
    type: string;
    price: number;
    currency: string;
    totalQuantity: number;
    availableQuantity: number;
}

export interface TicketType {
    id: number;
    name: string;
    price: number;
    totalQuantity: number;
    tickets?: any[];
}


export interface EventDetails {
    category?: string;
    minAge?: number;
    seating?: string;
    capacity?: number;
    foodSales?: boolean;
    liquorSales?: boolean;
    accessibility?: string;
    wheelchairAccess?: boolean;
    pregnancyAccess?: boolean;
}

export interface Event {
    id: string | number;
    name: string;
    date: string;
    location: string;
    imageUrl?: string | null;
    description?: string;
    organizer?: string;
    venueName?: string;
    startTime?: string;
    endTime?: string;
    tags?: string[];
    ticketTypes?: TicketType[];
    ticketConfigurations?: TicketConfiguration[];
    eventDetails?: EventDetails;
}
