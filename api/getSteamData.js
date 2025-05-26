export default async function handler(request, response) {
    console.log('--- [1] Функция getSteamData запущена ---');

    const apiKey = process.env.STEAM_API_KEY;
    console.log('--- [2] Проверяю API ключ... Найден ли ключ в Vercel?', apiKey ? `Да, найден` : 'НЕТ, ПУСТО!');

    const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const steamId = searchParams.get('steamid');
    console.log('--- [3] Проверяю SteamID... Получен ID от сайта:', steamId ? steamId : 'НЕТ, ПУСТО!');

    if (!steamId || !apiKey) {
        console.log('--- [!] ОШИБКА: Ключ или ID отсутствуют. Отправляю ответ 400. ---');
        return response.status(400).json({ error: 'Ключ или ID отсутствуют, как показано в логе выше.' });
    }

    console.log('--- [4] Все данные на месте. Начинаю запросы к Steam API... ---');
    try {
        const [summaryResponse, gamesResponse] = await Promise.all([
            fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`),
            fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=true`)
        ]);
        
        console.log('--- [5] Ответы от Steam получены. Статус ответа по профилю:', summaryResponse.status);
        console.log('--- [6] Статус ответа по играм:', gamesResponse.status);

        if (!summaryResponse.ok || !gamesResponse.ok) {
            throw new Error('Один из запросов к Steam провалился.');
        }

        const summaryData = await summaryResponse.json();
        const gamesData = await gamesResponse.json();
        
        console.log('--- [7] Данные успешно преобразованы в JSON. Отправляю ответ сайту. ---');
        
        response.status(200).json({
            player: summaryData.response.players[0],
            games: (gamesData.response.games || []).sort((a, b) => b.playtime_forever - a.playtime_forever),
        });

    } catch (error) {
        console.error('--- [!] КРИТИЧЕСКАЯ ОШИБКА в блоке try...catch ---', error);
        response.status(500).json({ error: 'Ошибка на стороне сервера при запросе к Steam.' });
    }
}