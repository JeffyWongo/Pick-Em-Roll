import { useState, useEffect } from 'react';
import { Calendar, Trophy, TrendingUp, User, LogOut, RefreshCw } from 'lucide-react';
import { BalldontlieAPI } from "@balldontlie/sdk";

const NBAPredictor = () => {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [userStats, setUserStats] = useState({ points: 1000, correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLogin, setIsLogin] = useState(true);

  // Mock user database (backend implementation later)
  const [users, setUsers] = useState({
    demo: { password: 'demo', points: 1000, correct: 0, total: 0 }
  });

  useEffect(() => {
    if (user) {
      fetchTodaysGames();
      const interval = setInterval(fetchTodaysGames, 600000);
      return () => clearInterval(interval);
    }
  }, [user]);


  const fetchTodaysGames = async () => {
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const api = new BalldontlieAPI({ apiKey: process.env.REACT_APP_NBA_API_KEY });

      const response = await api.nba.getGames({
        dates: [today]
      });
      console.log(response.data);

      if (response && response.data && response.data.length > 0) {
        setGames(response.data);
      } else {
        // Fallback mock data if no real games found
        setGames(getMockGames());
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      // Use mock data on error
      setGames(getMockGames());
    } finally {
      setLoading(false);
    }
  };

// Helper: fallback mock data
const getMockGames = () => [
  {
    id: 1,
    home_team: { full_name: 'Los Angeles Lakers', abbreviation: 'LAL' },
    visitor_team: { full_name: 'Golden State Warriors', abbreviation: 'GSW' },
    status: 'Scheduled',
    time: '10:30 PM ET',
    home_team_score: 0,
    visitor_team_score: 0
  },
  {
    id: 2,
    home_team: { full_name: 'Boston Celtics', abbreviation: 'BOS' },
    visitor_team: { full_name: 'Miami Heat', abbreviation: 'MIA' },
    status: 'Live',
    time: 'Q2 8:45',
    home_team_score: 45,
    visitor_team_score: 42
  },
  {
    id: 3,
    home_team: { full_name: 'Denver Nuggets', abbreviation: 'DEN' },
    visitor_team: { full_name: 'Phoenix Suns', abbreviation: 'PHX' },
    status: 'Final',
    time: 'Final',
    home_team_score: 118,
    visitor_team_score: 112
  }
];


  const handleAuth = () => {
    const { username, password } = loginForm;

    if (isLogin) {
      // Login
      if (users[username] && users[username].password === password) {
        setUser(username);
        setUserStats(users[username]);
        setLoginForm({ username: '', password: '' });
      } else {
        alert('Invalid credentials! Try username: demo, password: demo');
      }
    } else {
      // Register
      if (username && password) {
        if (users[username]) {
          alert('Username already exists!');
        } else {
          const newUserStats = { password, points: 1000, correct: 0, total: 0 };
          setUsers(prev => ({ ...prev, [username]: newUserStats }));
          setUser(username);
          setUserStats(newUserStats);
          setLoginForm({ username: '', password: '' });
        }
      }
    }
  };

  const makePrediction = (gameId, team) => {
    const game = games.find(g => g.id === gameId);
    if (game && new Date(game.status) > new Date()) {
      setPredictions(prev => ({
        ...prev,
        [gameId]: team
      }));
    }
  };


  const checkPredictions = () => {
    let pointsChange = 0;
    let correctPredictions = 0;
    let totalChecked = 0;

    games.forEach(game => {
      if (game.status === 'Final' && predictions[game.id]) {
        totalChecked++;
        const homeWon = game.home_team_score > game.visitor_team_score;
        const predictedHome = predictions[game.id] === 'home';
        
        if ((homeWon && predictedHome) || (!homeWon && !predictedHome)) {
          pointsChange += 100;
          correctPredictions++;
        } else {
          pointsChange -= 50;
        }
      }
    });

    if (totalChecked > 0) {
      const newStats = {
        ...userStats,
        points: userStats.points + pointsChange,
        correct: userStats.correct + correctPredictions,
        total: userStats.total + totalChecked
      };
      
      setUserStats(newStats);
      setUsers(prev => ({
        ...prev,
        [user]: newStats
      }));

      // Clear checked predictions
      const newPredictions = { ...predictions };
      games.forEach(game => {
        if (game.status === 'Final') {
          delete newPredictions[game.id];
        }
      });
      setPredictions(newPredictions);
    }
  };

  const logout = () => {
    setUser(null);
    setPredictions({});
    setUserStats({ points: 1000, correct: 0, total: 0 });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'text-blue-600';
      case 'Live': return 'text-red-600 animate-pulse';
      case 'Final': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">NBA Predictor</h1>
            <p className="text-gray-300">Predict games, earn points, climb the ranks!</p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-300 hover:text-blue-200 transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-400">
            Demo: username "demo", password "demo"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">NBA Predictor</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-white">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="font-semibold">{user}</span>
                </div>
              </div>
              
              <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
                <div className="text-yellow-400 font-bold">{userStats.points} pts</div>
                <div className="text-xs text-gray-300">
                  {userStats.total > 0 ? `${((userStats.correct / userStats.total) * 100).toFixed(1)}% accuracy` : 'No predictions yet'}
                </div>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5" />
            <span className="text-lg font-semibold">Today's Games</span>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={fetchTodaysGames}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={checkPredictions}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Check Results</span>
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <div key={game.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
              <div className="text-center mb-4">
                <div className={`text-sm font-semibold ${getStatusColor(game.status)}`}>
                  {game.status} • {game.time}
                </div>
              </div>

              <div className="space-y-4">
                {/* Away Team */}
                <div
                  onClick={() => makePrediction(game.id, 'away')}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    predictions[game.id] === 'away' 
                      ? 'bg-blue-500/30 border-2 border-blue-400' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/20'
                  } ${game.status !== 'Scheduled' ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{game.visitor_team.abbreviation}</div>
                      <div className="text-gray-300 text-sm">{game.visitor_team.full_name}</div>
                    </div>
                    {game.status === 'Final' || game.status === 'Live' ? (
                      <div className="text-2xl font-bold text-white">{game.visitor_team_score}</div>
                    ) : null}
                  </div>
                </div>

                <div className="text-center text-gray-400 text-sm font-semibold">VS</div>

                {/* Home Team */}
                <div
                  onClick={() => makePrediction(game.id, 'home')}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    predictions[game.id] === 'home' 
                      ? 'bg-blue-500/30 border-2 border-blue-400' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/20'
                  } ${game.status !== 'Scheduled' ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{game.home_team.abbreviation}</div>
                      <div className="text-gray-300 text-sm">{game.home_team.full_name}</div>
                    </div>
                    {game.status === 'Final' || game.status === 'Live' ? (
                      <div className="text-2xl font-bold text-white">{game.home_team_score}</div>
                    ) : null}
                  </div>
                </div>
              </div>

              {predictions[game.id] && game.status === 'Scheduled' && (
                <div className="mt-4 text-center">
                  <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                    Predicted: {predictions[game.id] === 'home' ? game.home_team.abbreviation : game.visitor_team.abbreviation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {games.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No games today</p>
            <p className="text-sm">Check back tomorrow for more games to predict!</p>
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-400 py-12">
            <RefreshCw className="h-16 w-16 mx-auto mb-4 animate-spin opacity-50" />
            <p className="text-xl">Loading games...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/5 backdrop-blur-lg border-t border-white/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p className="text-sm">
              Correct predictions: +100 points • Wrong predictions: -50 points
            </p>
            <p className="text-xs mt-2">
              Game data powered by NBA API • Points update after games finish
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NBAPredictor;