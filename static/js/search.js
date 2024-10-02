
// Fetch the search index JSON
fetch('/index.json')
    .then(response => response.json())
    .then(data => {
        // Configure Fuse.js search options
        const options = {
            keys: ['title', 'tags'], // Fields to search
            threshold: 0.1 // Adjust for how fuzzy the search should be
        };

        // Initialize Fuse.js with data and options
        const fuse = new Fuse(data, options);

        // Get references to input field and post list container
        const searchInput = document.getElementById('search');
        const postListWrapper = document.getElementById('post-list-wrapper');

        // Function to group posts by year
        function groupPostsByYear(posts) {
            const grouped = {};
            posts.forEach(post => {
                const year = post.year;
                if (!grouped[year]) grouped[year] = [];
                grouped[year].push(post);
            });
            return grouped;
        }

        // Function to render grouped posts by year
        function renderPosts(posts) {
            postListWrapper.innerHTML = ''; // Clear current list
            const groupedPosts = groupPostsByYear(posts);

            // Render posts grouped by year
            Object.keys(groupedPosts).sort((a, b) => b - a).forEach(year => {
                const yearSection = document.createElement('section');
                yearSection.innerHTML = `<h2 class="year-header">${year}</h2>`;

                const postList = document.createElement('ul');
                postList.classList.add('post-list');

                groupedPosts[year].forEach(post => {
                    const item = document.createElement('li');
                    item.classList.add('post-list-item');
                    item.innerHTML = `
              <div class="tag-post-wrapper">
                
                ${post.tags && post.tags.length ? renderPostTags(post.tags) : ''}
                <a class="post-link" href="${post.href}">${post.title}</a>
              </div>
              <div class="date">${new Date(post.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
            `;
                    postList.appendChild(item);
                });

                yearSection.appendChild(postList);
                postListWrapper.appendChild(yearSection);
            });
        }

        // Function to render tags for each post without commas
        function renderPostTags(tags) {
            return tags.map(tag => `<a class="tag-type-1" href="/tags/${tag}/">${tag}</a>`).join('');
        }

        function debounce(func, delay) {
            let debounceTimer;
            return function () {
                const context = this;
                const args = arguments;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(context, args), delay);
            };
        }


        // Initial rendering of all posts
        renderPosts(data);

        // Listen for input events to filter posts
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value;
            const results = fuse.search(query);
            const filteredPosts = results.map(result => result.item);

            // Render filtered posts
            if (query === '') {
                renderPosts(data);
            } else {
                renderPosts(filteredPosts);
            }
        }, 200)); // Adjust delay as needed (in milliseconds)

    })
    .catch(error => console.error('Error fetching index.json:', error));
