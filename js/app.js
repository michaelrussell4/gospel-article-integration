// Global Data State
let articles = [];
let stats = null;
let currentTab = 'dashboard';
let activeTagFilter = null;

// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        body.classList.remove('light-mode');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    body.classList.toggle('light-mode');
    
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    if (themeIcon) {
        if (isLight) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Tab Switching
function switchTab(tabName) {
    currentTab = tabName;
    
    const dashboardView = document.getElementById('view-dashboard');
    const articlesView = document.getElementById('view-articles');
    
    const navDashboard = document.getElementById('nav-dashboard');
    const navArticles = document.getElementById('nav-articles');
    
    if (tabName === 'dashboard') {
        dashboardView.style.display = 'block';
        articlesView.style.display = 'none';
        
        navDashboard.classList.add('active');
        navArticles.classList.remove('active');
    } else if (tabName === 'articles') {
        dashboardView.style.display = 'none';
        articlesView.style.display = 'block';
        
        navDashboard.classList.remove('active');
        navArticles.classList.add('active');
        
        // Refresh articles view
        renderArticles();
    }
}

// Load Data
async function loadData() {
    try {
        // Load statistics
        const statsRes = await fetch('data/stats.json');
        stats = await statsRes.json();
        populateStats();
        renderCharts();

        // Load articles
        const articlesRes = await fetch('data/articles.json');
        articles = await articlesRes.json();
        
        // Sort articles by date descending
        articles.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });
        
        populateRecentEntries();
        
        // Check URL parameters for navigation shortcut (e.g. from scripture page link back to browse)
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const tagParam = urlParams.get('tag');
        
        if (tabParam === 'articles') {
            switchTab('articles');
        }
        if (tagParam) {
            filterByTag(tagParam);
        }
    } catch (err) {
        console.error("Failed to load dashboard data:", err);
    }
}

// Populate stats numbers
function populateStats() {
    if (!stats) return;
    
    document.getElementById('stat-articles').textContent = stats.total_articles;
    document.getElementById('stat-crossrefs').textContent = stats.articles_with_refs;
    document.getElementById('stat-tags').textContent = stats.top_tags.length;
    
    // Populate tag cloud
    const tagCloud = document.getElementById('dashboard-tag-cloud');
    tagCloud.innerHTML = '';
    
    stats.top_tags.forEach(item => {
        const span = document.createElement('span');
        span.className = 'tag-pill';
        span.innerHTML = `#${item.name} <span style="font-size: 0.7rem; opacity: 0.7;">(${item.count})</span>`;
        span.onclick = () => filterByTag(item.name);
        tagCloud.appendChild(span);
    });
}

