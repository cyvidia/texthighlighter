# TextHighlighter Cheerio Implementation

This is an alternative implementation of the `serializeHighlights` and `deserializeHighlights` functions using Cheerio instead of the DOM API. 
It produces the exact same output as the original implementation.

## Usage

### In the browser
```typescript
import { serializeHighlights, deserializeHighlights } from '@funktechno/texthighlighter';

// Use the original DOM-based implementation
const highlights = serializeHighlights(element);
const newHighlights = deserializeHighlights(element, highlightDescriptors);
```

### In Node.js (server-side)
```typescript
import { serializeHighlightsCheerio, deserializeHighlightsCheerio } from '@funktechno/texthighlighter';

// Use the Cheerio-based implementation for server-side code
const highlights = serializeHighlightsCheerio(element);
const newHighlights = deserializeHighlightsCheerio(element, highlightDescriptors);
```

## Implementation details

The Cheerio implementation:
1. Takes an HTMLElement and converts it to a string
2. Uses Cheerio to parse the HTML string
3. For serialization: Extracts all highlights with the same algorithm as the original implementation
4. For deserialization: Applies the highlight descriptors to the HTML in the same way as the original implementation
5. Returns the same data structure as the original implementation

This allows you to use the same serialization and deserialization logic on both client and server sides.

## Requirements

- Cheerio 1.1.2 or higher

## Installation

```bash
npm install cheerio@1.1.2 --save-dev
```

## Note on compatibility

The Cheerio implementation is designed to be a drop-in replacement for `serializeHighlights` and `deserializeHighlights` when used in a Node.js environment. It requires Cheerio to be installed as a dependency.
