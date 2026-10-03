'use strict';

const app = document.querySelector('#app');

let book,
  servings,
  wake = null,
  wakeWanted = false,
  routeToken = 0;

const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c]
  );

const getPref = () => {
  try {
    return localStorage.getItem('recipe-theme');
  } catch {
    return null;
  }
};

const setTheme = dark => {
  document.body.classList.toggle('dark', dark);
  document.querySelector('#theme').textContent =
    dark ? 'Light mode' : 'Dark mode';

  document.querySelector('#theme').setAttribute(
    'aria-pressed',
    String(dark)
  );
};

setTheme(
  getPref()
    ? getPref() === 'dark'
    : matchMedia('(prefers-color-scheme:dark)').matches
);

document.querySelector('#theme').onclick = () => {
  const dark = !document.body.classList.contains('dark');

  setTheme(dark);

  try {
    localStorage.setItem('recipe-theme', dark ? 'dark' : 'light');
  } catch {}
};

function image(item) {
  return item.photo
    ? `<img class="photo" src="${esc(item.photo)}" alt="${esc(item.name || item.title)}" loading="lazy">`
    : `<div class="placeholder" style="--tone:${esc(item.color || '#789b96')}">${esc(item.name || item.title)}<small>Photo placeholder</small></div>`;
}

function stars(rating) {
  return `<span class="stars" role="img" aria-label="${rating} out of 5 stars">${Array.from(
    { length: 5 },
    (_, i) =>
      `<span class="star" aria-hidden="true">★<i style="width:${Math.min(1, Math.max(0, rating - i)) * 100}%">★</i></span>`
  ).join('')}</span>`;
}

function card(r) {
  return `<a class="card" href="#recipe/${encodeURIComponent(r.id)}"><div class="visual">${image(r)}</div><div class="card-content"><h2>${esc(r.title)}</h2>${stars(r.rating)}<div class="metadata">${esc(r.prepMinutes + r.cookMinutes)} min · ${esc(r.servings)} servings${r.sample ? ' · Sample' : ''}</div></div></a>`;
}

function search(list) {
  const input = document.querySelector('#search'),
    grid = document.querySelector('#results');

  input.oninput = () => {
    const q = input.value.trim().toLowerCase();

    const found = list.filter(r =>
      (r.title + ' ' + (r.tags || []).join(' '))
        .toLowerCase()
        .includes(q)
    );

    grid.innerHTML = found.length
      ? found.map(card).join('')
      : '<p class="muted">No recipes found.</p>';
  };
}

async function releaseWake() {
  if (wake) {
    const lock = wake;
    wake = null;

    try {
      await lock.release();
    } catch {}
  }
}

function wakeStatus(msg) {
  const el = document.querySelector('#wake-status');

  if (el) {
    el.textContent = msg;
  }
}

async function acquireWake() {
  if (
    !wakeWanted ||
    document.visibilityState !== 'visible' ||
    wake
  ) {
    return;
  }

  const token = routeToken;

  try {
    const lock = await navigator.wakeLock.request('screen');

    if (!wakeWanted || token !== routeToken) {
      await lock.release();
      return;
    }

    wake = lock;

    wakeStatus(
      'Screen will stay awake while this recipe is visible.'
    );

    lock.addEventListener('release', () => {
      if (wake === lock) {
        wake = null;
      }

      if (wakeWanted) {
        wakeStatus(
          'Screen-awake request was released by your phone. Toggle it off and on to retry.'
        );
      }
    });
  } catch {
    wakeWanted = false;

    const input = document.querySelector('#awake');

    if (input) {
      input.checked = false;
    }

    wakeStatus(
      'Your phone could not keep the screen awake. Please try again.'
    );
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    acquireWake();
  }
});

function quantity(n) {
  const rounded = Math.round(n * 100) / 100;

  const whole = Math.floor(rounded),
    fraction = rounded - whole;

  const fractions = [
    [.125, '⅛'],
    [.25, '¼'],
    [1 / 3, '⅓'],
    [.5, '½'],
    [2 / 3, '⅔'],
    [.75, '¾']
  ];

  const f = fractions.find(
    ([v]) => Math.abs(fraction - v) < .006
  );

  return f
    ? (whole ? whole + ' ' : '') + f[1]
    : String(rounded);
}

function renderIngredients(r) {
  document.querySelector('#ingredients').innerHTML =
    r.ingredients
      .map(
        i =>
          `<li><span class="amount">${i.amount === null ? esc(i.quantityText || '') : quantity(i.amount * servings / r.servings)} ${esc(i.unit || '')}</span> ${esc(i.name)}${i.note ? ` <span class="muted">(${esc(i.note)})</span>` : ''}</li>`
      )
      .join('');
}

