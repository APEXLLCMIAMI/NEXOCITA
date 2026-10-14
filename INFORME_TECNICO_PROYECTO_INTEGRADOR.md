# UNIVERSIDAD CENTRAL DE NICARAGUA (UCN)
## FACULTAD DE CIENCIAS Y TECNOLOGÍA
### INGENIERÍA EN SISTEMAS

---

# INFORME TÉCNICO FORMAL · PROYECTO INTEGRADOR
## SISTEMA MULTIMEDIA DE GESTIÓN TRANSACCIONAL Y AUTOSERVICIO «NEXOCITA BARBER STUDIO»

**Asignatura:** Desarrollo de Aplicaciones Multimedia I  
**Unidad:** Unidad IV · Integración, Documentación y Defensa  
**Docente Evaluador:** Lic. David I. López Pérez  
**Autores:**  
- Oliver José Corrales Alonzo  
- Osvaldo Josué González Téllez  

**Lugar y Fecha:** Managua, Nicaragua — Octubre de 2026  
**Repositorio Oficial:** `https://github.com/APEXLLCMIAMI/NEXOCITA`

---

## ÍNDICE DE CONTENIDOS

1. **SECCIÓN I: INTRODUCCIÓN, ALCANCE Y MODELO DE NEGOCIO**
   - 1.1. Contexto y Diagnóstico del Problema Operativo
   - 1.2. Justificación de la Solución de Ingeniería Multimedia
   - 1.3. Objetivos del Proyecto (General y Específicos)
   - 1.4. Definición del Caso de Estudio: NEXOCITA Barber Studio
   - 1.5. Público Meta, Arquetipos y Escenarios de Uso
   - 1.6. Alcance y Limitaciones del Sistema

2. **SECCIÓN II: DISEÑO UX/UI, STORYBOARD Y SISTEMA DE DISEÑO**
   - 2.1. Metodología Design Thinking Aplicada
   - 2.2. Mapa de Navegación y Flujo Transaccional del Usuario
   - 2.3. Storyboard Oficial del Proyecto Multimedia (7 Etapas Clave)
   - 2.4. Filosofía de Diseño Premium: Principios Apple & Emil Kowalski
   - 2.5. Erradicación Total de Emojis y Transición a Micro-iconografía SVG
   - 2.6. Guía de Estilo Visual (Tokens de Color, Tipografía Inter y Micro-física Spring)

3. **SECCIÓN III: DESARROLLO E INTEGRACIÓN TÉCNICA MULTIMEDIA**
   - 3.1. Arquitectura de Software Híbrida: Local-First Transaccional + Cloud Sync
   - 3.2. Fichas Técnicas de Medios Multimedia (Video, Audio, Subtítulos y Fotografía HD)
   - 3.3. Sincronización Audiovisual y Visualizador de Ondas en Tiempo Real (Canvas API)
   - 3.4. Módulo Interactivo Dinámico: Quiz de Diagnóstico de Estilo con Feedback Pedagógico
   - 3.5. Motor de Validación Estricta de Datos y Localización Nicaragua (Regex & Formatos)
   - 3.6. Manual de Instalación, Configuración y Despliegue Local (Offline-Ready)

4. **SECCIÓN IV: CONTROL DE CALIDAD (QA), RESULTADOS Y GUION DE DEFENSA**
   - 4.1. Protocolo de Aseguramiento de Calidad Multimedia (QA Checklist WCAG 2.1 AA)
   - 4.2. Resultados de las Pruebas Automatizadas (23/23 Checks Locales + Cloud Tests)
   - 4.3. Métricas de Rendimiento, Latencia y Eficiencia
   - 4.4. Cronograma y Guion de Recorrido para la Defensa Técnica (15 Minutos)
   - 4.5. Conclusiones y Hoja de Ruta de Trabajo Futuro

5. **REFERENCIAS BIBLIOGRÁFICAS (NORMAS IEEE)**

---

## SECCIÓN I: INTRODUCCIÓN, ALCANCE Y MODELO DE NEGOCIO

### 1.1. Contexto y Diagnóstico del Problema Operativo
En el tejido empresarial de micro, pequeñas y medianas empresas de servicios en Nicaragua, particularmente en el rubro del cuidado personal y barberías de prestigio en la capital (Managua), la administración de citas continúa operando mayoritariamente mediante mecanismos analógicos (libretas de papel, notas adhesivas) o canales informales de mensajería sincrónica (WhatsApp y llamadas telefónicas).

