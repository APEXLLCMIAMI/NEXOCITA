// NEXOCITA - Script Principal de Experiencia e Interacción Multimedia
// Universidad Central de Nicaragua (UCN) · Proyecto Integrador 2026

// --- 1. TABS DE CATEGORÍA MULTIMEDIA (Cultura, Naturaleza, Tecnología) ---
const content = {
  cultura: {
    tag: 'CULTURA DEL SERVICIO',
    title: 'Detrás de cada cita,\nhay una persona.',
    text: 'Barberías, salones de belleza, clínicas, talleres, consultorios y profesionales independientes. Negocios distintos que comparten algo: el valor de atender bien.',
    detail: '7 perfiles de negocio · Una agenda compartida',
    image: 6,
    alt: 'Comparación de la gestión manual y digital en una barbería'
  },
  naturaleza: {
    tag: 'EL VALOR DE LOS RECURSOS',
    title: 'Menos papel.\nMás espacio para lo esencial.',
    text: 'La agenda digital propone sustituir las notas sueltas y las hojas de cálculo dispersas. Una mirada al uso consciente del papel y a la organización de los recursos cotidianos, sin atribuir al proyecto un impacto ambiental que no se ha medido.',
    detail: 'Una reflexión sobre hábitos y recursos',
    image: 2,
    alt: 'Agenda de papel, notas adhesivas y dispositivos sobre un escritorio'
  },
  tecnologia: {
    tag: 'TECNOLOGÍA CON PROPÓSITO',
    title: 'Una sola plataforma.\nTodo bajo control.',
    text: 'Una interfaz adaptable, una API que centraliza la lógica y una base de datos para almacenar la información. La propuesta conecta al cliente con el negocio desde el ordenador o el teléfono.',
    detail: 'Usuario · Frontend · API / Backend · Base de datos',
    image: 5,
    alt: 'Propuesta del panel de NEXOCITA con calendario y métricas'
  }
};

const categoryTabs = [...document.querySelectorAll('.tabs [role=tab]')];
function selectCategory(tab) {
  categoryTabs.forEach(t => {
    t.setAttribute('aria-selected', String(t === tab));
    t.tabIndex = t === tab ? 0 : -1;
  });
  const item = content[tab.dataset.category];
  if (!item) return;
  const tagEl = document.querySelector('#category-tag');
  if (tagEl) tagEl.textContent = item.tag;
  const title = document.querySelector('#category-title');
  if (title) {
    title.textContent = item.title;
    title.style.whiteSpace = 'pre-line';
  }
  const textEl = document.querySelector('#category-text');
  if (textEl) textEl.textContent = item.text;
  const detailEl = document.querySelector('#category-detail');
  if (detailEl) detailEl.textContent = item.detail;
  const img = document.querySelector('#category-image');
  if (img) {
    img.src = `assets/visual-${item.image}.jpg`;
    img.alt = item.alt;
  }
  const panel = document.querySelector('#category-panel');
  if (panel) panel.setAttribute('aria-labelledby', tab.id);
}

categoryTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCategory(tab));
  tab.addEventListener('keydown', e => {
    let target;
    if (e.key === 'ArrowRight') target = (index + 1) % categoryTabs.length;
    if (e.key === 'ArrowLeft') target = (index + categoryTabs.length - 1) % categoryTabs.length;
    if (e.key === 'Home') target = 0;
    if (e.key === 'End') target = categoryTabs.length - 1;
    if (target !== undefined) {
      e.preventDefault();
      categoryTabs[target].focus();
      selectCategory(categoryTabs[target]);
    }
  });
});

// --- 2. GALERÍA MULTIMEDIA Y LIGHTBOX MODAL ---
const cards = [...document.querySelectorAll('.gallery-card')];
const dialog = document.querySelector('#lightbox');
let currentImage = 0;

function showImage(index) {
  if (!cards.length) return;
  currentImage = (index + cards.length) % cards.length;
  const card = cards[currentImage];
  const lightboxImg = document.querySelector('#lightbox-image');
  const lightboxTitle = document.querySelector('#lightbox-title');
  if (lightboxImg) {
    lightboxImg.src = `assets/visual-${card.dataset.image}.jpg`;
    lightboxImg.alt = card.querySelector('img').alt;
  }
  if (lightboxTitle) {
    lightboxTitle.textContent = `${currentImage + 1} / ${cards.length} · ${card.dataset.title}`;
  }
}

