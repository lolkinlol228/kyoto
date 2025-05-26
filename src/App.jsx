```jsx
import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const tracks = [
  {
    title: "Fine",
    artist: "Lemon Demon",
    url: "/music/Lemon-Demon-Fine.mp3",
    image: "/photos/fine-lemon-demon.jpg"
  },
  {
    title: "Night Dancer",
    artist: "imase",
    url: "/music/imase-night-dancer.mp3",
    image: "/photos/night-dancer-imase.jpg"
  }
];

function MusicPlayer({ track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHeartClicked, setHeartClicked] = useState(false);
  const [isShuffleClicked, setShuffleClicked] = useState(false);
  const [isInfoUp, setInfoUp] = useState(false);
  const audioRef = useRef(new Audio(track.url));

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleHeart = () => setHeartClicked(!isHeartClicked);
  const toggleShuffle = () => setShuffleClicked(!isShuffleClicked);
  const toggleInfo = () => setInfoUp(!isInfoUp);

  return (
    <div id="player" onMouseEnter={toggleInfo} onMouseLeave={toggleInfo}>
      <div className="album" style={{ backgroundImage: `linear-gradient(rgba(var(--dark), 0.25), rgba(var(--primary), 0.55)), url(${track.image})` }}>
        <div className={`heart ${isHeartClicked ? 'clicked' : ''}`} onClick={toggleHeart}>
          <i className="fas fa-heart"></i>
        </div>
        <div className={`shuffle ${isShuffleClicked ? 'clicked' : ''}`} onClick={toggleShuffle}>
          <i className="fas fa-random"></i>
        </div>
      </div>
      <div className={`info ${isInfoUp ? 'up' : ''}`}>
        <div className="progress-bar">
          <div className="time--current">1:25</div>
          <div className="time--total">-3:15</div>
          <div className="fill"></div>
        </div>
        <div className="currently-playing">
          <h2 className="song-name">{track.title}</h2>
          <h3 className="artist-name">{track.artist}</h3>
        </div>
        <div className="controls">
          <div className="previous"><i className="fas fa-backward"></i></div>
          <div className={`play ${isPlaying ? 'hidden' : ''}`} onClick={togglePlay}>
            <i className="fas fa-play"></i>
          </div>
          <div className={`pause ${isPlaying ? '' : 'hidden'}`} onClick={togglePlay}>
            <i className="fas fa-pause"></i>
          </div>
          <div className="next"><i className="fas fa-forward"></i></div>
        </div>
      </div>
    </div>
  );
}

function SteamProfile() {
  const [activeTrack, setActiveTrack] = useState(0);
  const [profile, setProfile] = useState({});
  const [dotaStats, setDotaStats] = useState({});
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    // Fetch Steam data via Vercel API route
    fetch('/api/steam-profile')
      .then(response => response.json())
      .then(data => {
        setProfile(data.profile || {});
        setDotaStats(data.dotaStats || {});
        setRecentMatches(data.recentMatches || []);
      })
      .catch(error => console.error('Error fetching Steam data:', error));

    // Setup Steam activity heatmap
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'matrix',
        data: {
          datasets: [{
            label: 'Steam Activity',
            data: [
              {x: 0, y: 0, v: 2}, {x: 1, y: 0, v: 5}, {x: 2, y: 0, v: 0},
              {x: 0, y: 1, v: 3}, {x: 1, y: 1, v: 4}, {x: 2, y: 1, v: 6},
            ],
            backgroundColor: (context) => {
              const value = context.dataset.data[context.dataIndex].v;
              return value === 0 ? 'rgba(255,255,255,0.2)' : `rgba(106,13,173,${value / 10})`;
            },
            width: ({chart}) => chart.chartArea.width / 7,
            height: ({chart}) => chart.chartArea.height / 3,
          }]
        },
        options: {
          scales: { x: { display: false }, y: { display: false } },
          plugins: { legend: { display: false } }
        }
      });
    }

    // Setup Dota 2 activity chart
    const dotaCtx = document.getElementById('dotaActivityChart')?.getContext('2d');
    if (dotaCtx) {
      new Chart(dotaCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [{
            label: 'Dota 2 Playtime (hours)',
            data: [50, 60, 45, 70, 55],
            borderColor: 'rgba(106,13,173,1)',
            backgroundColor: 'rgba(106,13,173,0.2)',
            fill: true,
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }, []);

  const getStatus = (state) => {
    const states = { 0: 'Offline', 1: 'Online', 2: 'Busy', 3: 'Away', 4: 'Snooze', 5: 'Looking to trade', 6: 'Looking to play' };
    return states[state] || 'Offline';
  };

  return (
    <div className="steam-profile">
      <div className="flex items-center mb-4">
        <img src={profile.avatarfull || 'https://via.placeholder.com/100'} alt="Avatar" className="w-16 h-16 rounded-full mr-4"/>
        <div>
          <h2 className="text-xl font-bold">{profile.personaname || 'Nickname'} (Kyoto)</h2>
          <p className={`text-sm ${getStatus(profile.personastate) === 'Online' ? 'text-green-400' : 'text-gray-400'}`}>
            {getStatus(profile.personastate)}
          </p>
        </div>
      </div>
      <p className="mb-4">Just a gamer who loves Dota 2 and music. Always chasing that next rank!</p>
      <h3 className="text-lg font-semibold">Dota 2 Stats</h3>
      <p>Total Hours: {Math.round((dotaStats.playtime_forever || 0) / 60)} hours</p>
      <p>Highest Rank: Immortal | Current Rank: Divine V</p>
      <h4 className="text-md font-semibold mt-2">Tinker Stats</h4>
      <p>Matches: 320 | Win Rate: 58% | KDA: 4.2</p>
      <h4 className="text-md font-semibold mt-2">Recent Matches</h4>
      <ul className="list-disc pl-5">
        {recentMatches.map((match, index) => (
          <li key={index}>Match ID: {match.match_id} | Result: {match.result === 0 ? 'Win' : 'Loss'} | Hero: Tinker</li>
        ))}
      </ul>
      <h4 className="text-md font-semibold mt-2">Dota 2 Activity</h4>
      <canvas id="dotaActivityChart" className="w-full h-32"></canvas>
      <h4 className="text-md font-semibold mt-2">Steam Activity Heatmap</h4>
      <canvas id="activityChart" className="w-full h-32 heatmap"></canvas>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Music Player</h3>
        <div className="flex space-x-4">
          {tracks.map((track, index) => (
            <button
              key={index}
              onClick={() => setActiveTrack(index)}
              className={`px-4 py-2 rounded ${activeTrack === index ? 'bg-purple-700' : 'bg-purple-500'} hover:bg-purple-600`}
            >
              {track.title}
            </button>
          ))}
        </div>
        <MusicPlayer track={tracks[activeTrack]} />
      </div>
    </div>
  );
}

export default SteamProfile;
```