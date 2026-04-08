# 🃏 FlashCards — Smart Study Workspace

A powerful, AI-powered flashcard study app built with vanilla HTML, CSS & JavaScript. Create decks, study smarter with spaced repetition, generate cards instantly with AI, and track your progress with detailed analytics.

![FlashCards App](https://img.shields.io/badge/Status-Active-brightgreen) ![HTML](https://img.shields.io/badge/HTML-5-orange) ![CSS](https://img.shields.io/badge/CSS-3-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

## 🌐 Live Demo
**[Try it here →](https://farhamalam100.github.io/Flashcard-App/)**

---

## ✨ Features

### 🤖 AI Card Generation
- Type any topic and instantly generate 5–20 flashcards using AI
- Cards come with questions, answers, and hints automatically

### 🧠 Spaced Repetition (SM-2 Algorithm)
- Cards you struggle with come back sooner
- Cards you know well are shown less frequently
- Scientifically proven method used by Anki and other top study tools

### 📚 3 Study Modes
- **🃏 Flashcard Mode** — Classic flip cards with smooth 3D animation
- **🔤 Multiple Choice** — 4 options, auto-generated from your deck
- **⌨️ Type Answer** — Type the answer with fuzzy matching for small typos

### 📊 Analytics Dashboard
- 90-day activity heatmap (like GitHub contributions)
- Deck performance bar charts
- Weakest cards tracker
- Session history and accuracy stats
- Export stats as CSV

### 🎨 Other Features
- 🌙 Dark / Light mode toggle
- 🔗 Share decks via link or QR code
- ⬇️ Import / Export decks as JSON
- 🔥 Daily study streak tracker
- 📅 "Due Today" smart review banner
- 🎉 Confetti on perfect scores
- ⌨️ Keyboard shortcuts (Space, ← →)
- 📱 Fully responsive on mobile

---

## 🚀 Getting Started

### Option 1 — Use the live app
Visit **[farhamalam100.github.io/Flashcard-App](https://farhamalam100.github.io/Flashcard-App/)**

### Option 2 — Run locally
```bash
# Clone the repository
git clone https://github.com/farhamalam100/Flashcard-App.git

# Navigate into the folder
cd Flashcard-App

# Open in browser
open index.html
```
No installs, no dependencies, no build step needed. Just open and use!

---

## 🎮 How to Use

1. **Create a deck** — Click "New Deck", name it, pick a category and color
2. **Add cards** — Type questions and answers manually, or use ✨ AI Generate
3. **Study** — Click "Study" on any deck and pick your mode
4. **Rate yourself** — Mark cards as Missed / Vague / Got it
5. **Track progress** — Visit Analytics to see your streaks and weak spots

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Flip card |
| `→` | Got it ✓ |
| `←` | Missed ✕ |
| `↓` | Vague ～ |
| `Enter` | Submit answer (Type mode) |

---

## 🛠️ Built With

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling, animations, themes |
| Vanilla JavaScript | All logic and functionality |
| Anthropic Claude API | AI card generation |
| SM-2 Algorithm | Spaced repetition scheduling |
| QRCode.js | QR code generation |
| Google Fonts (Syne + DM Sans) | Typography |

---

## 📁 Project Structure
---

## 🧠 How Spaced Repetition Works

The app uses the **SM-2 algorithm** — the same method behind Anki:

- Each card has an **ease factor**, **interval**, and **repetition count**
- Answer **"Got it"** → interval grows (shown less often)
- Answer **"Missed"** → interval resets to 1 day (shown tomorrow)
- Answer **"Vague"** → interval grows slowly
- The app shows a **"Due Today"** banner when cards need review

---

## 📸 Screenshots


---

## 🙏 Acknowledgements

- Built as part of **[Hack Club Jackpot](https://jackpot.hackclub.com)** — a program for teen hackers
- Spaced repetition based on the **SM-2 algorithm** by Piotr Woźniak
  

---

## 📄 License

MIT License — feel free to use, modify and share!

---

*Made with ❤️ by [farhamalam100](https://github.com/farhamalam100)*