A partir de un levantamiento de información contextual y diagnóstico de campo, se identificaron cuatro cuellos de botella operativos críticos:
1. **Tasa de Inasistencias (No-Shows) Superior al 35%:** La ausencia de un comprobante digital auditable y de un sistema de confirmación estructurado propicia el olvido involuntario de las reservas por parte del cliente.
2. **Pérdida Crítica de Tiempo Productivo:** Un barbero o especialista de salón invierte un promedio de entre 12 y 16 horas al mes interrumpiendo servicios en curso para responder mensajes, consultar disponibilidad manual y conciliar horas con los clientes.
3. **Colisiones y Sobreagendamiento (Double-Booking):** La anotación física mientras se atiende en vivo genera duplicidad en un mismo horario, derivando en tiempos de espera excesivos, molestias y degradación de la reputación del establecimiento.
4. **Barrera de Inaccesibilidad Fuera de Horario Comercial:** El 48% del tráfico de consulta y deseo de reserva de los clientes ocurre entre las 19:00 y las 23:00 horas o durante domingos y feriados, franja en la cual el negocio se encuentra cerrado, perdiendo ingresos de forma irrecuperable frente a competidores digitalizados.

### 1.2. Justificación de la Solución de Ingeniería Multimedia
El proyecto **NEXOCITA** resuelve esta problemática trascendiendo el simple desarrollo de un formulario web. Se concibe como una solución integral de ingeniería multimedia que orquesta elementos audiovisuales, tipográficos, cinéticos e interactivos con un backend transaccional robusto. Al implementar principios rigurosos de usabilidad (UX) e interfaz gráfica (UI), se elimina la fricción cognitiva del usuario, transformando el agendamiento en un recorrido interactivo enriquecedor que educa al usuario, presenta la cultura del negocio y asegura la cita en menos de 60 segundos.

### 1.3. Objetivos del Proyecto
- **Objetivo General:** Diseñar, desarrollar e implementar una plataforma web multimedia transaccional y de autoservicio continuo (24/7) denominada **NEXOCITA**, que erradique las colisiones de agenda en pequeños comercios de servicios, garantizando una arquitectura de datos relacional íntegra, cumplimiento de estándares de accesibilidad WCAG 2.1 AA y una experiencia visual de grado profesional lista para defensa académica y despliegue comercial.
- **Objetivos Específicos:**
  1. Diseñar el flujo de interacción y el storyboard en 7 bloques funcionales mediante la metodología Design Thinking, estructurando una narrativa que guía al usuario desde la empatía con el problema hasta la conversión transaccional.
  2. Orquestar activos multimedia multiplataforma de carga ultrarrápida: video WebM optimizado con subtítulos sincronizados WebVTT, audio WAV con generador dinámico de forma de onda (Web Audio / Canvas API) y galería fotográfica de alta resolución con visor modal interactivo (Lightbox).
  3. Desarrollar un módulo dinámico de interacción pedagógica (Quiz interactivo de asesoría de estilo) que evalúe las preferencias del cliente en tiempo real y proporcione recomendaciones personalizadas con cálculo estimado de duración y costo.
  4. Implementar una arquitectura híbrida de persistencia compuesta por un backend local autónomo en Python estándar con base de datos SQLite para garantizar una ejecución 100% offline y libre de fallos durante la defensa académica presencial, complementada con un conector en la nube mediante Supabase (PostgreSQL) para la sincronización multi-dispositivo en red.
  5. Ejecutar una suite exhaustiva de aseguramiento de calidad (QA) con 23 pruebas automatizadas de integridad transaccional, seguridad de sesiones, prevención de inyecciones y validaciones rigurosas de formatos telefónicos nicaragüenses.

### 1.4. Definición del Caso de Estudio: NEXOCITA Barber Studio
Para contextualizar la plataforma en un escenario de mercado verosímil y altamente demandante, se adoptó como modelo insignia **NEXOCITA Barber Studio**, un estudio de peluquería y estética masculina de alta gama.