if (dialog) {
  cards.forEach((card, index) => card.addEventListener('click', () => {
    showImage(index);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }));

  const closeDialogBtn = document.querySelector('.close-dialog');
  if (closeDialogBtn) {
    closeDialogBtn.addEventListener('click', () => dialog.close());
  }

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
  });

  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        dialog.close();
      }
    }
  });

  const prevBtn = document.querySelector('#previous-image');
  const nextBtn = document.querySelector('#next-image');
  if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentImage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentImage + 1));

  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') showImage(currentImage + 1);
    if (e.key === 'ArrowLeft') showImage(currentImage - 1);
  });
}

// --- 3. FORMA DE ONDA DE AUDIO Y SINCRONIZACIÓN DE MEDIOS ---
const wave = document.querySelector('.waveform');
if (wave) {
  for (let i = 0; i < 43; i++) {
    const bar = document.createElement('i');
    bar.style.setProperty('--height', `${12 + Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.34)) * 62}px`);
    bar.style.setProperty('--delay', `${(i % 7) * 0.1}s`);
    wave.append(bar);
  }
}

const audio = document.querySelector('audio');
const video = document.querySelector('video');
const audioCard = document.querySelector('.audio-card');

if (audio && video) {
  audio.addEventListener('play', () => {
    video.pause();
    if (audioCard) audioCard.classList.add('playing');
  });
  ['pause', 'ended'].forEach(event => {
    audio.addEventListener(event, () => {
      if (audioCard) audioCard.classList.remove('playing');
    });
  });
  video.addEventListener('play', () => audio.pause());
}

// --- 4. SEGUIMIENTO DE STORYBOARD Y NAVEGACIÓN ACTIVA ---
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sbItems = [...document.querySelectorAll('.storyboard-step-item')];

const sectionIds = ['inicio', 'problema', 'propuesta', 'multimedia', 'interactividad', 'beneficios', 'reserva', 'documentacion', 'contacto'];
const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      // Actualizar nav principal
      navLinks.forEach(a => {
        if (a.hash === `#${id}`) a.setAttribute('aria-current', 'page');
        else if (a.hash.startsWith('#')) a.removeAttribute('aria-current');
      });
      // Actualizar storyboard tracker bar
      sbItems.forEach(item => {
        if (item.hash === `#${id}`) item.classList.add('active');
        else item.classList.remove('active');
      });
    }
  });
}, { rootMargin: '-20% 0px -50% 0px', threshold: 0 });

sections.forEach(s => observer.observe(s));

// --- 5. INFOGRAFÍA INTERACTIVA: SELECTOR DE PERFIL DE NEGOCIO (Hito 1 / Slide 13) ---
const bizProfiles = {
  barberia: {
    noShowManual: 38,
    noShowNexo: 4,
    timeManual: 15,
    timeNexo: 1.5,
    overlapManual: 30,
    overlapNexo: 0,
    critBadge: 'Crítico en horas punta'
  },
  clinica: {
    noShowManual: 42,
    noShowNexo: 5,
    timeManual: 22,
    timeNexo: 2.0,
    overlapManual: 25,
    overlapNexo: 0,
    critBadge: 'Pérdida de citas médicas'
  },
  salon: {
    noShowManual: 35,
    noShowNexo: 3,
    timeManual: 18,
    timeNexo: 1.2,
    overlapManual: 34,
    overlapNexo: 0,
    critBadge: 'Saturación en fines de semana'
  },
  taller: {
    noShowManual: 28,
    noShowNexo: 2,
    timeManual: 12,
    timeNexo: 1.0,
    overlapManual: 22,
    overlapNexo: 0,
    critBadge: 'Retraso en entrega de vehículos'
  }
};

