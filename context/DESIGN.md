---
version: alpha
name: Tomorro Dark Neon
description: A high-contrast, enterprise SaaS system with editorial hero typography and a vivid neon-green accent.
colors:
  primary: "#68EF3F"
  primary-contrast: "#273F2B"
  secondary: "#121212"
  tertiary: "#1F331D"
  neutral: "#FFFFFF"
  neutral-90: "#DCDDE0"
  surface: "#172318"
  on-surface: "#FFFFFF"
  muted: "#B8C0B5"
  border: "#2D3B2A"
  error: "#FF5A5F"
typography:
  headline-display:
    fontFamily: Ozik
    fontSize: 75px
    fontWeight: 700
    lineHeight: 90px
    letterSpacing: -0.75px
  headline-lg:
    fontFamily: Ozik
    fontSize: 52px
    fontWeight: 700
    lineHeight: 67px
    letterSpacing: -0.75px
  headline-md:
    fontFamily: Aeonik
    fontSize: 36px
    fontWeight: 500
    lineHeight: 41px
    letterSpacing: -1px
  headline-sm:
    fontFamily: Aeonik
    fontSize: 24px
    fontWeight: 500
    lineHeight: 29px
    letterSpacing: -0.3px
  body-lg:
    fontFamily: Aeonik
    fontSize: 17px
    fontWeight: 500
    lineHeight: 25px
    letterSpacing: 0px
  body-md:
    fontFamily: Aeonik
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: Aeonik
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: Aeonik
    fontSize: 15px
    fontWeight: 500
    lineHeight: 22px
    letterSpacing: 0px
  label-md:
    fontFamily: Aeonik
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  label-sm:
    fontFamily: Aeonik
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0px
  overline:
    fontFamily: Aeonik
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 14px
  xl: 26px
  full: 9999px
spacing:
  xs: 8px
  sm: 18px
  md: 38px
  lg: 60px
  xl: 90px
  gutter: 24px
  section: 120px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    typography: "{typography.label-md}"
    rounded: "{rounded.xl}"
    padding: 12px 19px
    height: 46px
  button-primary-hover:
    backgroundColor: "#5BE337"
    textColor: "{colors.primary-contrast}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.xl}"
    padding: 12px 19px
    height: 46px
  button-secondary-hover:
    backgroundColor: "#233224"
    textColor: "{colors.neutral}"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.lg}"
    padding: 15px 22px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  chip:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 8px 14px"
---

# Tomorro Dark Neon

## Overview
Tomorro presents as a bold enterprise SaaS brand: confident, modern, and slightly theatrical. The visual tone is dark and spacious, with a neon-green accent that signals innovation, speed, and AI-forward functionality without feeling chaotic. The audience appears to be business teams evaluating contract-management software, so the system balances credibility with a high-energy, marketing-led hero style.

