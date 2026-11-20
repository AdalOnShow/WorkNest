# WorkNest Design System: Mono

A quiet, monochrome product style. Surfaces are white and near-black, there is a single blue accent, and hairline borders do the structural work. UI text is Geist; headlines are set in Source Serif 4 at a regular weight. The signature shape is the **chamfer**: buttons and feature cards have two cut corners (top-left and bottom-right). There are **no gradients, glows or gradient text.**

Every value is a CSS variable in `src/styles.css` (`:root` = light, `.dark` = dark). The `@theme inline` block maps them to Tailwind utilities. **Never hard-code hex values in components.**

## Palette

| Role        | Light     | Dark      | Token / utility                               |
| ----------- | --------- | --------- | --------------------------------------------- |
| Background  | `#FFFFFF` | `#0A0A0A` | `bg-background`, `bg-card`                    |
| Foreground  | `#0A0A0A` | `#FAFAFA` | `text-foreground`, `bg-ink`, `bg-foreground`  |
| Muted       | `#F5F5F5` | `#171717` | `bg-muted`, `bg-secondary`, `bg-accent`       |
| Muted text  | `#737373` | `#A3A3A3` | `text-muted-foreground`                       |
| Border      | `#E5E5E5` | `#262626` | `border-border` (use `/60` inside app panels) |
| Accent blue | `#2F80FF` | `#4D9BFF` | `bg-primary`, `text-primary`                  |
| Destructive | `#D92D33` | `#F0595E` | `bg-destructive`, overdue, high priority      |

**Blue ramp** for chart and heat fills: `bg-blue-1` … `bg-blue-4`
(light `#E6EEFF #9BC0FF #3B76FF #2F80FF`, dark `#05122E #0A235C #1466FF #4D9BFF`).

The old role names still exist so existing variants keep working:

- `lime` is a pale blue chip (`#E6EEFF` / `#0A235C`) for positive states.
- `sky` is a neutral muted chip.
- `highlight` is a pale amber chip for warnings.

**Status:** todo is neutral grey, in progress is light blue, active and completed are accent blue, on hold is amber.
**Priority (charts):** low is light blue, medium is accent blue, high is red.

## Typography

- **Geist** (`font-sans`) is the body and UI font, at weight 400–600.
- **Source Serif 4** (`font-serif`, `--font-heading`) is used for `h1` and `h2` at **weight 400**, with `tracking-[-0.01em]` and tight leading (1.08–1.12).
  - Hero `h1`: `text-4xl sm:text-5xl lg:text-[3.5rem]`.
  - Section `h2`: `text-3xl sm:text-4xl lg:text-[2.75rem]`.
  - `h3` stays in Geist at 600 with tight tracking.
- **Geist Mono** (`font-mono`) is for dates, counts, step numbers and the `eyebrow` labels.
- App UI is small and dense:
  - Panel titles are `text-[13px] font-semibold tracking-tight`.
  - Meta text is `text-[11px] text-muted-foreground`.
  - KPI numbers use `stat-number`.
- Utilities: `headline-sm|md|lg` (serif), `eyebrow` (mono, uppercase, 11px), `label-sm`, `label-lg`, `body-sm`, `body-md`, `stat-number`.

## Shape

- `--radius` is `0.5rem`. App panels and KPI tiles use `rounded-lg border border-border/60 bg-background`.
- `chamfer` is a utility that applies the cut-corner `clip-path`; its size comes from `--cut` (8px default; override with `[--cut:14px]`).
  - Button `default`, `outline`, `secondary` and `destructive` are chamfered. Their focus rings are inset, because `clip-path` hides outer rings.
  - For a chamfered card with a hairline border, nest two chamfers: an outer `bg-border p-px` and an inner `bg-background`.
- Badges are `rounded-[3px]`, `text-[11px]` and semibold.
- Progress and share bars are 6px tall with `rounded-[2px]`.

## Layout

- Landing sections sit in `Container` (`max-w-[1440px] px-5 sm:px-8 lg:px-10`) and are spaced with `pb-24 sm:pb-32`.
- The landing nav is fixed and transparent at the top. Once the page scrolls, it gains `bg-background/85`, a backdrop blur and a border.
- The app sidebar is 212px wide, uses `bg-sidebar`, has a mono "Workspace" label and 13px items.
- The dashboard runs, top to bottom: a status pill, the serif "Overview" title, four KPI tiles, then panels on a 3-column grid with `gap-3`.

## Do

- Use hierarchy from size, weight and muted text, not from colour.
- Keep blue for the one thing that matters in each view: an active state, the main data series, or a positive delta.
- Use hairline borders (`border-border/60`) and plenty of whitespace.

## Don't

- Gradients, glows, coloured shadows or gradient text.
- Bold serif headlines. The serif is always 400.
- More than one accent colour per view, apart from red for errors and overdue items.
- Raw hex in components.
