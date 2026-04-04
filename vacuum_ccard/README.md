# Figma Carousel Control Card

`custom:figma-carousel-control-card`

## Config

```yaml
type: custom:figma-carousel-control-card
sensors:
  - entity: sensor.vacuum_battery
    name: Battery
actions:
  - entity: vacuum.my_vacuum
buttons:
  - entity: select.vacuum_mode
  - entity: switch.vacuum_boost
images:
  - /local/vacuum/mode.gif
  - /local/vacuum/boost.gif
embedded_button:
  label: Open map
  icon: mdi:map-search
  close_icon: mdi:arrow-left
  close_label: Back to controls
embedded_card:
  type: map
  entities:
    - device_tracker.robot_vacuum
  hours_to_show: 6
```


### Example: embed dreame-vacuum card

```yaml
type: custom:figma-carousel-control-card
buttons:
  - entity: select.dreame_cleaning_mode
images:
  - /local/vacuum/idle.png
embedded_button:
  label: Open Dreame map
  icon: mdi:map
  close_label: Back
  close_icon: mdi:arrow-left
embedded_card:
  type: custom:dreame-vacuum-card
  entity: vacuum.dreame_l10s_ultra
  map_key: map
```

## Notes
- No carousel auto-advance.
- Image slide transition is left-to-right style with ~1.2s duration.
- Options overlay is transparent and option buttons are subtle/outlined.
- `embedded_button` is optional; when configured with `embedded_card`, clicking it replaces the preview/menu area with a full-size Lovelace card container.
- Embedded card area now captures click/touch input directly so interactive cards (like `custom:dreame-vacuum-card`) remain fully usable.
