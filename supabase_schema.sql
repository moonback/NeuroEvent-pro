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

DO $$ BEGIN
    CREATE TYPE unavailability_type AS ENUM ('Congé', 'Indisponibilité');
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
    skills TEXT[],
    driver_license JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Technician Unavailabilities table
CREATE TABLE IF NOT EXISTS technician_unavailabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type unavailability_type NOT NULL DEFAULT 'Congé',
    reason TEXT,
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
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    address TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    required_skills TEXT[],
    status mission_status NOT NULL DEFAULT 'Planifiée',
    color TEXT NOT NULL DEFAULT '#3b82f6',
    signature_url TEXT,
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

-- Enable Row Level Security to allow policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_unavailabilities ENABLE ROW LEVEL SECURITY;

-- Allow everything for authenticated and anon users (Phase 1 permissive policies)
-- Profiles
CREATE POLICY "Allow PUBLIC SELECT on profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on profiles" ON profiles FOR DELETE USING (true);

-- Technicians
CREATE POLICY "Allow PUBLIC SELECT on technicians" ON technicians FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on technicians" ON technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on technicians" ON technicians FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on technicians" ON technicians FOR DELETE USING (true);

-- Technician Unavailabilities
CREATE POLICY "Allow PUBLIC SELECT on technician_unavailabilities" ON technician_unavailabilities FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on technician_unavailabilities" ON technician_unavailabilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on technician_unavailabilities" ON technician_unavailabilities FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on technician_unavailabilities" ON technician_unavailabilities FOR DELETE USING (true);

-- Trucks
CREATE POLICY "Allow PUBLIC SELECT on trucks" ON trucks FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on trucks" ON trucks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on trucks" ON trucks FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on trucks" ON trucks FOR DELETE USING (true);

-- Equipments
CREATE POLICY "Allow PUBLIC SELECT on equipments" ON equipments FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on equipments" ON equipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on equipments" ON equipments FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on equipments" ON equipments FOR DELETE USING (true);

-- Missions
CREATE POLICY "Allow PUBLIC SELECT on missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on missions" ON missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on missions" ON missions FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on missions" ON missions FOR DELETE USING (true);

-- Mission_Technicians
CREATE POLICY "Allow PUBLIC SELECT on mission_technicians" ON mission_technicians FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on mission_technicians" ON mission_technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on mission_technicians" ON mission_technicians FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on mission_technicians" ON mission_technicians FOR DELETE USING (true);

-- Mission_Equipments
CREATE POLICY "Allow PUBLIC SELECT on mission_equipments" ON mission_equipments FOR SELECT USING (true);
CREATE POLICY "Allow PUBLIC INSERT on mission_equipments" ON mission_equipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow PUBLIC UPDATE on mission_equipments" ON mission_equipments FOR UPDATE USING (true);
CREATE POLICY "Allow PUBLIC DELETE on mission_equipments" ON mission_equipments FOR DELETE USING (true);

-- IMPORTANT: Grant permissions to the Supabase API roles
-- This prevents the "403 Forbidden" errors when accessing tables from the client
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Create Storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read/write
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');

-- IMPORTANT FOR UPDATES:
-- Since the table already exists, CREATE TABLE IF NOT EXISTS will not add new columns.
-- Run this ALTER TABLE to add the signature_url column to existing deployments.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='missions' AND column_name='signature_url') THEN
        ALTER TABLE missions ADD COLUMN signature_url TEXT;
    END IF;
END $$;

-- Reload the PostgREST schema cache so the API recognizes the new column
NOTIFY pgrst, 'reload schema';
