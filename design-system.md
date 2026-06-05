# Design System — Ms. Tra Vocab App

## Triết lý thiết kế
**Warm Editorial** — cảm giác như đọc sách từ điển cao cấp nhưng trên điện thoại.
Serif font cho từ vựng (trang trọng, dễ đọc), Sans font cho UI (gọn, hiện đại).

---

## Typography

| Token | Value | Dùng khi |
|---|---|---|
| `--font-display` | Lora (serif) | Word, meanings, headings |
| `--font-body` | DM Sans | UI, labels, buttons, stats |

### Font sizes
- Word display: `clamp(32px, 10vw, 52px)` — responsive
- IPA: `16px`  
- Body: `14–15px`
- Labels/hints: `11–12px`

---

## Color Tokens

### Light mode
```css
--bg-page:     #f5f3ee   /* warm off-white */
--bg-card:     #ffffff
--bg-surface:  #edeae3   /* slightly warm gray */
--text-primary:   #1a1a1a
--text-secondary: #5a5651
--text-muted:     #9b9590
--accent:      #2563c4   /* IELTS blue */
--border:      rgba(0,0,0,0.08)
```

### Dark mode
```css
--bg-page:     #0f1117   /* deep navy-black */
--bg-card:     #1c2030
--bg-card-back: #0d1525  /* even darker for card back */
--accent:      #4a8aff   /* lighter blue for dark bg */
```

### POS badge colors
| Part of speech | Background | Text |
|---|---|---|
| noun | `#dbeafe` | `#1e40af` |
| verb | `#dcfce7` | `#166534` |
| adjective | `#fef3c7` | `#92400e` |
| adverb | `#ede9fe` | `#5b21b6` |
| phrase/idiom | `#fee2e2` | `#991b1b` |

---

## Spacing Scale

```
--sp-1: 4px   --sp-2: 8px   --sp-3: 12px  --sp-4: 16px
--sp-5: 20px  --sp-6: 24px  --sp-8: 32px  --sp-10: 40px
```

---

## Border Radius

```
--r-sm:   8px    (tags, chips)
--r-md:   14px   (cards, buttons)
--r-lg:   20px   (stat cards)
--r-xl:   28px   (flashcard)
--r-full: 9999px (pills, nav active)
```

---

## Motion

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* bouncy, cho buttons/cards */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)        /* smooth, cho transitions */
--dur-fast: 140ms    (hover, tap feedback)
--dur-mid:  240ms    (view switches, theme)
--dur-slow: 380ms    (card flip entrance)
```

### Animation list
| Tên | Mô tả |
|---|---|
| `card-in` | Card entrance — fade + slide up + scale |
| `exit-right` | Swipe right (Easy) |
| `exit-left`  | Swipe left (Hard) |
| `exit-up`    | Rate okay — swipe up |
| `pulse-ring` | Audio button playing state |
| `shimmer`    | Skeleton loader |

---

## Component Patterns

### Flashcard
- Aspect ratio: `5/6` (mobile) → `5/7` (tall screen) → `5/4` (short screen)
- Front: white, serif word, centered
- Back: dark navy (`--bg-card-back`), structured info layout
- Flip: CSS 3D transform rotateY, 0.55s

### Bottom Nav
- 3 tabs: Học / Từ điển / Tiến độ
- Safe area inset bottom support
- Frosted glass: `backdrop-filter: blur(12px)`

### Rating Buttons
- 3 columns: Khó 🔁 / Ổn 👍 / Dễ ✅
- Disabled (opacity 0.3) until card is flipped
- Keyboard: ← Hard, ↑ Okay, → Easy, Space Flip, A Audio

---

## PWA Checklist

- [x] `manifest.json` — name, icons, theme_color, display: standalone
- [x] `sw.js` — Service Worker với cache strategies
- [x] `<meta name="apple-mobile-web-app-capable">` — iOS support
- [x] `safe-area-inset` padding — iPhone notch/home bar
- [x] `min-height: 100dvh` — dynamic viewport height
- [x] Theme color meta — browser chrome color

### Cache strategies
| Resource | Strategy |
|---|---|
| HTML/CSS/JS | Cache-first |
| JSON vocabulary data | Network-first, fallback cache |
| Audio files | Cache-first (after first play) |

---

## File Structure

```
vocab-app/
├── index.html          ← Main app (mobile-first)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker
├── design-system.md    ← This file
├── data/
│   ├── cambridge-ielts-reading-16.json
│   ├── oxford3000.json
│   └── oxford5000.json
├── audio/
│   └── azure-*.mp3     ← Word audio files
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Keyboard Shortcuts (desktop)

| Key | Action |
|---|---|
| `Space` | Flip card |
| `→` | Easy |
| `←` | Hard |
| `↑` | Okay |
| `A` | Play audio |

---

## Breakpoints

```css
/* Base: mobile-first, 375px+ */
@media (min-width: 480px) { /* Large phones, landscape */ }
@media (min-width: 768px) { /* Tablet, desktop */ }
```
