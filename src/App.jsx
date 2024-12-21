import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [players, setPlayers] = useState(
    Array.from({ length: 4 }, (_, i) => ({
      name: `Player ${i + 1}`,
      icon: null,
      alive: true,
    }))
  );
  const [screen, setScreen] = useState("title");
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [playerPositions, setPlayerPositions] = useState([]);
  const [winnerIndex, setWinnerIndex] = useState(null);

  const icons = [
    "/migiken.png",
    "/migityun.png",
    "/sino.png",
    "/isagi2.png",
    "/mario.png",
    "/inu.png",
    "/yoshi.png",
    "/main.png",
  ];

  const selectMusic = useRef(new Audio("/title.mp3"));
  selectMusic.current.loop = true;
  selectMusic.current.volume = 0.3;
  const raceMusic = useRef(new Audio("/race.mp3"));
  raceMusic.current.volume = 0.3;
  const winnerMusic = useRef(new Audio("/result.mp3"));
  winnerMusic.current.volume = 0.4;
  const countdownSound = useRef(new Audio("/Count1.mp3"));

  const playMusic = (audioRef) => {
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const stopMusic = (audioRef) => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  useEffect(() => {
    if (screen === "characterSelect") {
      playMusic(selectMusic);
    } else {
      stopMusic(selectMusic);
    }

    if (screen === "race") {
      playMusic(raceMusic);
    } else {
      stopMusic(raceMusic);
    }

    if (screen === "winner") {
      playMusic(winnerMusic);
    } else {
      stopMusic(winnerMusic);
    }
  }, [screen]);

  const handleStartPress = () => setScreen("characterSelect");

  const addPlayer = () => {
    setPlayers((prevPlayers) => [
      ...prevPlayers,
      { name: `Player ${prevPlayers.length + 1}`, icon: null, alive: true },
    ]);
  };

  const removePlayer = (index) => {
    setPlayers((prevPlayers) => prevPlayers.filter((_, i) => i !== index));
  };

  const updatePlayerName = (index, newName) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player, i) =>
        i === index ? { ...player, name: newName } : player
      )
    );
  };

  const updatePlayerIcon = (index, icon) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player, i) =>
        i === index ? { ...player, icon } : player
      )
    );
  };

  const startGame = () => {
    setScreen("race");
    setCountdown(3);
    setWinner(null);

    const playSound = (audioRef) => {
      audioRef.current.currentTime = 0; // 再生位置をリセット
      audioRef.current.play(); // 再生開始
    };

    const randomWinnerIndex = Math.floor(Math.random() * players.length);
    setWinnerIndex(randomWinnerIndex);

    const countdownInterval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === 3) {
          playSound(countdownSound); // カウントダウン音を再生
        }
        if (prevCountdown === 1) {
          clearInterval(countdownInterval);
          setCountdown("Start！！"); // 「Start！！」を一瞬表示
          setTimeout(() => {
            setCountdown(null); // 「Start！！」を消す
            beginRace(randomWinnerIndex);
          }, 1000); // 1秒後にレース開始
        }
        return prevCountdown - 1;
      });
    }, 1000);
  };

  const beginRace = (winnerIndex) => {
    setGameStarted(true);
    setPlayerPositions(players.map(() => 100)); // 全員のスタート位置を100pxに初期化

    const raceStartTime = Date.now();
    const totalRaceTime = 20000; // レース全体の20秒
    const goalPosition = window.innerWidth - 50; // ゴール地点の位置（画面右端）

    // 脱落者のタイミングを均等に設定
    const totalPlayers = players.length;
    const totalLosers = totalPlayers - 1; // 脱落者の数（勝者以外）
    const loserTimes = Array.from(
      { length: totalLosers },
      (_, i) => 14000 + i * (4000 / totalLosers)
    ); // 14秒から18秒の間に均等に脱落タイミングを設定

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - raceStartTime;

      // 背景のスライド（レース進行の演出）
      setBackgroundPosition((prev) => prev - 15);

      // ランダムな動きを全員に適用
      setPlayerPositions((prevPositions) =>
        prevPositions.map((pos, i) => {
          if (!players[i].alive) {
            return pos; // 脱落者はその場にとどまる
          }

          // 勝者の場合、加速してゴールへ向かう
          if (i === winnerIndex && elapsedTime > 18000) {
            return Math.min(goalPosition, pos + 40); // 勝者は加速
          }

          // ランダムな動きを追加（生存者のみ適用）
          const randomAdjustment =
            Math.random() > 0.8 ? 7 : Math.random() > 0.6 ? -7 : 0;
          return Math.min(
            goalPosition,
            Math.max(0, pos + 6 + randomAdjustment)
          );
        })
      );

      // 脱落処理
      loserTimes.forEach((time, idx) => {
        if (
          elapsedTime >= time &&
          elapsedTime < time + 100 && // 時間のチェック（トリガーは一度だけ）
          players.filter((player) => player.alive).length > totalLosers - idx
        ) {
          const alivePlayers = players
            .map((player, index) => ({ ...player, index }))
            .filter((player) => player.alive && player.index !== winnerIndex); // 勝者以外から選ぶ
          const randomLoser =
            alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

          if (randomLoser) {
            setPlayers((prevPlayers) =>
              prevPlayers.map((player, idx) =>
                idx === randomLoser.index
                  ? { ...player, alive: false, eliminated: true } // 脱落者を更新
                  : player
              )
            );
          }
        }
      });

      // 18秒時点で残り全員脱落
      if (elapsedTime >= 18000 && elapsedTime < 18100) {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player, idx) =>
            idx !== winnerIndex ? { ...player, alive: false } : player
          )
        );
      }

      // レース終了の判定
      if (elapsedTime >= totalRaceTime) {
        clearInterval(interval);
        setWinner(players[winnerIndex].name);
        setScreen("winner");
      }
    }, 100);
  };

  return (
    <div className="game-container">
      {screen === "title" && (
        <div className="title-screen" onClick={handleStartPress}>
          <h1 className="title">Press Any Key</h1>
        </div>
      )}

      {screen === "characterSelect" && (
        <div className="character-select-screen">
          <h1 className="title">Character Select!!</h1>
          <h5 className="title2">Drag a character into your box!</h5>
          <div className="icon-selection-grid">
            {icons.map((icon, j) => (
              <div
                key={j}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("icon", icon)}
                className="draggable-icon"
              >
                <img
                  src={icon}
                  alt={`アイコン${j + 1}`}
                  className="icon-option"
                />
              </div>
            ))}
          </div>
          <div className="player-setup-grid">
            {players.map((player, i) => (
              <div
                key={i}
                className="player-box"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const icon = e.dataTransfer.getData("icon");
                  updatePlayerIcon(i, icon);
                }}
              >
                <button
                  className="remove-player"
                  onClick={() => removePlayer(i)}
                >
                  ×
                </button>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  placeholder="Enter Name"
                  className="name-input"
                />
                {player.icon && (
                  <img
                    src={player.icon}
                    alt={player.name}
                    className="preview-icon"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="button-container">
            <button onClick={addPlayer} className="add-player">
              ＋
            </button>
            <button onClick={startGame} className="start-button">
              Start
            </button>
          </div>
        </div>
      )}
      {countdown !== null && (
        <div className="race-track">
          <div className="background" style={{ backgroundPositionX: "0px" }}>
            {players.map((player, i) => (
              <div
                className="track"
                key={i}
                style={{
                  bottom: `${i * 80}px`,
                  left: `100px`,
                }}
              >
                <span className="player-label">{player.name}</span>
                {player.icon && (
                  <img
                    src={player.icon}
                    alt={player.name}
                    className="player-icon"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="countdown">
            <h2>{countdown}</h2> {/* 3, 2, 1 または Start！！ を表示 */}
          </div>
        </div>
      )}

      {gameStarted && (
        <div className="race-track">
          <div
            className="background"
            style={{
              backgroundPositionX: `${backgroundPosition}px`,
            }}
          >
            {players.map((player, i) => (
              <div
                className={`track ${!player.alive ? "eliminated" : ""}`}
                key={i}
                style={{
                  bottom: `${i * 80}px`,
                  left: `${playerPositions[i]}px`,
                }}
              >
                <span className="player-label">{player.name}</span>
                {player.icon && (
                  <img
                    src={player.icon}
                    alt={player.name}
                    className={`player-icon ${
                      !player.alive ? "grayscale" : ""
                    }`} // 脱落者はモノクロにする
                  />
                )}
                {!player.alive && (
                  <div className="eliminated-message">脱落</div> // 脱落の文字を表示
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {winner && (
        <div className="winner-screen">
          <img
            src={players[winnerIndex].icon}
            alt={players[winnerIndex].name}
            className="winner-icon"
          />
          <h1>Congratulations!</h1>
          <h2>{players[winnerIndex].name}</h2>
          <button
            onClick={() => {
              // 必要な状態をすべて初期化
              setScreen("characterSelect"); // キャラクター選択画面に戻る
              setGameStarted(false); // ゲーム状態をリセット
              setPlayers(
                Array.from({ length: 4 }, (_, i) => ({
                  name: `Player ${i + 1}`,
                  icon: null,
                  alive: true,
                }))
              );
              setBackgroundPosition(0); // 背景をリセット
              setPlayerPositions([]); // プレイヤーの位置をリセット
              setWinner(null); // 勝者をリセット
            }}
            className="restart-button"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
