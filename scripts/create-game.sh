#!/bin/bash
# ================================================================================
# TKP DEV STUDIO - ONE COMMAND GAME GENERATOR
# ================================================================================
#
# Usage:
#   ./create-game.sh <game-name>
#
# Examples:
#   ./create-game.sh tictactoe
#   ./create-game.sh breakout
#   ./create-game.sh snake
#
# ================================================================================

COMPANY_ID="7fbb2529-7d69-4177-bb6b-988404c35965"
PAPERCLIP_API="http://127.0.0.1:3100"
WORKSPACE="/c/Users/PC/.paperclip/instances/default/workspaces/tkp-dev-studio"

GAME_NAME="$1"

if [ -z "$GAME_NAME" ]; then
    echo "ERROR: Missing game name"
    echo "Usage: ./create-game.sh [game-name]"
    exit 1
fi

PROJECT_DIR="$WORKSPACE/projects/$GAME_NAME"

echo "================================================================================"
echo "TKP DEV STUDIO - Creating game: $GAME_NAME"
echo "================================================================================"

# Create project folder
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/src"
mkdir -p "$PROJECT_DIR/assets"
mkdir -p "$PROJECT_DIR/docs"

echo "[1/6] Project structure created"

# Create SPEC.md
cat > "$PROJECT_DIR/SPEC.md" << 'EOF'
# GAME_NAME - Game Specification

## Project Overview
- Name: GAME_NAME
- Type: HTML5 Game
- Engine: Phaser 3
- Target: Browser, Mobile

## Game Mechanics
- Core gameplay loop
- Win/lose conditions
- Scoring system
- Levels/progression

## Technical Requirements
- Single HTML file with embedded JS
- Responsive design
- Touch controls for mobile
- Sound effects

## Art Style
- Minimalist design
- Vibrant colors
- Smooth animations
EOF

sed -i "s/GAME_NAME/$GAME_NAME/g" "$PROJECT_DIR/SPEC.md"
echo "[2/6] SPEC.md created"

# Create main game file (TicTacToe as default template)
cat > "$PROJECT_DIR/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GAME_NAME</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #game-container {
            text-align: center;
        }
        h1 {
            color: #fff;
            margin-bottom: 20px;
            font-size: 2.5rem;
            text-shadow: 0 0 10px rgba(255,255,255,0.3);
        }
        .board {
            display: grid;
            grid-template-columns: repeat(3, 100px);
            gap: 10px;
            margin: 0 auto;
        }
        .cell {
            width: 100px;
            height: 100px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 3rem;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cell:hover {
            background: rgba(255,255,255,0.2);
            transform: scale(1.05);
        }
        .cell.x { color: #00d4ff; }
        .cell.o { color: #ff6b6b; }
        #status {
            color: #fff;
            margin-top: 20px;
            font-size: 1.5rem;
        }
        #restart {
            margin-top: 20px;
            padding: 12px 30px;
            font-size: 1.2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        #restart:hover {
            transform: scale(1.1);
        }
        .score {
            color: #fff;
            margin-top: 15px;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <h1>TicTacToe</h1>
        <div class="board" id="board">
            <div class="cell" data-index="0"></div>
            <div class="cell" data-index="1"></div>
            <div class="cell" data-index="2"></div>
            <div class="cell" data-index="3"></div>
            <div class="cell" data-index="4"></div>
            <div class="cell" data-index="5"></div>
            <div class="cell" data-index="6"></div>
            <div class="cell" data-index="7"></div>
            <div class="cell" data-index="8"></div>
        </div>
        <div id="status">Player X's turn</div>
        <div class="score" id="score">X: 0 | O: 0 | Draws: 0</div>
        <button id="restart">Play Again</button>
    </div>

    <script>
        const cells = document.querySelectorAll('.cell');
        const status = document.getElementById('status');
        const scoreEl = document.getElementById('score');
        const restartBtn = document.getElementById('restart');

        let currentPlayer = 'X';
        let gameState = ['', '', '', '', '', '', '', '', ''];
        let gameActive = true;
        let scores = { X: 0, O: 0, draws: 0 };

        const winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        function handleCellClick(e) {
            const index = e.target.dataset.index;
            if (gameState[index] || !gameActive) return;

            gameState[index] = currentPlayer;
            e.target.textContent = currentPlayer;
            e.target.classList.add(currentPlayer.toLowerCase());

            if (checkWin()) {
                gameActive = false;
                scores[currentPlayer]++;
                status.textContent = `Player ${currentPlayer} wins!`;
                updateScore();
            } else if (gameState.every(cell => cell)) {
                gameActive = false;
                scores.draws++;
                status.textContent = "It's a draw!";
                updateScore();
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                status.textContent = `Player ${currentPlayer}'s turn`;
            }
        }

        function checkWin() {
            return winningCombos.some(combo => {
                return combo.every(index => gameState[index] === currentPlayer);
            });
        }

        function updateScore() {
            scoreEl.textContent = `X: ${scores.X} | O: ${scores.O} | Draws: ${scores.draws}`;
        }

        function restartGame() {
            gameState = ['', '', '', '', '', '', '', '', ''];
            gameActive = true;
            currentPlayer = 'X';
            cells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('x', 'o');
            });
            status.textContent = "Player X's turn";
        }

        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        restartBtn.addEventListener('click', restartGame);
    </script>
