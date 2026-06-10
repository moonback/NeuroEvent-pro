-- Create enum types
DO $$ BEGIN
    CREATE TYPE equipment_category AS ENUM ('Arcade', 'Sonorisation', 'Éclairage', 'Scène', 'Décoration', 'Autre');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mission_status AS ENUM ('Planifiée', 'En cours', 'Terminée');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mission_type AS ENUM ('Livraison', 'Montage', 'Démontage', 'Événement complet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Technicien');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Technicien',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Trucks table
CREATE TABLE IF NOT EXISTS trucks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plate TEXT NOT NULL,
    volume NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Equipments table
CREATE TABLE IF NOT EXISTS equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category equipment_category NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Missions table
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type mission_type NOT NULL,
    client TEXT NOT NULL,
    address TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    status mission_status NOT NULL DEFAULT 'Planifiée',
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create join table for Missions <-> Technicians
CREATE TABLE IF NOT EXISTS mission_technicians (
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    PRIMARY KEY (mission_id, technician_id)
);

-- Create join table for Missions <-> Equipments
CREATE TABLE IF NOT EXISTS mission_equipments (
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipments(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (mission_id, equipment_id)
);

-- Disable Row Level Security to allow client-side operations without policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE trucks DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_equipments DISABLE ROW LEVEL SECURITY;

-- IMPORTANT: Grant permissions to the Supabase API roles
-- This prevents the "403 Forbidden" errors when accessing tables from the client
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;


