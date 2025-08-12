/**
 * ReactLibrary.ts - React adapter for TextHighlighter
 * This file provides React-compatible adapters for the TextHighlighter library
 */
import { optionsImpl } from "./types";
import {
  doHighlight,
  deserializeHighlights,
  serializeHighlights,
  removeHighlights,
  getHighlights,
} from "./Library";
import { dom } from "./Utils";

/**
 * React-aware version of doHighlight
 * This function will safely apply highlighting within React's lifecycle
 *
 * @param el - The element to highlight within
 * @param id - Unique identifier for this highlight operation
 * @param keepRange - Whether to preserve the selection range
 * @param options - Highlighting options
 * @returns Whether highlighting was successful
 */
export function reactDoHighlight(
  el: HTMLElement,
  id: string,
  keepRange: boolean,
  options?: optionsImpl
): Promise<boolean> {
  return new Promise((resolve) => {
    // Execute highlighting in a requestAnimationFrame to ensure
    // we're outside of React's rendering cycle
    requestAnimationFrame(() => {
      try {
        const result = doHighlight(el, id, keepRange, options);
        resolve(result);
      } catch (err) {
        console.error("Error during highlighting:", err);
        resolve(false);
      }
    });
  });
}

/**
 * React-aware version of removeHighlights
 *
 * @param el - The element containing highlights to remove
 * @param options - Options for removal
 * @returns Promise that resolves when highlights are removed
 */
export function reactRemoveHighlights(
  el: HTMLElement,
  options?: optionsImpl
): Promise<boolean> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      try {
        removeHighlights(el, options);
        resolve(true);
      } catch (err) {
        console.error("Error removing highlights:", err);
        resolve(false);
      }
    });
  });
}

/**
 * React-aware version of serializeHighlights
 *
 * @param el - The element containing highlights to serialize
 * @returns Promise that resolves with serialized highlights
 */
export function reactSerializeHighlights(
  el: HTMLElement
): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      // The serializeHighlights function returns an array of highlight descriptors
      // but we expect it to return a JSON string. Since the implementation might vary,
      // we'll handle both cases.
      const serialized = serializeHighlights(el);

      if (typeof serialized === "string") {
        resolve(serialized);
      } else if (serialized) {
        // If it's not a string, stringify it
        resolve(JSON.stringify(serialized));
      } else {
        resolve(undefined);
      }
    } catch (err) {
      console.error("Error serializing highlights:", err);
      resolve(undefined);
    }
  });
}

/**
 * React-aware version of deserializeHighlights
 *
 * @param el - The element to apply deserialized highlights to
 * @param json - Serialized highlights data
 * @returns Promise that resolves when deserialization is complete
 */
export function reactDeserializeHighlights(
  el: HTMLElement,
  json: string
): Promise<boolean> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      try {
        const hlDescriptors = JSON.parse(json);
        deserializeHighlights(el, hlDescriptors);
        resolve(true);
      } catch (err) {
        console.error("Error deserializing highlights:", err);
        resolve(false);
      }
    });
  });
}

/**
 * Get highlights from an element as a promise
 *
 * @param el - The element containing highlights
 * @returns Promise that resolves with an array of highlight elements
 */
export function reactGetHighlights(el: HTMLElement): Promise<HTMLElement[]> {
  return new Promise((resolve) => {
    try {
      const highlights = getHighlights(el, { container: el });
      resolve(highlights ? (highlights as HTMLElement[]) : []);
    } catch (err) {
      console.error("Error getting highlights:", err);
      resolve([]);
    }
  });
}

/**
 * Creates a helper for using TextHighlighter with React
 * This function sets up event handlers and provides utility methods
 *
 * @param el - The element to apply the highlighter to
 * @param options - Highlighting options
 * @param onHighlight - Callback when highlighting occurs
 * @returns Utility methods for working with highlights
 */
