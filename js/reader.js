// State variables
let volumeData = null;
let scriptureRefs = null;
let articles = null;
let currentVolume = '';
let currentBook = '';
let currentChapter = '';

// Theme support (matching dashboard)
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

// Caching indexes
async function loadIndexes() {
    try {
        if (!scriptureRefs) {
            const refRes = await fetch('data/scripture_refs.json');
            scriptureRefs = await refRes.json();
        }
        if (!articles) {
            const artRes = await fetch('data/articles.json');
            articles = await artRes.json();
        }
    } catch (err) {
        console.error("Failed to load cross-reference indexes:", err);
    }
}

// Volume dropdown handler
async function onVolumeChange() {
    const selectVol = document.getElementById('select-volume');
    const selectBook = document.getElementById('select-book');
    const selectCh = document.getElementById('select-chapter');
    
    currentVolume = selectVol.value;
    
    // Reset child inputs
    selectBook.innerHTML = '<option value="">Select Book...</option>';
    selectBook.disabled = true;
    selectCh.innerHTML = '<option value="">Select Chapter...</option>';
    selectCh.disabled = true;
    
    document.getElementById('scripture-text-panel').style.display = 'none';
    document.getElementById('reader-instruction').style.display = 'block';
    
    if (!currentVolume) return;
    
    // Determine JSON file
    const fileMap = {
        "Old Testament": "ot.json",
        "New Testament": "nt.json",
        "Book of Mormon": "bofm.json",
        "Doctrine and Covenants": "dc.json",
        "Pearl of Great Price": "pgp.json"
    };
    
    const jsonFile = fileMap[currentVolume];
    if (!jsonFile) return;
    
    try {
        // Load volume JSON
        const res = await fetch(`data/scriptures/${jsonFile}`);
        volumeData = await res.json();
        
        // Populate books dropdown
        const bookNames = Object.keys(volumeData.books);
        bookNames.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            selectBook.appendChild(opt);
        });
        
        selectBook.disabled = false;
        
        // Pre-load reference maps in background while user chooses
        loadIndexes();
        
    } catch (err) {
        console.error(`Failed to load volume ${currentVolume}:`, err);
    }
}

// Book dropdown handler
function onBookChange() {
    const selectBook = document.getElementById('select-book');
    const selectCh = document.getElementById('select-chapter');
    
    currentBook = selectBook.value;
    
    selectCh.innerHTML = '<option value="">Select Chapter...</option>';
    selectCh.disabled = true;
    
    document.getElementById('scripture-text-panel').style.display = 'none';
    document.getElementById('reader-instruction').style.display = 'block';
    
    if (!currentBook || !volumeData) return;
    
    // Populate chapters dropdown
    const chapters = Object.keys(volumeData.books[currentBook].chapters);
    
    // Sort chapters numerically
    chapters.sort((a, b) => parseInt(a) - parseInt(b));
    
    chapters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `Chapter ${c}`;
        selectCh.appendChild(opt);
    });
    
    selectCh.disabled = false;
}

// Chapter dropdown handler
async function onChapterChange() {
    const selectCh = document.getElementById('select-chapter');
    currentChapter = selectCh.value;
    
    if (!currentChapter || !volumeData || !currentBook) return;
    
    // Ensure indices are loaded
    await loadIndexes();
    
    renderChapter();
}

