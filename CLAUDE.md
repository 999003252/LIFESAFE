# team6

React + Vite frontend (`frontend/`). Routes are in `src/App.jsx` and all global styling is
one file: `src/index.css`. Calendar styles live in `src/pages/Calendar.css`.

## Styling

The login page defines the look. Reuse it for new screens.

Everything is Montserrat (set globally on `*`). Icons are Material Symbols Rounded,
written as `<i className="material-symbols-rounded">mail</i>` where the text is the icon
name. Comfortaa is imported but unused.

Colors:
- `#1e242d` — text, borders, page background, primary button
- `#161b22` — primary button hover
- `#a395e0` — links, placeholders, input icons
- `#6b7280` — subtitles and fine print
- `#c0392b` — errors
- `#f1eff9` — hover fill on outline buttons
- white cards on the dark background

The card is `.login-container`: 410px wide (`width: 410px; max-width: 100%` — plain
`max-width` lets it shrink to its content, which is the bug we already fixed), centered,
white, `border-radius: 0.5rem`, `padding: 2rem 1.5rem`, soft shadow.

Controls are all 54px tall with `border-radius: 0.31rem` and a `0.2s ease` transition.
Inputs (`InputField.jsx`) have a `1px solid #1e242d` border and a leading icon that sits
in the left padding and darkens on focus. The primary button (`.login-button`) is solid
`#1e242d`; the outline button (`.secondary-button`, also the logout button) is white with
the same border and a lavender hover.

A page is the wordmark, a title, a muted subtitle, then the form — input, optional
error/note, primary button, optional secondary button. Login adds a fine-print legal line
at the bottom. Keep new colors, radii, and heights on these values rather than inventing
new ones.
