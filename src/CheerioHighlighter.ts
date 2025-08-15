// CheerioHighlighter.ts
// Implementation of serializeHighlights and deserializeHighlights using Cheerio instead of DOM API
import * as cheerio from "cheerio";
import { hlDescriptorI } from "./types";
import { CLAUSE_ID_ATTR, DATA_ATTR, ID_ATTR } from "./Utils";

/**
 * Serializes all highlights in the HTML string using Cheerio.
 * This function returns the same output as serializeHighlights but uses Cheerio instead of DOM API.
 * Note: This should be called in a Node.js environment, not in the browser.
 * @param {string} html - HTML string containing highlights
 * @returns {hlDescriptorI[]} - Array of highlight descriptors
 */
export const serializeHighlightsWithCheerio = function (
  html: string
): hlDescriptorI[] {
  if (!html) return [];

  // Load HTML with cheerio
  const $ = cheerio.load(html);

  // Find all highlights with the data attribute
  const highlights = $(`[${DATA_ATTR}]`).toArray();
  if (!highlights || highlights.length === 0) return [];

  const hlDescriptors: hlDescriptorI[] = [];

  // Sort highlights by depth (shallow first) to match serializeHighlights behavior
  highlights.sort((a, b) => {
    const depthA = $(a).parents().length;
    const depthB = $(b).parents().length;
    return depthA - depthB; // Ascending order (shallow first)
  });

  highlights.forEach((highlight) => {
    const $highlight = $(highlight);
    const textContent = $highlight.text();

    if (textContent) {
      // Clone the highlight element and remove its content
      const $wrapper = $highlight.clone();
      $wrapper.empty();

      // Get highlight ID and color
      const id = $highlight.attr(ID_ATTR);
      const color = $highlight.attr("data-backgroundcolor") || "";

      // Calculate path to the element using contents() (includes text nodes)
      const path: number[] = [];
      let highlightClauseId: string | undefined = undefined;
      let rootClauseId: string | undefined = undefined;

  let $current = $highlight;
  let $parent = $current.parent();
  while ($parent.length && ($parent[0] as any).type !== "root") {
        // Record clause ids: first encountered (closest) and last encountered (root-most)
        const clauseId = $current.attr(CLAUSE_ID_ATTR);
        if (clauseId) {
          if (!highlightClauseId) highlightClauseId = clauseId;
          rootClauseId = clauseId;
        }

        // Find index of current node among parent's contents (elements + text nodes)
        const siblings = $parent.contents().toArray();
        const index = siblings.findIndex((el) => el === $current[0]);
        path.unshift(index);

        // Move up
  $current = $parent;
  $parent = $current.parent();
      }

      // Calculate offset from previous text sibling within parent.contents()
      let offset = 0;
      const $parentForOffset = $highlight.parent();
      if ($parentForOffset.length) {
        const contentSiblings = $parentForOffset.contents().toArray();
        const selfIndex = contentSiblings.findIndex((el) => el === $highlight[0]);
        const prevNode = selfIndex > 0 ? contentSiblings[selfIndex - 1] : undefined;
        if (prevNode && (prevNode as any).type === "text" && typeof (prevNode as any).data === "string") {
          offset = ((prevNode as any).data as string).length;
        }
      }

      // Create highlight descriptor
      const hl: hlDescriptorI = {
        id: id || undefined,
        hlClauseId: highlightClauseId,
        rootClauseId: rootClauseId,
        wrapper: $.html($wrapper),
        textContent: textContent,
        path: path.join(":"),
        color: color,
        offset: offset,
        length: textContent.length,
      };

      hlDescriptors.push(hl);
    }
  });

  return hlDescriptors;
};

/**
 * Helper function to convert an HTMLElement to a string that can be parsed by Cheerio
 * @param el - HTMLElement to convert to string
 * @returns HTML string representation of the element
 */
export const elementToString = function (el: HTMLElement | null): string {
  if (!el) return "";

  return el.outerHTML;
};

/**
 * This function is a drop-in replacement for the original serializeHighlights
 * It first converts the HTMLElement to a string, then uses Cheerio to process it
 * @param el - HTMLElement containing highlights
 * @returns {hlDescriptorI[]} - Array of highlight descriptors (same as original serializeHighlights)
 */
