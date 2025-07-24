# Railway Deployment Quick Fix

## The Problem
Your Railway deployment is failing because the nixpacks.toml file on GitHub still contains `jpeg` instead of `libjpeg`. The error shows:

```
error: undefined variable 'jpeg'
```

## Quick Solution

### Option 1: Replace nixpacks.toml on GitHub (Fastest)
1. **Go to**: https://github.com/dataontap/WalkThrough-
2. **Find**: `nixpacks.toml` file
3. **Click**: Edit (pencil icon)
4. **Find line 10**: `"jpeg",`
5. **Change to**: `"libjpeg",`
6. **Commit**: "Fix nixpacks.toml: Change jpeg to libjpeg for Railway deployment"

### Option 2: Upload Fixed Zip File
1. **Download**: `WalkThrough-Complete-Fixed.zip` from this Replit
2. **Go to**: https://github.com/dataontap/WalkThrough-
3. **Replace**: all files with the fixed version
4. **Commit**: "Fix Railway deployment with corrected nixpacks.toml"

## The Fixed nixpacks.toml Content
```toml
[phases.setup]
nixPkgs = [
  "nodejs_20",
  "npm-9_x",
  "python3",
  "pkg-config",
  "cairo",
  "pango",
  "libpng",
  "libjpeg",     # ← This was "jpeg" before
  "giflib",
  "librsvg",
  "glib",
  "gdk-pixbuf",
  "freetype",
  "fontconfig",
  "gettext",
  "ffmpeg",
  "xorg.libX11",
  "xorg.libXext",
  "xorg.libXrandr",
  "xorg.libXcomposite",
  "xorg.libXdamage",
  "xorg.libXfixes",
  "xorg.libXrender",
  "xorg.libXss",
  "xorg.libXtst",
  "nss",
  "nspr",
  "at-spi2-atk",
  "at-spi2-core",
  "atk",
  "cups",
  "dbus",
  "expat",
  "gtk3",
  "libdrm",
  "libxkbcomposite",
  "alsa-lib"
]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = [
  "npm run build:client",
  "npm run build:server"
]

[start]
cmd = "npm start"
```

## Result After Fix
✅ Railway deployment will succeed
✅ Chrome/Puppeteer will work properly
✅ Real video recording will be enabled
✅ All system dependencies will install correctly

Choose Option 1 for the fastest fix - just edit one line on GitHub!