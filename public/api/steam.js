// Файл: api/steam.js (улучшенная версия)

export default async function handler(request, response) {
  const steamApiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;
  
  // Получаем endpoint из строки запроса ?endpoint=...
  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const endpointPath = searchParams.get('endpoint');

  if (!steamApiKey || !steamId) {
    return response.status(500).json({ error: 'Ключ API Steam или ID не настроены на сервере.' });
  }

  if (!endpointPath) {
    return response.status(400).json({ error: 'Параметр endpoint отсутствует в запросе.' });
  }

  // Собираем URL для Steam API.
  // Мы добавляем steamid и key в конце, это работает для всех нужных нам методов.
  const steamApiUrl = `https://api.steampowered.com/${endpointPath}&key=${steamApiKey}&steamid=${steamId}&format=json`;

  try {
    const steamResponse = await fetch(steamApiUrl);

    if (!steamResponse.ok) {
      // Если Steam вернул ошибку, пересылаем ее для отладки
      return response.status(steamResponse.status).json({ error: `Steam API ответил ошибкой: ${steamResponse.statusText}` });
    }

    const data = await steamResponse.json();
    
    // Устанавливаем заголовки, чтобы Vercel кэшировал ответ на 1 минуту.
    // Это ускоряет повторные загрузки и защищает от слишком частых запросов к Steam.
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json(data);

  } catch (error) {
    console.error("Критическая ошибка в серверной функции:", error);
    return response.status(500).json({ error: 'Не удалось получить данные от API Steam.' });
  }
}