export function createReactHighlighter(
  el: HTMLElement,
  options?: optionsImpl,
  onHighlight?: (highlights: HTMLElement[]) => void
): {
  applyHighlight: (keepRange?: boolean) => Promise<boolean>;
  removeHighlights: () => Promise<boolean>;
  serializeHighlights: () => Promise<string | undefined>;
  deserializeHighlights: (json: string) => Promise<boolean>;
  getHighlights: () => Promise<HTMLElement[]>;
  setupEventListeners: () => { cleanup: () => void };
} {
  // Set up event handlers
  let isHighlighting = false;

  const handleSelection = () => {
    if (isHighlighting) return;

    const range = dom(el).getRange();
    if (range && !range.collapsed) {
      isHighlighting = true;

      const id = `highlight-${Date.now()}`;
      reactDoHighlight(el, id, false, options).then((success) => {
        if (success && onHighlight) {
          reactGetHighlights(el).then(onHighlight);
        }
        isHighlighting = false;
      });
    }
  };

  // Setup and cleanup function for event listeners
  const setupEventListeners = () => {
    el.addEventListener("mouseup", handleSelection);
    el.addEventListener("touchend", handleSelection);

    return {
      cleanup: () => {
        el.removeEventListener("mouseup", handleSelection);
        el.removeEventListener("touchend", handleSelection);
      },
    };
  };

  // Return utility methods
  return {
    applyHighlight: (keepRange?: boolean) => {
      const id = `highlight-${Date.now()}`;
      return reactDoHighlight(el, id, keepRange || false, options);
    },

    removeHighlights: () => {
      return reactRemoveHighlights(el, options);
    },

    serializeHighlights: () => {
      return reactSerializeHighlights(el);
    },

    deserializeHighlights: (json: string) => {
      return reactDeserializeHighlights(el, json);
    },

    getHighlights: () => {
      return reactGetHighlights(el);
    },

    setupEventListeners,
  };
}

/**
 * Guidelines for using TextHighlighter with React:
 *
 * Example with React Hooks:
 *
 * ```jsx
 * // In your React component:
 * import { useRef, useEffect, useState } from 'react';
 * import { createReactHighlighter } from './ReactLibrary';
 *
 * function HighlightableText({ text, options }) {
 *   const containerRef = useRef(null);
 *   const [highlights, setHighlights] = useState([]);
 *   const [highlighter, setHighlighter] = useState(null);
 *
 *   // Initialize highlighter after component mounts
 *   useEffect(() => {
 *     if (containerRef.current) {
 *       const highlighter = createReactHighlighter(
 *         containerRef.current,
 *         options,
 *         (newHighlights) => setHighlights(newHighlights)
 *       );
 *
 *       setHighlighter(highlighter);
 *
 *       // Set up event listeners
 *       const { cleanup } = highlighter.setupEventListeners();
 *
 *       // Clean up event listeners on unmount
 *       return cleanup;
 *     }
 *   }, []);
 *
 *   // Example of programmatic highlighting after a state change
 *   const handleHighlightClick = async () => {
 *     // First update state
 *     setSomeState(newValue);
 *
 *     // Wait for next render, then highlight
 *     setTimeout(async () => {
 *       if (highlighter) {
 *         await highlighter.applyHighlight();
 *         // Highlights will be updated via the callback
 *       }
 *     }, 0);
 *   };
 *
 *   return (
 *     <div>
 *       <div ref={containerRef}>{text}</div>
 *       <button onClick={handleHighlightClick}>Highlight</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * Important Notes:
 *
 * - Always use the async/Promise-based methods when modifying highlights
 * - When updating React state AND highlighting, either:
 *   1. Update state first, then highlight in a useEffect or setTimeout
 *   2. Highlight first, then update state after the Promise resolves
 * - Clean up event listeners in useEffect cleanup function
 * - Use the onHighlight callback to keep React state in sync with DOM changes
 */

/**
 * Hook to use TextHighlighter within React components
 *
 * @param options - TextHighlighter options
 * @returns Object with highlighting methods and state
 */
