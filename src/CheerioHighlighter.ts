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
export const serializeHighlightsWithCheerio = function(html: string): hlDescriptorI[] {
  if (!html) return [];
  
  // Load HTML with cheerio
  const $ = cheerio.load(html);
  
  // Find all highlights with the data attribute
  const highlights = $(`[${DATA_ATTR}]`).toArray();
  if (!highlights || highlights.length === 0) return [];
  
  const hlDescriptors: hlDescriptorI[] = [];
  
  // Sort highlights by depth (deepest first to avoid issues with nested highlights)
  highlights.sort((a, b) => {
    // Count number of parents to determine depth
    const depthA = $(a).parents().length;
    const depthB = $(b).parents().length;
    return depthB - depthA; // Descending order (deepest first)
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
      
      // Calculate path to the element
      const path: number[] = [];
      const highlightClauseId = $highlight.attr(CLAUSE_ID_ATTR) || undefined;
      let rootClauseId: string | undefined = undefined;
      
      // Get the path and clause IDs
      let $current = $highlight;
      let $parent = $current.parent();
      
      while ($parent.length) {
        // Check for root clause id
        const clauseId = $current.attr(CLAUSE_ID_ATTR);
        if (clauseId) {
          rootClauseId = clauseId;
        }
        
        // Find index of current element among its siblings
        const siblings = $parent.children().toArray();
        const index = siblings.findIndex(el => el === $current[0]);
        path.unshift(index);
        
        // Move up to parent
        $current = $parent;
        $parent = $current.parent();
      }
      
      // Calculate offset from previous sibling
      let offset = 0;
      const $prev = $highlight.prev();
      // For text nodes in Cheerio, check if it exists and has text
      if ($prev.length) {
        const prevText = $prev.text();
        if (prevText) {
          offset = prevText.length;
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
        length: textContent.length
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
export const elementToString = function(el: HTMLElement | null): string {
  if (!el) return "";
  
  return el.outerHTML;
};

/**
 * This function is a drop-in replacement for the original serializeHighlights
 * It first converts the HTMLElement to a string, then uses Cheerio to process it
 * @param el - HTMLElement containing highlights
 * @returns {hlDescriptorI[]} - Array of highlight descriptors (same as original serializeHighlights)
 */
export const serializeHighlightsCheerio = function(el: HTMLElement | null): hlDescriptorI[] {
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
export const deserializeHighlightsWithCheerio = function(
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
      
      // Start from root and navigate down
      let $node = $("html");
      
      // Traverse down the path
      const pathIndices = hl.hlpaths.slice(0); // Copy path
      for (let i = 0; i < pathIndices.length; i++) {
        const idx = pathIndices[i];
        $node = $node.children().eq(idx);
        if (!$node.length) return; // Invalid path
      }
      
      // Get all contents including text nodes
      const contents: any[] = [];
      $node.contents().each((_, element) => {
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
      console.warn("Can't deserialize highlight descriptor with Cheerio. Cause: " + e);
    }
  });
  
  return $.html();
};

/**
 * This function is a drop-in replacement for the original deserializeHighlights function.
 * It takes an HTMLElement and applies highlight descriptors using Cheerio.
 * 
 * @param el - HTMLElement to deserialize highlights into
 * @param hlDescriptors - Array of highlight descriptors
 * @returns Array of created highlight elements
 */
export const deserializeHighlightsCheerio = function(
  el: HTMLElement,
  hlDescriptors: hlDescriptorI[]
): HTMLElement[] {
  if (!el || !hlDescriptors || hlDescriptors.length === 0) return [];
  
  try {
    // Convert element to string
    const htmlString = elementToString(el);
    
    // Process with Cheerio
    const processedHtml = deserializeHighlightsWithCheerio(htmlString, hlDescriptors);
    
    // Set the processed HTML back to the element
    el.innerHTML = processedHtml;
    
    // Return all highlight elements
    return Array.from(el.querySelectorAll(`[${DATA_ATTR}]`));
  } catch (error) {
    console.error("Error in deserializeHighlightsCheerio:", error);
    return [];
  }
};
