// =================================================================
// ОБЩИЕ НАСТРОЙКИ И ИНИЦИАЛИЗАЦИЯ
// =================================================================

// Ожидаем, пока вся HTML-структура страницы (DOM) будет загружена,
// прежде чем выполнять скрипт. Это предотвращает ошибки, связанные с
// попыткой найти элементы, которые еще не существуют.
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем музыкальный плеер
    initializeMusicPlayer();
    
    // Инициализируем загрузку данных из Steam
    initializeSteamData();
});


/*
 * =================================================================
 * ПОЛНАЯ ЛОГИКА МУЗЫКАЛЬНОГО ПЛЕЕРА
 * =================================================================
 * Этот скрипт следует разместить перед закрывающим тегом </body> в вашем HTML.
 * Он найдет плеер по id="player" и "оживит" его.
 */

// Мы начинаем выполнять код только после того, как вся HTML-страница
// полностью загрузится. Это стандартная и безопасная практика.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ПОИСК ЭЛЕМЕНТОВ И НАСТРОЙКА СОСТОЯНИЯ ---

    const player = document.getElementById('player');
    // Если элемент плеера не найден на странице, прекращаем выполнение, чтобы избежать ошибок.
    if (!player) {
        console.error("Элемент плеера с id='player' не найден!");
        return;
    }

    // Находим все дочерние элементы управления внутри плеера
    const playBtn = player.querySelector('.play');
    const pauseBtn = player.querySelector('.pause');
    const prevBtn = player.querySelector('.prev');
    const nextBtn = player.querySelector('.next');
    
    const heartBtn = player.querySelector('.heart');
    const shuffleBtn = player.querySelector('.shuffle');
    const repeatBtn = player.querySelector('.repeat'); // Убедитесь, что эта кнопка есть в HTML

    const progressBar = player.querySelector('.fill');
    const currentTimeEl = player.querySelector('.time--current');
    const totalTimeEl = player.querySelector('.time--total');
    
    const songNameEl = player.querySelector('.song-name');
    const artistNameEl = player.querySelector('.artist-name');
    const albumArtEl = player.querySelector('.album');

    // Создаем главный аудио-объект, который будет проигрывать музыку
    const audio = new Audio();

    /*
     * Плейлист.
     * Чтобы добавить новую песню, просто скопируйте объект {} и вставьте его
     * с новыми данными, указав правильные пути к файлам.
     */
    const tracks = [
        {
            name: "Fine",
            artist: "Lemon Demon",
            url: "/music/Lemon-Demon-Fine.mp3",
            art: "/photos/fine-lemon-demon.jpg"
        },
        {
            name: "NIGHT DANCER",
            artist: "imase",
            url: "/music/imase-night-dancer.mp3",
            art: "/photos/night-dancer-imase.jpg"
        }
    ];

    // Переменные для отслеживания текущего состояния плеера
    let currentTrackIndex = 0;
    let isShuffle = false;
    let isRepeat = false;


    // --- 2. ОСНОВНЫЕ ФУНКЦИИ ПЛЕЕРА ---

    /**
     * Загружает трек по его индексу в плейлисте и обновляет интерфейс.
     * @param {number} trackIndex - Индекс трека в массиве `tracks`.
     */
    function loadTrack(trackIndex) {
        const track = tracks[trackIndex];

        // Обновляем информацию на экране
        songNameEl.textContent = track.name;
        artistNameEl.textContent = track.artist;
        albumArtEl.style.backgroundImage = `linear-gradient(rgba(42, 10, 74, 0.45), rgba(74, 20, 140, 0.65)), url('${track.art}')`;

        // Загружаем аудиофайл
        audio.src = track.url;

        // Когда метаданные (например, длительность) загрузятся, обновляем общее время.
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        });
        
        // Сбрасываем прогресс-бар и текущее время
        progressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
    }

    /**
     * Запускает воспроизведение текущего трека.
     */
    function playTrack() {
        audio.play();
        playBtn.style.display = 'none';   // Скрываем кнопку Play
        pauseBtn.style.display = 'inline-block'; // Показываем кнопку Pause
    }

    /**
     * Ставит воспроизведение на паузу.
     */
    function pauseTrack() {
        audio.pause();
        playBtn.style.display = 'inline-block'; // Показываем кнопку Play
        pauseBtn.style.display = 'none';    // Скрываем кнопку Pause
    }
    
    /**
     * Переключает на следующий трек с учетом режимов Shuffle и Repeat.
     */
    function nextTrack() {
        if (isShuffle) {
            // Если включено перемешивание, выбираем случайный трек,
            // который не совпадает с текущим.
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * tracks.length);
            } while (tracks.length > 1 && newIndex === currentTrackIndex);
            currentTrackIndex = newIndex;
        } else {
            // Иначе просто переходим к следующему по кругу.
            currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        }
        
        loadTrack(currentTrackIndex);
        playTrack();
    }

    /**
     * Переключает на предыдущий трек.
     */
    function prevTrack() {
        // Переходим к предыдущему треку по кругу
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        playTrack();
    }
    
    /**
     * Обновляет прогресс-бар и счетчики времени.
     */
    function updateProgress() {
        if (audio.duration) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    }
    
    /**
     * Форматирует секунды в строку "ММ:СС".
     * @param {number} seconds - Время в секундах.
     * @returns {string} - Отформатированное время.
     */
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Вызывается, когда трек заканчивается.
     */
    function onTrackEnd() {
        if (isRepeat) {
            // Если включен повтор, проигрываем тот же трек заново
            playTrack();
        } else {
            // Иначе переключаем на следующий
            nextTrack();
        }
    }


    // --- 3. НАЗНАЧЕНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ ---

    // События кнопок управления
    playBtn.addEventListener('click', playTrack);
    pauseBtn.addEventListener('click', pauseTrack);
    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);
    
    // Кнопки опций
    heartBtn.addEventListener('click', () => heartBtn.classList.toggle('clicked'));
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle; // Меняем состояние перемешивания
        shuffleBtn.classList.toggle('clicked', isShuffle); // Обновляем вид кнопки
    });
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat; // Меняем состояние повтора
        repeatBtn.classList.toggle('clicked', isRepeat); // Обновляем вид кнопки
    });
    
    // События самого аудио-элемента
    audio.addEventListener('timeupdate', updateProgress); // Постоянно обновляем прогресс
    audio.addEventListener('ended', onTrackEnd); // Выполняем действие, когда трек закончился

    // --- 4. ПЕРВЫЙ ЗАПУСК ---

    // Загружаем самый первый трек (с индексом 0) при загрузке страницы.
    loadTrack(currentTrackIndex);
    
    // Если вам нужно, чтобы другая логика (например, Steam API) работала,
    // ее можно инициализировать здесь же.
    // initializeSteamData(); 
});


