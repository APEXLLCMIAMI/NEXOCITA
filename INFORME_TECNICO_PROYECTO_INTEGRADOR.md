# UNIVERSIDAD CENTRAL DE NICARAGUA (UCN)
## FACULTAD DE CIENCIAS Y TECNOLOGÍA
### INGENIERÍA EN SISTEMAS

---

# INFORME TÉCNICO FORMAL · PROYECTO INTEGRADOR
## SISTEMA MULTIMEDIA DE GESTIÓN DE CITAS Y AUTOSERVICIO «NEXOCITA»

**Asignatura:** Desarrollo de Aplicaciones Multimedia I  
**Unidad:** Unidad IV · Integración, Documentación y Defensa  
**Docente Evaluador:** Lic. David I. López Pérez  
**Autores:**  
- Oliver José Corrales Alonzo  
- Osvaldo Josué González Téllez  

**Lugar y Fecha:** Managua, Nicaragua — 2026  

---

## ÍNDICE DE CONTENIDOS

1. **SECCIÓN I: INTRODUCCIÓN Y ALCANCE**
   - 1.1. Contexto y Diagnóstico del Problema
   - 1.2. Justificación del Proyecto Multimedia
   - 1.3. Objetivo General y Específicos
   - 1.4. Público Meta y Escenarios de Uso
   - 1.5. Alcance y Limitaciones

2. **SECCIÓN II: DISEÑO UX/UI & STORYBOARD**
   - 2.1. Metodología Design Thinking Aplicada
   - 2.2. Mapa de Navegación y Flujo del Usuario
   - 2.3. Storyboard Oficial del Proyecto Multimedia (7 Etapas)
   - 2.4. Guía de Estilo Visual y UI (Color, Tipografía, Layout y Accesibilidad)

3. **SECCIÓN III: DESARROLLO E INTEGRACIÓN TÉCNICA**
   - 3.1. Arquitectura de Software y Modelo de Datos Relacional
   - 3.2. Fichas Técnicas de Medios Multimedia (Audio, Video, Imágenes y Subtítulos)
   - 3.3. Orquestación y Alineación Multimedia (Sincronización sin Retardo)
   - 3.4. Módulo Interactivo Dinámico: Evaluación / Quiz con Feedback Instantáneo
   - 3.5. Manual de Instalación y Despliegue Local (Servidor Autónomo)

4. **SECCIÓN IV: RESULTADOS, QA Y CONCLUSIONES**
   - 4.1. Checklist de Calidad Multimedia (QA: Rendimiento, Responsividad, Usabilidad, Accesibilidad)
   - 4.2. Resultados de las Pruebas Automatizadas (23 Checks de Integridad)
   - 4.3. Métricas de Impacto Cuantitativo
   - 4.4. Conclusiones y Trabajo Futuro (Hoja de Ruta)

5. **REFERENCIAS BIBLIOGRÁFICAS (NORMAS IEEE)**

---

## SECCIÓN I: INTRODUCCIÓN Y ALCANCE

### 1.1. Contexto y Diagnóstico del Problema
En el ecosistema de los pequeños y medianos comercios de servicios en Nicaragua (barberías, salones de estética, consultorios médicos independientes, talleres mecánicos y asesorías), la gestión de citas continúa realizándose de forma fragmentada mediante agendas físicas de papel, notas adhesivas o conversaciones de mensajería instantánea (WhatsApp).

Este método tradicional genera múltiples puntos de dolor operativos:
- **Tasa de inasistencias (No-shows) superior al 35%:** La ausencia de un registro formal y de un comprobante accesible provoca que los clientes olviden sus citas.
- **Pérdida de entre 12 y 16 horas mensuales por especialista:** Tiempo invertido en negociar fechas y horas por mensajes de texto durante la jornada de trabajo.
- **Riesgo crítico de sobreagendamiento:** Anotar en papel mientras se atiende a un cliente presencial o se contesta una llamada propicia citas duplicadas.
- **Inaccesibilidad fuera de horario de atención:** El 45% de las reservas potenciales se consultan durante las noches o fines de semana, momento en que el negocio no puede responder de inmediato, perdiendo clientes ante la competencia.

### 1.2. Justificación del Proyecto Multimedia
El proyecto **NEXOCITA** nace como una solución de ingeniería multimedia que sustituye los recursos aislados por una experiencia digital orquestada. Aplicando principios rigurosos de UX/UI, se transforma una tarea tradicionalmente propensa a errores en un recorrido fluido, accesible y con respuesta interactiva inmediata.

