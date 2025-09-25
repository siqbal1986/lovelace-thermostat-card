export default class ThermostatUI {
  get container() {
    return this._container
  }
  set dual(val) {
    this._dual = val
  }
  get dual() {
    return this._dual;
  }
  get in_control() {
    return this._in_control;
  }
  get temperature() {
    return {
      low: this._low,
      high: this._high,
      target: this._target,
    }
  }
  get ambient() {
    return this._ambient;
  }
  set temperature(val) {
    this._ambient = val.ambient;
    this._low = val.low;
    this._high = val.high;
    this._target = val.target;
    if (this._low && this._high) this.dual = true;
  }
  constructor(config) {

    this._config = config;  // need certain options for updates
    this._ticks = [];       // need for dynamic tick updates
    this._controls = [];    // need for managing highlight and clicks
    this._dual = false;     // by default is single temperature
    this._container = document.createElement('div');
    this._main_icon = document.createElement('div');
    this._modes_dialog = document.createElement('div');
    this._ring = null;
    this._ringRotation = 0;
    this._dragState = null;
    this._activeSetpoint = 'target';
    config.title = config.title === null || config.title === undefined ? 'Title' : config.title

    this._ic = document.createElement('div');
    this._ic.className = "prop";
    this._ic.innerHTML = `<ha-icon-button id="more" icon="mdi:dots-vertical" class="c_icon" role="button" tabindex="0" aria-disabled="false"></ha-icon-button>`;
    this._container.appendChild(this._ic)

    // this._container.appendChild(this._buildTitle(config.title));
    this._ic.addEventListener('click', () => this.openProp());
    this._container.appendChild(this._load_icon('', ''));
    this.c_body = document.createElement('div');
    this.c_body.className = 'c_body';
    const root = this._buildCore(config.diameter);
    root.appendChild(this._buildDial(config.radius));
    root.appendChild(this._buildTicks(config.num_ticks));
    this._ring = this._buildRing(config.radius);
    root.appendChild(this._ring);
    root.appendChild(this._buildThermoIcon(config.radius));
    root.appendChild(this._buildDialSlot(1));
    root.appendChild(this._buildDialSlot(2));
    root.appendChild(this._buildDialSlot(3));

    root.appendChild(this._buildText(config.radius, 'title', 0));
    root.appendChild(this._buildText(config.radius, 'ambient', 0));
    root.appendChild(this._buildText(config.radius, 'target', 0));
    root.appendChild(this._buildText(config.radius, 'low', -config.radius / 2.5));
    root.appendChild(this._buildText(config.radius, 'high', config.radius / 3));
    root.appendChild(this._buildChevrons(config.radius, 0, 'low', 0.7, -config.radius / 2.5));
    root.appendChild(this._buildChevrons(config.radius, 0, 'high', 0.7, config.radius / 3));
    root.appendChild(this._buildChevrons(config.radius, 0, 'target', 1, 0));
    root.appendChild(this._buildChevrons(config.radius, 180, 'low', 0.7, -config.radius / 2.5));
    root.appendChild(this._buildChevrons(config.radius, 180, 'high', 0.7, config.radius / 3));
    root.appendChild(this._buildChevrons(config.radius, 180, 'target', 1, 0));


    this.c_body.appendChild(root);
    this._container.appendChild(this.c_body);
    this._root = root;
    this._buildControls(config.radius);
    this._root.style.touchAction = 'none';
    this._root.addEventListener('pointerdown', (ev) => this._onPointerDown(ev));
    this._root.addEventListener('pointermove', (ev) => this._onPointerMove(ev));
    this._root.addEventListener('pointerup', (ev) => this._onPointerUp(ev));
    this._root.addEventListener('pointercancel', (ev) => this._onPointerUp(ev));
    this._root.addEventListener('lostpointercapture', (ev) => this._onPointerUp(ev));
    this._root.addEventListener('click', () => this._enableControls());
    this._container.appendChild(this._buildDialog());
    this._main_icon.addEventListener('click', () => this._openDialog());
    this._modes_dialog.addEventListener('click', () => this._hideDialog());
    this._updateText('title', config.title);
    this._setRingRotation(this._ringRotation);
  }

  updateState(options, hass) {

    const config = this._config;
    const away = options.away || false;
    this.entity = options.entity;
    this.min_value = options.min_value;
    this.max_value = options.max_value;
    this.hvac_state = options.hvac_state;
    this.preset_mode = options.preset_mode;
    this.hvac_modes = options.hvac_modes;
    this.temperature = {
      low: options.target_temperature_low,
      high: options.target_temperature_high,
      target: options.target_temperature,
      ambient: options.ambient_temperature,
    }

    this._updateTickDisplay();
    if (this._isDualModeActive()) {
      if (this._activeSetpoint !== 'low' && this._activeSetpoint !== 'high') {
        this._activeSetpoint = 'low';
      }
    } else {
      this._activeSetpoint = 'target';
    }
    // this._updateColor(this.hvac_state, this.preset_mode);
    this._updateText('ambient', this.ambient);
    this._updateEdit(false);
    this._updateDialog(this.hvac_modes, hass);
    this._syncRingToActiveSetpoint(this._activeSetpoint);
  }

  _temperatureControlClicked(index) {
    const config = this._config;
    let chevron;
    this._root.querySelectorAll('path.dial__chevron').forEach(el => SvgUtil.setClass(el, 'pressed', false));
    if (this.in_control) {
      let activeSetpoint = this.dual ? this._activeSetpoint : 'target';
      if (this.dual) {
        switch (index) {
          case 0:
            // clicked top left
            chevron = this._root.querySelectorAll('path.dial__chevron--low')[1];
            this._low = this._low + config.step;
            if ((this._low + config.idle_zone) >= this._high) this._low = this._high - config.idle_zone;
            activeSetpoint = 'low';
            break;
          case 1:
            // clicked top right
            chevron = this._root.querySelectorAll('path.dial__chevron--high')[1];
            this._high = this._high + config.step;
            if (this._high > this.max_value) this._high = this.max_value;
            activeSetpoint = 'high';
            break;
          case 2:
            // clicked bottom right
            chevron = this._root.querySelectorAll('path.dial__chevron--high')[0];
            this._high = this._high - config.step;
            if ((this._high - config.idle_zone) <= this._low) this._high = this._low + config.idle_zone;
            activeSetpoint = 'high';
            break;
          case 3:
            // clicked bottom left
            chevron = this._root.querySelectorAll('path.dial__chevron--low')[0];
            this._low = this._low - config.step;
            if (this._low < this.min_value) this._low = this.min_value;
            activeSetpoint = 'low';
            break;
        }
        SvgUtil.setClass(chevron, 'pressed', true);
        setTimeout(() => SvgUtil.setClass(chevron, 'pressed', false), 200);
        if (config.highlight_tap)
          SvgUtil.setClass(this._controls[index], 'control-visible', true);
      }
      else {
        activeSetpoint = 'target';
        if (index < 2) {
          // clicked top
          chevron = this._root.querySelectorAll('path.dial__chevron--target')[1];
          this._target = this._target + config.step;
          if (this._target > this.max_value) this._target = this.max_value;
          if (config.highlight_tap) {
            SvgUtil.setClass(this._controls[0], 'control-visible', true);
            SvgUtil.setClass(this._controls[1], 'control-visible', true);
          }
        } else {
          // clicked bottom
          chevron = this._root.querySelectorAll('path.dial__chevron--target')[0];
          this._target = this._target - config.step;
          if (this._target < this.min_value) this._target = this.min_value;
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
      this._activeSetpoint = activeSetpoint;
      this._syncRingToActiveSetpoint(activeSetpoint);
      this._updateTickDisplay();
      this._scheduleControlUpdate();
    } else {
      this._enableControls();
    }
  }

  _updateEdit(show_edit) {
    SvgUtil.setClass(this._root, 'dial--edit', show_edit);
  }

  _enableControls() {
    this._in_control = true;
    this._updateClass('in_control', this.in_control);
    this._updateEdit(true);
    //this._updateClass('has-thermo', true);
    this._updateText('target', this.temperature.target);
    this._updateText('low', this.temperature.low);
    this._updateText('high', this.temperature.high);
    this._scheduleControlUpdate();
  }

  _scheduleControlUpdate() {
    const config = this._config;
    if (!config) return;
    if (this._timeoutHandler) clearTimeout(this._timeoutHandler);
    this._timeoutHandler = setTimeout(() => {
      this._updateText('ambient', this.ambient);
      this._updateEdit(false);
      //this._updateClass('has-thermo', false);
      this._in_control = false;
      this._updateClass('in_control', this.in_control);
      config.control();
    }, config.pending * 1000);
  }

  _setRingRotation(angle) {
    const normalized = this._normalizeAngle(angle);
    this._ringRotation = normalized;
    if (this._ring) {
      const radius = this._config ? this._config.radius : 0;
      this._ring.setAttribute('transform', `rotate(${normalized} ${radius} ${radius})`);
    }
  }

  _clampDialAngle(angle) {
    if (!this._config) return angle;
    const minAngle = -this._config.offset_degrees;
    const maxAngle = this._config.tick_degrees - this._config.offset_degrees;
    return Math.min(Math.max(angle, minAngle), maxAngle);
  }

  _normalizeAngle(angle) {
    let result = angle;
    while (result <= -180) result += 360;
    while (result > 180) result -= 360;
    return result;
  }

  _syncRingToActiveSetpoint(active) {
    if (!this._config) return;
    const dualActive = this._isDualModeActive();
    let value;
    if (active === 'low' && dualActive) {
      value = this._toNumber(this._low, this.min_value);
    } else if (active === 'high' && dualActive) {
      value = this._toNumber(this._high, this.max_value);
    } else {
      value = this._toNumber(this._target, this.min_value);
      active = 'target';
    }
    const angle = this._clampDialAngle(this._temperatureToAngle(value));
    this._setRingRotation(angle);
  }

  _angleDifference(a, b) {
    return this._normalizeAngle(a - b);
  }

  _temperatureToAngle(value) {
    const config = this._config;
    if (!config) return 0;
    const min = this._toNumber(this.min_value, 0);
    const max = this._toNumber(this.max_value, 0);
    if (max <= min) return 0;
    const ratio = SvgUtil.restrictToRange((value - min) / (max - min), 0, 1);
    return ratio * config.tick_degrees - config.offset_degrees;
  }

  _angleToTemperature(angle) {
    const config = this._config;
    if (!config) return this._toNumber(this.min_value, 0);
    const min = this._toNumber(this.min_value, 0);
    const max = this._toNumber(this.max_value, min);
    if (max <= min) return min;
    const ratio = (angle + config.offset_degrees) / config.tick_degrees;
    return min + SvgUtil.restrictToRange(ratio, 0, 1) * (max - min);
  }

  _applyStep(value) {
    const stepValue = this._config && this._config.step ? Number(this._config.step) : 0;
    if (!stepValue) return value;
    const decimals = ((stepValue + '').split('.')[1] || '').length;
    const stepped = Math.round(value / stepValue) * stepValue;
    return decimals > 0 ? Number(stepped.toFixed(decimals)) : stepped;
  }

  _toNumber(value, fallback) {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  }

  _determineActiveSetpoint(angle) {
    if (!this._isDualModeActive()) return 'target';
    const min = this._toNumber(this.min_value, 0);
    const max = this._toNumber(this.max_value, min);
    const low = this._toNumber(this._low, min);
    const high = this._toNumber(this._high, max);
    const lowAngle = this._temperatureToAngle(low);
    const highAngle = this._temperatureToAngle(high);
    const distLow = Math.abs(this._angleDifference(angle, lowAngle));
    const distHigh = Math.abs(this._angleDifference(angle, highAngle));
    return distLow <= distHigh ? 'low' : 'high';
  }

  _getActiveTemperature(active, min, max) {
    if (active === 'low') {
      return this._toNumber(this._low, min);
    }
    if (active === 'high') {
      return this._toNumber(this._high, max);
    }
    return this._toNumber(this._target, min);
  }

  _applyTemperatureForActive(active, rawValue, minOverride, maxOverride) {
    const config = this._config;
    if (!config) return false;

    const min = minOverride !== undefined ? minOverride : this._toNumber(this.min_value, 0);
    const max = maxOverride !== undefined ? maxOverride : this._toNumber(this.max_value, min);
    if (max <= min) return false;

    const newTemp = this._applyStep(rawValue);
    const idleZone = this._toNumber(config.idle_zone, 0);
    let changed = false;

    if (this._isDualModeActive()) {
      if (active === 'low') {
        const high = this._toNumber(this._high, max);
        const maxLow = Math.max(min, high - idleZone);
        const restricted = SvgUtil.restrictToRange(newTemp, min, maxLow);
        const currentLow = this._toNumber(this._low, min);
        if (Math.abs(restricted - currentLow) > 0.0001) {
          this._low = restricted;
          this._updateText('low', this._low);
          changed = true;
        }
      } else if (active === 'high') {
        const low = this._toNumber(this._low, min);
        const minHigh = Math.min(max, low + idleZone);
        const restricted = SvgUtil.restrictToRange(newTemp, minHigh, max);
        const currentHigh = this._toNumber(this._high, max);
        if (Math.abs(restricted - currentHigh) > 0.0001) {
          this._high = restricted;
          this._updateText('high', this._high);
          changed = true;
        }
      } else {
        const restricted = SvgUtil.restrictToRange(newTemp, min, max);
        const currentTarget = this._toNumber(this._target, min);
        if (Math.abs(restricted - currentTarget) > 0.0001) {
          this._target = restricted;
          this._updateText('target', this._target);
          changed = true;
        }
      }
    } else {
      const restricted = SvgUtil.restrictToRange(newTemp, min, max);
      const currentTarget = this._toNumber(this._target, min);
      if (Math.abs(restricted - currentTarget) > 0.0001) {
        this._target = restricted;
        this._updateText('target', this._target);
        changed = true;
      }
    }

    if (changed) {
      this._updateTickDisplay();
    }

    return changed;
  }

  _getPointerAngle(event) {
    if (!this._root || !this._config) return null;
    const rect = this._root.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const diameter = this._config.diameter;
    const x = (event.clientX - rect.left) / rect.width * diameter;
    const y = (event.clientY - rect.top) / rect.height * diameter;
    const rawAngle = Math.atan2(y - this._config.radius, x - this._config.radius) * 180 / Math.PI;
    const minAngle = -this._config.offset_degrees;
    const maxAngle = this._config.tick_degrees - this._config.offset_degrees;
    const normalized = this._normalizeAngle(rawAngle);
    const clamped = Math.min(Math.max(normalized, minAngle), maxAngle);
    return { angle: normalized, clamped };
  }

  _onPointerDown(event) {
    if (!this._config) return;
    if (event.isPrimary === false) return;
    if (event.button !== undefined && event.button !== 0) return;

    const min = this._toNumber(this.min_value, NaN);
    const max = this._toNumber(this.max_value, NaN);
    if (isNaN(min) || isNaN(max) || max <= min) return;

    const target = event.target;
    if (target && target.classList && (target.classList.contains('dial__temperatureControl') || target.classList.contains('dial__chevron'))) {
      return;
    }

    const angleInfo = this._getPointerAngle(event);
    if (!angleInfo) return;

    const active = this._determineActiveSetpoint(angleInfo.clamped);
    this._activeSetpoint = active;
    const startTemperature = this._getActiveTemperature(active, min, max);
    const startAngle = this._temperatureToAngle(startTemperature);

    this._dragState = {
      pointerId: event.pointerId,
      pointerDownAngle: angleInfo.clamped,
      startAngle,
      startRing: this._ringRotation,
      active,
      min,
      max,
      moved: false,
    };

    if (this._root.setPointerCapture) {
      try {
        this._root.setPointerCapture(event.pointerId);
      } catch (e) {
        // ignore if pointer capture fails
      }
    }

    this._enableControls();
  }

  _onPointerMove(event) {
    if (!this._dragState || this._dragState.pointerId !== event.pointerId) return;
    const angleInfo = this._getPointerAngle(event);
    if (!angleInfo) return;

    const dragState = this._dragState;
    const deltaFromPointer = this._angleDifference(angleInfo.clamped, dragState.pointerDownAngle);
    const effectiveAngle = this._clampDialAngle(dragState.startAngle + deltaFromPointer);
    const rawTemperature = this._angleToTemperature(effectiveAngle);
    const changed = this._applyTemperatureForActive(dragState.active, rawTemperature, dragState.min, dragState.max);

    this._setRingRotation(dragState.startRing + deltaFromPointer);

    if (Math.abs(deltaFromPointer) > 0.0001 || changed) {
      dragState.moved = true;
      this._scheduleControlUpdate();
      event.preventDefault();
    }
  }

  _onPointerUp(event) {
    if (!this._dragState || this._dragState.pointerId !== event.pointerId) return;
    const dragState = this._dragState;
    if (this._root.releasePointerCapture) {
      try {
        this._root.releasePointerCapture(event.pointerId);
      } catch (e) {
        // ignore if release fails
      }
    }
    this._dragState = null;
    this._syncRingToActiveSetpoint(dragState.active);
    this._scheduleControlUpdate();
    if (dragState && dragState.moved) {
      event.preventDefault();
    }
  }

  _updateClass(class_name, flag) {
    SvgUtil.setClass(this._root, class_name, flag);
  }

  _updateText(id, value) {
    const lblTarget = this._root.querySelector(`#${id}`).querySelectorAll('tspan');
    const text = Math.floor(value);
    if (value) {
      lblTarget[0].textContent = text;
      if (value % 1 != 0) {
        lblTarget[1].textContent = Math.round(value % 1 * 10);
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
  }

  _updateTemperatureSlot(value, offset, slot) {

    const config = this._config;
    const lblSlot1 = this._root.querySelector(`#${slot}`)
    lblSlot1.textContent = value != null ? SvgUtil.superscript(value) : '';

    const peggedValue = SvgUtil.restrictToRange(value, this.min_value, this.max_value);
    const position = [config.radius, config.ticks_outer_radius - (config.ticks_outer_radius - config.ticks_inner_radius) / 2];
    let degs = config.tick_degrees * (peggedValue - this.min_value) / (this.max_value - this.min_value) - config.offset_degrees + offset;
    const pos = SvgUtil.rotatePoint(position, degs, [config.radius, config.radius]);
    SvgUtil.attributes(lblSlot1, {
      x: pos[0],
      y: pos[1]
    });
  }

  _isDualModeActive() {
    return this.dual && (this.hvac_state == 'heat_cool' || this.hvac_state == 'off');
  }

  _updateTickDisplay() {
    const config = this._config;
    if (!config) return;

    this._updateClass('has_dual', this.dual);

    let tick_label, from, to;
    const tick_indexes = [];
    const ambient_index = SvgUtil.restrictToRange(Math.round((this.ambient - this.min_value) / (this.max_value - this.min_value) * config.num_ticks), 0, config.num_ticks - 1);
    const target_index = SvgUtil.restrictToRange(Math.round((this._target - this.min_value) / (this.max_value - this.min_value) * config.num_ticks), 0, config.num_ticks - 1);
    const high_index = SvgUtil.restrictToRange(Math.round((this._high - this.min_value) / (this.max_value - this.min_value) * config.num_ticks), 0, config.num_ticks - 1);
    const low_index = SvgUtil.restrictToRange(Math.round((this._low - this.min_value) / (this.max_value - this.min_value) * config.num_ticks), 0, config.num_ticks - 1);

    const dual_state = this._isDualModeActive();

    if (dual_state) {
      tick_label = [this._low, this._high, this.ambient].sort();
      this._updateTemperatureSlot(null, 0, `temperature_slot_1`);
      this._updateTemperatureSlot(null, 0, `temperature_slot_2`);
      this._updateTemperatureSlot(null, 0, `temperature_slot_3`);

      switch (this.hvac_state) {
        case 'heat_cool':
          this._load_icon(this.hvac_state, 'sync');

          if (high_index < ambient_index) {
            from = high_index;
            to = ambient_index;
            this._updateTemperatureSlot(this.ambient, 8, `temperature_slot_3`);
            this._updateTemperatureSlot(this._high, -8, `temperature_slot_2`);
          } else if (low_index > ambient_index) {
            from = ambient_index;
            to = low_index;
            this._updateTemperatureSlot(this.ambient, -8, `temperature_slot_1`);
            this._updateTemperatureSlot(this._low, 8, `temperature_slot_2`);
          } else {
            this._updateTemperatureSlot(this._low, -8, `temperature_slot_1`);
            this._updateTemperatureSlot(this._high, 8, `temperature_slot_3`);
          }
          break;

        case 'off':
          this._load_icon(this.hvac_state, 'power');

          if (high_index < ambient_index) {
            from = high_index;
            to = ambient_index;
            this._updateTemperatureSlot(this.ambient, 8, `temperature_slot_3`);
            this._updateTemperatureSlot(this._high, -8, `temperature_slot_2`);
          } else if (low_index > ambient_index) {
            from = ambient_index;
            to = low_index;
            this._updateTemperatureSlot(this.ambient, -8, `temperature_slot_1`);
            this._updateTemperatureSlot(this._low, 8, `temperature_slot_2`);
          } else {
            this._updateTemperatureSlot(this._low, -8, `temperature_slot_1`);
            this._updateTemperatureSlot(this._high, 8, `temperature_slot_3`);
          }
          break;
        default:
      }
    } else {
      tick_label = [this._target, this.ambient].sort();
      this._updateTemperatureSlot(tick_label[0], -8, `temperature_slot_1`);
      this._updateTemperatureSlot(tick_label[1], 8, `temperature_slot_2`);

      switch (this.hvac_state) {
        case 'dry':
          this._load_icon(this.hvac_state, 'water-percent');
          break;
        case 'fan_only':
          this._load_icon(this.hvac_state, 'fan');
          break;
        case 'cool':
          this._load_icon(this.hvac_state, 'snowflake');

          if (target_index <= ambient_index) {
            from = target_index;
            to = ambient_index;
          }
          break;
        case 'heat':
          this._load_icon(this.hvac_state, 'fire');

          if (target_index >= ambient_index) {
            from = ambient_index;
            to = target_index;
          }
          break;
        case 'heat_cool':
          this._load_icon(this.hvac_state, 'sync');

          if (target_index >= ambient_index) {
            from = ambient_index;
            to = target_index;
          }
          break;
        case 'auto':
          this._load_icon(this.hvac_state, 'atom');

          if (target_index >= ambient_index) {
            from = ambient_index;
            to = target_index;
          }
          break;
        case 'off':
          this._load_icon(this.hvac_state, 'power');
          break;
        default:
          this._load_icon('more', 'dots-horizontal');
      }
    }

    tick_label.forEach(item => tick_indexes.push(SvgUtil.restrictToRange(Math.round((item - this.min_value) / (this.max_value - this.min_value) * config.num_ticks), 0, config.num_ticks - 1)));
    this._updateTicks(from, to, tick_indexes, this.hvac_state);
  }

  _updateColor(state, preset_mode) {

    if (Object.prototype.toString.call(preset_mode) === "[object String]") {

      if (state != 'off' && preset_mode.toLowerCase() == 'idle')
        state = 'idle'
      this._root.classList.forEach(c => {
        if (c.indexOf('dial--state--') != -1)
          this._root.classList.remove(c);
      });
      this._root.classList.add('dial--state--' + state);
    }
  }

  _updateTicks(from, to, large_ticks, hvac_state) {
    const config = this._config;

    const tickPoints = [
      [config.radius - 1, config.ticks_outer_radius],
      [config.radius + 1, config.ticks_outer_radius],
      [config.radius + 1, config.ticks_inner_radius],
      [config.radius - 1, config.ticks_inner_radius]
    ];
    const tickPointsLarge = [
      [config.radius - 1.5, config.ticks_outer_radius],
      [config.radius + 1.5, config.ticks_outer_radius],
      [config.radius + 1.5, config.ticks_inner_radius + 20],
      [config.radius - 1.5, config.ticks_inner_radius + 20]
    ];

    this._ticks.forEach((tick, index) => {
      let isLarge = false;
      let isActive = (index >= from && index <= to) ? 'active ' + hvac_state : '';
      large_ticks.forEach(i => isLarge = isLarge || (index == i));
      if (isLarge) isActive += ' large';
      const theta = config.tick_degrees / config.num_ticks;
      SvgUtil.attributes(tick, {
        d: SvgUtil.pointsToPath(SvgUtil.rotatePoints(isLarge ? tickPointsLarge : tickPoints, index * theta - config.offset_degrees, [config.radius, config.radius])),
        class: isActive
      });
    });
  }
  _updateDialog(modes, hass) {
    this._modes_dialog.innerHTML = "";
    for (var i = 0; i < modes.length; i++) {
      let icon;
      let mode = modes[i];
      switch (mode) {
        case 'dry':
          icon = 'water-percent';
          break;
        case 'fan_only':
          icon = 'fan';
          break;
        case 'cool':
          icon = 'snowflake';
          break;
        case 'heat':
          icon = 'fire';
          break;
        case 'auto':
          icon = 'atom';
          break;
        case 'heat_cool':
          icon = 'sync';
          break;
        case 'off':
          icon = 'power';
          break;
        default:
          icon = 'help';
      }
      let d = document.createElement('span');
      d.innerHTML = `<ha-icon class="modeicon ${mode}" icon="mdi:${icon}"></ha-icon>`
      d.addEventListener('click', (e) => this._setMode(e, mode, hass));
      //this._modes[i].push(d);
      this._modes_dialog.appendChild(d)
    }
  }
  _buildCore(diameter) {
    return SvgUtil.createSVGElement('svg', {
      width: '100%',
      height: '100%',
      viewBox: '0 0 ' + diameter + ' ' + diameter,
      class: 'dial'
    })
  }

  openProp() {
    this._config.propWin(this.entity.entity_id)
  }
  _openDialog() {
    this._modes_dialog.className = "dialog modes";
  }
  _hideDialog() {
    this._modes_dialog.className = "dialog modes hide";
  }
  _setMode(e, mode, hass) {
    console.log(mode);
    let config = this._config;
    if (this._timeoutHandlerMode) clearTimeout(this._timeoutHandlerMode);
    hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.entity,
      hvac_mode: mode,
    });
    this._modes_dialog.className = "dialog modes " + mode + " pending";
    this._timeoutHandlerMode = setTimeout(() => {
      this._modes_dialog.className = "dialog modes hide";
    }, config.pending * 1000);
    e.stopPropagation();
  }
  _load_icon(state, ic_name) {

    let ic_dot = 'dot_r'
    if (ic_name == '') {
      ic_dot = 'dot_h'
    }

    this._main_icon.innerHTML = `
      <div class="climate_info">
        <div class="mode_color"><span class="${ic_dot}"></span></div>
        <div class="modes"><ha-icon class="${state}" icon="mdi:${ic_name}"></ha-icon></div>
      </div>
    `;
    return this._main_icon;
  }
  _buildDialog() {
    this._modes_dialog.className = "dialog modes hide";
    return this._modes_dialog;
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
    return SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, radius - 4, radius - 8),
      class: 'dial__editableIndicator',
    })
  }

  _buildTicks(num_ticks) {
    const tick_element = SvgUtil.createSVGElement('g', {
      class: 'dial__ticks'
    });
    for (let i = 0; i < num_ticks; i++) {
      const tick = SvgUtil.createSVGElement('path', {})
      this._ticks.push(tick);
      tick_element.appendChild(tick);
    }
    return tick_element;
  }

  _buildChevrons(radius, rotation, id, scale, offset) {
    const config = this._config;
    const translation = rotation > 0 ? -1 : 1;
    const width = config.chevron_size;
    const chevron_def = ["M", 0, 0, "L", width / 2, width * 0.3, "L", width, 0].map((x) => isNaN(x) ? x : x * scale).join(' ');
    const translate = [radius - width / 2 * scale * translation + offset, radius + 70 * scale * 1.1 * translation];
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
    const translate = [radius - (thermoScale * 100 * 0.3), radius * 1.65]
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
    });
    const text = SvgUtil.createSVGElement('tspan', {
    });
    // hack
    if (name == 'target' || name == 'ambient') offset += 20;
    const superscript = SvgUtil.createSVGElement('tspan', {
      x: radius + radius / 3.1 + offset,
      y: radius - radius / 6,
      class: `dial__lbl--super--${name}`
    });
    target.appendChild(text);
    target.appendChild(superscript);
    return target;
  }

  _buildControls(radius) {
    let startAngle = 270;
    let loop = 4;
    for (let index = 0; index < loop; index++) {
      const angle = 360 / loop;
      const sector = SvgUtil.anglesToSectors(radius, startAngle, angle);
      const controlsDef = 'M' + sector.L + ',' + sector.L + ' L' + sector.L + ',0 A' + sector.L + ',' + sector.L + ' 1 0,1 ' + sector.X + ', ' + sector.Y + ' z';
      const path = SvgUtil.createSVGElement('path', {
        class: 'dial__temperatureControl',
        fill: 'blue',
        d: controlsDef,
        transform: 'rotate(' + sector.R + ', ' + sector.L + ', ' + sector.L + ')'
      });
      this._controls.push(path);
      path.addEventListener('click', () => this._temperatureControlClicked(index));
      this._root.appendChild(path);
      startAngle = startAngle + angle;
    }
  }

}