function render() {
  routeToken++;
  wakeWanted = false;
  releaseWake();

  const parts = location.hash.slice(1).split('/');

  let id;

  try {
    id = decodeURIComponent(parts[1] || '');
  } catch {
    id = '';
  }

  const kind = parts[0];

  document.title = book.appName;
  document.querySelector('.brand').textContent = book.appName;

  if (kind === 'recipe') {
    const r = book.recipes.find(r => r.id === id);

    if (!r) {
      return missing();
    }

    servings = r.servings;

    const category = book.categories.find(
      c => c.id === r.category
    );

    document.title = r.title + ' · ' + book.appName;

    app.innerHTML = `<a class="back" href="#category/${encodeURIComponent(r.category)}">Back to ${esc(category.name)}</a><div class="recipe-hero">${image(r)}</div><h1 class="recipe-title">${esc(r.title)}</h1>${stars(r.rating)}<p class="muted">Prep ${r.prepMinutes} min · Cook ${r.cookMinutes} min</p>${r.sample ? '<p class="notice">Sample recipe — replace with your own before cooking.</p>' : ''}<div class="controls"><label class="servings">Servings <input id="servings" type="number" min="1" max="100" step="1" value="${r.servings}"></label><label class="toggle"><input id="awake" type="checkbox">Keep screen awake</label></div><p id="wake-status" class="notice" role="status"></p><div class="cook-layout"><details class="panel ingredient-panel" open><summary>Ingredients</summary><ul class="ingredients" id="ingredients"></ul><p class="notice">Amounts adjust with servings. Steps, times, and temperatures stay as written.</p></details><section class="panel"><h2>Method</h2><ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${r.notes?.length ? `<div class="note"><h3>Kitchen notes</h3>${r.notes.map(n => `<p>${esc(n)}</p>`).join('')}</div>` : ''}</section></div>`;

    renderIngredients(r);

    document.querySelector('#servings').oninput = e => {
      const n = Number(e.target.value);

      if (Number.isInteger(n) && n >= 1 && n <= 100) {
        servings = n;
        renderIngredients(r);
      }
    };

    document.querySelector('#servings').onchange = e => {
      e.target.value = servings;
    };

    const awake = document.querySelector('#awake');

    if (!navigator.wakeLock || !window.isSecureContext) {
      awake.disabled = true;

      wakeStatus(
        'Screen-awake control requires a supported browser and HTTPS.'
      );
    }

    awake.onchange = async () => {
      wakeWanted = awake.checked;

      if (wakeWanted) {
        await acquireWake();
      } else {
        await releaseWake();
        wakeStatus('');
      }
    };
  } else if (kind === 'category') {
    const c = book.categories.find(c => c.id === id);

    if (!c) {
      return missing();
    }

    const list = book.recipes.filter(
      r => r.category === id
    );

    app.innerHTML = `<a class="back" href="#">Back to categories</a><h1>${esc(c.name)}</h1><input class="search" id="search" type="search" placeholder="Search ${esc(c.name.toLowerCase())}" aria-label="Search recipes"><div class="grid" id="results">${list.length ? list.map(card).join('') : '<p class="muted">No recipes here yet.</p>'}</div>`;

    search(list);
  } else {
    app.innerHTML = `<h1>What are we making?</h1><input class="search" id="search" type="search" placeholder="Find a recipe…" aria-label="Search all recipes"><div id="categories" class="grid">${book.categories.map(c => `<a class="tile" href="#category/${encodeURIComponent(c.id)}">${image(c)}<span class="count" aria-label="${book.recipes.filter(r => r.category === c.id).length} recipes">${book.recipes.filter(r => r.category === c.id).length}</span><span class="caption">${esc(c.name)}</span></a>`).join('')}</div><div class="grid" id="results" hidden></div>`;

    search(book.recipes);

    const input = document.querySelector('#search'),
      handler = input.oninput;

    input.oninput = () => {
      const active = !!input.value.trim();

      document.querySelector('#categories').hidden = active;
      document.querySelector('#results').hidden = !active;

      handler();
    };
  }

  window.scrollTo(0, 0);
}

function missing() {
  app.innerHTML =
    '<h1>Recipe not found</h1><a class="back" href="#">Back to categories</a>';
}

function validate(b) {
  if (
    !b.appName ||
    !Array.isArray(b.categories) ||
    !Array.isArray(b.recipes)
  ) {
    throw Error('Missing appName, categories, or recipes.');
  }

  const categories = new Set();

  for (const c of b.categories) {
    if (!c.id || !c.name || categories.has(c.id)) {
      throw Error(
        'Category IDs must be unique and have names.'
      );
    }

    categories.add(c.id);
  }

  const ids = new Set();

  for (const r of b.recipes) {
    if (
      !r.id ||
      ids.has(r.id) ||
      !r.title ||
      !categories.has(r.category) ||
      !Number.isInteger(r.servings) ||
      r.servings < 1 ||
      !Number.isFinite(r.rating) ||
      r.rating < 0 ||
      r.rating > 5 ||
      r.rating * 2 % 1 ||
      !Array.isArray(r.ingredients) ||
      !Array.isArray(r.steps) ||
      !r.steps.every(s => typeof s === 'string') ||
      ![r.prepMinutes, r.cookMinutes].every(
        n => Number.isFinite(n) && n >= 0
      )
    ) {
      throw Error(
        'Check recipe fields, category, servings, times, and ratings.'
      );
    }

    ids.add(r.id);

    for (const i of r.ingredients) {
      if (
        !i.name ||
        !(
          i.amount === null ||
          Number.isFinite(i.amount) && i.amount >= 0
        )
      ) {
        throw Error(
          'Ingredient amounts must be numbers or null.'
        );
      }
    }
  }
}

fetch('recipes.json', {
  cache: 'no-store'
})
  .then(r => {
    if (!r.ok) {
      throw Error('Recipe file unavailable.');
    }

    return r.json();
  })
  .then(b => {
    validate(b);
    book = b;
    render();

    window.addEventListener('hashchange', render);
  })
  .catch(e => {
    app.innerHTML = `<h1>Couldn’t load recipes</h1><div class="error">${esc(e.message)} Check recipes.json and refresh the page.</div>`;
  });
