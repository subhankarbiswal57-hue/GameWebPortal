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
  let width = (canvas.width = canvas.clientWidth || window.innerWidth || 800);
  let height = (canvas.height = canvas.clientHeight || window.innerHeight || 600);

  function resize() {
    if (!canvas) return;
    width = canvas.width = canvas.clientWidth || window.innerWidth || 800;
    height = canvas.height = canvas.clientHeight || window.innerHeight || 600;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 50);

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
  let boardEmbers = [];

  for (let i = 0; i < 18; i++) {
    boardEmbers.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.5 + Math.random() * 2.5,
      vy: -0.3 - Math.random() * 0.5,
      alpha: Math.random()
    });
  }

  function getBoardRect() {
    const size = Math.min(width * 0.9, height * 0.76, 560);
    const x = (width - size) / 2;
    const y = (height - size) / 2 + 18;
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
      const playerWon = (game.turn !== playerColor);
      if (playerWon) sound.playVictory();

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
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    // Check mode toggle button click (Top Center)
    if (py < 65 && px > width / 2 - 120 && px < width / 2 + 120) {
      gameMode = gameMode === 'ai' ? 'pvp' : 'ai';
      sound.playChessMove();
      return;
    }

    const sq = getSquareAt(px, py);
    if (sq === -1) {
      selectedSquare = -1;
      legalMoves = [];
      return;
    }

    const matchingMove = legalMoves.find(m => m.to === sq);
    if (matchingMove) {
      makeMove(matchingMove);
      return;
    }

    const piece = game.board[sq];
    if (piece && (gameMode === 'pvp' || game.getPieceColor(piece) === playerColor)) {
      selectedSquare = sq;
      legalMoves = game.getLegalMoves(sq);
      sound.playChessMove();
    } else {
      selectedSquare = -1;
      legalMoves = [];
    }
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });

  let rafId = null;

  function render(time) {
    // --- ENHANCED ANIMATED BACKGROUND: GRAND CHAMBER ---
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.85);
    bgGrad.addColorStop(0, '#1c141d');
    bgGrad.addColorStop(0.5, '#120d14');
    bgGrad.addColorStop(1, '#08050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Floating Golden Dust Embers
    ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
    for (const em of boardEmbers) {
      em.y += em.vy;
      if (em.y < 0) { em.y = height; em.x = Math.random() * width; }
      ctx.beginPath();
      ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const { x, y, size, sqSize } = getBoardRect();

    // Wood & Gold Carved Outer Board Rim
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#221611';
    ctx.roundRect(x - 18, y - 18, size + 36, size + 36, 16);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Board Square Colors (Rich Mahogany & Warm Maple)
    const LIGHT_SQ = '#d8c29d';
    const DARK_SQ = '#66432b';
    const HIGHLIGHT_SQ = 'rgba(212, 175, 55, 0.6)';
    const LAST_MOVE_SQ = 'rgba(230, 126, 34, 0.45)';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sqIdx = r * 8 + c;
        const sqX = x + c * sqSize;
        const sqY = y + r * sqSize;

        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? LIGHT_SQ : DARK_SQ;
        ctx.fillRect(sqX, sqY, sqSize, sqSize);

        if (lastMove && (lastMove.from === sqIdx || lastMove.to === sqIdx)) {
          ctx.fillStyle = LAST_MOVE_SQ;
          ctx.fillRect(sqX, sqY, sqSize, sqSize);
        }

        if (selectedSquare === sqIdx) {
          ctx.fillStyle = HIGHLIGHT_SQ;
          ctx.fillRect(sqX, sqY, sqSize, sqSize);
        }

        // Legal Move Dot or Ring
        const isLegal = legalMoves.some(m => m.to === sqIdx);
        if (isLegal) {
          ctx.save();
          if (game.board[sqIdx]) {
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 4;
            ctx.strokeRect(sqX + 3, sqY + 3, sqSize - 6, sqSize - 6);
          } else {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
            ctx.beginPath();
            ctx.arc(sqX + sqSize / 2, sqY + sqSize / 2, sqSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Draw Piece
        const piece = game.board[sqIdx];
        if (piece) {
          const char = UNICODE_PIECES[piece] || '';
          const isWhite = (piece & PIECES.WHITE) !== 0;

          ctx.save();
          ctx.font = `${Math.floor(sqSize * 0.78)}px 'Segoe UI Symbol', system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Shadows & 3D Piece depth
          ctx.fillStyle = isWhite ? '#ffffff' : '#18141a';
          ctx.shadowColor = isWhite ? 'rgba(255, 215, 0, 0.6)' : 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 8;
          ctx.fillText(char, sqX + sqSize / 2, sqY + sqSize / 2 + 2);

          if (!isWhite) {
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1.2;
            ctx.strokeText(char, sqX + sqSize / 2, sqY + sqSize / 2 + 2);
          }
          ctx.restore();
        }
      }
    }

    // Top HUD
    ctx.save();
    ctx.font = '900 22px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    
    const turnText = game.turn === PIECES.WHITE ? "⚪ White's Turn" : "⚫ Black's Turn";
    ctx.fillText(`${turnText} ${isThinking ? '(Contemplating...)' : ''}`, width / 2, y - 28);

    // Mode Toggle Button Badge
    ctx.fillStyle = 'rgba(34, 22, 17, 0.9)';
    ctx.roundRect(width / 2 - 110, 14, 220, 32, 8);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '900 13px Cinzel, serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`MODE: ${gameMode.toUpperCase()} (Click to change)`, width / 2, 34);
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
