// Interactive SVG Circle of Fifths Component with Velocity Sensitivity
// Renders the 12-wedge wheel with Major outer ring and Minor inner ring
// Computes dynamic velocity based on touch/click position (outer = forte, inner = piano) or pointer pressure

class CircleOfFifths {
  constructor(containerId, onKeySelect) {
    this.container = document.getElementById(containerId);
    this.onKeySelect = onKeySelect;
    this.selectedKey = 'C';
    this.selectedMode = 'major'; // 'major' or 'minor'
    this.size = 380;
    this.center = this.size / 2;
    this.outerRadius = this.size * 0.46;
    this.midRadius = this.size * 0.32;
    this.innerRadius = this.size * 0.18;

    this.render();
  }

  setKey(key, mode = 'major') {
    this.selectedKey = key;
    this.selectedMode = mode;
    this.render();
  }

  describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
    const startOuter = this.polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = this.polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = this.polarToCartesian(x, y, innerRadius, startAngle);
    const endInner = this.polarToCartesian(x, y, innerRadius, endAngle);

    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', startOuter.x, startOuter.y,
      'A', outerRadius, outerRadius, 0, arcSweep, 0, endOuter.x, endOuter.y,
      'L', startInner.x, startInner.y,
      'A', innerRadius, innerRadius, 0, arcSweep, 1, endInner.x, endInner.y,
      'Z'
    ].join(' ');
  }

  polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  // Calculate velocity (30..127) from click/touch coordinates relative to SVG center
  computeVelocity(event, mode) {
    // If device supports hardware pressure (stylus / touch)
    if (event.pressure && event.pressure > 0.05 && event.pressure < 1.0) {
      return Math.round(35 + event.pressure * 92);
    }

    const svg = this.container.querySelector('svg');
    if (!svg) return 90;

    const rect = svg.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Scale to viewBox coordinates
    const scale = this.size / rect.width;
    const svgX = clickX * scale;
    const svgY = clickY * scale;

    const dx = svgX - this.center;
    const dy = svgY - this.center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let innerR = (mode === 'major') ? this.midRadius : this.innerRadius;
    let outerR = (mode === 'major') ? this.outerRadius : this.midRadius;

    // Calculate normalized radial ratio (0.0 at inner edge, 1.0 at outer edge)
    const ratio = Math.max(0, Math.min(1, (distance - innerR) / (outerR - innerR)));

    // Map: inner edge = piano (45), outer edge = fortissimo (127)
    const velocity = Math.round(45 + ratio * 82);
    return Math.max(35, Math.min(127, velocity));
  }

  render() {
    if (!this.container) return;

    const currentIdx = CIRCLE_OF_FIFTHS.findIndex(item => 
      this.selectedMode === 'major' ? item.root === this.selectedKey : item.minor.replace('m', '') === this.selectedKey
    );
    const activeIndex = currentIdx !== -1 ? currentIdx : 0;

    let svgHtml = `
      <svg viewBox="0 0 ${this.size} ${this.size}" class="circle-svg select-none w-full max-w-[380px] h-auto drop-shadow-2xl">
        <defs>
          <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </radialGradient>
        </defs>
    `;

    const angleStep = 360 / 12;

    // Draw 12 Sectors
    CIRCLE_OF_FIFTHS.forEach((item, index) => {
      const angleCenter = index * angleStep;
      const startAngle = angleCenter - angleStep / 2;
      const endAngle = angleCenter + angleStep / 2;

      const diff = (index - activeIndex + 12) % 12;
      let outerColorClass = 'fill-slate-800/80 stroke-slate-700/60 hover:fill-slate-700/90';
      let innerColorClass = 'fill-slate-900/90 stroke-slate-700/60 hover:fill-slate-800';
      let outerTextClass = 'fill-slate-300 font-semibold';
      let innerTextClass = 'fill-slate-400 font-medium text-xs';

      if (this.selectedMode === 'major') {
        if (diff === 0) {
          outerColorClass = 'fill-indigo-600 stroke-indigo-400 fill-opacity-95';
          outerTextClass = 'fill-white font-bold text-base filter drop-shadow';
          innerColorClass = 'fill-indigo-900 stroke-indigo-500 fill-opacity-80';
          innerTextClass = 'fill-indigo-200 font-bold';
        } else if (diff === 1) {
          outerColorClass = 'fill-amber-600/85 stroke-amber-400/80';
          outerTextClass = 'fill-white font-bold';
          innerColorClass = 'fill-amber-900/60 stroke-amber-600/60';
        } else if (diff === 11) {
          outerColorClass = 'fill-sky-600/85 stroke-sky-400/80';
          outerTextClass = 'fill-white font-bold';
          innerColorClass = 'fill-sky-900/60 stroke-sky-600/60';
        } else if (diff === 2) {
          innerColorClass = 'fill-rose-950/70 stroke-rose-800/60';
        }
      } else {
        if (diff === 0) {
          innerColorClass = 'fill-indigo-600 stroke-indigo-400 fill-opacity-95';
          innerTextClass = 'fill-white font-bold text-sm';
          outerColorClass = 'fill-indigo-950 stroke-indigo-500/80';
          outerTextClass = 'fill-indigo-200 font-bold';
        } else if (diff === 11) {
          innerColorClass = 'fill-sky-600/85 stroke-sky-400/80';
          innerTextClass = 'fill-white font-bold';
        } else if (diff === 1) {
          innerColorClass = 'fill-amber-600/85 stroke-amber-400/80';
          innerTextClass = 'fill-white font-bold';
        }
      }

      const outerPath = this.describeArc(this.center, this.center, this.midRadius, this.outerRadius, startAngle, endAngle);
      const innerPath = this.describeArc(this.center, this.center, this.innerRadius, this.midRadius, startAngle, endAngle);

      const outerTextPos = this.polarToCartesian(this.center, this.center, (this.midRadius + this.outerRadius) / 2, angleCenter);
      const innerTextPos = this.polarToCartesian(this.center, this.center, (this.innerRadius + this.midRadius) / 2, angleCenter);

      svgHtml += `
        <!-- Wedge ${item.root} -->
        <g class="cursor-pointer transition-all duration-150">
          <path d="${outerPath}" 
                class="${outerColorClass} transition-colors cursor-pointer"
                stroke-width="1.2"
                data-key="${item.root}" 
                data-mode="major"
                title="${item.root} Trưởng (Mép ngoài: Mạnh ff / Mép trong: Nhẹ p)">
          </path>
          <text x="${outerTextPos.x}" y="${outerTextPos.y + 4}" 
                text-anchor="middle" 
                class="${outerTextClass} text-sm pointer-events-none select-none">
            ${item.root}
          </text>
          
          <path d="${innerPath}" 
                class="${innerColorClass} transition-colors cursor-pointer"
                stroke-width="1.2"
                data-key="${item.minor.replace('m', '')}" 
                data-mode="minor"
                title="${item.minor} Thứ (Mép ngoài: Mạnh ff / Mép trong: Nhẹ p)">
          </path>
          <text x="${innerTextPos.x}" y="${innerTextPos.y + 3}" 
                text-anchor="middle" 
                class="${innerTextClass} pointer-events-none select-none">
            ${item.minor}
          </text>
        </g>
      `;
    });

    // Center Display Circle
    const currentItem = CIRCLE_OF_FIFTHS[activeIndex];
    const displayLabel = this.selectedMode === 'major' ? `${this.selectedKey} Major` : `${this.selectedKey}m Minor`;
    const accLabel = currentItem ? (currentItem.accidentals > 0 ? `${currentItem.accidentals} dấu #` : (currentItem.accidentals < 0 ? `${Math.abs(currentItem.accidentals)} dấu b` : '0 dấu hóa')) : '';

    svgHtml += `
        <!-- Center Hub -->
        <circle cx="${this.center}" cy="${this.center}" r="${this.innerRadius}" 
                fill="url(#centerGradient)" stroke="#38bdf8" stroke-width="2" class="drop-shadow-lg" />
        <text x="${this.center}" y="${this.center - 6}" text-anchor="middle" class="fill-sky-400 font-extrabold text-sm pointer-events-none">
          ${displayLabel}
        </text>
        <text x="${this.center}" y="${this.center + 14}" text-anchor="middle" class="fill-slate-400 text-[10px] pointer-events-none">
          ${accLabel}
        </text>
      </svg>
    `;

    this.container.innerHTML = svgHtml;

    // Attach click and pointerdown listeners with velocity detection
    this.container.querySelectorAll('path[data-key]').forEach(path => {
      path.addEventListener('pointerdown', (e) => {
        const key = e.target.getAttribute('data-key');
        const mode = e.target.getAttribute('data-mode');
        const velocity = this.computeVelocity(e, mode);
        if (this.onKeySelect) {
          this.onKeySelect(key, mode, velocity);
        }
      });
    });
  }
}

window.CircleOfFifths = CircleOfFifths;
