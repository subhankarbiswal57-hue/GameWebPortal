import { ChessGame, PIECES } from './engine.js';
import { sound } from '../../apps/portal/js/shared/audio.js';
import { SEA_CHARACTERS, drawLiveCharacter, drawSeaVoyageBackground } from '../../apps/portal/js/shared/sea-engine.js';

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
  let gameMode = 'ai';
  let aiDifficulty = 'medium';
  let playerColor = PIECES.WHITE;
  let isThinking = false;
  let moveCount = 0;

  // Lifelines: Hint
  let lifelines = { hint: 2 };
  let bestHintMove = null;

  // Character popups & jumpscares
  let activePopups = [];
  let jumpScare = null;

  function triggerJumpscare(char) {
    jumpScare = {
      ...char,
      alpha: 1.0,
      scale: 0.15,
      maxScale: 1.5,
      timer: 55
    };
    sound.playCrash();
  }

  function getBoardRect() {
    const size = Math.min(width * 0.9, height * 0.76, 560);
    const x = (width - size) / 2;
    const y = (height - size) / 2 + 20;
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
    bestHintMove = null;
    moveCount++;

    if (move.capture) {
      sound.playChessCapture();
      if (Math.random() < 0.45) {
        const char = SEA_CHARACTERS[Math.floor(Math.random() * SEA_CHARACTERS.length)];
        activePopups.push({
          char,
          x: width / 2 - 110,
          targetX: width / 2 - 110,
          y: 70,
          alpha: 1.0,
          timer: 120
        });
      }
    } else {
      sound.playChessMove();
    }

    if (result.isCheck) {
      sound.playChessCheck();
      if (game.turn === playerColor) {
        const scareChar = SEA_CHARACTERS.find(c => c.type === 'tentacle');
        triggerJumpscare(scareChar);
      }
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

    if (py < 55 && px > width / 2 - 110 && px < width / 2 + 110) {
      gameMode = gameMode === 'ai' ? 'pvp' : 'ai';
      sound.playChessMove();
      return;
    }

    if (py > 60 && py < 105) {
      if (px > 24 && px < 94 && lifelines.hint > 0) {
        lifelines.hint--;
        bestHintMove = game.getBestAIMove('hard');
        sound.playVictory();
        return;
      }
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
    // --- DAY & NIGHT VOYAGE BACKGROUND FOR CHESS DUEL ---
    const cycleSpeed = 0.00012;
    const dayFactor = (Math.sin(time * cycleSpeed) + 1) / 2;

    drawSeaVoyageBackground(ctx, width, height, time, dayFactor);

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

    // Board Square Colors
    const LIGHT_SQ = dayFactor > 0.5 ? '#e2cead' : '#b0a490';
    const DARK_SQ = dayFactor > 0.5 ? '#7a5135' : '#453328';
    const HIGHLIGHT_SQ = 'rgba(212, 175, 55, 0.6)';
    const LAST_MOVE_SQ = 'rgba(230, 126, 34, 0.45)';
    const HINT_SQ = 'rgba(0, 240, 255, 0.65)';

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

        if (bestHintMove && (bestHintMove.from === sqIdx || bestHintMove.to === sqIdx)) {
          ctx.fillStyle = HINT_SQ;
          ctx.fillRect(sqX, sqY, sqSize, sqSize);
        }

        if (selectedSquare === sqIdx) {
          ctx.fillStyle = HIGHLIGHT_SQ;
          ctx.fillRect(sqX, sqY, sqSize, sqSize);
        }

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

        const piece = game.board[sqIdx];
        if (piece) {
          const char = UNICODE_PIECES[piece] || '';
          const isWhite = (piece & PIECES.WHITE) !== 0;

          ctx.save();
          ctx.font = `${Math.floor(sqSize * 0.78)}px 'Segoe UI Symbol', system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

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

    // 7 LIVE ANIMATED CHARACTERS POPPING
    for (let i = activePopups.length - 1; i >= 0; i--) {
      const p = activePopups[i];
      p.timer--;
      if (p.timer < 25) p.alpha = p.timer / 25;
      if (p.timer <= 0) {
        activePopups.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = 'rgba(15, 12, 18, 0.95)';
      ctx.roundRect(p.x, p.y, 220, 75, 12);
      ctx.fill();
      ctx.strokeStyle = p.char.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawLiveCharacter(ctx, p.x + 36, p.y + 38, p.char, time, 0.65);

      ctx.font = '900 12px Cinzel, serif';
      ctx.fillStyle = p.char.color;
      ctx.fillText(p.char.title, p.x + 72, p.y + 24);

      ctx.font = '10px system-ui';
      ctx.fillStyle = '#fff';
      ctx.fillText(p.char.quote, p.x + 72, p.y + 46, 140);
      ctx.restore();
    }

    // JUMPSCARE OVERLAY WITH LIVE ANIMATED CHARACTER
    if (jumpScare) {
      jumpScare.timer--;
      jumpScare.scale = Math.min(jumpScare.maxScale, jumpScare.scale + 0.12);
      
      ctx.save();
      ctx.fillStyle = `rgba(139, 0, 0, ${jumpScare.timer > 20 ? 0.7 : jumpScare.timer * 0.03})`;
      ctx.fillRect(0, 0, width, height);

      drawLiveCharacter(ctx, width / 2, height / 2 - 30, jumpScare, time, jumpScare.scale * 1.8);

      ctx.font = '900 34px Cinzel, serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(jumpScare.title.toUpperCase(), width / 2, height / 2 + 80);

      ctx.font = '700 20px Cinzel, serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`"${jumpScare.quote}"`, width / 2, height / 2 + 115);
      ctx.restore();

      if (jumpScare.timer <= 0) jumpScare = null;
    }

    // TOP HUD
    ctx.save();
    ctx.font = '900 20px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    
    const turnText = game.turn === PIECES.WHITE ? "⚪ White's Move" : "⚫ Black's Move";
    ctx.fillText(`${turnText} ${isThinking ? '(Contemplating...)' : ''}`, width / 2, y - 28);

    // MODE BUTTON
    ctx.fillStyle = 'rgba(34, 22, 17, 0.9)';
    ctx.roundRect(width / 2 - 110, 10, 220, 30, 8);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '900 12px Cinzel, serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`MODE: ${gameMode.toUpperCase()}`, width / 2, 28);

    // HINT LIFELINE BUTTON
    ctx.fillStyle = lifelines.hint > 0 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = '#00f0ff';
    ctx.roundRect(24, 65, 75, 34, 8);
    ctx.fill(); ctx.stroke();
    ctx.font = '900 12px Cinzel, serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🧭 HINT (${lifelines.hint})`, 32, 87);
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
