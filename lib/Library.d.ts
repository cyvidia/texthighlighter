import { optionsImpl, hlDescriptorI, paramsImp } from "./types";
/**
 * Creates wrapper for highlights.
 * TextHighlighter instance calls this method each time it needs to create highlights and pass options retrieved
 * in constructor.
 * @param {object} options - the same object as in TextHighlighter constructor.
 * @returns {HTMLElement}
 * @memberof TextHighlighter
 * @static
 */
declare function createWrapper(options: optionsImpl): HTMLSpanElement;
/**
 * Highlights range.
 * Wraps text of given range object in wrapper element.
 * @param {Range} range
 * @param {HTMLElement} wrapper
 * @returns {Array} - array of created highlights.
 * @memberof TextHighlighter
 */
declare const highlightRange: (el: HTMLElement, id: string, range: Range, wrapper: {
    cloneNode: (arg0: boolean) => any;
}) => HTMLElement[];
/**
 * Flattens highlights structure.
 * Note: this method changes input highlights - their order and number after calling this method may change.
 * @param {Array} highlights - highlights to flatten.
 * @memberof TextHighlighter
 */
export declare const flattenNestedHighlights: (highlights: any[]) => void;
/**
 * Merges sibling highlights and normalizes descendant text nodes.
 * Note: this method changes input highlights - their order and number after calling this method may change.
 * @param highlights
 * @memberof TextHighlighter
 */
export declare const mergeSiblingHighlights: (highlights: any[]) => void;
/**
 * Normalizes highlights. Ensures that highlighting is done with use of the smallest possible number of
 * wrapping HTML elements.
 * Flattens highlights structure and merges sibling highlights. Normalizes text nodes within highlights.
 * @param {Array} highlights - highlights to normalize.
 * @returns {Array} - array of normalized highlights. Order and number of returned highlights may be different than
 * input highlights.
 * @memberof TextHighlighter
 */
export declare const normalizeHighlights: (highlights: any[]) => any;
declare const getSelectedRange: (el: HTMLElement) => Range | undefined;
/**
 * highlight range
 * @param el
 * @param range
 * @param options
 * @param keepRange
 */
declare const doHighlightOnRange: (el: HTMLElement, range: Range, id: string, keepRange: boolean, options?: optionsImpl | undefined) => boolean;
/**
 * highlight selected element
 * @param el
 * @param keepRange
 * @param options
 * @returns
 */
declare const doHighlight: (el: HTMLElement, id: string, keepRange: boolean, options?: optionsImpl | undefined) => boolean;
/**
 * Deserializes highlights.
 * @throws exception when can't parse JSON or JSON has invalid structure.
 * @param {object} json - JSON object with highlights definition.
 * @returns {Array} - array of deserialized highlights.
 * @memberof TextHighlighter
 */
declare const deserializeHighlights: (el: HTMLElement, hlDescriptors: hlDescriptorI[]) => {
    appendChild: (arg0: any) => void;
}[];
/**
 * Returns highlights from given container.
 * @param params
 * @param {HTMLElement} [params.container] - return highlights from this element. Default: the element the
 * highlighter is applied to.
 * @param {boolean} [params.andSelf] - if set to true and container is a highlight itself, add container to
 * returned results. Default: true.
 * @param {boolean} [params.grouped] - if set to true, highlights are grouped in logical groups of highlights added
 * in the same moment. Each group is an object which has got array of highlights, 'toString' method and 'timestamp'
 * property. Default: false.
 * @returns {Array} - array of highlights.
 * @memberof TextHighlighter
 */
declare const getHighlightElements: (el: HTMLElement, params?: paramsImp | undefined) => HTMLElement[] | undefined;
/**
 * Returns highlights from given container grouped by highlight ID.
 * @param el - element to search in.
 * @param params - parameters for searching.
 * @returns {Object} - object with highlight IDs as keys and arrays of highlights as values.
 * @memberof TextHighlighter
 */
export declare function getHighlightElementsMap(el: HTMLElement, params?: paramsImp): Map<string, HTMLElement[]>;
/**
 * Serializes all highlights in the element the highlighter is applied to.
 * @returns {string} - stringified JSON with highlights definition
 * @memberof TextHighlighter
 */
declare const serializeHighlights: (el: HTMLElement | null) => hlDescriptorI[] | undefined;
declare const removeHighlightById: (el: HTMLElement, id: string, options?: optionsImpl | undefined) => void;
declare const removeHighlights: (element: HTMLElement, options?: optionsImpl | undefined) => void;
export { getSelectedRange as getSelectionRange, doHighlightOnRange, doHighlight, getHighlightElements, deserializeHighlights, serializeHighlights, removeHighlights, removeHighlightById, createWrapper, highlightRange, };
