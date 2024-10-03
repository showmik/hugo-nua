document.addEventListener("DOMContentLoaded", function() {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "$$", right: "$$", display: true},  // Block math
        {left: "$", right: "$", display: false}    // Inline math
      ]
    });
  });
  