let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let offlineCache = JSON.parse(localStorage.getItem('offlineCache')) || null;
let quizHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
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
const quizContainer = document.getElementById('quiz-container');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const nextQuestionBtn = document.getElementById('next-question');
const restartQuizBtn = document.getElementById('restart-quiz');
const scoreDisplay = document.getElementById('score');
const totalQuestionsDisplay = document.getElementById('total-questions');

let quizState = JSON.parse(localStorage.getItem('quizState')) || {
    currentQuestion: null,
    score: 0,
    totalQuestions: 0,
    maxQuestions: 15,
    isActive: false,
    isResultSaved: false,
    timeLeft: 15
};

let timerInterval = null;

// Check if dictionary is loaded
if (typeof dictionary === 'undefined') {
    console.error('Dictionary data is not loaded');
    wordResult.innerHTML = '<p>Error: Dictionary data is not available. Please check if dictionary.js is loaded.</p>';
}

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
    document.querySelectorAll('.nav-btn, .header-btn, .favorite-btn, .delete-btn, .search-btn, .clear-btn:not(:disabled), .clear-history-btn, .close-settings-btn, #clear-cache, #export-history, .tts-btn, .quiz-btn, .quiz-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
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
    if (currentTab !== 'home') {
        switchTab('home');
    }
    performSearch();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentTab !== 'home') {
            switchTab('home');
        }
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
                        <button class="tts-btn" data-word="${data.word}" data-meaning="${data.meaning}"><i class="fas fa-volume-up"></i></button>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-word="${data.word}"><i class="fas fa-heart"></i></button>
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
        if (searchHistory.length > 20) searchHistory.pop();
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
                    <span class="list-word" data-word="${word}"><span class="english-word">${word}</span> - ${meaning}</span>
                    <button class="delete-btn" data-word="${word}"><i class="fas fa-trash"></i></button>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering history:', error);
        historyList.innerHTML = '<p>Error loading history. Dictionary data may not be available.</p>';
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
                    <span class="list-word" data-word="${word}"><span class="english-word">${word}</span> - ${meaning}</span>
                    <button class="delete-btn" data-word="${word}"><i class="fas fa-trash"></i></button>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering favorites:', error);
        favoritesList.innerHTML = '<p>Error loading favorites. Dictionary data may not be available.</p>';
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
    if (tab === 'quiz' && !quizState.isActive) {
        startQuiz();
    } else if (tab === 'quiz') {
        renderQuiz();
    }
}

content.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

content.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const tabs = ['home', 'history', 'favorites', 'quiz'];
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

document.addEventListener('click', (e) => {
    if (settingsPanel.classList.contains('active') &&
        !settingsPanel.contains(e.target) &&
        !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('active');
    }
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
        alert('Failed to export history. Dictionary data may not be available.');
    }
});

clearCacheBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        searchHistory = [];
        favorites = [];
        offlineCache = null;
        quizState = { currentQuestion: null, score: 0, totalQuestions: 0, maxQuestions: 15, isActive: false, isResultSaved: false, timeLeft: 15 };
        quizHistory = [];
        localStorage.removeItem('searchHistory');
        localStorage.removeItem('favorites');
        localStorage.removeItem('offlineCache');
        localStorage.removeItem('quizState');
        localStorage.removeItem('quizHistory');
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

function getRandomWords(count) {
    try {
        if (typeof dictionary === 'undefined' || !dictionary) {
            throw new Error('Dictionary data is not loaded');
        }
        const words = Object.keys(dictionary);
        if (words.length < count) {
            return words.sort(() => 0.5 - Math.random());
        }
        const shuffled = words.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    } catch (error) {
        console.error('Error getting random words:', error);
        return [];
    }
}

