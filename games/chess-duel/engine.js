// Complete Pure JavaScript Chess Engine with full move generation, check/checkmate & Minimax AI
export const PIECES = {
  EMPTY: 0,
  PAWN: 1,
  KNIGHT: 2,
  BISHOP: 3,
  ROOK: 4,
  QUEEN: 5,
  KING: 6,
  WHITE: 8,
  BLACK: 16
};

const PIECE_VALUES = {
  [PIECES.PAWN]: 100,
  [PIECES.KNIGHT]: 320,
  [PIECES.BISHOP]: 330,
  [PIECES.ROOK]: 500,
  [PIECES.QUEEN]: 900,
  [PIECES.KING]: 20000
};

export class ChessGame {
  constructor() {
    this.board = new Array(64).fill(0);
    this.turn = PIECES.WHITE;
    this.castling = {
      wK: true, wQ: true,
      bK: true, bQ: true
    };
    this.enPassant = -1; // square index
    this.halfMoves = 0;
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
    this.initStandardBoard();
  }

  initStandardBoard() {
    this.board.fill(0);
    const setupRow = (color, row, isPawn = false) => {
      if (isPawn) {
        for (let c = 0; c < 8; c++) this.board[row * 8 + c] = color | PIECES.PAWN;
        return;
      }
      const order = [
        PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN,
        PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK
      ];
      for (let c = 0; c < 8; c++) this.board[row * 8 + c] = color | order[c];
    };

    setupRow(PIECES.BLACK, 0);
    setupRow(PIECES.BLACK, 1, true);
    setupRow(PIECES.WHITE, 6, true);
    setupRow(PIECES.WHITE, 7);

    this.turn = PIECES.WHITE;
    this.castling = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassant = -1;
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
  }

  getPieceColor(piece) {
    if (piece & PIECES.WHITE) return PIECES.WHITE;
    if (piece & PIECES.BLACK) return PIECES.BLACK;
    return 0;
  }

  getPieceType(piece) {
    return piece & 7;
  }

  isOpponent(p1, p2) {
    if (!p1 || !p2) return false;
    return (p1 & 24) !== (p2 & 24);
  }

