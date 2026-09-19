-- O Calendário grava activity_type e permite eventos sem matéria.
-- O default classifica eventos existentes e gravações antigas como Estudo.
BEGIN;

ALTER TABLE public.schedule_events
  ADD COLUMN activity_type text NOT NULL DEFAULT 'Estudo';

ALTER TABLE public.schedule_events
  ADD CONSTRAINT schedule_events_activity_type_check
  CHECK (activity_type IN ('Estudo', 'Revisão', 'Simulado', 'Redação', 'Outro'));

ALTER TABLE public.schedule_events
  ALTER COLUMN subject_id DROP NOT NULL;

COMMIT;
