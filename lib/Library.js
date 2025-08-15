"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightRange = exports.createWrapper = exports.removeHighlightById = exports.removeHighlights = exports.serializeHighlights = exports.deserializeHighlights = exports.getHighlightElements = exports.doHighlight = exports.doHighlightOnRange = exports.getSelectionRange = exports.getHighlightElementsMap = exports.normalizeHighlights = exports.mergeSiblingHighlights = exports.flattenNestedHighlights = void 0;
// TextHighLighterv2 library
// Port by: lastlink <https://github.com/lastlink/>
var types_1 = require("./types");
var Utils_1 = require("./Utils");
/**
 * Creates wrapper for highlights.
 * TextHighlighter instance calls this method each time it needs to create highlights and pass options retrieved
 * in constructor.
 * @param {object} options - the same object as in TextHighlighter constructor.
 * @returns {HTMLElement}
 * @memberof TextHighlighter
 * @static
 */
function createWrapper(options) {
    var span = document.createElement("span");
    if (options.color) {
        span.style.backgroundColor = options.color;
        span.setAttribute("data-backgroundcolor", options.color);
    }
    if (options.highlightedClass)
        span.className = options.highlightedClass;
    return span;
}
exports.createWrapper = createWrapper;
/**
 * Highlights range.
 * Wraps text of given range object in wrapper element.
 * @param {Range} range
 * @param {HTMLElement} wrapper
 * @returns {Array} - array of created highlights.
 * @memberof TextHighlighter
 */
var highlightRange = function (el, id, range, wrapper) {
    if (!range || range.collapsed) {
        return [];
    }
    var result = Utils_1.refineRangeBoundaries(range);
    var startContainer = result.startContainer, endContainer = result.endContainer, highlights = [];
    var goDeeper = result.goDeeper, done = false, node = startContainer, highlight, wrapperClone, nodeParent;
    do {
        if (node && goDeeper && node.nodeType === Utils_1.NODE_TYPE.TEXT_NODE) {
            if (node.parentNode instanceof HTMLElement &&
                node.parentNode.tagName &&
                node.nodeValue &&
                Utils_1.IGNORE_TAGS.indexOf(node.parentNode.tagName) === -1 &&
                node.nodeValue.trim() !== "") {
                wrapperClone = wrapper.cloneNode(true);
                wrapperClone.setAttribute(Utils_1.DATA_ATTR, true);
                wrapperClone.setAttribute(Utils_1.ID_ATTR, id);
                nodeParent = node.parentNode;
                // highlight if a node is inside the el
                if (Utils_1.dom(el).contains(nodeParent) || nodeParent === el) {
                    highlight = Utils_1.dom(node).wrap(wrapperClone);
                    highlights.push(highlight);
                }
            }
            goDeeper = false;
        }
        if (node === endContainer &&
            endContainer &&
            !(endContainer.hasChildNodes() && goDeeper)) {
            done = true;
        }
        if (node instanceof HTMLElement &&
            node.tagName &&
            Utils_1.IGNORE_TAGS.indexOf(node.tagName) > -1) {
            if (endContainer instanceof HTMLElement &&
                endContainer.parentNode === node) {
                done = true;
            }
            goDeeper = false;
        }
        if (goDeeper &&
            (node instanceof Text || node instanceof HTMLElement) &&
            node.hasChildNodes()) {
            node = node.firstChild;
        }
        else if (node && node.nextSibling) {
            node = node.nextSibling;
            goDeeper = true;
        }
        else if (node) {
            node = node.parentNode;
            goDeeper = false;
        }
    } while (!done);
    return highlights;
};
exports.highlightRange = highlightRange;
// : {
//     nodeType: number;
//     hasAttribute: (arg0: string) => any;
// }
/**
 * Returns true if element is a highlight.
 * All highlights have 'data-highlighted' attribute.
 * @param el - element to check.
 * @returns {boolean}
 * @memberof TextHighlighter
 */
var isHighlight = function (el) {
    return (el && el.nodeType === Utils_1.NODE_TYPE.ELEMENT_NODE && el.hasAttribute(Utils_1.DATA_ATTR));
};
/**
 * Flattens highlights structure.
 * Note: this method changes input highlights - their order and number after calling this method may change.
 * @param {Array} highlights - highlights to flatten.
 * @memberof TextHighlighter
 */