const bizButtons = [...document.querySelectorAll('.biz-tab-btn')];
bizButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    bizButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const bizKey = btn.dataset.biz;
    const data = bizProfiles[bizKey];
    if (!data) return;

    // Actualizar barras
    const barManualNoShow = document.querySelector('#bar-manual-no-show');
    const valManualNoShow = document.querySelector('#val-manual-no-show');
    const barNexoNoShow = document.querySelector('#bar-nexo-no-show');
    const valNexoNoShow = document.querySelector('#val-nexo-no-show');

    if (barManualNoShow && valManualNoShow) {
      barManualNoShow.style.width = `${data.noShowManual}%`;
      valManualNoShow.textContent = `${data.noShowManual}%`;
    }
    if (barNexoNoShow && valNexoNoShow) {
      barNexoNoShow.style.width = `${data.noShowNexo}%`;
      valNexoNoShow.textContent = `${data.noShowNexo}%`;
    }

    const barManualTime = document.querySelector('#bar-manual-time');
    const valManualTime = document.querySelector('#val-manual-time');
    const barNexoTime = document.querySelector('#bar-nexo-time');
    const valNexoTime = document.querySelector('#val-nexo-time');

    if (barManualTime && valManualTime) {
      barManualTime.style.width = `${Math.min(data.timeManual * 4, 100)}%`;
      valManualTime.textContent = `${data.timeManual} h/mes`;
    }
    if (barNexoTime && valNexoTime) {
      barNexoTime.style.width = `${Math.min(data.timeNexo * 4, 100)}%`;
      valNexoTime.textContent = `${data.timeNexo} h/mes`;
    }

    const barManualOverlap = document.querySelector('#bar-manual-overlap');
    const valManualOverlap = document.querySelector('#val-manual-overlap');
    const barNexoOverlap = document.querySelector('#bar-nexo-overlap');
    const valNexoOverlap = document.querySelector('#val-nexo-overlap');

    if (barManualOverlap && valManualOverlap) {
      barManualOverlap.style.width = `${data.overlapManual}%`;
      valManualOverlap.textContent = `${data.overlapManual}%`;
    }
    if (barNexoOverlap && valNexoOverlap) {
      barNexoOverlap.style.width = `${data.overlapNexo}%`;
      valNexoOverlap.textContent = `${data.overlapNexo}%`;
    }

    const critBadge = document.querySelector('#stat-no-show-badge');
    if (critBadge) critBadge.textContent = data.critBadge;
  });
});

