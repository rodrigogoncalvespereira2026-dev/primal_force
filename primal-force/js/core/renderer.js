const Renderer = {
  screenX(x, y, cam) { return x - cam.flatX; },
  screenY(x, y, cam) { return y - cam.flatY; },

  chibi(ctx, sx, sy, size, color, opt = {}) {
    const headR = size * 0.5;
    const bodyH = size * 0.35;
    const bodyW = size * 0.4;

    ctx.save();

    // Sombra no chão
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + size * 0.2, size * 0.5, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo
    ctx.fillStyle = opt.bodyColor || color;
    const bodyTop = sy - headR * 0.15;
    ctx.beginPath();
    ctx.moveTo(sx - bodyW * 0.5, bodyTop + bodyH * 0.15);
    ctx.quadraticCurveTo(sx - bodyW * 0.5, bodyTop + bodyH, sx, bodyTop + bodyH);
    ctx.quadraticCurveTo(sx + bodyW * 0.5, bodyTop + bodyH, sx + bodyW * 0.5, bodyTop + bodyH * 0.15);
    ctx.quadraticCurveTo(sx + bodyW * 0.5, bodyTop, sx, bodyTop);
    ctx.quadraticCurveTo(sx - bodyW * 0.5, bodyTop, sx - bodyW * 0.5, bodyTop + bodyH * 0.15);
    ctx.fill();

    // Cabeça
    const headCy = sy - headR * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, headCy, headR, 0, Math.PI * 2);
    ctx.fill();

    // Brilho na cabeça
    if (!opt.mat) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(sx - headR * 0.3, headCy - headR * 0.3, headR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Olhos
    const eyeSp = headR * 0.35;
    const eyeY = headCy + headR * 0.05;
    const eyeR = headR * 0.22;
    const pupilR = eyeR * 0.55;
    const hlR = eyeR * 0.28;

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(sx - eyeSp, eyeY, eyeR, eyeR * 1.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + eyeSp, eyeY, eyeR, eyeR * 1.15, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = opt.angry ? '#aa0000' : '#222';
    ctx.beginPath(); ctx.arc(sx - eyeSp + 0.5, eyeY + 0.5, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + eyeSp + 0.5, eyeY + 0.5, pupilR, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx - eyeSp - 0.5, eyeY - 1, hlR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + eyeSp - 0.5, eyeY - 1, hlR, 0, Math.PI * 2); ctx.fill();

    if (opt.squint) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - eyeSp - eyeR * 0.8, eyeY - eyeR * 0.6);
      ctx.lineTo(sx - eyeSp + eyeR * 0.8, eyeY - eyeR * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + eyeSp - eyeR * 0.8, eyeY - eyeR * 0.6);
      ctx.lineTo(sx + eyeSp + eyeR * 0.8, eyeY - eyeR * 0.6);
      ctx.stroke();
    }

    // Boca
    const mouthY = headCy + headR * 0.45;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    if (opt.openMouth) {
      ctx.fillStyle = '#300';
      ctx.beginPath();
      ctx.arc(sx, mouthY + 1, headR * 0.22, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(sx, mouthY, headR * 0.22, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    ctx.restore();
  },

  enemyChibi(ctx, sx, sy, size, color, opt = {}) {
    ctx.save();
    const headR = size * 0.45;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + size * 0.15, size * 0.45, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo
    ctx.fillStyle = color;
    const by = sy - headR * 0.1;
    ctx.beginPath();
    ctx.arc(sx, by + size * 0.15, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, headR, 0, Math.PI * 2);
    ctx.fill();

    // Olho (inimigos têm 1 olho grande)
    const eyeR = headR * 0.35;
    ctx.fillStyle = opt.eyeColor || '#ff0';
    ctx.beginPath();
    ctx.arc(sx, sy + 2, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sx + 1, sy + 3, eyeR * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx, sy, eyeR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  bossChibi(ctx, sx, sy, size, color, colorAlt, opt = {}) {
    ctx.save();
    const headR = size * 0.4;
    const bodyR = size * 0.3;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + size * 0.2, size * 0.55, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura
    if (opt.phase2) {
      ctx.fillStyle = colorAlt + '22';
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.8 + Math.sin(opt.animT * 0.12) * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corpo
    ctx.fillStyle = colorAlt;
    const bodyCy = sy;
    ctx.beginPath();
    ctx.arc(sx, bodyCy + size * 0.1, bodyR, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.15, headR, 0, Math.PI * 2);
    ctx.fill();

    // Brilho
    if (!opt.mat) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.arc(sx - headR * 0.3, sy - size * 0.15 - headR * 0.3, headR * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Olhos
    const eyeSp = headR * 0.3;
    const eyeY = sy - size * 0.15 + headR * 0.1;
    const eyeR = headR * 0.25;
    const pupilR = eyeR * 0.5;

    ctx.fillStyle = opt.eyeColor || '#fff';
    ctx.beginPath(); ctx.ellipse(sx - eyeSp, eyeY, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + eyeSp, eyeY, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = opt.pupilColor || '#a00';
    ctx.beginPath(); ctx.arc(sx - eyeSp + 1, eyeY + 1, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + eyeSp + 1, eyeY + 1, pupilR, 0, Math.PI * 2); ctx.fill();

    // Sobrancelhas raivosas
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx - eyeSp - eyeR * 0.7, eyeY - eyeR * 1.2);
    ctx.lineTo(sx - eyeSp + eyeR * 0.5, eyeY - eyeR * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + eyeSp + eyeR * 0.7, eyeY - eyeR * 1.2);
    ctx.lineTo(sx + eyeSp - eyeR * 0.5, eyeY - eyeR * 0.7);
    ctx.stroke();

    // Boca aberta (boss)
    ctx.fillStyle = '#400';
    ctx.beginPath();
    ctx.arc(sx, sy + headR * 0.35, headR * 0.25, 0, Math.PI);
    ctx.fill();

    ctx.restore();
  }
};