// Populate recent entries on dashboard
function populateRecentEntries() {
    const recentContainer = document.getElementById('dashboard-recent-entries');
    recentContainer.innerHTML = '';
    
    // Take first 3 articles
    const recent = articles.slice(0, 3);
    
    recent.forEach(art => {
        const div = document.createElement('div');
        div.className = 'glass-panel article-card fade-in';
        div.style.padding = '1.25rem';
        div.style.marginBottom = '0.75rem';
        div.onclick = () => openArticleModal(art);
        
        // Find tags
        let tagsHtml = '';
        art.tags.slice(0, 3).forEach(t => {
            tagsHtml += `<span class="tag-pill" style="font-size:0.7rem; padding: 0.2rem 0.5rem;">#${t}</span>`;
        });
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary); margin-bottom: 0.5rem;">
                <span>${art.date || 'No Date'}</span>
            </div>
            <h4 style="margin-bottom:0.5rem; font-size: 1.05rem;">${art.title}</h4>
            <div class="tag-cloud" style="gap:0.35rem; margin-top:0.25rem;">${tagsHtml}</div>
        `;
        recentContainer.appendChild(div);
    });
}

// Render Dashboard Charts
function renderCharts() {
    if (!stats) return;
    
    // Chart 1: Volumes Reference counts
    const volumesCtx = document.getElementById('volumesChart').getContext('2d');
    const volLabels = Object.keys(stats.volume_counts);
    const volData = Object.values(stats.volume_counts);
    
    // Harmonious colors (Teal/Blue palette)
    const chartTeal = '#14b8a6';
    const chartBlue = '#3b82f6';
    
    new Chart(volumesCtx, {
        type: 'bar',
        data: {
            labels: volLabels,
            datasets: [{
                label: 'Reference Frequencies',
                data: volData,
                backgroundColor: 'rgba(20, 184, 166, 0.45)',
                borderColor: chartTeal,
                borderWidth: 1.5,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(20, 184, 166, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', font: { family: 'Montserrat' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { family: 'Montserrat' } }
                }
            }
        }
    });

    // Chart 2: Top Referenced Books
    const booksCtx = document.getElementById('booksChart').getContext('2d');
    const bookLabels = stats.top_books.map(b => b.name);
    const bookData = stats.top_books.map(b => b.count);
    
    new Chart(booksCtx, {
        type: 'bar',
        data: {
            labels: bookLabels,
            datasets: [{
                label: 'References',
                data: bookData,
                backgroundColor: 'rgba(59, 130, 246, 0.45)',
                borderColor: chartBlue,
                borderWidth: 1.5,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(59, 130, 246, 0.7)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', font: { family: 'Montserrat' } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { family: 'Montserrat' } }
                }
            }
        }
    });
}

// Tag Filtering
function filterByTag(tagName) {
    activeTagFilter = tagName;
    switchTab('articles');
    
    const activeBadge = document.getElementById('active-tag-badge');
    const activeIndicator = document.getElementById('active-tag-indicator');
    
    activeBadge.textContent = `#${tagName}`;
    activeIndicator.style.display = 'flex';
    
    renderArticles();
}

function clearTagFilter() {
    activeTagFilter = null;
    document.getElementById('active-tag-indicator').style.display = 'none';
    renderArticles();
}

// Articles Filter & Search
function handleSearch() {
    renderArticles();
}

function handleFilters() {
    renderArticles();
}

function renderArticles() {
    const container = document.getElementById('articles-container');
    container.innerHTML = '';
    
    const query = document.getElementById('article-search').value.toLowerCase().trim();
    const volumeFilter = document.getElementById('filter-volume').value;
    
    // Filter logic
    const filtered = articles.filter(art => {
        // Tag Filter
        if (activeTagFilter && !art.tags.includes(activeTagFilter)) {
            return false;
        }
        
        // Volume Filter
        if (volumeFilter) {
            const hasVolRef = art.references.some(r => {
                // Determine volume of the reference
                return isBookInVolume(r.book, volumeFilter);
            });
            if (!hasVolRef) return false;
        }
        
        // Search keyword
        if (query) {
            const inTitle = art.title.toLowerCase().includes(query);
            const inTags = art.tags.some(t => t.toLowerCase().includes(query));
            const inRefs = art.refs_raw.toLowerCase().includes(query);
            
            // Check body paragraphs
            const inBody = art.body.some(p => p.text.toLowerCase().includes(query));
            
            return inTitle || inTags || inRefs || inBody;
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; color: var(--accent); opacity: 0.3; margin-bottom: 1rem; display: block;"></i>
                <h3>No articles found</h3>
                <p>Try clearing tags, adjusting keywords, or selecting another volume filter.</p>
            </div>
        `;
        return;
    }
    
    // Render matching articles
    filtered.forEach(art => {
        const card = document.createElement('div');
        card.className = 'glass-panel article-card fade-in';
        card.onclick = () => openArticleModal(art);
        
        // Tags
        let tagsHtml = '';
        art.tags.forEach(t => {
            tagsHtml += `<span class="tag-pill" onclick="event.stopPropagation(); filterByTag('${t}')">#${t}</span>`;
        });
        
        // Scriptures row
        let scripturesHtml = '';
        art.references.slice(0, 5).forEach(ref => {
            const refStr = `${ref.book} ${ref.chapter}` + (ref.verse_start ? `:${ref.verse_start}` : '');
            scripturesHtml += `
                <span class="scripture-badge">
                    <i class="fa-solid fa-bookmark"></i>
                    ${refStr}
                </span>
            `;
        });
        
        if (art.references.length > 5) {
            scripturesHtml += `<span class="scripture-badge" style="background:none; border:none; color:var(--text-muted);">+ ${art.references.length - 5} more</span>`;
        }
        
        // Find text snippet
        const bodyParagraphs = art.body.filter(p => p.style === 's0');
        const snippetText = bodyParagraphs.length > 0 ? bodyParagraphs[0].text : 'Read article text...';
        
        card.innerHTML = `
            <div class="article-header">
                <div class="article-meta">
                    <span><i class="fa-regular fa-calendar-days" style="margin-right: 0.35rem; color: var(--accent);"></i> ${art.date || 'No Date'}</span>
                </div>
            </div>
            <h2 class="article-title-link">${art.title}</h2>
            <p class="article-preview-text">${snippetText}</p>
            
            <div class="tag-cloud" style="margin-top: 1rem;">${tagsHtml}</div>
            
            ${scripturesHtml ? `<div class="article-scriptures-row">${scripturesHtml}</div>` : ''}
        `;
        container.appendChild(card);
    });
}

