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
  getElementPathAndClauseId,
} from "../src/Library";
import { TextHighlighter } from "./TextHighlighter";
import { hlDescriptorI, optionsImpl } from "./types";

export {
  doHighlight,
  getSelectionRange,
  doHighlightOnRange,
  deserializeHighlights,
  serializeHighlights,
  getElementPathAndClauseId,
  removeHighlights,
  getHighlightElementsMap,
  removeHighlightById,
  optionsImpl,
  hlDescriptorI,
  createWrapper,
  highlightRange,
  TextHighlighter,
};
