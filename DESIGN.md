---
name: Sovereign Vault Authentication
colors:
  surface: '#f9f9ff'
  surface-dim: '#ccdbf6'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee9ff'
  surface-container-highest: '#d5e3ff'
  on-surface: '#0d1c30'
  on-surface-variant: '#45464e'
  inverse-surface: '#233146'
  inverse-on-surface: '#ebf1ff'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4f5e81'
  primary: '#041534'
  on-primary: '#ffffff'
  primary-container: '#1b2a4a'
  on-primary-container: '#8392b7'
  inverse-primary: '#b7c6ee'
  secondary: '#944b00'
  on-secondary: '#ffffff'
  secondary-container: '#ff9237'
  on-secondary-container: '#693300'
  tertiary: '#001b13'
  on-tertiary: '#ffffff'
  tertiary-container: '#003225'
  on-tertiary-container: '#45a285'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b7c6ee'
  on-primary-fixed: '#0a1a3a'
  on-primary-fixed-variant: '#384668'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#ffb783'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#703700'
  tertiary-fixed: '#98f4d3'
  tertiary-fixed-dim: '#7cd8b8'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513e'
  background: '#f9f9ff'
  on-background: '#0d1c30'
  surface-variant: '#d5e3ff'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit-2xs: 0.25rem
  unit-xs: 0.5rem
  unit-sm: 0.75rem
  unit-md: 1rem
  unit-lg: 1.5rem
  unit-xl: 2rem
  unit-2xl: 2.5rem
  unit-3xl: 3.5rem
  layout-gutter: 1.5rem
  card-max-width: 30rem
  portal-max-width: 75rem
---

## Brand & Style
This design system governs high-assurance digital evidence authentication portals operating under rigorous state and legal oversight. The interface balances absolute institutional authority with streamlined operational efficiency for law enforcement officers, forensic examiners, judicial authorities, and cyber investigation teams. 

The aesthetic is Modern Institutional: an evolution beyond sterile bureaucratic portals into a refined, high-security command interface. Visual gravity is established through deep navy foundations paired with structured, warm off-white backdrops, punctuated by controlled saffron and emerald accents reserved exclusively for official actions and verified trust indicators. 

The emotional signature is uncompromised integrity, cryptographic certitude, and serene order. Every element communicates chain-of-custody validity, audit vigilance, and systemic resilience.

## Colors
The palette balances constitutional gravitas with human-factors legibility:

- **Primary Canvas & Surfaces**: Background surfaces utilize an ivory-tinted warm off-white (`#F7F5F1`), preventing the eye fatigue common to harsh clinical white screens while reinforcing institutional weight. Core interactive surfaces and elevation containers rest on pure crisp white (`#FFFFFF`).
- **Deep Formal Navy (`#1B2A4A` primary, `#101B31` deep shade)**: Communicates supreme institutional authority, operational security, and precision. Applied across primary buttons, structural ribbons, key headers, and active state boundaries.
- **Indian Amber / Saffron Accent (`#E07A1E`, hover `#C76612`, alert tint `#FFF8ED`)**: Derived from sovereign iconography, this serves as an active focus beacon—reserved for high-priority identity assertions, secondary alerts, biometric triggers, and critical state indicators.
- **Trust Emerald (`#0D7A5F`, container `#E7F5EE`, stroke `#9ED8BF`)**: Deployed strictly for certified compliance seals, tamper-evident cryptographic badges, active session validations, and hardware token confirmations.
- **Structural Grays & Borders**: Borders use muted slate (`#E2E8F0` and `#CBD5E1`) to delineate zones without visual clutter. Text neutrals scale from midnight navy slate (`#101B31` for headings, `#243247` for body text) down to formal muted slate (`#64748B` for secondary hints and metadata).

## Typography
Typographic discipline enforces clarity under operational pressure:

- **Headlines & Mastheads**: Plus Jakarta Sans provides clean, contemporary geometry with high legibility. Used for credential headers, verification screens, and dialog prompts.
- **Body & Operational Form Labels**: Inter delivers neutral clarity, distinct glyph recognition, and numerical tabular balance across critical input chains (OTP entry, officer badges, case token IDs).
- **Uppercase Tracking**: The `label-caps` tier is reserved for sovereign entity declarations, classification markers (e.g., "RESTRICTED / SECTION 65B COMPLIANT"), chain-of-custody status, and cryptographic hash labels.
- **Tabular & Cryptographic Elements**: JetBrains Mono is assigned for hardware serials, token IDs, and session challenge nonces to ensure mistyped characters are avoided.

## Layout & Spacing
The layout relies on a centered, high-assurance single-column focus model for authentication flows, transitioning to an asymmetric structural layout for dashboard verification:

- **Authentication Focus Area**: The primary authentication terminal is constrained to a max-width of `30rem` (`480px`) on desktop and tablet views, anchoring the user’s sensory focus strictly on verification actions, badge entry, and audit terms.
- **Base Rhythm**: A strict 8px / 0.5rem structural unit dictates all vertical rhythm and padding. Internal card padding is standardized at `2rem` (`32px`) on desktop and `1.25rem` (`20px`) on mobile viewports.
- **Adaptive Rules**: On screens `< 640px` (mobile), authentication surfaces span full width with `1rem` horizontal safe margins. Above `640px`, the floating card sits vertically centered with balanced visual weight. Top header seals and bottom legal disclosures maintain absolute horizontal centering across all viewports.

## Elevation & Depth
Depth is created through ambient, multi-stop drop shadows rather than sharp contrasts, evoking an authoritative floating vault physical metaphor:

- **Canvas Tier**: Base level (`#F7F5F1`) represents the ambient physical terminal environment.
- **Resting Vault Card**: Crisp white card surface (`#FFFFFF`) elevated with a compound shadow:
  - Ambient base: `0 4px 6px -1px rgba(16, 27, 49, 0.04)`
  - Elevated envelope: `0 20px 25px -5px rgba(16, 27, 49, 0.08), 0 8px 10px -6px rgba(16, 27, 49, 0.04)`
  - Perimeter definition: crisp `1px` border using `#E2E8F0` to maintain absolute spatial boundary.
- **Interactive Modals & Hardware Prompts**: Enhanced elevation with `0 25px 50px -12px rgba(16, 27, 49, 0.18)` and an active top-edge highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.8)`).
- **Embedded Wells & Input Fields**: Subtle inset shading (`inset 0 1px 2px rgba(16, 27, 49, 0.04)`) with neutral background fill (`#F8FAFC`) to evoke physical tactile indentation.

## Shapes
The design uses an intentional, structured shape scale:

- **Vault Containers & Cards**: Fixed at `16px` (`1rem`) border-radius, creating an approachable yet firm physical card feel.
- **Form Fields & Action Buttons**: Standardized at `8px` (`0.5rem`) for a precise, institutional finish.
- **Role Selectors & Trust Indicators**: Fully pill-shaped (`9999px`) to distinguish categorical selectors and status tags from actionable input containers.
- **Segmented Control Base**: `10px` enclosing wrapper containing the internal pill triggers, providing a nested, fitted appearance.

## Components

### Buttons
- **Primary Auth Action**: Deep Navy background (`#1B2A4A`), white high-legibility text (`#FFFFFF`), `8px` border-radius, `48px` minimum touch target height. Subtle hover state shifts to `#101B31` with an amber-tinted focus ring (`box-shadow: 0 0 0 3px rgba(224, 122, 30, 0.35)`).
- **Secondary / Token Verification**: Bordered with `#CBD5E1`, pure white background, `#1B2A4A` typography. Hover brings an off-white tint (`#F1F5F9`).
- **Urgent / Incident Exit**: Ghost styling with dark slate text, transitioning to red-tinted alert on active confirmation.

### Segmented Role Selectors
- A horizontal pill toggle array nested in a `#EEF2F6` container with `4px` padding.
- Selected role: Crisp white pill with `0 2px 4px rgba(16, 27, 49, 0.08)` elevation, navy text, and an active `2px` amber indicator dot.
- Unselected roles: Slate gray text (`#64748B`), transparent background, interactive on hover.

### Form Inputs (Service ID / Smart Card PIN / OTP)
- Minimum height of `46px`, `8px` border-radius.
- Slate border (`#CBD5E1`) on `#F8FAFC` fill at rest.
- Focus state: Crisp white background, `#1B2A4A` border, and high-visibility saffron outer glow (`0 0 0 3px rgba(224, 122, 30, 0.25)`).
- Monospaced numerical fields (OTP / Token Nonces) use centered `code-sm` font with letter-spacing for rapid error-free transcription.

### Compliance Alerts & Audit Acknowledgment
- **Calm Amber Compliance Banner**: Pale amber background (`#FFF8ED`), subtle saffron border (`#FCD34D`), deep amber heading (`#92400E`), and slate body text. Used for legal disclaimers under the IT Act and Bharatiya Sakshya Adhiniyam.
- **Audit Checkbox**: Custom `18px` checkbox with an intentional click target of `44px`. Checking the acknowledgment indicates explicit acceptance of session logging and IP tracking. Unchecked hover emphasizes legal binding.

### Trust Badges & Seals
- **Hardware/Crypto Seal**: Compact pill with `#E7F5EE` background, `#0D7A5F` text, `#9ED8BF` border, housing an emerald lock icon denoting active PKI token encryption.
- **Official Bilingual Footer**: Fixed bottom boundary containing dual-language institutional copy, national emblem placement, security compliance revision IDs, and official cryptographic build signatures.