/**
 * profiles.js — Determinación de perfil y generación de plan personalizado
 * Compatible con app.js: usa objeto global Profiles
 */

const Profiles = {

  catalog: {
    autocritico: {
      name: 'El Autocrítico',
      emoji: '🪞',
      description: 'Tu patrón principal es la autocrítica elevada combinada con baja autocompasión. Esto mantiene un ciclo donde los pensamientos negativos sobre ti se refuerzan constantemente. Tu diálogo interno está dominado por una voz crítica que magnifica errores y minimiza logros.',
      encouragement: 'La buena noticia: este patrón responde muy bien a las técnicas de autocompasión (g=0.75 en meta-análisis). Reconocer tu autocrítica ya es un acto de valentía. Vamos a aprender a tratarte con la misma amabilidad que le darías a un amigo cercano.'
    },
    impostor: {
      name: 'El Impostor',
      emoji: '🎭',
      description: 'Sientes que tus logros no son merecidos y temes ser "descubierto/a". El perfeccionismo y la dificultad para internalizar el éxito te mantienen en un ciclo de ansiedad y sobreesfuerzo. Aproximadamente el 70% de las personas experimentan esto en algún momento.',
      encouragement: 'El síndrome del impostor afecta especialmente a personas altamente capaces. El hecho de que te preocupe tu desempeño demuestra tu compromiso. Vamos a trabajar en que reconozcas lo que realmente mereces.'
    },
    comparador: {
      name: 'El Comparador Social',
      emoji: '📱',
      description: 'Tu autoestima está fuertemente influenciada por las comparaciones sociales, especialmente en redes sociales. La imagen que otros proyectan se convierte en tu vara de medida personal, generando una autoestima inestable y contingente.',
      encouragement: 'Las redes sociales muestran versiones editadas de la realidad. Tu camino es único y valioso. Vamos a construir una autoestima basada en tus valores, no en comparaciones.'
    },
    sometido: {
      name: 'El Sometido',
      emoji: '🤐',
      description: 'Te cuesta expresar tus necesidades y establecer límites. Priorizas la aprobación de los demás sobre tu bienestar, lo que erosiona tu sentido de valor propio con el tiempo. Cada vez que no te expresas, envías un mensaje a tu cerebro de que tus necesidades no importan.',
      encouragement: 'Tu capacidad de empatía es una fortaleza, pero mereces dirigir esa misma consideración hacia ti. Aprender a decir "no" y expresar tus necesidades es un acto de amor propio, no de egoísmo.'
    },
    desconectado: {
      name: 'El Desconectado',
      emoji: '🌫️',
      description: 'Existe una desconexión entre tu mente y tu cuerpo. El sedentarismo, el mal sueño o el estrés crónico están afectando tu autoestima desde su base biológica. Tu cuerpo necesita atención para que tu mente pueda funcionar mejor.',
      encouragement: 'Tu cuerpo es tu hogar. Reconectarte con él a través del ejercicio (d=0.49 en autoestima), mejorar tu sueño y reducir el estrés puede transformar profundamente cómo te percibes.'
    },
    mixto: {
      name: 'Perfil Mixto',
      emoji: '🔀',
      description: 'Tu perfil muestra varias áreas que necesitan atención simultáneamente. Esto es lo más común — la autoestima es un sistema complejo donde múltiples factores se interconectan.',
      encouragement: 'Tener múltiples áreas de trabajo no significa que estés peor. Significa que tienes múltiples oportunidades de mejora. Vamos a priorizar las más urgentes y avanzar paso a paso.'
    }
  },

  // Determine profile from scores
  determineProfile(scores) {
    const checks = {
      autocritico: this.checkAutocritico(scores),
      impostor: this.checkImpostor(scores),
      comparador: this.checkComparador(scores),
      sometido: this.checkSometido(scores),
      desconectado: this.checkDesconectado(scores)
    };

    // Sort by score
    const sorted = Object.entries(checks).sort((a, b) => b[1] - a[1]);
    const [primaryKey, primaryScore] = sorted[0];
    const [secondaryKey, secondaryScore] = sorted[1];

    let profileKey = primaryScore > 0 ? primaryKey : 'mixto';

    const profile = {
      ...this.catalog[profileKey],
      key: profileKey,
      secondary: secondaryScore > 0 ? this.catalog[secondaryKey].name : null,
      priorities: this.getPriorityAreas(scores)
    };

    return profile;
  },

  checkAutocritico(s) {
    let score = 0;
    if (s.rosenberg?.score < 25) score += 2;
    if (s.scs?.score < 2.5) score += 3;
    if (s.perfectionism?.score > 18) score += 2;
    return score;
  },

  checkImpostor(s) {
    let score = 0;
    if (s.impostor?.score > 30) score += 3;
    if (s.impostor?.score > 40) score += 2;
    if (s.perfectionism?.score > 15) score += 1;
    return score;
  },

  checkComparador(s) {
    let score = 0;
    if (s.social_media?.score > 18) score += 3;
    if (s.social_media?.score > 12) score += 1;
    if (s.rosenberg?.score < 30) score += 1;
    return score;
  },

  checkSometido(s) {
    let score = 0;
    if (s.assertiveness?.score < 20) score += 3;
    if (s.assertiveness?.score < 25) score += 1;
    if (s.rosenberg?.score < 30) score += 1;
    return score;
  },

  checkDesconectado(s) {
    let score = 0;
    if (s.physical?.score < 14) score += 3;
    if (s.physical?.score < 18) score += 1;
    if (s.rosenberg?.score < 30) score += 1;
    return score;
  },

  // Get top 3 priority areas
  getPriorityAreas(scores) {
    const areas = [
      { area: 'Autocompasión', key: 'scs', reason: 'Tu nivel de autocompasión es bajo. Es la base para una relación sana contigo mismo/a.', priority: scores.scs?.score < 2.5 ? 3 : scores.scs?.score < 3.5 ? 1 : 0 },
      { area: 'Autoestima', key: 'rosenberg', reason: 'Tu autoestima general necesita refuerzo. Es el indicador central de este proceso.', priority: scores.rosenberg?.score < 25 ? 3 : scores.rosenberg?.score < 30 ? 1 : 0 },
      { area: 'Síndrome del impostor', key: 'impostor', reason: 'Experimentas sentimientos frecuentes de no merecer tus logros.', priority: scores.impostor?.score > 40 ? 3 : scores.impostor?.score > 30 ? 2 : 0 },
      { area: 'Asertividad', key: 'assertiveness', reason: 'Tu capacidad de expresarte y poner límites necesita desarrollo.', priority: scores.assertiveness?.score < 20 ? 3 : scores.assertiveness?.score < 25 ? 1 : 0 },
      { area: 'Impacto de redes sociales', key: 'social_media', reason: 'Las redes sociales están afectando significativamente tu autoimagen.', priority: scores.social_media?.score > 18 ? 3 : scores.social_media?.score > 12 ? 1 : 0 },
      { area: 'Bienestar físico', key: 'physical', reason: 'Tu sueño, ejercicio y autocuidado necesitan atención para apoyar tu salud mental.', priority: scores.physical?.score < 14 ? 3 : scores.physical?.score < 18 ? 1 : 0 },
      { area: 'Perfeccionismo', key: 'perfectionism', reason: 'Tu nivel de autoexigencia está erosionando tu autoestima.', priority: scores.perfectionism?.score > 18 ? 3 : scores.perfectionism?.score > 12 ? 1 : 0 }
    ];

    return areas.filter(a => a.priority > 0).sort((a, b) => b.priority - a.priority).slice(0, 3);
  },

  // Get recommended techniques ordered by relevance
  getRecommendedTechniques(profile, scores, techniques) {
    if (!techniques || !techniques.length) {
      // Fallback if techniques data not loaded
      techniques = (typeof App !== 'undefined' && App.techniquesData?.techniques) || [];
    }

    const profileKey = profile.key || 'mixto';

    return techniques.map(t => {
      const priority = t.profiles?.[profileKey] || 1;
      return { ...t, priority };
    }).sort((a, b) => b.priority - a.priority);
  },

  // Generate 4-phase plan
  generatePlanPhases(profile, techniques) {
    const phases = [
      {
        name: 'Fundamentos',
        weeks: 'Semanas 1-2',
        description: 'Establece las bases: psicoeducación, autocompasión básica y mindfulness',
        techniques: techniques.filter(t => t.phase === 1 || (t.priority === 3 && t.phase <= 2)).slice(0, 4).map(t => ({...t}))
      },
      {
        name: 'Intervención Activa',
        weeks: 'Semanas 3-6',
        description: 'Técnicas principales según tu perfil',
        techniques: techniques.filter(t => t.phase === 2 || t.priority === 3).slice(0, 5).map(t => ({...t}))
      },
      {
        name: 'Profundización',
        weeks: 'Semanas 7-10',
        description: 'Trabajo con creencias profundas, valores y experimentos conductuales',
        techniques: techniques.filter(t => t.phase === 3 || t.priority === 2).slice(0, 4).map(t => ({...t}))
      },
      {
        name: 'Mantenimiento',
        weeks: 'Semanas 11-12+',
        description: 'Consolidar hábitos, re-evaluar y plan a largo plazo',
        techniques: [
          { id: 'reassessment', name: 'Re-evaluación', icon: '📊', description: 'Repite los cuestionarios para medir tu progreso', evidence: 'Pre-post comparison', frequency: 'Una vez', duration: '15 min', priority: 3, phase: 4 },
          { id: 'maintenance_checklist', name: 'Checklist semanal', icon: '📋', description: 'Hábitos que protegen tu autoestima a largo plazo', evidence: 'Prevención de recaídas (Melemis, 2015)', frequency: 'Semanal', duration: '5 min', priority: 3, phase: 4 }
        ]
      }
    ];

    // Remove duplicate techniques across phases
    const seen = new Set();
    phases.forEach(phase => {
      phase.techniques = phase.techniques.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    });

    return phases;
  }
};
