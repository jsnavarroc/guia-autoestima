/**
 * scoring.js — Puntuación de todas las escalas de evaluación
 * Compatible con app.js: recibe answers como {questionId: value}
 */

const Scoring = {

  // Helper: reverse a Likert item
  reverse(value, max) {
    return max + 1 - value;
  },

  // Extract answers for a section from flat answers object
  // e.g., answers = {ros_1: 3, ros_2: 4, ...} → [3, 4, ...]
  extractSection(answers, prefix, count) {
    const result = [];
    for (let i = 1; i <= count; i++) {
      const key = `${prefix}_${i}`;
      result.push(parseInt(answers[key]) || 0);
    }
    return result;
  },

  // Score all scales at once
  scoreAll(answers, sections) {
    const results = {
      rosenberg: this.scoreRosenberg(this.extractSection(answers, 'ros', 10)),
      scs: this.scoreSCS(this.extractSection(answers, 'scs', 12)),
      impostor: this.scoreImpostor(this.extractSection(answers, 'imp', 10)),
      assertiveness: this.scoreAssertiveness(this.extractSection(answers, 'as', 8)),
      social_media: this.scoreSocialMedia(this.extractSection(answers, 'sm', 5)),
      physical: this.scorePhysical(this.extractSection(answers, 'ph', 6)),
      perfectionism: this.scorePerfectionism(this.extractSection(answers, 'pf', 5)),
      screening: this.scoreScreening([
        parseInt(answers.phq_1) || 0,
        parseInt(answers.phq_2) || 0,
        parseInt(answers.gad_1) || 0,
        parseInt(answers.gad_2) || 0
      ])
    };

    // Add colors based on level
    for (const key of Object.keys(results)) {
      const r = results[key];
      if (r.level === 'Baja' || r.level === 'Bajo' || r.level === 'Deficiente') {
        r.color = '#E74C3C';
      } else if (r.level === 'Moderada' || r.level === 'Moderado' || r.level === 'Adecuado') {
        r.color = '#F39C12';
      } else if (r.level === 'Alta' || r.level === 'Alto' || r.level === 'Óptimo') {
        r.color = '#27AE60';
      } else if (r.level === 'Frecuente') {
        r.color = '#E67E22';
      } else if (r.level === 'Intenso') {
        r.color = '#E74C3C';
      } else if (r.level === 'Bajo impacto' || r.level === 'Sin riesgo') {
        r.color = '#27AE60';
      } else if (r.level === 'Impacto moderado' || r.level === 'Riesgo leve') {
        r.color = '#F39C12';
      } else if (r.level === 'Riesgo moderado') {
        r.color = '#E67E22';
      } else if (r.level === 'Alto impacto' || r.level === 'Riesgo alto') {
        r.color = '#E74C3C';
      }
    }

    return results;
  },

  // 1. Rosenberg Self-Esteem Scale (10 items, 1-4)
  // Reverse items: 3, 5, 8, 9, 10 (1-indexed)
  scoreRosenberg(items) {
    const reverseIdx = [2, 4, 7, 8, 9]; // 0-indexed
    let score = 0;
    items.forEach((val, i) => {
      score += reverseIdx.includes(i) ? this.reverse(val, 4) : val;
    });
    score = Math.max(10, Math.min(40, score));

    let level;
    if (score < 25) level = 'Baja';
    else if (score < 35) level = 'Moderada';
    else level = 'Alta';

    return { score, level };
  },

  // 2. SCS-SF (12 items, 1-5)
  // Reverse items (negative subscales): 1, 4, 8, 9, 11, 12 (1-indexed)
  scoreSCS(items) {
    const reverseIdx = [0, 3, 7, 8, 10, 11]; // 0-indexed
    let total = 0;
    items.forEach((val, i) => {
      total += reverseIdx.includes(i) ? this.reverse(val, 5) : val;
    });
    const score = Math.round((total / 12) * 100) / 100;

    let level;
    if (score < 2.5) level = 'Baja';
    else if (score <= 3.5) level = 'Moderada';
    else level = 'Alta';

    return { score, level };
  },

  // 3. Impostor (10 items, 1-5, all direct)
  scoreImpostor(items) {
    let score = items.reduce((a, b) => a + b, 0);
    score = Math.max(10, Math.min(50, score));

    let level;
    if (score <= 20) level = 'Bajo';
    else if (score <= 30) level = 'Moderado';
    else if (score <= 40) level = 'Frecuente';
    else level = 'Intenso';

    return { score, level };
  },

  // 4. Assertiveness (8 items, 1-5, all direct)
  scoreAssertiveness(items) {
    let score = items.reduce((a, b) => a + b, 0);
    score = Math.max(8, Math.min(40, score));

    let level;
    if (score < 20) level = 'Baja';
    else if (score <= 30) level = 'Moderada';
    else level = 'Alta';

    return { score, level };
  },

  // 5. Social Media (5 items, 1-5, all direct — higher = worse)
  scoreSocialMedia(items) {
    let score = items.reduce((a, b) => a + b, 0);
    score = Math.max(5, Math.min(25, score));

    let level;
    if (score <= 10) level = 'Bajo impacto';
    else if (score <= 18) level = 'Impacto moderado';
    else level = 'Alto impacto';

    return { score, level };
  },

  // 6. Physical (6 items, 1-5, all direct)
  scorePhysical(items) {
    let score = items.reduce((a, b) => a + b, 0);
    score = Math.max(6, Math.min(30, score));

    let level;
    if (score < 14) level = 'Deficiente';
    else if (score <= 22) level = 'Adecuado';
    else level = 'Óptimo';

    return { score, level };
  },

  // 7. Perfectionism (5 items, 1-5, all direct — higher = worse)
  scorePerfectionism(items) {
    let score = items.reduce((a, b) => a + b, 0);
    score = Math.max(5, Math.min(25, score));

    let level;
    if (score <= 10) level = 'Bajo';
    else if (score <= 18) level = 'Moderado';
    else level = 'Alto';

    return { score, level };
  },

  // 8. PHQ-2 + GAD-2 Screening (4 items, 0-3)
  // PHQ-2: phq_1, phq_2 (depression) — score ≥3 = positive screen
  // GAD-2: gad_1, gad_2 (anxiety) — score ≥3 = positive screen
  scoreScreening(items) {
    const phq2 = (items[0] || 0) + (items[1] || 0);
    const gad2 = (items[2] || 0) + (items[3] || 0);
    const total = phq2 + gad2;

    const depressionRisk = phq2 >= 3;
    const anxietyRisk = gad2 >= 3;

    let level;
    if (total <= 2) level = 'Sin riesgo';
    else if (total <= 5) level = 'Riesgo leve';
    else if (total <= 8) level = 'Riesgo moderado';
    else level = 'Riesgo alto';

    return {
      score: total,
      level,
      phq2,
      gad2,
      depressionRisk,
      anxietyRisk,
      needsReferral: depressionRisk || anxietyRisk || total >= 6
    };
  }
};