// Render Chapter Text & Highlights
function renderChapter() {
    const chapterData = volumeData.books[currentBook].chapters[currentChapter];
    const versesContainer = document.getElementById('verses-container');
    versesContainer.innerHTML = '';
    
    document.getElementById('chapter-title').innerHTML = `
        <span style="font-size:0.9rem; color:var(--accent); text-transform:uppercase; letter-spacing:1px; font-weight:600; display:block; margin-bottom:0.25rem;">${currentBook}</span>
        Chapter ${currentChapter}
    `;
    
    // Hide instructions, show text panel
    document.getElementById('reader-instruction').style.display = 'none';
    document.getElementById('scripture-text-panel').style.display = 'block';
    
    const verses = chapterData.verses;
    const verseKeys = Object.keys(verses);
    
    // Sort verses numerically
    verseKeys.sort((a, b) => parseInt(a) - parseInt(b));
    
    verseKeys.forEach(vNum => {
        const text = verses[vNum];
        const verseKey = `${currentBook} ${currentChapter}:${vNum}`;
        
        const div = document.createElement('div');
        div.className = 'verse-item fade-in';
        
        // Check if there are journal articles referencing this verse
        const isReferenced = scriptureRefs && scriptureRefs[verseKey];
        
        if (isReferenced) {
            div.classList.add('referenced');
            div.onclick = () => openFootnotesDrawer(verseKey);
        }
        
        div.innerHTML = `
            <span class="verse-number">${vNum}</span>
            <span class="verse-text">${text}</span>
        `;
        versesContainer.appendChild(div);
    });
}

// Drawer Footnote Manager
function toggleFootnoteDrawer(show) {
    const drawer = document.getElementById('footnote-drawer');
    if (show) {
        drawer.classList.add('active');
    } else {
        drawer.classList.remove('active');
    }
}

function openFootnotesDrawer(verseKey) {
    document.getElementById('drawer-verse-title').textContent = verseKey;
    
    const container = document.getElementById('drawer-footnotes-container');
    container.innerHTML = '';
    
    const artIds = scriptureRefs[verseKey] || [];
    
    if (artIds.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No footnotes found.</p>';
        toggleFootnoteDrawer(true);
        return;
    }
    
    // Resolve article summaries
    artIds.forEach(id => {
        const art = articles.find(a => a.id === id);
        if (!art) return;
        
        const div = document.createElement('div');
        div.className = 'footnote-article-item fade-in';
        div.onclick = () => openArticleModal(art);
        
        const bodyParagraphs = art.body.filter(p => p.style === 's0');
        const snippetText = bodyParagraphs.length > 0 ? bodyParagraphs[0].text : 'Read article text...';
        
        div.innerHTML = `
            <div class="footnote-article-title">${art.title}</div>
            <div class="footnote-article-date"><i class="fa-regular fa-calendar-days" style="margin-right: 0.35rem; color: var(--accent);"></i> ${art.date || 'No Date'}</div>
            <div class="footnote-article-snippet">${snippetText}</div>
        `;
        container.appendChild(div);
    });
    
    toggleFootnoteDrawer(true);
}

// Modal Article Reader inside scriptures page (so they don't have to leave the page!)
function openArticleModal(art) {
    const modal = document.getElementById('article-modal');
    
    document.getElementById('modal-article-date').innerHTML = `<i class="fa-regular fa-calendar-days" style="margin-right: 0.35rem; color: var(--accent);"></i> ${art.date || 'No Date'}`;
    
    document.getElementById('modal-article-title').textContent = art.title;
    
    // Tags
    const tagsContainer = document.getElementById('modal-article-tags');
    tagsContainer.innerHTML = '';
    art.tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag-pill';
        span.textContent = `#${t}`;
        // Inside reader, tags can just display (or redirect back to main index search!)
        span.onclick = () => {
            window.location.href = `index.html?tab=articles&tag=${encodeURIComponent(t)}`;
        };
        tagsContainer.appendChild(span);
    });
    
    // Body paragraphs
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
            const p = document.createElement('p');
            const isRefHeading = text.match(/^(?:1|2|3|4|Moses|Abraham|Alma|Nephi|Ether|Mosiah|D&C|Matthew|Luke|John|Romans|Ephesians|Hebrews|Moroni)\s+\d+:\d+/i);
            if (isRefHeading) {
                p.className = 'scripture-quote';
            }
            p.textContent = text;
            bodyContainer.appendChild(p);
        }
    });
    
    toggleArticleModal(true);
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
});
