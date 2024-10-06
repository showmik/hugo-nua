document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const searchInput = document.getElementById('search');
  const postListWrapper = document.getElementById('post-list-wrapper');

  // Function to initialize search
  function initializeSearch(postsData) {
    const fuse = new Fuse(postsData, {
      keys: ['title', 'tags'],
      threshold: 0.3
    });

    // Initial rendering of all posts
    renderPosts(postsData);

    // Listen for input events to filter posts with debouncing
    searchInput.addEventListener('input', debounce(e => {
      const query = e.target.value.trim();
      renderPosts(query ? fuse.search(query).map(result => result.item) : postsData);
    }, 300));
  }

  // Load search data only when search input is focused
  searchInput.addEventListener('focus', () => {
      fetch('/index.json')
        .then(response => response.json())
        .then(data => initializeSearch(data))
        .catch(error => console.error('Error fetching index.json:', error));
  }, { once: true }); // Add once:true to ensure it only fetches once

  // Function to group posts by year
  function groupPostsByYear(posts) {
    return posts.reduce((acc, post) => {
      const year = post.year;
      acc[year] = acc[year] || [];
      acc[year].push(post);
      return acc;
    }, {});
  }

  function renderPosts(posts) {
    const fragment = document.createDocumentFragment();
    postListWrapper.innerHTML = ''; // Clear current list

    // Group and sort posts by year
    const groupedPosts = groupPostsByYear(posts);
    Object.keys(groupedPosts).sort((a, b) => b - a).forEach(year => {
      const yearSection = document.createElement('section');
      yearSection.innerHTML = `<h2 class="year-header">${year}</h2>`;
      const postList = document.createElement('ul');
      postList.className = 'post-list all-posts';

      groupedPosts[year].forEach(post => {
        const item = document.createElement('li');
        item.className = 'post-list-item';
        item.innerHTML = `
          <div class="date-label">${formatDate(post.date)}</div>
          <a class="post-link" href="${post.href}">${post.title}</a>
        `;
        postList.appendChild(item);
      });

      yearSection.appendChild(postList);
      fragment.appendChild(yearSection);
    });

    postListWrapper.appendChild(fragment);
  }

  // Utility function to format date
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'short' 
    });
  }

  // Debounce function to limit function call rate
  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }
});
