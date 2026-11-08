-- Query surface across levels: federal rows come from the latest sync, state rows from the selected publication.
-- Unreviewed state batches stay out. Status vocabularies differ by level and are kept as-is.
CREATE VIEW analysis.state_batch AS
  SELECT p.batch_id FROM state_offices.selected_publication sp JOIN state_offices.publications p USING (version);

CREATE VIEW analysis.officeholders AS
  SELECT 'federal' AS level, m.id AS person_id, m.name, m.state, m.office,
    CASE m.office WHEN 'house' THEN 'U.S. House' ELSE 'U.S. Senate' END AS chamber,
    m.district, m.status, NULL::text AS term_id,
    ARRAY(SELECT lower(g.group_code) FROM federal.member_groups g WHERE g.load_id = m.load_id AND g.member_id = m.id ORDER BY 1) AS groups
  FROM federal.members m JOIN federal.latest l ON l.id = m.load_id
  UNION ALL
  SELECT 'state', p.id, p.name, s.state, s.office, s.chamber, s.district, t.status, t.id,
    ARRAY(SELECT DISTINCT i.group_code FROM state_offices.reconciliations r
      JOIN state_offices.endorsements d ON d.batch_id = r.batch_id AND d.id = r.endorsement_id
      JOIN state_offices.issuers i ON i.batch_id = d.batch_id AND i.id = d.issuer_id
      WHERE r.batch_id = t.batch_id AND r.term_id = t.id AND r.outcome = 'included' ORDER BY 1)
  FROM state_offices.terms t
  JOIN analysis.state_batch b ON b.batch_id = t.batch_id
  JOIN state_offices.people p ON p.batch_id = t.batch_id AND p.id = t.person_id
  JOIN state_offices.seats s ON s.batch_id = t.batch_id AND s.id = t.seat_id;

CREATE VIEW analysis.endorsements AS
  SELECT 'federal' AS level, g.member_id AS person_id, lower(g.group_code) AS group_code, gr.name AS issuer, gr.url AS source_url, false AS withdrawn
  FROM federal.member_groups g JOIN federal.latest l ON l.id = g.load_id
  JOIN federal.groups gr ON gr.load_id = g.load_id AND gr.code = g.group_code
  UNION ALL
  SELECT 'state', d.person_id, i.group_code, i.name, src.url, d.withdrawn
  FROM state_offices.endorsements d
  JOIN analysis.state_batch b ON b.batch_id = d.batch_id
  JOIN state_offices.issuers i ON i.batch_id = d.batch_id AND i.id = d.issuer_id
  JOIN state_offices.sources src ON src.batch_id = d.batch_id AND src.id = d.source_id;
