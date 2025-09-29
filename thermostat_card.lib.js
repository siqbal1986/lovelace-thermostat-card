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
    ThermostatUI._ringIdCounter = (ThermostatUI._ringIdCounter || 0) + 1;
    const uid = ThermostatUI._ringIdCounter.toString(36);
    this._metalGradientId = `dial-metal-gradient-${uid}`;
    this._metalSheenId = `dial-metal-sheen-${uid}`;
    this._metalShadowId = `dial-metal-shadow-${uid}`;

    this._dragContext = null;
    this._lastHass = null;
    this._handleDialPointerDown = this._handleDialPointerDown.bind(this);
    this._handleDialPointerMove = this._handleDialPointerMove.bind(this);
    this._handleDialPointerUp = this._handleDialPointerUp.bind(this);
    this._ringRotation = 0;
    this._dragDisabled = false;
    this._ringGroup = null;
    this._dragZoneInnerRatio = 0.8;
    this._ringMetrics = null;
    this._dragOverlay = null;
    this._limitFlash = null;

    this._container = document.createElement('div');
    this._main_icon = document.createElement('div');
    this._modes_dialog = document.createElement('div');
    this._modeMenuContainer = null;
    this._modeMenuToggler = null;
    this._modeMenuList = null;
    this._modeMenuItems = [];
    this._metalRingIds = {
      gradient: SvgUtil.uniqueId('dial__metal-ring-gradient'),
      sheen: SvgUtil.uniqueId('dial__metal-ring-sheen'),
      filter: SvgUtil.uniqueId('dial__metal-ring-filter')
    };
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
    this._ringGroup = this._buildRing(config.radius);
    root.appendChild(this._ringGroup);
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
    this._root.addEventListener('pointerdown', this._handleDialPointerDown, { passive: false });
    this._root.addEventListener('pointermove', this._handleDialPointerMove);
    this._root.addEventListener('pointerup', this._handleDialPointerUp);
    this._root.addEventListener('pointercancel', this._handleDialPointerUp);
    this._buildControls(config.radius);
    this._root.addEventListener('click', () => this._enableControls());
    this._container.appendChild(this._buildDialog());
    this._main_icon.addEventListener('click', () => this._openDialog());
    this._modes_dialog.addEventListener('click', () => this._hideDialog());
    this._updateText('title', config.title);
    this._applyRingRotation();
  }

  updateState(options, hass) {

    const config = this._config;
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

    this._lastHass = hass;
    this._renderDial({
      refreshDialog: true,
      hass,
      updateAmbient: !this.in_control,
      resetEdit: !this.in_control
    });

    if (!this.in_control) {
      this._updateEdit(false);
      this._updateClass('in_control', this.in_control);
    }

    this._updateText('target', this.temperature.target);
    this._updateText('low', this.temperature.low);
    this._updateText('high', this.temperature.high);
    this._setActiveMode(this.hvac_state);
    this._updateColor(this.hvac_state, this.preset_mode);
  }

  _renderDial({ refreshDialog = false, hass = null, updateAmbient = true, resetEdit = false } = {}) {
    const config = this._config;

    const totalRange = Math.max(this.max_value - this.min_value, Number.EPSILON);
    const mapValueToIndex = (value) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return null;
      }
      const normalized = (value - this.min_value) / totalRange;
      return SvgUtil.restrictToRange(Math.round(normalized * config.num_ticks), 0, config.num_ticks - 1);
    };

    const ambientValue = typeof this.ambient === 'number' ? this.ambient : null;
    const targetValue = typeof this._target === 'number' ? this._target : null;
    const highValue = typeof this._high === 'number' ? this._high : null;
    const lowValue = typeof this._low === 'number' ? this._low : null;

    const ambientIndex = mapValueToIndex(ambientValue);
    const targetIndex = mapValueToIndex(targetValue);
    const highIndex = mapValueToIndex(highValue);
    const lowIndex = mapValueToIndex(lowValue);

    this._updateClass('has_dual', this.dual);

    const tickIndexes = [];
    let fromIndex = null;
    let toIndex = null;

    const dualState = this.dual && (this.hvac_state === 'heat_cool' || this.hvac_state === 'off');
    let rotationReference = targetValue ?? ambientValue ?? this.min_value;

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
          const icon = this.hvac_state === 'heat_cool' ? 'sync' : 'power';
          this._load_icon(this.hvac_state, icon);

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
          this._load_icon(this.hvac_state, 'dots-horizontal');
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

      this._updateTemperatureSlot(primaryValue, -8, `temperature_slot_1`);
      this._updateTemperatureSlot(secondaryValue, 8, `temperature_slot_2`);

      sortedSingleValues.forEach((value) => {
        const idx = mapValueToIndex(value);
        if (idx !== null) tickIndexes.push(idx);
      });

      switch (this.hvac_state) {
        case 'dry':
          this._load_icon(this.hvac_state, 'water-percent');
          break;
        case 'fan_only':
          this._load_icon(this.hvac_state, 'fan');
          break;
        case 'cool':
          this._load_icon(this.hvac_state, 'snowflake');
          break;
        case 'heat':
          this._load_icon(this.hvac_state, 'fire');
          break;
        case 'heat_cool':
          this._load_icon(this.hvac_state, 'sync');
          break;
        case 'auto':
          this._load_icon(this.hvac_state, 'atom');
          break;
        case 'off':
          this._load_icon(this.hvac_state, 'power');
          break;
        default:
          this._load_icon('more', 'dots-horizontal');
          break;
      }

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

    this._updateTicks(fromIndex, toIndex, tickIndexes, this.hvac_state);

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
      this._updateEdit(false);
      this._updateClass('in_control', this.in_control);
    }

    if (refreshDialog && hass) {
      this._updateDialog(this.hvac_modes, hass);
    }
  }


  _temperatureControlClicked(index) {
    const config = this._config;
    let chevron;
    this._root.querySelectorAll('path.dial__chevron').forEach(el => SvgUtil.setClass(el, 'pressed', false));
    if (this.in_control) {
      if (this.dual) {
        switch (index) {
          case 0:
            // clicked top left 
            chevron = this._root.querySelectorAll('path.dial__chevron--low')[1];
            this._low = this._low + config.step;
            if ((this._low + config.idle_zone) >= this._high) this._low = this._high - config.idle_zone;
            break;
          case 1:
            // clicked top right
            chevron = this._root.querySelectorAll('path.dial__chevron--high')[1];
            this._high = this._high + config.step;
            if (this._high > this.max_value) this._high = this.max_value;
            break;
          case 2:
            // clicked bottom right
            chevron = this._root.querySelectorAll('path.dial__chevron--high')[0];
            this._high = this._high - config.step;
            if ((this._high - config.idle_zone) <= this._low) this._high = this._low + config.idle_zone;
            break;
          case 3:
            // clicked bottom left
            chevron = this._root.querySelectorAll('path.dial__chevron--low')[0];
            this._low = this._low - config.step;
            if (this._low < this.min_value) this._low = this.min_value;
            break;
        }
        SvgUtil.setClass(chevron, 'pressed', true);
        setTimeout(() => SvgUtil.setClass(chevron, 'pressed', false), 200);
        if (config.highlight_tap)
          SvgUtil.setClass(this._controls[index], 'control-visible', true);
      }
      else {
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
    const dualAllowed = this.dual && (this.hvac_state === 'heat_cool' || this.hvac_state === 'off');
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
    if (!this._ringGroup) {
      return;
    }
    const angle = this._ringRotation || 0;
    this._ringGroup.setAttribute('transform', `rotate(${angle} ${this._config.radius} ${this._config.radius})`);
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
    ];
    const tickPointsLarge = [
      [config.radius - 1.5, config.ticks_outer_radius],
      [config.radius + 1.5, config.ticks_outer_radius],
      [config.radius + 1.5, config.ticks_inner_radius + 20],
      [config.radius - 1.5, config.ticks_inner_radius + 20]
    ];

    const highlightStart = typeof from === 'number' ? from : -1;
    const highlightEnd = typeof to === 'number' ? to : -1;

    this._ticks.forEach((tick, index) => {
      let isLarge = false;
      const theta = config.tick_degrees / config.num_ticks;
      large_ticks.forEach((i) => {
        if (index === i) isLarge = true;
      });

      const withinRange = highlightStart >= 0 && highlightEnd >= highlightStart && index >= highlightStart && index <= highlightEnd;
      const classes = [];
      if (withinRange) {
        classes.push('active');
        if (hvac_state) {
          classes.push(hvac_state);
        }
      }
      if (isLarge) {
        classes.push('large');
      }

      SvgUtil.attributes(tick, {
        d: SvgUtil.pointsToPath(SvgUtil.rotatePoints(isLarge ? tickPointsLarge : tickPoints, index * theta - config.offset_degrees, [config.radius, config.radius])),
        class: classes.join(' ')
      });
    });
  }

  _updateDialog(modes, hass) {
    if (!this._modeMenuList) {
      this._buildDialog();
    }
    const list = this._modeMenuList;
    if (!list) {
      return;
    }
    list.innerHTML = '';
    this._modeMenuItems = [];
    if (!Array.isArray(modes) || modes.length === 0) {
      return;
    }
    const total = modes.length;
    const radius = Math.max(82, Math.min(this._config.radius * 0.85, 140));
    const angleStep = 360 / total;
    for (let i = 0; i < total; i++) {
      const mode = modes[i];
      const icon = this._iconForMode ? this._iconForMode(mode, 'help') : 'help';
      const item = document.createElement('li');
      item.className = 'menu-item';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'menu-item__button';
      button.dataset.mode = mode;
      button.innerHTML = `<span class="menu-item__icon"><ha-icon icon="mdi:${icon}"></ha-icon></span><span class="menu-item__label">${mode.replace(/_/g, ' ')}</span>`;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this._setMode(event, mode, hass);
      });
      item.appendChild(button);
      const angle = angleStep * i;
      item.style.setProperty('--menu-angle', angle + 'deg');
      item.style.setProperty('--menu-angle-negative', (-angle) + 'deg');
      item.style.setProperty('--menu-distance', radius + 'px');
      list.appendChild(item);
      this._modeMenuItems.push(item);
    }
    this._setActiveMode(this.hvac_state);
  }
  _setModeMenuOpen(open) {
    if (!this._modeMenuContainer || !this._modeMenuToggler) {
      return;
    }
    const expanded = !!open;
    this._modeMenuContainer.classList.toggle('menu-open', expanded);
    this._modeMenuToggler.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  _setActiveMode(mode) {
    if (!Array.isArray(this._modeMenuItems)) {
      return;
    }
    this._modeMenuItems.forEach((item) => {
      const button = item.querySelector('.menu-item__button');
      const isActive = button && button.dataset.mode === mode;
      item.classList.toggle('menu-item--active', !!isActive);
    });
  }
  _buildCore(diameter) {

    const root = SvgUtil.createSVGElement('svg', {
      width: '100%',
      height: '100%',
      viewBox: '0 0 ' + diameter + ' ' + diameter,
      class: 'dial'
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
      ['0%', '#fefefe', '1'],
      ['32%', '#e7eaef', '1'],
      ['55%', '#cdd1d8', '1'],
      ['72%', '#a3a8b0', '1'],
      ['88%', '#6c737b', '1'],
      ['100%', '#464b52', '1']
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

    defs.appendChild(metalGradient);
    defs.appendChild(metalSheen);
    defs.appendChild(metalShadow);
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

  openProp() {
    this._config.propWin(this.entity.entity_id)
  }
  _openDialog() {
    this._dragDisabled = true;
    const activePointerId = this._dragContext ? this._dragContext.pointerId : undefined;
    if (this._dragContext) {
      this._dragContext = null;
      this._setDragging(false);
    }
    if (activePointerId !== undefined && this._root.releasePointerCapture) {
      try {
        this._root.releasePointerCapture(activePointerId);
      } catch (err) {
        // ignore
      }
    }
    this._modes_dialog.className = "dialog modes menu-open";
    this._setModeMenuOpen(true);
  }
  _hideDialog() {
    this._dragDisabled = false;
    this._setModeMenuOpen(false);
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
    this._setActiveMode(mode);
    this._updateColor(mode, this.preset_mode);
    this._modes_dialog.className = "dialog modes menu-open " + mode + " pending";
    this._setModeMenuOpen(true);
    this._timeoutHandlerMode = setTimeout(() => {
      this._hideDialog();
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
        <div class="climate_info__bezel"></div>
        <div class="mode_color"><span class="${ic_dot}"></span></div>
        <div class="modes__glow"></div>
        <div class="modes"><ha-icon class="${state}" icon="mdi:${ic_name}"></ha-icon></div>
      </div>
    `;
    return this._main_icon;
  }
  _buildDialog() {
    this._modes_dialog.className = "dialog modes hide";
    this._modes_dialog.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'mode-menu';
    const toggler = document.createElement('button');
    toggler.type = 'button';
    toggler.className = 'mode-menu__toggler';
    toggler.setAttribute('aria-label', 'Toggle HVAC modes');
    toggler.setAttribute('aria-expanded', 'false');
    toggler.innerHTML = '<span></span><span></span><span></span>';
    const list = document.createElement('ul');
    list.className = 'mode-menu__items';
    container.appendChild(toggler);
    container.appendChild(list);
    container.addEventListener('click', (event) => event.stopPropagation());
    toggler.addEventListener('click', (event) => {
      event.stopPropagation();
      this._setModeMenuOpen(!container.classList.contains('menu-open'));
    });
    list.addEventListener('click', (event) => event.stopPropagation());
    this._modeMenuContainer = container;
    this._modeMenuToggler = toggler;
    this._modeMenuList = list;
    this._modeMenuItems = [];
    this._modes_dialog.appendChild(container);
    this._setModeMenuOpen(false);
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
    const config = this._config;
    const ringGroup = SvgUtil.createSVGElement('g', {
      class: 'dial__ring'
    });

    const outerRadius = radius - 1.5;
    const minimumThickness = Math.max(radius * 0.14, 18);
    const tickClearance = radius - config.ticks_outer_radius + 2;
    const ringInnerRadius = Math.max(outerRadius - minimumThickness, tickClearance);
    const ringThickness = outerRadius - ringInnerRadius;

    this._ringMetrics = {
      outerRadius,
      innerRadius: ringInnerRadius,
      thickness: ringThickness
    };

    const ringSurface = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, outerRadius, ringInnerRadius),
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
      d: SvgUtil.donutPath(radius, radius, sheenOuter, sheenInner),
      class: 'dial__metal-ring-sheen'
    });

    const shadowOuter = outerRadius - ringThickness * 0.02;
    const shadowInner = ringInnerRadius + ringThickness * 0.15;
    const shadow = SvgUtil.createSVGElement('path', {
      d: SvgUtil.donutPath(radius, radius, shadowOuter, shadowInner),
      class: 'dial__metal-ring-shadow'
    });

    const gripGroup = SvgUtil.createSVGElement('g', {
      class: 'dial__ring-grips'
    });
    const gripCount = Math.max(36, Math.round(config.tick_degrees / 5));
    const gripWidth = Math.max(1.6, ringThickness * 0.25);
    const gripLength = ringThickness * 0.75;
    const gripInset = ringInnerRadius + ringThickness * 0.12;

    for (let i = 0; i < gripCount; i++) {
      const angle = (config.tick_degrees / gripCount) * i - config.offset_degrees;
      const gripPoints = [
        [radius - gripWidth / 2, radius - (gripInset + gripLength)],
        [radius + gripWidth / 2, radius - (gripInset + gripLength)],
        [radius + gripWidth / 2, radius - gripInset],
        [radius - gripWidth / 2, radius - gripInset]
      ];
      const grip = SvgUtil.createSVGElement('path', {
        d: SvgUtil.pointsToPath(SvgUtil.rotatePoints(gripPoints, angle, [radius, radius])),
        class: 'dial__ring-grip'
      });
      gripGroup.appendChild(grip);
    }

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
      d: SvgUtil.donutPath(radius, radius, highlightOuter, highlightInner),
      class: 'dial__editableIndicator'
    });

    ringGroup.appendChild(ringSurface);
    ringGroup.appendChild(shadow);
    ringGroup.appendChild(sheen);
    ringGroup.appendChild(gripGroup);
    ringGroup.appendChild(highlight);

    return ringGroup;
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
        fill: 'transparent',
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
  static uniqueId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

// --- Codex interaction enhancements ---
if (!ThermostatUI.prototype.__codexEnhanced) {
  Object.defineProperty(ThermostatUI.prototype, '__codexEnhanced', {
    value: true,
    configurable: false,
    writable: false,
    enumerable: false
  });
  const CODEX_EPSILON = 0.05;
  const codexClamp = (value, min, max) => {
    if (typeof SvgUtil !== 'undefined' && typeof SvgUtil.restrictToRange === 'function') {
      return SvgUtil.restrictToRange(value, min, max);
    }
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  };
  const quantizeValue = (value, step) => {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
      return value;
    }
    const scaled = Math.round(value / step) * step;
    return Math.abs(scaled) < CODEX_EPSILON ? 0 : scaled;
  };
  const coerceNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const resolveStep = (card) => {
    const cfg = card && card._config;
    if (cfg) {
      const cfgStep = Number(cfg.step);
      if (Number.isFinite(cfgStep) && cfgStep > 0) {
        return cfgStep;
      }
    }
    const entity = card && card.entity;
    if (entity && entity.attributes) {
      const entityStep = Number(entity.attributes.target_temp_step);
      if (Number.isFinite(entityStep) && entityStep > 0) {
        return entityStep;
      }
    }
    return 0.5;
  };

  ThermostatUI.prototype._hasSetpointChanged = function(snapshot) {
    if (!snapshot) {
      return true;
    }
    const changed = (current, original) => {
      const cur = coerceNumber(current);
      const base = coerceNumber(original);
      if (cur === null && base === null) {
        return false;
      }
      if (cur === null || base === null) {
        return true;
      }
      return Math.abs(cur - base) > CODEX_EPSILON;
    };
    return changed(this._target, snapshot.target) ||
      changed(this._low, snapshot.low) ||
      changed(this._high, snapshot.high);
  };

  ThermostatUI.prototype._quantizeSetpoints = function() {
    const step = resolveStep(this);
    const clampValue = (value) => codexClamp(value, this.min_value, this.max_value);
    if (Number.isFinite(this._target)) {
      this._target = clampValue(quantizeValue(this._target, step));
    }
    if (Number.isFinite(this._low)) {
      this._low = clampValue(quantizeValue(this._low, step));
    }
    if (Number.isFinite(this._high)) {
      this._high = clampValue(quantizeValue(this._high, step));
    }
    if (Number.isFinite(this._low) && Number.isFinite(this._high) && this._low > this._high) {
      const mid = clampValue((this._low + this._high) / 2);
      this._low = mid;
      this._high = mid;
    }
  };

  ThermostatUI.prototype._updateSetpointLabels = function() {
    const hvacDual = this.hvac_state === 'heat_cool' || this.hvac_state === 'auto';
    const dualActive = hvacDual && Number.isFinite(this._low) && Number.isFinite(this._high);
    this._updateClass('has_dual', dualActive);
    if (dualActive) {
      this._updateText('target', null);
      this._updateText('low', this._low);
      this._updateText('high', this._high);
    } else {
      this._updateText('target', Number.isFinite(this._target) ? this._target : null);
      this._updateText('low', null);
      this._updateText('high', null);
    }
    if (this.temperature && Number.isFinite(this.temperature.ambient)) {
      this._updateText('ambient', this.temperature.ambient);
    }
  };

  ThermostatUI.prototype._updateFromPointer = function(event) {
    const context = this._dragContext;
    if (!context) {
      return false;
    }
    const normalizedAngle = this._pointerNormalizedAngle(event);
    if (normalizedAngle === null) {
      return false;
    }
    const config = this._config || {};
    const arc = Number(config.tick_degrees) || 360;
    const deltaAngle = this._angleDelta(normalizedAngle, context.lastAngle, arc);
    context.lastAngle = normalizedAngle;
    const totalRange = Math.max(this.max_value - this.min_value, Number.EPSILON);
    const valueDelta = deltaAngle / arc * totalRange;
    if (!valueDelta) {
      return false;
    }
    const preview = context.preview || (context.preview = {
      target: this._target,
      low: this._low,
      high: this._high
    });
    const applyChange = (type) => {
      const slotKey = '_' + type;
      let current = coerceNumber(preview[type]);
      if (current === null) {
        current = coerceNumber(this[slotKey]);
      }
      if (current === null) {
        current = type === 'high' ? this.max_value : this.min_value;
      }
      let next = current + valueDelta;
      let min = this.min_value;
      let max = this.max_value;
      if (type === 'low' && Number.isFinite(this._high)) {
        max = Math.min(max, this._high);
      }
      if (type === 'high' && Number.isFinite(this._low)) {
        min = Math.max(min, this._low);
      }
      const clamped = codexClamp(next, min, max);
      const hitLimit = clamped !== next;
      preview[type] = clamped;
      this[slotKey] = clamped;
      return {
        changed: Math.abs(clamped - current) > CODEX_EPSILON,
        hitLimit,
        value: clamped
      };
    };
    const dragType = context.type === 'low' || context.type === 'high' ? context.type : 'target';
    const result = applyChange(dragType);
    if (result.hitLimit) {
      this._triggerLimitFlash(deltaAngle >= 0 ? 1 : -1);
    }
    if (result.changed) {
      if (Number.isFinite(result.value)) {
        this._ringRotation = this._computeRingRotationFromValue(result.value);
        this._applyRingRotation();
      }
      this._updateSetpointLabels();
      this._renderDial({
        refreshDialog: false,
        hass: this._lastHass,
        updateAmbient: false,
        resetEdit: false
      });
      return true;
    }
    return false;
  };
}