var flattenNestedHighlights = function (highlights) {
    var again;
    // self = this;
    Utils_1.sortByDepth(highlights, true);
    var flattenOnce = function () {
        var again = false;
        highlights.forEach(function (hl, i) {
            var parent = hl.parentElement;
            if (parent) {
                var parentPrev = parent.previousSibling, parentNext = parent.nextSibling;
                if (isHighlight(parent)) {
                    if (!Utils_1.haveSameColor(parent, hl)) {
                        if (!hl.nextSibling && parentNext) {
                            var newLocal = parentNext || parent;
                            if (newLocal) {
                                Utils_1.dom(hl).insertBefore(newLocal);
                                again = true;
                            }
                        }
                        if (!hl.previousSibling && parentPrev) {
                            var newLocal = parentPrev || parent;
                            if (newLocal) {
                                Utils_1.dom(hl).insertAfter(newLocal);
                                again = true;
                            }
                        }
                        if (!parent.hasChildNodes()) {
                            Utils_1.dom(parent).remove();
                        }
                    }
                    else {
                        if (hl && hl.firstChild)
                            parent.replaceChild(hl.firstChild, hl);
                        highlights[i] = parent;
                        again = true;
                    }
                }
            }
        });
        return again;
    };
    do {
        again = flattenOnce();
    } while (again);
};
exports.flattenNestedHighlights = flattenNestedHighlights;
/**
 * Merges sibling highlights and normalizes descendant text nodes.
 * Note: this method changes input highlights - their order and number after calling this method may change.
 * @param highlights
 * @memberof TextHighlighter
 */
var mergeSiblingHighlights = function (highlights) {
    //   const self = this;
    var shouldMerge = function (current, node) {
        return (node &&
            node.nodeType === Utils_1.NODE_TYPE.ELEMENT_NODE &&
            Utils_1.haveSameColor(current, node) &&
            isHighlight(node));
    };
    //   : {
    //     previousSibling: any;
    //     nextSibling: any;
    //   }
    highlights.forEach(function (highlight) {
        var prev = highlight.previousSibling, next = highlight.nextSibling;
        if (shouldMerge(highlight, prev)) {
            Utils_1.dom(highlight).prepend(prev.childNodes);
            Utils_1.dom(prev).remove();
        }
        if (shouldMerge(highlight, next)) {
            Utils_1.dom(highlight).append(next.childNodes);
            Utils_1.dom(next).remove();
        }
        Utils_1.dom(highlight).normalizeTextNodes();
    });
};
exports.mergeSiblingHighlights = mergeSiblingHighlights;
/**
 * Normalizes highlights. Ensures that highlighting is done with use of the smallest possible number of
 * wrapping HTML elements.
 * Flattens highlights structure and merges sibling highlights. Normalizes text nodes within highlights.
 * @param {Array} highlights - highlights to normalize.
 * @returns {Array} - array of normalized highlights. Order and number of returned highlights may be different than
 * input highlights.
 * @memberof TextHighlighter
 */
var normalizeHighlights = function (highlights) {
    var normalizedHighlights;
    exports.flattenNestedHighlights(highlights);
    exports.mergeSiblingHighlights(highlights);
    // omit removed nodes
    normalizedHighlights = highlights.filter(function (hl) {
        return hl.parentElement ? hl : null;
    });
    normalizedHighlights = Utils_1.unique(normalizedHighlights);
    normalizedHighlights.sort(function (a, b) {
        return a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft;
    });
    return normalizedHighlights;
};
exports.normalizeHighlights = normalizeHighlights;
var getSelectedRange = function (el) {
    return Utils_1.dom(el).getRange();
};
exports.getSelectionRange = getSelectedRange;
/**
 * highlight range
 * @param el
 * @param range
 * @param options
 * @param keepRange
 */
