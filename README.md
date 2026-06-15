# PITWALL

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

A small Formula 1 dashboard. It shows the next race, the season calendar, and the current
standings, pulling live data from the free public [f1api.dev](https://f1api.dev) API. No
build step, no framework, no API key.

## Sections

- **Up Next** — the upcoming race weekend
- **Calendar** — the full season schedule
- **Standings** — current driver/constructor standings

## Tech

- Plain HTML, CSS, and vanilla JavaScript (`fetch` against `https://f1api.dev/api/`)
- No dependencies and no build

## Run it

It's fully static, so any static server works:

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

(Needs an internet connection for the F1 API and Google Fonts.)

## Structure

```
index.html        # markup for the three sections
css/styles.css    # styling
js/app.js         # fetches and renders the F1 data
```

## Note

Data comes from the community f1api.dev service; if a section is empty, the API may be
rate-limited or temporarily down.
