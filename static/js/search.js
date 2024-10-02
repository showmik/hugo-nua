document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const searchInput = document.getElementById('search');
    const postListWrapper = document.getElementById('post-list-wrapper');
  
    // Fetch the search index JSON and initialize
    fetch('/index.json')
      .then(response => response.json())
      .then(data => initializeSearch(data))
      .catch(error => console.error('Error fetching index.json:', error));
  
    // Function to initialize search
    function initializeSearch(postsData) {
      const fuse = new Fuse(postsData, {
        keys: ['title', 'tags'],
        threshold: 0.1
      });
  
      // Initial rendering of all posts
      renderPosts(postsData);
  
      // Listen for input events to filter posts with debouncing
      searchInput.addEventListener('input', debounce(e => {
        const query = e.target.value.trim();
        renderPosts(query ? fuse.search(query).map(result => result.item) : postsData);
      }, 200));
    }
  
    // Function to group posts by year
    function groupPostsByYear(posts) {
      return posts.reduce((acc, post) => {
        const year = post.year;
        acc[year] = acc[year] || [];
        acc[year].push(post);
        return acc;
      }, {});
    }
  
    // Function to render posts grouped by year
    function renderPosts(posts) {
      postListWrapper.innerHTML = ''; // Clear current list
  
      // Group and sort posts by year
      const groupedPosts = groupPostsByYear(posts);
      Object.keys(groupedPosts).sort((a, b) => b - a).forEach(year => {
        // Create a section for each year
        const yearSection = document.createElement('section');
        yearSection.innerHTML = `<h2 class="year-header">${year}</h2>`;
        const postList = document.createElement('ul');
        postList.className = 'post-list';
  
        // Append each post to its year's section
        groupedPosts[year].forEach(post => {
          const item = document.createElement('li');
          item.className = 'post-list-item';
          item.innerHTML = `
            <div class="tag-post-wrapper"><div class="tags-wrapper">
              ${renderPostTags(post.tags)}
              </div><a class="post-link" href="${post.href}">${post.title}</a>
            </div>
            <div class="date-label">${formatDate(post.date)}</div>
          `;
          postList.appendChild(item);
        });
  
        yearSection.appendChild(postList);
        postListWrapper.appendChild(yearSection);
      });
    }
  
    // Function to render tags
    function renderPostTags(tags = []) {
      return tags.map(tag => `<a class="tag-type-1" href="/tags/${tag}/">${tag}</a>`).join('');
    }
  
    // Utility function to format date
    function formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
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
  