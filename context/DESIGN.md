# WorkNest Design System: Sage

A calm, light-first dashboard style. It has soft sage-white surfaces, ink-black buttons, and blue, lime and sky accents used as flat colour blocks. The font is Urbanist. There are **no gradients, glows or gradient text.** Depth comes from surface steps and thin borders.

The style is based on a reference dashboard shot ("LeadNest"). WorkNest keeps its own name, logo and content.

Every value is a CSS variable in `src/styles.css` (`:root` = light, `.dark` = dark). The `@theme inline` block maps them to Tailwind utilities. **Never hard-code hex values in components.**

## Brand palette

| Swatch     | Hex       | Use                                                                   |
| ---------- | --------- | --------------------------------------------------------------------- |
| Blue       | `#5880DA` | `--primary`: links, focus, active, charts, "info" chips               |
| Lime       | `#C9F17E` | `--lime`: positive chips (`+6%`), completed, "new"                    |
| Sky        | `#BCDBFA` | `--sky`: highlighted / priority cards, light chart fill               |
| Sage white | `#F7F9F5` | `--card`: cards, sidebar                                              |
| Ink        | `#23262B` | `--ink`: primary buttons, count badges, logo mark, dark callout cards |
| Yellow     | `#F6D24A` | `--highlight`: follow-up / warning chips, on hold                     |

## Tokens

| Token                | Utility                                  | Light              | Dark                              |
| -------------------- | ---------------------------------------- | ------------------ | --------------------------------- |
| `--background`       | `bg-background`                          | `#ECEEE9`          | `#111311`                         |
| `--card`             | `bg-card`                                | `#F7F9F5`          | `#191B19`                         |
| `--muted`            | `bg-muted`                               | `#EEF0EB`          | `#202320`                         |
| `--accent`           | `bg-accent` (hover/active)               | `#E5E8E1`          | `#262926`                         |
| `--border`           | `border-border`                          | `#E0E3DC`          | `#2A2D2A`                         |
| `--foreground`       | `text-foreground`                        | `#1C1F1D`          | `#EEF1EA`                         |
| `--muted-foreground` | `text-muted-foreground`                  | `#62675F`          | `#8F948B`                         |
| `--primary`          | `bg-primary`, `text-primary`             | `#5880DA`          | `#7C9BE6`                         |
| `--ink`              | `bg-ink`, `text-ink-foreground`          | `#23262B` on white | `#EEF1EA` on `#111311` (inverted) |
| `--lime`             | `bg-lime text-lime-foreground`           | `#C9F17E`          | `#C9F17E`                         |
| `--sky`              | `bg-sky text-sky-foreground`             | `#BCDBFA`          | `#243250`                         |
| `--highlight`        | `bg-highlight text-highlight-foreground` | `#F6D24A`          | `#F6D24A`                         |
| `--destructive`      | `bg-destructive`                         | `#C22F35`          | `#F0595E`                         |
| `--warning-text`     | `text-warning-text`                      | `#7A6000`          | `#F6D24A`                         |

**Status:**

- active: blue
- in-progress: light blue
- completed: lime-green
- on-hold: yellow
- todo: grey

**Priority:** high is red, medium is yellow, low is grey.

**Charts:** blue, lime, sky, yellow, ink.

**Dark mode** keeps the same roles on a slate-blue near-black (background `#0F1420`, cards `#161C2A`, borders `#283043`). Ink inverts to off-white, so primary buttons become light with dark text. Lime and yellow stay bright. Sky becomes a deep blue tint.

## Typography

- **Font:** Urbanist for everything (`font-sans` and `font-headline`), plus Geist Mono for code. Both load from Google Fonts in `__root.tsx`.
- **Weights:** Urbanist runs thin, so body text is **500**, headings are **600**, and emphasis (names, card titles, buttons) is **600–700**. Don't use 300–400 except for deliberately quiet text.

| Utility               | Size / weight       | Use                               |
| --------------------- | ------------------- | --------------------------------- |
| `headline-lg`         | 52px / 700          | Hero                              |
| `headline-md`         | 36px / 600          | Page sections                     |
| `headline-sm`         | 26px / 600          | Page titles                       |
| `label-lg`            | 18px / 600          | Card titles ("Tasks in progress") |
| `label-sm`            | 13px / 600          | Captions                          |
| `body-md` / `body-sm` | 16px / 14px, 500    | Body text                         |
| `stat-number`         | 44px / 600, tabular | KPI numbers ("76")                |

## Components

- **Cards:** `rounded-xl` (16px), `bg-card`, `border border-border`, no shadow.
- **Primary button:** `bg-ink text-ink-foreground`, `rounded-lg` (12px). This is the Button `default` variant. Secondary buttons use the `outline` variant on `bg-card`.
- **Chips / tags:** `rounded-md`, 13px medium. Badge variants are `lime`, `blue`, `sky`, `yellow` and `default` (ink).
- **Count badges:** an ink circle with a white number.
- **Highlighted card:** `bg-sky text-sky-foreground` with no border, for the single most important item.
- **Logo mark:** the Sprout icon in an ink circle.

## Do

- Use colour as flat blocks: chips, highlighted cards, chart fills.
- Keep one ink CTA per view.
- Check both themes.

## Don't

- Don't use gradients, glows, gradient text or coloured shadows.
- Don't use thin (300–400) weights for body text or headings.
- Don't use raw hex or Tailwind palette colours like `bg-green-500` in components. Add a token instead.
