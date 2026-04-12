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

- **Import / Export / Share**
  - Export a deck as JSON
  - Import a deck JSON file
  - Copy a share link
  - Show a QR code
  - Backup and restore all app data (decks, stats, history, theme)

- **Theme**
  - Dark / Light theme toggle

- **PWA app mode**
  - Installable as an app (supported browsers)
  - Offline support with service worker cache

## Tech notes

- **Frontend only**: HTML + CSS + JavaScript
- **Storage**: LocalStorage (no database)
- **AI**: uses an external API call from the browser (requires network access)

## Data & safety

- **Backup all data**
  - Go to **Analytics** and click `🗂 Backup All Data`
  - This exports a JSON backup with decks, stats, activity log, card history, and theme

- **Restore backup**
  - Go to **Analytics** and click `⬆ Restore Backup`
  - Choose a backup JSON file exported from this app

- **Run diagnostics**
  - Go to **Analytics** and click `🧪 Run Diagnostics`
  - Checks for common data issues (broken deck structures, malformed history keys)

- **Reset app data**
  - Go to **Analytics** and click `🧹 Reset App Data`
  - This removes all local data from the browser for this app
  - Use backup first if you need to keep data

- **Where data is stored**
  - All app data is stored in browser LocalStorage
  - Data does not sync to cloud by default

- **PWA update notes**
  - If you deploy a new version and still see old behavior, hard refresh once
  - On desktop: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (macOS)

## Project files

- `index.html` — UI structure
- `style.css` — styling
- `script.js` — app logic
- `assets/flashcards-logo.png` — logo

- ##Declaration##
- I hereby declare that i used the help of AI like claude and nanobanana but i understood each step and practiced it on my own atleast once b

