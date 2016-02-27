ALTER TABLE ssm.users
  ADD COLUMN name VARCHAR(120),
  ADD COLUMN state VARCHAR(40),
  -- affiliations (maybe not 3NF normalized, but it is convenient)
  ADD COLUMN affil_self_advocate      BOOLEAN DEFAULT false,
  ADD COLUMN affil_family_member      BOOLEAN DEFAULT false,
  ADD COLUMN affil_health_provider    BOOLEAN DEFAULT false,
  ADD COLUMN affil_education_provider BOOLEAN DEFAULT false,
  ADD COLUMN affil_smcha_staff        BOOLEAN DEFAULT false, -- State Maternal Child Health Agency staff
  ADD COLUMN affil_local_org_staff    BOOLEAN DEFAULT false,
  ADD COLUMN reason TEXT -- reason for using SSM
  ;
