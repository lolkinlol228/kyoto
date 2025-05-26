// =================================================================
//                        ФИНАЛЬНЫЙ SCRIPT.JS
// =================================================================

// Запускаем весь код только после полной загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем музыкальный плеер со всей его логикой
    initializeMusicPlayer();
    
    // Инициализируем загрузку ВСЕХ данных из Steam
    initializeSteamData();
});


/**
 * =================================================================
 * ЛОГИКА МУЗЫКАЛЬНОГО ПЛЕЕРА
 * =================================================================
 * Содержит всю логику для управления плеером, плейлистом и интерфейсом.
 */
function initializeMusicPlayer() {
    const player = document.getElementById('player');
    if (!player) {
        console.error("Элемент плеера с id='player' не найден!");
        return;
    }

    const playBtn = player.querySelector('.play');
    const pauseBtn = player.querySelector('.pause');
    const prevBtn = player.querySelector('.prev');
    const nextBtn = player.querySelector('.next');
    const heartBtn = player.querySelector('.heart');
    const shuffleBtn = player.querySelector('.shuffle');
    const repeatBtn = player.querySelector('.repeat');
    const progressBar = player.querySelector('.fill');
    const currentTimeEl = player.querySelector('.time--current');
    const totalTimeEl = player.querySelector('.time--total');
    const songNameEl = player.querySelector('.song-name');
    const artistNameEl = player.querySelector('.artist-name');
    const albumArtEl = player.querySelector('.album');
    const audio = new Audio();

    const tracks = [
        { name: "Fine", artist: "Lemon Demon", url: "/music/Lemon-Demon-Fine.mp3", art: "/photos/fine-lemon-demon.jpg" },
        { name: "NIGHT DANCER", artist: "imase", url: "/music/imase-night-dancer.mp3", art: "/photos/night-dancer-imase.jpg" }
    ];

    let currentTrackIndex = 0;
    let isShuffle = false;
    let isRepeat = false;

    function loadTrack(trackIndex) {
        const track = tracks[trackIndex];
        songNameEl.textContent = track.name;
        artistNameEl.textContent = track.artist;
        albumArtEl.style.backgroundImage = `linear-gradient(rgba(42, 10, 74, 0.45), rgba(74, 20, 140, 0.65)), url('${track.art}')`;
        audio.src = track.url;
        audio.addEventListener('loadedmetadata', () => { totalTimeEl.textContent = formatTime(audio.duration); });
        progressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
    }

    function playTrack() { audio.play(); playBtn.style.display = 'none'; pauseBtn.style.display = 'inline-block'; }
    function pauseTrack() { audio.pause(); playBtn.style.display = 'inline-block'; pauseBtn.style.display = 'none'; }

    function nextTrack() {
        if (isShuffle) {
            let newIndex;
            do { newIndex = Math.floor(Math.random() * tracks.length); } while (tracks.length > 1 && newIndex === currentTrackIndex);
            currentTrackIndex = newIndex;
        } else {
            currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        }
        loadTrack(currentTrackIndex);
        playTrack();
    }

    function prevTrack() { currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length; loadTrack(currentTrackIndex); playTrack(); }
    function updateProgress() { if (audio.duration) { progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`; currentTimeEl.textContent = formatTime(audio.currentTime); } }
    function formatTime(seconds) { const minutes = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${minutes}:${secs < 10 ? '0' : ''}${secs}`; }
    function onTrackEnd() { if (isRepeat) { playTrack(); } else { nextTrack(); } }

    playBtn.addEventListener('click', playTrack);
    pauseBtn.addEventListener('click', pauseTrack);
    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);
    heartBtn.addEventListener('click', () => heartBtn.classList.toggle('clicked'));
    shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('clicked', isShuffle); });
    repeatBtn.addEventListener('click', () => { isRepeat = !isRepeat; repeatBtn.classList.toggle('clicked', isRepeat); });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onTrackEnd);

    loadTrack(currentTrackIndex);
}


