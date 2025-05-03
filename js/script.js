let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let offlineCache = JSON.parse(localStorage.getItem('offlineCache')) || null;
let currentTab = 'home';
let touchStartX = 0;
let startY, pullDistance;

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const wordResult = document.getElementById('word-result');
const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');
const clearHistoryBtn = document.getElementById('clear-history');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const fontSizeSelect = document.getElementById('font-size');
const themeColorSelect = document.getElementById('theme-color');
const languageSelect = document.getElementById('language');
const clearCacheBtn = document.getElementById('clear-cache');
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loadingSpinner = document.getElementById('loading-spinner');
const offlineMessage = document.getElementById('offline-message');
const content = document.getElementById('content');
const exportHistoryBtn = document.getElementById('export-history');

try {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    const savedFontSize = localStorage.getItem('fontSize') || 'font-medium';
    document.body.classList.add(savedFontSize);
    fontSizeSelect.value = savedFontSize;
    const savedThemeColor = localStorage.getItem('themeColor') || 'theme-purple';
    document.body.classList.add(savedThemeColor);
    themeColorSelect.value = savedThemeColor;
} catch (error) {
    console.error('Error loading settings:', error);
}

if (!navigator.onLine && offlineCache) {
    offlineMessage.style.display = 'block';
    displayWord(offlineCache);
}

try {
    document.querySelectorAll('.nav-btn, .header-btn, .favorite-btn, .delete-btn, .search-btn, .clear-btn:not(:disabled), .clear-history-btn, .close-settings-btn, #clear-cache, #export-history, .tts-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);
            const timeoutId = setTimeout(() => ripple.remove(), 600);
        });
    });
} catch (error) {
    console.error('Error setting up ripple effect:', error);
}

searchInput.addEventListener('input', () => {
    clearBtn.disabled = !searchInput.value.trim();
});

function performSearch() {
    const word = searchInput.value.trim().toLowerCase();
    if (word) {
        loadingSpinner.style.display = 'block';
        offlineMessage.style.display = 'none';
        try {
            if (typeof dictionary === 'undefined') {
                throw new Error('Dictionary data is not loaded');
            }
            const meaning = dictionary[word];
            loadingSpinner.style.display = 'none';
            if (meaning) {
                const data = { word, meaning };
                displayWord(data);
                saveToHistory(word);
                offlineCache = data;
                localStorage.setItem('offlineCache', JSON.stringify(offlineCache));
            } else {
                wordResult.innerHTML = '<p>Word not found.</p>';
            }
        } catch (error) {
            console.error('Search error:', error);
            loadingSpinner.style.display = 'none';
            wordResult.innerHTML = '<p>Error during search. Please try again.</p>';
            if (!navigator.onLine && offlineCache) {
                offlineMessage.style.display = 'block';
                displayWord(offlineCache);
            }
        }
    } else {
        loadingSpinner.style.display = 'none';
        wordResult.innerHTML = '';
    }
}

searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    performSearch();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
});

clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    wordResult.innerHTML = '';
    clearBtn.disabled = true;
    searchInput.focus();
});

function displayWord(data) {
    try {
        const isFavorite = favorites.includes(data.word);
        wordResult.innerHTML = `
            <div class="word-card">
                <div class="word-header">
                    <h2>${data.word}</h2>
                    <div class="word-actions">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-word="${data.word}"><i class="fas fa-heart"></i></button>
                        <button class="tts-btn" data-word="${data.word}" data-meaning="${data.meaning}"><i class="fas fa-volume-up"></i></button>
                    </div>
                </div>
                <p class="meaning"><strong>Meaning:</strong> ${data.meaning}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error displaying word:', error);
        wordResult.innerHTML = '<p>Error displaying word.</p>';
    }
}

function textToSpeech(word, meaning) {
    try {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`${word}. Meaning: ${meaning}`);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            throw new Error('SpeechSynthesis not supported');
        }
    } catch (error) {
        console.error('Text-to-Speech error:', error);
        alert('Text-to-Speech is not supported in your browser or there was an error.');
    }
}

wordResult.addEventListener('click', (e) => {
    const favoriteBtn = e.target.closest('.favorite-btn');
    const ttsBtn = e.target.closest('.tts-btn');
    if (favoriteBtn) {
        const word = favoriteBtn.dataset.word;
        if (favorites.includes(word)) {
            favorites = favorites.filter(w => w !== word);
            favoriteBtn.classList.remove('active');
        } else {
            favorites.push(word);
            favoriteBtn.classList.add('active');
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    } else if (ttsBtn) {
        const word = ttsBtn.dataset.word;
        const meaning = ttsBtn.dataset.meaning;
        textToSpeech(word, meaning);
    }
});

function saveToHistory(word) {
    if (!searchHistory.includes(word)) {
        searchHistory.unshift(word);
        if (searchHistory.length > 10) searchHistory.pop();
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        renderHistory();
    }
}

function renderHistory() {
    try {
        if (typeof dictionary === 'undefined') {
            throw new Error('Dictionary data is not loaded');
        }
        historyList.innerHTML = searchHistory.map(word => {
            const meaning = dictionary[word] || 'Translation not available';
            return `
                <li>
                    <i class="fas fa-clock list-icon"></i>
                    <span class="list-word" data-word="${word}">${word} - ${meaning}</span>
                    <button class="delete-btn" data-word="${word}"><i class="fas fa-trash"></i></button>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering history:', error);
        historyList.innerHTML = '<p>Error loading history.</p>';
    }
}