  // Generate pseudo-legal moves for a square
  getPseudoMoves(fromIndex) {
    const piece = this.board[fromIndex];
    if (!piece) return [];
    const color = this.getPieceColor(piece);
    const type = this.getPieceType(piece);
    const moves = [];

    const row = Math.floor(fromIndex / 8);
    const col = fromIndex % 8;

    const addMove = (toR, toC, flags = {}) => {
      if (toR < 0 || toR >= 8 || toC < 0 || toC >= 8) return false;
      const targetIndex = toR * 8 + toC;
      const targetPiece = this.board[targetIndex];

      if (!targetPiece) {
        moves.push({ from: fromIndex, to: targetIndex, flags });
        return true; // continue sliding
      } else if (this.isOpponent(piece, targetPiece)) {
        moves.push({ from: fromIndex, to: targetIndex, capture: targetPiece, flags });
        return false; // hit enemy, stop sliding
      }
      return false; // hit friend, stop sliding
    };

    if (type === PIECES.PAWN) {
      const dir = color === PIECES.WHITE ? -1 : 1;
      const startRow = color === PIECES.WHITE ? 6 : 1;
      const promoRow = color === PIECES.WHITE ? 0 : 7;

      // 1 step forward
      const f1 = (row + dir) * 8 + col;
      if (!this.board[f1]) {
        if (row + dir === promoRow) {
          moves.push({ from: fromIndex, to: f1, promotion: PIECES.QUEEN });
        } else {
          moves.push({ from: fromIndex, to: f1 });
          // 2 steps forward from start
          if (row === startRow) {
            const f2 = (row + dir * 2) * 8 + col;
            if (!this.board[f2]) {
              moves.push({ from: fromIndex, to: f2, doublePawn: true });
            }
          }
        }
      }

      // Diagonal captures
      for (const dCol of [-1, 1]) {
        const cCol = col + dCol;
        if (cCol >= 0 && cCol < 8) {
          const capIdx = (row + dir) * 8 + cCol;
          const target = this.board[capIdx];
          if (target && this.isOpponent(piece, target)) {
            if (row + dir === promoRow) {
              moves.push({ from: fromIndex, to: capIdx, capture: target, promotion: PIECES.QUEEN });
            } else {
              moves.push({ from: fromIndex, to: capIdx, capture: target });
            }
          } else if (capIdx === this.enPassant) {
            // En passant capture
            moves.push({ from: fromIndex, to: capIdx, enPassant: true });
          }
        }
      }
    } else if (type === PIECES.KNIGHT) {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightOffsets) addMove(row + dr, col + dc);
    } else if (type === PIECES.BISHOP || type === PIECES.ROOK || type === PIECES.QUEEN) {
      const directions = [];
      if (type !== PIECES.ROOK) directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (type !== PIECES.BISHOP) directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (addMove(r, c)) {
          r += dr;
          c += dc;
        }
      }
    } else if (type === PIECES.KING) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) addMove(row + dr, col + dc);
        }
      }

      // Castling
      if (color === PIECES.WHITE) {
        if (this.castling.wK && !this.board[61] && !this.board[62] && !this.isSquareAttacked(60, PIECES.BLACK) && !this.isSquareAttacked(61, PIECES.BLACK)) {
          moves.push({ from: 60, to: 62, castling: 'wK' });
        }
        if (this.castling.wQ && !this.board[59] && !this.board[58] && !this.board[57] && !this.isSquareAttacked(60, PIECES.BLACK) && !this.isSquareAttacked(59, PIECES.BLACK)) {
          moves.push({ from: 60, to: 58, castling: 'wQ' });
        }
      } else {
        if (this.castling.bK && !this.board[5] && !this.board[6] && !this.isSquareAttacked(4, PIECES.WHITE) && !this.isSquareAttacked(5, PIECES.WHITE)) {
          moves.push({ from: 4, to: 6, castling: 'bK' });
        }
        if (this.castling.bQ && !this.board[3] && !this.board[2] && !this.board[1] && !this.isSquareAttacked(4, PIECES.WHITE) && !this.isSquareAttacked(3, PIECES.WHITE)) {
          moves.push({ from: 4, to: 2, castling: 'bQ' });
        }
      }
    }

    return moves;
  }

  isSquareAttacked(squareIndex, byColor) {
    const row = Math.floor(squareIndex / 8);
    const col = squareIndex % 8;

    // Pawns
    const pawnDir = byColor === PIECES.WHITE ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = row + pawnDir;
      const pc = col + dc;
      if (pr >= 0 && pr < 8 && pc >= 0 && pc < 8) {
        const p = this.board[pr * 8 + pc];
        if (p && this.getPieceColor(p) === byColor && this.getPieceType(p) === PIECES.PAWN) return true;
      }
    }

    // Knights
    const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, dc] of knightOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = this.board[nr * 8 + nc];
        if (p && this.getPieceColor(p) === byColor && this.getPieceType(p) === PIECES.KNIGHT) return true;
      }
    }

    // Sliders (Bishops/Rooks/Queens)
    const rayChecks = [
      { dirs: [[-1, -1], [-1, 1], [1, -1], [1, 1]], types: [PIECES.BISHOP, PIECES.QUEEN] },
      { dirs: [[-1, 0], [1, 0], [0, -1], [0, 1]], types: [PIECES.ROOK, PIECES.QUEEN] }
    ];

    for (const { dirs, types } of rayChecks) {
      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const p = this.board[r * 8 + c];
          if (p) {
            if (this.getPieceColor(p) === byColor && types.includes(this.getPieceType(p))) return true;
            break;
          }
          r += dr;
          c += dc;
        }
      }
    }

    // King
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) {
          const kr = row + dr;
          const kc = col + dc;
          if (kr >= 0 && kr < 8 && kc >= 0 && kc < 8) {
            const p = this.board[kr * 8 + kc];
            if (p && this.getPieceColor(p) === byColor && this.getPieceType(p) === PIECES.KING) return true;
          }
        }
      }
    }

    return false;
  }

  isKingInCheck(color) {
    const kingPiece = color | PIECES.KING;
    const kingIndex = this.board.indexOf(kingPiece);
    if (kingIndex === -1) return false;
    const opponent = color === PIECES.WHITE ? PIECES.BLACK : PIECES.WHITE;
    return this.isSquareAttacked(kingIndex, opponent);
  }

  getLegalMoves(fromIndex) {
    const piece = this.board[fromIndex];
    if (!piece || this.getPieceColor(piece) !== this.turn) return [];

    const pseudo = this.getPseudoMoves(fromIndex);
    const legal = [];

    for (const move of pseudo) {
      // Make simulated move
      const undo = this.makeSimulatedMove(move);
      if (!this.isKingInCheck(this.turn)) {
        legal.push(move);
      }
      this.undoSimulatedMove(move, undo);
    }

    return legal;
  }

  getAllLegalMoves(color = this.turn) {
    const all = [];
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (p && this.getPieceColor(p) === color) {
        all.push(...this.getLegalMoves(i));
      }
    }
    return all;
  }

  makeSimulatedMove(move) {
    const piece = this.board[move.from];
    const target = this.board[move.to];
    const undo = {
      fromPiece: piece,
      toPiece: target,
      castling: { ...this.castling },
      enPassant: this.enPassant
    };

    this.board[move.to] = move.promotion ? (this.getPieceColor(piece) | move.promotion) : piece;
    this.board[move.from] = 0;

    if (move.enPassant) {
      const epCapSquare = move.to + (this.turn === PIECES.WHITE ? 8 : -8);
      undo.epCaptured = this.board[epCapSquare];
      this.board[epCapSquare] = 0;
    }

    if (move.castling) {
      if (move.castling === 'wK') { this.board[61] = this.board[63]; this.board[63] = 0; }
      else if (move.castling === 'wQ') { this.board[59] = this.board[56]; this.board[56] = 0; }
      else if (move.castling === 'bK') { this.board[5] = this.board[7]; this.board[7] = 0; }
      else if (move.castling === 'bQ') { this.board[3] = this.board[0]; this.board[0] = 0; }
    }

    return undo;
  }

  undoSimulatedMove(move, undo) {
    this.board[move.from] = undo.fromPiece;
    this.board[move.to] = undo.toPiece;
    this.castling = undo.castling;
    this.enPassant = undo.enPassant;

    if (move.enPassant) {
      const epCapSquare = move.to + (this.turn === PIECES.WHITE ? 8 : -8);
      this.board[epCapSquare] = undo.epCaptured;
    }

    if (move.castling) {
      if (move.castling === 'wK') { this.board[63] = this.board[61]; this.board[61] = 0; }
      else if (move.castling === 'wQ') { this.board[56] = this.board[59]; this.board[59] = 0; }
      else if (move.castling === 'bK') { this.board[7] = this.board[5]; this.board[5] = 0; }
      else if (move.castling === 'bQ') { this.board[0] = this.board[3]; this.board[3] = 0; }
    }
  }

  makeMove(move) {
    const piece = this.board[move.from];
    const color = this.getPieceColor(piece);
    const type = this.getPieceType(piece);

    if (move.capture) {
      if (color === PIECES.WHITE) this.capturedPieces.white.push(move.capture);
      else this.capturedPieces.black.push(move.capture);
    }

    this.makeSimulatedMove(move);

    // Update castling rights
    if (type === PIECES.KING) {
      if (color === PIECES.WHITE) { this.castling.wK = false; this.castling.wQ = false; }
      else { this.castling.bK = false; this.castling.bQ = false; }
    }
    if (move.from === 63 || move.to === 63) this.castling.wK = false;
    if (move.from === 56 || move.to === 56) this.castling.wQ = false;
    if (move.from === 7 || move.to === 7) this.castling.bK = false;
    if (move.from === 0 || move.to === 0) this.castling.bQ = false;

    // Update en passant
    if (move.doublePawn) {
      this.enPassant = move.to + (color === PIECES.WHITE ? 8 : -8);
    } else {
      this.enPassant = -1;
    }

    this.turn = this.turn === PIECES.WHITE ? PIECES.BLACK : PIECES.WHITE;
    this.moveHistory.push(move);

    const isCheck = this.isKingInCheck(this.turn);
    const legalMoves = this.getAllLegalMoves(this.turn);

    let status = 'active';
    if (legalMoves.length === 0) {
      status = isCheck ? 'checkmate' : 'stalemate';
    }

    return { status, isCheck, lastMove: move };
  }

  // AI Evaluation function
  evaluateBoard() {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (!p) continue;
      const val = PIECE_VALUES[this.getPieceType(p)] || 0;
      if (this.getPieceColor(p) === PIECES.WHITE) score += val;
      else score -= val;
    }
    return score;
  }

  // Minimax with Alpha-Beta Pruning
  minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0) return { score: this.evaluateBoard() };

    const legal = this.getAllLegalMoves(isMaximizing ? PIECES.WHITE : PIECES.BLACK);
    if (legal.length === 0) {
      if (this.isKingInCheck(isMaximizing ? PIECES.WHITE : PIECES.BLACK)) {
        return { score: isMaximizing ? -100000 + depth : 100000 - depth };
      }
      return { score: 0 }; // stalemate
    }

    let bestMove = null;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const m of legal) {
        const undo = this.makeSimulatedMove(m);
        const prevTurn = this.turn;
        this.turn = PIECES.BLACK;
        const result = this.minimax(depth - 1, alpha, beta, false);
        this.turn = prevTurn;
        this.undoSimulatedMove(m, undo);

        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = m;
        }
        alpha = Math.max(alpha, maxScore);
        if (beta <= alpha) break;
      }
      return { score: maxScore, move: bestMove };
    } else {
      let minScore = Infinity;
      for (const m of legal) {
        const undo = this.makeSimulatedMove(m);
        const prevTurn = this.turn;
        this.turn = PIECES.WHITE;
        const result = this.minimax(depth - 1, alpha, beta, true);
        this.turn = prevTurn;
        this.undoSimulatedMove(m, undo);

        if (result.score < minScore) {
          minScore = result.score;
          bestMove = m;
        }
        beta = Math.min(beta, minScore);
        if (beta <= alpha) break;
      }
      return { score: minScore, move: bestMove };
    }
  }

  getBestAIMove(difficulty = 'medium') {
    const depth = difficulty === 'hard' ? 3 : (difficulty === 'medium' ? 2 : 1);
    const legal = this.getAllLegalMoves(this.turn);
    if (legal.length === 0) return null;

    if (difficulty === 'easy' && Math.random() < 0.4) {
      return legal[Math.floor(Math.random() * legal.length)];
    }

    const res = this.minimax(depth, -Infinity, Infinity, this.turn === PIECES.WHITE);
    return res.move || legal[0];
  }
}