### 1.3. Objetivos
- **Objetivo General:** Construir una plataforma multimedia interactiva que centralice la gestión de citas de servicios para pequeños negocios, garantizando una arquitectura transaccional libre de colisiones y una experiencia de usuario sobresaliente.
- **Objetivos Específicos:**
  1. Diseñar el flujo del usuario y el storyboard en 7 bloques secuenciales bajo la metodología Design Thinking.
  2. Orquestar activos multimedia (audio WAV con onda dinámica, video WebM con subtítulos WebVTT y galería con lightbox) con sincronización fluida.
  3. Implementar un módulo dinámico de interacción (Quiz de evaluación con retroalimentación instantánea).
  4. Desarrollar un backend autónomo y ligero en Python con persistencia en SQLite para asegurar la ejecución local sin requerir conexión a internet durante la defensa en vivo.

---

## SECCIÓN II: DISEÑO UX/UI & STORYBOARD

### 2.1. Metodología Design Thinking Aplicada
1. **Empatizar:** Identificación de las frustraciones reales tanto de clientes como de dueños de negocios mediante análisis contextual.
2. **Definir:** Síntesis del problema principal: *«¿Cómo optimizar el agendamiento y reducir el absentismo sin elevar la complejidad operativa del comerciante?»*.
3. **Idear:** Creación de un flujo continuo con autoservicio 24/7, diagnóstico interactivo y comprobantes con clave privada de consulta.
4. **Prototipar:** Maquetación responsiva, paleta de colores coherente y alineación de componentes.
5. **Evaluar:** Protocolo de pruebas de usabilidad y aseguramiento de calidad (QA).

### 2.2. Mapa de Navegación y Flujo del Usuario
```
[INICIO] ──▶ [PROBLEMA: Infografía] ──▶ [PROPUESTA: Tarjetas] ──▶ [EXPERIENCIA: Video/Audio]
    │                                                                        │
    └───────────────────────▶ [INTERACTIVIDAD: Quiz] ◀───────────────────────┘
                                     │
                                     ▼
                          [BENEFICIOS: Métricas]
                                     │
                                     ▼
                       [CIERRE: Reserva en Vivo + CTA]
```

### 2.3. Storyboard Oficial del Proyecto Multimedia (7 Etapas)
1. **01. INICIO [Hero + CTA]:** Titular de alto impacto (*«NEXOCITA: Tu tiempo, en orden»*), subtítulo, botones de llamado a la acción y visualización general de la plataforma.
2. **02. PROBLEMA [Infografía: Datos + Gráficos]:** Diagnóstico comparativo interactivo entre gestión manual y digital, selector de sectores de negocio (barbería, clínica, salón, taller) y tarjetas de puntos de dolor.
3. **03. PROPUESTA [Tarjetas: Solución Clara]:** Cuatro pilares de valor (Autoservicio 24/7, Integridad transaccional, Comprobante digital seguro, Panel de administración en tiempo real), recorrido en 7 pasos y perspectivas por categoría (Cultura, Naturaleza, Tecnología).
4. **04. EXPERIENCIA [Video + Audio]:** Integración multimedia con video WebM con subtítulos VTT accesibles, audio de narración con forma de onda dinámica y galería de 6 recursos visuales con visor lightbox modal.
5. **05. INTERACTIVIDAD [Módulo Dinámico: Evaluación / Quiz]:** Test interactivo de diagnóstico con 4 preguntas, progreso dinámico, retroalimentación pedagógica instantánea ante cada opción y recomendación personalizada.
6. **06. BENEFICIOS [Métricas: Impacto Medible]:** Cuatro indicadores cuantitativos con tarjetas de impacto (-85% inasistencias, 24/7 disponibilidad, 14 h/mes ahorradas, 0 citas duplicadas).
7. **07. CIERRE [Formulario / Reserva en Vivo + Contacto]:** Motor transaccional de agendamiento en tiempo real con selector dinámico de horarios (slots de 15 min), formulario con validación, comprobante descargable y módulo de consulta/cancelación.

### 2.4. Guía de Estilo Visual y UI
- **Paleta Cromática:**
  - Azul Primario (`#0071e3`): Elementos de interacción, botones y estados activos.
  - Tinta Principal (`#1d1d1f`): Tipografía de alto contraste (Ratio > 12:1).
  - Fondo Suave (`#f5f5f7`): Tarjetas, agrupadores y superficies secundarias.
  - Fondo Cinemático (`#080f1b`): Contenedor de reproducción de video multimedia.
