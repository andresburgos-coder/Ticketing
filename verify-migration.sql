-- Verificar estado actual de la migración
SELECT 
    tc.event_id,
    tc.type::text,
    tc.totalquantity as total,
    tc.availablequantity as available,
    COALESCE(sold.count, 0) as sold_tickets
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