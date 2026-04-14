# Figma Carousel Control Card (Vacuum Dashboard)

`custom:figma-carousel-control-card`

A map-first vacuum dashboard card with a modern app-style layout:

- visual/map area is always present
- grouped settings list with inline toggles
- detail panel (desktop side panel / mobile bottom sheet)
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
- `badges` (array)
- `message`
- `actions` (array of actions/service calls)
- `children` (nested settings)
- `embedded_card`

### Interaction behavior

- **2 options** (switch/input_boolean/select with 2 options) -> inline toggle
- **Multi-option** -> opens detail panel
- **Action** -> executes immediately
- **Embedded** -> opens configured embedded card in visual area

## Responsive behavior

- **Desktop:** top stats, left visual, right grouped settings + inline detail panel, bottom actions.
- **Mobile:** stacked layout, visual still dominant, detail appears as in-card bottom sheet.

## Notes

- `images` drives the main visual carousel.
- `thumb`/`image` can be used for setting row thumbnails.
- `panel_image` is shown inside detail views.
- Embedded cards receive `hass` updates and stay interactive.
