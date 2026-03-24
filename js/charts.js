/**
 * charts.js — Gráficos simples con Canvas
 */

const Charts = {

  // Radar chart for dashboard
  drawRadar(canvasId, scores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 50;

    // Dimensions to plot (normalize all to 0-1)
    const dims = [
      { label: 'Autoestima', value: (scores.rosenberg?.score || 25) / 40 },
      { label: 'Autocompasión', value: (scores.scs?.score || 2.5) / 5 },
      { label: 'Impostor\n(invertido)', value: 1 - ((scores.impostor?.score || 25) / 50) },
      { label: 'Asertividad', value: (scores.assertiveness?.score || 20) / 40 },
      { label: 'Bienestar\nFísico', value: (scores.physical?.score || 15) / 30 },
      { label: 'Redes\n(invertido)', value: 1 - ((scores.social_media?.score || 12) / 25) },
      { label: 'Perfeccionismo\n(invertido)', value: 1 - ((scores.perfectionism?.score || 12) / 25) }
    ];

    const n = dims.length;
    const angleStep = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, w, h);

    // Draw grid circles
    ctx.strokeStyle = '#e0d8cf';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      for (let j = 0; j <= n; j++) {
        const angle = -Math.PI / 2 + j * angleStep;
        const x = cx + Math.cos(angle) * (r * i / 4);
        const y = cy + Math.sin(angle) * (r * i / 4);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = '#d0c8bf';
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    // Draw "healthy range" area (0.5-0.8)
    ctx.fillStyle = 'rgba(74, 155, 142, 0.1)';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = -Math.PI / 2 + (i % n) * angleStep;
      const x = cx + Math.cos(angle) * (r * 0.7);
      const y = cy + Math.sin(angle) * (r * 0.7);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fill();

    // Draw user data
    ctx.fillStyle = 'rgba(232, 152, 94, 0.3)';
    ctx.strokeStyle = '#E8985E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = -Math.PI / 2 + (i % n) * angleStep;
      const val = dims[i % n].value;
      const x = cx + Math.cos(angle) * (r * val);
      const y = cy + Math.sin(angle) * (r * val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.stroke();

    // Draw points
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const val = dims[i].value;
      const x = cx + Math.cos(angle) * (r * val);
      const y = cy + Math.sin(angle) * (r * val);

      ctx.fillStyle = '#E8985E';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = '#2D3436';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = cx + Math.cos(angle) * (r + 35);
      const y = cy + Math.sin(angle) * (r + 35);

      const lines = dims[i].label.split('\n');
      lines.forEach((line, li) => {
        ctx.fillText(line, x, y + li * 14);
      });
    }
  },

  // Progress chart for tracker
  drawProgress(canvasId, history) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // Draw axes
    ctx.strokeStyle = '#d0c8bf';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    const n = history.length;
    const stepX = plotW / (n - 1);

    // Draw wellbeing line
    this.drawLine(ctx, history, 'wellbeing', padding, stepX, plotH, '#4A9B8E', 10);

    // Draw self-criticism line (inverted: lower is better)
    this.drawLine(ctx, history, 'selfCriticism', padding, stepX, plotH, '#E74C3C', 10);

    // Draw week labels
    ctx.fillStyle = '#666';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    history.forEach((week, i) => {
      const x = padding.left + i * stepX;
      ctx.fillText(`S${week.week}`, x, h - padding.bottom + 20);
    });

    // Legend
    ctx.fillStyle = '#4A9B8E';
    ctx.fillRect(padding.left, h - 12, 12, 3);
    ctx.fillStyle = '#2D3436';
    ctx.textAlign = 'left';
    ctx.fillText('Bienestar', padding.left + 16, h - 8);

    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(padding.left + 100, h - 12, 12, 3);
    ctx.fillStyle = '#2D3436';
    ctx.fillText('Autocrítica', padding.left + 116, h - 8);
  },

  drawLine(ctx, history, key, padding, stepX, plotH, color, maxVal) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    history.forEach((week, i) => {
      const x = padding.left + i * stepX;
      const val = week[key] || 5;
      const y = padding.top + plotH - (val / maxVal) * plotH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    history.forEach((week, i) => {
      const x = padding.left + i * stepX;
      const val = week[key] || 5;
      const y = padding.top + plotH - (val / maxVal) * plotH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};
