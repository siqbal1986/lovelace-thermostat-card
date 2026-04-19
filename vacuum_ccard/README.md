# Figma Carousel Control Card (Vacuum Dashboard)

`custom:figma-carousel-control-card`

A map-first vacuum dashboard card with a modern app-style layout:

- visual/map area is always present
- grouped settings list (1-column mobile, 2-column desktop when space allows)
- inline expanding option panels (accordion style)
- nested setting navigation with breadcrumb + back
- embedded card support in the visual area

## Base configuration

```yaml
type: custom:figma-carousel-control-card
images:
  - /local/vacuum/main_map.jpg
  - /local/vacuum/rooms.jpg

sensors:
  - entity: sensor.robot_battery
    name: Battery
    icon: mdi:battery
  - entity: sensor.robot_main_brush_left
    name: Main Brush
    icon: mdi:brush

actions:
  - entity: vacuum.robot

status_lines:
  - values:
      - entity: sensor.robot_battery
        label: Battery
      - entity: sensor.robot_area
        label: Area
      - entity: sensor.robot_runtime
        label: Runtime

embedded_button:
  label: Open live map
  icon: mdi:map-search
  close_label: Back to dashboard
  close_icon: mdi:arrow-left
embedded_card:
  type: map
  entities:
    - device_tracker.robot
  hours_to_show: 6

buttons:
  - entity: select.robot_cleaning_mode
    name: Cleaning Mode
    description: Select suction preset
    group: Cleaning
    thumb: /local/vacuum/modes_thumb.jpg
    panel_image: /local/vacuum/modes_panel.jpg
    badges: [AI Assist, Smart]
    message: Choose a mode based on room traffic.
    options_background: /local/vacuum/water_bg.jpg
    option_media:
      Quiet: /local/vacuum/quiet.gif
      Standard: /local/vacuum/standard.gif
      Turbo: /local/vacuum/turbo.gif

  - entity: switch.robot_mop_boost
    name: Mop Boost
    description: Increase water pressure
    group: Cleaning
    thumb: /local/vacuum/mop.jpg

  - name: Camera View
    description: Open camera/map card
    group: Camera
    behavior: embedded
    thumb: /local/vacuum/camera.jpg
    embedded_card:
      type: picture-entity
      entity: camera.robot_map
      camera_view: live

  - name: Maintenance
    description: Service reminders and reset tools
    group: Maintenance
    panel_image: /local/vacuum/maintenance.jpg
    children:
      - entity: switch.robot_child_lock
        name: Child Lock
        description: Prevent accidental button presses
      - entity: select.robot_voice_volume
        name: Voice Volume
        description: Set robot speaker volume
        panel_image: /local/vacuum/volume.jpg
```

## Button schema

Each item in `buttons:` can use these fields:

- `entity`
- `name`
- `description`
- `group`
- `thumb`
- `image`
- `panel_image`
- `value_label`
- `behavior` (`toggle`, `detail`, `action`, `embedded`)
- `options` (custom option list with per-option `image` / `service` support)
- `option_media` (map option label -> media/image URL shown directly below that option)
- `options_background` (background image for the whole inline options area)
- `badges` (array)
- `message`
- `actions` (array of actions/service calls)
- `children` (nested settings)
- `embedded_card`

### Interaction behavior

- **2 options** (switch/input_boolean/select with 2 options) -> inline toggle
- **Multi-option** -> expands inline in the same row area
- **Action** -> executes immediately
- **Embedded** -> embedded map/card shown in the top visual area

## Responsive behavior

- **Desktop:** top-to-bottom order is status lines -> action buttons -> map/visual -> options menu (options can still use 2 columns if space allows).
- **Mobile:** same top-to-bottom order in a single column, no clipping/overflow, with inline expansion staying in-card.

## Notes

- `images` drives the main visual carousel.
- `thumb`/`image` can be used for setting row thumbnails.
- `panel_image` is shown inside detail views.
- Embedded cards receive `hass` updates and stay interactive.

## Quick preview (local)

If you want to quickly render the card outside Home Assistant, run a local Playwright screenshot script against `vacuum_ccard/main.js` using mock `hass` state.

1. Install browser runtime (first time only):
   - `npx playwright install chromium`
2. Generate screenshots (desktop + mobile) with a small Node script that:
   - registers `ha-card`/`ha-icon` test stubs
   - injects `figma-carousel-control-card`
   - sets `card.setConfig(...)` and `card.hass = ...`
   - captures screenshots for validation

This is useful when iterating on layout, row hierarchy, and responsive behavior before deploying to Lovelace.
