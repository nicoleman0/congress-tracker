-- Read-only mirror of data/*.json. A load is one distinct content version, keyed by its hash.
-- A sync records which load a commit had, so reverting to old content still moves `latest`.
-- Rows never change after insert.
CREATE TABLE federal.loads (
  id text PRIMARY KEY CHECK (id ~ '^[0-9a-f]{64}$'),
  loaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE federal.syncs (
  git_commit text PRIMARY KEY CHECK (git_commit ~ '^[0-9a-f]{40}$'),
  load_id text NOT NULL REFERENCES federal.loads(id),
  synced_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE federal.groups (
  load_id text NOT NULL REFERENCES federal.loads(id),
  code text NOT NULL, name text NOT NULL, url text NOT NULL,
  PRIMARY KEY (load_id, code)
);
CREATE TABLE federal.members (
  load_id text NOT NULL REFERENCES federal.loads(id),
  id text NOT NULL, name text NOT NULL,
  office text NOT NULL CHECK (office IN ('house', 'senate')),
  incumbent boolean NOT NULL,
  state char(2) NOT NULL, district text,
  status text NOT NULL CHECK (status IN ('won', 'leading', 'pending', 'incumbent', 'lost')),
  note text NOT NULL, source_label text NOT NULL, source_url text NOT NULL,
  campaign_url text, campaign_fec text,
  checked_at timestamptz NOT NULL,
  PRIMARY KEY (load_id, id)
);
CREATE TABLE federal.member_groups (
  load_id text NOT NULL, member_id text NOT NULL, group_code text NOT NULL,
  PRIMARY KEY (load_id, member_id, group_code),
  FOREIGN KEY (load_id, member_id) REFERENCES federal.members(load_id, id),
  FOREIGN KEY (load_id, group_code) REFERENCES federal.groups(load_id, code)
);
CREATE TABLE federal.issues (
  load_id text NOT NULL REFERENCES federal.loads(id),
  code text NOT NULL, name text NOT NULL, position integer NOT NULL,
  PRIMARY KEY (load_id, code)
);
CREATE TABLE federal.stances (
  load_id text NOT NULL, member_id text NOT NULL, position integer NOT NULL,
  issue text NOT NULL, text text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('campaign', 'office', 'congress')),
  quote text, source_label text NOT NULL, source_url text NOT NULL, checked_at timestamptz NOT NULL,
  PRIMARY KEY (load_id, member_id, position),
  FOREIGN KEY (load_id, member_id) REFERENCES federal.members(load_id, id),
  FOREIGN KEY (load_id, issue) REFERENCES federal.issues(load_id, code)
);
CREATE TABLE federal.photos (
  load_id text NOT NULL, member_id text NOT NULL,
  src text NOT NULL, width integer NOT NULL, height integer NOT NULL, bioguide text NOT NULL, credit text NOT NULL,
  PRIMARY KEY (load_id, member_id),
  FOREIGN KEY (load_id, member_id) REFERENCES federal.members(load_id, id)
);
-- Later-cycle endorsements from data/endorsements-YYYY.json.
CREATE TABLE federal.candidates (
  load_id text NOT NULL REFERENCES federal.loads(id),
  cycle integer NOT NULL, id text NOT NULL, name text NOT NULL,
  office text NOT NULL CHECK (office IN ('house', 'senate')),
  state char(2) NOT NULL, district text,
  seat text NOT NULL CHECK (seat IN ('open', 'incumbent', 'challenger')),
  member_id text, note text NOT NULL,
  PRIMARY KEY (load_id, cycle, id)
);
CREATE TABLE federal.candidate_endorsements (
  load_id text NOT NULL, cycle integer NOT NULL, candidate_id text NOT NULL,
  group_code text NOT NULL, url text NOT NULL, checked_at timestamptz NOT NULL,
  PRIMARY KEY (load_id, cycle, candidate_id, group_code),
  FOREIGN KEY (load_id, cycle, candidate_id) REFERENCES federal.candidates(load_id, cycle, id),
  FOREIGN KEY (load_id, group_code) REFERENCES federal.groups(load_id, code)
);
CREATE FUNCTION federal.immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'federal mirror rows are immutable';
END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['loads','syncs','groups','members','member_groups','issues','stances','photos','candidates','candidate_endorsements'] LOOP
    EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON federal.%I FOR EACH ROW EXECUTE FUNCTION federal.immutable()', t);
  END LOOP;
END $$;
CREATE VIEW federal.latest AS
  SELECT load_id AS id, git_commit, synced_at FROM federal.syncs ORDER BY synced_at DESC LIMIT 1;
