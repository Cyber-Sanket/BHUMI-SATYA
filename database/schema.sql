-- BHUMI-SATYA PostgreSQL + PostGIS Schema Definition
-- SIH 2026 Problem Statement ID: SIH26016

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'OFFICER', 'FIELD_OFFICER', 'PROJECT_AUTHORITY', 'LANDOWNER', 'AUDITOR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE acquisition_stage AS ENUM ('INITIAL', 'NOTIFICATION', 'DECLARATION', 'AWARD', 'COMPENSATION', 'POSSESSION_PENDING', 'POSSESSION_VERIFIED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE compensation_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verdict_type AS ENUM ('VERIFIED', 'REVIEW', 'WARNING', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'FIELD_OFFICER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corridors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_code VARCHAR(100) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    corridor_id UUID REFERENCES corridors(id) ON DELETE SET NULL,
    khasra_number VARCHAR(100) NOT NULL,
    landowner_name VARCHAR(255),
    area_sqm NUMERIC(12, 2),
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    current_stage acquisition_stage NOT NULL DEFAULT 'INITIAL',
    compensation_status compensation_status NOT NULL DEFAULT 'UNPAID',
    confidence_score NUMERIC(5, 2) DEFAULT 0.00,
    verdict verdict_type DEFAULT 'REVIEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GIST Indexes
CREATE INDEX IF NOT EXISTS idx_parcels_geometry ON parcels USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_parcels_centroid ON parcels USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_corridors_geometry ON corridors USING GIST (geometry);

CREATE TABLE IF NOT EXISTS field_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES users(id),
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    gps_accuracy NUMERIC(8, 2) NOT NULL,
    location_point GEOMETRY(Point, 4326) NOT NULL,
    photo_url VARCHAR(500),
    photo_hash VARCHAR(64) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    is_mock_location BOOLEAN DEFAULT FALSE,
    play_integrity_verdict VARCHAR(50),
    wifi_bssid VARCHAR(100),
    cell_tower_id VARCHAR(100),
    ble_beacon_id VARCHAR(100),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id UUID REFERENCES field_captures(id) ON DELETE CASCADE,
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    pip_matched BOOLEAN NOT NULL,
    haversine_distance_meters NUMERIC(10, 2) NOT NULL,
    signal_pip_score NUMERIC(5, 2) NOT NULL,
    signal_device_score NUMERIC(5, 2) NOT NULL,
    signal_network_score NUMERIC(5, 2) NOT NULL,
    signal_beacon_score NUMERIC(5, 2) NOT NULL,
    signal_integrity_score NUMERIC(5, 2) NOT NULL,
    total_confidence_score NUMERIC(5, 2) NOT NULL,
    evidence_age_days INT DEFAULT 0,
    final_verdict verdict_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'HIGH',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    parcel_id UUID REFERENCES parcels(id),
    old_value JSONB,
    new_value JSONB,
    evidence_hash VARCHAR(64),
    confidence_score NUMERIC(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
