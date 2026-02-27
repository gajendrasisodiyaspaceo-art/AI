# InterviewAI - Design Specification

## App Overview
**InterviewAI** is a desktop application (Electron + React) that assists users during technical interviews. It provides real-time AI-powered Q&A with speech-to-text, screen capture OCR, and session history.

**Window Size:** 400 x 600px | Frameless | Always on top | Resizable
**Platform:** macOS / Windows desktop

---

## Design Tokens

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background Primary | `#0a0a1a` | App shell background |
| Background Elevated | `#111128` | Elevated surfaces |
| Background Surface | `#1a1a2e` | Cards, input fields |
| Background Card | `#1e1e2e` (90% opacity) | AI chat bubble |
| Glass | `rgba(255,255,255,0.04)` | Glass morphism fill |
| Border Glass | `rgba(255,255,255,0.08)` | Default borders |
| Border Subtle | `rgba(255,255,255,0.06)` | Divider lines |
| Border Active | `rgba(124,58,237,0.4)` | Focus/active borders |
| Primary | `#7c3aed` (violet-600) | Primary actions, accents |
| Primary Hover | `#6d28d9` (violet-700) | Hover state |
| Primary Light | `#a78bfa` (violet-400) | Icons, secondary accent |
| Gradient Start | `#7c3aed` (violet-600) | Gradient buttons |
| Gradient End | `#4f46e5` (indigo-600) | Gradient buttons |
| Text Primary | `#e2e8f0` | Main body text |
| Text Secondary | `#94a3b8` | Secondary text |
| Text Muted | `rgba(255,255,255,0.35)` | Dimmed labels |
| Success | `#22c55e` (emerald-400) | Connected, success states |
| Danger | `#ef4444` (red-500) | Errors, stop, delete |
| Warning | `#f59e0b` (amber-400) | Checking, loading states |
| White 90 | `rgba(255,255,255,0.9)` | Chat text on bubbles |
| White 70 | `rgba(255,255,255,0.7)` | Heading text |
| White 40 | `rgba(255,255,255,0.4)` | Meta text, labels |
| White 25 | `rgba(255,255,255,0.25)` | Timestamps, hints |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| App Title | 14px | 600 (semibold) | white/80 |
| Tab Label | 12px | 500 (medium) | white (active) / white/40 |
| Status Chip | 12px | 500 (medium) | varies by state |
| Chat Body | 14px | 400 (regular) | white/90 |
| Chat Timestamp | 11px | 400 (regular) | white/35 |
| Input Placeholder | 14px | 400 (regular) | white/25 |
| Button Primary | 14px | 600 (semibold) | white |
| Button Small | 14px | 500 (medium) | white |
| Section Label | 12px | 500 (medium) | white/50 uppercase |
| Helper Text | 12px | 400 (regular) | white/30 |
| Empty State Title | 14px | 600 (semibold) | white/70 |
| Empty State Body | 12px | 400 (regular) | white/40 |

**Font Family:** Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif

### Spacing Scale (Tailwind)

| Name | Value | Usage |
|------|-------|-------|
| 0.5 | 2px | Micro gaps |
| 1 | 4px | Tight spacing |
| 1.5 | 6px | Icon gaps, small padding |
| 2 | 8px | Standard gap |
| 2.5 | 10px | Component spacing |
| 3 | 12px | Section padding |
| 3.5 | 14px | Button padding-y (large) |
| 4 | 16px | Chat bubble padding-x |
| 5 | 20px | Message separators |

### Border Radius

| Element | Value |
|---------|-------|
| App Window | 12px (rounded-xl) |
| Chat Bubbles | 16px (rounded-2xl) + 6px on tail corner |
| Buttons (large) | 16px (rounded-2xl) |
| Input Container | 16px (rounded-2xl) |
| Cards | 12px (rounded-xl) |
| Avatars | 50% (rounded-full) |
| Status Chips | 9999px (rounded-full) |
| Small Buttons | 8px (rounded-lg) |

### Shadows

| Element | Shadow |
|---------|--------|
| App Window | `0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.06)` |
| Primary Button | `0 1px 3px rgba(124,58,237,0.25)` |
| Listen Button (idle) | `0 4px 6px rgba(124,58,237,0.3)` |
| Listen Button (hover) | `0 10px 15px rgba(124,58,237,0.35)` |
| AI Avatar | `0 4px 6px rgba(124,58,237,0.2)` |
| User Bubble | `0 1px 2px rgba(124,58,237,0.1)` |