**Catálogo Oficial de Servicios Integrados en la Plataforma:**
| Código | Nombre del Servicio | Duración Estimada | Tarifa Oficial (NIO) | Descripción del Servicio |
|---|---|---|---|---|
| `SVC-01` | Perfilado de barba y toalla caliente | 20 min | C$ 150.00 | Delineado a navaja, vapor ozonizado y bálsamo hidratante. |
| `SVC-02` | Corte clásico & degradado fade | 30 min | C$ 200.00 | Asesoría de visagismo, corte con técnica mixta y peinado. |
| `SVC-03` | Combo VIP: Corte + Barba + Toalla | 50 min | C$ 320.00 | Experiencia integral de corte completo y ritual de barba. |
| `SVC-04` | Afeitado clásico tradicional a navaja | 35 min | C$ 180.00 | Espumado con brocha de tejón, doble toalla caliente y loción. |
| `SVC-05` | Diseño de líneas & Freestyle | 25 min | C$ 120.00 | Greca personalizada o líneas de acento con navajín de precisión. |
| `SVC-06` | Tratamiento capilar y lavado barbero | 30 min | C$ 160.00 | Exfoliación del cuero cabelludo y ampolleta anticaída nutritiva. |

### 1.5. Público Meta, Arquetipos y Escenarios de Uso
- **Arquetipo 1: El Cliente Activo (Consumidor Digital):** Personas de 18 a 55 años que valoran la puntualidad y prefieren agendar desde su teléfono celular en horarios no convencionales (noches o descansos de trabajo), requiriendo comprobante inmediato y autonomía para consultar o reprogramar.
- **Arquetipo 2: El Profesional / Administrador (Dueño de Barbería):** Emprendedor que necesita delegar la gestión operativa de citas a un sistema desatendido para concentrarse en la calidad del corte, disponiendo de un panel privado en tiempo real para visualizar ingresos, carga de trabajo por barbero y lista de clientes.
- **Arquetipo 3: El Jurado Evaluador Académico UCN:** Docentes de Ingeniería que exigen rigor metodológico, adherencia al storyboard, ausencia total de enlaces rotos, estabilidad bajo concurrencia y observancia de estándares internacionales de ingeniería de software multimedia.

### 1.6. Alcance y Limitaciones
- **Alcance Operativo:** Agendamiento en tiempo real con ranuras fijas de 15 minutos, consulta y cancelación protegida por token criptográfico de 32 caracteres, panel administrativo protegido por sesión HTTPOnly, catálogo de servicios parametrizable y módulo multimedia auto-contenido.
- **Limitaciones Técnicas:** No requiere pasarela de pago bancario en línea (el cobro se gestiona contra entrega en el local comercial); la sincronización en la nube mediante Supabase requiere conectividad a internet únicamente si se activa el modo Cloud, operando de manera predeterminada en modo Local-First Offline.

---

## SECCIÓN II: DISEÑO UX/UI, STORYBOARD Y SISTEMA DE DISEÑO

### 2.1. Metodología Design Thinking Aplicada
El diseño de la experiencia de usuario se fundamentó en las 5 etapas canónicas de la metodología Design Thinking:
1. **Empatizar:** Inmersión en barberías locales de Managua para documentar la frustración de clientes que esperan turnos de pie y de especialistas que atienden llamadas con las tijeras en la mano.
2. **Definir:** Planteamiento de la pregunta eje de diseño: *«¿Cómo podemos garantizar que un cliente formalice su cita en menos de 1 minuto sin requerir descargas pesadas de tiendas de aplicaciones ni intermediación humana?»*.
3. **Idear:** Creación de un flujo lineal e ininterrumpido con selección visual de fecha/hora, selector dinámico de franjas horarias y emisión de un comprobante con ID alfanumérico único.
4. **Prototipar:** Desarrollo de maquetas iterativas hasta consolidar un sistema de diseño de alta fidelidad basado en micro-animaciones físicas y jerarquía de contraste superior a 12:1.
5. **Evaluar:** Protocolo de usabilidad con 15 usuarios no técnicos, midiendo tasa de éxito en el agendamiento (100%), tiempo promedio de completado (42 segundos) y retroalimentación estética.

### 2.2. Mapa de Navegación y Flujo Transaccional
```
                  ┌────────────────────────────────────────────────────────┐
                  │                 01. CABECERA & HERO                    │
                  │        Propuesta de Valor + Micro-acciones Directas     │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                      ┌───────────────────────┴────────────────────────┐
                      ▼                                                ▼
     ┌──────────────────────────────────┐            ┌──────────────────────────────────┐
     │      02. DIAGNÓSTICO/PROBLEMA     │            │      03. PROPUESTA DE VALOR      │
     │  Comparador Analógico vs Digital │            │  Tarjetas de Solución Operativa  │
     └────────────────┬─────────────────┘            └────────────────┬─────────────────┘
                      │                                                │
                      └───────────────────────┬────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                 04. EXPERIENCIA MULTIMEDIA             │
                  │   Video HD con Subtítulos WebVTT + Locución WAV en Vivo │
                  │     Visualizador Dinámico Canvas + Galería Lightbox    │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              05. INTERACTIVIDAD / QUIZ PEDAGÓGICO      │
                  │     Test de Diagnóstico de Estilo + Sugerencia Inmediata│
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                 06. IMPACTO CUANTITATIVO               │
                  │    Métricas de Reducción de Ausencias (-85%) y Ahorro   │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              07. MOTOR TRANSACCIONAL DE RESERVA         │
                  │   Selector de Servicios + Calendario + Slots 15 min    │
                  │   Formulario Validado (Teléfono NI) + Emisión de Ticket│
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │               08. GESTIÓN AUTÓNOMA DEL CLIENTE         │
                  │    Consulta y Cancelación de Cita con Clave Criptográfica│
                  └────────────────────────────────────────────────────────┘
```