class SvgUtil {
  static createSVGElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    this.attributes(element, attributes)
    return element;
  }
  static attributes(element, attrs) {
    for (let i in attrs) {
      element.setAttribute(i, attrs[i]);
    }
  }
  // Rotate a cartesian point about given origin by X degrees
  static rotatePoint(point, angle, origin) {
    const radians = angle * Math.PI / 180;
    const x = point[0] - origin[0];
    const y = point[1] - origin[1];
    const x1 = x * Math.cos(radians) - y * Math.sin(radians) + origin[0];
    const y1 = x * Math.sin(radians) + y * Math.cos(radians) + origin[1];
    return [x1, y1];
  }
  // Rotate an array of cartesian points about a given origin by X degrees
  static rotatePoints(points, angle, origin) {
    return points.map((point) => this.rotatePoint(point, angle, origin));
  }
  // Given an array of points, return an SVG path string representing the shape they define
  static pointsToPath(points) {
    return points.map((point, iPoint) => (iPoint > 0 ? 'L' : 'M') + point[0] + ' ' + point[1]).join(' ') + 'Z';
  }
  static circleToPath(cx, cy, r) {
    return [
      "M", cx, ",", cy,
      "m", 0 - r, ",", 0,
      "a", r, ",", r, 0, 1, ",", 0, r * 2, ",", 0,
      "a", r, ",", r, 0, 1, ",", 0, 0 - r * 2, ",", 0,
      "z"
    ].join(' ').replace(/\s,\s/g, ",");
  }
  static donutPath(cx, cy, rOuter, rInner) {
    return this.circleToPath(cx, cy, rOuter) + " " + this.circleToPath(cx, cy, rInner);
  }

  static superscript(n) {

    if ((n - Math.floor(n)) !== 0)
      n = Number(n).toFixed(1);;
    const x = `${n}${n == 0 ? '' : ''}`;
    return x;
  }

  // Restrict a number to a min + max range
  static restrictToRange(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
  }
  static setClass(el, className, state) {


    el.classList[state ? 'add' : 'remove'](className);
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
    }
  }
}