## Colors
- **Primary (#68EF3F):** A vivid electric lime used for the main call-to-action, AI highlights, badges, and attention-grabbing emphasis. It is the signature brand signal and should stay reserved for the most important interactive or semantic accents.
- **Secondary (#121212):** A near-black forest tone used as the dominant page background. It creates a cinematic stage for the white typography and green accent while keeping the interface premium and focused.
- **Tertiary (#1F331D):** A deep mossy green used for subtle panels, pill backgrounds, and quiet supporting surfaces. It keeps the dark palette layered without introducing strong contrast.
- **Surface (#172318):** A slightly lifted dark green surface for cards, chips, and UI containers that need separation from the background. It should feel tonal rather than obviously elevated.
- **On-surface (#FFFFFF):** Crisp white used for most text, icons, and high-contrast UI elements on dark backgrounds.
- **Neutral-90 (#DCDDE0):** A cool light gray for secondary copy and supporting metadata where pure white would feel too loud.
- **Muted (#B8C0B5):** A softer desaturated green-gray for low-emphasis text and trust signals.
- **Border (#2D3B2A):** A restrained green-black border tone for dividers and component outlines when needed.
- **Primary-contrast (#273F2B):** The dark text color used on neon buttons so the accent remains legible and grounded.
- **Error (#FF5A5F):** A standard alert red for validation and destructive states; it should be used sparingly because the brand language is otherwise predominantly green and dark.

## Typography
Tomorro uses two distinct families: Ozik for hero and large editorial headlines, and Aeonik for everything operational and interface-driven. Ozik is highly expressive, heavy, and compact, which gives the landing page its signature “broadcast” feel; Aeonik softens the system with clean, readable geometry for body copy, labels, and navigation. Headings favor tight tracking and strong weight, while smaller UI text remains calm and functional.

Uppercase is used selectively for emphasis in the brand wordmark and some micro UI moments, but the overall system is not letterspaced or shouted across all components. Body copy should remain sentence case and avoid decorative tracking except in overlines or tiny badges where a slight spacing increase helps clarity.

## Layout
The layout is centered and hero-led, with large vertical breathing room and a fixed-max-width feel rather than a dense fluid dashboard grid. Content stacks in a clear hierarchy: top navigation, announcement chip, oversized headline, supporting paragraph, primary actions, trust logos, and a large product visual angled into the lower area. Spacing is generous and rhythmic, using the larger values in the scale for section separation and the smaller values for intra-component padding.

Use strong center alignment for landing-page marketing blocks and avoid overly tight clustering. Cards and pills should keep comfortable internal padding, while broader sections should preserve the spacious, cinematic composition seen in the screenshot.

## Elevation & Depth
The interface is intentionally flat and tonal rather than shadow-heavy. Depth comes primarily from contrast between near-black backgrounds, slightly lighter green surfaces, and the bright neon primary color. Shadows are minimal to none, so hierarchy should be created with color temperature, opacity, and scale instead of heavy drop shadows.

When elevation is needed, prefer subtle borders or slightly lighter surfaces over raised effects. The result should feel premium, modern, and controlled rather than glossy or materially layered.

## Shapes
The shape language is soft and pill-heavy. Buttons, announcement chips, and small badges use generous full or extra-large radii, which makes the interface feel approachable against the otherwise severe dark background. Cards are a bit more restrained with medium-large rounding, but still avoid sharp architectural corners.

Overall, the system should read as rounded and friendly, with no hard-edged industrial geometry unless a specific utility element requires it.

## Components
Buttons are the most important expressive component. Use `button-primary` for the bright neon call to action: it should be compact, pill-shaped, and bold, with dark green text for contrast. `button-secondary` is the dark inverse style used for supporting actions, while `button-link` is reserved for lightweight navigation or inline actions. Hover states should slightly deepen or brighten the base tone rather than introducing shadows or motion-heavy effects.

Cards use the dark surface tone and subtle rounding from `card`, with clean borders and modest padding. They should feel like embedded panels, not floating tiles. Inputs should follow the same tonal logic: dark surfaces, light text, soft rounded corners, and minimal chrome. When icons are present, keep them simple and monochrome unless they are part of the accent system.

Chips and pills should use the tertiary or surface-toned backgrounds with white text, especially for announcement banners, hiring tags, or event notices. They should remain compact and visually quiet so the primary CTA and headline retain dominance.

Navigation items are simple text links with occasional dropdown indicators, not button-like tabs. Trust logos should be monochrome white and treated as supporting proof rather than active brand elements.

## Do's and Don'ts
- Do keep the neon green reserved for primary actions, critical highlights, and AI emphasis.
- Do use Aeonik for body text, navigation, labels, and interface content.
- Do use Ozik only for large headlines and hero statements where the brand needs personality.
- Do preserve the spacious, centered landing-page rhythm with generous vertical padding.
- Don't introduce heavy shadows, glossy gradients, or skeuomorphic depth.
- Don't use multiple bright accent colors; the system should stay centered on dark green and lime.
- Don't make buttons square or sharp-cornered; the pill shape is part of the brand identity.
- Don't overload the page with dense copy blocks or busy borders that fight the hero composition.