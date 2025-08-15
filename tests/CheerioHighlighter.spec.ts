// CheerioHighlighter.spec.ts
import { serializeHighlights, deserializeHighlights } from "../src/Library";
import { serializeHighlightsCheerio, deserializeHighlightsCheerio } from "../src/CheerioHighlighter";

describe("CheerioHighlighter", () => {
  // Mock document and setup
  beforeEach(() => {
    // Create a mock DOM environment
    document.body.innerHTML = `
      <div id="test-container">
        <p>This is a <span data-highlighted="true" data-id="highlight1" data-backgroundcolor="#ffff7b" class="highlighted">highlighted</span> text for testing.</p>
        <p>Another <span data-highlighted="true" data-id="highlight2" data-backgroundcolor="#a3ffac" class="highlighted">test highlight</span> here.</p>
      </div>
    `;
  });

  it("should produce the same output as serializeHighlights", () => {
    // Get the test container
    const container = document.getElementById("test-container") as HTMLElement;
    
    // Run both implementations
    const originalResult = serializeHighlights(container);
    const cheerioResult = serializeHighlightsCheerio(container);
    
    // Compare the results
    expect(cheerioResult).toEqual(originalResult);
  });
  
  it("should deserialize highlights properly", () => {
    // Get the test container
    const container = document.getElementById("test-container") as HTMLElement;
    
    // First, serialize the highlights
    const hlDescriptors = serializeHighlights(container);
    
    // Create a new container to deserialize into
    const newContainer = document.createElement("div");
    newContainer.innerHTML = `
      <div>
        <p>This is a highlighted text for testing.</p>
        <p>Another test highlight here.</p>
      </div>
    `;
    
    // Deserialize using both implementations
    const originalHighlights = deserializeHighlights(newContainer, hlDescriptors);
    
    // Reset the container for the Cheerio implementation
    newContainer.innerHTML = `
      <div>
        <p>This is a highlighted text for testing.</p>
        <p>Another test highlight here.</p>
      </div>
    `;
    
    const cheerioHighlights = deserializeHighlightsCheerio(newContainer, hlDescriptors);
    
    // Compare the results - both should have created the same number of highlights
    expect(cheerioHighlights.length).toEqual(originalHighlights.length);
  });
});