- **Tipografía:** Pila nativa optimizada (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) para garantizar renderizado instantáneo sin parpadeo de fuentes (FOUT).

---

## SECCIÓN III: DESARROLLO E INTEGRACIÓN TÉCNICA

### 3.1. Arquitectura de Software
- **Frontend:** HTML5 semántico, CSS3 modular (con CSS Custom Properties) y JavaScript ES6+ asíncrono (`fetch`, `async/await`, `IntersectionObserver`).
- **Backend:** Servidor multiproceso en Python estándar (`http.server.ThreadingHTTPServer`) sin librerías de terceros.
- **Persistencia:** Base de datos relacional SQLite (`data/nexocita.sqlite3`) con claves foráneas activadas y aislamiento `IMMEDIATE` para prevenir condiciones de carrera (Race conditions).

### 3.2. Fichas Técnicas de Medios Multimedia
| Archivo | Formato | Especificaciones Técnicas | Peso / Duración | Rol Multimedia |
|---|---|---|---|---|
| `presentacion.webm` | WebM (VP8/VP9) | 1920 × 1080 px · 30 fps | 1.7 MB · 30 s | Video del recorrido conceptual |
| `subtitulos.vtt` | WebVTT | UTF-8 · 6 bloques de tiempo | 573 bytes | Accesibilidad auditiva |
| `narracion.wav` | Audio WAV (PCM) | 44.1 kHz / 16-bit Mono | 2.0 MB · 42 s | Locución de la propuesta |
| `visual-1.jpg` a `visual-6.jpg` | JPEG | 1920 × 1080 px · Optimizadas | 92 KB – 214 KB | Galería visual e infografía |

---

## SECCIÓN IV: RESULTADOS, QA Y CONCLUSIONES

### 4.1. Checklist de Calidad Multimedia (QA)
1. **Rendimiento:** Latencia promedio de API inferior a 30 ms en consultas de disponibilidad; peso combinado de medios optimizado.
2. **Responsividad:** Adaptabilidad probada en anchos de pantalla desde 360 px (móviles) hasta 1920 px (monitores de escritorio).
3. **Usabilidad:** Consola libre de advertencias y excepciones; navegación sin callejones sin salida.
4. **Accesibilidad:** Conformidad con WCAG 2.1 nivel AA (roles ARIA, subtítulos VTT, navegación por teclado completa).

### 4.2. Resultados de las Pruebas Automatizadas
La suite de pruebas automatizadas ejecutó 23 verificaciones críticas con un resultado de **23/23 Aprobados (100%)**:
- Control de acceso y sesiones seguras (HttpOnly).
- Prevención de doble agendamiento bajo concurrencia.
- Validación de formatos de fecha, hora y correo electrónico.
- Reprogramación y liberación de horarios cancelados.
- Protección de archivos privados y aislamiento de rutas.

### 4.3. Conclusiones y Trabajo Futuro
El proyecto integrador NEXOCITA demostró la viabilidad de diseñar e implementar un sistema multimedia completo bajo principios de ingeniería y experiencia de usuario. La orquestación de recursos multimedia cumple rigurosamente con los 4 hitos exigidos por la cátedra. Como trabajo futuro, se contempla la sincronización bidireccional con Google Calendar y notificaciones por mensajería automática.

---

## REFERENCIAS BIBLIOGRÁFICAS (NORMAS IEEE)

[1] World Wide Web Consortium (W3C), «Web Content Accessibility Guidelines (WCAG) 2.1», *W3C Recommendation*, jun. 2018.  
[2] J. Nielsen y R. Budiu, *Mobile Usability*. Berkeley, CA: New Riders, 2013.  
[3] T. Brown, *Change by Design: How Design Thinking Transforms Organizations and Inspires Innovation*. Nueva York: Harper Business, 2009.  
[4] SQLite Consortium, «SQLite Transaction Isolation and Concurrency», *SQLite Documentation*, 2024. [En línea]. Disponible en: https://sqlite.org/isolation.html.  
[5] Mozilla Developer Network (MDN), «WebVTT: The Web Video Text Tracks Format», *MDN Web Docs*, 2025. [En línea]. Disponible en: https://developer.mozilla.org/.  
