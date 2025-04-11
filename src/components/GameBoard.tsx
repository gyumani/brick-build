import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { TETROMINOES, TetrominoType, Tetromino, rotateTetromino } from '../utils/tetrominoes';

const BOARD_WIDTH = 16;
const BOARD_HEIGHT = 24;
const INITIAL_DROP_INTERVAL = 1000; // 초기 속도 1초
const SPEED_INCREASE_INTERVAL = 10000; // 10초마다
const SPEED_INCREASE_AMOUNT = 100; // 0.1초씩 빨라짐
const MIN_DROP_INTERVAL = 100; // 최소 속도 0.1초

interface BoardCell {
  filled: boolean;
  color?: string;
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
  margin-bottom: 30px;
  color: #4CAF50;
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
  
  &:hover {
    background-color: #45a049;
    transform: scale(1.05);
  }
`;

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<BoardCell[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill({ filled: false }))
  );
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStartTime = useRef<number>(Date.now());

  const startGame = useCallback(() => {
    setGameStarted(true);
    gameStartTime.current = Date.now();
  }, []);

  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill({ filled: false })));
    setCurrentTetromino(null);
    setPosition({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setDropInterval(INITIAL_DROP_INTERVAL);
    gameStartTime.current = Date.now();
  }, []);

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
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      const isFull = row.every(cell => cell.filled);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill({ filled: false }));
    }

    setBoard(newBoard);
    setScore(prevScore => prevScore + linesCleared * 100);
  }, [board]);

  const lockTetromino = useCallback(() => {
    if (!currentTetromino) return;
    
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
    setCurrentTetromino(null);
    clearLines();
  }, [currentTetromino, position, board, clearLines]);

  const hardDrop = useCallback(() => {
    if (!currentTetromino) return;
    
    let dropDistance = 0;
    while (moveTetromino(0, 1)) {
      dropDistance++;
    }
    if (dropDistance > 0) {
      setScore(prevScore => prevScore + dropDistance * 2); // 한 칸당 2점 추가
    }
    lockTetromino();
  }, [currentTetromino, moveTetromino, lockTetromino]);

  useEffect(() => {
    if (!currentTetromino) {
      const newTetromino = getRandomTetromino();
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
  }, [currentTetromino, getRandomTetromino, checkCollision]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentTetromino) return;

      switch (e.key) {
        case 'ArrowLeft':
          moveTetromino(-1, 0);
          break;
        case 'ArrowRight':
          moveTetromino(1, 0);
          break;
        case 'ArrowDown':
          if (!moveTetromino(0, 1)) {
            lockTetromino();
          }
          break;
        case 'ArrowUp':
          rotateCurrentTetromino();
          break;
        case ' ': // 스페이스 바
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTetromino, moveTetromino, rotateCurrentTetromino, lockTetromino, hardDrop, gameOver, gameStarted]);

  useEffect(() => {
    if (gameOver) return;

    const speedInterval = setInterval(() => {
      const newInterval = Math.max(
        INITIAL_DROP_INTERVAL - Math.floor((Date.now() - gameStartTime.current) / SPEED_INCREASE_INTERVAL) * SPEED_INCREASE_AMOUNT,
        MIN_DROP_INTERVAL
      );
      setDropInterval(newInterval);
    }, SPEED_INCREASE_INTERVAL);

    return () => clearInterval(speedInterval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const dropIntervalId = setInterval(() => {
      if (!currentTetromino) return;
      
      if (!moveTetromino(0, 1)) {
        lockTetromino();
      }
    }, dropInterval);

    return () => clearInterval(dropIntervalId);
  }, [currentTetromino, moveTetromino, lockTetromino, gameOver, dropInterval]);

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

  return (
    <div style={{ position: 'relative' }}>
      {!gameStarted && (
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
          <StartButton onClick={startGame}>Start Game</StartButton>
        </IntroOverlay>
      )}
      <div style={{ color: 'white', marginBottom: '10px' }}>Score: {score}</div>
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
      {gameOver && (
        <GameOverOverlay>
          <GameOverTitle>Game Over!</GameOverTitle>
          <FinalScore>Final Score: {score}</FinalScore>
          <RestartButton onClick={resetGame}>Restart</RestartButton>
        </GameOverOverlay>
      )}
    </div>
  );
};

export default GameBoard;