// --- 6. MÓDULO INTERACTIVO DINÁMICO: EVALUACIÓN / QUIZ (Slide 7, 8, 13 & Hito 1) ---
const quizQuestions = [
  {
    question: '1. ¿Cómo coordinas habitualmente las citas con tus clientes?',
    options: [
      { text: 'Anoto en un cuaderno, libreta o notas adhesivas sobre el mostrador.', score: 0, type: 'crit', feedback: 'Riesgo alto: las notas se traspapelan, se manchan o se pierden. No existe copia de respaldo.' },
      { text: 'Por WhatsApp personal y llamadas; respondo cuando tengo un hueco libre.', score: 1, type: 'crit', feedback: 'Fricción continua: pierdes hasta 15 horas al mes respondiendo y negociando horarios manualmente.' },
      { text: 'Tengo una hoja de cálculo básica (Excel/Google Sheets) que actualizo.', score: 2, type: 'med', feedback: 'Progreso parcial: es digital pero requiere que tú registres todo y los clientes no pueden autoservirse 24/7.' },
      { text: 'Uso una plataforma web centralizada con horarios en tiempo real.', score: 3, type: 'good', feedback: '¡Excelente práctica! Los clientes reservan sin intermediarios y tú solo consultas la agenda.' }
    ]
  },
  {
    question: '2. ¿Qué ocurre cuando un cliente desea agendar fuera de tu horario de atención?',
    options: [
      { text: 'El mensaje queda esperando hasta el día siguiente (y a veces el cliente busca otro negocio).', score: 0, type: 'crit', feedback: 'Pérdida de ingresos: el 45% de los usuarios busca agendar por la noche o durante sus descansos.' },
      { text: 'Respondo desde mi casa a deshoras interrumpiendo mi descanso y familia.', score: 1, type: 'crit', feedback: 'Saturación personal: mezclar vida privada con la gestión manual produce agotamiento profesional.' },
      { text: 'Tengo un mensaje automático de WhatsApp que les pide escribir en horario laboral.', score: 1, type: 'med', feedback: 'Alivio temporal pero el cliente aún debe esperar para confirmar su cupo y no hay reserva inmediata.' },
      { text: 'El cliente entra al enlace web, ve los horarios libres y reserva su cita de inmediato.', score: 3, type: 'good', feedback: 'Autoservicio 24/7 óptimo: tu negocio genera citas y organiza cupos mientras descansas.' }
    ]
  },
  {
    question: '3. ¿Te ha sucedido que dos clientes lleguen al mismo tiempo o falten sin avisar?',
    options: [
      { text: 'Sí, con frecuencia. Genera discusiones, retrasos y pérdida de dinero.', score: 0, type: 'crit', feedback: 'Punto crítico: el sobreagendamiento daña tu reputación profesional y satura tu capacidad.' },
      { text: 'A veces ocurre cuando respondo rápido y olvido verificar qué tenía apuntado.', score: 1, type: 'crit', feedback: 'Error humano natural: el cerebro no puede validar colisiones de tiempo con la precisión de un algoritmo.' },
      { text: 'Rara vez, porque reviso tres veces antes de confirmar, aunque me toma mucho tiempo.', score: 2, type: 'med', feedback: 'La verificación manual te consume energía cognitiva que deberías invertir en tu trabajo principal.' },
      { text: 'Nunca: el sistema bloquea automáticamente los horarios reservados en SQLite con validación ACID.', score: 3, type: 'good', feedback: 'Cero colisiones garantizado: el motor garantiza que un horario asignado no se puede duplicar.' }
    ]
  },
  {
    question: '4. ¿Cómo cancela o reprograma un cliente si tiene una emergencia?',
    options: [
      { text: 'No avisa; simplemente no llega y el espacio queda vacío sin poder reasignarse.', score: 0, type: 'crit', feedback: 'Tasa de no-show del 38%: cada espacio vacío es tiempo no recuperable de tu jornada laboral.' },
      { text: 'Debe llamarme o escribirme para coordinar otro día desde cero.', score: 1, type: 'crit', feedback: 'Fricción de salida: al cliente le da pena llamar o no tiene tiempo, por lo que prefiere no avisar.' },
      { text: 'Me avisa con tiempo si se acuerda, pero debo borrar y reescribir la agenda a mano.', score: 2, type: 'med', feedback: 'Proceso engorroso que vuelve a cargar la agenda manual de correcciones y borrones.' },
      { text: 'Usa su código y clave privada de consulta en la web para cancelar y el horario se libera solo.', score: 3, type: 'good', feedback: 'Autonomía y flexibilidad: el cliente libera el turno con un clic y otro cliente puede tomarlo al instante.' }
    ]
  }
];

let currentQuizIndex = 0;
let totalQuizScore = 0;
let selectedOptionScore = null;

const quizQuestionWrap = document.querySelector('#quiz-question-wrap');
const quizQuestionText = document.querySelector('#quiz-question-text');
const quizOptionsGroup = document.querySelector('#quiz-options');
const quizFeedbackBox = document.querySelector('#quiz-feedback');
const quizStepCount = document.querySelector('#quiz-step-count');
const quizScorePreview = document.querySelector('#quiz-score-preview');
const quizProgressBar = document.querySelector('#quiz-progress');
const quizNextBtn = document.querySelector('#quiz-next-btn');
const quizResultsWrap = document.querySelector('#quiz-results');
const quizRestartBtn = document.querySelector('#quiz-restart-btn');

