/**
 * ThermostatUI builds the SVG dial, the metallic ring, the tick marks, and the
 * mode-selection dialog. The class does not talk directly to Home Assistant;
 * instead the outer card (main.js) feeds it data and supplies callbacks for
 * committing temperature changes or opening the entity dialog.
 */
export default class ThermostatUI {
  get container() {
    return this._container // Expose the main DOM node so the card can insert it into the shadow DOM.
  }
  _computeModeMenuGeometry(radius) {
    const safeRadius = Number.isFinite(radius) ? radius : 0;
    const diameter = safeRadius * 2;
    const baseButtonRadius = Math.max(24, Math.min(safeRadius * 0.18, 34));
    const buttonRadius = baseButtonRadius * 0.64; // TRIAL MERGE: shrink the toggle by another 20% for the refreshed layout request.
    const bottomOffset = Math.max(0, safeRadius * 0.2 - safeRadius * 0.08); // TRIAL MERGE: drop the toggle an additional 3% lower toward the rim.
    const minCenterY = safeRadius + buttonRadius * 0.15;
    const proposedCenterY = diameter - bottomOffset - buttonRadius;
    const centerY = Math.max(minCenterY, proposedCenterY);
    return {
      radius: safeRadius,
      diameter,
      buttonRadius,
      bottomOffset,
      centerX: safeRadius,
      centerY,
    };
  }
  // TRIAL MERGE: derive the dial radius even when the config radius has not been populated yet.
  _resolveDialRadius() {
    const configRadius = Number(this._config && this._config.radius);
    if (Number.isFinite(configRadius) && configRadius > 0) {
      return configRadius;
    }
    const root = this._root;
    if (root && root.viewBox && root.viewBox.baseVal) {
      const { width, height } = root.viewBox.baseVal;
      if (width > 0 && height > 0) {
        return Math.min(width, height) / 2;
      }
    }
    if (root && typeof root.getBoundingClientRect === 'function') {
      const rect = root.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        return Math.min(rect.width, rect.height) / 2;
      }
    }
    return 0;
  }
  // TRIAL MERGE: refresh cached mode-toggle geometry whenever fallbacks reveal a better radius.
  _ensureModeMenuGeometry() {
    const geometry = this._modeMenuGeometry;
    if (geometry && geometry.centerX > 0 && geometry.centerY > 0) {
      return geometry;
    }
    const radius = this._resolveDialRadius();
    const computed = this._computeModeMenuGeometry(radius);
    this._modeMenuGeometry = computed;
    return computed;
  }
  // TRIAL MERGE: centralize the SVG toggler translation so reparenting never strands it at the SVG origin.
  _applyModeMenuTogglerTransform() {
    const target = this._modeMenuAnchor || this._modeMenuToggler;
    if (!target) {
      return;
    }
    const geometry = this._ensureModeMenuGeometry();
    target.setAttribute('transform', `translate(${geometry.centerX}, ${geometry.centerY})`);
    if (this._modeMenuToggler) {
      this._modeMenuToggler.dataset.bottomOffset = String(geometry.bottomOffset);
    }
  }
  // TRIAL MERGE: allow optional backdrop skipping so the carousel toggle can share this builder without rendering extra discs.
  _buildModeButton(radius, options = {}) {
    const resolvedRadius = Number.isFinite(radius) && radius > 0 ? radius : this._resolveDialRadius(); // TRIAL MERGE: tolerate missing radius by falling back to live SVG metrics.
    const geometry = this._computeModeMenuGeometry(resolvedRadius);
    const container = SvgUtil.createSVGElement('g', { class: 'mode-menu' });
    const omitBackdrop = options && options.omitBackdrop === true;

    const toggler = SvgUtil.createSVGElement('g', {
      class: 'mode-menu__toggler',
      role: 'button',
      tabindex: '0',
      'aria-label': 'Toggle HVAC modes',
      'aria-expanded': 'false',
      transform: `translate(${geometry.centerX}, ${geometry.centerY})`
    });
    toggler.dataset.bottomOffset = String(geometry.bottomOffset);

    const toggleBody = SvgUtil.createSVGElement('g', { class: 'mode-menu__toggler-body' });
    let halo = null;
    let circle = null;
    let ring = null;
    let inner = null;
    let gloss = null;
    let crest = null;
    if (!omitBackdrop) {
      halo = SvgUtil.createSVGElement('circle', {
        class: 'mode-menu__toggler-halo',
        cx: 0,
        cy: geometry.buttonRadius * 0.15,
        r: geometry.buttonRadius * 1.18
      });
      circle = SvgUtil.createSVGElement('circle', {
        class: 'mode-menu__toggler-circle',
        cx: 0,
        cy: 0,
        r: geometry.buttonRadius
      });
      ring = SvgUtil.createSVGElement('circle', {
        class: 'mode-menu__toggler-ring',
        cx: 0,
        cy: 0,
        r: Math.max(geometry.buttonRadius - 1.8, geometry.buttonRadius * 0.82)
      });
      inner = SvgUtil.createSVGElement('circle', {
        class: 'mode-menu__toggler-inner',
        cx: 0,
        cy: 0,
        r: Math.max(4, geometry.buttonRadius - 4)
      });
      gloss = SvgUtil.createSVGElement('ellipse', {
        class: 'mode-menu__toggler-gloss',
        cx: -geometry.buttonRadius * 0.25,
        cy: -geometry.buttonRadius * 0.45,
        rx: geometry.buttonRadius * 0.7,
        ry: geometry.buttonRadius * 0.55
      });
      crest = SvgUtil.createSVGElement('path', {
        class: 'mode-menu__toggler-crest',
        d: this._toggleCrestPath(geometry.buttonRadius)
      });
    }
    const icon = SvgUtil.createSVGElement('g', { class: 'mode-menu__toggler-icon' });
    const barOffsets = [-geometry.buttonRadius * 0.35, 0, geometry.buttonRadius * 0.35];
    barOffsets.forEach((offset, index) => {
      const roleClass = index === 0 ? 'top' : index === 1 ? 'middle' : 'bottom';
      const bar = SvgUtil.createSVGElement('rect', {
        class: `mode-menu__toggler-bar mode-menu__toggler-bar--${roleClass}`,
        x: -geometry.buttonRadius * 0.55,
        y: offset - 1,
        width: geometry.buttonRadius * 1.1,
        height: 2,
        rx: 1.2,
        ry: 1.2
      });
      bar.style.setProperty('--bar-shift', `${-offset}px`);
      icon.appendChild(bar);
    });

    if (halo) toggleBody.appendChild(halo);
    if (circle) toggleBody.appendChild(circle);
    if (ring) toggleBody.appendChild(ring);
    if (inner) toggleBody.appendChild(inner);
    if (gloss) toggleBody.appendChild(gloss);
    if (crest) toggleBody.appendChild(crest);
    toggleBody.appendChild(icon);
    toggler.appendChild(toggleBody);

    const list = SvgUtil.createSVGElement('g', { class: 'mode-menu__items', 'aria-hidden': 'true' });

    const stopPointer = (event) => {
      event.stopPropagation();
    };
    const handleToggle = (event, fromKeyboard = false) => {
      const isOpen = container.classList.contains('menu-open');
      if (this._modeCarouselEnabled && isOpen) {
        this._commitCarouselSelection(fromKeyboard ? 'toggler-key' : 'toggler', null, event);
        return;
      }
      const shouldOpen = !isOpen;
      this._setModeMenuOpen(shouldOpen);
    };
    toggler.addEventListener('pointerdown', (event) => {
      stopPointer(event);
      if (event.pointerType === 'touch') {
        event.preventDefault();
      }
    });
    toggler.addEventListener('pointerup', stopPointer);
    toggler.addEventListener('pointercancel', stopPointer);
    toggler.addEventListener('click', (event) => {
      stopPointer(event);
      handleToggle(event, false);
    });
    toggler.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle(event, true);
      }
    });

    list.addEventListener('click', stopPointer);
    list.addEventListener('pointerdown', stopPointer);

    container.appendChild(toggler);
    container.appendChild(list);

    return { container, toggler, toggleBody, circle, ring, inner, gloss, crest, halo, list, geometry };
  }
  // TRIAL MERGE: sculpt a specular crest so the toggle picks up a believable top light.
  _toggleCrestPath(radius) {
    const width = radius * 1.45;
    const halfWidth = width / 2;
    const top = -radius * 0.82;
    const bottom = -radius * 0.08;
    const lift = radius * 0.22;
    return [
      `M ${-halfWidth} ${bottom}`,
      `Q 0 ${top} ${halfWidth} ${bottom}`,
      `Q 0 ${bottom + lift} ${-halfWidth} ${bottom}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: derive layout metrics for the SVG carousel items.
  _computeCarouselGeometry(radius) {
    const dialRadius = Number.isFinite(radius) ? radius : 0;
    const itemWidth = Math.max(70, dialRadius * 0.55);
    const itemHeight = Math.max(110, dialRadius * 0.9);
    const spacing = itemWidth * 0.85;
    return { dialRadius, itemWidth, itemHeight, spacing };
  }
  // TRIAL MERGE: outline the frosted obelisk profile used for each SVG carousel card.
  _carouselObeliskPath(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const radius = Math.max(width * 0.18, 16);
    const topRadius = radius * 0.92;
    const bottomRadius = radius * 1.12;
    return [
      `M ${-halfWidth + topRadius} ${-halfHeight}`,
      `Q ${-halfWidth} ${-halfHeight} ${-halfWidth} ${-halfHeight + topRadius}`,
      `L ${-halfWidth} ${halfHeight - bottomRadius}`,
      `Q ${-halfWidth} ${halfHeight} ${-halfWidth + bottomRadius} ${halfHeight}`,
      `L ${halfWidth - bottomRadius} ${halfHeight}`,
      `Q ${halfWidth} ${halfHeight} ${halfWidth} ${halfHeight - bottomRadius}`,
      `L ${halfWidth} ${-halfHeight + topRadius}`,
      `Q ${halfWidth} ${-halfHeight} ${halfWidth - topRadius} ${-halfHeight}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: reuse the facet inset metrics anywhere we need to align assets with the glass window.
  _carouselFacetInsets(width, height) {
    return {
      insetX: Math.max(width * 0.14, 12),
      insetTop: Math.max(height * 0.18, 16),
      insetBottom: Math.max(height * 0.2, 20),
      radius: Math.max(width * 0.12, 10)
    };
  }
  // TRIAL MERGE: carve an inner facet so each glass panel reads as thick frosted acrylic.
  _carouselFacetPath(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const facet = this._carouselFacetInsets(width, height);
    const { insetX, insetTop, insetBottom, radius } = facet;
    return [
      `M ${-halfWidth + insetX + radius} ${-halfHeight + insetTop}`,
      `Q ${-halfWidth + insetX} ${-halfHeight + insetTop} ${-halfWidth + insetX} ${-halfHeight + insetTop + radius}`,
      `L ${-halfWidth + insetX} ${halfHeight - insetBottom - radius}`,
      `Q ${-halfWidth + insetX} ${halfHeight - insetBottom} ${-halfWidth + insetX + radius} ${halfHeight - insetBottom}`,
      `L ${halfWidth - insetX - radius} ${halfHeight - insetBottom}`,
      `Q ${halfWidth - insetX} ${halfHeight - insetBottom} ${halfWidth - insetX} ${halfHeight - insetBottom - radius}`,
      `L ${halfWidth - insetX} ${-halfHeight + insetTop + radius}`,
      `Q ${halfWidth - insetX} ${-halfHeight + insetTop} ${halfWidth - insetX - radius} ${-halfHeight + insetTop}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: render a luminous foot reflection toward the base of the panel.
  _carouselReflectionPath(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const top = halfHeight * 0.22;
    const bottom = halfHeight * 0.44;
    const curve = Math.max(width * 0.42, 32);
    return [
      `M ${-curve} ${top}`,
      `Q 0 ${top - halfHeight * 0.08} ${curve} ${top}`,
      `L ${curve * 0.72} ${bottom}`,
      `Q 0 ${bottom + halfHeight * 0.08} ${-curve * 0.72} ${bottom}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: trace a pillowy highlight across the top third of the glass panel.
  _carouselHighlightPath(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const crest = -halfHeight * 0.72;
    const trough = -halfHeight * 0.24;
    const span = Math.max(width * 0.48, 36);
    return [
      `M ${-span} ${trough}`,
      `Q 0 ${crest} ${span} ${trough}`,
      `L ${span * 0.86} ${trough + halfHeight * 0.18}`,
      `Q 0 ${trough + halfHeight * 0.28} ${-span * 0.86} ${trough + halfHeight * 0.18}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: add a vertical spark that mimics a refracted studio light.
  _carouselSparkPath(width, height) {
    const halfHeight = height / 2;
    const crest = -halfHeight * 0.35;
    const tail = crest + halfHeight * 0.62;
    const span = Math.max(width * 0.16, 12);
    return [
      `M ${-span * 0.4} ${crest}`,
      `Q 0 ${crest - halfHeight * 0.08} ${span * 0.4} ${crest}`,
      `L ${span * 0.28} ${tail}`,
      `Q 0 ${tail + halfHeight * 0.06} ${-span * 0.28} ${tail}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: sweep a refracted light ribbon through the glass panel for extra realism.
  _carouselCausticPath(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const ridge = -halfHeight * 0.12;
    const valley = halfHeight * 0.28;
    const sway = Math.max(width * 0.18, 14);
    return [
      `M ${-sway} ${ridge}`,
      `Q ${-halfWidth * 0.25} ${ridge - halfHeight * 0.22} 0 ${ridge - halfHeight * 0.08}`,
      `T ${sway} ${ridge}`,
      `L ${sway * 0.72} ${valley}`,
      `Q 0 ${valley + halfHeight * 0.12} ${-sway * 0.72} ${valley}`,
      'Z'
    ].join(' ');
  }
  // TRIAL MERGE: select gradient palettes for each carousel icon variant so the SVG can dial in the right glow colours.
  _carouselIconPalette(option, gradientIds) {
    const mode = option && option.mode;
    const type = option && option.type;
    if (type === 'preset' || type === 'preset-mode') {
      return {
        glow: gradientIds.iconNeutralGlow,
        primary: gradientIds.iconNeutral,
        accent: '#f7faff'
      };
    }
    if (type === 'fan-mode') {
      return {
        glow: gradientIds.iconNeutralGlow,
        primary: gradientIds.iconNeutral,
        accent: '#f3f8ff'
      };
    }
    switch (mode) {
      case 'heat':
        return {
          glow: gradientIds.iconHeatGlow,
          primary: gradientIds.iconHeat,
          accent: '#fff6eb'
        };
      case 'cool':
        return {
          glow: gradientIds.iconCoolGlow,
          primary: gradientIds.iconCool,
          accent: '#f6fbff'
        };
      case 'heat_cool':
        return {
          glow: gradientIds.iconDualGlow || gradientIds.iconNeutralGlow,
          warm: gradientIds.iconDualWarm || gradientIds.iconHeat,
          cool: gradientIds.iconDualCool || gradientIds.iconCool,
          accent: '#ffffff'
        };
      case 'off':
        return {
          glow: gradientIds.iconOffGlow,
          primary: gradientIds.iconOff,
          accent: '#f1f4f9'
        };
      case 'fan_only':
      case 'dry':
      case 'auto':
      default:
        return {
          glow: gradientIds.iconNeutralGlow,
          primary: gradientIds.iconNeutral,
          accent: '#f6f9ff'
        };
    }
  }
  // TRIAL MERGE: define reusable heat icon paths inspired by the provided frosted glass flame reference.
  _carouselHeatIconShapes(fillId, accentColor = '#ffffff') {
    const fill = fillId ? `url(#${fillId})` : '#ff914d';
    return [
      {
        element: 'path',
        attributes: {
          d: [
            'M 0 -60',
            'C 22 -86 36 -114 26 -142',
            'C 52 -108 52 -64 28 -30',
            'C 18 -18 18 -4 26 14',
            'C 12 4 4 -10 0 -24',
            'C -4 -10 -6 6 10 36',
            'C -24 16 -34 -12 -28 -44',
            'C -24 -70 -8 -94 0 -122',
            'C -16 -96 -30 -66 -28 -36',
            'C -26 -6 -8 12 0 -60',
            'Z'
          ].join(' '),
          fill,
          'fill-rule': 'evenodd'
        }
      },
      {
        element: 'path',
        attributes: {
          d: [
            'M 0 -38',
            'C 12 -60 20 -82 14 -102',
            'C 28 -80 26 -48 14 -26',
            'C 10 -18 10 -6 14 8',
            'C 6 2 2 -8 0 -18',
            'C -2 -6 -4 8 8 26',
            'C -10 12 -16 -4 -14 -22',
            'C -12 -42 -2 -60 0 -74',
            'C -10 -56 -18 -36 -16 -20',
            'C -14 -2 0 10 0 -38',
            'Z'
          ].join(' '),
          fill: accentColor,
          'fill-opacity': '0.85'
        }
      }
    ];
  }
  // TRIAL MERGE: snowflake geometry for cooling/blue modes drawn with stroked segments.
  _carouselCoolIconShapes(fillId, accentColor = '#ffffff') {
    const stroke = fillId ? `url(#${fillId})` : '#7fc9ff';
    const shapes = [
      {
        element: 'path',
        attributes: {
          d: 'M 0 -60 L 0 60',
          stroke,
          'stroke-width': '14',
          'stroke-linecap': 'round',
          fill: 'none'
        }
      },
      {
        element: 'path',
        attributes: {
          d: 'M -48 0 L 48 0',
          stroke,
          'stroke-width': '14',
          'stroke-linecap': 'round',
          fill: 'none'
        }
      },
      {
        element: 'path',
        attributes: {
          d: 'M -36 -36 L 36 36',
          stroke,
          'stroke-width': '12',
          'stroke-linecap': 'round',
          fill: 'none'
        }
      },
      {
        element: 'path',
        attributes: {
          d: 'M 36 -36 L -36 36',
          stroke,
          'stroke-width': '12',
          'stroke-linecap': 'round',
          fill: 'none'
        }
      },
      {
        element: 'circle',
        attributes: {
          cx: '0',
          cy: '0',
          r: '14',
          fill: accentColor,
          'fill-opacity': '0.92',
          stroke,
          'stroke-width': '6'
        }
      }
    ];
    return shapes;
  }
  // TRIAL MERGE: neutral glass glyph used for OFF mode (power symbol inspired).
  _carouselOffIconShapes(fillId, accentColor = '#ffffff') {
    const stroke = fillId ? `url(#${fillId})` : '#9aa7bc';
    return [
      {
        element: 'circle',
        attributes: {
          cx: '0',
          cy: '4',
          r: '44',
          fill: 'none',
          stroke,
          'stroke-width': '11',
          'stroke-linecap': 'round'
        }
      },
      {
        element: 'path',
        attributes: {
          d: 'M 0 -62 L 0 10',
          stroke,
          'stroke-width': '12',
          'stroke-linecap': 'round',
          fill: 'none'
        }
      },
      {
        element: 'circle',
        attributes: {
          cx: '0',
          cy: '-80',
          r: '12',
          fill: accentColor,
          'fill-opacity': '0.85'
        }
      }
    ];
  }
  // TRIAL MERGE: fallback glass glyph for auto/preset/fan/dry using a swirling ribbon motif.
  _carouselNeutralIconShapes(fillId, accentColor = '#ffffff') {
    const stroke = fillId ? `url(#${fillId})` : '#8da5c8';
    return [
      {
        element: 'path',
        attributes: {
          d: [
            'M 28 -56',
            'C 46 -36 40 -6 12 8',
            'C -18 24 -34 12 -36 -8',
            'C -38 -30 -20 -44 -4 -38',
            'C 12 -32 20 -12 8 4',
            'C 0 14 -16 18 -26 8'
          ].join(' '),
          stroke,
          'stroke-width': '12',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          fill: 'none'
        }
      },
      {
        element: 'path',
        attributes: {
          d: 'M -24 8 L -4 18 L -12 -2 Z',
          fill: stroke,
          'fill-opacity': '0.82'
        }
      },
      {
        element: 'circle',
        attributes: {
          cx: '20',
          cy: '-70',
          r: '10',
          fill: accentColor,
          'fill-opacity': '0.8'
        }
      }
    ];
  }
  // TRIAL MERGE: convert carousel options into icon shape descriptors using the palette selections.
  _carouselIconShapes(option, palette) {
    const mode = option && option.mode;
    const type = option && option.type;
    if (type === 'preset') {
      const fill = palette.primary ? `url(#${palette.primary})` : '#8ea4c6';
      return [
        {
          element: 'rect',
          attributes: {
            x: '-42',
            y: '-44',
            width: '84',
            height: '18',
            rx: '9',
            fill,
            'fill-opacity': '0.9'
          }
        },
        {
          element: 'rect',
          attributes: {
            x: '-32',
            y: '-10',
            width: '64',
            height: '18',
            rx: '9',
            fill,
            'fill-opacity': '0.75'
          }
        },
        {
          element: 'rect',
          attributes: {
            x: '-24',
            y: '24',
            width: '48',
            height: '18',
            rx: '9',
            fill,
            'fill-opacity': '0.6'
          }
        }
      ];
    }
    switch (mode) {
      case 'heat':
        return this._carouselHeatIconShapes(palette && palette.primary, palette && palette.accent);
      case 'cool':
        return this._carouselCoolIconShapes(palette && palette.primary, palette && palette.accent);
      case 'heat_cool': {
        const shapes = [];
        const warmShapes = this._carouselHeatIconShapes(palette && palette.warm, palette && palette.accent);
        warmShapes.forEach((shape) => {
          const next = {
            element: shape.element,
            attributes: Object.assign({}, shape.attributes),
            transform: `${shape.transform ? `${shape.transform} ` : ''}translate(-26, 0) scale(0.78)`
          };
          shapes.push(next);
        });
        const coolShapes = this._carouselCoolIconShapes(palette && palette.cool, palette && palette.accent);
        coolShapes.forEach((shape) => {
          const next = {
            element: shape.element,
            attributes: Object.assign({}, shape.attributes),
            transform: `${shape.transform ? `${shape.transform} ` : ''}translate(30, 0) scale(0.82)`
          };
          shapes.push(next);
        });
        shapes.push({
          element: 'path',
          attributes: {
            d: 'M -6 -60 L -6 60',
            stroke: palette && palette.accent ? palette.accent : '#ffffff',
            'stroke-width': '4',
            'stroke-linecap': 'round',
            'stroke-opacity': '0.65',
            fill: 'none'
          }
        });
        return shapes;
      }
      case 'off':
        return this._carouselOffIconShapes(palette && palette.primary, palette && palette.accent);
      case 'fan_only':
      case 'dry':
      case 'auto':
      default:
        return this._carouselNeutralIconShapes(palette && palette.primary, palette && palette.accent);
    }
  }
  // TRIAL MERGE: attempt to resolve PNG artwork for carousel items when matching files exist beside the card.
  _carouselImageCandidates(option) {
    if (!option) {
      return null;
    }
    const names = [];
    const include = (name) => {
      if (!name) {
        return;
      }
      const normalized = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (normalized && !names.includes(normalized)) {
        names.push(normalized);
      }
    };
    const mode = typeof option.mode === 'string' ? option.mode.toLowerCase() : '';
    if (option.type === 'preset' || option.type === 'preset-mode') {
      const basePreset = option.type === 'preset-mode'
        ? (typeof option.mode === 'string' ? option.mode : '')
        : this.preset_mode;
      const preset = typeof basePreset === 'string' && basePreset.length
        ? basePreset.toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : 'none';
      include(`preset_${preset}`);
      include('preset_none');
    } else if (option.type === 'fan-mode') {
      const fanMode = typeof option.mode === 'string' ? option.mode : '';
      const normalizedFan = fanMode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      include(`fan_${normalizedFan || 'mode'}`); // TRIAL MERGE: prefer fan-specific artwork like fan_auto.png.
      include('fan');
    } else if (option.type === 'hvac') {
      switch (mode) {
        case 'cool':
          include('cooling');
          break;
        case 'auto':
          include('heat_cool');
          break;
        case 'fan_only':
          include('fan_on');
          break;
        default:
          include(mode);
          break;
      }
    }
    include(mode);
    const candidates = names.map((name) => {
      try {
        const url = new URL(`${name}.png`, import.meta.url).href;
        return { name, url };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);
    return candidates.length ? candidates : null;
  }
  // TRIAL MERGE: convert asset filenames into human-friendly carousel labels.
  _formatCarouselAssetLabel(name) {
    if (!name) {
      return '';
    }
    return String(name)
      .split('_')
      .filter((part) => part.length)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  // TRIAL MERGE: build the multi-layered icon group (glow + glyph) for each carousel card.
  _buildCarouselIconGroup(option, geometry, gradientIds) {
    const palette = this._carouselIconPalette(option, gradientIds || {});
    const group = SvgUtil.createSVGElement('g', { class: 'mode-carousel-svg__icon-group' });
    const glow = SvgUtil.createSVGElement('ellipse', {
      class: 'mode-carousel-svg__icon-glow',
      cx: 0,
      cy: -geometry.itemHeight * 0.14,
      rx: geometry.itemWidth * 0.34,
      ry: geometry.itemHeight * 0.22
    });
    if (palette && palette.glow) {
      glow.setAttribute('fill', `url(#${palette.glow})`);
    } else {
      glow.setAttribute('fill', 'rgba(200, 220, 255, 0.38)');
    }
    group.appendChild(glow);

    const iconScale = Math.min(geometry.itemWidth * 0.42, geometry.itemHeight * 0.44) / 120;
    const iconRoot = SvgUtil.createSVGElement('g', {
      class: 'mode-carousel-svg__icon-root',
      transform: `translate(0, ${-geometry.itemHeight * 0.12}) scale(${iconScale})`
    });
    const shapes = this._carouselIconShapes(option, palette) || [];
    shapes.forEach((shape) => {
      const elementName = shape.element || 'path';
      const node = SvgUtil.createSVGElement(elementName, shape.attributes || {});
      if (shape.transform) {
        node.setAttribute('transform', shape.transform);
      }
      iconRoot.appendChild(node);
    });
    group.appendChild(iconRoot);
    return group;
  }
  // TRIAL MERGE: build the carousel toggle and item rail entirely within the SVG glass layer.
  _buildModeToggleCarousel(radius) {
    const resolvedRadius = Number.isFinite(radius) && radius > 0 ? radius : this._resolveDialRadius(); // TRIAL MERGE: share the fallback radius with the SVG carousel builder.
    const base = this._buildModeButton(resolvedRadius);
    const { container } = base;
    container.classList.add('mode-menu--carousel'); // TRIAL MERGE: flag this container so carousel-specific styling can apply.
    container.setAttribute('pointer-events', 'visiblePainted'); // TRIAL MERGE: allow the SVG toggle to receive pointer input.

    const gradientIds = this._modeCarouselGradientIds || {};
    // TRIAL MERGE: embed dedicated gradients so the SVG carousel renders layered glass shading.
    const defs = SvgUtil.createSVGElement('defs', { class: 'mode-carousel-svg__defs' });
    const appendStops = (gradient, stops) => {
      stops.forEach(([offset, color, opacity]) => {
        gradient.appendChild(SvgUtil.createSVGElement('stop', {
          offset,
          'stop-color': color,
          'stop-opacity': opacity
        }));
      });
      return gradient;
    };
    const createGradient = (tag, attributes, stops) => {
      const gradient = SvgUtil.createSVGElement(tag, attributes);
      return appendStops(gradient, stops);
    };
    if (gradientIds.toggleHalo) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.toggleHalo,
        cx: '50%',
        cy: '58%',
        r: '72%'
      }, [
        ['0%', '#e6f2ff', 0.42],
        ['45%', '#bcd0f3', 0.22],
        ['75%', '#748bd1', 0.12],
        ['100%', '#1b2642', 0]
      ]));
    }
    if (gradientIds.toggleBase) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.toggleBase,
        cx: '48%',
        cy: '40%',
        r: '68%'
      }, [
        ['0%', '#f9fcff', 0.7],
        ['40%', '#dbe6f4', 0.46],
        ['72%', '#a4bad4', 0.32],
        ['100%', '#2f3f58', 0.5]
      ]));
    }
    if (gradientIds.toggleRing) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.toggleRing,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#ffffff', 0.52],
        ['45%', '#dfe9ff', 0.34],
        ['100%', '#5a7096', 0.55]
      ]));
    }
    if (gradientIds.toggleInner) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.toggleInner,
        cx: '48%',
        cy: '45%',
        r: '62%'
      }, [
        ['0%', '#ffffff', 0.62],
        ['52%', '#dce7f7', 0.34],
        ['100%', '#6f829d', 0.26]
      ]));
    }
    if (gradientIds.toggleSheen) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.toggleSheen,
        cx: '28%',
        cy: '22%',
        r: '85%'
      }, [
        ['0%', '#ffffff', 0.62],
        ['46%', '#f6f9ff', 0.24],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.toggleCrest) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.toggleCrest,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#ffffff', 0.5],
        ['55%', '#f2f7ff', 0.14],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.baseGlow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.baseGlow,
        cx: '50%',
        cy: '38%',
        r: '75%'
      }, [
        ['0%', '#dcecff', 0.28],
        ['58%', '#a7c4ef', 0.18],
        ['100%', '#40537a', 0]
      ]));
    }
    if (gradientIds.shadow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.shadow,
        cx: '50%',
        cy: '56%',
        r: '68%'
      }, [
        ['0%', '#0c101c', 0.38],
        ['70%', '#0c101c', 0.22],
        ['100%', '#0c101c', 0]
      ]));
    }
    if (gradientIds.panelFace) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.panelFace,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#f9fbff', 0.64],
        ['32%', '#e6eef8', 0.46],
        ['68%', '#c1cede', 0.38],
        ['100%', '#8190ab', 0.52]
      ]));
    }
    if (gradientIds.panelEdge) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.panelEdge,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#ffffff', 0.52],
        ['45%', '#dfe9fb', 0.34],
        ['100%', '#5a6c8c', 0.58]
      ]));
    }
    if (gradientIds.panelInner) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.panelInner,
        cx: '50%',
        cy: '42%',
        r: '64%'
      }, [
        ['0%', '#ffffff', 0.42],
        ['48%', '#f4f7ff', 0.16],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.panelHighlight) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.panelHighlight,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#ffffff', 0.45],
        ['38%', '#ffffff', 0.12],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.panelSheen) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.panelSheen,
        x1: '0%',
        y1: '0%',
        x2: '100%',
        y2: '0%'
      }, [
        ['0%', '#ffffff', 0],
        ['46%', '#ffffff', 0.32],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.panelSpark) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.panelSpark,
        x1: '0%',
        y1: '0%',
        x2: '100%',
        y2: '0%'
      }, [
        ['0%', '#ffffff', 0],
        ['40%', '#ffffff', 0.52],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.panelCaustic) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.panelCaustic,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#ffffff', 0],
        ['35%', '#ffffff', 0.58],
        ['65%', '#d9ecff', 0.26],
        ['100%', '#ffffff', 0]
      ]));
    }
    if (gradientIds.iconHeat) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.iconHeat,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#fff2d8', 0.82],
        ['36%', '#ffc37a', 0.64],
        ['72%', '#ff8741', 0.68],
        ['100%', '#ff5b2a', 0.78]
      ]));
    }
    if (gradientIds.iconHeatGlow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.iconHeatGlow,
        cx: '50%',
        cy: '50%',
        r: '60%'
      }, [
        ['0%', '#ffd8a0', 0.58],
        ['52%', '#ff9850', 0.28],
        ['100%', '#ff6a30', 0]
      ]));
    }
    if (gradientIds.iconCool) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.iconCool,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#f4fbff', 0.82],
        ['38%', '#c9e6ff', 0.6],
        ['74%', '#76c1ff', 0.56],
        ['100%', '#3c8cff', 0.78]
      ]));
    }
    if (gradientIds.iconCoolGlow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.iconCoolGlow,
        cx: '50%',
        cy: '50%',
        r: '60%'
      }, [
        ['0%', '#e1f3ff', 0.5],
        ['55%', '#8ed5ff', 0.26],
        ['100%', '#3c8cff', 0]
      ]));
    }
    if (gradientIds.iconDualWarm) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.iconDualWarm,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#fff0d2', 0.78],
        ['48%', '#ffc27f', 0.6],
        ['100%', '#ff813f', 0.74]
      ]));
    }
    if (gradientIds.iconDualCool) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.iconDualCool,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#f1f9ff', 0.78],
        ['46%', '#bce1ff', 0.55],
        ['100%', '#4aa5ff', 0.74]
      ]));
    }
    if (gradientIds.iconDualGlow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.iconDualGlow,
        cx: '50%',
        cy: '50%',
        r: '62%'
      }, [
        ['0%', '#ffe0bd', 0.42],
        ['48%', '#9bd6ff', 0.22],
        ['100%', '#5ca9ff', 0]
      ]));
    }
    if (gradientIds.iconOff) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.iconOff,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#f1f4f9', 0.7],
        ['50%', '#c9d3e1', 0.48],
        ['100%', '#8a97ab', 0.7]
      ]));
    }
    if (gradientIds.iconOffGlow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.iconOffGlow,
        cx: '50%',
        cy: '50%',
        r: '58%'
      }, [
        ['0%', '#dfe5f1', 0.38],
        ['60%', '#a5b3c7', 0.18],
        ['100%', '#5b677a', 0]
      ]));
    }
    if (gradientIds.iconNeutral) {
      defs.appendChild(createGradient('linearGradient', {
        id: gradientIds.iconNeutral,
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
      }, [
        ['0%', '#f5f9ff', 0.74],
        ['50%', '#d6e2f3', 0.52],
        ['100%', '#7c92b6', 0.72]
      ]));
    }
    if (gradientIds.iconNeutralGlow) {
      defs.appendChild(createGradient('radialGradient', {
        id: gradientIds.iconNeutralGlow,
        cx: '50%',
        cy: '50%',
        r: '60%'
      }, [
        ['0%', '#dfe7f5', 0.45],
        ['58%', '#a5b7d3', 0.22],
        ['100%', '#5d6f8d', 0]
      ]));
    }
    container.insertBefore(defs, container.firstChild);

    if (base.halo && gradientIds.toggleHalo) {
      base.halo.setAttribute('fill', `url(#${gradientIds.toggleHalo})`);
      base.halo.setAttribute('stroke', 'rgba(224, 235, 255, 0.45)');
      base.halo.setAttribute('stroke-width', '1.2');
    }
    if (base.circle && gradientIds.toggleBase) {
      base.circle.setAttribute('fill', `url(#${gradientIds.toggleBase})`);
      if (gradientIds.toggleRing) {
        base.circle.setAttribute('stroke', `url(#${gradientIds.toggleRing})`);
      }
      base.circle.setAttribute('stroke-width', '1.5');
      base.circle.setAttribute('opacity', '0.82');
    }
    if (base.ring && gradientIds.toggleRing) {
      base.ring.setAttribute('fill', 'none');
      base.ring.setAttribute('stroke', `url(#${gradientIds.toggleRing})`);
      base.ring.setAttribute('stroke-width', '1.4');
      base.ring.setAttribute('opacity', '0.5');
    }
    if (base.inner && gradientIds.toggleInner) {
      base.inner.setAttribute('fill', `url(#${gradientIds.toggleInner})`);
      base.inner.setAttribute('opacity', '0.58');
    }
    if (base.gloss && gradientIds.toggleSheen) {
      base.gloss.setAttribute('fill', `url(#${gradientIds.toggleSheen})`);
      base.gloss.setAttribute('opacity', '0.5');
    }
    if (base.crest && gradientIds.toggleCrest) {
      base.crest.setAttribute('fill', `url(#${gradientIds.toggleCrest})`);
      base.crest.setAttribute('opacity', '0.55');
    }

    const geometry = this._computeCarouselGeometry(resolvedRadius);
    this._modeCarouselGeometry = geometry;
    const dialRadius = geometry.dialRadius;

    const wrapper = SvgUtil.createSVGElement('g', {
      class: 'mode-carousel-svg',
      transform: `translate(${dialRadius}, ${dialRadius})`,
      'aria-hidden': 'true'
    });
    const halo = SvgUtil.createSVGElement('circle', {
      class: 'mode-carousel-svg__halo',
      cx: 0,
      cy: 0,
      r: Math.max(dialRadius * 0.58, geometry.itemWidth * 0.8)
    });
    wrapper.appendChild(halo);

    const track = SvgUtil.createSVGElement('g', { class: 'mode-carousel-svg__items' });
    wrapper.appendChild(track);

    if (base.list && base.list.parentNode === container) {
      container.removeChild(base.list); // TRIAL MERGE: drop the legacy list so the SVG carousel owns the space around the toggle.
    }

    // TRIAL MERGE: create a dedicated anchor group so the toggle keeps its translation even when the carousel reorders siblings.
    const anchor = SvgUtil.createSVGElement('g', { class: 'mode-menu__anchor' });
    if (base.toggler) {
      base.toggler.removeAttribute('transform');
      anchor.appendChild(base.toggler);
    }
    container.appendChild(wrapper);
    container.appendChild(anchor); // Ensure the anchor (and toggle) render above the carousel track.

    return {
      ...base,
      list: null,
      anchor,
      wrapper,
      track,
      halo
    };
  }
  _modeMenuTransformFor(angle, distance, scale) {
    const geometry = this._ensureModeMenuGeometry(); // TRIAL MERGE: reuse the fallback-aware geometry when animating legacy menu items.
    const centerX = geometry.radius;
    const centerY = geometry.radius;
    const clamped = Math.max(0, Math.min(1, Number.isFinite(scale) ? scale : 0));
    const effectiveDistance = distance * clamped;
    return [
      `translate(${centerX}px, ${centerY}px)`,
      `rotate(${angle}deg)`,
      `translate(${effectiveDistance}px, 0px)`,
      `rotate(${-angle}deg)`
    ].join(' ');
  }
  _updateModeMenuTransforms(scale = this._modeMenuScale) {
    if (!Array.isArray(this._modeMenuItems)) {
      return;
    }
    this._modeMenuScale = Math.max(0, Math.min(1, Number.isFinite(scale) ? scale : 0));
    this._modeMenuItems.forEach((item) => {
      const angle = Number(item.dataset.angle || 0);
      const distance = Number(item.dataset.distance || 0);
      item.style.transform = this._modeMenuTransformFor(angle, distance, this._modeMenuScale);
    });
  }
  set dual(val) {
    this._dual = val // Track whether the thermostat is currently in dual setpoint mode (heat/cool).
  }
  get dual() {
    return this._dual; // Give other methods a consistent way to read the mode flag.
  }
  get in_control() {
    return this._in_control; // Indicates whether the user is actively adjusting temperatures.
  }
  get temperature() {
    return {
      low: this._low, // Current low setpoint shown in the UI (may be pending user edits).
      high: this._high, // Current high setpoint shown in the UI.
      target: this._target, // Single setpoint (used when dual mode is inactive).
    }
  }
  get ambient() {
    return this._ambient; // Report the ambient room temperature the UI last received.
  }
  set temperature(val) {
    this._ambient = val.ambient; // Cache the latest ambient temperature so labels can be refreshed quickly.
    this._low = val.low; // Store the low setpoint provided by Home Assistant.
    this._high = val.high; // Store the high setpoint provided by Home Assistant.
    this._target = val.target; // Store the single setpoint.
    if (Number.isFinite(this._low) && Number.isFinite(this._high)) this.dual = true; // If both ends are valid numbers, enable dual-mode behavior.
  }
  constructor(config) {

    this._config = config;  // Store the configuration for calculations and callbacks used throughout the class.
    this._ticks = [];       // Keep references to every tick path so their shape and color can be updated quickly.
    this._controls = [];    // Keep references to the interactive temperature control overlays.
    this._dual = false;     // Assume single setpoint mode until data indicates otherwise.
    ThermostatUI._ringIdCounter = (ThermostatUI._ringIdCounter || 0) + 1; // Unique counter ensures gradients have unique IDs.
    const uid = ThermostatUI._ringIdCounter.toString(36); // Convert the counter to base-36 for compact string IDs.
    this._metalGradientId = `dial-metal-gradient-${uid}`; // Distinct id for the metallic fill gradient.
    this._metalSheenId = `dial-metal-sheen-${uid}`; // Distinct id for the reflective sheen gradient.
    this._metalShadowId = `dial-metal-shadow-${uid}`; // Distinct id for the filter that fakes depth/shadow.
    this._rimSpecId = `dial-rim-spec-${uid}`; // Specular rim stroke gradient id.
    this._innerBevelId = `dial-inner-bevel-${uid}`; // Inner bevel gradient id.
    this._faceDarkId = `dial-face-dark-${uid}`; // Dark glass face gradient id.
    this._rimSpecInnerId = `dial-rim-spec-inner-${uid}`; // Inner specular rim id.
    this._metalBrushId = `dial-metal-brush-${uid}`; // Brushed metal overlay filter id.

    this._dragContext = null; // Stores information about the current drag gesture when the user rotates the dial.
    this._lastHass = null; // Home Assistant reference used when refreshing the mode dialog while dragging.
    this._handleDialPointerDown = this._handleDialPointerDown.bind(this); // Bind event handlers so "this" points to the class instance.
    this._handleDialPointerMove = this._handleDialPointerMove.bind(this);
    this._handleDialPointerUp = this._handleDialPointerUp.bind(this);
    this._ringRotation = 0; // Remember the current rotation of the metallic ring so new ticks can align with it.
    this._dragDisabled = false; // Flag used to temporarily disable dragging when the mode dialog is open.
    this._ringGroup = null; // Will hold the SVG group that represents the metallic bezel.
    this._dragZoneInnerRatio = 0.8; // Only allow dragging when the pointer is near the edge of the dial (80% outward).
    this._ringMetrics = null; // Stores computed radii used when building ring decorations.
    this._dragOverlay = null; // Placeholder for an optional overlay shown while dragging.
    this._limitFlash = null; // Placeholder for the visual flash shown when the user hits min/max limits.

    this._container = document.createElement('div'); // Wrapper that holds both the dial SVG and the mode controls.
    this._modeMenuContainer = null; // References the dialog container once it is built.
    this._modeMenuAnchor = null; // TRIAL MERGE: wrapper group that keeps the toggle translation stable.
    this._modeMenuToggler = null; // References the SVG group that opens/closes the mode carousel.
    this._modeMenuToggleBody = null; // Inner SVG group used for animation/scale effects.
    this._modeMenuCircle = null; // Background circle used to render the control.
    this._modeMenuInner = null; // Inner circle that provides depth to the control.
    this._modeMenuList = null; // References the list element that holds the individual mode buttons.
    this._modeMenuItems = []; // Keep the individual list items handy so we can toggle active states.
    this._modeMenuGeometry = null; // Cache geometry for the toggle to support responsive layouts.
    this._modeMenuScale = 0; // Remember the most recent expansion state so transforms can be recomputed quickly.
    this._modeCarouselEnabled = config && config.mode_carousel_ui === true; // Flag for the experimental carousel UI.
    const timeoutSeconds = Number(config && config.mode_carousel_timeout);
    const resolvedSeconds = Number.isFinite(timeoutSeconds) ? Math.max(timeoutSeconds, 0) : 4; // TRIAL MERGE: align the auto-select window with the 4s snap requirement.
    this._modeCarouselAutoCloseMs = resolvedSeconds * 1000; // Milliseconds before the carousel auto-commits.
    this._modeCarouselManualOverride = false; // TRIAL MERGE: track when user steering should supersede hass-driven state sync.
    // TRIAL MERGE: track the SVG-based carousel elements that live inside the dial rather than an HTML overlay.
    this._modeCarouselWrapper = null; // TRIAL MERGE: group that reveals the carousel items when the toggle opens.
    this._modeCarouselTrack = null; // TRIAL MERGE: inner group that positions the frosted obelisks around the dial center.
    this._modeCarouselGeometry = null; // TRIAL MERGE: cached width/height/spacing used to lay out carousel items.
    this._modeCarouselHalo = null; // TRIAL MERGE: circular highlight drawn behind the SVG carousel.
    this._modeCarouselGradientIds = {
      toggleHalo: SvgUtil.uniqueId('mode-carousel-toggle-halo'), // TRIAL MERGE: gradients keep the frosted toggle consistent across rebuilds.
      toggleBase: SvgUtil.uniqueId('mode-carousel-toggle-base'),
      toggleRing: SvgUtil.uniqueId('mode-carousel-toggle-ring'),
      toggleInner: SvgUtil.uniqueId('mode-carousel-toggle-inner'),
      toggleSheen: SvgUtil.uniqueId('mode-carousel-toggle-sheen'),
      toggleCrest: SvgUtil.uniqueId('mode-carousel-toggle-crest'),
      baseGlow: SvgUtil.uniqueId('mode-carousel-base-glow'),
      shadow: SvgUtil.uniqueId('mode-carousel-shadow'),
      panelFace: SvgUtil.uniqueId('mode-carousel-panel-face'), // TRIAL MERGE: dedicated panel gradients replace the earlier obelisk fills.
      panelEdge: SvgUtil.uniqueId('mode-carousel-panel-edge'),
      panelInner: SvgUtil.uniqueId('mode-carousel-panel-inner'),
      panelHighlight: SvgUtil.uniqueId('mode-carousel-panel-highlight'),
      panelSheen: SvgUtil.uniqueId('mode-carousel-panel-sheen'),
      panelSpark: SvgUtil.uniqueId('mode-carousel-panel-spark'),
      panelCaustic: SvgUtil.uniqueId('mode-carousel-panel-caustic'), // TRIAL MERGE: ribbon highlight gradient for extra depth.
      iconHeat: SvgUtil.uniqueId('mode-carousel-icon-heat'),
      iconHeatGlow: SvgUtil.uniqueId('mode-carousel-icon-heat-glow'),
      iconCool: SvgUtil.uniqueId('mode-carousel-icon-cool'),
      iconCoolGlow: SvgUtil.uniqueId('mode-carousel-icon-cool-glow'),
      iconDualWarm: SvgUtil.uniqueId('mode-carousel-icon-dual-warm'),
      iconDualCool: SvgUtil.uniqueId('mode-carousel-icon-dual-cool'),
      iconDualGlow: SvgUtil.uniqueId('mode-carousel-icon-dual-glow'),
      iconOff: SvgUtil.uniqueId('mode-carousel-icon-off'),
      iconOffGlow: SvgUtil.uniqueId('mode-carousel-icon-off-glow'),
      iconNeutral: SvgUtil.uniqueId('mode-carousel-icon-neutral'),
      iconNeutralGlow: SvgUtil.uniqueId('mode-carousel-icon-neutral-glow')
    };
    this._modeCarouselItems = []; // Data bag describing each carousel option.
    this._modeCarouselPendingModes = null; // Last set of HVAC modes supplied while the carousel was closed.
    this._modeCarouselPendingHass = null; // Last Home Assistant reference paired with the pending modes.
    this._modeCarouselActiveIndex = 0; // Index of the option currently centered in the carousel.
    this._modeCarouselTimer = null; // Timeout handle for automatic close-and-commit.
    this._modeCarouselSwipeContext = null; // Tracks swipe gestures on the carousel itself.
    this._modeCarouselPointerHandlers = null; // Cached pointer handler references for swipe gestures.
    this._modeCarouselDialContext = null; // Tracks dial rotation gestures while the carousel is open.
    this._modeCarouselDialHandlersAttached = false; // Ensure dial gesture listeners are only installed once.
    this._modeCarouselDialHandlers = null; // Store bound handlers so they can be removed when closing the carousel.
    this._metalRingIds = {
      gradient: SvgUtil.uniqueId('dial__metal-ring-gradient'), // Unique IDs for CSS-only fallbacks (legacy support).
      sheen: SvgUtil.uniqueId('dial__metal-ring-sheen'),
      filter: SvgUtil.uniqueId('dial__metal-ring-filter')
    };
    config.title = config.title === null || config.title === undefined ? 'Title' : config.title // Ensure the card always has a title string.

    this._ic = document.createElement('div'); // Container for the "more" menu button.
    this._ic.className = "prop"; // Class name expected by the stylesheet.
    this._ic.innerHTML = `<ha-icon-button id="more" icon="mdi:dots-vertical" class="c_icon" role="button" tabindex="0" aria-disabled="false"></ha-icon-button>`; // Render the kebab menu icon used by Home Assistant.
    this._container.appendChild(this._ic) // Attach the menu button wrapper to the main container.

    // this._container.appendChild(this._buildTitle(config.title));
    this._ic.addEventListener('click', () => this.openProp()); // When the kebab button is clicked we request the more-info dialog.
    this.c_body = document.createElement('div'); // Wrapper around the SVG dial to provide padding.
    this.c_body.className = 'c_body';
    const root = this._buildCore(config.diameter); // Create the main SVG element with gradients and filters.
    // Apply the dark face gradient to the dial shape through CSS variable
    try { root.style.setProperty('--thermostat-off-fill', `url(#${this._faceDarkId})`); } catch(_) {}
    // Add a soft outer shadow beneath everything
    const outerShadow = this._buildOuterShadow(config.radius);
    if (outerShadow) {
      root.appendChild(outerShadow);
      this._outerShadow = outerShadow;
    }
    root.appendChild(this._buildDial(config.radius)); // Draw the dark circular face of the thermostat.
    // Weather FX (storm) layer beneath texts
    const fxMode = (this._config && this._config.fx_weather) || 'storm';
    this._weatherFX = this._buildWeatherFX(config.radius, fxMode);
    if (this._weatherFX) {
      root.appendChild(this._weatherFX);
    }
    root.appendChild(this._buildTicks(config.num_ticks)); // Add the group that will hold all tick marks.
    this._ringGroup = this._buildRing(config.radius); // Build the metallic ring and remember the group for later rotation.
    root.appendChild(this._ringGroup); // Place the ring on top of the dial background.
    root.appendChild(this._buildThermoIcon(config.radius)); // Decorative thermometer icon near the bottom of the dial.
    root.appendChild(this._buildDialSlot(1)); // First slot used to show rotating temperature labels.
    root.appendChild(this._buildDialSlot(2)); // Second slot for label text.
    root.appendChild(this._buildDialSlot(3)); // Third slot for label text.

    root.appendChild(this._buildText(config.radius, 'title', 0)); // Static text placeholder for the thermostat name.
    root.appendChild(this._buildText(config.radius, 'ambient', 0)); // Large numbers that display the ambient temperature.
    root.appendChild(this._buildText(config.radius, 'target', 0)); // Large numbers for the setpoint while editing.
    root.appendChild(this._buildText(config.radius, 'low', -config.radius / 2.5)); // Smaller label that floats around the ring (low setpoint).
    root.appendChild(this._buildText(config.radius, 'high', config.radius / 3)); // Smaller label for the high setpoint.
    root.appendChild(this._buildChevrons(config.radius, 0, 'low', 0.7, -config.radius / 2.5)); // Upward chevrons used to adjust the low setpoint.
    root.appendChild(this._buildChevrons(config.radius, 0, 'high', 0.7, config.radius / 3)); // Upward chevrons for the high setpoint.
    root.appendChild(this._buildChevrons(config.radius, 0, 'target', 1, 0)); // Upward chevrons when adjusting a single setpoint.
    root.appendChild(this._buildChevrons(config.radius, 180, 'low', 0.7, -config.radius / 2.5)); // Downward chevrons (rotated 180°) for the low setpoint.
    root.appendChild(this._buildChevrons(config.radius, 180, 'high', 0.7, config.radius / 3)); // Downward chevrons for the high setpoint.
    root.appendChild(this._buildChevrons(config.radius, 180, 'target', 1, 0)); // Downward chevrons for the single setpoint.

    // Drag overlay and limit flash layers (visual feedback during interactions)
    const dragOverlay = SvgUtil.createSVGElement('circle', {
      cx: config.radius,
      cy: config.radius,
      r: config.radius,
      class: 'dial__drag-overlay'
    });
    root.appendChild(dragOverlay);
    this._dragOverlay = dragOverlay;

    const limitFlash = SvgUtil.createSVGElement('circle', {
      cx: config.radius,
      cy: config.radius,
      r: config.radius,
      class: 'dial__limit-flash'
    });
    root.appendChild(limitFlash);
    this._limitFlash = limitFlash;


    this.c_body.appendChild(root); // Place the SVG inside the padded wrapper.
    this._container.appendChild(this.c_body); // Add the dial assembly to the main container.
    this._root = root; // Remember the SVG root for future queries and event handling.
    // Add glass highlights and vignette on top for a realistic dome
    const glass = this._buildGlassOverlays(config.radius);
    if (glass) {
      root.appendChild(glass);
      this._glassGroup = glass;
    }
    this.preset_mode = null; // TRIAL MERGE: cache the active preset so the carousel can highlight preset options.
    this.fan_mode = null; // TRIAL MERGE: remember the active fan mode for dedicated carousel items.
    this.fan_modes = []; // TRIAL MERGE: list of supported fan modes advertised by the entity.

    this._root.addEventListener('pointerdown', this._handleDialPointerDown, { passive: false }); // Capture pointer events for drag interactions.
    this._root.addEventListener('pointermove', this._handleDialPointerMove);
    this._root.addEventListener('pointerup', this._handleDialPointerUp);
    this._root.addEventListener('pointercancel', this._handleDialPointerUp);
    this._buildControls(config.radius); // Build invisible hit areas that react to click/tap adjustments.
    this._root.addEventListener('click', () => this._enableControls()); // Clicking the dial switches it into "editing" mode.
    this._buildDialog(); // Create the HVAC mode selector menu structure beneath the dial.
    this._updateText('title', config.title); // Initialize the title label now that text nodes exist.
    this._applyRingRotation(); // Make sure the metallic ring is drawn using the default rotation state.
    // Ensure only ambient is shown initially
    this._setLabelVisibility(false);
  }

  updateState(options, hass) {

    const config = this._config; // Local alias for brevity.
    this.entity = options.entity; // Keep the full entity reference handy (for the more-info dialog and drag helpers).
    this.min_value = options.min_value; // Store current min so dragging can clamp values correctly.
    this.max_value = options.max_value; // Store current max.
    this.hvac_state = options.hvac_state; // Remember the active HVAC mode.
    this.preset_mode = options.preset_mode; // Preset information is used to adjust colors/labels.
    this.hvac_modes = options.hvac_modes; // Provide the list of available modes to the dialog builder.
    this.fan_mode = options.fan_mode; // TRIAL MERGE: capture the current fan mode for carousel highlighting.
    this.fan_modes = Array.isArray(options.fan_modes) ? options.fan_modes : []; // TRIAL MERGE: normalize fan mode lists for carousel rendering.
    this.temperature = {
      low: options.target_temperature_low, // Populate the setter above which updates dual-mode flag.
      high: options.target_temperature_high,
      target: options.target_temperature,
      ambient: options.ambient_temperature,
    };
    // Determine if dual should be active based on HVAC mode + valid low/high
    const hvacDual = this.hvac_state === 'heat_cool' || this.hvac_state === 'auto';
    const haveDual = hvacDual && Number.isFinite(this._low) && Number.isFinite(this._high);
    this.dual = !!haveDual;
    if (!this.dual) {
      // Clear dual values to avoid stale labels or accidental service payloads
      this._low = null;
      this._high = null;
      this._updateText('low', null);
      this._updateText('high', null);
    }

    this._lastHass = hass; // Keep the Home Assistant object for callbacks triggered by drag gestures.
    this._setLabelVisibility(this.in_control); // Ensure correct label visibility
    this._renderDial({
      refreshDialog: true, // When new state arrives we refresh the HVAC mode dialog in case available modes changed.
      hass,
      updateAmbient: !this.in_control, // Avoid overwriting the ambient label mid-drag so the user sees live adjustments.
      resetEdit: !this.in_control // When not editing we reset editing visuals to match the new state.
    });

    if (!this.in_control) {
      this._updateEdit(false); // Ensure the UI leaves edit mode after fresh state arrives.
      this._updateClass('in_control', this.in_control); // Keep CSS classes aligned with the logic flag.
    }

    this._updateText('target', this.temperature.target); // Update text labels to show the latest setpoints.
    this._updateText('low', this.temperature.low);
    this._updateText('high', this.temperature.high);
    this._setActiveMode(this.hvac_state); // Highlight the active HVAC mode in the dialog carousel.
    this._updateColor(this.hvac_state, this.preset_mode); // Apply appropriate color theme to the dial.
  }

  _renderDial({ refreshDialog = false, hass = null, updateAmbient = true, resetEdit = false } = {}) {
    const config = this._config; // Convenience shortcut for configuration values used repeatedly below.

    const totalRange = Math.max(this.max_value - this.min_value, Number.EPSILON); // Avoid division by zero in case min=max.
    const mapValueToIndex = (value) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return null; // Invalid numbers cannot be drawn on the tick ring.
      }
      const normalized = (value - this.min_value) / totalRange; // Convert the value into a 0..1 fraction of the full range.
      return SvgUtil.restrictToRange(Math.round(normalized * config.num_ticks), 0, config.num_ticks - 1); // Turn the fraction into a tick index we can highlight.
    };

    const ambientValue = typeof this.ambient === 'number' ? this.ambient : null; // Guard against null sensors.
    const targetValue = typeof this._target === 'number' ? this._target : null;
    const highValue = typeof this._high === 'number' ? this._high : null;
    const lowValue = typeof this._low === 'number' ? this._low : null;

    const ambientIndex = mapValueToIndex(ambientValue); // Convert temperatures into tick indices for drawing arcs.
    const targetIndex = mapValueToIndex(targetValue);
    const highIndex = mapValueToIndex(highValue);
    const lowIndex = mapValueToIndex(lowValue);

    // Reset dual class; will be applied below if truly active
    this._updateClass('has_dual', false);

    const tickIndexes = []; // Collect specific ticks to render as "major" marks (ambient, low, high, etc.).
    let fromIndex = null; // Start of the highlighted arc.
    let toIndex = null; // End of the highlighted arc.

    const dualState = (this.hvac_state === 'heat_cool' || this.hvac_state === 'auto') && this.dual; // Only treat true dual modes as dual.
    this._updateClass('has_dual', !!dualState);
    let rotationReference = targetValue ?? ambientValue ?? this.min_value; // Default rotation anchor ensures the ring tracks the main value.

    if (dualState) {
      const sortedDualValues = [lowValue, highValue, ambientValue]
        .filter((value) => typeof value === 'number' && !Number.isNaN(value))
        .sort((a, b) => a - b);

      sortedDualValues.forEach((value) => {
        const idx = mapValueToIndex(value);
        if (idx !== null) tickIndexes.push(idx);
      });

      this._updateTemperatureSlot(null, 0, `temperature_slot_1`);
      this._updateTemperatureSlot(null, 0, `temperature_slot_2`);
      this._updateTemperatureSlot(null, 0, `temperature_slot_3`);

      switch (this.hvac_state) {
        case 'heat_cool':
        case 'off': {
          if (highIndex !== null && ambientIndex !== null && highIndex < ambientIndex) {
            fromIndex = highIndex;
            toIndex = ambientIndex;
            this._updateTemperatureSlot(ambientValue, 8, `temperature_slot_3`);
            this._updateTemperatureSlot(highValue, -8, `temperature_slot_2`);
          } else if (lowIndex !== null && ambientIndex !== null && lowIndex > ambientIndex) {
            fromIndex = ambientIndex;
            toIndex = lowIndex;
            this._updateTemperatureSlot(ambientValue, -8, `temperature_slot_1`);
            this._updateTemperatureSlot(lowValue, 8, `temperature_slot_2`);
          } else {
            this._updateTemperatureSlot(lowValue, -8, `temperature_slot_1`);
            this._updateTemperatureSlot(highValue, 8, `temperature_slot_3`);
            if (lowIndex !== null && highIndex !== null) {
              fromIndex = Math.min(lowIndex, highIndex);
              toIndex = Math.max(lowIndex, highIndex);
            }
          }
          break;
        }
        default: {
          this._updateTemperatureSlot(lowValue, -8, `temperature_slot_1`);
          this._updateTemperatureSlot(highValue, 8, `temperature_slot_3`);
          if (lowIndex !== null && highIndex !== null) {
            fromIndex = Math.min(lowIndex, highIndex);
            toIndex = Math.max(lowIndex, highIndex);
          }
          break;
        }
      }

      if (fromIndex === null || toIndex === null) {
        const candidates = [lowIndex, highIndex, ambientIndex].filter((idx) => idx !== null);
        if (candidates.length) {
          fromIndex = Math.min(...candidates);
          toIndex = Math.max(...candidates);
        }
      }

      if (sortedDualValues.length) {
        rotationReference = sortedDualValues.reduce((sum, value) => sum + value, 0) / sortedDualValues.length;
      }
    } else {
      const sortedSingleValues = [targetValue, ambientValue]
        .filter((value) => typeof value === 'number' && !Number.isNaN(value))
        .sort((a, b) => a - b);

      const primaryValue = sortedSingleValues[0];
      const secondaryValue = sortedSingleValues[1] ?? sortedSingleValues[0];

      this._updateTemperatureSlot(primaryValue, -8, `temperature_slot_1`); // The first label hugs the lower side of the highlighted arc.
      this._updateTemperatureSlot(secondaryValue, 8, `temperature_slot_2`); // The second label floats near the upper side.

      sortedSingleValues.forEach((value) => {
        const idx = mapValueToIndex(value);
        if (idx !== null) tickIndexes.push(idx);
      });

      if (targetIndex !== null && ambientIndex !== null) {
        fromIndex = Math.min(targetIndex, ambientIndex);
        toIndex = Math.max(targetIndex, ambientIndex);
      } else if (targetIndex !== null) {
        fromIndex = toIndex = targetIndex;
      } else if (ambientIndex !== null) {
        fromIndex = toIndex = ambientIndex;
      }

      if (sortedSingleValues.length) {
        rotationReference = sortedSingleValues[sortedSingleValues.length - 1];
      }
    }

    if (tickIndexes.length) {
      tickIndexes.sort((a, b) => a - b);
    }

    this._updateTicks(fromIndex, toIndex, tickIndexes, this.hvac_state); // Paint the tick marks using the calculated ranges.

    if (!this._dragContext) {
      if (typeof rotationReference === 'number' && !Number.isNaN(rotationReference)) {
        this._ringRotation = this._computeRingRotationFromValue(rotationReference);
        this._applyRingRotation();
      }
    }

    if (updateAmbient) {
      this._updateText('ambient', this.ambient);
    }

    if (resetEdit) {
      this._in_control = false;
      this._updateEdit(false); // Remove edit styling when requested by the caller.
      this._updateClass('in_control', this.in_control);
    }

    if (refreshDialog && hass) {
      this._updateDialog(this.hvac_modes, hass); // Rebuild the HVAC mode dialog using the latest list from the entity.
    }
  }


  _temperatureControlClicked(index) {
    const config = this._config; // Readability shortcut.
    let chevron; // Will point at the SVG chevron that should flash.
    this._root.querySelectorAll('path.dial__chevron').forEach(el => SvgUtil.setClass(el, 'pressed', false)); // Clear any previous "pressed" animation before applying a new one.
    if (this.in_control) {
      if (this.dual) {
        switch (index) {
          case 0:
            // clicked top left
            chevron = this._root.querySelectorAll('path.dial__chevron--low')[1];
            this._low = this._low + config.step; // Raise the low setpoint.
            if ((this._low + config.idle_zone) >= this._high) this._low = this._high - config.idle_zone; // Prevent the low setpoint from crossing over the high setpoint.
            break;
          case 1:
            // clicked top right
            chevron = this._root.querySelectorAll('path.dial__chevron--high')[1];
            this._high = this._high + config.step; // Raise the high setpoint.
            if (this._high > this.max_value) this._high = this.max_value; // Clamp to the thermostat's maximum temperature.
            break;
          case 2:
            // clicked bottom right
            chevron = this._root.querySelectorAll('path.dial__chevron--high')[0];
            this._high = this._high - config.step; // Lower the high setpoint.
            if ((this._high - config.idle_zone) <= this._low) this._high = this._low + config.idle_zone; // Keep a minimum idle zone between the setpoints.
            break;
          case 3:
            // clicked bottom left
            chevron = this._root.querySelectorAll('path.dial__chevron--low')[0];
            this._low = this._low - config.step; // Lower the low setpoint.
            if (this._low < this.min_value) this._low = this.min_value; // Do not go below the thermostat's minimum.
            break;
        }
        SvgUtil.setClass(chevron, 'pressed', true); // Briefly highlight the chevron that was tapped.
        setTimeout(() => SvgUtil.setClass(chevron, 'pressed', false), 200);
        if (config.highlight_tap)
          SvgUtil.setClass(this._controls[index], 'control-visible', true); // Optionally flash the invisible control overlay for clarity.
      }
      else {
        if (index < 2) {
          // clicked top
          chevron = this._root.querySelectorAll('path.dial__chevron--target')[1];
          this._target = this._target + config.step; // Increase the single setpoint.
          if (this._target > this.max_value) this._target = this.max_value; // Cap at thermostat maximum.
          if (config.highlight_tap) {
            SvgUtil.setClass(this._controls[0], 'control-visible', true);
            SvgUtil.setClass(this._controls[1], 'control-visible', true);
          }
        } else {
          // clicked bottom
          chevron = this._root.querySelectorAll('path.dial__chevron--target')[0];
          this._target = this._target - config.step; // Decrease the single setpoint.
          if (this._target < this.min_value) this._target = this.min_value; // Do not fall below the minimum.
          if (config.highlight_tap) {
            SvgUtil.setClass(this._controls[2], 'control-visible', true);
            SvgUtil.setClass(this._controls[3], 'control-visible', true);
          }
        }
        SvgUtil.setClass(chevron, 'pressed', true);
        setTimeout(() => SvgUtil.setClass(chevron, 'pressed', false), 200);
      }
      if (config.highlight_tap) {
        setTimeout(() => {
          SvgUtil.setClass(this._controls[0], 'control-visible', false);
          SvgUtil.setClass(this._controls[1], 'control-visible', false);
          SvgUtil.setClass(this._controls[2], 'control-visible', false);
          SvgUtil.setClass(this._controls[3], 'control-visible', false);
        }, 200);
      }
    } else {
      this._enableControls(); // If the dial was not yet in edit mode, first enable controls so the next tap adjusts values.
    }
  }

  _updateEdit(show_edit) {
    SvgUtil.setClass(this._root, 'dial--edit', show_edit);
  }

  _enableControls() {
    this._in_control = true;
    this._updateClass('in_control', this.in_control);
    this._updateEdit(true);
    this._setLabelVisibility(true);
    //this._updateClass('has-thermo', true);
    this._updateText('target', this.temperature.target);
    this._updateText('low', this.temperature.low);
    this._setActiveMode(this.hvac_state);
    this._scheduleControlCommit();
  }

  _scheduleControlCommit() {
    const config = this._config;
    if (this._timeoutHandler) clearTimeout(this._timeoutHandler);
    const delay = Math.max((config.pending || 0) * 1000, 0);
    this._timeoutHandler = setTimeout(() => {
      this._updateText('ambient', this.ambient);
      this._updateEdit(false);
      //this._updateClass('has-thermo', false);
      this._in_control = false;
      this._updateClass('in_control', this.in_control);
      this._setLabelVisibility(false);
      if (typeof config.control === 'function') {
        config.control();
      }
    }, delay);
  }

  _handleDialPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    if (this._dragDisabled) {
      return;
    }
    if (!this._isWithinDragZone(event)) {
      return;
    }

    const normalizedAngle = this._pointerNormalizedAngle(event);
    if (normalizedAngle === null) {
      return;
    }

    if (!this.in_control) {
      this._enableControls();
    } else {
      this._updateText('target', this.temperature.target);
      this._updateText('low', this.temperature.low);
      this._setActiveMode(this.hvac_state);
    }

    const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
    const dragType = this._determineDragTarget(event);
    this._dragContext = {
      pointerId,
      type: dragType,
      lastAngle: normalizedAngle,
      accumulator: 0
    };

    this._setDragging(true);

    try {
      if (this._root.setPointerCapture) {
        this._root.setPointerCapture(pointerId);
      }
    } catch (err) {
      // ignore
    }

    this._scheduleControlCommit();

    event.preventDefault();
    event.stopPropagation();
  }

  _handleDialPointerMove(event) {
    if (!this._dragContext) {
      return;
    }
    if (event.pointerId !== undefined && event.pointerId !== this._dragContext.pointerId) {
      return;
    }

    if (this._updateFromPointer(event)) {
      this._scheduleControlCommit();
    }
  }

  _handleDialPointerUp(event) {
    if (!this._dragContext) {
      return;
    }
    if (event.pointerId !== undefined && event.pointerId !== this._dragContext.pointerId) {
      return;
    }

    try {
      if (this._root.releasePointerCapture) {
        this._root.releasePointerCapture(this._dragContext.pointerId);
      }
    } catch (err) {
      // ignore
    }

    this._dragContext = null;
    this._setDragging(false);
    this._scheduleControlCommit();
    this._renderDial({
      refreshDialog: false,
      hass: this._lastHass,
      updateAmbient: false,
      resetEdit: false
    });
  }

  _determineDragTarget(event) {
    const dualAllowed = this.dual && (this.hvac_state === 'heat_cool' || this.hvac_state === 'off' || this.hvac_state === 'auto');
    if (!dualAllowed || typeof this._low !== 'number' || typeof this._high !== 'number') {
      return 'target';
    }

    const normalized = this._pointerNormalizedAngle(event);
    if (normalized === null) {
      return 'target';
    }

    const config = this._config;
    const pointerIndex = SvgUtil.restrictToRange(Math.round((normalized / (config.tick_degrees || 1)) * config.num_ticks), 0, config.num_ticks - 1);
    const totalRange = Math.max(this.max_value - this.min_value, Number.EPSILON);
    const mapValueToIndex = (value) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return null;
      }
      const normalizedValue = (value - this.min_value) / totalRange;
      return SvgUtil.restrictToRange(Math.round(normalizedValue * config.num_ticks), 0, config.num_ticks - 1);
    };
    const lowIndex = mapValueToIndex(this._low);
    const highIndex = mapValueToIndex(this._high);

    if (lowIndex === null || highIndex === null) {
      return 'target';
    }

    return Math.abs(pointerIndex - lowIndex) <= Math.abs(pointerIndex - highIndex) ? 'low' : 'high';
  }

  _pointerNormalizedAngle(event) {
    const rect = this._root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    if (!dx && !dy) {
      return null;
    }

    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    angle = (angle + 360) % 360;
    const config = this._config;
    let normalized = (angle + config.offset_degrees + 360) % 360;
    if (normalized > config.tick_degrees) {
      const gap = 360 - config.tick_degrees;
      const overflow = normalized - config.tick_degrees;
      normalized = overflow <= gap / 2 ? config.tick_degrees : 0;
    }
    return SvgUtil.restrictToRange(normalized, 0, config.tick_degrees);
  }

  _isWithinDragZone(event) {
    const rect = this._root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = rect.width / (this._config.radius * 2);
    const outer = this._config.radius * scale;
    const inner = outer * (this._dragZoneInnerRatio || 0.8);
    return distance <= outer && distance >= inner;
  }

  _computeRingRotationFromValue(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return this._ringRotation || 0;
    }
    const config = this._config;
    const totalRange = Math.max(this.max_value - this.min_value, Number.EPSILON);
    const normalized = (value - this.min_value) / totalRange;
    const centered = normalized * config.tick_degrees - config.tick_degrees / 2;
    const inertia = 0.5;
    return centered * inertia;
  }

  _applyRingRotation() {
    const target = this._ringSpinGroup || this._ringGroup;
    if (!target) {
      return;
    }
    const angle = this._ringRotation || 0;
    target.setAttribute('transform', `rotate(${angle} ${this._config.radius} ${this._config.radius})`);
    // Subtle parallax on the glass highlights based on rotation
    if (this._glassGroup) {
      const maxShift = Math.max(1.5, this._config.radius * 0.01);
      const shiftX = Math.max(-maxShift, Math.min(maxShift, -angle * 0.02));
      const shiftY = Math.max(-maxShift, Math.min(maxShift, angle * 0.01));
      this._glassGroup.setAttribute('transform', `translate(${shiftX},${shiftY})`);
    }
  }

  _updateFromPointer(event) {
    if (!this._dragContext) {
      return false;
    }

    const normalizedAngle = this._pointerNormalizedAngle(event);
    if (normalizedAngle === null) {
      return false;
    }

    const config = this._config;
    const context = this._dragContext;
    const lastAngle = context.lastAngle ?? normalizedAngle;
    let delta = normalizedAngle - lastAngle;
    const arc = config.tick_degrees || 360;
    if (delta > arc / 2) delta -= arc;
    if (delta < -arc / 2) delta += arc;
    context.lastAngle = normalizedAngle;

    const inertia = 0.5;
    this._ringRotation = (this._ringRotation ?? 0) + delta * inertia;
    this._applyRingRotation();

    const valueRange = Math.max(this.max_value - this.min_value, Number.EPSILON);
    const step = config.step || 0.5;
    const sensitivity = 0.7;
    const deltaValue = (delta / arc) * valueRange * sensitivity;
    context.accumulator = (context.accumulator || 0) + deltaValue;

    const applySteps = (prop, min, max, textId) => {
      let current = this[prop];
      if (typeof current !== 'number' || Number.isNaN(current)) {
        return false;
      }
      let updated = false;
      while (context.accumulator >= step - 1e-6) {
        const nextValue = Math.min(max, current + step);
        if (nextValue === current) {
          context.accumulator = step / 2;
          break;
        }
        current = nextValue;
        context.accumulator -= step;
        updated = true;
      }
      while (context.accumulator <= -step + 1e-6) {
        const nextValue = Math.max(min, current - step);
        if (nextValue === current) {
          context.accumulator = -step / 2;
          break;
        }
        current = nextValue;
        context.accumulator += step;
        updated = true;
      }
      if (updated) {
        this[prop] = Math.round(current * 100) / 100;
        this._updateText(textId, this[prop]);
      }
      return updated;
    };

    let changed = false;
    const idleZone = this._config.idle_zone || 0;
    if (context.type === 'low' && typeof this._high === 'number') {
      const maxLow = this._high - idleZone;
      changed = applySteps('_low', this.min_value, maxLow, 'low');
    } else if (context.type === 'high' && typeof this._low === 'number') {
      const minHigh = this._low + idleZone;
      changed = applySteps('_high', minHigh, this.max_value, 'high');
    } else {
      changed = applySteps('_target', this.min_value, this.max_value, 'target');
    }

    if (changed) {
      this._renderDial({
        refreshDialog: false,
        hass: this._lastHass,
        updateAmbient: false,
        resetEdit: false
      });
    }

    return changed;
  }

  _setDragging(isDragging) {
    SvgUtil.setClass(this._root, 'dial--dragging', isDragging);
  }

  _updateClass(class_name, flag) {
    SvgUtil.setClass(this._root, class_name, flag);
  }

  _setLabelVisibility(editMode) {
    if (!this._root) return;
    const amb = this._root.querySelector('#ambient');
    const tgt = this._root.querySelector('#target');
    if (amb) amb.style.visibility = editMode ? 'hidden' : 'visible';
    if (tgt) tgt.style.visibility = editMode ? 'visible' : 'hidden';
  }

  // Visual feedback for hitting min/max limits during drag
  _triggerLimitFlash(direction) {
    if (!this._limitFlash) return;
    this._limitFlash.classList.remove('flash--min', 'flash--max', 'flash-active');
    this._limitFlash.classList.add(direction >= 0 ? 'flash--max' : 'flash--min');
    // trigger animation
    void this._limitFlash.offsetWidth; // reflow
    this._limitFlash.classList.add('flash-active');
    setTimeout(() => {
      if (this._limitFlash) this._limitFlash.classList.remove('flash-active');
    }, 380);
  }

  _updateText(id, value) {
    const lblTarget = this._root.querySelector(`#${id}`).querySelectorAll('tspan');
    const n = Number(value);
    const text = Math.floor(n);
    if (Number.isFinite(n)) {
      lblTarget[0].textContent = text;
      if (n % 1 != 0) {
        lblTarget[1].textContent = Math.round(n % 1 * 10);
      } else {
        lblTarget[1].textContent = '';
      }
    }

    if (this.in_control && id == 'target' && this.dual) {
      lblTarget[0].textContent = '·';
    }

    if (id == 'title') {
      lblTarget[0].textContent = value;
      lblTarget[1].textContent = '';
    }
    // Ensure correct glyph and clear fractional in dual edit mode
    if (this.in_control && id == 'target' && this.dual) {
      lblTarget[0].textContent = '·';
      lblTarget[1].textContent = '';
    }
  }

  _updateTemperatureSlot(value, offset, slot) {

    const config = this._config;
    const lblSlot1 = this._root.querySelector(`#${slot}`)
    lblSlot1.textContent = value != null ? (SvgUtil.superscript(value) + '°') : '';

    const peggedValue = SvgUtil.restrictToRange(value, this.min_value, this.max_value);
    const position = [config.radius, config.ticks_outer_radius - (config.ticks_outer_radius - config.ticks_inner_radius) / 2];
    let degs = config.tick_degrees * (peggedValue - this.min_value) / (this.max_value - this.min_value) - config.offset_degrees + offset;
    const pos = SvgUtil.rotatePoint(position, degs, [config.radius, config.radius]);
    SvgUtil.attributes(lblSlot1, {
      x: pos[0],
      y: pos[1]
    });
  }

  _updateColor(state, preset_mode) {

    if (!this._root) {

      return;

    }

    let hvacState = typeof state === 'string' && state.length ? state : 'off';

    if (typeof preset_mode === 'string' && hvacState !== 'off' && preset_mode.toLowerCase() === 'idle') {

      hvacState = 'idle';

    }

    const prefix = 'dial--state--';

    Array.from(this._root.classList).forEach((className) => {

      if (className.indexOf(prefix) === 0) {

        this._root.classList.remove(className);

      }

    });

    this._root.classList.add(`${prefix}${hvacState}`);

    this._root.dataset.hvacState = hvacState;

  }

  _updateTicks(from, to, large_ticks, hvac_state) {
    const config = this._config;

    const tickPoints = [
      [config.radius - 1, config.ticks_outer_radius],
      [config.radius + 1, config.ticks_outer_radius],
      [config.radius + 1, config.ticks_inner_radius],
      [config.radius - 1, config.ticks_inner_radius]
    ]; // Basic rectangle used for small tick marks before rotation.
    const tickPointsLarge = [
      [config.radius - 1.5, config.ticks_outer_radius],
      [config.radius + 1.5, config.ticks_outer_radius],
      [config.radius + 1.5, config.ticks_inner_radius + 20],
      [config.radius - 1.5, config.ticks_inner_radius + 20]
    ]; // Taller rectangle used for "major" tick marks (ambient/target/high/low).

    const highlightStart = typeof from === 'number' ? from : -1; // Default to -1 so comparisons fail when no highlight is needed.
    const highlightEnd = typeof to === 'number' ? to : -1;

    this._ticks.forEach((tick, index) => {
      let isLarge = false;
      const theta = config.tick_degrees / config.num_ticks; // Angle between each tick along the partial circle.
      large_ticks.forEach((i) => {
        if (index === i) isLarge = true; // Mark the tick as "large" if it matches one of the highlighted indices.
      });

      const withinRange = highlightStart >= 0 && highlightEnd >= highlightStart && index >= highlightStart && index <= highlightEnd; // Check whether this tick falls inside the active arc.
      const classes = [];
      if (withinRange) {
        classes.push('active');
        if (hvac_state) {
          classes.push(hvac_state); // Encode the HVAC state to let CSS color the active arc.
        }
      }
      if (isLarge) {
        classes.push('large');
      }

      SvgUtil.attributes(tick, {
        d: SvgUtil.pointsToPath(SvgUtil.rotatePoints(isLarge ? tickPointsLarge : tickPoints, index * theta - config.offset_degrees, [config.radius, config.radius])), // Rotate each tick's rectangle into position around the dial.
        class: classes.join(' ')
      });
    });
  }

  _updateDialog(modes, hass) {
    if (!this._modeMenuList) {
      this._buildDialog();
    }
    if (this._modeCarouselEnabled) {
      if (this._modeMenuList) {
        this._modeMenuList.style.display = 'none';
      }
      const pendingModes = Array.isArray(modes) ? modes.slice() : [];
      this._modeCarouselPendingModes = pendingModes;
      this._modeCarouselPendingHass = hass || null;
      const isCarouselOpen = this._modeMenuContainer && this._modeMenuContainer.classList.contains('menu-open');
      if (isCarouselOpen) {
        this._ensureModeCarouselElements();
        this._updateCarouselOptions(pendingModes, hass);
      } else {
        this._destroyModeCarouselElements();
      }
      return;
    }
    const list = this._modeMenuList;
    if (!list) {
      return;
    }
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    this._modeMenuItems = [];
    if (!Array.isArray(modes) || modes.length === 0) {
      this._updateModeMenuTransforms(0);
      return;
    }
    const total = modes.length;
    const menuDistance = Math.max(82, Math.min(this._config.radius * 0.85, 140));
    const angleStep = 360 / total;
    const htmlNS = 'http://www.w3.org/1999/xhtml';
    for (let i = 0; i < total; i++) {
      const mode = modes[i];
      const icon = this._iconForMode ? this._iconForMode(mode, 'help') : 'help';
      const item = SvgUtil.createSVGElement('g', { class: 'menu-item' });
      const angle = angleStep * i;
      item.dataset.angle = String(angle);
      item.dataset.distance = String(menuDistance);
      item.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease';
      item.style.opacity = '0';

      const foreign = SvgUtil.createSVGElement('foreignObject', {
        class: 'menu-item__foreign',
        x: -70,
        y: -70,
        width: 140,
        height: 140
      });
      const wrapper = document.createElementNS(htmlNS, 'div');
      wrapper.setAttribute('class', 'menu-item__wrapper');
      const button = document.createElementNS(htmlNS, 'button');
      button.setAttribute('type', 'button');
      button.className = 'menu-item__button';
      button.dataset.mode = mode;
      button.innerHTML = `<span class="menu-item__icon"><ha-icon icon="mdi:${icon}"></ha-icon></span><span class="menu-item__label">${mode.replace(/_/g, ' ')}</span>`;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this._setMode(event, mode, hass);
      });
      wrapper.appendChild(button);
      foreign.appendChild(wrapper);
      item.appendChild(foreign);

      list.appendChild(item);
      this._modeMenuItems.push(item);
    }
    this._setActiveMode(this.hvac_state);
    this._updateModeMenuTransforms(this._modeMenuContainer && this._modeMenuContainer.classList.contains('menu-open') ? 1 : 0);
  }
  _setModeMenuOpen(open) {
    if (!this._modeMenuContainer || !this._modeMenuToggler) {
      return;
    }
    const expanded = !!open;
    if (this._modeCarouselEnabled) {
      this._modeCarouselManualOverride = false; // TRIAL MERGE: reset manual steering state whenever the carousel toggles.
    }
    if (expanded) {
      this._dragDisabled = true;
      const activePointerId = this._dragContext ? this._dragContext.pointerId : undefined;
      if (this._dragContext) {
        this._dragContext = null;
        this._setDragging(false);
      }
      if (activePointerId !== undefined && this._root && this._root.releasePointerCapture) {
        try {
          this._root.releasePointerCapture(activePointerId);
        } catch (err) {
          // ignore pointer release errors
        }
      }
    } else {
      this._dragDisabled = false;
    }
    this._modeMenuContainer.classList.toggle('menu-open', expanded);
    this._modeMenuToggler.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (this._modeMenuToggleBody) {
      this._modeMenuToggleBody.classList.toggle('mode-menu__toggler-body--open', expanded);
    }
    // TRIAL MERGE: suspend the temperature tap zones while the carousel is open so they no longer intercept the mode toggle.
    if (Array.isArray(this._controls)) {
      this._controls.forEach((control) => {
        if (control && control.style) {
          control.style.pointerEvents = expanded ? 'none' : 'auto';
        }
      });
    }
    if (this._root) {
      SvgUtil.setClass(this._root, 'modec-open', expanded);
    }
    if (this._modeCarouselEnabled) {
      if (this._modeMenuList) {
        this._modeMenuList.setAttribute('aria-hidden', 'true');
        this._modeMenuList.style.pointerEvents = 'none';
      }
      this._toggleCarouselOpen(expanded);
      return;
    }
    if (this._modeMenuList) {
      this._modeMenuList.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      this._modeMenuList.style.pointerEvents = expanded ? 'auto' : 'none';
    }
    this._modeMenuItems.forEach((item) => {
      item.style.opacity = expanded ? '1' : '0';
      item.style.pointerEvents = expanded ? 'auto' : 'none';
    });
    this._updateModeMenuTransforms(expanded ? 1 : 0);
  }

  _setActiveMode(mode) {
    if (Array.isArray(this._modeMenuItems)) {
      this._modeMenuItems.forEach((item) => {
        const button = item.querySelector('.menu-item__button');
        const isActive = button && button.dataset.mode === mode;
        item.classList.toggle('menu-item--active', !!isActive);
      });
    }
    if (this._modeCarouselEnabled) {
      const manualActive = this._modeCarouselManualOverride && this._modeMenuContainer && this._modeMenuContainer.classList.contains('menu-open');
      if (!manualActive) {
        this._updateCarouselActiveFromState();
      }
      const fractional = manualActive && this._modeCarouselSwipeContext && Number.isFinite(this._modeCarouselSwipeContext.lastFractional)
        ? this._modeCarouselSwipeContext.lastFractional
        : 0; // TRIAL MERGE: preserve the drag offset while hass updates toggle the active hvac mode.
      this._updateCarouselClasses(fractional);
    }
  }

  // TRIAL MERGE: reuse the SVG carousel track while it lives inside the dial hierarchy.
  _ensureModeCarouselElements() {
    if (!this._modeCarouselEnabled) {
      return null;
    }
    const wrapper = this._modeCarouselWrapper;
    if (!wrapper) {
      return null;
    }
    if (this._modeMenuList) {
      this._modeMenuList.style.display = 'none';
    }

    if (!this._modeCarouselPointerHandlers && this._modeCarouselTrack) {
      const pointerDown = (event) => {
        if (!this._modeMenuContainer || !this._modeMenuContainer.classList.contains('menu-open')) {
          return;
        }
        if (event.button !== undefined && event.button !== 0) {
          return;
        }
        if (!Array.isArray(this._modeCarouselItems) || !this._modeCarouselItems.length) {
          return;
        }
        const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
        const geometry = this._modeCarouselGeometry || this._computeCarouselGeometry(this._resolveDialRadius());
        const spacing = geometry && Number.isFinite(geometry.spacing) && geometry.spacing !== 0 ? geometry.spacing : 1;
        const total = this._modeCarouselItems.length;
        const baseIndex = total ? ((this._modeCarouselActiveIndex % total) + total) % total : 0; // TRIAL MERGE: normalize the starting index for swipe gestures.
        this._modeCarouselManualOverride = true; // TRIAL MERGE: pause hass-driven snaps while the user is dragging.
        this._modeCarouselSwipeContext = {
          pointerId,
          startX: event.clientX,
          spacing,
          baseIndex,
          lastFractional: 0,
          lastRawShift: 0 // TRIAL MERGE: remember the total swipe distance so release logic can snap to the nearest card.
        };
        if (this._modeCarouselTrack.setPointerCapture && event.pointerId !== undefined) {
          try { this._modeCarouselTrack.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
        }
        event.preventDefault();
        this._resetCarouselTimer();
      };
      const pointerMove = (event) => {
        const ctx = this._modeCarouselSwipeContext;
        const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
        if (!ctx || ctx.pointerId !== pointerId) {
          return;
        }
        if (!Array.isArray(this._modeCarouselItems) || !this._modeCarouselItems.length) {
          return;
        }
        const spacing = ctx.spacing || 1;
        const total = this._modeCarouselItems.length;
        const deltaX = event.clientX - ctx.startX;
        const rawShift = spacing ? deltaX / spacing : 0;
        const roundedShift = Math.round(rawShift);
        let nextIndex = ctx.baseIndex - roundedShift;
        if (total > 0) {
          nextIndex %= total;
          if (nextIndex < 0) {
            nextIndex += total;
          }
        }
        if (this._modeCarouselActiveIndex !== nextIndex) {
          this._modeCarouselActiveIndex = nextIndex;
        }
        const fractional = Math.max(Math.min(rawShift - roundedShift, 0.5), -0.5); // TRIAL MERGE: preserve a smooth drag offset while swiping.
        ctx.lastFractional = fractional;
        ctx.lastRawShift = rawShift; // TRIAL MERGE: retain the raw shift so release snapping can consider partial drags.
        this._updateCarouselClasses(fractional);
        this._resetCarouselTimer();
        event.preventDefault();
      };
      const pointerUp = (event) => {
        const ctx = this._modeCarouselSwipeContext;
        const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
        if (!ctx || ctx.pointerId !== pointerId) {
          return;
        }
        const total = Array.isArray(this._modeCarouselItems) ? this._modeCarouselItems.length : 0;
        const baseIndex = total ? ((ctx.baseIndex % total) + total) % total : 0;
        const rawShift = Number.isFinite(ctx.lastRawShift) ? ctx.lastRawShift : 0;
        const snapThreshold = 0.18; // TRIAL MERGE: treat small drags as intent to change when the card nears the centre.
        let targetShift = 0;
        if (rawShift > snapThreshold) {
          const rounded = Math.round(rawShift);
          targetShift = Math.max(1, rounded);
        } else if (rawShift < -snapThreshold) {
          const rounded = Math.round(rawShift);
          targetShift = Math.min(-1, rounded);
        }
        if (targetShift !== 0 && total > 0) {
          let nextIndex = baseIndex - targetShift;
          nextIndex %= total;
          if (nextIndex < 0) {
            nextIndex += total;
          }
          this._modeCarouselActiveIndex = nextIndex;
        }
        this._modeCarouselSwipeContext = null;
        if (event.pointerId !== undefined && this._modeCarouselTrack.releasePointerCapture) {
          try { this._modeCarouselTrack.releasePointerCapture(event.pointerId); } catch (_) { /* ignore */ }
        }
        this._updateCarouselClasses();
        this._resetCarouselTimer();
        event.preventDefault();
      };
      this._modeCarouselPointerHandlers = { pointerDown, pointerMove, pointerUp };
      this._modeCarouselTrack.addEventListener('pointerdown', pointerDown, { passive: false, capture: true });
      this._modeCarouselTrack.addEventListener('pointermove', pointerMove, { passive: false });
      this._modeCarouselTrack.addEventListener('pointerup', pointerUp);
      this._modeCarouselTrack.addEventListener('pointercancel', pointerUp);
      this._modeCarouselTrack.addEventListener('mouseleave', pointerUp);
    }

    return wrapper;
  }

  // TRIAL MERGE: keep carousel DOM listeners tidy while the elements live inside the SVG hierarchy.
  _destroyModeCarouselElements() {
    if (this._modeCarouselPointerHandlers && this._modeCarouselTrack) {
      const { pointerDown, pointerMove, pointerUp } = this._modeCarouselPointerHandlers;
      try { this._modeCarouselTrack.removeEventListener('pointerdown', pointerDown, { capture: true }); } catch (_) { /* ignore */ }
      try { this._modeCarouselTrack.removeEventListener('pointermove', pointerMove); } catch (_) { /* ignore */ }
      try { this._modeCarouselTrack.removeEventListener('pointerup', pointerUp); } catch (_) { /* ignore */ }
      try { this._modeCarouselTrack.removeEventListener('pointercancel', pointerUp); } catch (_) { /* ignore */ }
      try { this._modeCarouselTrack.removeEventListener('mouseleave', pointerUp); } catch (_) { /* ignore */ }
    }
    this._modeCarouselPointerHandlers = null;
    this._modeCarouselSwipeContext = null;

    if (this._modeCarouselTrack) {
      try {
        this._modeCarouselTrack.innerHTML = '';
      } catch (_) {
        while (this._modeCarouselTrack.firstChild) {
          this._modeCarouselTrack.removeChild(this._modeCarouselTrack.firstChild);
        }
      }
    }

    if (this._modeCarouselWrapper) {
      this._modeCarouselWrapper.setAttribute('aria-hidden', 'true');
      if (this._modeCarouselWrapper.style) {
        this._modeCarouselWrapper.style.pointerEvents = 'none';
      }
    }

    this._modeCarouselItems = [];
    this._modeCarouselManualOverride = false; // TRIAL MERGE: release manual steering once the carousel has been torn down.
  }

  _updateCarouselOptions(modes, hass) { // eslint-disable-line no-unused-vars
    if (!this._modeCarouselEnabled) {
      return;
    }
    const track = this._modeCarouselTrack;
    if (!track) {
      return;
    }
    while (track.firstChild) {
      track.removeChild(track.firstChild);
    }
    this._modeCarouselItems = [];

    const hvacModes = Array.isArray(modes) ? modes.slice() : [];
    const hvacSet = new Set(hvacModes);
    if (typeof this.hvac_state === 'string' && this.hvac_state.length) {
      hvacSet.add(this.hvac_state);
    }

    const baseOrder = [
      { mode: 'heat', label: 'Heat', type: 'hvac' },
      { mode: 'cool', label: 'Cool', type: 'hvac' },
      { mode: 'auto', label: 'Auto', type: 'hvac' },
      { mode: 'heat_cool', label: 'Heat · Cool', type: 'hvac' },
      { mode: 'fan_only', label: 'Fan', type: 'hvac' },
    ];

    const options = [];
    baseOrder.forEach((entry) => {
      if (hvacSet.has(entry.mode)) {
        options.push(entry);
        hvacSet.delete(entry.mode);
      }
    });

    const presetModes = this.entity && this.entity.attributes && Array.isArray(this.entity.attributes.preset_modes)
      ? this.entity.attributes.preset_modes
      : [];
    if (presetModes.length || (typeof this.preset_mode === 'string' && this.preset_mode.length)) {
      const presetMap = new Map();
      presetModes.forEach((mode) => {
        if (typeof mode === 'string' && mode.length) {
          const key = mode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          if (!presetMap.has(key)) {
            presetMap.set(key, mode);
          }
        }
      });
      if (typeof this.preset_mode === 'string' && this.preset_mode.length) {
        const key = this.preset_mode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        if (!presetMap.has(key)) {
          presetMap.set(key, this.preset_mode);
        }
      }
      const prettyPreset = this.preset_mode ? this.preset_mode.replace(/_/g, ' ') : null;
      options.push({ mode: 'preset', label: prettyPreset ? `Preset (${prettyPreset})` : 'Preset', type: 'preset' });
      const addPresetOption = (key, label) => {
        const raw = presetMap.get(key);
        if (!raw) {
          return;
        }
        options.push({ mode: raw, label, type: 'preset-mode' });
        presetMap.delete(key);
      };
      addPresetOption('away', 'Preset Away'); // TRIAL MERGE: surface explicit away/none presets when available.
      addPresetOption('none', 'Preset None');
      presetMap.forEach((raw, key) => {
        const pretty = this._formatCarouselAssetLabel(key);
        const fallbackLabel = pretty ? `Preset ${pretty}` : 'Preset';
        options.push({ mode: raw, label: fallbackLabel, type: 'preset-mode' });
      });
    }

    if (hvacSet.has('off')) {
      options.push({ mode: 'off', label: 'Off', type: 'hvac' });
      hvacSet.delete('off');
    }

    hvacSet.forEach((mode) => {
      options.push({ mode, label: mode.replace(/_/g, ' '), type: 'hvac' });
    });

    const fanModesAttr = this.entity && this.entity.attributes && Array.isArray(this.entity.attributes.fan_modes)
      ? this.entity.attributes.fan_modes
      : (Array.isArray(this.fan_modes) ? this.fan_modes : []); // TRIAL MERGE: fall back to cached modes when dialog rebuilds mid-drag.
    if (fanModesAttr.length || (typeof this.fan_mode === 'string' && this.fan_mode.length)) {
      const fanMap = new Map();
      fanModesAttr.forEach((mode) => {
        if (typeof mode === 'string' && mode.length) {
          const key = mode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          if (!fanMap.has(key)) {
            fanMap.set(key, mode);
          }
        }
      });
      if (typeof this.fan_mode === 'string' && this.fan_mode.length) {
        const key = this.fan_mode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        if (!fanMap.has(key)) {
          fanMap.set(key, this.fan_mode);
        }
      }
      const addFanOption = (key, label) => {
        const raw = fanMap.get(key);
        if (!raw) {
          return;
        }
        options.push({ mode: raw, label, type: 'fan-mode' });
        fanMap.delete(key);
      };
      addFanOption('auto', 'Fan Auto'); // TRIAL MERGE: add dedicated fan mode controls to the carousel.
      addFanOption('on', 'Fan On');
      addFanOption('diffuse', 'Fan Diffuse');
      fanMap.forEach((raw, key) => {
        const pretty = this._formatCarouselAssetLabel(key);
        const fallbackLabel = pretty ? `Fan ${pretty}` : 'Fan';
        options.push({ mode: raw, label: fallbackLabel, type: 'fan-mode' });
      });
    }

    if (!options.length) {
      if (this._modeCarouselWrapper) {
        this._modeCarouselWrapper.setAttribute('aria-hidden', 'true');
        this._modeCarouselWrapper.classList.remove('mode-carousel-svg--open');
        if (this._modeMenuToggler) {
          this._modeMenuToggler.classList.remove('mode-menu__toggler--hidden');
        }
        this._destroyModeCarouselElements();
      }
      return;
    }

    const geometry = this._modeCarouselGeometry || this._computeCarouselGeometry(this._resolveDialRadius()); // TRIAL MERGE: reuse fallback-aware radius when laying out carousel items.
    const obeliskPath = this._carouselObeliskPath(geometry.itemWidth, geometry.itemHeight);
    const facetPath = this._carouselFacetPath(geometry.itemWidth, geometry.itemHeight);
    const reflectionPath = this._carouselReflectionPath(geometry.itemWidth, geometry.itemHeight);
    const highlightPath = this._carouselHighlightPath(geometry.itemWidth, geometry.itemHeight);
    const sparkPath = this._carouselSparkPath(geometry.itemWidth, geometry.itemHeight);
    const gradientIds = this._modeCarouselGradientIds || {};

    options.forEach((option, index) => {
      const group = SvgUtil.createSVGElement('g', {
        class: 'mode-carousel-svg__item',
        tabindex: '0',
        role: 'button',
        'aria-label': `${option.label} mode`,
        'data-mode': option.mode,
        'data-type': option.type
      });

      const shadow = SvgUtil.createSVGElement('ellipse', {
        // TRIAL MERGE: anchor each glass obelisk with a soft elliptical shadow.
        class: 'mode-carousel-svg__shadow',
        cx: 0,
        cy: geometry.itemHeight * 0.48,
        rx: geometry.itemWidth * 0.45,
        ry: geometry.itemHeight * 0.12
      });
      if (gradientIds.shadow) {
        shadow.setAttribute('fill', `url(#${gradientIds.shadow})`);
      }
      const glow = SvgUtil.createSVGElement('ellipse', {
        class: 'mode-carousel-svg__base-glow',
        cx: 0,
        cy: geometry.itemHeight * 0.46,
        rx: geometry.itemWidth * 0.38,
        ry: geometry.itemHeight * 0.14
      }); // TRIAL MERGE: luminous floor that anchors each glass obelisk.
      if (gradientIds.baseGlow) {
        glow.setAttribute('fill', `url(#${gradientIds.baseGlow})`);
      }
      const panel = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel',
        d: obeliskPath
      });
      if (gradientIds.panelFace) {
        panel.setAttribute('fill', `url(#${gradientIds.panelFace})`);
      }
      if (gradientIds.panelEdge) {
        panel.setAttribute('stroke', `url(#${gradientIds.panelEdge})`);
      }
      panel.setAttribute('stroke-linejoin', 'round');
      panel.setAttribute('stroke-linecap', 'round');
      const panelInner = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel-inner',
        d: facetPath
      });
      if (gradientIds.panelInner) {
        panelInner.setAttribute('fill', `url(#${gradientIds.panelInner})`);
      }
      panelInner.setAttribute('stroke', 'none');
      const panelHighlight = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel-highlight',
        d: highlightPath
      });
      if (gradientIds.panelHighlight) {
        panelHighlight.setAttribute('fill', `url(#${gradientIds.panelHighlight})`);
      }
      panelHighlight.setAttribute('stroke', 'none');
      const panelCaustic = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel-caustic',
        d: this._carouselCausticPath(geometry.itemWidth, geometry.itemHeight)
      });
      if (gradientIds.panelCaustic) {
        panelCaustic.setAttribute('fill', `url(#${gradientIds.panelCaustic})`);
      }
      panelCaustic.setAttribute('stroke', 'none');
      const panelSheen = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel-sheen',
        d: sparkPath
      });
      if (gradientIds.panelSheen) {
        panelSheen.setAttribute('fill', `url(#${gradientIds.panelSheen})`);
      }
      panelSheen.setAttribute('stroke', 'none');
      const panelSpark = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel-spark',
        d: sparkPath
      });
      if (gradientIds.panelSpark) {
        panelSpark.setAttribute('fill', `url(#${gradientIds.panelSpark})`);
      }
      panelSpark.setAttribute('stroke', 'none');
      const panelReflection = SvgUtil.createSVGElement('path', {
        class: 'mode-carousel-svg__panel-reflection',
        d: reflectionPath
      });
      if (gradientIds.panelHighlight) {
        panelReflection.setAttribute('fill', `url(#${gradientIds.panelHighlight})`);
      }
      panelReflection.setAttribute('stroke', 'none');
      const fallbackLabel = typeof option.label === 'string' && option.label.length
        ? option.label
        : this._formatCarouselAssetLabel(option.mode || '');
      const iconGroup = this._buildCarouselIconGroup(option, geometry, gradientIds);
      const visualHost = SvgUtil.createSVGElement('g', {
        class: 'mode-carousel-svg__visual'
      }); // TRIAL MERGE: container for either PNG artwork or SVG fallback glyphs.
      if (iconGroup) {
        iconGroup.classList.add('mode-carousel-svg__icon-fallback');
        visualHost.appendChild(iconGroup);
      }
      const labelText = SvgUtil.createSVGElement('text', {
        class: 'mode-carousel-svg__label',
        x: '0',
        y: String(geometry.itemHeight * 0.36),
        'text-anchor': 'middle'
      });
      labelText.textContent = fallbackLabel;
      labelText.setAttribute('data-default-label', fallbackLabel);

      const assetCandidates = this._carouselImageCandidates(option);
      if (assetCandidates && assetCandidates.length) {
        // TRIAL MERGE: reuse the facet insets so PNG art hugs the glass window.
        const facetMetrics = this._carouselFacetInsets(geometry.itemWidth, geometry.itemHeight);
        const clipId = SvgUtil.uniqueId('mode-carousel-asset-clip'); // TRIAL MERGE: clip PNG assets to the facet outline to erase any border.
        const clipPath = SvgUtil.createSVGElement('clipPath', {
          id: clipId,
          'clipPathUnits': 'userSpaceOnUse'
        });
        clipPath.appendChild(SvgUtil.createSVGElement('path', { d: facetPath }));
        visualHost.appendChild(clipPath);
        const baseImageWidth = Math.max(10, geometry.itemWidth - facetMetrics.insetX * 2);
        const baseImageHeight = Math.max(10, geometry.itemHeight - (facetMetrics.insetTop + facetMetrics.insetBottom));
        const assetScale = 1.3; // TRIAL MERGE: enlarge carousel PNGs by an additional 30% so they fully fill the glass opening.
        const imageWidth = Math.max(10, baseImageWidth * assetScale);
        const imageHeight = Math.max(10, baseImageHeight * assetScale);
        const imageX = -imageWidth / 2;
        const baseTop = -geometry.itemHeight / 2 + facetMetrics.insetTop;
        const baseCenterY = baseTop + baseImageHeight / 2;
        const imageY = baseCenterY - imageHeight / 2;
        const attemptAsset = (index) => {
          if (!assetCandidates[index]) {
            if (iconGroup) {
              iconGroup.style.display = '';
            }
            labelText.textContent = fallbackLabel;
            labelText.classList.remove('mode-carousel-svg__label--asset');
            return;
          }
          const candidate = assetCandidates[index];
          const image = SvgUtil.createSVGElement('image', {
            class: 'mode-carousel-svg__image',
            x: String(imageX),
            y: String(imageY),
            width: String(imageWidth),
            height: String(imageHeight),
            opacity: '0.7',
            'clip-path': `url(#${clipId})`,
            'preserveAspectRatio': 'xMidYMid slice'
          });
          try {
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', candidate.url);
          } catch (_) {
            // Ignore namespace errors when xlink is unavailable.
          }
          image.setAttribute('href', candidate.url);
          image.addEventListener('load', () => {
            if (iconGroup) {
              iconGroup.style.display = 'none';
            }
            labelText.textContent = this._formatCarouselAssetLabel(candidate.name);
            labelText.classList.add('mode-carousel-svg__label--asset');
          }, { once: true });
          image.addEventListener('error', () => {
            if (image.parentNode) {
              image.parentNode.removeChild(image);
            }
            if (iconGroup) {
              iconGroup.style.display = '';
            }
            labelText.textContent = fallbackLabel;
            labelText.classList.remove('mode-carousel-svg__label--asset');
            attemptAsset(index + 1);
          }, { once: true });
          visualHost.appendChild(image);
        };
        attemptAsset(0);
      }

      group.appendChild(shadow);
      group.appendChild(glow);
      group.appendChild(panel);
      group.appendChild(panelInner);
      group.appendChild(panelHighlight);
      group.appendChild(panelCaustic);
      group.appendChild(panelSheen);
      group.appendChild(panelSpark);
      group.appendChild(panelReflection);
      group.appendChild(visualHost);
      group.appendChild(labelText);

      const activate = (event, fromKey = false) => {
        event.stopPropagation();
        this._modeCarouselActiveIndex = index;
        this._updateCarouselClasses();
        this._resetCarouselTimer();
        this._commitCarouselSelection(fromKey ? 'item-key' : 'item', option, event);
      };
      group.addEventListener('click', (event) => activate(event, false));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(event, true);
        }
      });
      group.addEventListener('pointerdown', (event) => event.stopPropagation());

      track.appendChild(group);
      this._modeCarouselItems.push({
        element: group,
        mode: option.mode,
        type: option.type
      });
    });

    const manualActive = this._modeCarouselManualOverride && this._modeMenuContainer && this._modeMenuContainer.classList.contains('menu-open');
    if (!manualActive) {
      this._updateCarouselActiveFromState();
    } else if (this._modeCarouselItems.length) {
      const clampedIndex = Math.min(Math.max(this._modeCarouselActiveIndex, 0), this._modeCarouselItems.length - 1);
      this._modeCarouselActiveIndex = clampedIndex; // TRIAL MERGE: keep manual steering aligned with the rebuilt item list.
    }
    const fractional = manualActive && this._modeCarouselSwipeContext && Number.isFinite(this._modeCarouselSwipeContext.lastFractional)
      ? this._modeCarouselSwipeContext.lastFractional
      : 0; // TRIAL MERGE: preserve in-progress drag offsets when hass updates rebuild the carousel.
    this._updateCarouselClasses(fractional);
  }

  _updateCarouselActiveFromState() {
    if (!this._modeCarouselEnabled || !Array.isArray(this._modeCarouselItems) || !this._modeCarouselItems.length) {
      this._modeCarouselActiveIndex = 0;
      return;
    }
    const hvacMode = this.hvac_state;
    let nextIndex = this._modeCarouselItems.findIndex((item) => item.type === 'hvac' && item.mode === hvacMode);
    if (nextIndex === -1 && this.preset_mode) {
      const presetKey = this.preset_mode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const presetSpecific = this._modeCarouselItems.findIndex((item) => item.type === 'preset-mode'
        && typeof item.mode === 'string'
        && item.mode.toLowerCase().replace(/[^a-z0-9]+/g, '_') === presetKey);
      if (presetSpecific !== -1) {
        nextIndex = presetSpecific;
      } else {
        nextIndex = this._modeCarouselItems.findIndex((item) => item.type === 'preset');
      }
    }
    if (nextIndex === -1 && this.fan_mode) {
      const fanKey = this.fan_mode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      nextIndex = this._modeCarouselItems.findIndex((item) => item.type === 'fan-mode'
        && typeof item.mode === 'string'
        && item.mode.toLowerCase().replace(/[^a-z0-9]+/g, '_') === fanKey);
    }
    if (nextIndex === -1) {
      nextIndex = Math.min(Math.max(this._modeCarouselActiveIndex, 0), this._modeCarouselItems.length - 1);
    }
    this._modeCarouselActiveIndex = nextIndex;
  }

  _updateCarouselClasses(fractionalShift = 0) {
    if (!this._modeCarouselEnabled || !Array.isArray(this._modeCarouselItems) || !this._modeCarouselItems.length) {
      return;
    }
    const total = this._modeCarouselItems.length;
    const geometry = this._modeCarouselGeometry || this._computeCarouselGeometry(this._resolveDialRadius()); // TRIAL MERGE: keep carousel spacing stable even if the config radius is zero during updates.
    const spacing = geometry.spacing;
    const clampedShift = Number.isFinite(fractionalShift) ? Math.max(Math.min(fractionalShift, 0.5), -0.5) : 0;
    this._modeCarouselItems.forEach((item, index) => {
      const element = item.element;
      if (!element) {
        return;
      }
      element.classList.remove('mode-carousel-svg__item--active', 'mode-carousel-svg__item--prev', 'mode-carousel-svg__item--next', 'mode-carousel-svg__item--away');
      element.removeAttribute('aria-current');
      let offset = index - this._modeCarouselActiveIndex;
      if (offset > total / 2) {
        offset -= total;
      } else if (offset < -total / 2) {
        offset += total;
      }
      const renderOffset = offset + clampedShift; // TRIAL MERGE: allow fractional translations during swipe/drag gestures.
      element.dataset.offset = String(offset);
      const absOffset = Math.abs(offset);
      const absRenderOffset = Math.abs(renderOffset);
      const translateX = renderOffset * spacing;
      let scale;
      let opacity;
      if (absRenderOffset <= 1) {
        const eased = absRenderOffset; // TRIAL MERGE: interpolate between the centre (0) and adjacent card (1).
        scale = 1 - 0.5 * eased;
        opacity = 1 - 0.65 * eased;
      } else if (absRenderOffset <= 2) {
        const eased = absRenderOffset - 1; // TRIAL MERGE: continue easing toward the outer carousel positions.
        scale = 0.5 - 0.2 * eased;
        opacity = 0.35 - 0.2 * eased;
      } else {
        scale = 0.3;
        opacity = 0.15;
      }
      scale = Math.max(Math.min(scale, 1), 0.1); // TRIAL MERGE: avoid degenerate transforms from rounding noise.
      opacity = Math.max(Math.min(opacity, 1), 0);
      element.setAttribute('transform', `translate(${translateX}, 0) scale(${scale})`);
      element.style.opacity = opacity.toString();
      element.style.pointerEvents = absOffset <= 1 ? 'auto' : 'none';
      if (offset === 0) {
        element.classList.add('mode-carousel-svg__item--active');
        element.setAttribute('aria-current', 'true');
      } else if (offset === -1 || (total > 2 && offset === total - 1)) {
        element.classList.add('mode-carousel-svg__item--prev');
      } else if (offset === 1 || (total > 2 && offset === -(total - 1))) {
        element.classList.add('mode-carousel-svg__item--next');
      } else {
        element.classList.add('mode-carousel-svg__item--away');
      }
    });
  }

  _stepCarousel(direction) {
    if (!this._modeCarouselEnabled || !Array.isArray(this._modeCarouselItems) || !this._modeCarouselItems.length) {
      return;
    }
    this._modeCarouselManualOverride = true; // TRIAL MERGE: mark dial rotations as user-driven carousel steering.
    const total = this._modeCarouselItems.length;
    if (direction > 0) {
      this._modeCarouselActiveIndex = (this._modeCarouselActiveIndex + 1) % total;
    } else if (direction < 0) {
      this._modeCarouselActiveIndex = (this._modeCarouselActiveIndex - 1 + total) % total;
    }
    this._updateCarouselClasses();
    this._resetCarouselTimer();
  }

  _resetCarouselTimer() {
    if (!this._modeCarouselEnabled) {
      return;
    }
    this._clearCarouselTimer();
    if (!this._modeMenuContainer || !this._modeMenuContainer.classList.contains('menu-open')) {
      return;
    }
    if (!Number.isFinite(this._modeCarouselAutoCloseMs) || this._modeCarouselAutoCloseMs <= 0) {
      return;
    }
    this._modeCarouselTimer = setTimeout(() => {
      this._modeCarouselTimer = null;
      this._commitCarouselSelection('timeout');
    }, this._modeCarouselAutoCloseMs);
  }

  _clearCarouselTimer() {
    if (this._modeCarouselTimer) {
      clearTimeout(this._modeCarouselTimer);
      this._modeCarouselTimer = null;
    }
  }

  _toggleCarouselOpen(expanded) {
    if (!this._modeCarouselEnabled) {
      return;
    }
    const wrapper = this._ensureModeCarouselElements();
    if (!wrapper) {
      return;
    }
    if (expanded) {
      const renderModes = Array.isArray(this._modeCarouselPendingModes)
        ? this._modeCarouselPendingModes
        : (Array.isArray(this.hvac_modes) ? this.hvac_modes.slice() : []);
      const renderHass = this._modeCarouselPendingHass || this._lastHass;
      this._updateCarouselOptions(renderModes, renderHass);
      wrapper.classList.add('mode-carousel-svg--open');
      wrapper.setAttribute('aria-hidden', 'false');
      if (wrapper.style) {
        wrapper.style.pointerEvents = 'auto';
      }
      this._updateCarouselActiveFromState();
      this._updateCarouselClasses();
      this._resetCarouselTimer();
      this._attachCarouselDialControls();
    } else {
      wrapper.classList.remove('mode-carousel-svg--open');
      wrapper.setAttribute('aria-hidden', 'true');
      if (wrapper.style) {
        wrapper.style.pointerEvents = 'none';
      }
      this._clearCarouselTimer();
      this._detachCarouselDialControls();
      this._modeCarouselSwipeContext = null;
      this._destroyModeCarouselElements();
    }
    if (expanded && this._modeMenuContainer && this._modeMenuContainer.appendChild) {
      const toggleNode = this._modeMenuAnchor || this._modeMenuToggler;
      if (toggleNode) {
        this._modeMenuContainer.appendChild(toggleNode); // TRIAL MERGE: keep the toggle on top so it can close the carousel.
      }
      this._applyModeMenuTogglerTransform(); // TRIAL MERGE: immediately restore the toggle translation after reparenting.
    }
  }

  _attachCarouselDialControls() {
    if (!this._modeCarouselEnabled || this._modeCarouselDialHandlersAttached) {
      return;
    }
    const target = this._modeCarouselWrapper || this._root;
    if (!target) {
      return;
    }
    const pointerDown = (event) => {
      if (!this._modeMenuContainer || !this._modeMenuContainer.classList.contains('menu-open')) {
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      const angle = this._pointerNormalizedAngle(event);
      if (angle === null) {
        return;
      }
      const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
      this._modeCarouselManualOverride = true; // TRIAL MERGE: respect dial-driven navigation until a selection commits.
      this._modeCarouselDialContext = {
        pointerId,
        lastAngle: angle,
        accumulator: 0
      };
      if (event.pointerId !== undefined && typeof event.currentTarget.setPointerCapture === 'function') {
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
      }
      event.preventDefault();
      this._resetCarouselTimer();
    };
    const pointerMove = (event) => {
      const ctx = this._modeCarouselDialContext;
      const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
      if (!ctx || ctx.pointerId !== pointerId) {
        return;
      }
      const angle = this._pointerNormalizedAngle(event);
      if (angle === null) {
        return;
      }
      let delta = angle - ctx.lastAngle;
      if (delta > 180) {
        delta -= 360;
      } else if (delta < -180) {
        delta += 360;
      }
      ctx.accumulator += delta;
      ctx.lastAngle = angle;
      const threshold = 18;
      while (ctx.accumulator >= threshold) {
        this._stepCarousel(-1);
        ctx.accumulator -= threshold;
      }
      while (ctx.accumulator <= -threshold) {
        this._stepCarousel(1);
        ctx.accumulator += threshold;
      }
    };
    const pointerUp = (event) => {
      const ctx = this._modeCarouselDialContext;
      const pointerId = event.pointerId !== undefined ? event.pointerId : 'mouse';
      if (ctx && ctx.pointerId === pointerId) {
        this._modeCarouselDialContext = null;
        if (event.pointerId !== undefined && typeof event.currentTarget.releasePointerCapture === 'function') {
          try { event.currentTarget.releasePointerCapture(event.pointerId); } catch (_) { /* ignore */ }
        }
      }
    };
    target.addEventListener('pointerdown', pointerDown, { passive: false });
    target.addEventListener('pointermove', pointerMove);
    target.addEventListener('pointerup', pointerUp);
    target.addEventListener('pointercancel', pointerUp);
    target.addEventListener('lostpointercapture', pointerUp);
    this._modeCarouselDialHandlersAttached = true;
    this._modeCarouselDialHandlers = { pointerDown, pointerMove, pointerUp, target };
  }

  _detachCarouselDialControls() {
    if (!this._modeCarouselDialHandlersAttached || !this._modeCarouselDialHandlers) {
      this._modeCarouselDialContext = null;
      return;
    }
    const { pointerDown, pointerMove, pointerUp, target } = this._modeCarouselDialHandlers;
    if (target) {
      target.removeEventListener('pointerdown', pointerDown);
      target.removeEventListener('pointermove', pointerMove);
      target.removeEventListener('pointerup', pointerUp);
      target.removeEventListener('pointercancel', pointerUp);
      target.removeEventListener('lostpointercapture', pointerUp);
    }
    this._modeCarouselDialHandlersAttached = false;
    this._modeCarouselDialHandlers = null;
    this._modeCarouselDialContext = null;
  }

  _commitCarouselSelection(source, option, triggerEvent) { // eslint-disable-line no-unused-vars
    if (!this._modeCarouselEnabled) {
      return;
    }
    this._clearCarouselTimer();
    this._modeCarouselManualOverride = false; // TRIAL MERGE: hand control back to hass once a selection has been made.
    if (!option) {
      if (!Array.isArray(this._modeCarouselItems) || !this._modeCarouselItems.length) {
        this._setModeMenuOpen(false);
        return;
      }
      option = this._modeCarouselItems[this._modeCarouselActiveIndex] || null;
    }
    if (!option) {
      this._setModeMenuOpen(false);
      return;
    }
    if (option.type === 'preset') {
      this._handlePresetSelection(triggerEvent);
      this._setModeMenuOpen(false);
      return;
    }
    if (option.type === 'preset-mode') {
      this._setPresetMode(triggerEvent, option.mode, this._lastHass);
      return;
    }
    if (option.type === 'fan-mode') {
      this._setFanMode(triggerEvent, option.mode, this._lastHass);
      return;
    }
    const hass = this._lastHass;
    if (hass) {
      const event = triggerEvent || { stopPropagation() {} };
      if (typeof event.stopPropagation !== 'function') {
        event.stopPropagation = () => {};
      }
      this._setMode(event, option.mode, hass);
    } else {
      this._setModeMenuOpen(false);
    }
  }

  _handlePresetSelection(triggerEvent) {
    if (triggerEvent && typeof triggerEvent.stopPropagation === 'function') {
      triggerEvent.stopPropagation();
    }
    if (typeof this._config.propWin === 'function' && this.entity && this.entity.entity_id) {
      try {
        this._config.propWin(this.entity.entity_id);
      } catch (_) { /* ignore */ }
    }
  }
  _buildCore(diameter) {

    const root = SvgUtil.createSVGElement('svg', {
      width: '100%',
      height: '100%',
      viewBox: '0 0 ' + diameter + ' ' + diameter,
      class: 'dial' // CSS class that applies shadows, colors, and animations to the whole dial.
    });
    const defs = SvgUtil.createSVGElement('defs', {});

    const metalGradient = SvgUtil.createSVGElement('radialGradient', {
      id: this._metalGradientId,
      cx: '50%',
      cy: '47%',
      r: '68%',
      fx: '38%',
      fy: '34%'
    });
    [
      ['0%', '#ffffff', '1'],
      ['30%', '#f5f7fa', '1'],
      ['55%', '#dfe5ea', '1'],
      ['75%', '#b9c1c9', '1'],
      ['90%', '#80878f', '1'],
      ['100%', '#5b6067', '1']
    ].forEach(([offset, color, opacity]) => {
      metalGradient.appendChild(SvgUtil.createSVGElement('stop', {
        offset,
        'stop-color': color,
        'stop-opacity': opacity
      }));
    });

    const metalSheen = SvgUtil.createSVGElement('linearGradient', {
      id: this._metalSheenId,
      x1: '0%',
      y1: '0%',
      x2: '0%',
      y2: '100%'
    });
    [
      ['0%', '#ffffff', '0.85'],
      ['35%', '#f3f4f7', '0.4'],
      ['65%', '#b6bbc3', '0.15'],
      ['100%', '#6b7078', '0.55']
    ].forEach(([offset, color, opacity]) => {
      metalSheen.appendChild(SvgUtil.createSVGElement('stop', {
        offset,
        'stop-color': color,
        'stop-opacity': opacity
      }));
    });

    const metalShadow = SvgUtil.createSVGElement('filter', {
      id: this._metalShadowId,
      x: '-20%',
      y: '-20%',
      width: '140%',
      height: '140%',
      'color-interpolation-filters': 'sRGB'
    });

    const outerBlur = SvgUtil.createSVGElement('feGaussianBlur', {
      in: 'SourceAlpha',
      stdDeviation: '3',
      result: 'outer-blur'
    });
    const outerOffset = SvgUtil.createSVGElement('feOffset', {
      in: 'outer-blur',
      dx: '0',
      dy: '4',
      result: 'outer-offset'
    });
    const outerFlood = SvgUtil.createSVGElement('feFlood', {
      'flood-color': '#000000',
      'flood-opacity': '0.35',
      result: 'outer-flood'
    });
    const outerShadow = SvgUtil.createSVGElement('feComposite', {
      in: 'outer-flood',
      in2: 'outer-offset',
      operator: 'in',
      result: 'outer-shadow'
    });

    const highlightBlur = SvgUtil.createSVGElement('feGaussianBlur', {
      in: 'SourceAlpha',
      stdDeviation: '1.2',
      result: 'highlight-blur'
    });
    const highlightOffset = SvgUtil.createSVGElement('feOffset', {
      in: 'highlight-blur',
      dx: '0',
      dy: '-1',
      result: 'highlight-offset'
    });
    const highlightFlood = SvgUtil.createSVGElement('feFlood', {
      'flood-color': '#ffffff',
      'flood-opacity': '0.55',
      result: 'highlight-flood'
    });
    const edgeHighlight = SvgUtil.createSVGElement('feComposite', {
      in: 'highlight-flood',
      in2: 'highlight-offset',
      operator: 'in',
      result: 'edge-highlight'
    });

    const innerBlur = SvgUtil.createSVGElement('feGaussianBlur', {
      in: 'SourceAlpha',
      stdDeviation: '1.4',
      result: 'inner-blur'
    });
    const innerOffset = SvgUtil.createSVGElement('feOffset', {
      in: 'inner-blur',
      dx: '0',
      dy: '0.75',
      result: 'inner-offset'
    });
    const innerComposite = SvgUtil.createSVGElement('feComposite', {
      in: 'SourceAlpha',
      in2: 'inner-offset',
      operator: 'arithmetic',
      k2: '-1',
      k3: '1',
      result: 'inner-cutout'
    });
    const innerFlood = SvgUtil.createSVGElement('feFlood', {
      'flood-color': '#000000',
      'flood-opacity': '0.45',
      result: 'inner-flood'
    });
    const innerShadow = SvgUtil.createSVGElement('feComposite', {
      in: 'inner-flood',
      in2: 'inner-cutout',
      operator: 'in',
      result: 'inner-shadow'
    });

    const shadowMerge = SvgUtil.createSVGElement('feMerge', {});
    ['outer-shadow', 'edge-highlight', 'inner-shadow', 'SourceGraphic'].forEach((input) => {
      shadowMerge.appendChild(SvgUtil.createSVGElement('feMergeNode', {
        in: input
      }));
    });

    [
      outerBlur,
      outerOffset,
      outerFlood,
      outerShadow,
      highlightBlur,
      highlightOffset,
      highlightFlood,
      edgeHighlight,
      innerBlur,
      innerOffset,
      innerComposite,
      innerFlood,
      innerShadow,
      shadowMerge
    ].forEach((node) => metalShadow.appendChild(node));

    // Dark face gradient
    const faceDark = SvgUtil.createSVGElement('radialGradient', {
      id: this._faceDarkId,
      cx: '50%', cy: '46%', r: '68%', fx: '50%', fy: '50%'
    });
    [
      ['0%', '#0e1724', '1'],
      ['40%', '#0a1420', '1'],
      ['70%', '#090d14', '1'],
      ['100%', '#05070b', '1']
    ].forEach(([offset, color, opacity]) => {
      faceDark.appendChild(SvgUtil.createSVGElement('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }));
    });

    // Specular stroke gradient across the rim (top-left to bottom-right)
    const rimSpec = SvgUtil.createSVGElement('linearGradient', {
      id: this._rimSpecId,
      gradientUnits: 'userSpaceOnUse',
      x1: '0', y1: '0', x2: String(diameter), y2: String(diameter)
    });
    [
      ['0%', '#ffffff', '0.85'],
      ['15%', '#ffffff', '0.6'],
      ['40%', '#f5f5f5', '0.18'],
      ['65%', '#eaeaea', '0.08'],
      ['100%', '#ffffff', '0']
    ].forEach(([offset, color, opacity]) => {
      rimSpec.appendChild(SvgUtil.createSVGElement('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }));
    });

    // Inner bevel gradient (vertical)
    const innerBevel = SvgUtil.createSVGElement('linearGradient', {
      id: this._innerBevelId,
      gradientUnits: 'userSpaceOnUse',
      x1: '0', y1: '0', x2: '0', y2: String(diameter)
    });
    [
      ['0%', 'rgba(255,255,255,0.6)'],
      ['35%', 'rgba(200,205,215,0.15)'],
      ['100%', 'rgba(0,0,0,0.55)']
    ].forEach(([offset, color]) => {
      innerBevel.appendChild(SvgUtil.createSVGElement('stop', { offset, 'stop-color': color }));
    });

    // Inner specular gradient (reverse diagonal)
    const rimSpecInner = SvgUtil.createSVGElement('linearGradient', {
      id: this._rimSpecInnerId,
      gradientUnits: 'userSpaceOnUse',
      x1: String(diameter), y1: '0', x2: '0', y2: String(diameter)
    });
    [
      ['0%', '#ffffff', '0.7'],
      ['25%', '#f2f2f2', '0.15'],
      ['60%', '#dddddd', '0.05'],
      ['100%', '#ffffff', '0']
    ].forEach(([offset, color, opacity]) => {
      rimSpecInner.appendChild(SvgUtil.createSVGElement('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }));
    });

    // Brushed metal overlay filter
    const metalBrush = SvgUtil.createSVGElement('filter', {
      id: this._metalBrushId,
      x: '-30%', y: '-30%', width: '160%', height: '160%'
    });
    const turb = SvgUtil.createSVGElement('feTurbulence', {
      type: 'fractalNoise', baseFrequency: '0.8 0.03', numOctaves: '2', seed: '7', result: 'noise'
    });
    const blur = SvgUtil.createSVGElement('feGaussianBlur', { in: 'noise', stdDeviation: '0.4', result: 'noiseBlur' });
    const comp = SvgUtil.createSVGElement('feComposite', { in: 'noiseBlur', in2: 'SourceAlpha', operator: 'in', result: 'masked' });
    metalBrush.appendChild(turb);
    metalBrush.appendChild(blur);
    metalBrush.appendChild(comp);

    defs.appendChild(metalGradient);
    defs.appendChild(metalSheen);
    defs.appendChild(metalShadow);
    defs.appendChild(faceDark);
    defs.appendChild(rimSpec);
    defs.appendChild(rimSpecInner);
    defs.appendChild(innerBevel);
    defs.appendChild(metalBrush);
    root.appendChild(defs);

    return root;
  }

  _iconForMode(mode, fallback = 'help') {
    switch (mode) {
      case 'dry':
        return 'water-percent';
      case 'fan_only':
        return 'fan';
      case 'cool':
        return 'snowflake';
      case 'heat':
        return 'fire';
      case 'auto':
        return 'atom';
      case 'heat_cool':
        return 'sync';
      case 'off':
        return 'power';
      default:
        return fallback;
    }
  }

  // TRIAL MERGE: map HVAC modes to emoji glyphs for the SVG carousel.
  _emojiForCarousel(option) {
    const mode = option && option.mode;
    const type = option && option.type;
    if (type === 'preset') {
      return '🎛️';
    }
    switch (mode) {
      case 'heat':
        return '🔥';
      case 'cool':
        return '❄️';
      case 'auto':
        return '♻️';
      case 'heat_cool':
        return '🔄';
      case 'fan_only':
        return '🌀';
      case 'dry':
        return '💧';
      case 'off':
        return '⏻';
      default:
        return '⚙️';
    }
  }

  openProp() {
    this._config.propWin(this.entity.entity_id)
  }
  _setPresetMode(event, mode, hass) { // TRIAL MERGE: helper to call Home Assistant's preset service from the carousel.
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    const preset = typeof mode === 'string' && mode.length ? mode : '';
    const entityId = this._config && this._config.entity;
    if (!preset || !hass || !entityId || typeof hass.callService !== 'function') {
      this._setModeMenuOpen(false);
      return;
    }
    try {
      hass.callService('climate', 'set_preset_mode', {
        entity_id: entityId,
        preset_mode: preset,
      });
    } catch (_) { /* ignore */ }
    this.preset_mode = preset;
    this._updateColor(this.hvac_state, this.preset_mode);
    this._updateCarouselActiveFromState();
    this._updateCarouselClasses();
    this._setModeMenuOpen(false);
  }
  _setFanMode(event, mode, hass) { // TRIAL MERGE: helper to change the fan mode directly from the carousel options.
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    const fanMode = typeof mode === 'string' && mode.length ? mode : '';
    const entityId = this._config && this._config.entity;
    if (!fanMode || !hass || !entityId || typeof hass.callService !== 'function') {
      this._setModeMenuOpen(false);
      return;
    }
    try {
      hass.callService('climate', 'set_fan_mode', {
        entity_id: entityId,
        fan_mode: fanMode,
      });
    } catch (_) { /* ignore */ }
    this.fan_mode = fanMode;
    this._updateCarouselActiveFromState();
    this._updateCarouselClasses();
    this._setModeMenuOpen(false);
  }
  _setMode(e, mode, hass) {
    let config = this._config;
    if (this._timeoutHandlerMode) clearTimeout(this._timeoutHandlerMode);
    hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.entity,
      hvac_mode: mode,
    });
    this._setActiveMode(mode);
    this._updateColor(mode, this.preset_mode);
    this._setModeMenuOpen(false); // Close immediately after selection
    e.stopPropagation();
  }
  _buildDialog() {
    const rawRadius = Number(this._config && this._config.radius);
    const radius = Number.isFinite(rawRadius) && rawRadius > 0 ? rawRadius : this._resolveDialRadius(); // TRIAL MERGE: reuse live dial metrics when the stored radius comes back as zero.
    if (!Number.isFinite(radius) || radius <= 0 || !this._root) {
      return null;
    }

    if (!this._modeMenuContainer) {
      if (this._modeCarouselEnabled) {
        // TRIAL MERGE: mount the carousel toggle within the glass layer so it follows SVG stacking.
        const { container, anchor, toggler, toggleBody, circle, inner, geometry, wrapper, track, halo } = this._buildModeToggleCarousel(radius);
        this._modeMenuContainer = container;
        this._modeMenuAnchor = anchor;
        this._modeMenuToggler = toggler;
        this._modeMenuToggleBody = toggleBody;
        this._modeMenuCircle = circle;
        this._modeMenuInner = inner;
        this._modeMenuList = null;
        this._modeMenuItems = [];
        this._modeMenuGeometry = geometry;
        this._modeCarouselWrapper = wrapper;
        this._modeCarouselTrack = track;
        this._modeCarouselHalo = halo;
        if (this._modeCarouselWrapper && this._modeCarouselWrapper.style) {
          this._modeCarouselWrapper.style.pointerEvents = 'none';
        }
        const glassParent = this._glassGroup && this._glassGroup.parentNode;
        if (glassParent) {
          glassParent.insertBefore(container, this._glassGroup.nextSibling); // TRIAL MERGE: keep the toggle in the SVG stack without inheriting the glass layer's pointer-events.
        } else if (this._root) {
          this._root.appendChild(container);
        }
        this._applyModeMenuTogglerTransform(); // TRIAL MERGE: immediately align the toggler within the dial after mounting.
      } else {
        const { container, toggler, toggleBody, circle, inner, list, geometry } = this._buildModeButton(radius);
        this._modeMenuContainer = container;
        this._modeMenuAnchor = null;
        this._modeMenuToggler = toggler;
        this._modeMenuToggleBody = toggleBody;
        this._modeMenuCircle = circle;
        this._modeMenuInner = inner;
        this._modeMenuList = list;
        this._modeMenuItems = [];
        this._modeMenuGeometry = geometry;
        this._root.appendChild(container);
        this._applyModeMenuTogglerTransform(); // TRIAL MERGE: keep the legacy menu button centered using the shared helper.
      }
    } else {
      this._modeMenuGeometry = this._computeModeMenuGeometry(radius);
      if (this._modeCarouselEnabled) {
        this._applyModeMenuTogglerTransform(); // TRIAL MERGE: ensure the toggle translation survives carousel rebuilds.
        const geometry = this._computeCarouselGeometry(radius);
        this._modeCarouselGeometry = geometry;
        if (this._modeCarouselWrapper) {
          this._modeCarouselWrapper.setAttribute('transform', `translate(${geometry.dialRadius}, ${geometry.dialRadius})`);
        }
        if (this._modeCarouselHalo) {
          this._modeCarouselHalo.setAttribute('r', Math.max(geometry.dialRadius * 0.58, geometry.itemWidth * 0.8));
        }
      } else {
        this._applyModeMenuTogglerTransform(); // TRIAL MERGE: reuse the same centering logic when the legacy ring menu is active.
        if (this._modeMenuCircle) {
          this._modeMenuCircle.setAttribute('r', this._modeMenuGeometry.buttonRadius);
        }
        if (this._modeMenuInner) {
          this._modeMenuInner.setAttribute('r', Math.max(4, this._modeMenuGeometry.buttonRadius - 4));
        }
      }
    }

    if (this._modeCarouselEnabled) {
      this._setModeMenuOpen(false);
      return this._modeMenuContainer;
    }

    if (this._modeMenuList) {
      this._modeMenuList.setAttribute('aria-hidden', 'true');
    }
    this._setModeMenuOpen(false);
    return this._modeMenuContainer;
  }
  // build overlays
  _buildGlassOverlays(radius) {
    const group = SvgUtil.createSVGElement('g', { class: 'dial__glass' });
    const defs = this._root ? this._root.querySelector('defs') : null;
    if (defs && !this._faceVignetteId) {
      this._faceVignetteId = SvgUtil.uniqueId('dial__face-vignette');
      const vignette = SvgUtil.createSVGElement('radialGradient', {
        id: this._faceVignetteId,
        cx: '50%', cy: '50%', r: '60%'
      });
      [
        ['0%', '#000000', '0'],
        ['60%', '#000000', '0'],
        ['85%', '#000000', '0.45'],
        ['100%', '#000000', '0.65']
      ].forEach(([offset, color, opacity]) => {
        vignette.appendChild(SvgUtil.createSVGElement('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }));
      });
      defs.appendChild(vignette);
    }
    const vignetteCircle = SvgUtil.createSVGElement('circle', {
      cx: radius,
      cy: radius,
      r: radius * 0.98,
      class: 'face__vignette',
      fill: this._faceVignetteId ? `url(#${this._faceVignetteId})` : 'rgba(0,0,0,0.35)'
    });
    group.appendChild(vignetteCircle);
    // Smaller diagonal reflections (top-left and bottom-right)
    const diagTL = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutArcPath(radius, radius, radius * 0.99, radius * 0.93, 140, 175),
      class: 'glass__diag glass__diag--tl'
    });
    group.appendChild(diagTL);
    const diagBR = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutArcPath(radius, radius, radius * 0.99, radius * 0.93, 25, 55),
      class: 'glass__diag glass__diag--br'
    });
    group.appendChild(diagBR);
    const bottomGlow = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutArcPath(radius, radius, radius * 0.985, radius * 0.90, 258, 282),
      class: 'glass__bottom'
    });
    group.appendChild(bottomGlow);
    group.setAttribute('pointer-events','none');
    return group;
  }
  _buildWeatherFX(radius, mode = 'storm') {
    const fxGroup = SvgUtil.createSVGElement('g', { class: 'weather__fx' });
    fxGroup.setAttribute('pointer-events','none');
    if (mode === 'storm' || mode === 'rain') {
      const rainGroup = SvgUtil.createSVGElement('g', { class: 'weather__rain' });
      const drops = 28;
      for (let i = 0; i < drops; i++) {
        const angle = Math.random() * 360;
        const aRad = angle * Math.PI / 180;
        const r = radius * (0.2 + Math.random() * 0.7);
        const cx = radius + Math.cos(aRad) * r;
        const cy = radius + Math.sin(aRad) * r * 0.9;
        const len = 10 + Math.random() * 24;
        const line = SvgUtil.createSVGElement('line', {
          x1: cx, y1: cy - len/2, x2: cx, y2: cy + len/2,
          class: 'rain-drop'
        });
        line.style.animationDelay = `${(Math.random()*1.5).toFixed(2)}s`;
        line.style.animationDuration = `${(1.6 + Math.random()*0.8).toFixed(2)}s`;
        rainGroup.appendChild(line);
      }
      fxGroup.appendChild(rainGroup);
    }
    if (mode === 'storm') {
      const boltGroup = SvgUtil.createSVGElement('g', { class: 'weather__lightning' });
      // Simple zigzag bolt near right side
      const x = radius * 1.18;
      const y = radius * 0.9;
      const path = `M ${x} ${y} L ${x-18} ${y+28} L ${x+4} ${y+28} L ${x-22} ${y+70}`;
      const bolt = SvgUtil.createSVGElement('path', { d: path, class: 'lightning-bolt' });
      boltGroup.appendChild(bolt);
      fxGroup.appendChild(boltGroup);
    }
    return fxGroup;
  }
  _buildOuterShadow(radius) {
    const shadow = SvgUtil.createSVGElement('ellipse', {
      cx: radius + radius * 0.04,
      cy: radius + radius * 0.18,
      rx: radius * 0.98,
      ry: radius * 0.88,
      class: 'outer__shadow'
    });
    shadow.setAttribute('pointer-events','none');
    return shadow;
  }
  // build black dial
  _buildDial(radius) {
    return SvgUtil.createSVGElement('circle', {
      cx: radius,
      cy: radius,
      r: radius,
      class: 'dial__shape'
    })
  }
  // build circle around
  _buildRing(radius) {
    const config = this._config;
    const ringGroup = SvgUtil.createSVGElement('g', { class: 'dial__ring' });
    const ringStatic = SvgUtil.createSVGElement('g', { class: 'dial__ring-static' });
    const ringSpin = SvgUtil.createSVGElement('g', { class: 'dial__ring-spin' });

    const outerRadius = radius - 1.5;
    const minimumThickness = Math.max(radius * 0.22, 24);
    const tickClearance = radius - config.ticks_outer_radius + 2;
    const ringInnerRadius = Math.max(outerRadius - minimumThickness, tickClearance);
    const ringThickness = outerRadius - ringInnerRadius;

    this._ringMetrics = {
      outerRadius,
      innerRadius: ringInnerRadius,
      thickness: ringThickness
    };

    const ringSurface = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, outerRadius, ringInnerRadius), // Draw a donut-shaped path representing the metal ring.
      class: 'dial__metal-ring'
    });
    ringSurface.setAttribute('fill', `url(#${this._metalGradientId})`);
    ringSurface.setAttribute('stroke', `url(#${this._metalSheenId})`);
    ringSurface.setAttribute('stroke-width', '1.4');
    ringSurface.style.setProperty('--dial-metal-ring-fill', `url(#${this._metalGradientId})`);
    ringSurface.style.setProperty('--dial-metal-ring-stroke', `url(#${this._metalSheenId})`);
    ringSurface.style.setProperty('--dial-metal-ring-filter', `url(#${this._metalShadowId}) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.35)) drop-shadow(0 -1px 1px rgba(255, 255, 255, 0.45))`);
    ringSurface.style.setProperty('--dial-metal-ring-filter-active', `url(#${this._metalShadowId}) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45)) drop-shadow(0 -1px 1.5px rgba(255, 255, 255, 0.55))`);

    const sheenOuter = outerRadius - ringThickness * 0.12;
    const sheenInner = ringInnerRadius + ringThickness * 0.55;
    const sheen = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, sheenOuter, sheenInner), // Slightly smaller donut used to simulate a reflective highlight.
      class: 'dial__metal-ring-sheen'
    });

    const shadowOuter = outerRadius - ringThickness * 0.02;
    const shadowInner = ringInnerRadius + ringThickness * 0.15;
    const shadow = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, shadowOuter, shadowInner), // Shadow overlay that darkens the lower portion of the ring.
      class: 'dial__metal-ring-shadow'
    });

    const gripGroup = SvgUtil.createSVGElement('g', { class: 'dial__ring-grips' });
    // True radial grooves: thin rectangles radiating from inner to outer edge around full 360°
    const gripCount = 120;
    const angleStep = 360 / gripCount;
    const gripLength = (outerRadius - ringInnerRadius) * 0.72; // span most of rim
    const gripInset = ringInnerRadius + (outerRadius - ringInnerRadius - gripLength) / 2; // center within rim
    const gripWidth = ringThickness * 0.10; // 10% of rim thickness
    for (let i = 0; i < gripCount; i++) {
      const angle = angleStep * i;
      const gripPoints = [
        [radius - gripWidth / 2, radius - (gripInset + gripLength)],
        [radius + gripWidth / 2, radius - (gripInset + gripLength)],
        [radius + gripWidth / 2, radius - gripInset],
        [radius - gripWidth / 2, radius - gripInset]
      ];
      const pathD = SvgUtil.pointsToPath(SvgUtil.rotatePoints(gripPoints, angle, [radius, radius]));
      const seg = SvgUtil.createSVGElement('path', {
        d: pathD,
        class: 'dial__ring-grip',
        fill: 'rgba(255,255,255,0.26)',
        stroke: 'rgba(0,0,0,0.12)'
      });
      seg.style.mixBlendMode = 'screen';
      gripGroup.appendChild(seg);
    }

    // Rotating reflection band that moves with ring rotation (subtle)
    const reflOuter = outerRadius - ringThickness * 0.05;
    const reflInner = ringInnerRadius + ringThickness * 0.25;
    const reflectionBand = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutArcPath(radius, radius, reflOuter, reflInner, -20, 20),
      class: 'dial__ring-reflection'
    });

    const highlightThickness = ringThickness * 0.45;
    const highlightOuterInset = Math.min(3.5, highlightThickness);
    const highlightInnerInset = Math.min(4.5, highlightThickness + ringThickness * 0.1);
    let highlightOuter = outerRadius - highlightOuterInset;
    let highlightInner = ringInnerRadius + highlightInnerInset;
    if (highlightInner >= highlightOuter) {
      const mid = (outerRadius + ringInnerRadius) / 2;
      const highlightHalfWidth = Math.max(0.8, ringThickness / 6);
      highlightInner = mid - highlightHalfWidth;
      highlightOuter = mid + highlightHalfWidth;
      if (highlightInner >= highlightOuter) {
        highlightInner = mid - 0.75;
        highlightOuter = mid + 0.75;
      }
    }
    const highlight = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, highlightOuter, highlightInner), // Thin glowing band that appears when the dial is being edited.
      class: 'dial__editableIndicator'
    });

    // Specular rim lines and bevels
    // Specular rim stroke just inside the outer edge
    const rimSpecular = SvgUtil.createSVGElement('path', {
      d: SvgUtil.circleToPath(radius, radius, outerRadius - 0.8),
      class: 'dial__rim-spec'
    });
    rimSpecular.setAttribute('fill','none');
    rimSpecular.setAttribute('stroke', `url(#${this._rimSpecId})`);
    rimSpecular.setAttribute('stroke-width','1.2');
    rimSpecular.setAttribute('stroke-linecap','round');

    // Inner bevel ring to darken inner edge and add depth
    const innerBevel = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, ringInnerRadius + 2.8, ringInnerRadius + 0.6),
      class: 'dial__inner-bevel'
    });
    innerBevel.setAttribute('fill', `url(#${this._innerBevelId})`);

    // Inner specular stroke near inner edge
    const rimInnerSpec = SvgUtil.createSVGElement('path', {
      d: SvgUtil.circleToPath(radius, radius, ringInnerRadius + 1.2),
      class: 'dial__rim-spec dial__rim-spec--inner'
    });
    rimInnerSpec.setAttribute('fill','none');
    rimInnerSpec.setAttribute('stroke', `url(#${this._rimSpecInnerId})`);
    rimInnerSpec.setAttribute('stroke-width','0.9');
    rimInnerSpec.setAttribute('stroke-linecap','round');

    // Brushed overlay using noise filter
    const brushOverlay = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, outerRadius, ringInnerRadius),
      class: 'dial__metal-brush'
    });
    brushOverlay.setAttribute('filter', `url(#${this._metalBrushId})`);

    ringStatic.appendChild(ringSurface);
    ringStatic.appendChild(shadow);
    ringStatic.appendChild(sheen);
    ringStatic.appendChild(rimSpecular);
    ringStatic.appendChild(innerBevel);
    ringStatic.appendChild(rimInnerSpec);
    ringStatic.appendChild(brushOverlay);
    ringSpin.appendChild(gripGroup);
    ringSpin.appendChild(reflectionBand);
    ringSpin.appendChild(highlight);
    ringGroup.appendChild(ringStatic);
    ringGroup.appendChild(ringSpin);
    this._ringStaticGroup = ringStatic;
    this._ringSpinGroup = ringSpin;
    return ringGroup;
  }

  _buildTicks(num_ticks) {
    const tick_element = SvgUtil.createSVGElement('g', {
      class: 'dial__ticks' // Group that will store every tick mark path.
    });
    for (let i = 0; i < num_ticks; i++) {
      const tick = SvgUtil.createSVGElement('path', {}) // Create an empty SVG path; _updateTicks will fill in the geometry later.
      this._ticks.push(tick); // Save the reference for quick updates without rebuilding the DOM.
      tick_element.appendChild(tick); // Attach the path to the group immediately so it renders once updated.
    }
    return tick_element;
  }

  _buildChevrons(radius, rotation, id, scale, offset) {
    const config = this._config;
    const translation = rotation > 0 ? -1 : 1;
    const width = config.chevron_size;
    const chevron_def = ["M", 0, 0, "L", width / 2, width * 0.3, "L", width, 0].map((x) => isNaN(x) ? x : x * scale).join(' '); // Define a triangular arrow path scaled to the desired size.
    const translate = [radius - width / 2 * scale * translation + offset, radius + 70 * scale * 1.1 * translation]; // Compute where to position the chevron relative to the dial.
    const chevron = SvgUtil.createSVGElement('path', {
      class: `dial__chevron dial__chevron--${id}`,
      d: chevron_def,
      transform: `translate(${translate[0]},${translate[1]}) rotate(${rotation})`
    });
    return chevron;
  }

  _buildThermoIcon(radius) {
    const thermoScale = radius / 3 / 100;
    const thermoDef = 'M 37.999 38.261 V 7 c 0 -3.859 -3.141 -7 -7 -7 s -7 3.141 -7 7 v 31.261 c -3.545 2.547 -5.421 6.769 -4.919 11.151 c 0.629 5.482 5.066 9.903 10.551 10.512 c 0.447 0.05 0.895 0.074 1.339 0.074 c 2.956 0 5.824 -1.08 8.03 -3.055 c 2.542 -2.275 3.999 -5.535 3.999 -8.943 C 42.999 44.118 41.14 40.518 37.999 38.261 Z M 37.666 55.453 c -2.146 1.921 -4.929 2.8 -7.814 2.482 c -4.566 -0.506 -8.261 -4.187 -8.785 -8.752 c -0.436 -3.808 1.28 -7.471 4.479 -9.56 l 0.453 -0.296 V 38 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 h -1 v -3 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 h -1 v -3 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 h -1 v -3 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 h -1 v -3 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 h -1 v -3 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 h -1 V 8 h 1 c 0.553 0 1 -0.447 1 -1 s -0.447 -1 -1 -1 H 26.1 c 0.465 -2.279 2.484 -4 4.899 -4 c 2.757 0 5 2.243 5 5 v 1 h -1 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 1 v 3 h -1 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 1 v 3 h -1 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 1 v 3 h -1 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 1 v 3 h -1 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 1 v 3 h -1 c -0.553 0 -1 0.447 -1 1 s 0.447 1 1 1 h 1 v 4.329 l 0.453 0.296 c 2.848 1.857 4.547 4.988 4.547 8.375 C 40.999 50.841 39.784 53.557 37.666 55.453 Z'.split(' ').map((x) => isNaN(x) ? x : x * thermoScale).join(' ');
    const translate = [radius - (thermoScale * 100 * 0.3), radius * 1.65] // Offset the thermometer icon so it rests near the lower center of the dial.
    return SvgUtil.createSVGElement('path', {
      class: 'dial__ico__thermo',
      d: thermoDef,
      transform: 'translate(' + translate[0] + ',' + translate[1] + ')'
    });
  }

  _buildDialSlot(index) {
    return SvgUtil.createSVGElement('text', {
      class: 'dial__lbl dial__lbl--ring',
      id: `temperature_slot_${index}`
    })
  }

  _buildText(radius, name, offset) {
    const target = SvgUtil.createSVGElement('text', {
      x: radius + offset,
      y: radius - (name == 'title' ? radius / 2 : 0),
      class: `dial__lbl dial__lbl--${name}`,
      id: name
    }); // Create the wrapper text node anchored relative to the dial center.
    const text = SvgUtil.createSVGElement('tspan', {
    }); // First span holds the main number or label.
    // hack
    if (name == 'target' || name == 'ambient') offset += 20;
    const superscript = SvgUtil.createSVGElement('tspan', {
      x: radius + radius / 3.1 + offset,
      y: radius - radius / 6,
      class: `dial__lbl--super--${name}`
    }); // Second span holds the fractional digit so it can be positioned like a superscript.
    target.appendChild(text);
    target.appendChild(superscript);
    return target;
  }

  _buildControls(radius) {
    // TRIAL MERGE: reshape the tap zones into a donut so the central mode toggle no longer sits beneath an active hit target.
    const geometry = this._computeModeMenuGeometry(radius);
    const dialCenter = geometry.radius;
    const startOffset = Math.abs(geometry.centerY - dialCenter);
    const toggleClearance = geometry.buttonRadius + Math.max(geometry.buttonRadius * 0.15, 12);
    const radialClearance = Math.min(radius - Math.max(radius * 0.05, 12), Math.max(radius * 0.45, startOffset + toggleClearance));
    let startAngle = 270;
    const segments = 4;
    for (let index = 0; index < segments; index++) {
      const endAngle = startAngle + (360 / segments);
      const controlsDef = SvgUtil.donutArcPath(dialCenter, dialCenter, radius, radialClearance, startAngle, endAngle);
      const path = SvgUtil.createSVGElement('path', {
        class: 'dial__temperatureControl',
        fill: 'transparent',
        d: controlsDef,
        'fill-rule': 'evenodd' // TRIAL MERGE: carve a true donut so pointer events skip the central mode toggle.
      });
      this._controls.push(path); // Keep references so highlighting can be toggled on tap.
      path.addEventListener('click', () => this._temperatureControlClicked(index)); // Route taps to the handler that adjusts temperatures.
      this._root.appendChild(path);
      startAngle = endAngle; // Move on to the next quadrant.
    }
  }

}

