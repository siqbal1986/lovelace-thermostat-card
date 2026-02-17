# Figma Carousel Control Card

A Home Assistant Lovelace custom card that recreates the Figma vacuum-control layout.

## Install

Add this file as a Lovelace module resource:

```yaml
resources:
  - url: /local/vacuum_ccard/main.js
    type: module
```

## Card type

```yaml
type: custom:figma-carousel-control-card
```

## Configuration

```yaml
type: custom:figma-carousel-control-card
sensors:
  - entity: sensor.vacuum_battery
    name: Battery
  - entity: sensor.vacuum_area
    name: Area
actions:
  - entity: vacuum.abc
  - entity: button.vacuum_home
buttons:
  - entity: select.vacuum_mode
  - entity: select.vacuum_water_level
  - entity: switch.vacuum_boost
images:
  - /local/vacuum/mode.gif
  - /local/vacuum/water.gif
  - /local/vacuum/boost.gif
```

## Behavior

- `sensors` are rendered in the top glass status bar.
- `actions` are rendered in the action row.
  - `vacuum.*` entries create Start / Stop / Pause / Go Home buttons.
  - `button.*` entries call `button.press`.
- `buttons` are rendered in the right-side button grid.
- `images` are rendered in the left carousel panel.
- Button entities and images map by index (1-to-1).
- Clicking a right-side button opens its options overlay:
  - `select` / `input_select`: displays options and calls `select_option`.
  - `switch` / `input_boolean`: displays On/Off and calls `turn_on` / `turn_off`.
