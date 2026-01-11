-- Migration to add event categories enum
-- Run this SQL script in your PostgreSQL database

-- Drop the enum if it exists (to avoid conflicts)
DROP TYPE IF EXISTS event_category_enum CASCADE;

-- Create the enum type for event categories
CREATE TYPE event_category_enum AS ENUM (
    'Cualquier categoría',
    'Acción Extremo',
    'Circo',
    'Comedia',
    'Comfama',
    'Concierto',
    'Cultural',
    'Deportes',
    'Feria',
    'Festival',
    'Inmersiones a los centros de experiencias',
    'Inscripción a proceso de admisión en Cosmo Schools',
    'Musical',
    'Podcast',
    'Recreativo',
    'Stand-Up Comedy',
    'Teatro',
    'Turismo'
);

-- First, set a default value for existing records
UPDATE event_details SET category = 'Cualquier categoría' WHERE category IS NULL OR category = '';

-- Update the event_details table to use the enum
ALTER TABLE event_details 
ALTER COLUMN category TYPE event_category_enum 
USING category::event_category_enum;

-- Set default value
ALTER TABLE event_details 
ALTER COLUMN category SET DEFAULT 'Cualquier categoría';