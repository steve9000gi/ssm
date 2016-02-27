ALTER TABLE ssm.users
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS affil_self_advocate,
  DROP COLUMN IF EXISTS affil_family_member,
  DROP COLUMN IF EXISTS affil_health_provider,
  DROP COLUMN IF EXISTS affil_education_provider,
  DROP COLUMN IF EXISTS affil_smcha_staff,
  DROP COLUMN IF EXISTS affil_local_org_staff,
  DROP COLUMN IF EXISTS reason
  ;
