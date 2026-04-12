# 🃏 FlashCards — Smart Study Workspace

> Built because I was stressed about exams and tired of wasting paper on flashcards that I'd lose anyway.

![HTML](https://img.shields.io/badge/HTML-5-orange) ![CSS](https://img.shields.io/badge/CSS-3-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow) ![Status](https://img.shields.io/badge/Status-Active-brightgreen)

## 🌐 Live Demo
**[Try it here → farhanalam100.github.io/Flashcard-App](https://farhanalam100.github.io/Flashcard-App/)**

---

## Why I built this

I was sitting at my desk the night before an exam, and I saw a flashcard taped to my study table. It hit me — why am I still doing this on paper? I lose them, I can't search them, and making them takes forever. I wanted something I could actually use every day, not just a project I'd forget about after submitting.

So I built FlashCards. It started as a basic flip-card app and slowly turned into something I genuinely use now. I added spaced repetition because I read about how Anki works and wanted to understand it. I added AI generation because typing out 30 cards manually is painful. I added the Pomodoro timer because I kept getting distracted while studying with my own app which is a bit embarrassing honestly.

---

## Features

###  AI Card Generation
Type any topic and get 10 flashcards generated instantly. Uses the Anthropic API. Falls back to a smart template generator if no API key is set so it works for everyone.

###  Spaced Repetition (SM-2)
The same algorithm Anki uses. Cards you struggle with come back sooner. Cards you know well get pushed further. I implemented this from scratch after reading about the SM-2 formula — negative intervals were my first bug.

###  3 Study Modes
- **Flashcard** — classic flip with 3D animation
- **Multiple Choice** — auto-generates wrong answers from your other cards
- **Type Answer** — fuzzy matching so small typos don't count against you

###  Pomodoro Timer
25-minute focus sessions with a circular ring animation. Auto-switches to break mode. Sends a desktop notification when done.

### 🏆 18 Achievements
Unlock badges for streaks, perfect scores, studying after midnight, finishing a deck in under 60 seconds, and more. Each one has an animated toast notification.

###  Analytics Dashboard
- 90-day activity heatmap
- Deck performance bar charts  
- Weakest cards tracker
- Export stats as CSV

###  12 Themes
6 dark and 6 light themes. Midnight Navy, Pure Black, Forest Night, Deep Purple, Ember, Cosmos, Warm Paper, Arctic White, Sage Garden, Lavender, Sunrise, Ocean Mist. Click in the navbar to switch.

### Other stuff
- CSV import — paste from Excel or Google Sheets directly
- QR code sharing — share any deck with a link or QR code
- PWA — installable on your phone like a real app
- Works offline
- Sound effects using Web Audio API (no files, just oscillators)
- Dark/light mode that actually works properly
- Bulk deck tagging
- Keyboard shortcuts

---

## 🚀 How to use it

### Just open the link
**[farhanalam100.github.io/Flashcard-App](https://farhanalam100.github.io/Flashcard-App/)**

No login, no signup. Everything saves locally in your browser.

### Run locally
```bash
git clone https://github.com/farhanalam100/Flashcard-App.git
cd Flashcard-App
# just open index.html in your browser
```

No installs. No build step. No npm. Just open and go.

---

##  Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Flip card |
| `→` | Got it ✓ |
| `←` | Missed ✕ |
| `↓` | Vague ～ |
| `Enter` | Submit answer (type mode) |
| `Escape` | Close any modal |

---

##  Built With

Just vanilla HTML, CSS and JavaScript. No frameworks, no build tools, no dependencies except QRCode.js from a CDN and Google Fonts.

 Thing: What it does 
 Vanilla JS | Everything — state, routing, storage, animations |
 CSS Variables | The entire theme system |
 localStorage | Saves all your decks and progress |
 SM-2 Algorithm | Spaced repetition scheduling |
 Web Audio API | Sound effects without any audio files |
 Anthropic API | AI card generation | Service Worker | Offline support and PWA |

---

## 📁 Project Structure
