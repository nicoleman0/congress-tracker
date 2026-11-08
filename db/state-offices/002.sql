ALTER TABLE state_offices.batches ADD COLUMN review_hash text;
ALTER TABLE state_offices.batches ADD CONSTRAINT reviewed_hash_required CHECK ((reviewed_at IS NULL) = (review_hash IS NULL));
