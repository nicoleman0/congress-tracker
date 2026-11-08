CREATE TABLE state_offices.reconciliations (
  batch_id text NOT NULL REFERENCES state_offices.batches(id),
  id text NOT NULL,
  endorsement_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('included', 'excluded', 'unresolved')),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  term_id text,
  evidence_source_id text,
  PRIMARY KEY (batch_id, id),
  UNIQUE (batch_id, endorsement_id),
  FOREIGN KEY (batch_id, endorsement_id) REFERENCES state_offices.endorsements(batch_id, id),
  FOREIGN KEY (batch_id, term_id) REFERENCES state_offices.terms(batch_id, id),
  FOREIGN KEY (batch_id, evidence_source_id) REFERENCES state_offices.sources(batch_id, id),
  CHECK ((outcome = 'included') = (term_id IS NOT NULL))
);
CREATE TRIGGER lock_reviewed BEFORE INSERT OR UPDATE OR DELETE ON state_offices.reconciliations FOR EACH ROW EXECUTE FUNCTION state_offices.lock_reviewed();
