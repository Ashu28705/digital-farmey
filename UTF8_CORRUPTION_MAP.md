# UTF-8 Corruption Mapping - Digital Farming Advisory System

**Date Generated:** April 23, 2026

## Overview
This document maps all unique corrupted UTF-8 character sequences found in the HTML files of the workspace to their correct Unicode representations.

## Corruption Type Analysis
All corrupted sequences follow the pattern of **UTF-8 double-encoding** where UTF-8 encoded bytes were incorrectly interpreted as Latin-1 (ISO-8859-1) and then re-saved as UTF-8. This happens when:
1. Files originally encoded in UTF-8 contain multi-byte characters (emojis, special punctuation)
2. The file encoding is misinterpreted during save/transfer
3. The bytes get re-encoded, creating garbled sequences

---

## Complete Unicode Mapping Table

| # | Corrupted Sequence | Correct Character | Unicode Code Point | Description | Affected Files |
|---|---|---|---|---|---|
| 1 | `ðŸŒ¾` | 🌾 | U+1F33E | Wheat/Grain Sheaf | dashboard.html |
| 2 | `ðŸŒ¿` | 🌿 | U+1F33F | Herb/Plant | dashboard.html |
| 3 | `ðŸ›'` | 🛒 | U+1F6D2 | Shopping Cart | dashboard.html |
| 4 | `â€¢` | • | U+2022 | Bullet Point | dashboard.html |
| 5 | `ðŸŒ¤ï¸` | 🌤️ | U+1F324 U+FE0F | Partly Cloudy (with sun) | dashboard.html |
| 6 | `ðŸŒ±` | 🌱 | U+1F331 | Seedling/Young Plant | dashboard.html |
| 7 | `ðŸ§ª` | 🧪 | U+1F9EA | Test Tube/Beaker | dashboard.html |
| 8 | `ðŸ"¦` | 📦 | U+1F4E6 | Package/Box | dashboard.html |
| 9 | `ðŸŒ` | 🌍 | U+1F30D | Earth/Globe | dashboard.html |
| 10 | `ðŸ"ˆ` | 📈 | U+1F4C8 | Chart Increasing | dashboard.html |
| 11 | `ðŸ«˜` | 🫘 | U+1FAD8 | Beans/Legumes | dashboard.html |
| 12 | `ðŸ"` | 📍 | U+1F4CD | Location Pin/Map Marker | dashboard.html |
| 13 | `â†'` | → | U+2192 | Rightwards Arrow | dashboard.html |
| 14 | `ðŸŒ½` | 🌽 | U+1F33D | Corn/Maize | dashboard.html |
| 15 | `ðŸ"‹` | 📋 | U+1F4CB | Clipboard/Memo | dashboard.html |
| 16 | `ðŸ'°` | 💰 | U+1F4B0 | Money Bag | dashboard.html |
| 17 | `âš ï¸` | ⚠️ | U+26A0 U+FE0F | Warning Sign | dashboard.html |
| 18 | `ðŸ""` | 📓 | U+1F4D3 | Notebook/Memo | dashboard.html |
| 19 | `ðŸŒ§ï¸` | 🌧️ | U+1F327 U+FE0F | Rain/Raindrop | dashboard.html |
| 20 | `ðŸŒ¦ï¸` | 🌦️ | U+1F326 U+FE0F | Scattered Clouds | dashboard.html |
| 21 | `ðŸŒ¨ï¸` | 🌨️ | U+1F328 U+FE0F | Snow Cloud | dashboard.html |
| 22 | `ðŸŒ«ï¸` | 🌫️ | U+1F32B U+FE0F | Fog/Mist | dashboard.html |
| 23 | `â˜€ï¸` | ☀️ | U+2600 U+FE0F | Sun/Clear Sky | dashboard.html |
| 24 | `â›…` | ⛅ | U+26C5 | Sun Behind Small Clouds | dashboard.html |
| 25 | `â˜ï¸` | ☁️ | U+2601 U+FE0F | Cloud | dashboard.html |
| 26 | `â›ˆï¸` | ⛈️ | U+26C8 U+FE0F | Thunderstorm | dashboard.html |
| 27 | `â‚¹` | ₹ | U+20B9 | Indian Rupee Sign | dashboard.html |

