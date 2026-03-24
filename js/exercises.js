/**
 * exercises.js — Renderizado de ejercicios interactivos
 */

const Exercises = {

  render(container, technique) {
    const renderer = this.renderers[technique.id];
    if (renderer) {
      renderer(container, technique);
    } else {
      this.renderGeneric(container, technique);
    }
  },

  // Generic exercise renderer
  renderGeneric(container, t) {
    container.innerHTML = `
      <div class="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
        <button class="border border-gray-600 text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors" onclick="App.goBack()">← Volver</button>

        <div class="text-center py-6">
          <span class="text-5xl block mb-2">${t.icon}</span>
          <h1 class="text-2xl font-bold text-white mb-2">${t.name} ${App.tip(t.id)}</h1>
          <p class="text-gray-400 text-sm">${t.origin} · ${t.duration} · ${t.frequency}</p>
          <p class="text-teal-400 text-sm mt-1">Evidencia: ${t.evidence}</p>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-3">¿Qué es?</h3>
          <p class="text-gray-400">${t.description}</p>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-3">¿Por qué funciona?</h3>
          <p class="text-gray-400">${t.why_it_works}</p>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-3">Pasos</h3>
          <ol class="space-y-3 list-decimal pl-6 text-gray-300">
            ${t.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-4">Practica ahora</h3>
          <div id="exercise-workspace">
            ${this.renderWorkspace(t)}
          </div>
          <button class="w-full bg-teal-500 text-white rounded-lg px-4 py-3 font-semibold hover:bg-teal-600 transition-colors mt-4" onclick="Exercises.save('${t.id}')">
            Guardar práctica
          </button>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-3">Historial</h3>
          <div id="exercise-history">
            ${this.renderHistory(t.id)}
          </div>
        </div>
      </div>
    `;
  },

  renderWorkspace(t) {
    switch (t.id) {
      case 'thought_record':
        return this.workspaceThoughtRecord();
      case 'gratitude_journal':
        return this.workspaceGratitude();
      case 'achievements_diary':
        return this.workspaceAchievements();
      case 'positive_data_log':
        return this.workspacePositiveData();
      case 'downward_arrow':
        return this.workspaceDownwardArrow();
      case 'compassionate_letter':
        return this.workspaceLetter();
      case 'relapse_prevention':
        return this.workspaceRelapsePrevention();
      default:
        return this.workspaceGenericNote();
    }
  },

  // Specific workspaces

  workspaceThoughtRecord() {
    return `
      <div class="space-y-4">
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">1. Situación — ¿Qué pasó?</label>
          <textarea id="tr-situation" rows="2" placeholder="Describe brevemente la situación..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">2. Emoción — ¿Qué sentiste? (0-100)</label>
          <input type="text" id="tr-emotion-name" placeholder="Ej: tristeza, ansiedad, vergüenza" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none">
          <input type="range" id="tr-emotion-intensity" min="0" max="100" value="50" class="w-full accent-teal-500"
            oninput="document.getElementById('tr-emotion-val').textContent = this.value + '%'">
          <span id="tr-emotion-val" class="text-gray-400 text-sm">50%</span>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">3. Pensamiento automático — ¿Qué pasó por tu mente?</label>
          <textarea id="tr-thought" rows="2" placeholder="El pensamiento exacto..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">4. Distorsión identificada ${App.tip('distortion_todo_nada')}</label>
          <select id="tr-distortion" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200">
            <option value="">Selecciona...</option>
            <option value="todo_nada">Todo-o-nada</option>
            <option value="sobregeneralizacion">Sobregeneralización</option>
            <option value="filtro_mental">Filtro mental</option>
            <option value="descalificar_positivo">Descalificar lo positivo</option>
            <option value="lectura_mente">Lectura de mente</option>
            <option value="catastrofizacion">Catastrofización</option>
            <option value="personalizacion">Personalización</option>
            <option value="etiquetado">Etiquetado</option>
            <option value="deberia">Los "debería"</option>
            <option value="razonamiento_emocional">Razonamiento emocional</option>
          </select>
          <div class="flex flex-wrap gap-1 mt-2">
            ${['todo_nada','sobregeneralizacion','filtro','descalificar','lectura_mente','catastrofizacion','personalizacion','etiquetado','deberia','razonamiento_emocional'].map(d =>
              '<span class="text-xs text-gray-600 hover:text-teal-400 cursor-pointer" onclick="App.showTooltip(\'distortion_' + d + '\')">' + d.replace(/_/g, ' ') + '</span>'
            ).join(' · ')}
          </div>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">5. Evidencia a favor — ¿Qué datos apoyan este pensamiento?</label>
          <textarea id="tr-evidence-for" rows="2" placeholder="Datos objetivos a favor..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">6. Evidencia en contra — ¿Qué datos lo contradicen?</label>
          <textarea id="tr-evidence-against" rows="2" placeholder="Datos objetivos en contra..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">7. Pensamiento alternativo equilibrado</label>
          <textarea id="tr-alternative" rows="2" placeholder="Una visión más realista y equilibrada..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Resultado — Nueva emoción (0-100)</label>
          <input type="range" id="tr-new-intensity" min="0" max="100" value="50" class="w-full accent-teal-500"
            oninput="document.getElementById('tr-new-val').textContent = this.value + '%'">
          <span id="tr-new-val" class="text-gray-400 text-sm">50%</span>
        </div>
      </div>
    `;
  },

  workspaceGratitude() {
    return `
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">Escribe 3 cosas por las que estás agradecido/a hoy. Sé específico/a y conecta con la emoción.</p>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">1.</label>
          <textarea id="grat-1" rows="2" placeholder="Estoy agradecido/a por..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">2.</label>
          <textarea id="grat-2" rows="2" placeholder="Estoy agradecido/a por..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">3.</label>
          <textarea id="grat-3" rows="2" placeholder="Estoy agradecido/a por..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
      </div>
    `;
  },

  workspaceAchievements() {
    return `
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">Registra 3 logros de hoy, por pequeños que sean. Pueden ser tareas completadas, momentos de valentía, o simplemente haber sobrevivido un día difícil.</p>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Logro 1</label>
          <textarea id="ach-1" rows="2" placeholder="Hoy logré..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Logro 2</label>
          <textarea id="ach-2" rows="2" placeholder="Hoy logré..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Logro 3</label>
          <textarea id="ach-3" rows="2" placeholder="Hoy logré..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
      </div>
    `;
  },

  workspacePositiveData() {
    return `
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">Registra evidencia que contradiga tu creencia nuclear negativa. ¿Qué pasó hoy que demuestra que no eres "defectuoso/a" o "inadecuado/a"?</p>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Mi creencia nuclear negativa:</label>
          <input type="text" id="pd-belief" placeholder="Ej: No soy suficiente" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none">
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Evidencia que la contradice (hoy):</label>
          <textarea id="pd-evidence1" rows="2" placeholder="Algo que hice, dije o experimenté que contradice esa creencia..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <textarea id="pd-evidence2" rows="2" placeholder="Otra evidencia..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <textarea id="pd-evidence3" rows="2" placeholder="Una más..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
      </div>
    `;
  },

  workspaceDownwardArrow() {
    return `
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">Sigue el hilo de tus pensamientos hasta la creencia más profunda. En cada nivel, pregúntate: "¿Y si eso fuera cierto, qué significaría?"</p>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Pensamiento inicial:</label>
          <textarea id="da-level1" rows="2" placeholder="Ej: Mi jefe no me saludó hoy" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="text-center text-lg text-teal-500 font-semibold py-2">↓ ¿Qué significaría si fuera cierto?</div>
        <div class="space-y-2 mb-4">
          <textarea id="da-level2" rows="2" placeholder="Significa que..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="text-center text-lg text-teal-500 font-semibold py-2">↓ ¿Y eso qué significaría?</div>
        <div class="space-y-2 mb-4">
          <textarea id="da-level3" rows="2" placeholder="Significa que..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="text-center text-lg text-teal-500 font-semibold py-2">↓ ¿Y eso qué dice de ti?</div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Creencia nuclear (lo más profundo):</label>
          <textarea id="da-core" rows="2" placeholder="En el fondo creo que..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y border-red-500/50"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Creencia alternativa más equilibrada:</label>
          <textarea id="da-alternative" rows="2" placeholder="Una visión más realista sería..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
      </div>
    `;
  },

  workspaceLetter() {
    return `
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">Escribe una carta desde la perspectiva de un amigo/a que te quiere incondicionalmente. Este amigo/a conoce toda tu historia, tus fortalezas y tus debilidades, y te acepta completamente.</p>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">¿Qué situación te está causando dolor?</label>
          <textarea id="letter-situation" rows="2" placeholder="Describe brevemente..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Carta de tu amigo/a compasivo/a:</label>
          <textarea id="letter-content" rows="10" placeholder="Querido/a [tu nombre],

Sé que estás pasando por un momento difícil..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
      </div>
    `;
  },

  workspaceRelapsePrevention() {
    return `
      <div class="space-y-6">
        <div class="bg-teal-500/10 rounded-lg p-4">
          <p class="text-teal-400 text-sm">Este plan te ayudará a mantener tus avances y saber qué hacer si notas que tu autoestima empieza a bajar de nuevo. Basado en Melemis (2015) y las 5 reglas de recuperación.</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white mb-2">1. Mis señales de alerta temprana</label>
          <p class="text-gray-500 text-xs mb-2">¿Cuáles son las primeras señales de que tu autoestima está bajando?</p>
          <div class="space-y-2">
            ${['Me aíslo socialmente', 'Mi autocrítica aumenta', 'Evito nuevas experiencias', 'Duermo mal', 'Dejo de hacer ejercicio', 'Me comparo más en redes', 'Dejo de hacer mis ejercicios de la guía', 'Me cuesta decir que no'].map((signal, i) => `
              <label class="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors">
                <input type="checkbox" id="rp-signal-${i}" class="accent-teal-500 w-4 h-4">
                <span class="text-gray-300 text-sm">${signal}</span>
              </label>
            `).join('')}
            <div class="mt-2">
              <input type="text" id="rp-signal-custom" placeholder="Otra señal personal..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none">
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white mb-2">2. Mi plan de acción ante una recaída</label>
          <p class="text-gray-500 text-xs mb-2">Cuando note las señales, ¿qué haré?</p>
          <textarea id="rp-action-immediate" rows="2" placeholder="Acción inmediata (ej: retomar pausa de autocompasión diaria)..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
          <textarea id="rp-action-week" rows="2" placeholder="Acción a 1 semana (ej: retomar ejercicio 3x/semana, registro de pensamientos)..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
          <textarea id="rp-action-professional" rows="2" placeholder="¿Cuándo buscar ayuda profesional? (ej: si después de 2 semanas no mejoro)..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white mb-2">3. Mi red de apoyo</label>
          <textarea id="rp-support-people" rows="2" placeholder="Personas de confianza a las que puedo llamar..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
          <textarea id="rp-support-professional" rows="2" placeholder="Profesional de salud mental (nombre, teléfono)..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white mb-2">4. Las 5 reglas de recuperación (Melemis, 2015)</label>
          <div class="space-y-2">
            ${[
              {rule: 'Cambiar mi vida', desc: 'Crear un entorno donde sea más fácil mantener mis avances'},
              {rule: 'Ser honesto/a conmigo', desc: 'Reconocer las señales de alerta sin minimizarlas'},
              {rule: 'Pedir ayuda', desc: 'No intentar solo/a; el apoyo social es protector'},
              {rule: 'Cuidarme', desc: 'Los básicos: sueño, alimentación, ejercicio, conexión'},
              {rule: 'No imponerme reglas imposibles', desc: 'Ser realista con mis expectativas'}
            ].map((r, i) => `
              <div class="bg-gray-800/50 rounded-lg p-3">
                <p class="text-teal-400 text-sm font-medium">${i + 1}. ${r.rule}</p>
                <p class="text-gray-500 text-xs">${r.desc}</p>
                <textarea id="rp-rule-${i}" rows="1" placeholder="¿Cómo aplicaré esta regla?" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y mt-2 text-sm"></textarea>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white mb-2">5. Mis hábitos de mantenimiento</label>
          <p class="text-gray-500 text-xs mb-2">¿Qué prácticas mantendré a largo plazo?</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${[
              'Mindfulness diario (10 min)',
              'Ejercicio 3-5x/semana',
              'Diario de gratitud 2-3x/semana',
              'Registro de cualidades positivas',
              'Límite de redes sociales',
              'Sueño 7-9 horas',
              'Conexión social semanal',
              'Re-evaluación trimestral'
            ].map((habit, i) => `
              <label class="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 cursor-pointer hover:bg-gray-800 transition-colors">
                <input type="checkbox" id="rp-habit-${i}" class="accent-teal-500 w-4 h-4">
                <span class="text-gray-300 text-xs">${habit}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="bg-gray-800/30 rounded-lg p-4 text-center">
          <p class="text-gray-400 text-sm">📅 Próxima re-evaluación recomendada:</p>
          <p class="text-white font-medium">${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('es', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
        </div>
      </div>
    `;
  },

  workspaceGenericNote() {
    return `
      <div class="space-y-4">
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Notas de la práctica:</label>
          <textarea id="generic-notes" rows="5" placeholder="Escribe tu experiencia con este ejercicio..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
        </div>
        <div class="space-y-2 mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">¿Cómo te sientes después? (1-10)</label>
          <input type="range" id="generic-mood" min="1" max="10" value="5" class="w-full accent-teal-500"
            oninput="document.getElementById('generic-mood-val').textContent = this.value + '/10'">
          <span id="generic-mood-val" class="text-gray-400 text-sm">5/10</span>
        </div>
      </div>
    `;
  },

  // Save exercise data
  save(exerciseId) {
    const data = {};

    // Collect all inputs in the workspace
    document.querySelectorAll('#exercise-workspace textarea, #exercise-workspace input, #exercise-workspace select').forEach(el => {
      if (el.id) {
        data[el.id] = el.type === 'range' ? parseInt(el.value) : el.value;
      }
    });

    if (Object.values(data).some(v => v && v !== '0' && v !== 0)) {
      Tracker.logExercise(exerciseId, data);
      alert('Práctica guardada correctamente ✓');

      // Refresh history
      const historyEl = document.getElementById('exercise-history');
      if (historyEl) {
        historyEl.innerHTML = this.renderHistory(exerciseId);
      }
    } else {
      alert('Completa al menos un campo antes de guardar.');
    }
  },

  // Render exercise history
  renderHistory(exerciseId) {
    const logs = Tracker.getExerciseLog(exerciseId);
    if (logs.length === 0) {
      return '<p class="text-center text-gray-500 italic py-8">Aún no tienes prácticas registradas. ¡Empieza ahora!</p>';
    }

    return `
      <div class="space-y-1">
        ${logs.slice(-5).reverse().map(log => {
          const date = new Date(log.date).toLocaleDateString('es', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          return `
            <div class="flex justify-between items-center py-2 border-b border-gray-800">
              <span class="text-gray-400 text-sm">${date}</span>
              <button class="border border-gray-600 text-gray-300 rounded-lg px-3 py-1 text-sm hover:bg-gray-800 transition-colors" onclick="Exercises.viewLog('${exerciseId}', '${log.date}')">Ver</button>
            </div>
          `;
        }).join('')}
        <p class="text-gray-500 text-sm mt-3">Total: ${logs.length} prácticas</p>
      </div>
    `;
  },

  viewLog(exerciseId, date) {
    const logs = Tracker.getExerciseLog(exerciseId);
    const log = logs.find(l => l.date === date);
    if (!log) return;

    const content = Object.entries(log)
      .filter(([k, v]) => k !== 'date' && v)
      .map(([k, v]) => `<p class="text-gray-300 mb-2"><strong class="text-gray-200">${k}:</strong> ${v}</p>`)
      .join('');

    // Simple modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-gray-800">
        <h3 class="text-xl font-bold text-white mb-4">Práctica del ${new Date(date).toLocaleDateString('es')}</h3>
        ${content}
        <button class="w-full bg-teal-500 text-white rounded-lg px-4 py-2 font-semibold hover:bg-teal-600 transition-colors mt-4" onclick="this.closest('.fixed').remove()">Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // Specific renderers for exercises that need custom UI
  renderers: {
    self_compassion_break(container, t) {
      let currentStep = 0;
      const steps = [
        {
          title: 'Paso 1: Mindfulness',
          instruction: 'Piensa en una situación que te causa estrés o dolor en este momento...',
          phrase: '"Este es un momento de sufrimiento"',
          alternatives: ['"Esto duele"', '"Esto es difícil"', '"Estoy pasándola mal"'],
          duration: 60
        },
        {
          title: 'Paso 2: Humanidad Compartida',
          instruction: 'Recuerda que no estás solo/a en esto...',
          phrase: '"El sufrimiento es parte de la vida"',
          alternatives: ['"Otras personas sienten esto"', '"No estoy solo/a"', '"Todos luchamos"'],
          duration: 60
        },
        {
          title: 'Paso 3: Amabilidad',
          instruction: 'Pon tus manos sobre tu corazón o donde se sienta reconfortante...',
          phrase: '"Que pueda ser amable conmigo mismo/a"',
          alternatives: ['"Que pueda aceptarme tal como soy"', '"Que pueda perdonarme"', '"Que pueda darme lo que necesito"'],
          duration: 90
        }
      ];

      function renderStep() {
        const step = steps[currentStep];
        const isLast = currentStep === steps.length - 1;

        container.innerHTML = `
          <div class="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
            <button class="border border-gray-600 text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors" onclick="App.goBack()">← Volver</button>

            <div class="text-center py-6">
              <span class="text-5xl block mb-2">${t.icon}</span>
              <h1 class="text-2xl font-bold text-white mb-2">${t.name} ${App.tip(t.id)}</h1>
              <p class="text-gray-400 text-sm">Duración: 5 minutos · Evidencia: g=0.75</p>
            </div>

            <div class="flex items-center justify-center gap-3 py-4">
              ${steps.map((s, i) => `
                <span class="w-3 h-3 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-teal-500 scale-125' : i < currentStep ? 'bg-green-500' : 'bg-gray-700'}"></span>
              `).join('')}
            </div>

            <div class="bg-gray-800/50 rounded-xl p-8 text-center">
              <h2 class="text-xl font-bold text-white mb-4">${step.title}</h2>
              <p class="text-gray-300 mb-4">${step.instruction}</p>
              <blockquote class="text-xl font-semibold text-teal-400 bg-teal-500/10 rounded-xl p-6 my-4">${step.phrase}</blockquote>
              <p class="text-gray-500 text-sm mt-4">Alternativas: ${step.alternatives.join(' · ')}</p>
              <div class="text-gray-400 mt-4 text-sm" id="step-timer">
                Tómate ${step.duration} segundos...
              </div>
            </div>

            <div class="flex justify-between items-center pt-4">
              ${currentStep > 0 ? `<button class="border border-gray-600 text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors" onclick="Exercises.renderers.self_compassion_break.prev()">← Anterior</button>` : '<div></div>'}
              ${!isLast ?
                `<button class="bg-teal-500 text-white rounded-lg px-6 py-2 font-semibold hover:bg-teal-600 transition-colors" onclick="Exercises.renderers.self_compassion_break.next()">Siguiente paso →</button>` :
                `<button class="bg-teal-500 text-white rounded-lg px-6 py-2 font-semibold hover:bg-teal-600 transition-colors" onclick="Exercises.renderers.self_compassion_break.finish(this)">Finalizar ✓</button>`
              }
            </div>
          </div>
        `;
      }

      // Store navigation functions
      Exercises.renderers.self_compassion_break.next = () => { currentStep++; renderStep(); };
      Exercises.renderers.self_compassion_break.prev = () => { currentStep--; renderStep(); };
      Exercises.renderers.self_compassion_break.finish = () => {
        container.innerHTML = `
          <div class="min-h-screen p-4 max-w-2xl mx-auto space-y-6">
            <div class="text-center bg-gray-900 rounded-xl p-8 border border-gray-800">
              <span class="text-5xl block mb-4">💚</span>
              <h2 class="text-2xl font-bold text-white mb-2">Práctica completada</h2>
              <p class="text-gray-400 mb-6">Has completado la Pausa de Autocompasión.</p>
              <div class="space-y-2 mb-4 text-left">
                <label class="block text-sm font-medium text-gray-300 mb-1">¿Cómo te sientes ahora? (1-10)</label>
                <input type="range" id="scb-mood" min="1" max="10" value="6" class="w-full accent-teal-500"
                  oninput="document.getElementById('scb-mood-val').textContent = this.value + '/10'">
                <span id="scb-mood-val" class="text-gray-400 text-sm">6/10</span>
              </div>
              <div class="space-y-2 mb-6 text-left">
                <label class="block text-sm font-medium text-gray-300 mb-1">Notas (opcional)</label>
                <textarea id="scb-notes" rows="3" placeholder="¿Qué notaste durante la práctica?" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-y"></textarea>
              </div>
              <div class="flex flex-col gap-3">
                <button class="w-full bg-teal-500 text-white rounded-lg px-4 py-3 font-semibold hover:bg-teal-600 transition-colors" onclick="Exercises.save('self_compassion_break')">Guardar</button>
                <button class="w-full border border-gray-600 text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors" onclick="App.navigate('exercises')">Volver a ejercicios</button>
              </div>
            </div>
          </div>
        `;
      };

      renderStep();
    }
  }
};
