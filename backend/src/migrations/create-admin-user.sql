-- Create admin user
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "createdAt") 
VALUES (
    gen_random_uuid(), 
    'admin@ticketapp.com', 
    '$2b$10$K7L/R3.Hw6fuOwmwuxOqkOEW3rdX.Ut/NFFPqeYHdUiILWQRBd/Ey', 
    'Admin', 
    'User', 
    'ADMIN', 
    NOW()
) 
ON CONFLICT (email) DO NOTHING 
RETURNING email, "firstName", "lastName", role, id;