### Glassmorphism

```
App Shell: backdrop-filter: blur(20px)
Glass Elements: backdrop-filter: blur(12px)
```

---

## Screens & Components

---

### Screen 1: Setup Wizard (First Launch)

**Layout:** Full-height, 3 sections (header, content, footer)

#### Header
- Logo: 20x20px rounded-md, violet-to-indigo gradient, white hexagon icon
- Title: "Setup" 14px semibold white/90
- Step Indicator: 4 circles connected by lines
  - Active step: violet filled circle
  - Completed step: violet filled with checkmark
  - Upcoming step: white/20 border circle
  - Step labels below: 12px white/40

#### Step 1: AI Engine
- Two radio cards stacked vertically:
  - **Groq Cloud** card: Surface bg, violet left border when selected, radio circle, title + description
  - **Ollama Local** card: Same pattern
- If Groq selected: API Key input field with show/hide toggle button, "Validate" button
- If Ollama selected: Status check card with "Check Connection" button

#### Step 2: Audio
- Radio card list of detected audio devices
- Each card: device name, radio indicator

#### Step 3: Resume
- Upload area: dashed border, icon, "Click to upload" text
- If uploaded: file preview with truncated text, success indicator

#### Step 4: Ready
- Summary checklist with check/warning icons:
  - AI Provider status
  - Audio device
  - Resume status
- "Get Started" gradient button

#### Footer Navigation
- Left: "Back" secondary button (hidden on step 1)
- Right: "Next" primary button / "Get Started" gradient button on step 4

---

### Screen 2: Main App - Live Tab (Primary Screen)

**Layout:** Full flex column: TitleBar > TabBar > StatusBar > ChatArea > InputArea

#### 2A. Title Bar
- Height: ~44px
- Draggable region
- Left: Logo (24x24 rounded-lg, gradient) + "InterviewAI" 14px semibold
- Right: Minimize button (28x28 rounded-full, dash icon) + Close button (28x28 rounded-full, X icon)
- Buttons: white/30 default, white/60 hover, red/40 on close hover
- Bottom border: 1px solid rgba(255,255,255,0.06)

#### 2B. Tab Bar
- Height: ~40px
- 3 equal-width tabs: Live, Settings, History
- Each tab: Icon (14x14) + Label (12px medium)
- Active: white text, violet icon, gradient bottom border (2.5px, violet-400 to indigo-500 with glow)
- Inactive: white/40 text, white/30 icon
- Hover: white/60, subtle bg white/3%
- Background: white/2%

#### 2C. Status Bar
- Height: ~36px
- Left: Listening status chip (rounded-full pill)
  - Idle: grey bg white/4%, white/40 text, white/25 dot
  - Listening: emerald bg 15%, emerald/90 text, emerald dot + pulse animation
- Center (conditional): "Transcribing" chip (violet bg 15%, violet/80 text, violet dot + pulse)
- Right: AI status chip
  - Connected: emerald bg 10%, emerald text, emerald dot
  - Disconnected: red bg 10%, red text, red dot
  - Checking: amber bg 10%, amber text, amber dot + pulse

#### 2D. Chat Area (Empty State)
- Centered vertically
- Icon container: 80x80 rounded-2xl, gradient bg violet/15 to indigo/10, pulsing glow animation
- Microphone SVG icon: 36px, gradient stroke
- Title: "Ready to assist" 14px semibold white/70
- Subtitle: "Start listening or type a question below" 12px white/40
- Suggestion chips: 3 pills "Ask about your interview" "Practice questions" "Get feedback"
  - 11px, white/25, rounded-full, border white/6%, bg white/2%

#### 2D. Chat Area (With Messages)
- Scrollable, smooth scroll behavior
- Separator between message pairs: 1px border white/4%, 20px vertical margin

