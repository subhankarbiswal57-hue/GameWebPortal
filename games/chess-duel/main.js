import { ChessGame, PIECES } from './engine.js';
import { sound } from '../../apps/portal/js/shared/audio.js';

const UNICODE_PIECES = {
  [PIECES.WHITE | PIECES.KING]: '♔',
  [PIECES.WHITE | PIECES.QUEEN]: '♕',
  [PIECES.WHITE | PIECES.ROOK]: '♖',
  [PIECES.WHITE | PIECES.BISHOP]: '♗',
  [PIECES.WHITE | PIECES.KNIGHT]: '♘',
  [PIECES.WHITE | PIECES.PAWN]: '♙',

  [PIECES.BLACK | PIECES.KING]: '♚',
  [PIECES.BLACK | PIECES.QUEEN]: '♛',
  [PIECES.BLACK | PIECES.ROOK]: '♜',
  [PIECES.BLACK | PIECES.BISHOP]: '♝',
  [PIECES.BLACK | PIECES.KNIGHT]: '♞',
  [PIECES.BLACK | PIECES.PAWN]: '♟'
};

export function start(canvas) {
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.clientWidth || 800);
  let height = (canvas.height = canvas.clientHeight || 600);

  function resize() {
    width = canvas.width = canvas.clientWidth || 800;
    height = canvas.height = canvas.clientHeight || 600;
  }
  window.addEventListener('resize', resize);

  const game = new ChessGame();
  let selectedSquare = -1;
  let legalMoves = [];
  let lastMove = null;
  let running = true;
  let gameMode = 'ai'; // 'ai' or 'pvp'
  let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
  let playerColor = PIECES.WHITE;
  let isThinking = false;
  let moveCount = 0;

  // Board layout sizing
  function getBoardRect() {
    const size = Math.min(width * 0.9, height * 0.8, 540);
    const x = (width - size) / 2;
    const y = (height - size) / 2 + 10;
    const sqSize = size / 8;
    return { x, y, size, sqSize };
  }

  function getSquareAt(px, py) {
    const { x, y, size, sqSize } = getBoardRect();
    if (px < x || px > x + size || py < y || py > y + size) return -1;
    const col = Math.floor((px - x) / sqSize);
    const row = Math.floor((py - y) / sqSize);
    return row * 8 + col;
  }

  function makeMove(move) {
    sound.init();
    const result = game.makeMove(move);
    lastMove = move;
    selectedSquare = -1;
    legalMoves = [];
    moveCount++;

    if (move.capture) {
      sound.playChessCapture();
    } else {
      sound.playChessMove();
    }

    if (result.isCheck) {
      sound.playChessCheck();
    }

    if (result.status === 'checkmate') {
      running = false;
      const winner = game.turn === PIECES.WHITE ? 'Black' : 'White';
      const playerWon = (game.turn !== playerColor);
      if (playerWon) sound.playVictory();

      // Elo / Score computation
      const calculatedScore = playerWon ? Math.max(600, 1600 - moveCount * 15) : 300;

      canvas.dispatchEvent(new CustomEvent('gameover', {
        detail: {
          score: calculatedScore,
          stats: [
            { label: 'Result', value: playerWon ? 'Victory (Checkmate)' : 'Defeat' },
            { label: 'Total Moves', value: moveCount },
            { label: 'Mode', value: gameMode === 'ai' ? `AI (${aiDifficulty})` : '2 Players' }
          ]
        }
      }));
      return;
    } else if (result.status === 'stalemate') {
      running = false;
      canvas.dispatchEvent(new CustomEvent('gameover', {
        detail: {
          score: 500,
          stats: [
            { label: 'Result', value: 'Draw by Stalemate' },
            { label: 'Total Moves', value: moveCount },
            { label: 'Mode', value: gameMode === 'ai' ? `AI (${aiDifficulty})` : '2 Players' }
          ]
        }
      }));
      return;
    }

    // Trigger AI move if AI turn
    if (gameMode === 'ai' && game.turn !== playerColor && running) {
      isThinking = true;
      setTimeout(() => {
        if (!running) return;
        const aiMove = game.getBestAIMove(aiDifficulty);
        isThinking = false;
        if (aiMove) {
          makeMove(aiMove);
        }
      }, 400);
    }
  }

  function onPointerDown(e) {
    if (!running || isThinking) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const py = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    const sq = getSquareAt(px, py);

    if (sq === -1) {
      // Check mode toggle click
      if (py < 60 && px > width / 2 - 100 && px < width / 2 + 100) {
        gameMode = gameMode === 'ai' ? 'pvp' : 'ai';
        return;
      }
      return;
    }

    // If destination is in legal moves
    const matchingMove = legalMoves.find(m => m.to === sq);
    if (matchingMove) {
      makeMove(matchingMove);
      return;
    }

    // Select piece
    const piece = game.board[sq];
    if (piece && (gameMode === 'pvp' || game.getPieceColor(piece) === playerColor)) {
      selectedSquare = sq;
      legalMoves = game.getLegalMoves(sq);
    } else {
      selectedSquare = -1;
      legalMoves = [];
    }
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });

  let rafId = null;

  function render(time) {
    // Background Dark Slate
    ctx.fillStyle = '#0f141f';
    ctx.fillRect(0, 0, width, height);

    const { x, y, size, sqSize } = getBoardRect();

    // Board Outer Border & Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#1c2436';
    ctx.roundRect(x - 12, y - 12, size + 24, size + 24, 12);
    ctx.fill();
    ctx.restore();

    // Draw 64 Squares
    const LIGHT_SQ = '#3a4a6b';
    const DARK_SQ = '#232d42';
    const HIGHLIGHT_SQ = 'rgba(0, 240, 255, 0.4)';
    const LAST_MOVE_SQ = 'rgba(255, 215, 0, 0.3)';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sqIdx = r * 8 + c;
        const sqX = x + c * sqSize;
        const sqY = y + r * sqSize;

        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? LIGHT_SQ : DARK_SQ;
        ctx.fillRect(sqX, sqY, sqSize, sqSize);

        // Highlight last move
        if (lastMove && (lastMove.from === sqIdx || lastMove.to === sqIdx)) {
          ctx.fillStyle = LAST_MOVE_SQ;
          ctx.fillRect(sqX, sqY, sqSize, sqSize);
        }

        // Highlight selected
        if (selectedSquare === sqIdx) {
          ctx.fillStyle = HIGHLIGHT_SQ;
          ctx.fillRect(sqX, sqY, sqSize, sqSize);
        }

        // Legal move indicator
        const isLegal = legalMoves.some(m => m.to === sqIdx);
        if (isLegal) {
          ctx.fillStyle = game.board[sqIdx] ? 'rgba(255, 40, 40, 0.6)' : 'rgba(0, 240, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(sqX + sqSize / 2, sqY + sqSize / 2, sqSize * (game.board[sqIdx] ? 0.38 : 0.18), 0, Math.PI * 2);
          ctx.fill();
        }

        // Piece Drawing (Unicode / Stylized)
        const piece = game.board[sqIdx];
        if (piece) {
          const char = UNICODE_PIECES[piece] || '';
          const isWhite = (piece & PIECES.WHITE) !== 0;

          ctx.save();
          ctx.font = `${Math.floor(sqSize * 0.72)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Glow / Shadow for piece clarity
          ctx.fillStyle = isWhite ? '#ffffff' : '#11131a';
          ctx.shadowColor = isWhite ? '#00f0ff' : '#000000';
          ctx.shadowBlur = 6;
          ctx.fillText(char, sqX + sqSize / 2, sqY + sqSize / 2 + 2);

          // Stroke for dark pieces on dark background
          if (!isWhite) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.strokeText(char, sqX + sqSize / 2, sqY + sqSize / 2 + 2);
          }
          ctx.restore();
        }
      }
    }

    // Top HUD
    ctx.save();
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    
    const turnText = game.turn === PIECES.WHITE ? "⚪ White's Move" : "⚫ Black's Move";
    ctx.fillText(`${turnText} ${isThinking ? '(Thinking...)' : ''}`, width / 2, y - 24);

    // Mode Toggle Button Badge
    ctx.fillStyle = '#222b3d';
    ctx.roundRect(width / 2 - 90, 16, 180, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`MODE: ${gameMode.toUpperCase()} (Click to toggle)`, width / 2, 34);
    ctx.restore();

    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);

  return {
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onPointerDown);
      canvas.removeEventListener('touchstart', onPointerDown);
    }
  };
}
