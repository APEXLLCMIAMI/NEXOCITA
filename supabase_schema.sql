BEGIN;
-- ==============================================================================
-- NEXOCITA · Esquema de Base de Datos para Servidor Supabase (PostgreSQL)
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a https://supabase.com y abre tu proyecto.
-- 2. Entra en "SQL Editor" en el menú de la izquierda.
-- 3. Pega este contenido completo y haz clic en "RUN".
-- ==============================================================================

-- 1. TABLA: appointments (Citas y Reservas)
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  service_id TEXT NOT NULL DEFAULT '1',
  service_name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  date TEXT NOT NULL,       -- Formato YYYY-MM-DD (ej: 2026-10-15)
  time TEXT NOT NULL,       -- Formato HH:MM (ej: 10:30)
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'completed' | 'cancelled'
  token TEXT NOT NULL,      -- Clave privada de consulta/cancelación del cliente
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: services (Catálogo de Servicios)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- 3. TABLA: settings (Configuración del Negocio y Horarios)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Índices para consultas instantáneas
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON public.appointments(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Datos iniciales de catálogo de servicios
INSERT INTO public.services (id, name, duration, active) VALUES
  ('1', 'Perfilado de barba y toalla caliente', 20, true),
  ('2', 'Corte clásico de cabello', 30, true),
  ('3', 'Servicio integral de estilismo', 50, true),
  ('4', 'Consulta y diagnóstico profesional', 45, true)
ON CONFLICT (id) DO NOTHING;

-- Configuración inicial del negocio y horario semanal
INSERT INTO public.settings (key, value) VALUES
  ('business', '{"name": "NEXOCITA"}'),
  ('hours', '[
    {"open": "09:00", "close": "17:00", "closed": false},
    {"open": "09:00", "close": "17:00", "closed": false},
    {"open": "09:00", "close": "17:00", "closed": false},
    {"open": "09:00", "close": "17:00", "closed": false},
    {"open": "09:00", "close": "17:00", "closed": false},
    {"open": "09:00", "close": "17:00", "closed": false},
    {"open": "09:00", "close": "17:00", "closed": true}
  ]')
ON CONFLICT (key) DO NOTHING;

-- Administración identificada por el UID de Supabase Auth, nunca por una clave pública.
CREATE TABLE IF NOT EXISTS public.nexocita_admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id));
ALTER TABLE public.nexocita_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_identity ON public.nexocita_admins FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY admin_appointments ON public.appointments FOR ALL TO authenticated
 USING (exists(select 1 from public.nexocita_admins where user_id=auth.uid()))
 WITH CHECK (exists(select 1 from public.nexocita_admins where user_id=auth.uid()));
CREATE POLICY public_services ON public.services FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY public_settings ON public.settings FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY admin_services ON public.services FOR ALL TO authenticated
 USING (exists(select 1 from public.nexocita_admins where user_id=auth.uid()))
 WITH CHECK (exists(select 1 from public.nexocita_admins where user_id=auth.uid()));
CREATE POLICY admin_settings ON public.settings FOR ALL TO authenticated
 USING (exists(select 1 from public.nexocita_admins where user_id=auth.uid()))
 WITH CHECK (exists(select 1 from public.nexocita_admins where user_id=auth.uid()));

CREATE OR REPLACE FUNCTION public.nexocita_slots(p_date text,p_service text) RETURNS SETOF text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d date; h jsonb; mins integer; t timestamp; finish timestamp;
BEGIN
 d:=p_date::date;
 IF d < (now() at time zone 'America/Managua')::date OR d > (now() at time zone 'America/Managua')::date+180 THEN RETURN; END IF;
 SELECT duration INTO mins FROM services WHERE id=p_service AND active;
 IF mins IS NULL OR mins<=0 THEN RETURN; END IF;
 SELECT value->(extract(isodow from d)::int-1) INTO h FROM settings WHERE key='hours';
 IF h IS NULL OR (h->>'closed')::boolean THEN RETURN; END IF;
 t:=d+(h->>'open')::time; finish:=d+(h->>'close')::time;
 WHILE t+make_interval(mins=>mins)<=finish LOOP
 IF t>now() at time zone 'America/Managua' AND NOT EXISTS(
 SELECT 1 FROM appointments a WHERE a.date=p_date AND a.status='confirmed'
 AND t < d+a.time::time+make_interval(mins=>a.duration) AND t+make_interval(mins=>mins)>d+a.time::time
 ) THEN RETURN NEXT to_char(t,'HH24:MI'); END IF;
 t:=t+interval '15 minutes';
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.nexocita_book(p_booking jsonb,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE svc services%rowtype; result appointments%rowtype;
BEGIN
 IF length(trim(coalesce(p_booking->>'name','')))<2 OR length(p_booking->>'name')>120
 OR length(regexp_replace(coalesce(p_booking->>'phone',''),'[^0-9]','','g'))<8
 OR length(p_booking->>'phone')>30 OR length(coalesce(p_booking->>'email',''))>254
 OR length(coalesce(p_booking->>'notes',''))>2000 OR length(coalesce(p_token,''))<24
 OR length(p_token)>128 OR length(coalesce(p_booking->>'id','')) NOT BETWEEN 6 AND 60 THEN
 RAISE EXCEPTION 'Revisa los datos de la reserva'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('nexocita-agenda'));
 SELECT * INTO svc FROM services WHERE id=p_booking->>'service_id' AND active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Servicio no disponible'; END IF;
 IF NOT EXISTS(select 1 from nexocita_slots(p_booking->>'date',svc.id) s WHERE s=p_booking->>'time') THEN
 RAISE EXCEPTION 'Este horario ya no está disponible. Elige otro'; END IF;
 INSERT INTO appointments(id,name,phone,email,service_id,service_name,duration,date,time,notes,status,token)
 VALUES(p_booking->>'id',trim(p_booking->>'name'),trim(p_booking->>'phone'),coalesce(p_booking->>'email',''),
 svc.id,svc.name,svc.duration,p_booking->>'date',p_booking->>'time',coalesce(p_booking->>'notes',''),'confirmed',p_token)
 RETURNING * INTO result;
 RETURN to_jsonb(result)-'token';
END $$;

CREATE OR REPLACE FUNCTION public.nexocita_lookup(p_id text,p_token text) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT to_jsonb(a)-'token' FROM appointments a WHERE id=p_id AND token=p_token AND length(p_token)>=16;
$$;
CREATE OR REPLACE FUNCTION public.nexocita_cancel(p_id text,p_token text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE appointments SET status='cancelled',updated_at=now()
 WHERE id=p_id AND token=p_token AND length(p_token)>=16 AND status='confirmed';
 IF NOT FOUND THEN RAISE EXCEPTION 'No se pudo cancelar: verifica el código, la clave y el estado de la cita'; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.nexocita_slots(text,text),public.nexocita_book(jsonb,text),public.nexocita_lookup(text,text),public.nexocita_cancel(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nexocita_slots(text,text),public.nexocita_book(jsonb,text),public.nexocita_lookup(text,text),public.nexocita_cancel(text,text) TO anon,authenticated;
GRANT SELECT ON public.nexocita_admins TO authenticated;
GRANT SELECT ON public.services,public.settings TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.appointments,public.services,public.settings TO authenticated;
-- Los visitantes solo pueden reservar/consultar con las funciones anteriores.
REVOKE ALL ON public.appointments FROM anon;
NOTIFY pgrst,'reload schema';

COMMIT;
