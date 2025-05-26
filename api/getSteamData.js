export default async function handler(request, response) {
  // Получаем SteamID из запроса
  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const steamId = searchParams.get('steamid');

  // Получаем СЕКРЕТНЫЙ КЛЮЧ из безопасного хранилища Vercel
  const apiKey = process.env.STEAM_API_KEY;

  if (!steamId || !apiKey) {
    return response.status(400).json({ error: 'SteamID и API ключ обязательны' });
  }

  try {
    // Наш посредник делает запросы к Steam
    const [summaryResponse, gamesResponse] = await Promise.all([
      fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`),
      fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&format=json`)
    ]);

    const summaryData = await summaryResponse.json();
    const gamesData = await gamesResponse.json();
    
    // И отдает ответ вашему сайту
    response.status(200).json({
      player: summaryData.response.players[0],
      games: gamesData.response.games,
    });
  } catch (error) {
    response.status(500).json({ error: 'Ошибка на стороне сервера' });
  }
}