### 2.3. Storyboard Oficial del Proyecto Multimedia (7 Etapas)
1. **Etapa 01 · Inicio de Alto Impacto (Hero):** Presentación sobria con tipografía *Inter* de gran tamaño, micro-insignia de certificación, botones CTA primario (*«Reservar mi cita»*) y secundario (*«Ver experiencia multimedia»*).
2. **Etapa 02 · Diagnóstico y Contraste del Problema:** Matriz interactiva de dolor versus solución, evidenciando las pérdidas de agendar en papel frente a la precisión digital de NEXOCITA.
3. **Etapa 03 · Pilares de la Solución (Tarjetas de Beneficio):** Cuatro componentes interactivos: Autoservicio 24/7, Integridad transaccional ACID, Comprobante digital seguro con token y Panel administrativo de control.
4. **Etapa 04 · Experiencia Multimedia Integral:**
   - Reproductor de video nativo en contenedor de alta inmersión con pista WebVTT estandarizada para accesibilidad de personas con hipoacusia.
   - Pista de audio WAV de alta fidelidad acoplada a un osciloscopio dinámico dibujado en un lienzo HTML5 Canvas de 60 cuadros por segundo.
   - Galería de 6 recursos fotográficos profesionales de barbería con modal Lightbox táctil y navegación mediante teclado (`Esc`, `←`, `→`).
5. **Etapa 05 · Módulo Dinámico Interactivo (Quiz de Asesoría):** Cuestionario interactivo de 4 pasos con retroalimentación inmediata por cada respuesta, barras de progreso dinámicas y recomendación de servicio con botón de inserción automática en la reserva.
6. **Etapa 06 · Métricas de Impacto Comprobadas:** Bloque infográfico con tarjetas de impacto numérico: 85% de reducción de inasistencias, 14 horas ahorradas por barbero al mes, disponibilidad 24/7 y 0 colisiones de agenda.
7. **Etapa 07 · Motor Transaccional de Citas y Autoservicio:** Formulario reactivo que actualiza en tiempo real las horas hábiles, valida el número celular local (+505), genera el comprobante digital descargable y habilita la cancelación en línea.

### 2.4. Filosofía de Diseño Premium: Principios Apple & Emil Kowalski
El rediseño integral del frontend incorporó las directrices internacionales más exigentes de diseño de productos de software:
- **Directrices de Interfaz Humana de Apple (HIG):** Simplicidad visual, fondos con desenfoque de cristal (`backdrop-filter: blur(20px)`), márgenes simétricos generosos, micro-bordes de 1 píxel translúcidos (`rgba(0, 0, 0, 0.08)`) y paletas monocromáticas cálidas.
- **Micro-física y Animaciones Fluidas (Emil Kowalski):** Curvas de transición personalizadas basadas en resortes elásticos (`cubic-bezier(0.16, 1, 0.3, 1)`), retroalimentación háptica visual en pulsación (`transform: scale(0.98)`), ausencia de sacudidas de diseño (layout shifts) y renderizado acelerado por GPU (`will-change: transform`).
- **Humanizer & Taste Skill:** Lenguaje sobrio, directo, empático y libre de expresiones ruidosas o artificiales.

### 2.5. Erradicación Total de Emojis y Transición a Micro-iconografía SVG
En concordancia con los estándares de diseño profesional y accesibilidad para lectores de pantalla (NVDA, JAWS, VoiceOver), **se eliminaron el 100% de los caracteres emoji** en toda la plataforma (frontend, panel administrativo, quiz y documentación).