/**
 * =================================================================
 * ЛОГИКА ИНТЕГРАЦИИ СО STEAM API (ПОЛНАЯ ВЕРСИЯ)
 * =================================================================
 * Содержит всю логику для получения и отображения данных из Steam.
 */
function initializeSteamData() {

    /**
     * Запрашивает данные у нашей серверной функции /api/steam
     * @param {string} endpointPath - Путь к API Steam, который мы хотим вызвать.
     * @returns {Promise<object|null>} - Данные от API или null в случае ошибки.
     */
    async function fetchFromApi(endpointPath) {
        // Добавляем к пути параметр, который гарантирует, что кэш не будет мешать
        const url = `/api/steam?endpoint=${endpointPath}&nocache=${new Date().getTime()}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Ошибка от нашего API: ${response.status} - ${response.statusText}`);
                const errorData = await response.json();
                console.error('Детали ошибки:', errorData);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Критическая ошибка при запросе к ${url}:`, error);
            return null;
        }
    }

    // --- Функции для обновления HTML ---

    function updateProfile(data) {
        const player = data?.response?.players?.[0];
        if (!player) { document.getElementById('steam-name').textContent = 'Профиль не найден'; return; };
        document.getElementById('steam-avatar').src = player.avatarfull;
        document.getElementById('steam-name').textContent = player.personaname;
        document.getElementById('steam-desc').innerHTML = player.realname ? `Имя: ${player.realname}` : 'Описание отсутствует.';
        const statusEl = document.getElementById('steam-status');
        if (player.gameextrainfo) { statusEl.textContent = `В игре: ${player.gameextrainfo}`; statusEl.className = 'in-game'; } 
        else if (player.personastate === 1) { statusEl.textContent = 'В сети'; statusEl.className = 'online'; } 
        else { statusEl.textContent = 'Не в сети'; statusEl.className = 'offline'; }
    }

    function updateDotaStats(data) {
        const dotaGame = data?.response?.games?.find(game => game.appid === 570);
        const dotaHoursEl = document.getElementById('dota-hours');
        if (dotaGame) {
            dotaHoursEl.textContent = Math.round(dotaGame.playtime_forever / 60).toLocaleString();
        } else {
            dotaHoursEl.textContent = "0";
        }
    }

    function updateRecentGames(data) {
        const container = document.getElementById('recent-games');
        const games = data?.response?.games;
        if (!games || games.length === 0) { container.innerHTML = "<p>Нет данных о недавних играх.</p>"; return; }
        container.innerHTML = "";
        games.slice(0, 3).forEach(game => {
            const gameEl = document.createElement('div');
            gameEl.className = 'game';
            gameEl.innerHTML = `
                <img src="https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg" alt="${game.name}">
                <div><strong>${game.name}</strong><p>${(game.playtime_2weeks / 60).toFixed(1)} ч. за 2 недели</p></div>`;
            container.appendChild(gameEl);
        });
    }

    // --- Запускаем все запросы ---

    console.log("Запускаю загрузку данных из Steam...");

    // 1. Запрос информации о профиле
    fetchFromApi('ISteamUser/GetPlayerSummaries/v0002/')
        .then(data => {
            if (data) updateProfile(data);
            else document.getElementById('steam-profile').innerHTML = '<h3>Не удалось загрузить профиль</h3>';
        });

    // 2. Запрос об играх для получения часов в Dota 2
    fetchFromApi('IPlayerService/GetOwnedGames/v0001/?include_appinfo=true')
        .then(data => {
            if (data) updateDotaStats(data);
            else document.getElementById('dota-hours').textContent = 'Ошибка';
        });

    // 3. Запрос о недавно сыгранных играх
    fetchFromApi('IPlayerService/GetRecentlyPlayedGames/v0001/')
        .then(data => {
            if (data) updateRecentGames(data);
            else document.getElementById('recent-games').innerHTML = '<p>Не удалось загрузить игры</p>';
        });
}