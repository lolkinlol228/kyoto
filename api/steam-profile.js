```javascript
const fetch = require('node-fetch');

export default async function handler(req, res) {
  const apiKey = process.env.STEAM_API_KEY;
  const steamID = process.env.STEAM_ID;

  if (!apiKey || !steamID) {
    return res.status(500).json({ error: 'Missing API key or Steam ID' });
  }

  try {
    // Fetch profile
    const profileResponse = await fetch(
      `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamID}`
    );
    const profileData = await profileResponse.json();
    const profile = profileData.response.players[0] || {};

    // Fetch Dota 2 stats
    const dotaResponse = await fetch(
      `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamID}`
    );
    const dotaData = await dotaResponse.json();
    const dotaStats = dotaData.response.games?.find(game => game.appid === 570) || {};

    // Fetch recent Dota 2 matches (Tinker, hero_id=34)
    const matchesResponse = await fetch(
      `https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1/?key=${apiKey}&account_id=${steamID}&hero_id=34`
    );
    const matchesData = await matchesResponse.json();
    const recentMatches = matchesData.result.matches?.slice(0, 3) || [];

    res.status(200).json({ profile, dotaStats, recentMatches });
  } catch (error) {
    console.error('Error fetching Steam data:', error);
    res.status(500).json({ error: 'Failed to fetch Steam data' });
  }
}
```