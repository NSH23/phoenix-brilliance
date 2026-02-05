# SplitScreenHero

Premium split-screen hero section with auto-transitioning event showcases for luxury events companies.

## Usage

```tsx
import { SplitScreenHero, DEFAULT_SCENES } from "@/components/SplitScreenHero";

<SplitScreenHero scenes={DEFAULT_SCENES} id="home" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scenes` | `Scene[]` | required | Array of scene data (image, content, colors, CTA) |
| `autoPlayInterval` | `number` | `5000` | Auto-transition interval in ms |
| `enableKeyboardNav` | `boolean` | `true` | Arrow keys, Space, 1-4 for navigation |
| `pauseOnHover` | `boolean` | `true` | Pause auto-play when mouse is over hero |
| `showNavigationDots` | `boolean` | `true` | Show scene indicator dots |
| `showArrowButtons` | `boolean` | `false` | Show prev/next arrow buttons |
| `onSceneChange` | `(index: number) => void` | - | Callback when scene changes |
| `className` | `string` | `""` | Additional CSS classes |
| `id` | `string` | - | HTML id for anchor linking |

## Keyboard Shortcuts

- **←** Previous scene
- **→** Next scene
- **Space** Pause/Resume
- **1-4** Jump to scene

## Scene Data

Each scene includes: `eyebrow`, `companyName`, `tagline`, `message`, `ctaText`, `ctaLink`, `imageUrl`, `imageAlt`, `backgroundColor`, `textColor`, `accentColor`.
