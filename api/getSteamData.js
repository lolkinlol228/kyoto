export default async function handler(request, response) {
  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const steamId = searchParams.get('steamid');
  const apiKey = process.env.STEAM_API_KEY;

  // --- НОВАЯ УЛУЧШЕННАЯ ПРОВЕРКА ---
  if (!apiKey) {
    return response.status(400).json({ error: 'Секретный ключ API не найден на сервере. Проверьте имя и значение переменной в настройках Vercel.' });
  }
  if (!steamId || steamId === 'СЮДА_ВСТАВЬТЕ_ВАШ_STEAMID64') {
    return response.status(400).json({ error: 'ID пользователя Steam не был получен от страницы. Проверьте, что вы вставили его в файл index.html.' });
  }
  // --- КОНЕЦ ПРОВЕРКИ ---

  try {
    const [summaryResponse, gamesResponse] = await Promise.all([
      fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`),
      fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&format=json`)
    ]);

    const summaryData = await summaryResponse.json();
    const gamesData = await gamesResponse.json();
    
    response.status(200).json({
      player: summaryData.response.players[0],
      games: gamesData.response.games,
    });
  } catch (error) {
    response.status(500).json({ error: 'Ошибка на стороне сервера при запросе к Steam.' });
  }
}