var doHighlightOnRange = function (el, range, id, keepRange, options) {
    var wrapper, createdHighlights, normalizedHighlights, timestamp;
    if (!options)
        options = new types_1.optionsImpl();
    options = Utils_1.defaults(options, {
        color: "#ffff7b",
        highlightedClass: "highlighted",
        contextClass: "highlighter-context",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onRemoveHighlight: function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onBeforeHighlight: function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onAfterHighlight: function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return true;
        },
    });
    if (!range || range.collapsed) {
        return false;
    }
    var highlightMade = false;
    if (options.onBeforeHighlight && options.onBeforeHighlight(range) === true) {
        timestamp = (+new Date()).toString();
        wrapper = createWrapper(options);
        wrapper.setAttribute(Utils_1.TIMESTAMP_ATTR, timestamp);
        createdHighlights = highlightRange(el, id, range, wrapper);
        if (createdHighlights.length > 0)
            highlightMade = true;
        normalizedHighlights = exports.normalizeHighlights(createdHighlights);
        if (options.onAfterHighlight)
            options.onAfterHighlight(range, normalizedHighlights, timestamp);
    }
    if (!keepRange) {
        Utils_1.dom(el).removeAllRanges();
    }
    return highlightMade;
};
exports.doHighlightOnRange = doHighlightOnRange;
/**
 * highlight selected element
 * @param el
 * @param keepRange
 * @param options
 * @returns
 */
var doHighlight = function (el, id, keepRange, options) {
    var range = getSelectedRange(el);
    if (!range || range.collapsed) {
        return false;
    }
    return doHighlightOnRange(el, range, id, keepRange, options);
};
exports.doHighlight = doHighlight;
/**
 * Deserializes highlights.
 * @throws exception when can't parse JSON or JSON has invalid structure.
 * @param {object} json - JSON object with highlights definition.
 * @returns {Array} - array of deserialized highlights.
 * @memberof TextHighlighter
 */
var deserializeHighlights = function (el, hlDescriptors) {
    var highlights = [];
    //    const self = this;
    function deserializationFn(hlDescriptor) {
        var hl = hlDescriptor;
        hl.hlpaths = hl.path.split(":").map(Number);
        if (!hl.hlpaths || hl.hlpaths.length == 0)
            return;
        //  {
        //   wrapper: hlDescriptor[0],
        //   text: hlDescriptor[1],
        //   path: hlDescriptor[2].split(":"),
        //   offset: hlDescriptor[3],
        //   length: hlDescriptor[4]
        // };
        var elIndex = hl.hlpaths.pop(), node = el, highlight, idx;
        // should have a value and not be 0 (false is = to 0)
        if (elIndex != 0 && !elIndex)
            return;
        while (hl.hlpaths.length > 0) {
            idx = hl.hlpaths.shift();
            if (idx || idx == 0)
                node = node.childNodes[idx];
        }
        if (node.childNodes[elIndex - 1] &&
            node.childNodes[elIndex - 1].nodeType === Utils_1.NODE_TYPE.TEXT_NODE) {
            elIndex -= 1;
        }
        node = node.childNodes[elIndex];
        if (node instanceof Text) {
            var hlNode = node.splitText(hl.offset);
            hlNode.splitText(hl.length);
            if (hlNode.nextSibling && !hlNode.nextSibling.nodeValue) {
                Utils_1.dom(hlNode.nextSibling).remove();
            }
            if (hlNode.previousSibling && !hlNode.previousSibling.nodeValue) {
                Utils_1.dom(hlNode.previousSibling).remove();
            }
            if (hl && hl.wrapper) {
                var tmpHtml = Utils_1.dom(hlNode).fromHTML(hl.wrapper)[0];
                if (tmpHtml) {
                    highlight = Utils_1.dom(hlNode).wrap(tmpHtml);
                    highlights.push(highlight);
                }
            }
        }
    }
    hlDescriptors.forEach(function (hlDescriptor) {
        try {
            deserializationFn(hlDescriptor);
        }
        catch (e) {
            if (console && console.warn) {
                console.warn("Can't deserialize highlight descriptor. Cause: " + e);
            }
        }
    });
    return highlights;
};
exports.deserializeHighlights = deserializeHighlights;
// export const find = function (el: HTMLElement, text: string, caseSensitive: boolean, options?: optionsImpl) {
//     const wnd = dom(el).getWindow();
//     if (wnd) {
//         const scrollX = wnd.scrollX,
//             scrollY = wnd.scrollY,
//             caseSens = (typeof caseSensitive === "undefined" ? true : caseSensitive);
//         // dom(el).removeAllRanges();
//         // const test = wnd.innerh
//         if ("find" in wnd) {
//             while ((wnd as any).find(text, caseSens)) {
//                 doHighlight(el, true, options);
//             }
//         } else if ((wnd.document.body as any).createTextRange) {
//             const textRange = (wnd.document.body as any).createTextRange();
//             textRange.moveToElementText(el);
//             while (textRange.findText(text, 1, caseSens ? 4 : 0)) {
//                 if (!dom(el).contains(textRange.parentElement()) && textRange.parentElement() !== el) {
//                     break;
//                 }
//                 textRange.select();
//                 doHighlight(el, true, options);
//                 textRange.collapse(false);
//             }
//         }
//         dom(el).removeAllRanges();
//         wnd.scrollTo(scrollX, scrollY);
//     }
// };
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
var getHighlightElements = function (el, params) {
    if (!params)
        params = new types_1.paramsImp();
    params = Utils_1.defaults(params, {
        container: el,
        andSelf: true,
        grouped: false,
    });
    if (params.container) {
        var nodeList = params.container.querySelectorAll("[" + Utils_1.DATA_ATTR + "]");
        var highlights = Array.prototype.slice.call(nodeList);
        if (params.andSelf === true && params.container.hasAttribute(Utils_1.DATA_ATTR)) {
            highlights.push(params.container);
        }
        if (params.grouped) {
            highlights = Utils_1.groupHighlights(highlights);
        }
        return highlights;
    }
};
exports.getHighlightElements = getHighlightElements;
/**
 * Returns highlights from given container grouped by highlight ID.
 * @param el - element to search in.
 * @param params - parameters for searching.
 * @returns {Object} - object with highlight IDs as keys and arrays of highlights as values.
 * @memberof TextHighlighter
 */
