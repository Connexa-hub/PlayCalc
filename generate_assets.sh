#!/bin/bash

# Input file
INPUT="./assets/PlayCalc.png"

# Output directory
OUTDIR="./assets"

# Make sure output folder exists
mkdir -p $OUTDIR

echo "🔄 Generating Expo assets from $INPUT ..."

# 1. App Icon (1024x1024, no transparency)
convert "$INPUT" -resize 1024x1024 -background white -gravity center -extent 1024x1024 "$OUTDIR/icon.png"

# 2. Adaptive Foreground (1024x1024, keep transparency)
convert "$INPUT" -resize 1024x1024 "$OUTDIR/adaptive-icon-foreground.png"

# 3. Adaptive Background (solid black)
convert -size 1024x1024 xc:black "$OUTDIR/adaptive-icon-background.png"

# 4. Splash Screen (1242x2436, white background, centered)
convert "$INPUT" -resize 1242x1242 -background white -gravity center -extent 1242x2436 "$OUTDIR/splash.png"

# 5. Web Favicon (48x48)
convert "$INPUT" -resize 48x48 "$OUTDIR/favicon.png"

echo "✅ Assets generated successfully!"

# --- Update app.json ---
echo "🔄 Updating app.json ..."

jq '.expo.icon = "./assets/icon.png"
    | .expo.splash.image = "./assets/splash.png"
    | .expo.ios.icon = "./assets/icon.png"
    | .expo.android.icon = "./assets/icon.png"
    | .expo.android.adaptiveIcon.foregroundImage = "./assets/adaptive-icon-foreground.png"
    | .expo.android.adaptiveIcon.backgroundColor = "#000000"
    | .expo.web.favicon = "./assets/favicon.png"' app.json > app.tmp.json && mv app.tmp.json app.json

echo "✅ app.json updated successfully!"