class SvgUtil {
  static createSVGElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag); // Create an SVG element in the proper namespace.
    this.attributes(element, attributes) // Apply all supplied attributes immediately.
    return element;
  }
  static attributes(element, attrs) {
    for (let i in attrs) {
      element.setAttribute(i, attrs[i]); // Assign each attribute key/value pair to the SVG node.
    }
  }
  // Rotate a cartesian point about given origin by X degrees
  static rotatePoint(point, angle, origin) {
    const radians = angle * Math.PI / 180;
    const x = point[0] - origin[0];
    const y = point[1] - origin[1];
    const x1 = x * Math.cos(radians) - y * Math.sin(radians) + origin[0];
    const y1 = x * Math.sin(radians) + y * Math.cos(radians) + origin[1];
    return [x1, y1]; // Provide the new coordinate so callers can construct rotated shapes.
  }
  // Rotate an array of cartesian points about a given origin by X degrees
  static rotatePoints(points, angle, origin) {
    return points.map((point) => this.rotatePoint(point, angle, origin)); // Rotate every point in a path.
  }
  // Given an array of points, return an SVG path string representing the shape they define
  static pointsToPath(points) {
    return points.map((point, iPoint) => (iPoint > 0 ? 'L' : 'M') + point[0] + ' ' + point[1]).join(' ') + 'Z'; // Convert vertices to an SVG path string.
  }
  static circleToPath(cx, cy, r, clockwise = true) {
    const sweep = clockwise ? 1 : 0; // SVG sweep flag: 1 draws clockwise, 0 draws counterclockwise.
    return [
      `M ${cx - r},${cy}`, // Start at the left-most point of the circle.
      `a ${r},${r} 0 1,${sweep} ${r * 2},0`, // Draw the top half as an arc sweeping across the circle.
      `a ${r},${r} 0 1,${sweep} ${-r * 2},0`, // Draw the bottom half returning to the starting point.
      'Z'
    ].join(' '); // Merge commands into one continuous path string with the desired winding order.
  }
  static donutPath(cx, cy, rOuter, rInner) {
    const outerPath = this.circleToPath(cx, cy, rOuter, true); // Keep the bezel's outer edge winding clockwise.
    const innerPath = this.circleToPath(cx, cy, rInner, false); // Reverse the inner edge so the default non-zero fill treats it as a hole.
    return `${outerPath} ${innerPath}`; // Combine both paths so SVG renders a hollow ring instead of a filled disk.

  }

  // Ring segment between start and end angles (degrees)
  static donutArcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    const toRad = (d) => (d % 360) * Math.PI / 180;
    const a0 = toRad(startDeg);
    const a1 = toRad(endDeg);
    const largeArc = Math.abs(endDeg - startDeg) % 360 > 180 ? 1 : 0;
    const sweep = 1; // clockwise
    const ox0 = cx + rOuter * Math.cos(a0);
    const oy0 = cy + rOuter * Math.sin(a0);
    const ox1 = cx + rOuter * Math.cos(a1);
    const oy1 = cy + rOuter * Math.sin(a1);
    const ix0 = cx + rInner * Math.cos(a1);
    const iy0 = cy + rInner * Math.sin(a1);
    const ix1 = cx + rInner * Math.cos(a0);
    const iy1 = cy + rInner * Math.sin(a0);
    return [
      `M ${ox0},${oy0}`,
      `A ${rOuter},${rOuter} 0 ${largeArc},${sweep} ${ox1},${oy1}`,
      `L ${ix0},${iy0}`,
      `A ${rInner},${rInner} 0 ${largeArc},${sweep ^ 1} ${ix1},${iy1}`,
      'Z'
    ].join(' ');
  }

  static superscript(n) {

    if ((n - Math.floor(n)) !== 0)
      n = Number(n).toFixed(1);; // Limit decimal temperatures to a single decimal place for readability.
    const x = `${n}${n == 0 ? '' : ''}`;
    return x; // Return the formatted string for placement in the rotating labels.
  }

  // Restrict a number to a min + max range
  static restrictToRange(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val; // Clamp out-of-range values so visuals stay within the dial.
  }
  static setClass(el, className, state) {


    el.classList[state ? 'add' : 'remove'](className); // Add or remove the class based on a boolean flag.
  }

  static anglesToSectors(radius, startAngle, angle) {
    let aRad = 0 // Angle in Rad
    let z = 0 // Size z
    let x = 0 // Side x
    let X = 0 // SVG X coordinate
    let Y = 0 // SVG Y coordinate
    const aCalc = (angle > 180) ? 360 - angle : angle;
    aRad = aCalc * Math.PI / 180;
    z = Math.sqrt(2 * radius * radius - (2 * radius * radius * Math.cos(aRad)));
    if (aCalc <= 90) {
      x = radius * Math.sin(aRad);
    }
    else {
      x = radius * Math.sin((180 - aCalc) * Math.PI / 180);
    }
    Y = Math.sqrt(z * z - x * x);
    if (angle <= 180) {
      X = radius + x;
    }
    else {
      X = radius - x;
    }
    return {
      L: radius,
      X: X,
      Y: Y,
      R: startAngle
    } // Provide coordinates used to draw wedge-shaped hit areas for tap controls.
  }
  static uniqueId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 11)}`; // Generate a random suffix to avoid DOM id collisions.
  }
}

/* Removed legacy prototype patch block */

// Text rendering override: add degree symbol to ambient/target and hide target while editing dual
if (!ThermostatUI.prototype.__textPatchedV2) {
  Object.defineProperty(ThermostatUI.prototype, '__textPatchedV2', {
    value: true,
    configurable: false,
    writable: false,
    enumerable: false
  });
  const overrideUpdateText = function(id, value) {
    const node = this._root && this._root.querySelector(`#${id}`);
    if (!node) return;
    const spans = node.querySelectorAll('tspan');
    const main = spans[0];
    const sup = spans[1];
    if (id === 'title') {
      if (main) main.textContent = value != null ? String(value) : '';
      if (sup) sup.textContent = '';
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      if (main) main.textContent = '';
      if (sup) sup.textContent = '';
    } else {
      if (main) main.textContent = String(Math.floor(n));
      if (sup) {
        const frac = n % 1;
        const fracText = frac !== 0 ? String(Math.round(frac * 10)) : '';
        const needsDeg = id === 'ambient' || id === 'target';
        sup.textContent = fracText + (needsDeg ? '°' : '');
      }
    }
    if (this.in_control && id === 'target' && this.dual) {
      if (main) main.textContent = '';
      if (sup) sup.textContent = '';
    }
  };
  ThermostatUI.prototype._updateText = overrideUpdateText;
}

