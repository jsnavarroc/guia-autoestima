/**
 * app.js — Orquestador principal / Router SPA
 * Guía de Autoestima Basada en Evidencia Científica
 *
 * Maneja navegación, carga de vistas y estado global
 */

const App = {
  // State
  currentView: 'welcome',
  previousView: null,
  previousParams: null,
  navHistory: [],
  userData: null,
  scores: null,
  profile: null,
  questionsData: null,
  techniquesData: null,
  psychoeducationData: null,

  // Initialize
  async init() {
    // Load data files
    await this.loadData();

    // Setup navigation
    this.setupNav();

    // Always start with login screen
    this.navigate('login');
  },

  // Login with cédula
  async handleLogin() {
    const cedula = document.getElementById('login-cedula')?.value?.trim();
    if (!cedula || cedula.length < 4) {
      document.getElementById('login-error').textContent = 'Ingresa un número de identificación válido (mínimo 4 dígitos)';
      document.getElementById('login-error').classList.remove('hidden');
      return;
    }

    // Set user in tracker
    Tracker.setUser(cedula);

    // Try to load from API first, fallback to localStorage
    this.userData = await Tracker.loadUserDataAsync();

    if (this.userData && this.userData.scores) {
      // Returning user
      this.scores = this.userData.scores;
      this.profile = Profiles.determineProfile(this.scores);
      this.showNav();
      this.navigate('dashboard');
    } else {
      // New user → welcome screen
      this.navigate('welcome');
    }
  },

  // Check if localStorage has guia data
  _hasLocalStorageData() {
    return Object.keys(localStorage).some(k => k.startsWith('guia_'));
  },

  // Migrate localStorage to JSON server
  async migrateLocalStorage() {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('guia_')) {
        allData[key] = localStorage.getItem(key);
      }
    }

    try {
      const res = await fetch('/api/migrate-localstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData)
      });
      const result = await res.json();
      if (result.ok) {
        alert(`Migración exitosa: ${result.migrated} usuario(s) transferidos al servidor.`);
        // Reload login to show migrated users
        this.navigate('login');
      } else {
        alert('Error en la migración: ' + (result.error || 'desconocido'));
      }
    } catch (e) {
      alert('Error conectando con el servidor. Asegúrate de que node server.js está corriendo.');
    }
  },

  // Logout
  handleLogout() {
    Tracker.logout();
    this.userData = null;
    this.scores = null;
    this.profile = null;
    this.hideNav();
    this.navigate('login');
  },

  // Load JSON data files
  async loadData() {
    try {
      const [questionsRes, techniquesRes, psychoeducationRes] = await Promise.all([
        fetch('data/questions.json'),
        fetch('data/techniques.json'),
        fetch('data/psychoeducation.json')
      ]);
      this.questionsData = await questionsRes.json();
      this.techniquesData = await techniquesRes.json();
      this.psychoeducationData = await psychoeducationRes.json();
    } catch (e) {
      console.error('Error loading data:', e);
      // Fallback: data might be embedded
    }
  },

  // Navigation setup
  setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.navigate(view);
      });
    });
  },

  showNav() {
    document.getElementById('main-nav').classList.remove('hidden');
  },

  hideNav() {
    document.getElementById('main-nav').classList.add('hidden');
  },

  // Go back to previous page
  goBack() {
    if (this.navHistory.length > 1) {
      this.navHistory.pop(); // Remove current
      const prev = this.navHistory.pop(); // Get previous (will be re-pushed by navigate)
      this.navigate(prev.view, prev.params);
    } else {
      this.navigate('dashboard');
    }
  },

  // Router
  navigate(view, params = {}) {
    // Save to history (skip duplicates)
    const last = this.navHistory[this.navHistory.length - 1];
    if (!last || last.view !== view) {
      this.navHistory.push({ view, params });
      // Keep history manageable
      if (this.navHistory.length > 20) this.navHistory.shift();
    }
    this.currentView = view;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Render view
    const app = document.getElementById('app');
    app.scrollTo?.({ top: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (view) {
      case 'login':
        this.renderLogin(app).catch(e => { console.error(e); this.renderLoginFallback(app); });
        break;
      case 'welcome':
        this.renderWelcome(app);
        break;
      case 'assessment':
        this.renderAssessment(app, params);
        break;
      case 'loading':
        this.renderLoading(app);
        break;
      case 'dashboard':
        this.renderDashboard(app);
        break;
      case 'plan':
        this.renderPlan(app);
        break;
      case 'exercises':
        this.renderExercisesList(app);
        break;
      case 'exercise':
        this.renderExercise(app, params);
        break;
      case 'tracker':
        this.renderTracker(app);
        break;
      case 'reassessment':
        this.renderAssessment(app, { isReassessment: true });
        break;
      case 'learn':
        this.renderLearn(app);
        break;
      case 'learn-module':
        this.renderLearnModule(app, params);
        break;
      case 'tooltip':
        this.renderTooltipPage(app, params);
        break;
      case 'psychoeducation':
        this.renderPsychoeducation(app, params);
        break;
      default:
        this.renderWelcome(app);
    }
  },

  // ==========================================
  // VIEW: Login (identificación por ID)
  // ==========================================
  renderLoginFallback(container) {
    this.renderLogin(container);
  },

  async renderLogin(container) {
    this.hideNav();

    container.innerHTML = `
      <div class="max-w-md mx-auto py-16 px-4 text-center">
        <div class="text-6xl mb-6">🌱</div>
        <h1 class="text-3xl font-bold text-white mb-2">Guía de Autoestima</h1>
        <p class="text-gray-400 mb-10">Basada en Evidencia Científica</p>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 text-left">
          <h2 class="text-lg font-semibold text-white mb-4">Ingresa tu ID</h2>
          <p class="text-gray-400 text-sm mb-4">Tu número de identificación será tu clave para guardar y recuperar tu progreso.</p>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-2">ID</label>
            <input type="text" id="login-cedula" inputmode="numeric" pattern="[0-9]*"
              placeholder="Ingresa tu número de identificación"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 text-lg text-center tracking-wider placeholder-gray-500 focus:border-teal-500 focus:outline-none"
              onkeydown="if(event.key==='Enter') App.handleLogin()">
          </div>

          <p id="login-error" class="text-red-400 text-sm mb-3 hidden"></p>

          <button onclick="App.handleLogin()"
            class="w-full bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors text-lg">
            Ingresar
          </button>
        </div>

        <p class="text-gray-600 text-xs mt-8">Si ya realizaste la evaluación, ingresa el mismo ID para ver tus resultados.</p>
      </div>
    `;

    setTimeout(() => document.getElementById('login-cedula')?.focus(), 100);
  },

  // ==========================================
  // VIEW: Welcome
  // ==========================================
  renderWelcome(container) {
    this.hideNav();
    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">🌱</div>
          <h1 class="text-3xl font-bold text-white mb-2">Guía de Autoestima</h1>
          <p class="text-gray-400 text-lg">Basada en Evidencia Científica</p>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <p class="text-gray-300 leading-relaxed mb-6">Una herramienta interactiva de autoayuda respaldada por <strong class="text-white">573 fuentes académicas</strong>, incluyendo meta-análisis, ensayos clínicos y protocolos terapéuticos validados.</p>

          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <span class="text-2xl">📋</span>
              <div>
                <strong class="text-white">Evalúa</strong>
                <p class="text-gray-400 text-sm">Tu autoestima y áreas relacionadas con escalas validadas internacionalmente</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <span class="text-2xl">🔍</span>
              <div>
                <strong class="text-white">Identifica</strong>
                <p class="text-gray-400 text-sm">Tu perfil personal y las áreas donde más puedes crecer</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <span class="text-2xl">🎯</span>
              <div>
                <strong class="text-white">Recibe</strong>
                <p class="text-gray-400 text-sm">Un plan personalizado de 12 semanas con técnicas probadas científicamente</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <span class="text-2xl">🧘</span>
              <div>
                <strong class="text-white">Practica</strong>
                <p class="text-gray-400 text-sm">Ejercicios interactivos paso a paso, los mismos que se usan en terapia profesional</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <span class="text-2xl">📈</span>
              <div>
                <strong class="text-white">Mide</strong>
                <p class="text-gray-400 text-sm">Tu progreso semana a semana y re-evalúate para ver tus avances</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <p class="text-gray-300 text-sm"><strong class="text-yellow-400">⚠️ Importante:</strong> Esta guía es una herramienta de autoayuda. <strong class="text-white">No sustituye la atención profesional de salud mental.</strong> Si experimentas sufrimiento intenso, ideas de autolesión, o síntomas que interfieren con tu vida diaria, busca ayuda profesional inmediatamente.</p>
        </div>

        <div class="flex flex-col items-center gap-3 mt-8">
          <button class="bg-primary hover:bg-primary-dark text-white font-semibold text-lg py-4 px-8 rounded-lg transition-colors" onclick="App.navigate('assessment')">
            Comenzar Evaluación →
          </button>
          ${this.userData ? `
            <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors" onclick="App.navigate('dashboard')">
              Ver mi progreso anterior
            </button>
          ` : ''}
        </div>

        <p class="text-center text-gray-500 text-sm mt-6">Tiempo estimado de evaluación: 10-15 minutos</p>
      </div>
    `;
  },

  // ==========================================
  // VIEW: Assessment
  // ==========================================
  renderAssessment(container, params = {}) {
    this.hideNav();
    const sections = this.questionsData?.sections || [];
    const isReassessment = params.isReassessment || false;

    // State for assessment
    if (!this._assessmentState) {
      this._assessmentState = {
        currentSection: 0,
        answers: {}
      };
    }

    const section = sections[this._assessmentState.currentSection];
    if (!section) return;

    const progress = ((this._assessmentState.currentSection + 1) / sections.length) * 100;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4">
        <div class="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div class="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style="width: ${progress}%"></div>
        </div>
        <p class="text-gray-400 text-sm text-right mb-6">Sección ${this._assessmentState.currentSection + 1} de ${sections.length}</p>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">${section.title} ${section.id !== 'basics' ? this.tip(section.id + '_scale') : ''}</h2>
          <p class="text-gray-400 text-sm mb-6">${section.description}</p>

          <div id="questions-container">
            ${this.renderQuestions(section)}
          </div>
        </div>

        <div class="flex justify-between items-center">
          ${this._assessmentState.currentSection > 0 ? `
            <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors" onclick="App.prevSection()">
              ← Anterior
            </button>
          ` : '<div></div>'}

          <button class="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors" onclick="App.nextSection()" id="btn-next">
            ${this._assessmentState.currentSection < sections.length - 1 ? 'Siguiente →' : 'Ver Resultados →'}
          </button>
        </div>
      </div>
    `;
  },

  renderQuestions(section) {
    if (section.id === 'basics') {
      return section.questions.map(q => this.renderBasicQuestion(q)).join('');
    }

    // Likert scale questions
    return `
      <div class="flex justify-between text-gray-500 text-xs mb-4">
        ${section.scale.labels.map((label, i) => `
          <span>${label}</span>
        `).join('')}
      </div>
      ${section.questions.map(q => `
        <div class="bg-gray-800/50 rounded-lg p-4 mb-3">
          <p class="text-gray-200 text-sm mb-3">${q.text} ${this.questionHelp(q)}</p>
          <div class="flex gap-2 justify-between">
            ${section.scale.labels.map((label, i) => `
              <label class="flex flex-col items-center gap-1 cursor-pointer">
                <input type="radio" name="${q.id}" value="${i + section.scale.min}"
                  ${this._assessmentState.answers[q.id] == (i + section.scale.min) ? 'checked' : ''}
                  onchange="App.saveAnswer('${q.id}', ${i + section.scale.min})"
                  class="accent-primary">
                <span class="text-gray-500 text-xs sm:hidden">${label}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
  },

  renderBasicQuestion(q) {
    switch (q.type) {
      case 'text':
        return `
          <div class="space-y-2 mb-4">
            <label class="text-gray-200 text-sm">${q.text} ${this.questionHelp(q)}</label>
            <input type="text" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 focus:border-primary focus:outline-none"
              value="${this._assessmentState.answers[q.id] || ''}"
              onchange="App.saveAnswer('${q.id}', this.value)"
              placeholder="Tu nombre (opcional)">
          </div>
        `;
      case 'radio':
        return `
          <div class="space-y-2 mb-4">
            <p class="text-gray-200 text-sm">${q.text} ${this.questionHelp(q)}</p>
            <div class="space-y-2">
              ${q.options.map(opt => `
                <label class="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white">
                  <input type="radio" name="${q.id}" value="${opt}"
                    ${this._assessmentState.answers[q.id] === opt ? 'checked' : ''}
                    onchange="App.saveAnswer('${q.id}', '${opt}')"
                    class="accent-primary">
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      case 'checkbox':
        return `
          <div class="space-y-2 mb-4">
            <p class="text-gray-200 text-sm">${q.text} ${this.questionHelp(q)}</p>
            <div class="space-y-2">
              ${q.options.map(opt => `
                <label class="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white">
                  <input type="checkbox" value="${opt}"
                    ${(this._assessmentState.answers[q.id] || []).includes(opt) ? 'checked' : ''}
                    onchange="App.saveCheckbox('${q.id}', '${opt}', this.checked)"
                    class="accent-primary">
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      default:
        return '';
    }
  },

  saveAnswer(questionId, value) {
    this._assessmentState.answers[questionId] = value;
  },

  saveCheckbox(questionId, value, checked) {
    if (!this._assessmentState.answers[questionId]) {
      this._assessmentState.answers[questionId] = [];
    }
    const arr = this._assessmentState.answers[questionId];
    if (checked && !arr.includes(value)) {
      arr.push(value);
    } else if (!checked) {
      const idx = arr.indexOf(value);
      if (idx > -1) arr.splice(idx, 1);
    }
  },

  nextSection() {
    const sections = this.questionsData?.sections || [];
    if (this._assessmentState.currentSection < sections.length - 1) {
      this._assessmentState.currentSection++;
      this.renderAssessment(document.getElementById('app'));
    } else {
      // Finish assessment
      this.finishAssessment();
    }
  },

  prevSection() {
    if (this._assessmentState.currentSection > 0) {
      this._assessmentState.currentSection--;
      this.renderAssessment(document.getElementById('app'));
    }
  },

  finishAssessment() {
    // Show loading
    this.navigate('loading');

    // Calculate scores
    setTimeout(() => {
      const answers = this._assessmentState.answers;
      this.scores = Scoring.scoreAll(answers, this.questionsData.sections);
      this.profile = Profiles.determineProfile(this.scores);

      // Save to localStorage (linked to cédula)
      const name = answers.name || '';
      this.userData = {
        cedula: Tracker.userId,
        name: name,
        ageRange: answers.age_range || '',
        motivation: answers.motivation || [],
        scores: this.scores,
        profile: this.profile,
        assessmentDate: new Date().toISOString(),
        answers: answers,
        assessments: [...(this.userData?.assessments || []), {
          date: new Date().toISOString(),
          scores: this.scores,
          profile: this.profile
        }]
      };
      Tracker.registerUser(Tracker.userId, name);
      Tracker.saveUserData(this.userData);
      Tracker.saveScores(this.scores, this.profile, answers);

      // Clean up assessment state
      this._assessmentState = null;

      // Navigate to dashboard
      this.showNav();
      this.navigate('dashboard');
    }, 2000);
  },

  // ==========================================
  // VIEW: Loading
  // ==========================================
  renderLoading(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div class="w-12 h-12 border-4 border-gray-700 border-t-primary rounded-full animate-spin mb-6"></div>
        <h2 class="text-2xl font-bold text-white mb-2">Analizando tus respuestas...</h2>
        <p class="text-gray-400 mb-6">Calculando tu perfil personalizado</p>
        <div class="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full animate-pulse" style="width: 70%"></div>
        </div>
      </div>
    `;
  },

  // ==========================================
  // VIEW: Dashboard
  // ==========================================
  renderDashboard(container) {
    if (!this.scores || !this.profile) {
      this.navigate('welcome');
      return;
    }

    const name = this.userData?.name || '';
    const greeting = name ? `Hola, ${name}` : 'Tu Perfil';
    const p = this.profile;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <h1 class="text-3xl font-bold text-white">${greeting}</h1>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div class="flex items-center gap-4 mb-4">
            <span class="text-4xl">${p.emoji}</span>
            <div>
              <h2 class="text-2xl font-bold text-white">Perfil: "${p.name}" ${this.tip('profile_' + (p.key || 'autocritico'))}</h2>
              ${p.secondary ? `<p class="text-gray-400 text-sm">Con tendencia: ${p.secondary}</p>` : ''}
            </div>
          </div>
          <p class="text-gray-300 mb-3">${p.description}</p>
          <p class="text-primary italic">${p.encouragement}</p>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-4">Tus Puntuaciones</h3>
          <div class="space-y-4">
            ${this.renderScoreBars()}
          </div>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-4">Visión General</h3>
          <canvas id="radar-chart" width="350" height="350"></canvas>
        </div>

        ${this.scores.screening?.needsReferral ? `
        <div class="bg-red-900/30 rounded-xl p-6 border border-red-500/50 mb-4">
          <h3 class="text-xl font-bold text-red-400 mb-3">⚠️ Atención Importante</h3>
          <p class="text-gray-300 mb-3">Tus respuestas en el screening de bienestar emocional indican que podrías estar experimentando síntomas de ${this.scores.screening.depressionRisk ? '<strong>depresión</strong>' : ''}${this.scores.screening.depressionRisk && this.scores.screening.anxietyRisk ? ' y ' : ''}${this.scores.screening.anxietyRisk ? '<strong>ansiedad</strong>' : ''} que van más allá de lo que una guía de autoayuda puede abordar.</p>
          <p class="text-gray-300 mb-4"><strong>Te recomendamos buscar apoyo profesional.</strong> Un psicólogo o psiquiatra puede ayudarte de forma personalizada y segura.</p>
          <div class="bg-red-900/20 rounded-lg p-4">
            <p class="text-red-300 text-sm font-medium mb-2">Recursos de ayuda:</p>
            <ul class="text-gray-400 text-sm space-y-1">
              <li>📞 Línea 106 — Atención en crisis (Colombia)</li>
              <li>📞 Línea 024 — Atención al suicidio (España)</li>
              <li>📞 800-290-0024 — Línea de la vida (México)</li>
              <li>🌐 Busca un profesional de salud mental en tu zona</li>
            </ul>
          </div>
          <p class="text-gray-500 text-xs mt-3">Basado en PHQ-2 (Kroenke, Spitzer & Williams, 2003) y GAD-2 (Kroenke et al., 2007). Una puntuación ≥3 en cualquiera indica la necesidad de evaluación profesional.</p>
        </div>
        ` : ''}

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-4">⚡ Áreas Prioritarias</h3>
          <ol class="list-decimal list-inside space-y-3">
            ${this.profile.priorities.map(p => `
              <li class="text-gray-200">
                <strong class="text-white">${p.area}</strong>
                <p class="text-gray-400 text-sm ml-5">${p.reason}</p>
              </li>
            `).join('')}
          </ol>
        </div>

        <div class="flex justify-center">
          <button class="bg-primary hover:bg-primary-dark text-white font-semibold text-lg py-4 px-8 rounded-lg transition-colors" onclick="App.navigate('plan')">
            Ver mi Plan Personalizado →
          </button>
        </div>
      </div>
    `;

    // Draw radar chart
    setTimeout(() => {
      if (typeof Charts !== 'undefined') {
        Charts.drawRadar('radar-chart', this.scores);
      }
    }, 100);
  },

  renderScoreBars() {
    const dimensions = [
      { key: 'rosenberg', label: 'Autoestima', max: 40 },
      { key: 'scs', label: 'Autocompasión', max: 5 },
      { key: 'impostor', label: 'Impostor', max: 50, inverted: true },
      { key: 'assertiveness', label: 'Asertividad', max: 40 },
      { key: 'social_media', label: 'Impacto Redes', max: 25, inverted: true },
      { key: 'physical', label: 'Bienestar Físico', max: 30 },
      { key: 'perfectionism', label: 'Perfeccionismo', max: 25, inverted: true },
      { key: 'screening', label: 'Bienestar emocional', max: 12, inverted: true }
    ];

    return dimensions.map(d => {
      const score = this.scores[d.key];
      if (!score) return '';
      const pct = (score.score / d.max) * 100;
      const color = score.color || '#4A9B8E';

      return `
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-gray-300 text-sm">${d.label} ${this.tip(d.key + '_scale')}</span>
            <span class="text-gray-400 text-xs">${d.key === 'scs' ? score.score.toFixed(1) : score.score}/${d.max}</span>
            <span class="text-xs font-medium" style="color: ${color}">${score.level}</span>
          </div>
          <div class="h-2 bg-gray-800 rounded-full">
            <div class="h-full rounded-full transition-all" style="width: ${pct}%; background-color: ${color}"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ==========================================
  // VIEW: Plan
  // ==========================================
  renderPlan(container) {
    if (!this.profile) {
      this.navigate('welcome');
      return;
    }

    const techniques = this.techniquesData?.techniques || [];
    const recommended = Profiles.getRecommendedTechniques(this.profile, this.scores, techniques);
    const phases = Profiles.generatePlanPhases(this.profile, recommended);

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <h1 class="text-3xl font-bold text-white">Tu Plan Personalizado</h1>
        <p class="text-gray-400">Perfil: ${this.profile.emoji} ${this.profile.name} — 12 semanas</p>

        ${phases.map((phase, i) => `
          <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div class="flex items-center gap-4 mb-4">
              <span class="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg">${i + 1}</span>
              <div>
                <h2 class="text-xl font-bold text-white">${phase.name}</h2>
                <p class="text-gray-400 text-sm">${phase.weeks}</p>
              </div>
            </div>

            <div class="space-y-4">
              ${phase.techniques.map(t => `
                <div class="bg-gray-800/50 rounded-lg p-4 border-l-4 border-primary">
                  <div class="flex items-start gap-3 mb-2">
                    <span class="text-2xl">${t.icon}</span>
                    <div class="flex-1">
                      <strong class="text-white">${t.name}</strong> ${this.tip(t.id.replace(/_/g, '_'))}
                      <span class="text-gray-500 text-xs ml-2">${t.frequency}</span>
                    </div>
                    <span class="text-yellow-400 text-sm">${'★'.repeat(t.priority)}</span>
                  </div>
                  <p class="text-gray-400 text-sm mb-1">${t.description}</p>
                  <p class="text-primary text-sm italic mb-3">Evidencia: ${t.evidence}</p>
                  <button class="bg-primary hover:bg-primary-dark text-white font-semibold text-sm py-1.5 px-3 rounded-lg transition-colors" onclick="App.navigate('exercise', {id: '${t.id}'})">
                    Practicar ahora
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-3">
          <h3 class="text-xl font-bold text-white">📖 Entender por qué funciona</h3>
          <p class="text-gray-400">Conocer la base científica de tu plan te ayuda a comprometerte con el proceso.</p>
          <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors block" onclick="App.navigate('psychoeducation', {topic: 'fennell'})">
            ¿Por qué soy autocrítico/a? (Modelo de Fennell)
          </button>
          <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors block" onclick="App.navigate('psychoeducation', {topic: 'cycle'})">
            El ciclo de la baja autoestima
          </button>
          <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors block" onclick="App.navigate('psychoeducation', {topic: 'six_therapies'})">
            6 terapias que funcionan y por qué
          </button>
        </div>
      </div>
    `;
  },

  // ==========================================
  // VIEW: Exercises List
  // ==========================================
  renderExercisesList(container) {
    const techniques = this.techniquesData?.techniques || [];
    const recommended = this.profile
      ? Profiles.getRecommendedTechniques(this.profile, this.scores, techniques)
      : techniques;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4">
        <h1 class="text-3xl font-bold text-white mb-2">Ejercicios</h1>
        <p class="text-gray-400 mb-6">Herramientas interactivas basadas en evidencia</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${recommended.map(t => `
            <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 cursor-pointer hover:border-primary transition-colors" onclick="App.navigate('exercise', {id: '${t.id}'})">
              <span class="text-3xl block mb-2">${t.icon}</span>
              <h3 class="text-lg font-bold text-white mb-1">${t.name}</h3>
              <p class="text-gray-400 text-sm">${t.origin}</p>
              <p class="text-gray-500 text-xs">${t.duration}</p>
              ${t.priority ? `<span class="inline-block mt-2 text-yellow-400 text-sm">${'★'.repeat(t.priority)} para ti</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ==========================================
  // VIEW: Individual Exercise
  // ==========================================
  renderExercise(container, params) {
    const technique = (this.techniquesData?.techniques || []).find(t => t.id === params.id);
    if (!technique) {
      this.navigate('exercises');
      return;
    }

    // Try to load exercise-specific HTML
    Exercises.render(container, technique);
  },

  // ==========================================
  // VIEW: Tracker
  // ==========================================
  renderTracker(container) {
    const weekData = Tracker.getCurrentWeek();
    const history = Tracker.getHistory();

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <h1 class="text-3xl font-bold text-white">Seguimiento Semanal</h1>
        ${this.profile ? `<p class="text-gray-400">Semana ${Tracker.getCurrentWeekNumber()} — ${this.profile.emoji} ${this.profile.name}</p>` : ''}

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-4">Checklist de esta semana ${this.tip('weekly_checklist')}</h3>
          <div class="space-y-2">
            ${this.renderChecklist(weekData)}
          </div>
          <div class="mt-4 pt-4 border-t border-gray-800 text-gray-400">
            Cumplimiento: <strong class="text-white">${weekData.completionRate || 0}%</strong>
          </div>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
          <h3 class="text-xl font-bold text-white">¿Cómo te sientes esta semana?</h3>
          <div class="space-y-2">
            <label class="text-gray-300 text-sm">Bienestar general</label>
            <div class="flex items-center gap-3">
              <input type="range" min="1" max="10" value="${weekData.wellbeing || 5}"
                oninput="App.updateMetric('wellbeing', this.value)"
                class="flex-1 accent-primary">
              <span class="text-gray-400 text-sm w-10 text-right">${weekData.wellbeing || 5}/10</span>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-gray-300 text-sm">Nivel de autocrítica</label>
            <div class="flex items-center gap-3">
              <input type="range" min="1" max="10" value="${weekData.selfCriticism || 5}"
                oninput="App.updateMetric('selfCriticism', this.value)"
                class="flex-1 accent-primary">
              <span class="text-gray-400 text-sm w-10 text-right">${weekData.selfCriticism || 5}/10</span>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-gray-300 text-sm">Horas de sueño promedio</label>
            <input type="number" min="0" max="14" step="0.5" value="${weekData.sleepHours || 7}"
              onchange="App.updateMetric('sleepHours', this.value)"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 focus:border-primary focus:outline-none">
          </div>
          <div class="space-y-2">
            <label class="text-gray-300 text-sm">Minutos de ejercicio esta semana</label>
            <input type="number" min="0" max="1000" step="10" value="${weekData.exerciseMinutes || 0}"
              onchange="App.updateMetric('exerciseMinutes', this.value)"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 focus:border-primary focus:outline-none">
          </div>
          <button class="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors" onclick="App.saveWeek()">Guardar semana</button>
        </div>

        ${history.length > 1 ? `
          <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 class="text-xl font-bold text-white mb-4">Progreso</h3>
            <canvas id="progress-chart" width="350" height="250"></canvas>
          </div>
        ` : ''}

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-2">📊 Re-evaluación</h3>
          <p class="text-gray-400 mb-4">Repite los cuestionarios para medir tu progreso objetivamente.</p>
          <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors" onclick="App.startReassessment()">
            Re-evaluar ahora
          </button>
        </div>

        ${this.renderAssessmentHistory()}

        <div class="bg-gray-900 rounded-xl p-6 border border-red-900/30 mt-4">
          <h3 class="text-xl font-bold text-white mb-2">🗑️ Borrar mis datos</h3>
          <p class="text-gray-400 text-sm mb-4">Esto eliminará todas tus evaluaciones, ejercicios y seguimiento semanal. Esta acción no se puede deshacer.</p>
          <button class="border border-red-500/50 text-red-400 hover:bg-red-500/10 py-2 px-4 rounded-lg transition-colors text-sm" onclick="App.confirmDeleteUser()">
            Borrar todo mi historial
          </button>
        </div>
      </div>
    `;

    if (history.length > 1 && typeof Charts !== 'undefined') {
      setTimeout(() => Charts.drawProgress('progress-chart', history), 100);
    }
  },

  renderChecklist(weekData) {
    const items = [
      { id: 'mindfulness', label: 'Mindfulness (3+ veces)', icon: '🧘' },
      { id: 'exercise', label: 'Ejercicio físico (3+ veces)', icon: '🏃' },
      { id: 'gratitude', label: 'Diario de gratitud (2+ entradas)', icon: '🙏' },
      { id: 'positiveData', label: 'Dato positivo registrado (3+)', icon: '✨' },
      { id: 'socialConnection', label: 'Conexión social significativa', icon: '💬' },
      { id: 'boundaries', label: 'Límites respetados', icon: '🛡️' },
      { id: 'screenTime', label: 'Redes sociales <60 min/día', icon: '📱' },
      { id: 'sleep', label: 'Sueño 7-9h (5+ noches)', icon: '😴' }
    ];

    return items.map(item => `
      <label class="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white py-1">
        <input type="checkbox" ${weekData.checklist?.[item.id] ? 'checked' : ''}
          onchange="App.updateChecklist('${item.id}', this.checked)"
          class="accent-primary">
        <span>${item.icon} ${item.label}</span>
      </label>
    `).join('');
  },

  updateMetric(key, value) {
    Tracker.updateCurrentWeek(key, parseFloat(value));
    // Update displayed value
    const el = event?.target?.nextElementSibling;
    if (el?.classList.contains('text-gray-400')) {
      el.textContent = `${value}/10`;
    }
  },

  updateChecklist(key, checked) {
    Tracker.updateChecklist(key, checked);
  },

  saveWeek() {
    Tracker.saveCurrentWeek();
    alert('Semana guardada correctamente ✓');
  },

  startReassessment() {
    this._assessmentState = { currentSection: 0, answers: {} };
    this.navigate('reassessment');
  },

  // Render assessment history
  renderAssessmentHistory() {
    const assessments = this.userData?.assessments || [];
    if (assessments.length === 0) return '';

    return `
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mt-4">
        <h3 class="text-xl font-bold text-white mb-4">📋 Historial de Evaluaciones</h3>
        <div class="space-y-3">
          ${assessments.map((a, i) => {
            const date = new Date(a.date).toLocaleDateString('es', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const profileName = a.profile?.name || a.profile?.key || 'Sin perfil';
            const scores = a.scores || {};
            const isLatest = i === assessments.length - 1;

            return `
              <div class="bg-gray-800/50 rounded-lg p-4 ${isLatest ? 'border border-teal-500/30' : ''}">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <p class="text-white font-medium">${isLatest ? '✅ Evaluación actual' : `Evaluación ${i + 1}`}</p>
                    <p class="text-gray-500 text-xs">${date}</p>
                  </div>
                  <span class="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300">${profileName}</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  ${scores.rosenberg ? `<div class="text-center"><p class="text-xs text-gray-500">Autoestima</p><p class="text-sm font-medium" style="color:${scores.rosenberg.color || '#fff'}">${scores.rosenberg.score}/40</p></div>` : ''}
                  ${scores.scs ? `<div class="text-center"><p class="text-xs text-gray-500">Autocompasión</p><p class="text-sm font-medium" style="color:${scores.scs.color || '#fff'}">${scores.scs.score}/5</p></div>` : ''}
                  ${scores.impostor ? `<div class="text-center"><p class="text-xs text-gray-500">Impostor</p><p class="text-sm font-medium" style="color:${scores.impostor.color || '#fff'}">${scores.impostor.score}/50</p></div>` : ''}
                  ${scores.assertiveness ? `<div class="text-center"><p class="text-xs text-gray-500">Asertividad</p><p class="text-sm font-medium" style="color:${scores.assertiveness.color || '#fff'}">${scores.assertiveness.score}/40</p></div>` : ''}
                </div>
                ${i > 0 && assessments[i-1].scores?.rosenberg ? `
                  <div class="mt-3 pt-3 border-t border-gray-700">
                    <p class="text-xs text-gray-500">Cambio vs. evaluación anterior:</p>
                    <div class="flex gap-4 mt-1">
                      ${this.renderScoreChange('Autoestima', assessments[i-1].scores?.rosenberg?.score, scores.rosenberg?.score)}
                      ${this.renderScoreChange('Autocompasión', assessments[i-1].scores?.scs?.score, scores.scs?.score)}
                      ${this.renderScoreChange('Impostor', assessments[i-1].scores?.impostor?.score, scores.impostor?.score, true)}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        ${assessments.length > 1 ? `
          <p class="text-gray-500 text-xs mt-4 text-center">Total: ${assessments.length} evaluaciones realizadas</p>
        ` : ''}
      </div>
    `;
  },

  renderScoreChange(label, before, after, inverted = false) {
    if (before == null || after == null) return '';
    const diff = after - before;
    const improved = inverted ? diff < 0 : diff > 0;
    const symbol = diff > 0 ? '↑' : diff < 0 ? '↓' : '=';
    const color = diff === 0 ? 'text-gray-500' : improved ? 'text-green-400' : 'text-red-400';
    return `<span class="${color} text-xs">${label}: ${symbol}${Math.abs(diff).toFixed(diff % 1 ? 1 : 0)}</span>`;
  },

  // Delete user data
  confirmDeleteUser() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-red-500/30">
        <h3 class="text-xl font-bold text-red-400 mb-3">⚠️ ¿Estás seguro/a?</h3>
        <p class="text-gray-300 mb-2">Esto eliminará permanentemente:</p>
        <ul class="text-gray-400 text-sm space-y-1 mb-4 list-disc list-inside">
          <li>Todas tus evaluaciones</li>
          <li>Tu plan personalizado</li>
          <li>Historial de ejercicios</li>
          <li>Seguimiento semanal</li>
        </ul>
        <p class="text-gray-400 text-sm mb-6">Tu cédula: <strong class="text-white">${Tracker.userId}</strong></p>
        <div class="flex gap-3">
          <button onclick="this.closest('.fixed').remove()"
            class="flex-1 border border-gray-600 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button onclick="App.deleteUser(); this.closest('.fixed').remove()"
            class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-semibold">
            Sí, borrar todo
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async deleteUser() {
    const cedula = Tracker.userId;

    // Delete from localStorage
    Tracker.clearUser();

    // Delete from server
    try {
      await fetch(`/api/users/${cedula}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API delete failed:', e);
    }

    // Remove from local users list
    const users = Tracker.getAllUsers().filter(u => u.cedula !== cedula);
    localStorage.setItem('guia_users', JSON.stringify(users));

    // Reset state and go to login
    this.userData = null;
    this.scores = null;
    this.profile = null;
    Tracker.logout();
    this.hideNav();
    this.navigate('login');
  },

  // ==========================================
  // VIEW: Psychoeducation
  // ==========================================
  renderPsychoeducation(container, params) {
    const topics = {
      fennell: {
        title: '¿Por qué soy tan autocrítico/a?',
        subtitle: 'El Modelo de Fennell (1997)',
        content: `
          <p class="text-gray-300 mb-4">La baja autoestima <strong class="text-white">no es un defecto tuyo</strong>. Es un patrón aprendido que se mantiene por un ciclo que puedes romper.</p>

          <div class="space-y-2 my-6">
            <div class="bg-gray-800/50 rounded-lg p-3 text-center text-gray-200">📌 Experiencia temprana negativa</div>
            <div class="text-center text-gray-600">↓</div>
            <div class="bg-gray-800/50 rounded-lg p-3 text-center text-gray-200">💭 Creencia nuclear: "No valgo"</div>
            <div class="text-center text-gray-600">↓</div>
            <div class="bg-gray-800/50 rounded-lg p-3 text-center text-gray-200">📏 Reglas: "Si no soy perfecto, soy un fracaso"</div>
            <div class="text-center text-gray-600">↓</div>
            <div class="bg-gray-800/50 rounded-lg p-3 text-center text-gray-200">⚡ Situación activadora</div>
            <div class="text-center text-gray-600">↓</div>
            <div class="bg-gray-800/50 rounded-lg p-3 text-center text-gray-200">🧠 Pensamientos automáticos negativos</div>
            <div class="text-center text-gray-600">↓</div>
            <div class="bg-gray-800/50 rounded-lg p-3 text-center text-gray-200">😰 Ansiedad + Evitación + Autocrítica</div>
            <div class="text-center text-gray-600">↓ confirma la creencia ↑</div>
          </div>

          <h3 class="text-xl font-bold text-white mb-3">¿Cómo rompemos el ciclo?</h3>
          <p class="text-gray-300 mb-3">En esta guía intervenimos en <strong class="text-white">múltiples puntos</strong> del ciclo:</p>
          <ol class="list-decimal list-inside space-y-2 text-gray-300 mb-4">
            <li><strong class="text-white">Pensamientos automáticos</strong> → Registro de pensamientos (CBT)</li>
            <li><strong class="text-white">Relación con pensamientos</strong> → Defusión cognitiva (ACT)</li>
            <li><strong class="text-white">Autocrítica</strong> → Autocompasión (Neff)</li>
            <li><strong class="text-white">Creencias nucleares</strong> → Flecha descendente + evidencia</li>
            <li><strong class="text-white">Evitación</strong> → Exposición graduada</li>
            <li><strong class="text-white">El cuerpo</strong> → Ejercicio + sueño + mindfulness</li>
          </ol>

          <p class="text-primary text-sm italic">Evidencia: 6 tipos de terapia diferentes mejoran la autoestima porque cada una actúa en un punto distinto del ciclo (Duro Martín, 2021 — revisión de 573 fuentes académicas).</p>
        `
      },
      six_therapies: {
        title: '6 terapias que funcionan y por qué',
        subtitle: 'Revisión comparativa (Duro Martín, 2021)',
        content: `
          <p class="text-gray-300 mb-4">Todas las terapias para baja autoestima mejoran al paciente aunque usan enfoques muy diferentes. ¿Por qué? Porque cada una actúa en un componente distinto del sistema de competencia personal.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">🧠 CBT (Cognitivo-Conductual)</h4>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Actúa sobre:</strong> Creencias irracionales</p>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Cómo:</strong> Invalida creencias sesgadas + entrena nuevas habilidades</p>
              <p class="text-primary text-sm italic">Evidencia: g = 0.52-0.78</p>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">🎯 ACT (Aceptación y Compromiso)</h4>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Actúa sobre:</strong> Fusión con pensamientos</p>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Cómo:</strong> Defusión + valores + acción comprometida</p>
              <p class="text-primary text-sm italic">Evidencia: g = 0.57-0.89</p>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">💚 Autocompasión (Neff/Gilbert)</h4>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Actúa sobre:</strong> Autocrítica y vergüenza</p>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Cómo:</strong> Amabilidad + humanidad compartida + mindfulness</p>
              <p class="text-primary text-sm italic">Evidencia: g = 0.75</p>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">🧘 Mindfulness</h4>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Actúa sobre:</strong> Rumiación y autodevaluación</p>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Cómo:</strong> Descentrarse de procesos autocríticos</p>
              <p class="text-primary text-sm italic">Evidencia: r = 0.53 con autocompasión</p>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">🗣️ REBT (Ellis)</h4>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Actúa sobre:</strong> Autoexigencias irracionales</p>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Cómo:</strong> Cambiar "deberías" por aceptación</p>
              <p class="text-primary text-sm italic">Evidencia: Múltiples RCTs</p>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">🏃 Ejercicio + Sueño</h4>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Actúa sobre:</strong> Base neurobiológica</p>
              <p class="text-gray-400 text-sm"><strong class="text-gray-300">Cómo:</strong> Dopamina, serotonina, imagen corporal</p>
              <p class="text-primary text-sm italic">Evidencia: d = 0.49 (meta-análisis)</p>
            </div>
          </div>

          <p class="text-primary font-semibold"><strong>Conclusión clave:</strong> "Todas las terapias resultarían eficaces porque, aunque cada una actúe sobre uno o dos componentes, su efecto se irradia por el sistema hasta la autoestima." Por eso esta guía integra elementos de todas ellas.</p>
        `
      }
    };

    const topic = topics[params?.topic] || topics.fennell;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4">
        <button class="border border-gray-600 text-gray-300 hover:border-primary hover:text-primary py-2 px-4 rounded-lg transition-colors mb-6" onclick="App.goBack()">← Volver</button>
        <h1 class="text-3xl font-bold text-white mb-2">${topic.title}</h1>
        <p class="text-gray-400 text-lg mb-6">${topic.subtitle}</p>
        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          ${topic.content}
        </div>
      </div>
    `;
  },

  // ==========================================
  // HELPER: Tooltip icon (?) — generates clickable help icon
  // ==========================================
  // Question help tooltip (?) — inline from question.help field
  questionHelp(q) {
    if (!q.help) return '';
    const escapedHelp = q.help.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-teal-400 text-xs font-bold cursor-pointer hover:bg-teal-500 hover:text-white transition-colors ml-1 align-middle" onclick="App.showQuestionHelp('${escapedHelp}')" title="¿Por qué esta pregunta?">?</span>`;
  },

  showQuestionHelp(helpText) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-t-2xl md:rounded-xl p-6 max-w-lg w-full border border-gray-800 animate-slide-up">
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-lg font-bold text-white">¿Por qué esta pregunta?</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed">${helpText}</p>
        <p class="text-gray-600 text-xs mt-4">No hay respuestas correctas ni incorrectas. Responde según lo que sientes habitualmente.</p>
      </div>
    `;
    document.body.appendChild(modal);
  },

  tip(tooltipId, inline = true) {
    return `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-teal-400 text-xs font-bold cursor-pointer hover:bg-teal-500 hover:text-white transition-colors ${inline ? 'ml-1 align-middle' : ''}" onclick="App.showTooltip('${tooltipId}')" title="¿Por qué?">?</span>`;
  },

  showTooltip(tooltipId) {
    const data = this.psychoeducationData;
    if (!data?.tooltips?.[tooltipId]) {
      console.warn('Tooltip not found:', tooltipId);
      return;
    }
    const t = data.tooltips[tooltipId];
    const refs = (t.references || []).map(r =>
      `<span class="text-gray-500">${r.author} (${r.year})</span>`
    ).join(' · ');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-t-2xl md:rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-gray-800 animate-slide-up">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-bold text-white pr-4">${t.title}</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <p class="text-teal-400 text-sm font-medium mb-3">${t.short}</p>
        <p class="text-gray-300 text-sm leading-relaxed mb-4">${t.long}</p>
        ${refs ? `<p class="text-xs text-gray-500 mb-4">Referencias: ${refs}</p>` : ''}
        ${t.moduleLink ? `
          <button onclick="this.closest('.fixed').remove(); App.navigate('learn-module', {id: '${t.moduleLink}'})"
            class="w-full border border-teal-500/50 text-teal-400 rounded-lg py-2 px-4 text-sm hover:bg-teal-500/10 transition-colors">
            📖 Leer módulo completo →
          </button>
        ` : ''}
      </div>
    `;
    document.body.appendChild(modal);
  },

  // ==========================================
  // VIEW: Learn (módulos de aprendizaje)
  // ==========================================
  renderLearn(container) {
    const modules = this.psychoeducationData?.modules || [];
    const categories = {
      fundamentos: { label: 'Fundamentos', icon: '🧠' },
      cbt: { label: 'Terapia Cognitivo-Conductual', icon: '📝' },
      autocompasion: { label: 'Autocompasión', icon: '💚' },
      act: { label: 'Aceptación y Compromiso', icon: '🎯' },
      impostor: { label: 'Síndrome del Impostor', icon: '🎭' },
      asertividad: { label: 'Asertividad', icon: '🗣️' },
      biologia: { label: 'Bases Biológicas', icon: '🔬' },
      redes: { label: 'Redes Sociales', icon: '📱' }
    };

    // Group by category
    const grouped = {};
    modules.forEach(m => {
      const cat = m.category || 'fundamentos';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-6 px-4">
        <h1 class="text-2xl font-bold text-white mb-2 text-center">📖 Aprende</h1>
        <p class="text-gray-400 text-center mb-8">Entiende la ciencia detrás de cada técnica. Todo respaldado por investigación.</p>

        ${Object.entries(categories).map(([catId, cat]) => {
          const catModules = grouped[catId] || [];
          if (catModules.length === 0) return '';
          return `
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-gray-300 mb-3">${cat.icon} ${cat.label}</h2>
              <div class="space-y-3">
                ${catModules.map(m => `
                  <div class="bg-gray-900 rounded-xl p-4 border border-gray-800 cursor-pointer hover:border-teal-500/50 transition-colors flex items-center gap-4"
                    onclick="App.navigate('learn-module', {id: '${m.id}'})">
                    <span class="text-2xl">${m.icon || cat.icon}</span>
                    <div class="flex-1">
                      <h3 class="text-white font-medium">${m.title}</h3>
                      <p class="text-gray-500 text-sm">${m.sections?.length || 0} secciones</p>
                    </div>
                    <span class="text-gray-600">→</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ==========================================
  // VIEW: Learn Module (individual module)
  // ==========================================
  renderLearnModule(container, params) {
    const modules = this.psychoeducationData?.modules || [];
    const module = modules.find(m => m.id === params.id);
    if (!module) {
      this.navigate('learn');
      return;
    }

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-6 px-4">
        <button class="border border-gray-600 text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors mb-6" onclick="App.goBack()">← Volver</button>

        <div class="text-center mb-8">
          <span class="text-4xl block mb-3">${module.icon || '📖'}</span>
          <h1 class="text-2xl font-bold text-white">${module.title}</h1>
        </div>

        ${(module.sections || []).map(section => `
          <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
            <h2 class="text-xl font-semibold text-white mb-4">${section.subtitle}</h2>
            <div class="text-gray-300 leading-relaxed space-y-3 psychoeducation-content">
              ${section.content}
            </div>
            ${section.references && section.references.length > 0 ? `
              <div class="mt-4 pt-4 border-t border-gray-800">
                <p class="text-xs text-gray-500 font-medium mb-2">Referencias:</p>
                <ul class="space-y-1">
                  ${section.references.map(r => `
                    <li class="text-xs text-gray-600">
                      ${r.author} (${r.year}). <em>${r.title}</em>. ${r.source || ''}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}

        <div class="text-center mt-8">
          <button class="border border-gray-600 text-gray-300 rounded-lg px-6 py-2 hover:bg-gray-800 transition-colors" onclick="App.goBack()">← Volver</button>
        </div>
      </div>
    `;
  },

  // ==========================================
  // VIEW: Tooltip full page (fallback for deep links)
  // ==========================================
  renderTooltipPage(container, params) {
    const t = this.psychoeducationData?.tooltips?.[params.id];
    if (!t) {
      this.navigate('learn');
      return;
    }
    const refs = (t.references || []).map(r =>
      `<li class="text-xs text-gray-600">${r.author} (${r.year})</li>`
    ).join('');

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-6 px-4">
        <button class="border border-gray-600 text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors mb-6" onclick="App.goBack()">← Volver</button>
        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h1 class="text-xl font-bold text-white mb-3">${t.title}</h1>
          <p class="text-teal-400 font-medium mb-4">${t.short}</p>
          <p class="text-gray-300 leading-relaxed mb-4">${t.long}</p>
          ${refs ? `<div class="border-t border-gray-800 pt-3 mt-4"><p class="text-xs text-gray-500 mb-1">Referencias:</p><ul class="space-y-1">${refs}</ul></div>` : ''}
          ${t.moduleLink ? `
            <button onclick="App.navigate('learn-module', {id: '${t.moduleLink}'})"
              class="w-full mt-4 border border-teal-500/50 text-teal-400 rounded-lg py-2 px-4 text-sm hover:bg-teal-500/10 transition-colors">
              📖 Leer módulo completo →
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
