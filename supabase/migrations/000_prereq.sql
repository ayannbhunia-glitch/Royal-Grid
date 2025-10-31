-- Prerequisites for Royal Grid Domination
-- Run this before 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- optional, in case you prefer uuid_generate_v4()
