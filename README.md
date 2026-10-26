# Portfolio site

Plain static site: hand-written HTML, CSS and JS, no build step, no trackers.

```
index.html        home: hero, work, writing, about, contact
fips-lab/         FIPS Lab case study
  experiments/    write-ups, copied from the fips-lab repo by sync.sh
  web/vendor/     d3, which the write-ups load by relative path
shared-board/     Shared Board case study
  writeup/        its write-up, copied from the shared-board repo by sync.sh
g2c/              G2C case study
  writeup/        its write-up and white-paper.pdf, copied from the g2c repo by sync.sh
mesh.js           the hero's animated mesh (static under reduced motion)
theme.js          light/dark toggle, follows the system until clicked
style.css         same colour tokens as the write-ups
img/              screenshots
```

Live at https://jmevanvalkenhoef.github.io (GitHub Pages, from `main`). Preview: `python3 -m http.server` here and open http://localhost:8000.

After changing a write-up in any project: `./sync.sh` and commit.

Adding a project: a folder with its own `index.html` (copy `fips-lab/index.html`
for the layout), a card under `#work` and its posts under `#writing` in `index.html`.