// Using export function directly instead of const assignment for better compatibility
/* webpack: used */
function getHighlightElementsMap(el, params) {
    if (!params)
        params = new types_1.paramsImp();
    params = Utils_1.defaults(params, {
        container: el,
        andSelf: true,
        grouped: false,
    });
    var highlights = getHighlightElements(el, params);
    var map = new Map();
    if (!highlights || highlights.length === 0)
        return map;
    highlights.forEach(function (hl) {
        var _a;
        var id = hl.getAttribute(Utils_1.ID_ATTR);
        if (id) {
            if (!map.has(id)) {
                map.set(id, []);
            }
            (_a = map.get(id)) === null || _a === void 0 ? void 0 : _a.push(hl);
        }
    });
    return map;
}
exports.getHighlightElementsMap = getHighlightElementsMap;
var getHighlightElementsById = function (el, id, params) {
    if (!params)
        params = new types_1.paramsImp();
    params = Utils_1.defaults(params, {
        container: el,
        andSelf: true,
        grouped: false,
    });
    if (params.container) {
        var nodeList = params.container.querySelectorAll("[" + Utils_1.ID_ATTR + "=\"" + id + "\"]");
        var highlights = Array.prototype.slice.call(nodeList);
        if (params.andSelf === true &&
            params.container.hasAttribute(Utils_1.ID_ATTR) &&
            params.container.getAttribute(Utils_1.ID_ATTR) === id) {
            highlights.push(params.container);
        }
        if (params.grouped) {
            highlights = Utils_1.groupHighlights(highlights);
        }
        return highlights;
    }
    return null;
};
/**
 * Serializes all highlights in the element the highlighter is applied to.
 * @returns {string} - stringified JSON with highlights definition
 * @memberof TextHighlighter
 */
