import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { TETROMINOES, TetrominoType, Tetromino, rotateTetromino } from '../utils/tetrominoes';
import { getCookie, setCookie } from '../utils/cookies';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 24;
const INITIAL_DROP_INTERVAL = 1000; // 초기 속도 1초
const SPEED_INCREASE_SCORE = 1000; // 1000점마다
const SPEED_INCREASE_AMOUNT = 100; // 0.1초씩 빨라짐
const MIN_DROP_INTERVAL = 100; // 최소 속도 0.1초

interface BoardCell {
  filled: boolean;
  color?: string;
}

interface ScoreRecord {
  name: string;
  score: number;
  date: string;
}

const BoardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${BOARD_WIDTH}, 1fr);
  grid-template-rows: repeat(${BOARD_HEIGHT}, 1fr);
  gap: 1px;
  background-color: #333;
  padding: 10px;
  border: 2px solid #666;
`;

const Cell = styled.div<{ isFilled: boolean; color?: string }>`
  width: 20px;
  height: 20px;
  background-color: ${props => props.isFilled ? (props.color || '#00f') : '#222'};
  border: 1px solid #444;
`;

const PreviewContainer = styled.div`
  position: absolute;
  top: 20px;
  right: -150px;
  width: 100px;
  height: 100px;
  background-color: #333;
  padding: 10px;
  border: 2px solid #666;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 1px;
  margin-left: 20px;
`;

const PreviewCell = styled.div<{ isFilled: boolean; color?: string }>`
  width: 20px;
  height: 20px;
  background-color: ${props => props.isFilled ? (props.color || '#00f') : '#222'};
  border: 1px solid #444;
`;

const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  z-index: 10;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const GameOverTitle = styled.h2`
  font-size: 48px;
  color: #ff4444;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const FinalScore = styled.div`
  font-size: 32px;
  margin-bottom: 20px;
  color: #4CAF50;
`;

const NameInput = styled.input`
  padding: 10px;
  font-size: 18px;
  margin-bottom: 20px;
  width: 200px;
  text-align: center;
`;

const RestartButton = styled.button`
  padding: 15px 30px;
  font-size: 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  margin-right: 15px;
  
  &:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }
`;

const IntroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 48px;
  margin-bottom: 30px;
  color: #4CAF50;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const Instructions = styled.div`
  font-size: 18px;
  margin-bottom: 30px;
  text-align: center;
  line-height: 1.5;
`;

const StartButton = styled.button`
  padding: 15px 30px;
  font-size: 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  
  &:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }
`;

const RankingButton = styled(StartButton)`
  background-color: #f44336;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const RankingOverlay = styled(GameOverOverlay)`
  background-color: rgba(0, 0, 0, 0.95);
`;

const RankingTitle = styled.h2`
  font-size: 48px;
  color: #4CAF50;
  margin-bottom: 20px;
`;

const RankingList = styled.ol`
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: 80%;
  max-width: 400px;
`;

const RankingItem = styled.li`
  display: grid;
  grid-template-columns: 1fr 2fr 2fr;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #555;
  font-size: 20px;
  
  &:nth-child(odd) {
    background-color: #2a2a2a;
  }
`;

const BackButton = styled(RestartButton)`
  margin-top: 30px;
`;

const SubmitButton = styled(RestartButton)`
  background-color: #4CAF50;
  
  &:hover {
    background-color: #45a049;
  }