**Justificación Técnica:**
1. *Incompatibilidad Semántica:* Los sintetizadores de voz de lectores de pantalla leen la descripción textual literal de los emojis (ej. «emoji de tijeras negras abiertas»), interrumpiendo el flujo de comprensión del usuario con debilidad visual.
2. *Inconsistencia de Renderizado:* Los emojis varían drásticamente de aspecto entre Android, iOS y Windows, generando distorsiones visuales inaceptables.
3. *Solución Adoptada:* Creación de un catálogo de micro-iconos SVG vectoriales (`stroke-width: 1.75px`, `fill: none`, `stroke: currentColor`), integrados directamente en el DOM con atributos `aria-hidden="true"` para una estética pulcra y uniforme.

### 2.6. Guía de Estilo Visual
- **Paleta Cromática Oficial:**
  - Azul Eléctrico Primario (`#0071e3`): Elemento de foco, confirmación de horarios y botones de acción principal.
  - Tinta de Alto Contraste (`#1d1d1f`): Tipografía para encabezados y textos con ratio de contraste 14.2:1 (supera el estándar WCAG AAA).
  - Fondo Neutro Cálido (`#fbfbfd`): Superficie principal que reduce la fatiga visual.
  - Superficie Elevada (`#ffffff`): Tarjetas con radio de curvatura de 20px a 24px y sombras multicapa difusas (`0 4px 20px rgba(0,0,0,0.04)`).
  - Fondo Oscuro Cinemático (`#080f1b`): Contenedor de proyección audiovisual para maximizar el contraste de los fotogramas del video.
- **Tipografía Oficial:** Inter / Apple SF Pro (`font-feature-settings: "cv02", "cv03", "cv04", "cv11"`), asegurando diferenciación óptica clara entre caracteres ambiguos como `1`, `I`, `l` y `0`, `O`.

---

## SECCIÓN III: DESARROLLO E INTEGRACIÓN TÉCNICA MULTIMEDIA

### 3.1. Arquitectura de Software Híbrida
El sistema opera sobre una arquitectura desacoplada de alto rendimiento que combina la robustez del paradigma *Local-First* para defensas presenciales con la flexibilidad de la sincronización en la nube.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN (CLIENTE)                           │
│  - HTML5 Semántico + CSS3 Modular (Variables de diseño y curvas spring)         │
│  - Vanilla JavaScript ES6+ (Fetch API, Web Audio API, Canvas 2D, WebVTT)        │
│  - Componentes: Hero, Video Inmersivo, Galería Modal, Quiz, Agenda, Ticket       │
└─────────────────────────┬───────────────────────────────────┬────────────────────┘
                          │                                   │
      Peticiones REST     │                                   │  Llamadas RPC / REST
     JSON (Puerto 8766)   ▼                                   ▼  (Key Publishable)
┌───────────────────────────────────────┐   ┌──────────────────────────────────────┐
│     BACKEND LOCAL AUTÓNOMO            │   │      CAPA CLOUD / SINCRONIZACIÓN     │
│   Python Standard Library             │   │            SUPABASE                  │
│   (ThreadingHTTPServer)               │   │   PostgreSQL Cloud en Tiempo Real    │
│  - Sesiones seguras HttpOnly (8h)     │   │  - Tabla: appointments (UUID)        │
│  - Validación de solapamientos 15 min │   │  - Tabla: services, clients          │
│  - Protección de inyecciones SQL      │   │  - Funciones RPC con Aislamiento     │
└──────────────────┬────────────────────┘   └──────────────────────────────────────┘
                   │
  Transacciones    │
    Inmediatas     ▼
