DROP SCHEMA IF EXISTS ssm CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA ssm;

CREATE TABLE ssm.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(80) UNIQUE,
  password VARCHAR(80),
  auth_token UUID UNIQUE DEFAULT gen_random_uuid()
);

CREATE TABLE ssm.maps (
  id SERIAL PRIMARY KEY,
  owner INTEGER REFERENCES ssm.users(id) NOT NULL,
  document JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