export const useTextHighlighter = (options?: optionsImpl) => {
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlights, setHighlights] = useState<HTMLElement[]>([]);
  const pendingHighlightRef = useRef<{
    elementRef: RefObject<HTMLElement>;
    id: string;
    keepRange: boolean;
    options?: optionsImpl;
  } | null>(null);

  /**
   * Apply a highlight to an element safely within React's lifecycle
   *
   * @param elementRef - React ref to the container element
   * @param id - Unique ID for the highlight
   * @param keepRange - Whether to keep the selection range after highlighting
   * @param highlightOptions - Options for the highlight
   * @returns Promise that resolves when highlighting is complete
   */
  const applyHighlight = useCallback(
    (
      elementRef: RefObject<HTMLElement>,
      id: string,
      keepRange: boolean = false,
      highlightOptions?: optionsImpl
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!elementRef.current) {
          resolve(false);
          return;
        }

        // Store highlight request for next effect cycle
        pendingHighlightRef.current = {
          elementRef,
          id,
          keepRange,
          options: highlightOptions || options,
        };

        // Trigger effect to apply highlight
        setIsHighlighting(true);

        // Return true to indicate request was queued
        resolve(true);
      });
    },
    [options]
  );

  // Apply pending highlight after render
  useEffect(() => {
    if (isHighlighting && pendingHighlightRef.current) {
      const {
        elementRef,
        id,
        keepRange,
        options: highlightOptions,
      } = pendingHighlightRef.current;

      if (elementRef.current) {
        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          try {
            const result = doHighlight(
              elementRef.current!,
              id,
              keepRange,
              highlightOptions
            );

            // Update highlights state after successful highlighting
            if (result) {
              const newHighlights = dom(elementRef.current).getHighlights({
                container: elementRef.current,
              });
              if (newHighlights) {
                setHighlights(Array.from(newHighlights as HTMLElement[]));
              }
            }
          } catch (error) {
            console.error("Error applying highlight:", error);
          } finally {
            // Reset state
            pendingHighlightRef.current = null;
            setIsHighlighting(false);
          }
        });
      }
    }
  }, [isHighlighting]);

  /**
   * Remove highlights from an element
   *
   * @param elementRef - React ref to the container element
   * @param removeOptions - Options for removing highlights
   * @returns Promise that resolves when removal is complete
   */
  const removeHighlight = useCallback(
    (
      elementRef: RefObject<HTMLElement>,
      removeOptions?: optionsImpl
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!elementRef.current) {
          resolve(false);
          return;
        }

        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          try {
            removeHighlights(elementRef.current!, removeOptions || options);
            setHighlights([]);
            resolve(true);
          } catch (error) {
            console.error("Error removing highlights:", error);
            resolve(false);
          }
        });
      });
    },
    [options]
  );

  /**
   * Serialize highlights to JSON for storage
   *
   * @param elementRef - React ref to the container element
   * @returns Promise that resolves with serialized highlights
   */
  const serializeHighlightsToJSON = useCallback(
    (elementRef: RefObject<HTMLElement>): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (!elementRef.current) {
          resolve(undefined);
          return;
        }

        try {
          const serialized = serializeHighlights(elementRef.current);
          resolve(serialized);
        } catch (error) {
          console.error("Error serializing highlights:", error);
          resolve(undefined);
        }
      });
    },
    []
  );

  /**
   * Deserialize highlights from JSON
   *
   * @param elementRef - React ref to the container element
   * @param hlDescriptors - Highlight descriptors from JSON
   * @returns Promise that resolves when deserialization is complete
   */
  const deserializeHighlightsFromJSON = useCallback(
    (
      elementRef: RefObject<HTMLElement>,
      hlDescriptors: hlDescriptorI[]
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!elementRef.current) {
          resolve(false);
          return;
        }

        // Defer to next animation frame to ensure React rendering is complete
        requestAnimationFrame(() => {
          try {
            deserializeHighlights(elementRef.current!, hlDescriptors);

            // Update highlights state
            const newHighlights = dom(elementRef.current).getHighlights({
              container: elementRef.current,
            });
            if (newHighlights) {
              setHighlights(Array.from(newHighlights as HTMLElement[]));
            }

            resolve(true);
          } catch (error) {
            console.error("Error deserializing highlights:", error);
            resolve(false);
          }
        });
      });
    },
    []
  );

  return {
    applyHighlight,
    removeHighlight,
    serializeHighlightsToJSON,
    deserializeHighlightsFromJSON,
    isHighlighting,
    highlights,
  };
};

/**
 * React component for highlightable text
 */
interface HighlightableProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  options?: optionsImpl;
  onHighlight?: (highlights: HTMLElement[]) => void;
}