function generateQuizQuestion() {
    try {
        const words = getRandomWords(4);
        if (words.length < 1) {
            throw new Error('Not enough words in dictionary for quiz');
        }
        const correctIndex = Math.floor(Math.random() * words.length);
        const correctWord = words[correctIndex];
        const isEnglishToBangla = Math.random() < 0.5;
        return {
            word: correctWord,
            meaning: dictionary[correctWord],
            options: words,
            correctIndex,
            isEnglishToBangla
        };
    } catch (error) {
        console.error('Error generating quiz question:', error);
        return null;
    }
}

function getRelativeTime(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInMonth = 2592000;
    const secondsInYear = 31536000;

    if (diffInSeconds < secondsInMinute) {
        return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInHour) {
        const minutes = Math.floor(diffInSeconds / secondsInMinute);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInDay) {
        const hours = Math.floor(diffInSeconds / secondsInHour);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInWeek) {
        const days = Math.floor(diffInSeconds / secondsInDay);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInMonth) {
        const weeks = Math.floor(diffInSeconds / secondsInWeek);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInYear) {
        const months = Math.floor(diffInSeconds / secondsInMonth);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(diffInSeconds / secondsInYear);
        return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
}

function startTimer(newQuizOptions, newNextQuestionBtn, newQuizFeedback) {
    clearInterval(timerInterval);
    quizState.timeLeft = 15;
    const timerDisplay = document.getElementById('quiz-timer').querySelector('span');
    timerDisplay.textContent = `${quizState.timeLeft}s`;

    timerInterval = setInterval(() => {
        quizState.timeLeft--;
        timerDisplay.textContent = `${quizState.timeLeft}s`;
        if (quizState.timeLeft <= 0) {
            clearInterval(timerInterval);
            quizState.totalQuestions++;
            const { word, meaning, correctIndex, isEnglishToBangla } = quizState.currentQuestion;
            const correctAnswer = isEnglishToBangla ? meaning : word;
            newQuizFeedback.innerHTML = `<p class="incorrect">Time's up! The correct answer is "${correctAnswer}".</p>`;
            newQuizOptions.querySelector(`button[data-index="${correctIndex}"]`).classList.add('correct');
            newNextQuestionBtn.disabled = false;
            newQuizOptions.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
            quizState.currentQuestion = null;
            localStorage.setItem('quizState', JSON.stringify(quizState));
        }
    }, 1000);
}

function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1000';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ff0', '#0f0', '#00f', '#f00', '#ff0'];

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 10 + 5,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }

    for (let i = 0; i < 100; i++) {
        particles.push(createParticle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.size *= 0.98;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        particles.forEach((p, i) => {
            if (p.size < 0.5) {
                particles.splice(i, 1);
                particles.push(createParticle());
            }
        });

        if (particles.length > 0) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(canvas);
        }
    }

    animate();
    setTimeout(() => {
        particles.length = 0;
    }, 3000);
}

function showQuizStatistics() {
    try {
        quizContainer.innerHTML = `
            <div class="quiz-header">
                <h3>Quiz Statistics</h3>
                <div class="header-actions">
                    <button class="quiz-btn quiz-stats-back-btn" id="quiz-stats-back">Back to Quiz</button>
                </div>
            </div>
            <ul class="quiz-stats-list">
                ${quizHistory.length === 0 ? '<li>No quiz history available.</li>' : quizHistory.map((entry, index) => {
                    const percentage = Math.round((entry.score / entry.totalQuestions) * 100);
                    const circumference = 2 * Math.PI * 20;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;
                    return `
                        <li>
                            <i class="fas fa-list-ul list-icon"></i>
                            <span class="quiz-number">Quiz ${index + 1}:</span>
                            <span class="quiz-score">${entry.score}/${entry.totalQuestions}</span>
                            <span class="quiz-timestamp">${getRelativeTime(entry.timestamp)}</span>
                            <div class="quiz-progress">
                                <svg width="50" height="50" viewBox="0 0 50 50">
                                    <circle class="progress-ring-bg" cx="25" cy="25" r="20" />
                                    <circle class="progress-ring" cx="25" cy="25" r="20" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" />
                                </svg>
                                <span class="quiz-percentage">${percentage}%</span>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
        const backBtn = document.getElementById('quiz-stats-back');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                renderQuiz();
            });
        } else {
            console.error('Back to Quiz button not found');
        }
    } catch (error) {
        console.error('Error showing quiz statistics:', error);
        quizContainer.innerHTML = '<p>Error loading quiz statistics.</p>';
    }
}