var serializeHighlights = function (el) {
    if (!el)
        return;
    var highlights = getHighlightElements(el), refEl = el, hlDescriptors = [];
    if (!highlights)
        return;
    function getElementPathAndClauseId(el, refElement) {
        var path = [];
        var highlightClauseId = null;
        var rootClauseId = null;
        var childNodes;
        if (el)
            do {
                if (el instanceof HTMLElement && el.parentNode) {
                    var clauseId = el.getAttribute(Utils_1.CLAUSE_ID_ATTR);
                    if (clauseId) {
                        if (!highlightClauseId) {
                            highlightClauseId = clauseId;
                        }
                        rootClauseId = clauseId;
                    }
                    childNodes = Array.prototype.slice.call(el.parentNode.childNodes);
                    path.unshift(childNodes.indexOf(el));
                    el = el.parentNode;
                }
            } while (el !== refElement || !el);
        return {
            path: path,
            highlightClauseId: highlightClauseId,
            rootClauseId: rootClauseId,
        };
    }
    Utils_1.sortByDepth(highlights, false);
    //   {
    //     textContent: string | any[];
    //     cloneNode: (arg0: boolean) => any;
    //     previousSibling: { nodeType: number; length: number };
    //   }
    highlights.forEach(function (highlight) {
        if (highlight && highlight.textContent) {
            var offset = 0, // Hl offset from previous sibling within parent node.
            wrapper = highlight.cloneNode(true);
            var length_1 = highlight.textContent.length;
            var _a = getElementPathAndClauseId(highlight, refEl), hlPath = _a.path, highlightClauseId = _a.highlightClauseId, rootClauseId = _a.rootClauseId;
            var color = "";
            var id = highlight.getAttribute(Utils_1.ID_ATTR);
            if (wrapper instanceof HTMLElement) {
                var c = wrapper.getAttribute("data-backgroundcolor");
                if (c)
                    color = c.trim();
                wrapper.innerHTML = "";
                wrapper = wrapper.outerHTML;
            }
            if (highlight.previousSibling &&
                highlight.previousSibling.nodeType === Utils_1.NODE_TYPE.TEXT_NODE &&
                highlight.previousSibling instanceof Text) {
                offset = highlight.previousSibling.length;
            }
            var hl = {
                id: id !== null && id !== void 0 ? id : undefined,
                hlClauseId: highlightClauseId !== null && highlightClauseId !== void 0 ? highlightClauseId : undefined,
                rootClauseId: rootClauseId !== null && rootClauseId !== void 0 ? rootClauseId : undefined,
                wrapper: wrapper,
                textContent: highlight.textContent,
                path: hlPath.join(":"),
                color: color,
                offset: offset,
                length: length_1,
            };
            hlDescriptors.push(hl);
        }
    });
    return hlDescriptors;
};
exports.serializeHighlights = serializeHighlights;
var _removeHighlights = function (highlights, options) {
    // self = this;
    if (!highlights)
        return;
    if (!options)
        options = new types_1.optionsImpl();
    options = Utils_1.defaults(options, {
        color: "#ffff7b",
        highlightedClass: "highlighted",
        contextClass: "highlighter-context",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onRemoveHighlight: function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onBeforeHighlight: function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onAfterHighlight: function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return true;
        },
    });
    function mergeSiblingTextNodes(textNode) {
        var prev = textNode.previousSibling, next = textNode.nextSibling;
        if (prev && prev.nodeType === Utils_1.NODE_TYPE.TEXT_NODE) {
            textNode.nodeValue = prev.nodeValue + textNode.nodeValue;
            Utils_1.dom(prev).remove();
        }
        if (next && next.nodeType === Utils_1.NODE_TYPE.TEXT_NODE) {
            textNode.nodeValue = textNode.nodeValue + next.nodeValue;
            Utils_1.dom(next).remove();
        }
    }
    function removeHighlight(highlight) {
        if (!highlight)
            return;
        var textNodes = Utils_1.dom(highlight).unwrap();
        if (textNodes)
            textNodes.forEach(function (node) {
                mergeSiblingTextNodes(node);
            });
    }
    Utils_1.sortByDepth(highlights, true);
    highlights.forEach(function (hl) {
        if (options &&
            options.onRemoveHighlight &&
            options.onRemoveHighlight(hl) === true) {
            removeHighlight(hl);
        }
    });
};
var removeHighlightById = function (el, id, options) {
    var highlights = getHighlightElementsById(el, id);
    if (!highlights || highlights.length === 0)
        return;
    _removeHighlights(highlights, options);
};
exports.removeHighlightById = removeHighlightById;
var removeHighlights = function (element, options) {
    var highlights = getHighlightElements(element, { container: element });
    if (!highlights || highlights.length === 0)
        return;
    _removeHighlights(highlights, options);
};
exports.removeHighlights = removeHighlights;
