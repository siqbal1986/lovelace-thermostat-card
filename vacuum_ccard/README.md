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
```

## Notes
- No carousel auto-advance.
- Image slide transition is left-to-right style with ~1.2s duration.
- Options overlay is transparent and option buttons are subtle/outlined.