function renderQuiz() {
    try {
        if (!quizContainer) {
            throw new Error('Quiz container not found');
        }
        quizContainer.innerHTML = `
            <div class="quiz-header">
                <h3>Quiz</h3>
                <button class="quiz-btn quiz-action-btn" id="view-statistics"><i class="fas fa-chart-bar"></i> Stats</button>
            </div>
            <div class="quiz-content">
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-bar-fill" id="quiz-progress-bar-fill" style="width: ${(quizState.totalQuestions / quizState.maxQuestions) * 100}%"></div>
                </div>
                <div class="quiz-score-timer">
                    <div id="quiz-score">Score: <span id="score">${quizState.score}</span> / <span id="total-questions">${quizState.totalQuestions}</span></div>
                    <div id="quiz-timer" class="quiz-timer"><i class="fas fa-clock"></i> <span>${quizState.timeLeft}s</span></div>
                </div>
                <div id="quiz-question" class="quiz-question"></div>
                <div id="quiz-options" class="quiz-options"></div>
                <div id="quiz-feedback" class="quiz-feedback"></div>
                <div class="quiz-actions">
                    <button class="quiz-btn quiz-action-btn" id="next-question" disabled>Next</button>
                    <button class="quiz-btn quiz-action-btn" id="restart-quiz" style="display: none;">Restart</button>
                </div>
            </div>
        `;
        const newQuizQuestion = document.getElementById('quiz-question');
        const newQuizOptions = document.getElementById('quiz-options');
        const newQuizFeedback = document.getElementById('quiz-feedback');
        const newNextQuestionBtn = document.getElementById('next-question');
        const newRestartQuizBtn = document.getElementById('restart-quiz');
        const newScoreDisplay = document.getElementById('score');
        const newTotalQuestionsDisplay = document.getElementById('total-questions');
        const newViewStatisticsBtn = document.getElementById('view-statistics');

        newViewStatisticsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearInterval(timerInterval);
            showQuizStatistics();
        });

        if (quizState.totalQuestions >= quizState.maxQuestions && !quizState.isResultSaved) {
            quizHistory.unshift({
                score: quizState.score,
                totalQuestions: quizState.totalQuestions,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
            quizState.isResultSaved = true;
            localStorage.setItem('quizState', JSON.stringify(quizState));
        }

        if (quizState.totalQuestions >= quizState.maxQuestions) {
            clearInterval(timerInterval);
            const percentage = Math.round((quizState.score / quizState.totalQuestions) * 100);
            newQuizQuestion.innerHTML = '<h2>Quiz Completed!</h2>';
            newQuizOptions.innerHTML = '';
            newQuizFeedback.innerHTML = `
                <p>Final Score: ${quizState.score} / ${quizState.totalQuestions} (${percentage}%)</p>
                <p>${percentage >= 80 ? 'Excellent job!' : percentage >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
            `;
            newNextQuestionBtn.style.display = 'none';
            newRestartQuizBtn.style.display = 'block';
            quizState.isActive = false;
            localStorage.setItem('quizState', JSON.stringify(quizState));
            if (percentage >= 80) {
                triggerConfetti();
            }
            newRestartQuizBtn.addEventListener('click', (e) => {
                e.preventDefault();
                startQuiz();
            });
            return;
        }

        if (!quizState.currentQuestion) {
            quizState.currentQuestion = generateQuizQuestion();
        }

        if (!quizState.currentQuestion) {
            clearInterval(timerInterval);
            newQuizQuestion.innerHTML = '<p>Error: Unable to load quiz question. Dictionary data may not be available.</p>';
            newQuizOptions.innerHTML = '';
            newQuizFeedback.innerHTML = '';
            newNextQuestionBtn.style.display = 'none';
            newRestartQuizBtn.style.display = 'block';
            quizState.isActive = false;
            localStorage.setItem('quizState', JSON.stringify(quizState));
            newRestartQuizBtn.addEventListener('click', (e) => {
                e.preventDefault();
                startQuiz();
            });
            return;
        }

        const { meaning, options, isEnglishToBangla } = quizState.currentQuestion;
        newQuizQuestion.innerHTML = isEnglishToBangla
            ? `<p>What is the Bangla meaning of "<span style="text-transform:capitalize">${quizState.currentQuestion.word}</span>"?</p>`
            : `<p>What is the English word for "${meaning}"?</p>`;
        newQuizOptions.innerHTML = options.map((option, index) => `
            <button class="quiz-option" data-index="${index}">
                ${isEnglishToBangla ? dictionary[option] : option}
            </button>
        `).join('');
        newQuizFeedback.innerHTML = '';
        newNextQuestionBtn.disabled = true;
        newNextQuestionBtn.style.display = 'block';
        newRestartQuizBtn.style.display = 'none';
        newScoreDisplay.textContent = quizState.score;
        newTotalQuestionsDisplay.textContent = quizState.totalQuestions;
        localStorage.setItem('quizState', JSON.stringify(quizState));

        startTimer(newQuizOptions, newNextQuestionBtn, newQuizFeedback);

        newQuizOptions.addEventListener('click', (e) => {
            const optionBtn = e.target.closest('.quiz-option');
            if (!optionBtn || !newNextQuestionBtn.disabled || quizState.timeLeft <= 0) return;
            try {
                clearInterval(timerInterval);
                const selectedIndex = parseInt(optionBtn.dataset.index);
                quizState.totalQuestions++;
                const { word, meaning, correctIndex, isEnglishToBangla } = quizState.currentQuestion;
                if (selectedIndex === correctIndex) {
                    quizState.score++;
                    newQuizFeedback.innerHTML = `
                        <p class="correct">Correct!</p>
                    `;
                    optionBtn.classList.add('correct');
                } else {
                    const correctAnswer = isEnglishToBangla ? meaning : word;
                    newQuizFeedback.innerHTML = `
                        <p class="incorrect">Incorrect. The correct answer is "${correctAnswer}".</p>
                    `;
                    optionBtn.classList.add('incorrect');
                    newQuizOptions.querySelector(`button[data-index="${correctIndex}"]`).classList.add('correct');
                }
                newScoreDisplay.textContent = quizState.score;
                newTotalQuestionsDisplay.textContent = quizState.totalQuestions;
                newNextQuestionBtn.disabled = false;
                newQuizOptions.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
                quizState.currentQuestion = null;
                localStorage.setItem('quizState', JSON.stringify(quizState));
            } catch (error) {
                console.error('Error handling quiz option click:', error);
                newQuizFeedback.innerHTML = '<p>Error processing answer.</p>';
            }
        });

        newNextQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearInterval(timerInterval);
            renderQuiz();
        });
    } catch (error) {
        console.error('Error rendering quiz:', error);
        quizContainer.innerHTML = '<p>Error loading quiz. Dictionary data may not be available.</p>';
        quizState.isActive = false;
        clearInterval(timerInterval);
        localStorage.setItem('quizState', JSON.stringify(quizState));
    }
}

function startQuiz() {
    quizState = {
        currentQuestion: null,
        score: 0,
        totalQuestions: 0,
        maxQuestions: 15,
        isActive: true,
        isResultSaved: false,
        timeLeft: 15
    };
    localStorage.setItem('quizState', JSON.stringify(quizState));
    renderQuiz();
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