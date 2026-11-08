ALTER TABLE state_offices.seats ADD COLUMN capacity integer NOT NULL DEFAULT 1 CHECK (capacity > 0);