</body>
</html>
HTMLEOF

sed -i "s/TicTacToe/$(echo $GAME_NAME | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1))substr($i,2)}1')/g" "$PROJECT_DIR/index.html"
echo "[3/6] Game HTML created"

# Create README
cat > "$PROJECT_DIR/README.md" << EOF
# $GAME_NAME

A game created by TKP Dev Studio.

## How to Play

1. Open `index.html` in any web browser
2. No server required - works offline

## Tech Stack

- Pure HTML5, CSS3, JavaScript
- No external dependencies

## Deployment

- Vercel: Just deploy the folder
- Netlify: Drag and drop
- GitHub Pages: Enable in settings

---

Built with ❤️ by TKP Dev Studio
EOF

echo "[4/6] README.md created"

# Create issues in Paperclip
echo "[5/6] Creating issues in Paperclip..."

# Create Goal
curl -s -X POST "$PAPERCLIP_API/api/companies/$COMPANY_ID/goals" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"[GAME] $GAME_NAME - Complete Development\", \"description\": \"Develop and deploy $GAME_NAME game. From spec to production.\", \"priority\": \"high\"}" > /dev/null

# Create Issues
curl -s -X POST "$PAPERCLIP_API/api/companies/$COMPANY_ID/issues" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"[Enhance] $GAME_NAME - Add Features\", \"description\": \"Enhance $GAME_NAME with more features, levels, and polish.\", \"priority\": \"medium\", \"assigneeAgentId\": \"b7e8ffa5-23f5-4428-bced-3360f3dd4ffd\"}" > /dev/null

curl -s -X POST "$PAPERCLIP_API/api/companies/$COMPANY_ID/issues" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"[QA] $GAME_NAME - Testing\", \"description\": \"Test $GAME_NAME on multiple browsers and devices.\", \"priority\": \"high\", \"assigneeAgentId\": \"71c1482f-fe71-45a8-b2bb-70feb34657c3\"}" > /dev/null

curl -s -X POST "$PAPERCLIP_API/api/companies/$COMPANY_ID/issues" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"[DevOps] $GAME_NAME - Deploy\", \"description\": \"Deploy $GAME_NAME to Vercel/Netlify.\", \"priority\": \"high\", \"assigneeAgentId\": \"a8fbdb89-3fa8-4b92-9ae7-8b836f7af9da\"}" > /dev/null

echo "[6/6] Paperclip issues created"

echo ""
echo "================================================================================"
echo "GAME '$GAME_NAME' READY!"
echo "================================================================================"
echo ""
echo "Location: $PROJECT_DIR"
echo ""
echo "To play: Open $PROJECT_DIR/index.html in browser"
echo ""
echo "To deploy: CEO can assign DevOps to deploy"
echo ""
echo "Next game: ./create-game.sh another-game"
echo "================================================================================"
