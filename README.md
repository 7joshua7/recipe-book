# Our Recipe Book

A small phone-first recipe app. No dependencies or build process. Categories and recipes come from **recipes.json**. The four included recipes are marked samples: replace them with your own before cooking.

## Publish on GitHub Pages

1. Create a public GitHub repository, for example `recipe-book`.
2. Upload the **contents** of this folder to its root. `index.html` and `recipes.json` should sit directly at the repository root, not inside another folder. Include the `images` folder when you add photos.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Wait for the deployment to complete. GitHub provides a URL such as `https://YOUR-USERNAME.github.io/recipe-book/`.
5. Open that URL on both phones in Chrome. Use **⋮ → Add to Home screen → Install**, or **Install app**, depending on the Chrome version. The installed app opens without the browser address bar.

The repository, recipes, photos, and website are public. Viewing needs no GitHub account. Editing requires access to the repository. This delivery does not create or deploy a repository for you.

## Add a recipe

1. Open `recipe-template.json` and copy its object (including the opening and closing braces).
2. Edit `recipes.json` on GitHub. Paste the object inside its `recipes` array. Put a comma **between** recipe objects; do not put a comma after the last one.
3. Fill out the fields, preview your changes, and commit. GitHub Pages republishes automatically. Allow deployment to finish, then reopen or refresh the app.

The templates are reference files; the app reads only `recipes.json`.

### Recipe fields

| Field | What to enter |
|---|---|
| `id` | Unique stable identifier, such as `chicken-curry`. Keep IDs stable so saved recipe links work. |
| `title` | Display name. |
| `category` | A category's exact `id`. |
| `photo` | Relative photo path, such as `images/chicken-curry.jpg`. Use `""` for a labeled placeholder. |
| `rating` | Your rating from 0 to 5, in increments of 0.5. |
| `servings` | Positive whole number of servings in the original recipe. |
| `prepMinutes`, `cookMinutes` | Nonnegative numbers; use 0 when not applicable. |
| `sample` | `false` for your real recipes. |
| `tags` | Optional search terms, such as `["chicken", "quick"]`. |
| `ingredients` | List of ingredient objects, described below. |
| `steps` | List of instruction strings in order. |
| `notes` | Optional list of note strings, or `[]`. |

### Ingredient amounts and scaling

```json
{"name":"flour","amount":1.5,"unit":"cups","quantityText":"","note":"sifted"}
```

Numeric `amount` values scale by **selected servings ÷ original servings**. Use decimals for fractions: `0.5` for ½, `0.25` for ¼, and `0.333333` for ⅓. Common fractions display as fraction characters; other amounts round to two decimal places. Unit labels remain exactly as written.

For ingredients that should not scale:

```json
{"name":"salt","amount":null,"unit":"","quantityText":"To taste","note":""}
```

For a range, either select a single numeric amount and describe the flexibility in `note`, or use `amount: null` with `quantityText: "1–2"`. Text amounts and ranges do not scale. Avoid putting measurements directly in the ingredient name.

**Recipe steps remain the original text**, including any quantities mentioned there. Prefer wording such as “add the flour” in steps and keep amounts in the ingredient list. Times and temperatures do not scale. Larger batches can require different pans or cooking times; add guidance in notes. Fractional eggs are displayed numerically—use beaten egg portions or practical judgment.

The serving selector accepts 1–100 whole servings and resets to the original serving count when a recipe is opened.

## Categories and photos

Copy `category-template.json` into the `categories` array in `recipes.json`. Set a unique `id`, display `name`, and optional `photo`. A category appears even when empty; its count is calculated automatically.

To rename a category, change only its `name`. If you change its `id`, update every recipe's `category` to match. Array order controls category and recipe display order.

Upload photos into `images/` and use paths such as `images/desserts.jpg`. Filenames are case-sensitive. Use lowercase names without spaces. Compress large phone photos to roughly 1200px wide to keep loading fast. Category tiles crop square; recipe cards and headers crop wider. If no photo is provided, a labeled placeholder is shown. `color` is an optional CSS hex color for category placeholders.

## Recipe file syntax

Use double quotes for all strings and keys. No comments or trailing commas are allowed in JSON. Escape quotes inside text with `\"`. Keep `ingredients`, `steps`, and `notes` as arrays. Duplicate IDs, invalid categories, unsupported ratings, and invalid ingredient amounts cause a visible load error so broken content is easy to notice. Check the complete JSON file after editing before committing.

## App behavior

- Dark mode follows the phone's preference initially. Your manual choice is saved on that device.
- Ingredients collapse in portrait. In landscape, at widths of 600px or more, ingredients and steps sit side by side. The ingredient panel scrolls independently when necessary.
- Keep screen awake is opt-in for each opened recipe and requires HTTPS and a supported browser. Phones may release it for power saving or when the page is hidden. The app attempts to reacquire it when you return. It releases the lock when you leave a recipe.
- No offline recipe support or service worker is included. Internet access is required to load recipes. Home-screen installation and offline support are separate features.
- Recipe data is requested fresh when the app opens. Normal browser caching may still apply to code and photos; refresh after an update, and use new photo filenames when replacing cached photos.
- Recipe URLs use hashes, so direct links work on GitHub Pages without server routing rules.

## Local preview

From this folder, run `python -m http.server 8000` and open `http://localhost:8000`. Do not open `index.html` directly from disk: browsers may block loading the recipe data. Phone installation and wake-lock behavior should be checked on the published HTTPS URL.

## Files

`index.html`: shell • `styles.css`: appearance/layout • `app.js`: navigation/scaling/wake lock • `recipes.json`: all content • `manifest.webmanifest` and icons: installation • template files: copyable examples.

If you change the app name, update `appName` in `recipes.json` and `name`/`short_name` in `manifest.webmanifest`. Replace both PNG icons to customize the home-screen icon.
