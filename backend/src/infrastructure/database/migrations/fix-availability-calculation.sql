-- Migration: Fix availability calculation
-- This script updates the availableQuantity to reflect only sold tickets
-- Run this after deploying the new logic

-- First, let's see the current state
SELECT 
    tc.event_id,
    tc.type::text,
    tc.totalquantity as total,
    tc.availablequantity as current_available,
    COALESCE(sold.count, 0) as sold_tickets,
    (tc.totalquantity - COALESCE(sold.count, 0)) as should_be_available
FROM ticket_configurations tc
LEFT JOIN (
    SELECT 
        "eventId" as event_id, 
        type::text, 
        COUNT(*) as count 
    FROM tickets 
    WHERE status IN ('PAID', 'USED') 
    GROUP BY "eventId", type::text
) sold ON tc.event_id = sold.event_id AND tc.type::text = sold.type
ORDER BY tc.event_id, tc.type;

-- Update availableQuantity to be totalQuantity - soldTickets for each ticket configuration
UPDATE ticket_configurations 
SET availablequantity = (
    totalquantity - COALESCE((
        SELECT COUNT(*) 
        FROM tickets 
        WHERE tickets."eventId" = ticket_configurations.event_id 
        AND tickets.type::text = ticket_configurations.type::text 
        AND tickets.status IN ('PAID', 'USED')
    ), 0)
)
WHERE EXISTS (
    SELECT 1 FROM events WHERE events.id = ticket_configurations.event_id
);

-- Verify the update
SELECT 
    tc.event_id,
    tc.type::text,
    tc.totalquantity as total,
    tc.availablequantity as available_after_update,
    COALESCE(sold.count, 0) as sold_tickets,
    (tc.totalquantity - COALESCE(sold.count, 0)) as calculated_available
FROM ticket_configurations tc
LEFT JOIN (
    SELECT 
        "eventId" as event_id, 
        type::text, 
        COUNT(*) as count 
    FROM tickets 
    WHERE status IN ('PAID', 'USED') 
    GROUP BY "eventId", type::text
) sold ON tc.event_id = sold.event_id AND tc.type::text = sold.type
ORDER BY tc.event_id, tc.type;