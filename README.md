# NEXOCITA · Sistema Multimedia de Gestión de Citas

> **Universidad Central de Nicaragua (UCN)**  
> **Facultad de Ciencias y Tecnología — Ingeniería en Sistemas**  
> **Asignatura:** Desarrollo de Aplicaciones Multimedia I  
> **Docente Evaluador:** Lic. David I. López Pérez  
> **Autores:** Oliver José Corrales Alonzo & Osvaldo Josué González Téllez  
> **Año Académico:** 2026  

---

## 📌 Descripción del Proyecto
**NEXOCITA** es una solución web multimedia e interactiva orientada a resolver el cuello de botella en la gestión de citas de pequeños negocios (barberías, clínicas, salones de belleza y talleres). Sustituye la dispersión de mensajes manuales y notas en papel por una plataforma centralizada con autoservicio 24/7, validación transaccional sin colisiones y orquestación multimedia alineada.

---

## 🎬 Flujo de Navegación y Storyboard Oficial (7 Etapas)
1. **01. INICIO [Hero + CTA]:** Titular de alto impacto, propuesta de valor y botones directos de acción.
2. **02. PROBLEMA [Infografía: Datos + Gráficos]:** Diagnóstico visual interactivo por tipo de negocio con gráficos comparativos de inasistencias y tiempo perdido.
3. **03. PROPUESTA [Tarjetas: Solución Clara]:** Pilares de solución, recorrido del usuario en 7 pasos y perspectivas por categoría (Cultura, Naturaleza, Tecnología).
4. **04. EXPERIENCIA MULTIMEDIA [Video + Audio + Galería]:**
   - Video WebM con subtítulos WebVTT sincronizados.
   - Audio WAV con narración clara y forma de onda interactiva.
   - Galería de 6 recursos visuales con visor modal Lightbox accesible.
5. **05. INTERACTIVIDAD [Módulo Dinámico: Evaluación / Quiz]:** Test de diagnóstico interactivo con 4 preguntas, retroalimentación instantánea ante cada opción y recomendación personalizada.
6. **06. BENEFICIOS [Métricas: Impacto Medible]:** Métricas operativas clave (-85% inasistencias, 24/7 disponibilidad, 14 h/mes ahorradas, 0 citas dobles).
7. **07. CIERRE / CTA & RESERVA EN VIVO:** Motor de reservas en tiempo real con selector de fecha, horarios dinámicos, emisión de comprobante y consulta/cancelación de citas.

---

## 🚀 Instrucciones de Instalación y Despliegue Local
El sistema está diseñado bajo un enfoque **autónomo y sin dependencias externas pesadas**, garantizando que la defensa en vivo no dependa de conexión a internet.

### Opción 1: Ejecución Rápida (Windows)
Hacer doble clic en el archivo:
```bat
iniciar.cmd
```

### Opción 2: Ejecución por Terminal
```bash
python server.py
```
El servidor confirmará en la consola:
```
NEXOCITA listo en http://127.0.0.1:8766
```

### Accesos del Sistema:
- **Página Principal del Cliente:** [http://127.0.0.1:8766/index.html](http://127.0.0.1:8766/index.html)
- **Panel Administrativo del Negocio:** [http://127.0.0.1:8766/panel.html](http://127.0.0.1:8766/panel.html)
- **Memoria Técnica y Documentación (Hito 2):** [http://127.0.0.1:8766/documentacion.html](http://127.0.0.1:8766/documentacion.html)

---

## 📂 Estructura del Repositorio
```text
nexocita/
├── assets/                  # Medios multimedia (video .webm, audio .wav, subtitulos .vtt, visual-1 a 6)
├── data/                    # Base de datos SQLite (nexocita.sqlite3)
├── docs/                    # Reportes de calidad QA (qa-resultados.json)
├── tests/                   # Pruebas automatizadas de integridad (test_system.py)
├── app.js                   # Lógica de interacción, infografía, tabs y motor de quiz
├── booking.js               # Motor de reservas, validación de horarios y comprobante
├── documentacion.html       # Memoria técnica formal y especificaciones (Hito 2)
├── index.html               # Página web interactiva con el Storyboard completo
├── panel.html               # Panel de control administrativo del negocio
├── panel.js                 # Lógica del panel de administración
├── server.py                # Servidor HTTP REST y API en Python estándar con SQLite
├── styles.css               # Sistema de diseño, tokens, componentes y responsividad
├── system.css               # Estilos del sistema de reservas y panel
├── iniciar.cmd              # Script de arranque rápido para Windows
├── INFORME_TECNICO_PROYECTO_INTEGRADOR.md  # Informe formal bajo normas IEEE
└── README.md                # Documentación del repositorio
```

---

## 🧪 Control de Calidad y Pruebas (QA)
- **23/23 Checks Aprobados** en la suite automatizada `tests/test_system.py`.
- **Accesibilidad:** Conformidad WCAG 2.1 nivel AA con roles ARIA, navegación por teclado y etiquetas ALT.
- **Rendimiento:** Tiempos de respuesta de API inferiores a 30 ms.