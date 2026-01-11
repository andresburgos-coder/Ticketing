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
    availableQuantity?: number;
    tickets?: any[];
}


export interface EventDetails {
    id?: string;
    category?: string;
    minAge?: number | null;
    seating?: string;
    capacity?: number;
    foodSale?: boolean;
    liquorSale?: boolean;
    reducedMobilityAccess?: boolean;
    pregnantAccess?: boolean;
}

export interface Event {
    id: string | number;
    code?: string;
    name: string;
    date: string;
    location: string;
    imageUrl?: string | null;
    description?: string;
    createdBy?: string | null;
    organizer?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
    venueName?: string;
    startTime?: string;
    endTime?: string;
    tags?: string[];
    ticketTypes?: TicketType[];
    ticketConfigurations?: TicketConfiguration[];
    eventDetails?: EventDetails[];
}
