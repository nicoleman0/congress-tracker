ALTER TABLE state_offices.elections ADD COLUMN cycle_election_id text;
ALTER TABLE state_offices.elections ADD CONSTRAINT election_cycle FOREIGN KEY (batch_id, cycle_election_id) REFERENCES state_offices.elections(batch_id, id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE state_offices.elections ADD CONSTRAINT primary_cycle_required CHECK ((stage = 'primary') = (cycle_election_id IS NOT NULL));
ALTER TABLE state_offices.terms ALTER COLUMN service_source_id DROP NOT NULL;
ALTER TABLE state_offices.terms ADD CONSTRAINT serving_service_source CHECK (status <> 'serving' OR service_source_id IS NOT NULL);
