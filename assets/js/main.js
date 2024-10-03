document.addEventListener("DOMContentLoaded", function() {
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
          ]
        });
      } catch (error) {
        console.error("Error rendering math:", error);
      }
    } else {
      console.warn("renderMathInElement function is not available.");
    }
  });
  