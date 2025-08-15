import {
  doHighlight,
  getSelectionRange,
  doHighlightOnRange,
  deserializeHighlights,
  serializeHighlights,
  removeHighlights,
  createWrapper,
  highlightRange,
  removeHighlightById,
  getHighlightElementsMap,
} from "../src/Library";
import { TextHighlighter } from "./TextHighlighter";
import { hlDescriptorI, optionsImpl } from "./types";

export {
  doHighlight,
  getSelectionRange,
  doHighlightOnRange,
  deserializeHighlights,
  serializeHighlights,
  removeHighlights,
  getHighlightElementsMap,
  removeHighlightById,
  optionsImpl,
  hlDescriptorI,
  createWrapper,
  highlightRange,
  TextHighlighter,
};

// Export Cheerio implementations
export {
  serializeHighlightsCheerio,
  deserializeHighlightsCheerio,
} from "./CheerioHighlighter";
