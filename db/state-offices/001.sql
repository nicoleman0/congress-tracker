CREATE SCHEMA IF NOT EXISTS state_offices;

CREATE TABLE state_offices.batches (
  id text PRIMARY KEY,
  content_hash text NOT NULL UNIQUE,
  imported_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  CHECK ((reviewed_at IS NULL) = (reviewer IS NULL))
);
CREATE TABLE state_offices.people (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, name text NOT NULL CHECK (length(trim(name)) > 0),
  PRIMARY KEY (batch_id, id)
);
CREATE TABLE state_offices.seats (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, state char(2) NOT NULL CHECK (state ~ '^[A-Z]{2}$'),
  office text NOT NULL CHECK (office IN ('governor', 'upper', 'lower', 'unicameral')),
  chamber text NOT NULL, district text, seat_label text,
  PRIMARY KEY (batch_id, id),
  CHECK (office <> 'governor' OR district IS NULL)
);
CREATE TABLE state_offices.sources (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, url text NOT NULL CHECK (url ~ '^https://'),
  label text NOT NULL, checked_at date NOT NULL, excerpt text,
  PRIMARY KEY (batch_id, id)
);
CREATE TABLE state_offices.elections (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, seat_id text NOT NULL, year integer NOT NULL CHECK (year BETWEEN 1900 AND 2200),
  stage text NOT NULL CHECK (stage IN ('primary', 'general', 'special', 'other')),
  election_date date,
  PRIMARY KEY (batch_id, id),
  FOREIGN KEY (batch_id, seat_id) REFERENCES state_offices.seats(batch_id, id)
);
CREATE TABLE state_offices.terms (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, person_id text NOT NULL, seat_id text NOT NULL, election_id text,
  starts_on date NOT NULL, ends_on date, status text NOT NULL CHECK (status IN ('serving', 'incoming', 'ended', 'unresolved')),
  service_source_id text NOT NULL, result_source_id text,
  contact_url text CHECK (contact_url IS NULL OR contact_url ~ '^https://'),
  campaign_url text CHECK (campaign_url IS NULL OR campaign_url ~ '^https://'),
  PRIMARY KEY (batch_id, id),
  FOREIGN KEY (batch_id, person_id) REFERENCES state_offices.people(batch_id, id),
  FOREIGN KEY (batch_id, seat_id) REFERENCES state_offices.seats(batch_id, id),
  FOREIGN KEY (batch_id, election_id) REFERENCES state_offices.elections(batch_id, id),
  FOREIGN KEY (batch_id, service_source_id) REFERENCES state_offices.sources(batch_id, id),
  FOREIGN KEY (batch_id, result_source_id) REFERENCES state_offices.sources(batch_id, id),
  CHECK (ends_on IS NULL OR ends_on > starts_on)
);
CREATE TABLE state_offices.issuers (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, name text NOT NULL, parent_id text,
  group_code text NOT NULL CHECK (group_code IN ('wfp','or','dsa','rfs','pccc','sunrise')),
  affiliation_source_id text,
  PRIMARY KEY (batch_id, id),
  FOREIGN KEY (batch_id, parent_id) REFERENCES state_offices.issuers(batch_id, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (batch_id, affiliation_source_id) REFERENCES state_offices.sources(batch_id, id),
  CHECK (parent_id IS NULL OR affiliation_source_id IS NOT NULL)
);
CREATE TABLE state_offices.endorsements (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL, person_id text NOT NULL, issuer_id text NOT NULL, election_id text NOT NULL,
  source_id text NOT NULL, withdrawn boolean NOT NULL DEFAULT false,
  PRIMARY KEY (batch_id, id),
  FOREIGN KEY (batch_id, person_id) REFERENCES state_offices.people(batch_id, id),
  FOREIGN KEY (batch_id, issuer_id) REFERENCES state_offices.issuers(batch_id, id),
  FOREIGN KEY (batch_id, election_id) REFERENCES state_offices.elections(batch_id, id),
  FOREIGN KEY (batch_id, source_id) REFERENCES state_offices.sources(batch_id, id)
);
CREATE TABLE state_offices.coverage (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  state char(2) NOT NULL, group_code text NOT NULL CHECK (group_code IN ('wfp','or','dsa','rfs','pccc','sunrise')),
  status text NOT NULL CHECK (status IN ('complete_with_entries','complete_no_entries','not_applicable','blocked','in_progress')),
  note text NOT NULL, checked_at date NOT NULL,
  PRIMARY KEY (batch_id, state, group_code)
);
CREATE TABLE state_offices.publications (
  version text PRIMARY KEY, batch_id text NOT NULL REFERENCES state_offices.batches(id),
  created_at timestamptz NOT NULL DEFAULT now(), snapshot jsonb NOT NULL, content_hash text NOT NULL
);
CREATE TABLE state_offices.selected_publication (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  version text NOT NULL REFERENCES state_offices.publications(version)
);
CREATE FUNCTION state_offices.lock_reviewed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b text;
DECLARE reviewed timestamptz;
BEGIN
  IF TG_OP = 'DELETE' THEN b := OLD.batch_id; ELSE b := NEW.batch_id; END IF;
  IF TG_OP = 'UPDATE' AND OLD.batch_id <> NEW.batch_id THEN RAISE EXCEPTION 'cannot move records between batches'; END IF;
  SELECT reviewed_at INTO reviewed FROM state_offices.batches WHERE id = b FOR UPDATE;
  IF reviewed IS NOT NULL THEN
    RAISE EXCEPTION 'reviewed batch % is immutable', b;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION state_offices.lock_batch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF OLD.reviewed_at IS NOT NULL THEN RAISE EXCEPTION 'reviewed batch is immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NEW.id <> OLD.id OR NEW.content_hash <> OLD.content_hash THEN RAISE EXCEPTION 'batch identity is immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER immutable_batch BEFORE UPDATE OR DELETE ON state_offices.batches FOR EACH ROW EXECUTE FUNCTION state_offices.lock_batch();
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['people','seats','sources','elections','terms','issuers','endorsements','coverage'] LOOP
    EXECUTE format('CREATE TRIGGER lock_reviewed BEFORE INSERT OR UPDATE OR DELETE ON state_offices.%I FOR EACH ROW EXECUTE FUNCTION state_offices.lock_reviewed()', t);
  END LOOP;
END $$;
CREATE FUNCTION state_offices.lock_publication() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'publications are immutable';
END $$;
CREATE TRIGGER immutable_publication BEFORE UPDATE OR DELETE ON state_offices.publications FOR EACH ROW EXECUTE FUNCTION state_offices.lock_publication();