##### User Message (Right-aligned)
- Flex row: [content] [avatar]
- Avatar: 28x28 rounded-full, violet/20 bg, violet/30 border, person SVG icon (#a78bfa stroke)
- Bubble: max-width 85%, gradient bg violet-600 to violet-700, white text, 16px border-radius (small radius on bottom-right corner = 6px), padding 16px horizontal 12px vertical
- Below bubble: timestamp 11px white/35, right-aligned

##### AI Message (Left-aligned)
- Flex row: [avatar] [content]
- Avatar: 28x28 rounded-full, gradient bg violet-600 to indigo-700, white layers/stack SVG icon, shadow
- Bubble: max-width 85%, bg #1e1e2e at 90% opacity, border rgba(255,255,255,0.08), left border 2px violet/40, 16px radius (small on bottom-left = 6px), padding 16px horizontal 12px vertical
- Text: white/90, 14px, relaxed line-height
- Below bubble: timestamp 11px white/35 + action buttons (hidden, appear on hover)

##### Action Buttons (Hover Only)
- Opacity 0 by default, 1 on parent hover
- Copy: 24x24 rounded-md, copy icon 13px, white/30 -> violet-400 on hover
- Copied state: green checkmark icon
- Regenerate: 24x24 rounded-md, refresh icon 13px, white/30 -> violet-400 on hover

##### Typing Indicator
- 3 dots, 6px each, white/40, bounce animation staggered (0s, 0.15s, 0.3s)

##### Error State
- Red error icon (14px) + red/80 error text in AI bubble

#### 2E. Input Area
- Top border: 1px solid rgba(255,255,255,0.06)
- Padding: 12px all sides

##### Input Container (unified bar)
- Rounded-2xl container, bg rgba(26,26,46,0.8), border rgba(255,255,255,0.08)
- Border turns violet/30 when input has text
- Internal padding: 6px
- Contains 3 elements inline:

1. **Screen Capture button** (left): 36x36 rounded-xl, camera icon 16px, white/30 -> violet-400 hover
2. **Text Input** (center, flex-1): transparent bg, 14px text, white/25 placeholder, no border
3. **Ask button** (right): 36px height, gradient violet-to-indigo when active, grey when disabled, "Ask" + arrow icon, rounded-xl
   - Disabled: bg white/4%, text white/20
   - Active: gradient bg, white text, press scale-95

##### Listen Button (full width below input)
- Height: ~52px (py-3.5)
- Rounded-2xl
- **Idle state:** Gradient bg violet-600 to indigo-600, white text "Start Listening", mic icon 16px, shadow lg violet/30, hover: scale-[1.01], active: scale-[0.99]
- **Active state:** Gradient bg red-500 to red-600, white text "Stop Listening", mic wave animation (5 bars), shadow md red/25, pulse-red glow animation 2s infinite

##### Mic Wave Animation
- 5 vertical bars, 3px wide, rounded-full, white/80
- Each bar: scaleY animation 0.8s ease infinite, staggered delays (0s, 0.1s, 0.2s, 0.3s, 0.15s)
- Oscillates between scaleY(0.4) and scaleY(1.0)

---

### Screen 3: Settings Tab

**Layout:** Scrollable list of sections with 10px spacing

#### Sections (top to bottom):

1. **AI Status Card** - Surface card, status dot + "AI Connected/Offline" + provider name
2. **AI Provider** - Select dropdown: "Groq Cloud" / "Ollama Local"
3. **API Key** (Groq only) - Password input with eye toggle button
4. **Ollama Info** (Ollama only) - Info card with model list
5. **AI Model** - Select dropdown with available models
6. **Audio Device** - Select dropdown
7. **Transcription Engine** - Select dropdown: "WebSpeech" / "Whisper"
8. **Stealth Mode** - Toggle switch with label + description
9. **Opacity** - Range slider (0-100) with percentage label
10. **Resume** - Upload area / preview with delete button
11. **Keyboard Shortcuts** - Card showing shortcut keys

#### Common Form Elements:

##### Select Dropdown
- Label: 12px uppercase white/50 tracking-wider
- Select: bg white/4%, border white/8%, rounded-lg, 14px text, focus: violet border
- Helper text: 12px white/30

##### Toggle Switch
- 36x18px track, 14px thumb
- Off: bg white/10, thumb white/40
- On: bg violet-600, thumb white, thumb shifts right

##### Input Field
- bg white/4%, border white/8%, rounded-lg, 14px, padding 8px 12px
- Focus: violet border, slightly brighter bg
- Error: red border, red helper text
- Right element slot (for show/hide toggle)

##### Card (Surface)
- bg #1a1a2e, border white/8%, rounded-xl, padding 12px

---

### Screen 4: History Tab

**Layout:** Scrollable list

#### Empty State
- Centered: clock icon (24px) in gradient circle (56x56), "No sessions yet" title, subtitle

#### Session Cards
- Surface card (rounded-xl, padding 12px)
- Title: formatted date 14px medium white/85
- Meta row: clock icon + duration + dot separator + question count, 12px white/35
- Delete button: appears on hover, 24x24, trash icon, red hover
- Expand chevron: 12px, rotates 180 on expand

#### Expanded Session
- Left violet border (2px violet/15)
- Q&A pairs stacked:
  - Question: "Q" label (violet/50 uppercase) + text, bg white/3%, rounded-lg
  - Answer: "A" label + truncated text (200 chars), bg violet/4%, rounded-lg

---

### Screen 5: Mini Mode

**Window Size:** Compact floating (~300 x 150px)
**Layout:** Header + scrollable content

#### Header
- Tiny logo (12x12) + "InterviewAI" 12px white/40
- "Copy" + "Expand" text buttons

#### Content
- Scrollable text area, 12px white/70, relaxed line-height
- Shows latest AI answer or "Waiting for answer..."

---

## Animations

| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| fadeIn | 250ms | ease-out | Elements appearing (translateY 6px + opacity) |
| slideUp | 300ms | ease-out | Content sliding up (translateY 12px) |
| fadeInScale | 200ms | ease-out | Scale in from 97% |
| pulse-glow | 2s | infinite | Violet box-shadow pulsing (idle listen button glow on empty state) |
| pulse-red | 2s | infinite | Red box-shadow pulsing (active listen button) |
| typing | 1.4s | infinite | Three dots bouncing (AI typing) |
| mic-wave | 0.8s | ease-in-out infinite | Vertical bars oscillating (listening state) |
| shimmer | 1.5s | infinite | Loading shimmer background sweep |
| animate-pulse | - | - | Tailwind default pulse for status dots |

---

## Interaction States

### Buttons
- Default -> Hover (lighter shade) -> Active (scale 95-99%) -> Disabled (opacity 30%)
- All transitions: 200ms ease

### Cards/Surfaces
- Hover: bg brightness +3-5%
- Active elements have violet accent border or highlight

### Chat Actions
- Hidden by default (opacity 0)
- Visible on message group hover (opacity 1, 200ms transition)

### Scrollbar
- Width: 6px
- Thumb: white/12%, hover white/20%
- Track: transparent

---

## Icon Set (SVG, stroke-based)

All icons are inline SVGs with `stroke="currentColor"`, `fill="none"`, `strokeWidth="2"`:

| Icon | Used In | Size |
|------|---------|------|
| Microphone | Tab bar, Listen button, Empty state | 14-36px |
| Gear/Settings | Tab bar | 14px |
| Clock | Tab bar, History | 14px |
| Person/User | User avatar | 12px |
| Layers/Stack | AI avatar | 14px |
| Copy (rectangles) | Chat actions | 13px |
| Refresh/Regen | Chat actions | 13px |
| Checkmark | Copy success, Ready step | 13px |
| Error circle | Error messages | 14px |
| Camera/Screen | Input area capture button | 16px |
| Arrow right | Ask button | 14px |
| Trash | History delete | 11px |
| Chevron down | History expand | 12px |
| Dash line | Minimize button | 10px |
| X cross | Close button | 9px |
| Hexagon | App logo | 10-12px |
| Eye/EyeOff | API key toggle | 14px |

---

## Component Library Summary

| Component | Variants | Props |
|-----------|----------|-------|
| Button | primary, secondary, danger, gradient | size (sm/md/lg), fullWidth, icon, disabled |
| Input | default, error, with-right-element | label, helperText, error |
| Select | default | label, options[], helperText |
| Toggle | on/off | checked, label, description |
| Card | surface, glass | padding (sm/md/lg) |
| StatusDot | success, error, warning, idle | size (sm/md), pulse |
| Spinner | sm, md | label |
| ErrorBoundary | - | children, retry action |

---

## Responsive Behavior

- Min width: 320px
- Window is resizable but maintains vertical flex layout
- Chat area is the only flexible height region (flex-1, overflow scroll)
- Input area and status bar are fixed height at bottom/top
- All text wraps with `overflow-wrap: break-word`

---

## Data Models

### QAPair
```
id: string
question: string
answer: string
timestamp: number (Unix ms)
source: "audio" | "manual" | "ocr"
isStreaming?: boolean
```

### Session
```
id: string
startTime: number
endTime?: number
qaPairs: QAPair[]
summary?: string
```

### Settings
```
audioDevice: string
aiModel: string
groqApiKey: string
aiProvider: "groq" | "ollama"
transcriptionEngine: "webspeech" | "whisper"
stealthMode: boolean
opacity: number (0-100)
resumeText: string
hasCompletedSetup: boolean
```