// Override again with safe unicode escape for degree symbol to avoid encoding issues
if (!ThermostatUI.prototype.__textPatchedV3) {
  Object.defineProperty(ThermostatUI.prototype, '__textPatchedV3', {
    value: true,
    configurable: false,
    writable: false,
    enumerable: false
  });
  const overrideUpdateTextV3 = function(id, value) {
    const node = this._root && this._root.querySelector(`#${id}`);
    if (!node) return;
    const spans = node.querySelectorAll('tspan');
    const main = spans[0];
    const sup = spans[1];
    if (id === 'title') {
      if (main) main.textContent = value != null ? String(value) : '';
      if (sup) sup.textContent = '';
      return;
    }
    if (value === null || value === undefined) {
      if (main) main.textContent = '';
      if (sup) sup.textContent = '';
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      if (main) main.textContent = '';
      if (sup) sup.textContent = '';
    } else {
      if (main) main.textContent = String(Math.floor(n));
      if (sup) {
        const frac = n % 1;
        const fracText = frac !== 0 ? String(Math.round(frac * 10)) : '';
        const needsDeg = id === 'ambient' || id === 'target';
        sup.textContent = fracText + (needsDeg ? '\u00B0' : '');
      }
    }
    if (this.in_control && id === 'target' && this.dual) {
      if (main) main.textContent = '';
      if (sup) sup.textContent = '';
    }
  };
  ThermostatUI.prototype._updateText = overrideUpdateTextV3;
}
