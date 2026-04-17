# 📷 ASCII Webcam

A fun little browser app that converts your live webcam feed into animated ASCII art in real time. No installs, no dependencies, no build step — just open and go.

**[Live Demo](https://krzyzyb.github.io/asciiwebcam/)**

---

## How it works

Each frame from your webcam is drawn onto a hidden canvas at low resolution. Every pixel's brightness is mapped to a character from a 70-char ASCII ramp (` .'\`^",:;Il!...@$`), then rendered as text — giving you a live, animated ASCII version of whatever your camera sees.

## Features

- 🎥 Live webcam to ASCII conversion at ~60fps
- 🔢 Density slider — control how many columns of characters are rendered
- 🌗 Contrast slider — punch up or soften the image
- 🔁 Invert toggle — flip between dark and light background styles

## Usage

Just open `index.html` in your browser and click **START CAMERA**.

Or visit the live GitHub Pages link above.

> **Note:** Camera access requires HTTPS or localhost. GitHub Pages provides HTTPS automatically.

## Files

```
index.html        # Markup and styles
ascii-webcam.js   # All the logic (camera, render loop, ASCII conversion)
```

## License

MIT — free for everyone. Use it, fork it, break it, make it yours. Made for fun. 🙂