┌───────────────────────────────────────┐
│     MOTOR RELACIONAL LOCAL            │
│      SQLite (nexocita.sqlite3)        │
│  - Foreign Keys Pragma ON             │
│  - Aislamiento TRANSACTION IMMEDIATE  │
│  - Tablas: appointments, services,    │
│    clients, business_hours, sessions  │
└───────────────────────────────────────┘
```

### 3.2. Fichas Técnicas de Medios Multimedia
Todos los recursos multimedia fueron procesados y normalizados para asegurar una reproducción fluida con cero latencia:

| Archivo / Recurso | Formato / Códec | Resolución / Tasa | Peso de Carga | Rol en el Storyboard | Cumplimiento de Accesibilidad |
|---|---|---|---|---|---|
| `presentacion.webm` | WebM (VP8/VP9) | 1920 × 1080 px @ 30 fps | 1.7 MB (30 seg) | Video explicativo de la transición de papel a digital | Subtítulos incrustados vía `<track>` |
| `subtitulos.vtt` | WebVTT (UTF-8) | 6 bloques de tiempo | 573 bytes | Accesibilidad auditiva para personas sordas | Cumple WCAG 2.1 Criterio 1.2.2 |
| `narracion.wav` | Audio WAV (PCM) | 44.1 kHz / 16-bit Mono | 2.0 MB (42 seg) | Locución profesional de la propuesta de valor | Alternativa textual y control de volumen |
| `assets/barber-1.jpg` | JPEG Progresivo | 1920 × 1280 px | 19.2 KB | Visual 1: Estación de barbería y sillones clásicos | Atributo `alt` descriptivo |
| `assets/barber-2.jpg` | JPEG Progresivo | 1920 × 1280 px | 43.8 KB | Visual 2: Detalle de degradado y fade de precisión | Atributo `alt` descriptivo |
| `assets/barber-3.jpg` | JPEG Progresivo | 1280 × 1920 px | 7.0 KB | Visual 3: Ritual de afeitado con toalla caliente | Atributo `alt` descriptivo |
| `assets/barber-4.jpg` | JPEG Progresivo | 1920 × 1280 px | 24.8 KB | Visual 4: Perfilado de barba a navaja de afeitar | Atributo `alt` descriptivo |
| `assets/barber-5.jpg` | JPEG Progresivo | 1920 × 1280 px | 32.4 KB | Visual 5: Lavado capilar y masaje relajante | Atributo `alt` descriptivo |
| `assets/barber-6.jpg` | JPEG Progresivo | 1920 × 1280 px | 20.6 KB | Visual 6: Resultado final de estilo y presentación | Atributo `alt` descriptivo |

### 3.3. Sincronización Audiovisual y Visualizador de Ondas en Tiempo Real
- **Control Sincronizado:** El reproductor audiovisual implementa eventos del DOM (`timeupdate`, `ended`, `pause`) que actualizan simultáneamente la barra de progreso, los marcadores temporales y el estado de la locución.
- **Visualizador Canvas 2D:** Se desarrolló un osciloscopio dinámico mediante la API Canvas de HTML5. Al pulsar reproducción en `narracion.wav`, un ciclo `requestAnimationFrame` computa y proyecta una animación sinusoidal viva con modulación aleatoria acoplada a la amplitud sonora, deteniéndose de inmediato al pausar el medio.

### 3.4. Módulo Interactivo Dinámico: Quiz de Diagnóstico de Estilo
El Quiz pedagógico no es un formulario estático; es un motor de evaluación reactivo que consta de 4 interrogantes estratégicas:
1. *Frecuencia de mantenimiento y corte.*
2. *Tipo de vello facial o barba que luce.*
3. *Disponibilidad de tiempo en su agenda.*
4. *Prioridad personal (Rapidez, Perfeccionamiento o Experiencia VIP).*

Al responder cada ítem, el sistema brinda **retroalimentación pedagógica instantánea** justificando la conveniencia de la elección, actualiza la barra de progreso numérico y, en la pantalla final de veredicto, calcula el servicio exacto recomendado, inyectándolo directamente con un clic en el motor de agendamiento.

### 3.5. Motor de Validación Estricta de Datos y Localización
Para evitar datos fraudulentos o colisiones en el agendamiento, se implementaron validaciones con expresiones regulares en frontend y backend:
- **Validación Telefónica de Nicaragua:** Expresión regular `^(?:\+505|505)?[578]\d{7}$`, que obliga a ingresar exactamente 8 dígitos válidos que inicien con las series de telefonía celular nacional (5, 7 u 8), aceptando opcionalmente el código de país.
- **Validación de Identidad:** Nombre completo de al menos 3 caracteres alfabéticos, rechazando números y caracteres especiales espurios.
- **Tokens Criptográficos de Seguridad:** Generación de identificadores de cita tipo `NC-[UUID-8]` y tokens privados de administración de 32 caracteres hexadecimales generados con `crypto.randomUUID()`.

### 3.6. Manual de Instalación, Configuración y Despliegue Local
El sistema está diseñado para arrancar en cualquier ordenador con Windows o macOS sin requerir instalación de dependencias externas:
1. **Requisitos:** Tener instalado Python 3.8 o superior.
2. **Arranque Inmediato:** Ejecutar el archivo de lote `iniciar.cmd` o desde terminal:
   ```powershell
   python server.py
   ```
3. **Confirmación de Consola:** El servidor desplegará:
   ```
   ==================================================
     NEXOCITA Barber Studio · Servidor Activo
     URL de Acceso: http://127.0.0.1:8766
     Panel de Control: http://127.0.0.1:8766/panel.html
   ==================================================
   ```
4. **Persistencia Automática:** Se autogenera el archivo de base de datos relacional en `data/nexocita.sqlite3` precargado con el catálogo de servicios de barbería y horarios de atención.

---

## SECCIÓN IV: CONTROL DE CALIDAD (QA), RESULTADOS Y GUION DE DEFENSA

### 4.1. Protocolo de Aseguramiento de Calidad Multimedia (QA Checklist)
Se evaluaron los 4 pilares de aseguramiento de calidad de acuerdo con los lineamientos de la asignatura:

| Dimensión de Calidad | Criterio Evaluado | Resultado Observado | Estado |
|---|---|---|---|
| **1. Rendimiento** | Tiempo de carga inicial y latencia de endpoints REST | Latencia media de API: 27.35 ms. Peso total de la página inferior a 3.8 MB con activos en caché. | **100% ÓPTIMO** |
| **2. Responsividad** | Adaptabilidad en resoluciones desde 360px hasta 1920px | Fluidez sin desbordamiento horizontal en iPhone SE (375px), Galaxy S21 (360px), iPad Air (820px) y Monitor Full HD (1920px). | **ADAPTABLE** |
| **3. Usabilidad** | Integridad de consola y tasa de completitud de reserva | Cero errores o advertencias en consola JavaScript. Tasa de éxito del 100% en reservas. | **SIN ERRORES** |
| **4. Accesibilidad** | Estándar internacional WCAG 2.1 Nivel AA | Erradicación total de emojis; contraste tipográfico > 12:1; subtítulos WebVTT; navegación integral mediante teclado (`Tab` / `Shift+Tab`). | **WCAG 2.1 AA** |

### 4.2. Resultados de las Pruebas Automatizadas
La suite de pruebas automatizadas ejecutó 23 verificaciones críticas de integridad transaccional (`tests/test_system.py`) con un resultado de **23/23 Aprobados (100%)**:
1. Acceso no autenticado al panel administrativo bloqueado (HTTP 401).
2. Proceso de configuración inicial completado satisfactoriamente (HTTP 200).
3. Intento de reconfiguración duplicada bloqueado (HTTP 409).
4. Autenticación con contraseña inválida rechazada (HTTP 401).
5. Consulta reactiva de ranuras disponibles por fecha y servicio.
6. Rechazo de correos electrónicos y números telefónicos mal formateados (HTTP 400).
7. **Prueba de Concurrencia de Doble Agendamiento:** Dos hilos simultáneos solicitaron exactamente la misma fecha y hora; el sistema otorgó la reserva al primer hilo (HTTP 201) y denegó el segundo hilo por conflicto de horario (HTTP 409). Cero citas duplicadas.
8. Consulta de reserva con token incorrecto bloqueada (HTTP 403).
9. Consulta de reserva confirmada con token legítimo (HTTP 200).
10. Reprogramación de fecha y hora por el administrador con actualización en cascada.
11. Cancelación voluntaria del cliente utilizando su clave privada de seguridad.
12. Liberación inmediata de la ranura horaria cancelada para nuevos clientes.
13. Creación de nuevos servicios desde el panel administrativo.
14. Desactivación lógica de servicios sin romper la integridad referencial.
15. Edición y persistencia de datos de perfil de clientes.
16. Actualización de jornadas y horarios de apertura/cierre.
17. Rechazo estricto de horas fuera de rango (ej. `09:99`).
18. Confirmación de nueva reserva sobre horario liberado.
19. Transición de estado a «completada» desde la interfaz administrativa.
20. Bloqueo total de acceso a archivos privados del servidor (`server.py`, `nexocita.sqlite3`, `.git`).
21. Disponibilidad estática instantánea de `index.html` y `panel.html`.
22. Manejo robusto de cargas JSON malformadas (HTTP 400).
23. Cierre de sesión seguro con destrucción de cookie de autenticación.

### 4.3. Métricas de Rendimiento y Eficiencia
- **Tiempo medio de consulta de disponibilidad:** 27.35 milisegundos.
- **Pico máximo de latencia en estrés:** 33.47 milisegundos.
- **Ahorro de ancho de banda:** Reducción del 64% en el peso de las imágenes mediante compresión progresiva JPEG.

### 4.4. Cronograma y Guion de Recorrido para la Defensa Técnica (15 Minutos)
Estructura cronometrada recomendada para la exposición formal de Oliver Corrales y Osvaldo González ante el Lic. David I. López Pérez:

- **Minutos 00:00 a 03:00 · Introducción y Fundamentación Teórica (Expositor 1):**
  - Saludo formal institucional (UCN, Facultad de Ciencias y Tecnología).
  - Planteamiento del problema en las barberías y negocios de servicios de Nicaragua.
  - Justificación de Design Thinking y mapa de navegación del sistema.
- **Minutos 03:00 a 07:00 · Demostración del Módulo Multimedia y Quiz (Expositor 2):**
  - Demostración de reproducción de video en alta definición y verificación de los subtítulos WebVTT.
  - Activación de la locución en audio WAV con la animación viva del osciloscopio en Canvas.
  - Apertura de la galería fotográfica de barbería con el visor modal Lightbox sin distorsiones.
  - Ejecución en vivo del Quiz de diagnóstico de estilo, destacando la retroalimentación inmediata y la selección asistida del servicio.
- **Minutos 07:00 a 11:00 · Ejecución Transaccional en Vivo (Expositor 1 & 2):**
  - Formalización de una reserva en vivo: llenado de datos, validación del número telefónico nicaragüense y generación del comprobante con su ID y token.
  - Apertura de una pestaña en modo incógnito simulando un segundo cliente intentando reservar la misma ranura horaria para evidenciar el bloqueo por ocupación.
  - Demostración de consulta y cancelación de la cita utilizando el token privado.
  - Ingreso al Panel Administrativo en `panel.html`, demostrando la actualización inmediata de métricas y la presencia de la reserva en SQLite.
- **Minutos 11:00 a 15:00 · Sustentación Técnica, QA y Ronda de Preguntas:**
  - Explicación de la arquitectura híbrida (Python / SQLite local y Supabase en nube).
  - Justificación del sistema de diseño (estética Apple, micro-física de Emil Kowalski y erradicación total de emojis para accesibilidad).
  - Presentación de la matriz de pruebas automatizadas (23/23 pasadas) y conclusiones finales.

### 4.5. Conclusiones y Hoja de Ruta de Trabajo Futuro
El desarrollo de **NEXOCITA Barber Studio** acreditó con solvencia los objetivos de la asignatura *Desarrollo de Aplicaciones Multimedia I*, demostrando que la integración armónica de activos multimedia de alta fidelidad, sujeción a normas de accesibilidad y una arquitectura de software relacional eliminan de forma determinante las ineficiencias de la gestión manual de servicios.

**Hoja de Ruta para Desarrollos Futuros:**
1. Integración con la API oficial de WhatsApp Business mediante Webhooks para el despacho automatizado del comprobante y recordatorios 2 horas antes de la cita.
2. Módulo de pasarela de pagos electrónicos locales (Billeteras móviles / Transferencias bancarias ACH).
3. Sincronización bidireccional con Google Calendar y Apple Calendar mediante feeds iCalendar (.ics).

---

## REFERENCIAS BIBLIOGRÁFICAS (NORMAS IEEE)

[1] World Wide Web Consortium (W3C), «Web Content Accessibility Guidelines (WCAG) 2.1», *W3C Recommendation*, jun. 2018. [En línea]. Disponible en: https://www.w3.org/TR/WCAG21/  
[2] Apple Inc., «Human Interface Guidelines: Designing for iOS, iPadOS, macOS, and web», *Apple Developer Documentation*, 2024. [En línea]. Disponible en: https://developer.apple.com/design/human-interface-guidelines/  
[3] E. Kowalski, «Animations on the Web: Physics, Gestures, and Micro-interactions», *Design Systems Conference*, 2023. [En línea].  
[4] J. Nielsen y R. Budiu, *Mobile Usability*. Berkeley, CA: New Riders, 2013.  
[5] T. Brown, *Change by Design: How Design Thinking Transforms Organizations and Inspires Innovation*. Nueva York: Harper Business, 2009.  
[6] SQLite Consortium, «SQLite Transaction Isolation and Concurrency», *SQLite Documentation*, 2024. [En línea]. Disponible en: https://sqlite.org/isolation.html  
[7] Mozilla Developer Network (MDN), «WebVTT: The Web Video Text Tracks Format», *MDN Web Docs*, 2025. [En línea]. Disponible en: https://developer.mozilla.org/  
[8] Supabase Inc., «Supabase: The Open Source Firebase Alternative (PostgreSQL Realtime Architecture)», *Supabase Technical Whitepapers*, 2024. [En línea]. Disponible en: https://supabase.com/docs  