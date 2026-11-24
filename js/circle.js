// Interactive SVG Circle of Fifths Component
// Renders the 12-wedge wheel with Major outer ring and Minor inner ring
// Highlights diatonic relationships (Tonic, Subdominant, Dominant, Relative)

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

  // Calculate sector polar coordinates to SVG path arc
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

  render() {
    if (!this.container) return;

    const currentIdx = CIRCLE_OF_FIFTHS.findIndex(item => 
      this.selectedMode === 'major' ? item.root === this.selectedKey : item.minor.replace('m', '') === this.selectedKey
    );
    const activeIndex = currentIdx !== -1 ? currentIdx : 0;

    let svgHtml = `
      <svg viewBox="0 0 ${this.size} ${this.size}" class="circle-svg select-none w-full max-w-[380px] h-auto drop-shadow-xl">
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

      // Determine relation to selected key
      const diff = (index - activeIndex + 12) % 12;
      let outerColorClass = 'fill-slate-800/80 stroke-slate-700/60 hover:fill-slate-700/90';
      let innerColorClass = 'fill-slate-900/90 stroke-slate-700/60 hover:fill-slate-800';
      let outerTextClass = 'fill-slate-300 font-semibold';
      let innerTextClass = 'fill-slate-400 font-medium text-xs';

      if (this.selectedMode === 'major') {
        if (diff === 0) {
          // Tonic I
          outerColorClass = 'fill-indigo-600 stroke-indigo-400 fill-opacity-90';
          outerTextClass = 'fill-white font-bold text-base filter drop-shadow';
          // Relative Minor vi
          innerColorClass = 'fill-indigo-900 stroke-indigo-500 fill-opacity-80';
          innerTextClass = 'fill-indigo-200 font-bold';
        } else if (diff === 1) {
          // Dominant V
          outerColorClass = 'fill-amber-600/80 stroke-amber-400/80';
          outerTextClass = 'fill-white font-bold';
          // Relative iii
          innerColorClass = 'fill-amber-900/60 stroke-amber-600/60';
        } else if (diff === 11) {
          // Subdominant IV
          outerColorClass = 'fill-sky-600/80 stroke-sky-400/80';
          outerTextClass = 'fill-white font-bold';
          // Relative ii
          innerColorClass = 'fill-sky-900/60 stroke-sky-600/60';
        } else if (diff === 2) {
          // vii° (Relative)
          innerColorClass = 'fill-rose-950/70 stroke-rose-800/60';
        }
      } else {
        // Minor Mode
        if (diff === 0) {
          // Minor Tonic i
          innerColorClass = 'fill-indigo-600 stroke-indigo-400 fill-opacity-90';
          innerTextClass = 'fill-white font-bold text-sm';
          // Relative Major III
          outerColorClass = 'fill-indigo-950 stroke-indigo-500/80';
          outerTextClass = 'fill-indigo-200 font-bold';
        } else if (diff === 11) {
          // Subdominant iv
          innerColorClass = 'fill-sky-600/80 stroke-sky-400/80';
          innerTextClass = 'fill-white font-bold';
        } else if (diff === 1) {
          // Dominant v
          innerColorClass = 'fill-amber-600/80 stroke-amber-400/80';
          innerTextClass = 'fill-white font-bold';
        }
      }

      // Outer Ring Wedge (Major Key)
      const outerPath = this.describeArc(this.center, this.center, this.midRadius, this.outerRadius, startAngle, endAngle);
      // Inner Ring Wedge (Minor Key)
      const innerPath = this.describeArc(this.center, this.center, this.innerRadius, this.midRadius, startAngle, endAngle);

      // Text Positions
      const outerTextPos = this.polarToCartesian(this.center, this.center, (this.midRadius + this.outerRadius) / 2, angleCenter);
      const innerTextPos = this.polarToCartesian(this.center, this.center, (this.innerRadius + this.midRadius) / 2, angleCenter);

      // Accidentals indicator dot
      const accTextPos = this.polarToCartesian(this.center, this.center, this.outerRadius - 8, angleCenter);

      svgHtml += `
        <!-- Wedge ${item.root} -->
        <g class="cursor-pointer transition-all duration-150">
          <!-- Outer Major Sector -->
          <path d="${outerPath}" 
                class="${outerColorClass} transition-colors cursor-pointer"
                stroke-width="1.2"
                data-key="${item.root}" 
                data-mode="major"
                title="${item.root} Trưởng (${item.label})">
          </path>
          <text x="${outerTextPos.x}" y="${outerTextPos.y + 4}" 
                text-anchor="middle" 
                class="${outerTextClass} text-sm pointer-events-none select-none">
            ${item.root}
          </text>
          
          <!-- Inner Minor Sector -->
          <path d="${innerPath}" 
                class="${innerColorClass} transition-colors cursor-pointer"
                stroke-width="1.2"
                data-key="${item.minor.replace('m', '')}" 
                data-mode="minor"
                title="${item.minor} Thứ">
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

    // Attach click listeners to wedges
    this.container.querySelectorAll('path[data-key]').forEach(path => {
      path.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        const mode = e.target.getAttribute('data-mode');
        if (this.onKeySelect) {
          this.onKeySelect(key, mode);
        }
      });
    });
  }
}

window.CircleOfFifths = CircleOfFifths;
