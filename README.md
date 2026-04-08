# FlashCards — Premium Flashcard Study App

FlashCards is a sleek, single‑page flashcard app designed for focused studying. Create decks manually or generate them with AI, study using multiple modes, and track your progress with analytics.

## How to run

- Open `index.html` in your browser.
- Your decks are saved automatically in **LocalStorage** (they stay on this device/browser).

## Core features

- **Deck library**
  - Search decks by name
  - Filter by category
  - Filter by tag
  - Deck cards show: card count, last score (if available), and due‑today count

- **Create / edit decks**
  - Set a **deck name**, **category**, **color**
  - Add cards with **front / back / optional hint**
  - Add **tags** (comma‑separated) like `exam, chapter 4, vocab`

- **Bulk deck tagging (Select mode)**
  - Select multiple decks from the library
  - Add a tag to all selected decks
  - Remove a tag from all selected decks
  - Select all visible decks / clear selection

- **AI card generation**
  - Generate a set of cards from a topic (e.g., “Photosynthesis”)
  - Adds generated cards into the current deck draft for review before saving

- **Study modes**
  - **Flashcard (flip)**
  - **Multiple choice**
  - **Type answer**
  - Optional **shuffle**
  - Optional **timer**

- **Spaced repetition scheduling**
  - Uses an SM‑2 style approach to schedule future reviews based on your ratings
  - Shows **due‑today** counts and a “Review Now” shortcut when cards are due

- **Analytics**
  - Sessions, accuracy, streak
  - Streak calendar heatmap
  - Deck performance overview
  - Weakest cards list
  - Export stats as CSV

- **Import / Export / Share**
  - Export a deck as JSON
  - Import a deck JSON file
  - Copy a share link
  - Show a QR code

- **Theme**
  - Dark / Light theme toggle

## Tech notes

- **Frontend only**: HTML + CSS + JavaScript
- **Storage**: LocalStorage (no database)
- **AI**: uses an external API call from the browser (requires network access)

## Project files

- `index.html` — UI structure
- `style.css` — styling
- `script.js` — app logic
- `assets/flashcards-logo.png` — logo