export const serializeHighlightsCheerio = function (
  el: HTMLElement | null
): hlDescriptorI[] {
  if (!el) return [];

  try {
    // Convert element to string for Cheerio processing
    const htmlString = elementToString(el);

    // Use Cheerio implementation to process the HTML string
    return serializeHighlightsWithCheerio(htmlString);
  } catch (error) {
    console.error("Error in serializeHighlightsCheerio:", error);
    return [];
  }
};

/**
 * Deserializes highlights with Cheerio.
 * This function processes an HTML string and applies highlight descriptors using Cheerio.
 *
 * @param html - HTML string to deserialize highlights into
 * @param hlDescriptors - Array of highlight descriptors
 * @returns HTML string with highlights applied
 */
export const deserializeHighlightsWithCheerio = function (
  html: string,
  hlDescriptors: hlDescriptorI[]
): string {
  if (!html || !hlDescriptors || hlDescriptors.length === 0) return html;

  // Load HTML with cheerio
  const $ = cheerio.load(html, { xml: false });

  // Process each highlight descriptor
  hlDescriptors.forEach((hlDescriptor) => {
    try {
      const hl = hlDescriptor;

      // Parse the path
      hl.hlpaths = hl.path.split(":").map(Number);
      if (!hl.hlpaths || hl.hlpaths.length === 0) return;

      let elIndex = hl.hlpaths.pop();
      if (elIndex === undefined) return;

      // Start from the container element (first top-level element of the provided HTML)
  let $node: any = $.root().children().first();

      // Traverse down the path
      const pathIndices = hl.hlpaths.slice(0); // Copy path
      for (let i = 0; i < pathIndices.length; i++) {
        const idx = pathIndices[i];
        $node = $node.contents().eq(idx);
        if (!$node.length) return; // Invalid path
      }

      // Get all contents including text nodes
      const contents: any[] = [];
  $node.contents().each((_: any, element: any) => {
        contents.push(element);
      });

      // Adjust index for text nodes
      if (
        elIndex > 0 &&
        contents[elIndex - 1] &&
        contents[elIndex - 1].type === "text"
      ) {
        elIndex -= 1;
      }

      // Get the target text node
      const targetNode = contents[elIndex];
      if (!targetNode || targetNode.type !== "text") return;

      // Get the text content
      const text = $(targetNode).text();

      // Split the text
      const beforeText = text.substring(0, hl.offset);
      const highlightText = text.substring(hl.offset, hl.offset + hl.length);
      const afterText = text.substring(hl.offset + hl.length);

      // Create the wrapper element
      const $wrapper = $(hl.wrapper);
      $wrapper.text(highlightText);

      // Replace the text node with the three parts
      $(targetNode).replaceWith(`${beforeText}${$.html($wrapper)}${afterText}`);
    } catch (e) {
      console.warn(
        "Can't deserialize highlight descriptor with Cheerio. Cause: " + e
      );
    }
  });

  // Return only the inner HTML of the container element
  const $container = $.root().children().first();
  return $container.html() || "";
};

/**
 * This function is a drop-in replacement for the original deserializeHighlights function.
 * It takes an HTMLElement and applies highlight descriptors using Cheerio.
 *
 * @param el - HTMLElement to deserialize highlights into
 * @param hlDescriptors - Array of highlight descriptors
 * @returns Array of created highlight elements
 */
export const deserializeHighlightsCheerio = function (
  el: HTMLElement,
  hlDescriptors: hlDescriptorI[]
): HTMLElement[] {
  if (!el || !hlDescriptors || hlDescriptors.length === 0) return [];

  try {
    // Convert element to string
    const htmlString = elementToString(el);

    // Process with Cheerio
    const processedHtml = deserializeHighlightsWithCheerio(
      htmlString,
      hlDescriptors
    );

    // Set the processed HTML back to the element
    el.innerHTML = processedHtml;

    // Return all highlight elements
    return Array.from(el.querySelectorAll(`[${DATA_ATTR}]`));
  } catch (error) {
    console.error("Error in deserializeHighlightsCheerio:", error);
    return [];
  }
};