// =================================================================
// ЛОГИКА ИНТЕГРАЦИИ С API STEAM
// =================================================================

function initializeSteamData() {
    // ВАЖНО: Эти переменные будут автоматически подставлены Vercel из
    // настроек Environment Variables вашего проекта.
    // Локально они будут `undefined`.
    const STEAM_API_KEY = import.meta.env.VITE_STEAM_API_KEY;
    const STEAM_ID = import.meta.env.VITE_STEAM_ID;

    // Если ключи не заданы, выводим ошибку и прекращаем выполнение.
    if (!STEAM_API_KEY || !STEAM_ID) {
        console.error("Ключ API Steam или Steam ID не найдены. Убедитесь, что вы настроили переменные окружения в Vercel.");
        // Показываем ошибку на странице
        document.getElementById('steam-name').textContent = "Ошибка конфигурации";
        document.getElementById('steam-desc').textContent = "Проверьте переменные окружения на Vercel.";
        return;
    }

    // Прокси для обхода ограничений CORS.
    const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

    // Базовый URL для всех запросов к Steam API
    const API_BASE_URL = 'https://api.steampowered.com';

    // Функция для выполнения запросов к API
    async function fetchSteamData(endpoint) {
        const url = `${PROXY_URL}${API_BASE_URL}${endpoint}&key=${STEAM_API_KEY}&steamids=${STEAM_ID}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Не удалось загрузить данные из ${endpoint}:`, error);
            return null; // Возвращаем null в случае ошибки
        }
    }
    
    // Функции для обновления отдельных блоков на странице

    function updateProfile(data) {
        const player = data?.response?.players?.[0];
        if (!player) {
            document.getElementById('steam-name').textContent = 'Профиль не найден';
            return;
        };

        document.getElementById('steam-avatar').src = player.avatarfull;
        document.getElementById('steam-name').textContent = player.personaname;
        document.getElementById('steam-desc').innerHTML = player.realname ? `Настоящее имя: ${player.realname}` : 'Описание отсутствует.';

        const statusEl = document.getElementById('steam-status');
        if (player.gameextrainfo) {
            statusEl.textContent = `В игре: ${player.gameextrainfo}`;
            statusEl.className = 'in-game';
        } else if (player.personastate === 1) {
            statusEl.textContent = 'В сети';
            statusEl.className = 'online';
        } else {
            statusEl.textContent = 'Не в сети';
            statusEl.className = 'offline';
        }
    }

    function updateDotaStats(data) {
        const dotaGame = data?.response?.games?.find(game => game.appid === 570);
        const dotaHoursEl = document.getElementById('dota-hours');

        if (dotaGame) {
            const hours = Math.round(dotaGame.playtime_forever / 60);
            dotaHoursEl.textContent = hours.toLocaleString(); // Форматирует число (e.g., 1,234)
        } else {
            dotaHoursEl.textContent = "0";
        }
    }

    function updateRecentGames(data) {
        const container = document.getElementById('recent-games');
        const games = data?.response?.games;

        if (!games || games.length === 0) {
            container.innerHTML = "<p>Нет недавно сыгранных игр.</p>";
            return;
        }

        container.innerHTML = ""; // Очищаем контейнер от текста "Загрузка..."
        games.slice(0, 3).forEach(game => {
            const gameEl = document.createElement('div');
            gameEl.className = 'game';
            const hours2w = (game.playtime_2weeks / 60).toFixed(1);
            gameEl.innerHTML = `
                <img src="https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg" alt="${game.name}">
                <div>
                    <strong>${game.name}</strong>
                    <p>${hours2w} ч. за 2 недели</p>
                </div>
            `;
            container.appendChild(gameEl);
        });
    }

    // Запускаем все запросы одновременно для ускорения загрузки
    
    // Запрос информации о профиле
    fetchSteamData(`/ISteamUser/GetPlayerSummaries/v0002/?`)
        .then(data => data ? updateProfile(data) : document.getElementById('steam-profile').innerHTML = '<h3>Не удалось загрузить профиль</h3>');

    // Запрос об играх для получения часов в Dota 2
    fetchSteamData(`/IPlayerService/GetOwnedGames/v0001/?format=json&include_appinfo=true&steamid=${STEAM_ID}`) // steamid здесь нужен как отдельный параметр
        .then(data => data ? updateDotaStats(data) : document.getElementById('dota-hours').textContent = 'Ошибка');

    // Запрос о недавно сыгранных играх
    fetchSteamData(`/IPlayerService/GetRecentlyPlayedGames/v0001/?format=json&steamid=${STEAM_ID}`)
        .then(data => data ? updateRecentGames(data) : document.getElementById('recent-games').innerHTML = '<p>Не удалось загрузить игры</p>');
}