export const Highlightable: React.FC<HighlightableProps> = ({
  children,
  className,
  id,
  options,
  onHighlight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHighlights, setContainerHighlights] = useState<HTMLElement[]>(
    []
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const highlighterRef = useRef<TextHighlighterSelf | null>(null);

  // Initialize highlighter after mount
  useEffect(() => {
    if (containerRef.current && !isInitialized) {
      // Setup highlighting on mouseup/touchend
      const handleSelection = () => {
        if (containerRef.current) {
          const range = dom(containerRef.current).getRange();

          if (range && !range.collapsed) {
            // Use requestAnimationFrame to ensure we're outside React's rendering cycle
            requestAnimationFrame(() => {
              if (containerRef.current) {
                const uniqueId = `highlight-${Date.now()}`;
                const result = doHighlight(
                  containerRef.current,
                  uniqueId,
                  false,
                  options
                );

                if (result) {
                  // Get updated highlights
                  const newHighlights = dom(containerRef.current).getHighlights(
                    { container: containerRef.current }
                  );
                  if (newHighlights) {
                    const highlightsArray = Array.from(
                      newHighlights as HTMLElement[]
                    );
                    setContainerHighlights(highlightsArray);
                    if (onHighlight) {
                      onHighlight(highlightsArray);
                    }
                  }
                }
              }
            });
          }
        }
      };

      // Add event listeners
      containerRef.current.addEventListener("mouseup", handleSelection);
      containerRef.current.addEventListener("touchend", handleSelection);

      setIsInitialized(true);

      // Clean up event listeners on unmount
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener("mouseup", handleSelection);
          containerRef.current.removeEventListener("touchend", handleSelection);
        }
      };
    }
  }, [options, onHighlight, isInitialized]);

  // Methods exposed via ref
  useEffect(() => {
    if (containerRef.current && isInitialized) {
      highlighterRef.current = {
        el: containerRef.current,
        options: options || {},

        // Public methods
        removeHighlights: () => {
          if (containerRef.current) {
            removeHighlights(containerRef.current, options);
            setContainerHighlights([]);
            if (onHighlight) {
              onHighlight([]);
            }
          }
        },

        getHighlights: () => {
          return containerHighlights;
        },

        serializeHighlights: () => {
          if (containerRef.current) {
            return serializeHighlights(containerRef.current);
          }
          return undefined;
        },

        deserializeHighlights: (json: string) => {
          if (containerRef.current && json) {
            try {
              const hlDescriptors = JSON.parse(json);
              deserializeHighlights(containerRef.current, hlDescriptors);

              // Update highlights state
              const newHighlights = dom(containerRef.current).getHighlights({
                container: containerRef.current,
              });
              if (newHighlights) {
                const highlightsArray = Array.from(
                  newHighlights as HTMLElement[]
                );
                setContainerHighlights(highlightsArray);
                if (onHighlight) {
                  onHighlight(highlightsArray);
                }
              }
            } catch (error) {
              console.error("Error deserializing highlights:", error);
            }
          }
        },

        highlightHandler: () => {
          // This is automatically handled by event listeners
        },

        doHighlight: (keepRange?: boolean) => {
          if (containerRef.current) {
            const uniqueId = `highlight-${Date.now()}`;
            return doHighlight(
              containerRef.current,
              uniqueId,
              keepRange || false,
              options
            );
          }
          return false;
        },
      } as unknown as TextHighlighterSelf;
    }
  }, [options, onHighlight, isInitialized, containerHighlights]);

  return (
    <div
      ref={containerRef}
      className={className}
      id={id}
      data-highlightable="true"
    >
      {children}
    </div>
  );
};

/**
 * Create a React forward ref component for highlightable text with imperative handle
 */
export interface HighlightableHandle {
  removeHighlights: () => void;
  applyHighlight: () => boolean;
  getHighlights: () => HTMLElement[];
  serializeHighlights: () => string | undefined;
  deserializeHighlights: (json: string) => void;
}

export const HighlightableWithRef = React.forwardRef<
  HighlightableHandle,
  HighlightableProps
>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<HTMLElement[]>([]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    removeHighlights: () => {
      if (containerRef.current) {
        removeHighlights(containerRef.current, props.options);
        setHighlights([]);
        if (props.onHighlight) {
          props.onHighlight([]);
        }
      }
    },

    applyHighlight: () => {
      if (containerRef.current) {
        const uniqueId = `highlight-${Date.now()}`;
        const result = doHighlight(
          containerRef.current,
          uniqueId,
          false,
          props.options
        );

        if (result) {
          // Get updated highlights
          const newHighlights = dom(containerRef.current).getHighlights({
            container: containerRef.current,
          });
          if (newHighlights) {
            const highlightsArray = Array.from(newHighlights as HTMLElement[]);
            setHighlights(highlightsArray);
            if (props.onHighlight) {
              props.onHighlight(highlightsArray);
            }
          }
        }

        return result;
      }
      return false;
    },

    getHighlights: () => {
      return highlights;
    },

    serializeHighlights: () => {
      if (containerRef.current) {
        return serializeHighlights(containerRef.current);
      }
      return undefined;
    },

    deserializeHighlights: (json: string) => {
      if (containerRef.current && json) {
        try {
          const hlDescriptors = JSON.parse(json);
          deserializeHighlights(containerRef.current, hlDescriptors);

          // Update highlights state
          const newHighlights = dom(containerRef.current).getHighlights({
            container: containerRef.current,
          });
          if (newHighlights) {
            const highlightsArray = Array.from(newHighlights as HTMLElement[]);
            setHighlights(highlightsArray);
            if (props.onHighlight) {
              props.onHighlight(highlightsArray);
            }
          }
        } catch (error) {
          console.error("Error deserializing highlights:", error);
        }
      }
    },
  }));

  return <Highlightable {...props} />;
});
