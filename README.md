# Look Up

**Look Up** is a location-aware personal sky dashboard built as a static website for GitHub Pages.

It answers a simple question: **what is happening in the sky from here, right now?**

## Version 1 features

- Browser location permission with city-search fallback
- Location remembered on the current device
- 12-hour time by default with a remembered 24-hour option
- Current Moon phase with a graphical illuminated Moon
- Moon illumination, rise/set, next full Moon and next new Moon
- Sunrise, sunset, daylight length, civil twilight and astronomical darkness
- Up to 10 constellations that are genuinely well placed above the horizon
- Naked-eye planet visibility for Mercury, Venus, Mars, Jupiter and Saturn
- Current observing conditions with a simple semicircular Poor → Excellent gauge
- Daylight state without hiding nighttime information
- Current weather with both Celsius and Fahrenheit
- Estimated Bortle light-pollution class in plain language
- Estimated SQM and naked-eye star count when available
- Next actually visible ISS pass, including direction, maximum altitude and approximate distance
- Current humans-in-space counter and ISS crew count when available
- Independent failure states so one unavailable service does not break the whole page

## Main data and calculation sources

- **Astronomy Engine** for Sun, Moon and planet calculations
- **Open-Meteo** for weather and city search
- **OpenStreetMap / Nominatim** for a city-level name when device location is used
- **NordAPI** for an estimated Bortle light-pollution class
- **CelesTrak** for current ISS orbital elements, with public fallback sources
- **satellite.js** for ISS orbit propagation, observer look angles and Earth-shadow calculations
- **Launch Library 2 / The Space Devs** for current human spaceflight counts and active ISS expedition data
- **D3-Celestial** constellation name and line data, used to judge whether constellation shapes are well placed above the horizon

## Light-pollution note

The Bortle value is explicitly shown as an **estimate**. The current source estimates light pollution from nearby population rather than taking a direct sky-brightness measurement from the user's exact location.

## Privacy

Look Up has no account system or custom backend. The chosen location is saved in the browser's local storage. Coordinates are sent only to the public services needed for local weather, place naming and light-pollution results.

## Planned version 2 ideas

- Meteor showers
- Solar and lunar eclipses
- Daytime observing information
- Solar facts
- Solar flare and sunspot monitoring
- Space weather and aurora conditions
- Other useful sky events

## Deployment

The project is designed for GitHub Pages. Put `index.html`, `style.css`, and `app.js` in the repository root and enable Pages from the `main` branch.