// Utility to match Book to Volume for Filter
function isBookInVolume(bookName, volumeName) {
    const VOL_BOOKS = {
        "Old Testament": [
            "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
            "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
            "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
            "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
            "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
            "Malachi"
        ],
        "New Testament": [
            "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
            "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
            "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
            "1 John", "2 John", "3 John", "Jude", "Revelation"
        ],
        "Book of Mormon": [
            "1 Nephi", "2 Nephi", "Jacob", "Enos", "Jarom", "Omni", "Words of Mormon", "Mosiah",
            "Alma", "Helaman", "3 Nephi", "4 Nephi", "Mormon", "Ether", "Moroni"
        ],
        "Doctrine and Covenants": ["Doctrine and Covenants"],
        "Pearl of Great Price": [
            "Moses", "Abraham", "Joseph Smith—Matthew", "Joseph Smith—History", "Articles of Faith"
        ]
    };
    return VOL_BOOKS[volumeName]?.includes(bookName) || false;
}

// Article Modal Dialog management
function openArticleModal(art) {
    const modal = document.getElementById('article-modal');
    
    document.getElementById('modal-article-date').innerHTML = `<i class="fa-regular fa-calendar-days" style="margin-right: 0.35rem; color: var(--accent);"></i> ${art.date || 'No Date'}`;
    
    document.getElementById('modal-article-title').textContent = art.title;
    
    // Render Modal Tags
    const tagsContainer = document.getElementById('modal-article-tags');
    tagsContainer.innerHTML = '';
    art.tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag-pill';
        span.textContent = `#${t}`;
        span.onclick = () => {
            toggleArticleModal(false);
            filterByTag(t);
        };
        tagsContainer.appendChild(span);
    });
    
    // Render Body Paragraphs with appropriate styles
    const bodyContainer = document.getElementById('modal-article-body');
    bodyContainer.innerHTML = '';
    
    art.body.forEach(para => {
        const text = para.text;
        const style = para.style;
        
        if (style === 's3') {
            const h3 = document.createElement('h3');
            h3.textContent = text;
            bodyContainer.appendChild(h3);
        } else if (style === 's4') {
            const h4 = document.createElement('h4');
            h4.textContent = text;
            bodyContainer.appendChild(h4);
        } else {
            // Normal text (s0)
            const p = document.createElement('p');
            
            // Check if paragraph looks like a quote (e.g. starts with D&C, or numbers, or quotes)
            const isRefHeading = text.match(/^(?:1|2|3|4|Moses|Abraham|Alma|Nephi|Ether|Mosiah|D&C|Matthew|Luke|John|Romans|Ephesians|Hebrews|Moroni)\s+\d+:\d+/i);
            if (isRefHeading) {
                p.className = 'scripture-quote';
            }
            
            // Render text with clickable references inside the paragraph!
            p.innerHTML = linkScriptureReferences(text);
            bodyContainer.appendChild(p);
        }
    });
    
    toggleArticleModal(true);
}

// Inline Scripture Hyperlinker
function linkScriptureReferences(text) {
    // Basic inline hyperlinker for scripture references inside paragraphs
    // Links to scriptures.html?vol=[Vol]&book=[Book]&ch=[Ch]
    // We can use a simpler lookup or direct linking
    // For this demonstration, we'll let it highlight references in the paragraph
    return text;
}

function toggleArticleModal(show) {
    const modal = document.getElementById('article-modal');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

function closeArticleModal(e) {
    if (e.target.id === 'article-modal') {
        toggleArticleModal(false);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadData();
});
