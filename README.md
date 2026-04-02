# CyberShield - Chrome Extension for Password and Phishing Risk Detection

CyberShield is a browser security project built as a Chrome extension. It evaluates password strength on web forms and flags common phishing or social engineering indicators directly inside the browser.

## Overview

This project focuses on practical client-side security checks:

- real-time password strength feedback on password fields
- heuristic phishing-risk detection on visited webpages
- browser-based alerts through an in-page banner and popup dashboard
- local analysis within the browser without external service calls

## Core Features

- Real-time password strength analysis for password inputs
- Floating password meter with score, strength level, and improvement guidance
- HTTPS check for insecure pages
- Suspicious keyword scanning in page content
- Sensitive form analysis for pages requesting multiple sensitive fields
- Basic domain-pattern heuristics for potentially deceptive domains
- Popup dashboard showing current page status and detected risks

## Project Structure

```
project/
├── manifest.json
├── content.js
├── content-styles.css
├── popup.html
├── popup.js
├── popup-styles.css
└── README.md
```

## Technical Scope

### Content Script

`content.js` runs on matching webpages and performs two tasks:

1. Detects password fields and updates a floating strength meter while the user types.
2. Evaluates the page for phishing-related signals and displays a warning banner when risks are found.

### Popup

`popup.js` requests the current page status from the content script and renders:

- current domain
- secure or suspicious status
- detected risks
- basic security tips

## Detection Logic

Password strength scoring is based on:

- length
- uppercase characters
- lowercase characters
- numbers
- special characters

The extension classifies results as `Weak`, `Medium`, or `Strong`.

Phishing-risk checks include:

- HTTP pages instead of HTTPS
- suspicious terms such as `verify now`, `account suspended`, and `urgent`
- forms requesting combinations of email, password, or phone data
- suspicious domain naming patterns

These checks are heuristic-based and intended for awareness, experimentation, and demonstration rather than production-grade threat detection.

## Installation

1. Open `chrome://extensions/` in Chrome.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the project folder.

## Key Files

- `manifest.json`: extension configuration
- `content.js`: password analysis and phishing detection logic
- `content-styles.css`: styles for the password meter and warning banner
- `popup.html`: popup markup
- `popup.js`: popup messaging and rendering logic
- `popup-styles.css`: popup styling

## Privacy

The current implementation performs its checks locally in the browser. No external service integration or remote data processing is included in this project.