---

## Categorized by Type

### Weather Emojis (8 sequences)
- `ðŸŒ¤ï¸` → 🌤️ (Partly Cloudy)
- `ðŸŌ§ï¸` → 🌧️ (Rain)
- `ðŸŌ¦ï¸` → 🌦️ (Scattered Clouds)
- `ðŸŌ¨ï¸` → 🌨️ (Snow)
- `ðŸŌ«ï¸` → 🌫️ (Fog)
- `â˜€ï¸` → ☀️ (Sun)
- `â›…` → ⛅ (Sun & Clouds)
- `â˜ï¸` → ☁️ (Cloud)
- `â›ˆï¸` → ⛈️ (Thunderstorm)

### Agriculture/Plant Emojis (4 sequences)
- `ðŸŒ¾` → 🌾 (Wheat)
- `ðŸŒ¿` → 🌿 (Herb)
- `ðŸŌ±` → 🌱 (Seedling)
- `ðŸŌ½` → 🌽 (Corn)

### Commerce/Market Emojis (3 sequences)
- `ðŸ›'` → 🛒 (Shopping Cart)
- `ðŸ"¦` → 📦 (Package)
- `ðŸ«˜` → 🫘 (Beans)

### UI/Indicator Emojis (6 sequences)
- `ðŸ"` → 📍 (Location Pin)
- `ðŸ"ˆ` → 📈 (Chart)
- `ðŸ"‹` → 📋 (Clipboard)
- `ðŸ'°` → 💰 (Money)
- `ðŸ""` → 📓 (Notebook)
- `âš ï¸` → ⚠️ (Warning)

### Global/Other Emojis (1 sequence)
- `ðŸŒ` → 🌍 (Earth)

### Chemistry Emojis (1 sequence)
- `ðŸ§ª` → 🧪 (Test Tube)

### Punctuation & Symbols (3 sequences)
- `â€¢` → • (Bullet Point)
- `â†'` → → (Right Arrow)
- `â‚¹` → ₹ (Indian Rupee)

---

## Affected Files

Based on the search results, the following file contains corrupted UTF-8:
- **dashboard.html** - Primary file with 27 unique corrupted sequences

Other HTML files should be checked for similar corruptions:
- marketplace.html
- sell-crops.html
- crop-recommendation.html
- fertilizer-advice.html
- alerts.html
- chatbot.html
- soil-data.html
- profile.html
- notifications.html
- login.html
- register.html
- index.html
- market-prices.html

---

## Root Cause

This corruption typically occurs due to:
1. **Encoding mismatch during file operations** - Files saved with wrong encoding declaration
2. **Tool/Editor issue** - Text editor or IDE didn't preserve UTF-8 encoding
3. **Copy-paste from web sources** - Content copied from web browsers may lose encoding context
4. **Database/API encoding mismatch** - If content came from a system with different encoding

---

## Fix Strategy

To fix these corrupted sequences, use the following find-and-replace operations in order of execution:

### Batch Fix Commands (for text editors with regex support):

1. Weather emojis and other multi-byte sequences: Replace all instances using the mappings above
2. Common symbols: Replace `â€¢` with `•`, `â†'` with `→`, `â‚¹` with `₹`
3. Verify file encoding is UTF-8 with BOM or UTF-8 without BOM

---

## Prevention

1. Ensure all HTML files have `<meta charset="UTF-8">` declaration ✓ (Already present)
2. Use file editors/IDEs that properly handle UTF-8 (VS Code, Sublime Text, etc.)
3. When copying emojis/special chars from web, paste as plain text first
4. Save files explicitly with UTF-8 encoding
5. Use version control to track encoding changes
