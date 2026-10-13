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

-- Políticas de acceso público (anon) para permitir reservas y gestión desde la interfaz web
DROP POLICY IF EXISTS "Public access appointments" ON public.appointments;
CREATE POLICY "Public access appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access services" ON public.services;
CREATE POLICY "Public access services" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access settings" ON public.settings;
CREATE POLICY "Public access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Habilitar sincronización en tiempo real (Supabase Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;

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