function renderQuizQuestion() {
  const current = quizQuestions[currentQuizIndex];
  if (!current) {
    showQuizResults();
    return;
  }

  selectedOptionScore = null;
  if (quizNextBtn) quizNextBtn.disabled = true;
  if (quizFeedbackBox) {
    quizFeedbackBox.className = 'quiz-feedback-box';
    quizFeedbackBox.innerHTML = '';
  }

  if (quizStepCount) quizStepCount.textContent = `Pregunta ${currentQuizIndex + 1} de ${quizQuestions.length}`;
  if (quizScorePreview) quizScorePreview.textContent = `Puntaje acumulado: ${totalQuizScore} pts`;
  if (quizProgressBar) {
    const pct = ((currentQuizIndex + 1) / quizQuestions.length) * 100;
    quizProgressBar.style.width = `${pct}%`;
  }
  if (quizQuestionText) quizQuestionText.textContent = current.question;

  if (quizOptionsGroup) {
    quizOptionsGroup.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    current.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `
        <span class="quiz-opt-letter">${letters[idx]}</span>
        <span>${opt.text}</span>
      `;
      btn.addEventListener('click', () => {
        // Desmarcar otros
        quizOptionsGroup.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOptionScore = opt.score;

        // Retroalimentación inmediata
        if (quizFeedbackBox) {
          quizFeedbackBox.className = `quiz-feedback-box show ${opt.type === 'good' ? 'quiz-feedback-good' : 'quiz-feedback-crit'}`;
          quizFeedbackBox.innerHTML = `
            <strong>${opt.type === 'good' ? '✓ Impacto Positivo (+3 pts)' : '⚠️ Diagnóstico del Problema (+' + opt.score + ' pts)'}</strong>
            <p style="margin: 6px 0 0;">${opt.feedback}</p>
          `;
        }
        if (quizNextBtn) quizNextBtn.disabled = false;
      });
      quizOptionsGroup.appendChild(btn);
    });
  }
}

if (quizNextBtn) {
  quizNextBtn.addEventListener('click', () => {
    if (selectedOptionScore !== null) {
      totalQuizScore += selectedOptionScore;
    }
    currentQuizIndex++;
    if (currentQuizIndex < quizQuestions.length) {
      renderQuizQuestion();
    } else {
      showQuizResults();
    }
  });
}

function showQuizResults() {
  if (quizQuestionWrap) quizQuestionWrap.style.display = 'none';
  if (quizResultsWrap) quizResultsWrap.style.display = 'block';

  const badge = document.querySelector('#quiz-result-badge');
  const title = document.querySelector('#quiz-result-title');
  const desc = document.querySelector('#quiz-result-desc');

  if (totalQuizScore <= 4) {
    if (badge) {
      badge.className = 'quiz-score-badge score-badge-high';
      badge.textContent = `Puntaje: ${totalQuizScore} / 12 · Nivel Crítico de Fricción`;
    }
    if (title) title.textContent = 'Tu negocio necesita la digitalización inmediata de NEXOCITA';
    if (desc) desc.textContent = 'Operas bajo un alto riesgo de desorden: agendas en papel y chats dispersos te hacen perder hasta 18 horas mensuales y provocan ausencias injustificadas del 38%. Implementar la agenda centralizada resolverá estos problemas desde el primer día.';
  } else if (totalQuizScore <= 8) {
    if (badge) {
      badge.className = 'quiz-score-badge score-badge-med';
      badge.textContent = `Puntaje: ${totalQuizScore} / 12 · Nivel Intermedio`;
    }
    if (title) title.textContent = 'Tienes bases digitales, pero aún dependes de la intervención manual';
    if (desc) desc.textContent = 'Aunque empleas medios digitales, el cliente aún debe esperar tu confirmación y sigues dedicando tiempo valioso a responder mensajes repetitivos. Con el autoservicio 24/7 de NEXOCITA ganarás autonomía total.';
  } else {
    if (badge) {
      badge.className = 'quiz-score-badge score-badge-opt';
      badge.textContent = `Puntaje: ${totalQuizScore} / 12 · Excelente Madurez Digital`;
    }
    if (title) title.textContent = 'Comprendes el verdadero valor de una arquitectura sin fricción';
    if (desc) desc.textContent = 'Tu enfoque está perfectamente alineado con los principios de UX/UI y orquestación multimedia de NEXOCITA: validación atómica, autoservicio sin barreras y control en tiempo real.';
  }
}

if (quizRestartBtn) {
  quizRestartBtn.addEventListener('click', () => {
    currentQuizIndex = 0;
    totalQuizScore = 0;
    selectedOptionScore = null;
    if (quizResultsWrap) quizResultsWrap.style.display = 'none';
    if (quizQuestionWrap) quizQuestionWrap.style.display = 'block';
    renderQuizQuestion();
  });
}

// Inicializar el quiz al cargar
renderQuizQuestion();