`;

const MainMenuButton = styled(RestartButton)`
  background-color: #2196F3;
  margin-top: 20px;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<BoardCell[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill({ filled: false }))
  );
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino | null>(null);
  const [nextTetromino, setNextTetromino] = useState<Tetromino | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [rankings, setRankings] = useState<ScoreRecord[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showGameOverRanking, setShowGameOverRanking] = useState(false);
  const lastSpeedIncreaseScore = useRef<number>(0);

  const saveScore = useCallback((name: string) => {
    const scoresCookie = getCookie('tetrisScores');
    const scores: ScoreRecord[] = scoresCookie ? JSON.parse(scoresCookie) : [];
    const newScore: ScoreRecord = { name, score, date: new Date().toISOString() };
    const newScores = [...scores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setCookie('tetrisScores', JSON.stringify(newScores), 365);
    setRankings(newScores);
    setShowGameOverRanking(true);
  }, [score]);

  const loadRanking = useCallback(() => {
    const scoresCookie = getCookie('tetrisScores');
    const scores: ScoreRecord[] = scoresCookie ? JSON.parse(scoresCookie) : [];
    setRankings(scores);
  }, []);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setShowRanking(false);
    setShowGameOverRanking(false);
    setPlayerName('');
    lastSpeedIncreaseScore.current = 0;
  }, []);

  const submitScore = useCallback(() => {
    if (playerName.trim() === '') {
      alert('Please enter your name.');
      return;
    }
    saveScore(playerName);
  }, [saveScore, playerName]);

  const goToMainMenu = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill({ filled: false })));
    setCurrentTetromino(null);
    setNextTetromino(null);
    setPosition({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setShowGameOverRanking(false);
    setDropInterval(INITIAL_DROP_INTERVAL);
    setPlayerName('');
    lastSpeedIncreaseScore.current = 0;
  }, []);

  const handleShowRanking = () => {
    loadRanking();
    setShowRanking(true);
  };

  const handleHideRanking = () => {
    setShowRanking(false);
  };

  const getRandomTetromino = useCallback((): Tetromino => {
    const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return TETROMINOES[randomType];
  }, []);

  const checkCollision = useCallback((tetromino: Tetromino, pos: { x: number; y: number }): boolean => {
    return tetromino.shape.some((row, y) => {
      return row.some((cell, x) => {
        if (!cell) return false;
        const boardY = pos.y + y;
        const boardX = pos.x + x;
        return (
          boardY >= BOARD_HEIGHT ||
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          (boardY >= 0 && board[boardY][boardX].filled)
        );
      });
    });
  }, [board]);

  const moveTetromino = useCallback((dx: number, dy: number) => {
    if (!currentTetromino) return;
    
    const newPosition = { x: position.x + dx, y: position.y + dy };
    if (!checkCollision(currentTetromino, newPosition)) {
      setPosition(newPosition);
      return true;
    }
    return false;
  }, [currentTetromino, position, checkCollision]);

  const rotateCurrentTetromino = useCallback(() => {
    if (!currentTetromino) return;
    
    const rotated = rotateTetromino(currentTetromino);
    if (!checkCollision(rotated, position)) {
      setCurrentTetromino(rotated);
    }
  }, [currentTetromino, position, checkCollision]);

  const clearLines = useCallback(() => {
    setBoard(prevBoard => {
      let linesCleared = 0;
      const newBoard = prevBoard.filter(row => {
        const isFull = row.every(cell => cell.filled);
        if (isFull) linesCleared++;
        return !isFull;
      });

      while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill({ filled: false }));
      }

      setScore(prevScore => prevScore + linesCleared * 100);
      return newBoard;
    });
  }, []);

  const lockTetromino = useCallback(() => {
    if (!currentTetromino || !nextTetromino) return;
    
    const newBoard = [...board];
    currentTetromino.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = { filled: true, color: currentTetromino.color };
          }
        }
      });
    });
    
    setBoard(newBoard);
    
    const newTetromino = nextTetromino;
    const nextNewTetromino = getRandomTetromino();
    
    const initialPosition = {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2),
      y: 0
    };
    
    if (checkCollision(newTetromino, initialPosition)) {
      setGameOver(true);
      return;
    }
    
    setNextTetromino(nextNewTetromino);
    setCurrentTetromino(newTetromino);
    setPosition(initialPosition);
    
    // Clear lines after new tetromino is set to avoid state race condition
    setTimeout(() => {
      clearLines();
    }, 0);
  }, [currentTetromino, nextTetromino, position, board, getRandomTetromino, checkCollision, clearLines]);

  const hardDrop = useCallback(() => {
    if (!currentTetromino) return;
    
    let dropDistance = 0;
    let newPosition = { ...position };
    
    while (true) {
      const testPosition = { ...newPosition, y: newPosition.y + 1 };
      if (checkCollision(currentTetromino, testPosition)) {
        break;
      }
      newPosition = testPosition;
      dropDistance++;
    }
    
    if (dropDistance > 0) {
      setPosition(newPosition);
      setScore(prevScore => prevScore + dropDistance * 2);
      
      const newBoard = [...board];
      currentTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = newPosition.y + y;
            const boardX = newPosition.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              newBoard[boardY][boardX] = { filled: true, color: currentTetromino.color };
            }
          }
        });
      });
      setBoard(newBoard);
      
      if (!nextTetromino) return;
      
      const newTetromino = nextTetromino;
      const nextNewTetromino = getRandomTetromino();
      
      const initialPosition = {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2),
        y: 0
      };
      
      if (checkCollision(newTetromino, initialPosition)) {
        setGameOver(true);
        return;
      }
      
      setNextTetromino(nextNewTetromino);
      setCurrentTetromino(newTetromino);
      setPosition(initialPosition);
      
      // Clear lines after new tetromino is set to avoid state race condition
      setTimeout(() => {
        clearLines();
      }, 0);
    }
  }, [currentTetromino, nextTetromino, position, board, checkCollision, getRandomTetromino, clearLines]);

  useEffect(() => {
    if (!currentTetromino && !nextTetromino) {
      const newTetromino = getRandomTetromino();
      const nextNewTetromino = getRandomTetromino();
      setNextTetromino(nextNewTetromino);
      const initialPosition = {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2),
        y: 0
      };
      
      if (checkCollision(newTetromino, initialPosition)) {
        setGameOver(true);
        return;
      }
      
      setCurrentTetromino(newTetromino);
      setPosition(initialPosition);
    }
  }, [currentTetromino, nextTetromino, getRandomTetromino, checkCollision]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentTetromino) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveTetromino(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveTetromino(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!moveTetromino(0, 1)) {
            lockTetromino();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotateCurrentTetromino();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTetromino, moveTetromino, rotateCurrentTetromino, lockTetromino, hardDrop, gameOver, gameStarted]);

  useEffect(() => {
    if (gameOver) return;

    const speedIncreaseCount = Math.floor(score / SPEED_INCREASE_SCORE);
    if (speedIncreaseCount > Math.floor(lastSpeedIncreaseScore.current / SPEED_INCREASE_SCORE)) {
      const newInterval = Math.max(
        INITIAL_DROP_INTERVAL - speedIncreaseCount * SPEED_INCREASE_AMOUNT,
        MIN_DROP_INTERVAL
      );
      setDropInterval(newInterval);
      lastSpeedIncreaseScore.current = score;
    }
  }, [score, gameOver]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const dropIntervalId = setInterval(() => {
      if (!currentTetromino) return;
      
      if (!moveTetromino(0, 1)) {
        lockTetromino();
      }
    }, dropInterval);

    return () => clearInterval(dropIntervalId);
  }, [currentTetromino, moveTetromino, lockTetromino, gameOver, dropInterval, gameStarted]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentTetromino) {
      currentTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = { filled: true, color: currentTetromino.color };
            }
          }
        });
      });
    }

    return displayBoard;
  };

  const renderPreview = () => {
    if (!nextTetromino) return null;
    
    const previewBoard = Array(4).fill(null).map(() => Array(4).fill({ filled: false }));
    const offsetX = Math.floor((4 - nextTetromino.shape[0].length) / 2);
    const offsetY = Math.floor((4 - nextTetromino.shape.length) / 2);
    
    nextTetromino.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          previewBoard[offsetY + y][offsetX + x] = { filled: true, color: nextTetromino.color };
        }
      });
    });
    
    return previewBoard;
  };

  return (
    <div style={{ position: 'relative', width : '100%' }}>
      {!gameStarted && !showRanking && (
        <IntroOverlay>
          <Title>TETRIS</Title>
          <Instructions>
            <p>Use arrow keys to control the blocks:</p>
            <p>← → : Move left/right</p>
            <p>↑ : Rotate</p>
            <p>↓ : Move down faster</p>
            <p>Space : Hard drop (2 points per cell)</p>
            <p>Speed increases over time!</p>
          </Instructions>
          <div>
            <StartButton onClick={startGame}>Start Game</StartButton>
            <RankingButton onClick={handleShowRanking}>Ranking</RankingButton>
          </div>
        </IntroOverlay>
      )}
      {showRanking && (
        <RankingOverlay>
          <RankingTitle>Ranking</RankingTitle>
          <RankingList>
            <RankingItem>
              <strong>Rank</strong>
              <strong>Score</strong>
              <strong>Name</strong>
            </RankingItem>
            {rankings.map((r, i) => (
              <RankingItem key={i}>
                <span>{i + 1}</span>
                <span>{r.score}</span>
                <span>{r.name}</span>
              </RankingItem>
            ))}
          </RankingList>
          <BackButton onClick={handleHideRanking}>Back</BackButton>
        </RankingOverlay>
      )}
      {gameStarted && (
        <>
          <div style={{ color: 'white', marginBottom: '10px' }}>Score: {score}</div>
          <div style={{ position: 'relative', width: 'fit-content'}}>
            <BoardContainer>
              {renderBoard().map((row, y) => 
                row.map((cell, x) => (
                  <Cell 
                    key={`${y}-${x}`} 
                    isFilled={cell.filled}
                    color={cell.color}
                  />
                ))
              )}
            </BoardContainer>
            <PreviewContainer>
              {renderPreview()?.map((row, y) => 
                row.map((cell, x) => (
                  <PreviewCell 
                    key={`preview-${y}-${x}`} 
                    isFilled={cell.filled}
                    color={cell.color}
                  />
                ))
              )}
            </PreviewContainer>
          </div>
        </>
      )}
      {gameOver && !showGameOverRanking && (
        <GameOverOverlay>
          <GameOverTitle>Game Over!</GameOverTitle>
          <FinalScore>Final Score: {score}</FinalScore>
          <NameInput 
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submitScore()}
          />
          <SubmitButton onClick={submitScore}>Submit Score</SubmitButton>
        </GameOverOverlay>
      )}
      {showGameOverRanking && (
        <RankingOverlay>
          <RankingTitle>Ranking</RankingTitle>
          <RankingList>
            <RankingItem>
              <strong>Rank</strong>
              <strong>Score</strong>
              <strong>Name</strong>
            </RankingItem>
            {rankings.map((r, i) => (
              <RankingItem key={i}>
                <span>{i + 1}</span>
                <span>{r.score}</span>
                <span>{r.name}</span>
              </RankingItem>
            ))}
          </RankingList>
          <MainMenuButton onClick={goToMainMenu}>Main Menu</MainMenuButton>
        </RankingOverlay>
      )}
    </div>
  );
};

export default GameBoard;