function renderFavorites() {
    try {
        if (typeof dictionary === 'undefined') {
            throw new Error('Dictionary data is not loaded');
        }
        favoritesList.innerHTML = favorites.map(word => {
            const meaning = dictionary[word] || 'Translation not available';
            return `
                <li>
                    <i class="fas fa-heart list-icon"></i>
                    <span class="list-word" data-word="${word}">${word} - ${meaning}</span>
                    <button class="delete-btn" data-word="${word}"><i class="fas fa-trash"></i></button>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering favorites:', error);
        favoritesList.innerHTML = '<p>Error loading favorites.</p>';
    }
}

historyList.addEventListener('click', (e) => {
    const listWord = e.target.closest('.list-word');
    const deleteBtn = e.target.closest('.delete-btn');
    if (listWord) {
        searchInput.value = listWord.dataset.word;
        switchTab('home');
        performSearch();
    } else if (deleteBtn) {
        const word = deleteBtn.dataset.word;
        searchHistory = searchHistory.filter(w => w !== word);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        renderHistory();
    }
});

favoritesList.addEventListener('click', (e) => {
    const listWord = e.target.closest('.list-word');
    const deleteBtn = e.target.closest('.delete-btn');
    if (listWord) {
        searchInput.value = listWord.dataset.word;
        switchTab('home');
        performSearch();
    } else if (deleteBtn) {
        const word = deleteBtn.dataset.word;
        favorites = favorites.filter(w => w !== word);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
});

clearHistoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    searchHistory = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    renderHistory();
});

navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.dataset.tab && btn.dataset.tab !== currentTab) {
            switchTab(btn.dataset.tab);
        }
    });
});

function switchTab(tab) {
    currentTab = tab;
    navButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(tab).classList.add('active');
}

content.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

content.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const tabs = ['home', 'history', 'favorites'];
    const currentIndex = tabs.indexOf(currentTab);
    if (diff > 50 && currentIndex < tabs.length - 1) {
        switchTab(tabs[currentIndex + 1]);
    } else if (diff < -50 && currentIndex > 0) {
        switchTab(tabs[currentIndex - 1]);
    }
});

content.addEventListener('touchstart', (e) => {
    if (content.scrollTop === 0 && currentTab === 'home') {
        startY = e.touches[0].clientY;
    }
});

content.addEventListener('touchmove', (e) => {
    if (startY) {
        pullDistance = e.touches[0].clientY - startY;
        if (pullDistance > 0) {
            content.style.transform = `translateY(${pullDistance / 3}px)`;
        }
    }
});

content.addEventListener('touchend', () => {
    if (startY && pullDistance > 150) {
        if (searchInput.value.trim()) {
            performSearch();
        }
    }
    content.style.transition = 'transform 0.3s ease';
    content.style.transform = '';
    setTimeout(() => {
        content.style.transition = '';
    }, 300);
    startY = pullDistance = null;
});

settingsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    settingsPanel.classList.add('active');
});

closeSettingsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    settingsPanel.classList.remove('active');
});

darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkModeToggle.checked);
});

fontSizeSelect.addEventListener('change', () => {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(fontSizeSelect.value);
    localStorage.setItem('fontSize', fontSizeSelect.value);
});

themeColorSelect.addEventListener('change', () => {
    document.body.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-red', 'theme-orange', 'theme-teal', 'theme-pink', 'theme-indigo');
    document.body.classList.add(themeColorSelect.value);
    localStorage.setItem('themeColor', themeColorSelect.value);
});

languageSelect.addEventListener('change', () => {
    localStorage.setItem('language', languageSelect.value);
});

exportHistoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    try {
        if (searchHistory.length === 0) {
            alert('No search history to export!');
            return;
        }
        if (typeof dictionary === 'undefined') {
            throw new Error('Dictionary data is not loaded');
        }
        const csvContent = 'data:text/csv;charset=utf-8,Word,Meaning\n' + searchHistory.map(word => {
            const meaning = dictionary[word] || 'Translation not available';
            return `"${word}","${meaning}"`;
        }).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'search_history.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting history:', error);
        alert('Failed to export history.');
    }
});

clearCacheBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        searchHistory = [];
        favorites = [];
        offlineCache = null;
        localStorage.removeItem('searchHistory');
        localStorage.removeItem('favorites');
        localStorage.removeItem('offlineCache');
        renderHistory();
        renderFavorites();
        wordResult.innerHTML = '';
        alert('Cache cleared successfully!');
    } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Failed to clear cache.');
    }
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

try {
    if (typeof dictionary === 'undefined') {
        console.error('Dictionary data is not loaded');
        wordResult.innerHTML = '<p>Error: Dictionary data is not available.</p>';
    } else {
        renderHistory();
        renderFavorites();
    }
} catch (error) {
    console.error('Error during initialization:', error);
    wordResult.innerHTML = '<p>Error initializing application.</p>';
}