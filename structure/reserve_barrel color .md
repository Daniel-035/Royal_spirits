---
name: Reserve & Barrel
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#875200'
  on-secondary: '#ffffff'
  secondary-container: '#ffb151'
  on-secondary-container: '#724400'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1c1a'
  on-tertiary-container: '#858481'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffddba'
  secondary-fixed-dim: '#ffb866'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#673d00'
  tertiary-fixed: '#e5e2df'
  tertiary-fixed-dim: '#c8c6c3'
  on-tertiary-fixed: '#1c1c1a'
  on-tertiary-fixed-variant: '#474745'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  status-placed: '#6B7280'
  status-confirmed: '#3B82F6'
  status-shipping: '#F59E0B'
  status-delivered: '#10B981'
  danger: '#991B1B'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is anchored in a **Corporate / Modern** aesthetic with **Minimalist** restraint, specifically tailored for a premium online liquor experience. It seeks to evoke feelings of heritage, exclusivity, and absolute reliability. The brand personality is that of a knowledgeable sommelier: sophisticated, authoritative, yet digitally proficient.

The visual narrative uses heavy whitespace to let product photography (glassware, amber liquids, labels) serve as the primary visual texture. The interface remains disciplined, avoiding trendy clutter in favor of a "private cellar" atmosphere where trust is paramount for high-value transactions.

## Colors

This design system utilizes a high-contrast, prestigious palette:
- **Primary (Deep Charcoal):** Used for all major text, navigation bars, and structural boundaries. It provides the "weight" necessary for an established brand.
- **Secondary (Rich Amber):** Reserved for primary actions (Add to Cart, Place Order) and highlighting premium brand elements. It mimics the color of aged spirits.
- **Tertiary (Clean Off-White):** Used as a soft background to reduce eye strain and provide a more "paper-like" editorial feel compared to pure white.
- **Status Colors:** Functional hues for order tracking (Placed, Confirmed, etc.) are slightly desaturated to maintain the sophisticated tone.

## Typography

The typographic strategy contrasts the old world with the new. **Libre Caslon Text** is used for headlines to provide a sense of history and editorial quality. **Hanken Grotesk** handles all functional and body text, ensuring high legibility on mobile devices and in data-heavy admin tables. 

All labels and micro-copy should use increased letter spacing when set in uppercase to maintain a premium, architectural feel. Line heights are generous to prevent the dense text blocks often seen in budget e-commerce sites.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop, centering content within a 1280px container to maintain focus. A 12-column system is used for product grids, while a simplified 4-column grid is used for mobile.

- **Rhythm:** An 8px base unit governs all padding and margins.
- **White Space:** For product detail pages, use expansive vertical padding (80px+) between sections to emphasize the premium nature of the goods.
- **Admin Panel:** Uses a fluid layout with a sidebar (240px) to maximize the "Order Management" table real estate.

## Elevation & Depth

To maintain a modern, clean look, this design system avoids heavy drop shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Level 0 is the tertiary background. Level 1 (Cards, Overlays) uses pure white with a 1px border in a very light charcoal (10% opacity).
- **Depth:** Only the Age Verification Gate and floating Action Buttons use a shadow—a soft, diffused "Ambient Shadow" (0px 10px 30px rgba(0,0,0,0.08))—to create a clear separation from the background content.
- **Interactive States:** On hover, product cards should lift slightly using a subtle 1px Amber border rather than a shadow.

## Shapes

The shape language is "Soft" yet disciplined. While the product requires a friendly approach, too much roundness (pills) can feel immature for a premium liquor brand. 

- **Primary Elements:** Buttons and input fields use a standard 4px (0.25rem) radius.
- **Large Elements:** Product cards and Age Verification modals use 8px (0.5rem) to feel approachable but sturdy.
- **Icons:** Use sharp or slightly rounded linear icons to match the Hanken Grotesk font weight.

## Components

### Buttons
- **Primary:** Deep Charcoal background with White text. For the "Add to Cart" and "Checkout" actions. High contrast and authoritative.
- **Secondary:** Rich Amber background with White text. Used for "Featured" items or "Place Order."
- **Ghost:** 1px Charcoal border with no fill. Used for "Edit Cart" or "Back to Browsing."

### Age Verification Overlay
A full-screen modal with a tertiary off-white background. It must feature the brand logo prominently at the top, the "Are you 21+?" question in **headline-lg**, and two large, clear buttons. The "No" button should be a ghost style, while the "Yes" button is the Primary style.

### Product Cards
Pure white background with a 1px light border. Images should be transparent PNGs of bottles. The brand name appears in **label-md** (Amber), product name in **body-lg** (Bold), and price in **body-md**. A discrete "In Stock" indicator uses a small green dot.

### Status Indicators
Small, rounded-pill chips for order status.
- **Backgrounds:** Very light tints of the status colors (10% opacity).
- **Text:** The full-saturation status color in **label-sm**.

### Input Fields
Strictly rectangular with a 4px radius. Uses a 1px charcoal border that thickens and turns Amber on focus. Labels always sit above the field in **label-sm**.