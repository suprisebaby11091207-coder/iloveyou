// ==================== 糖果消消乐游戏 ====================

// 游戏配置
const BOARD_SIZE = 8;
const CANDY_TYPES = ['🍬', '🍭', '🍰', '🍩', '🍪', '🧁'];
const SPECIAL_BOMB = '💣';
const INITIAL_MOVES = 30;
const LEVEL_MOVES = [30, 60, 110, 140, 180, 220]; // 每关的移动次数
const LEVEL_TARGETS = [1000, 2000, 3000, 5000, 7000, 10000];

// 游戏状态
let board = [];
let score = 0;
let moves = INITIAL_MOVES;
let level = 1;
let target = LEVEL_TARGETS[0];
let selectedCandy = null;
let isProcessing = false;
let touchStartPos = null;
let touchCandy = null;
let completedLevels = 0; // 跟踪完成的关卡数

// 倒计时目标时间（马来西亚时间今天早上10点）
const getTargetTime = () => {
    const now = new Date();
    // 马来西亚时间 UTC+8
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    
    // 设置今天早上10点
    const target = new Date(malaysiaTime);
    target.setHours(10, 0, 0, 0);
    
    // 不再设置到明天，过了就过了
    
    return target;
};

let targetTime = getTargetTime();
let countdownInterval = null;
let timeReached = false;

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;

// 音效函数
function playSound(type) {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'select':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'swap':
            oscillator.frequency.value = 400;
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
            
        case 'match':
            // 播放三个音符
            [600, 800, 1000].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const startTime = audioContext.currentTime + (i * 0.05);
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
                osc.start(startTime);
                osc.stop(startTime + 0.2);
            });
            break;
            
        case 'win':
            // 胜利音效 - 上升音阶
            [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const startTime = audioContext.currentTime + (i * 0.15);
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
            break;
            
        case 'lose':
            // 失败音效 - 下降音阶
            [400, 350, 300, 250].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sawtooth';
                const startTime = audioContext.currentTime + (i * 0.1);
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
            break;
            
        case 'drop':
            oscillator.frequency.value = 200;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'special':
            // 特殊糖果创建音效
            [800, 1000, 1200, 1400].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'square';
                const startTime = audioContext.currentTime + (i * 0.03);
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
                osc.start(startTime);
                osc.stop(startTime + 0.15);
            });
            break;
            
        case 'bomb':
            // 炸弹爆炸音效
            const bombOsc = audioContext.createOscillator();
            const bombGain = audioContext.createGain();
            bombOsc.connect(bombGain);
            bombGain.connect(audioContext.destination);
            bombOsc.type = 'sawtooth';
            bombOsc.frequency.setValueAtTime(100, audioContext.currentTime);
            bombOsc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            bombGain.gain.setValueAtTime(0.4, audioContext.currentTime);
            bombGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            bombOsc.start(audioContext.currentTime);
            bombOsc.stop(audioContext.currentTime + 0.3);
            break;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundBtn');
    btn.textContent = soundEnabled ? '🔊 音效开' : '🔇 音效关';
    playSound('select');
}

// ==================== 进度保存/加载 ====================

// 保存游戏进度到localStorage
function saveProgress() {
    const progress = {
        level: level,
        completedLevels: completedLevels,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('candyCrushProgress', JSON.stringify(progress));
}

// 从 localStorage 加载游戏进度
function loadProgress() {
    const saved = localStorage.getItem('candyCrushProgress');
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            level = progress.level || 1;
            completedLevels = progress.completedLevels || 0;
            target = LEVEL_TARGETS[level - 1];
            updateLevelProgress();
        } catch (e) {
            console.log('无法加载进度');
        }
    }
}

// 清除进度
function clearProgress() {
    localStorage.removeItem('candyCrushProgress');
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载保存的进度
    loadProgress();
    
    createClouds();
    createTrees();
    createBirds();
    createButterflies();
    initGame();
    setupEventListeners();
    startCountdown(); // 启动倒计时
    updateSurpriseButton(); // 更新按钮状态
    
    // 显示教程弹窗（如果是第一次访问）
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
        document.getElementById('tutorialModal').style.display = 'flex';
    }
});

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('retryBtn').addEventListener('click', retryLevel);
    document.getElementById('surpriseBtn').addEventListener('click', goToSurprise);
    document.getElementById('closeTutorial').addEventListener('click', closeTutorial);
    document.getElementById('startGameBtn').addEventListener('click', closeTutorial);
    document.getElementById('closeWinModal').addEventListener('click', closeWinModal);
}

// 初始化游戏
function initGame() {
    // 重置游戏状态
    isProcessing = false;
    selectedCandy = null;
    touchStartPos = null;
    touchCandy = null;
    
    score = 0;
    moves = LEVEL_MOVES[level - 1] || INITIAL_MOVES;
    updateUI();
    createBoard();
    renderBoard();
}

// 创建棋盘
function createBoard() {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = getRandomCandy();
        }
    }
    
    // 确保初始没有匹配
    while (hasMatches()) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (isPartOfMatch(row, col)) {
                    board[row][col] = getRandomCandy();
                }
            }
        }
    }
}

// 获取随机糖果
function getRandomCandy() {
    return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
}

// 渲染棋盘
function renderBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const candy = document.createElement('div');
            candy.className = 'candy';
            candy.textContent = board[row][col];
            candy.dataset.row = row;
            candy.dataset.col = col;
            
            // 为炸弹添加特殊样式
            if (board[row][col] === SPECIAL_BOMB) {
                candy.classList.add('bomb-candy');
            }
            
            // 鼠标点击事件
            candy.addEventListener('click', () => handleCandyClick(row, col));
            
            // 触摸事件（移动端）
            candy.addEventListener('touchstart', handleTouchStart, { passive: false });
            candy.addEventListener('touchmove', handleTouchMove, { passive: false });
            candy.addEventListener('touchend', handleTouchEnd, { passive: false });
            
            gameBoard.appendChild(candy);
        }
    }
}

// 处理糖果点击
function handleCandyClick(row, col) {
    if (isProcessing || moves <= 0) return;
    
    // 如果点击的是炸弹，直接触发爆炸
    if (board[row][col] === SPECIAL_BOMB) {
        triggerBombExplosion(row, col);
        return;
    }
    
    const candy = getCandyElement(row, col);
    
    if (!selectedCandy) {
        // 选择第一个糖果
        selectedCandy = { row, col };
        candy.classList.add('selected');
        playSound('select');
    } else {
        // 选择第二个糖果
        const prevCandy = getCandyElement(selectedCandy.row, selectedCandy.col);
        prevCandy.classList.remove('selected');
        
        // 检查是否相邻
        if (isAdjacent(selectedCandy.row, selectedCandy.col, row, col)) {
            swapCandies(selectedCandy.row, selectedCandy.col, row, col);
        }
        
        selectedCandy = null;
    }
}

// 处理触摸开始
function handleTouchStart(e) {
    if (isProcessing || moves <= 0) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const element = e.target;
    
    const row = parseInt(element.dataset.row);
    const col = parseInt(element.dataset.col);
    
    // 如果点击的是炸弹，直接触发爆炸
    if (board[row][col] === SPECIAL_BOMB) {
        triggerBombExplosion(row, col);
        // 清理触摸状态
        touchStartPos = null;
        touchCandy = null;
        return;
    }
    
    touchStartPos = {
        x: touch.clientX,
        y: touch.clientY
    };
    
    touchCandy = { row, col };
    
    element.classList.add('selected');
    playSound('select');
}

// 处理触摸移动
function handleTouchMove(e) {
    if (!touchStartPos || !touchCandy) return;
    e.preventDefault();
}

// 处理触摸结束
function handleTouchEnd(e) {
    if (!touchStartPos || !touchCandy || isProcessing) {
        clearTouchSelection();
        return;
    }
    
    e.preventDefault();
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    
    // 计算滑动方向
    const minSwipeDistance = 30; // 最小滑动距离
    
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
        let targetRow = touchCandy.row;
        let targetCol = touchCandy.col;
        
        // 判断主要滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (deltaX > 0 && touchCandy.col < BOARD_SIZE - 1) {
                targetCol++; // 向右
            } else if (deltaX < 0 && touchCandy.col > 0) {
                targetCol--; // 向左
            }
        } else {
            // 垂直滑动
            if (deltaY > 0 && touchCandy.row < BOARD_SIZE - 1) {
                targetRow++; // 向下
            } else if (deltaY < 0 && touchCandy.row > 0) {
                targetRow--; // 向上
            }
        }
        
        // 如果目标位置有效且不同，执行交换
        if (targetRow !== touchCandy.row || targetCol !== touchCandy.col) {
            swapCandies(touchCandy.row, touchCandy.col, targetRow, targetCol);
        }
    }
    
    clearTouchSelection();
}

// 清除触摸选择
function clearTouchSelection() {
    if (touchCandy) {
        const element = getCandyElement(touchCandy.row, touchCandy.col);
        if (element) {
            element.classList.remove('selected');
        }
    }
    touchStartPos = null;
    touchCandy = null;
}

// 检查是否相邻
function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// 交换糖果
async function swapCandies(row1, col1, row2, col2) {
    isProcessing = true;
    
    // 执行交换动画
    await animateSwap(row1, col1, row2, col2);
    
    // 交换数据
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
    
    renderBoard();
    
    // 检查是否有匹配
    if (hasMatches()) {
        moves--;
        updateUI();
        playSound('swap');
        await processMatches();
    } else {
        // 如果没有匹配，交换回来
        await animateSwap(row1, col1, row2, col2);
        const temp = board[row1][col1];
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = temp;
        renderBoard();
    }
    
    isProcessing = false;
    checkGameOver();
}

// 交换动画
function animateSwap(row1, col1, row2, col2) {
    return new Promise(resolve => {
        const candy1 = getCandyElement(row1, col1);
        const candy2 = getCandyElement(row2, col2);
        
        candy1.classList.add('swapping');
        candy2.classList.add('swapping');
        
        setTimeout(() => {
            candy1.classList.remove('swapping');
            candy2.classList.remove('swapping');
            resolve();
        }, 300);
    });
}

// 处理匹配
async function processMatches() {
    while (hasMatches()) {
        // 标记并移除匹配的糖果
        const matchGroups = findMatchGroups();
        const matches = findMatches();
        
        // 检查是否有4个或以上的匹配，创建炸弹
        let bombPosition = null;
        for (const group of matchGroups) {
            if (group.length >= 4) {
                // 在第一个位置创建炸弹
                bombPosition = group[0];
                playSound('special');
                break;
            }
        }
        
        await removeMatches(matches);
        
        // 更新分数 - 每个糖果 20分
        score += matches.length * 20;
        updateUI();
        
        // 下落糖果
        await dropCandies();
        
        // 填充新糖果
        fillBoard();
        
        // 如果需要创建炸弹
        if (bombPosition) {
            board[bombPosition.row][bombPosition.col] = SPECIAL_BOMB;
        }
        
        renderBoard();
        
        await sleep(300);
    }
}

// 查找所有匹配组（用于检测特殊糖果）
function findMatchGroups() {
    const groups = [];
    const processed = new Set();
    
    // 检查横向匹配
    for (let row = 0; row < BOARD_SIZE; row++) {
        let currentGroup = [];
        let currentCandy = null;
        
        for (let col = 0; col < BOARD_SIZE; col++) {
            const candy = board[row][col];
            if (candy === SPECIAL_BOMB) continue;
            
            if (candy === currentCandy) {
                currentGroup.push({ row, col });
            } else {
                if (currentGroup.length >= 3) {
                    groups.push([...currentGroup]);
                }
                currentGroup = [{ row, col }];
                currentCandy = candy;
            }
        }
        if (currentGroup.length >= 3) {
            groups.push([...currentGroup]);
        }
    }
    
    // 检查纵向匹配
    for (let col = 0; col < BOARD_SIZE; col++) {
        let currentGroup = [];
        let currentCandy = null;
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            const candy = board[row][col];
            if (candy === SPECIAL_BOMB) continue;
            
            if (candy === currentCandy) {
                currentGroup.push({ row, col });
            } else {
                if (currentGroup.length >= 3) {
                    groups.push([...currentGroup]);
                }
                currentGroup = [{ row, col }];
                currentCandy = candy;
            }
        }
        if (currentGroup.length >= 3) {
            groups.push([...currentGroup]);
        }
    }
    
    return groups;
}

// 查找所有匹配
function findMatches() {
    const matches = [];
    const bombsToExplode = [];
    
    // 检查横向匹配
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {
            const candy = board[row][col];
            if (candy === SPECIAL_BOMB) continue;
            
            if (candy === board[row][col + 1] && candy === board[row][col + 2]) {
                matches.push({ row, col });
                matches.push({ row, col: col + 1 });
                matches.push({ row, col: col + 2 });
                
                // 检查是否包含炸弹
                if (board[row][col] === SPECIAL_BOMB) bombsToExplode.push({ row, col });
                if (board[row][col + 1] === SPECIAL_BOMB) bombsToExplode.push({ row, col: col + 1 });
                if (board[row][col + 2] === SPECIAL_BOMB) bombsToExplode.push({ row, col: col + 2 });
            }
        }
    }
    
    // 检查纵向匹配
    for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = 0; row < BOARD_SIZE - 2; row++) {
            const candy = board[row][col];
            if (candy === SPECIAL_BOMB) continue;
            
            if (candy === board[row + 1][col] && candy === board[row + 2][col]) {
                matches.push({ row, col });
                matches.push({ row: row + 1, col });
                matches.push({ row: row + 2, col });
                
                // 检查是否包含炸弹
                if (board[row][col] === SPECIAL_BOMB) bombsToExplode.push({ row, col });
                if (board[row + 1][col] === SPECIAL_BOMB) bombsToExplode.push({ row: row + 1, col });
                if (board[row + 2][col] === SPECIAL_BOMB) bombsToExplode.push({ row: row + 2, col });
            }
        }
    }
    
    // 如果有炸弹被匹配，添加周围4x4区域
    for (const bomb of bombsToExplode) {
        const explosionArea = getBombExplosionArea(bomb.row, bomb.col);
        matches.push(...explosionArea);
    }
    
    // 去重
    const uniqueMatches = [];
    const seen = new Set();
    for (const match of matches) {
        const key = `${match.row},${match.col}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueMatches.push(match);
        }
    }
    
    return uniqueMatches;
}

// 获取炸弹爆炸范围（4x4区域）
function getBombExplosionArea(centerRow, centerCol) {
    const area = [];
    
    // 计算4x4区域的起始位置（炸弹为中心）
    for (let row = centerRow - 2; row <= centerRow + 1; row++) {
        for (let col = centerCol - 2; col <= centerCol + 1; col++) {
            if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
                area.push({ row, col });
            }
        }
    }
    
    return area;
}

// 触发炸弹爆炸（直接点击炸弹）
async function triggerBombExplosion(row, col) {
    isProcessing = true;
    
    // 清除选中状态
    if (selectedCandy) {
        const prevCandy = getCandyElement(selectedCandy.row, selectedCandy.col);
        if (prevCandy) prevCandy.classList.remove('selected');
        selectedCandy = null;
    }
    
    // 清除所有选中的糖果
    document.querySelectorAll('.candy.selected').forEach(c => c.classList.remove('selected'));
    
    // 减少步数
    moves--;
    updateUI();
    
    // 获取爆炸范围
    const explosionArea = getBombExplosionArea(row, col);
    
    // 移除爆炸区域内的所有糖果
    await removeMatches(explosionArea);
    
    // 更新分数 - 每个被炸掉的糖果 20分
    score += explosionArea.length * 20;
    updateUI();
    
    // 下落糖果
    await dropCandies();
    
    // 填充新糖果
    fillBoard();
    renderBoard();
    
    await sleep(300);
    
    // 处理可能产生的新匹配
    await processMatches();
    
    // 检查游戏是否结束
    if (score >= LEVEL_TARGETS[level - 1]) {
        showWinModal();
    } else if (moves <= 0) {
        showLoseModal();
    }
    
    isProcessing = false;
}

// 移除匹配的糖果
function removeMatches(matches) {
    return new Promise(resolve => {
        // 检查是否有炸弹爆炸
        const hasBomb = matches.some(match => board[match.row][match.col] === SPECIAL_BOMB);
        
        if (hasBomb) {
            playSound('bomb');
        } else {
            playSound('match');
        }
        
        matches.forEach(match => {
            const candy = getCandyElement(match.row, match.col);
            if (candy) {
                if (board[match.row][match.col] === SPECIAL_BOMB) {
                    candy.classList.add('bomb-explode');
                    createExplosion(candy);
                } else {
                    candy.classList.add('matched');
                    createParticles(candy);
                }
            }
            board[match.row][match.col] = null;
        });
        
        setTimeout(() => {
            renderBoard();
            resolve();
        }, 400);
    });
}

// 创建粒子效果
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#87CEEB'];
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = (Math.PI * 2 / 8) * i;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        document.body.appendChild(particle);
        
        let posX = rect.left + rect.width / 2;
        let posY = rect.top + rect.height / 2;
        let opacity = 1;
        
        const animate = () => {
            posX += vx * 0.016;
            posY += vy * 0.016;
            opacity -= 0.02;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// 创建爆炸效果
function createExplosion(element) {
    const rect = element.getBoundingClientRect();
    const colors = ['#FF4500', '#FF6347', '#FFA500', '#FFD700', '#FF8C00'];
    
    // 创建更多粒子，更大的爆炸效果
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = '12px';
        particle.style.height = '12px';
        
        const angle = (Math.PI * 2 / 20) * i;
        const velocity = 80 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        document.body.appendChild(particle);
        
        let posX = rect.left + rect.width / 2;
        let posY = rect.top + rect.height / 2;
        let opacity = 1;
        
        const animate = () => {
            posX += vx * 0.016;
            posY += vy * 0.016;
            opacity -= 0.015;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// 下落糖果
function dropCandies() {
    return new Promise(resolve => {
        playSound('drop');
        for (let col = 0; col < BOARD_SIZE; col++) {
            let emptyRow = BOARD_SIZE - 1;
            for (let row = BOARD_SIZE - 1; row >= 0; row--) {
                if (board[row][col] !== null) {
                    if (row !== emptyRow) {
                        board[emptyRow][col] = board[row][col];
                        board[row][col] = null;
                    }
                    emptyRow--;
                }
            }
        }
        
        renderBoard();
        setTimeout(resolve, 300);
    });
}

// 填充棋盘
function fillBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = getRandomCandy();
            }
        }
    }
}

// 检查是否有匹配
function hasMatches() {
    return findMatches().length > 0;
}

// 检查某个位置是否是匹配的一部分
function isPartOfMatch(row, col) {
    const candy = board[row][col];
    
    // 检查横向
    let count = 1;
    let c = col - 1;
    while (c >= 0 && board[row][c] === candy) {
        count++;
        c--;
    }
    c = col + 1;
    while (c < BOARD_SIZE && board[row][c] === candy) {
        count++;
        c++;
    }
    if (count >= 3) return true;
    
    // 检查纵向
    count = 1;
    let r = row - 1;
    while (r >= 0 && board[r][col] === candy) {
        count++;
        r--;
    }
    r = row + 1;
    while (r < BOARD_SIZE && board[r][col] === candy) {
        count++;
        r++;
    }
    if (count >= 3) return true;
    
    return false;
}

// 获取糖果元素
function getCandyElement(row, col) {
    return document.querySelector(`.candy[data-row="${row}"][data-col="${col}"]`);
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
    document.getElementById('level').textContent = level;
    document.getElementById('target').textContent = target;
}

// 检查游戏结束
function checkGameOver() {
    if (score >= target) {
        showWinModal();
    } else if (moves <= 0) {
        showLoseModal();
    }
}

// 显示胜利弹窗
function showWinModal() {
    document.getElementById('winScore').textContent = score;
    
    // 更新完成的关卡数
    if (level <= 3) {
        completedLevels = Math.max(completedLevels, level);
        updateLevelProgress();
        updateSurpriseButton();
        saveProgress(); // 保存进度
    }
    
    // 如果完成了3关，显示特殊消息
    if (completedLevels >= 3 && level === 3) {
        document.getElementById('winTitle').innerHTML = '🎉🎊 大功告成！ 🎊🎉';
        
        // 检查时间是否到了
        if (timeReached) {
            document.getElementById('winMessage').innerHTML = '❤️ <strong>老婆恭喜你，你已经赢了3关！<br/>现在可以去按下面的惊喜按钮了！</strong> 🎁✨';
        } else {
            document.getElementById('winMessage').innerHTML = '❤️ <strong>老婆恭喜你，你已经赢了3关！<br/>但是要确保时间倒数完毕才能打开惊喜哦～</strong> ⏰🎁';
        }
        
        // 隐藏"下一关"按钮
        document.getElementById('nextLevelBtn').style.display = 'none';
    } else {
        document.getElementById('winTitle').innerHTML = '🎉 恭喜过关！ 🎉';
        document.getElementById('winMessage').textContent = '太棒了！准备好下一关了吗？';
        document.getElementById('nextLevelBtn').textContent = '下一关 →';
        document.getElementById('nextLevelBtn').style.display = 'inline-block';
    }
    
    document.getElementById('winModal').style.display = 'flex';
    createConfetti();
    playSound('win');
}

// 显示失败弹窗
function showLoseModal() {
    document.getElementById('loseScore').textContent = score;
    document.getElementById('loseModal').style.display = 'flex';
    playSound('lose');
}

// 下一关
function nextLevel() {
    level++;
    if (level > LEVEL_TARGETS.length) {
        level = LEVEL_TARGETS.length;
    }
    target = LEVEL_TARGETS[level - 1];
    score = 0;
    moves = LEVEL_MOVES[level - 1] || INITIAL_MOVES;
    document.getElementById('winModal').style.display = 'none';
    saveProgress(); // 保存进度
    initGame();
}

// 重试当前关卡（输了后重玩）
function retryLevel() {
    score = 0;
    moves = LEVEL_MOVES[level - 1] || INITIAL_MOVES;
    document.getElementById('loseModal').style.display = 'none';
    initGame();
}

// 重新开始游戏（从第1关开始）
function restartGame() {
    level = 1;
    target = LEVEL_TARGETS[0];
    score = 0;
    moves = LEVEL_MOVES[0];
    // 不重置completedLevels，保持进度
    document.getElementById('winModal').style.display = 'none';
    document.getElementById('loseModal').style.display = 'none';
    saveProgress(); // 保存重置后的进度
    initGame();
}

// 提示功能
function showHint() {
    if (isProcessing) return;
    
    // 查找可能的移动
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // 检查右边
            if (col < BOARD_SIZE - 1) {
                const temp = board[row][col];
                board[row][col] = board[row][col + 1];
                board[row][col + 1] = temp;
                
                if (hasMatches()) {
                    // 交换回来
                    board[row][col + 1] = board[row][col];
                    board[row][col] = temp;
                    
                    // 高亮提示
                    highlightHint(row, col, row, col + 1);
                    return;
                }
                
                // 交换回来
                board[row][col + 1] = board[row][col];
                board[row][col] = temp;
            }
            
            // 检查下边
            if (row < BOARD_SIZE - 1) {
                const temp = board[row][col];
                board[row][col] = board[row + 1][col];
                board[row + 1][col] = temp;
                
                if (hasMatches()) {
                    // 交换回来
                    board[row + 1][col] = board[row][col];
                    board[row][col] = temp;
                    
                    // 高亮提示
                    highlightHint(row, col, row + 1, col);
                    return;
                }
                
                // 交换回来
                board[row + 1][col] = board[row][col];
                board[row][col] = temp;
            }
        }
    }
}

// 高亮提示
function highlightHint(row1, col1, row2, col2) {
    const candy1 = getCandyElement(row1, col1);
    const candy2 = getCandyElement(row2, col2);
    
    candy1.classList.add('hint');
    candy2.classList.add('hint');
    
    setTimeout(() => {
        candy1.classList.remove('hint');
        candy2.classList.remove('hint');
    }, 2000);
}

// 工具函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 视觉效果 ====================

// 创建云朵
function createClouds() {
    const cloudsContainer = document.getElementById('clouds');
    const cloudEmojis = ['☁️', '☁️', '🌥️', '⛅'];
    
    // 创建初始云朵
    for (let i = 0; i < 5; i++) {
        createCloud(i * 20);
    }
    
    // 定期创建新云朵
    setInterval(() => {
        createCloud(0);
    }, 8000);
    
    function createCloud(delay) {
        setTimeout(() => {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.textContent = cloudEmojis[Math.floor(Math.random() * cloudEmojis.length)];
            cloud.style.top = Math.random() * 40 + 10 + '%';
            cloud.style.left = '-100px';
            cloud.style.animationDuration = (15 + Math.random() * 10) + 's';
            cloudsContainer.appendChild(cloud);
            
            setTimeout(() => cloud.remove(), 30000);
        }, delay * 1000);
    }
}

// 创建树木
function createTrees() {
    const treesContainer = document.getElementById('trees');
    const treeTypes = ['🌲', '🌳', '🌴', '🎄', '🌲', '🌳'];
    
    treeTypes.forEach((tree, index) => {
        const treeElement = document.createElement('div');
        treeElement.className = 'tree';
        treeElement.textContent = tree;
        treeElement.style.animationDelay = (index * 0.5) + 's';
        treesContainer.appendChild(treeElement);
    });
}

// 创建飞鸟
function createBirds() {
    const birdsContainer = document.getElementById('birds');
    const birdEmojis = ['🐦', '🕊️', '🦅'];
    
    // 创建初始飞鸟
    for (let i = 0; i < 3; i++) {
        createBird(i * 5);
    }
    
    // 定期创建新飞鸟
    setInterval(() => {
        createBird(0);
    }, 12000);
    
    function createBird(delay) {
        setTimeout(() => {
            const bird = document.createElement('div');
            bird.className = 'bird';
            bird.textContent = birdEmojis[Math.floor(Math.random() * birdEmojis.length)];
            bird.style.top = Math.random() * 30 + 10 + '%';
            bird.style.left = '-50px';
            bird.style.animationDuration = (12 + Math.random() * 6) + 's';
            birdsContainer.appendChild(bird);
            
            setTimeout(() => bird.remove(), 20000);
        }, delay * 1000);
    }
}

// 创建蝴蝶
function createButterflies() {
    const butterflyEmojis = ['🦋', '🦋', '🦋'];
    
    for (let i = 0; i < 5; i++) {
        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly';
        butterfly.textContent = butterflyEmojis[Math.floor(Math.random() * butterflyEmojis.length)];
        butterfly.style.left = Math.random() * 80 + 10 + '%';
        butterfly.style.top = Math.random() * 60 + 20 + '%';
        butterfly.style.animationDelay = (Math.random() * 4) + 's';
        butterfly.style.animationDuration = (6 + Math.random() * 4) + 's';
        document.body.appendChild(butterfly);
    }
}

// 彩带效果
function createConfetti() {
    const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#87CEEB', '#98FB98'];
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 30);
    }
}

// ==================== 倒计时功能 ====================

// 启动倒计时
function startCountdown() {
    updateCountdown(); // 立即更新一次
    countdownInterval = setInterval(updateCountdown, 1000); // 每秒更新
}

// 更新倒计时显示
function updateCountdown() {
    const now = new Date();
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    
    const diff = targetTime - malaysiaTime;
    
    if (diff <= 0) {
        // 时间到了
        timeReached = true;
        document.getElementById('countdownTime').textContent = '00:00:00';
        document.getElementById('countdownTime').style.color = '#4CAF50';
        updateSurpriseButton();
        
        // 如果已经完成3关且胜利弹窗正在显示，更新消息
        if (completedLevels >= 3 && document.getElementById('winModal').style.display === 'flex') {
            document.getElementById('winMessage').innerHTML = '❤️ <strong>老婆恭喜你，你已经赢了3关！<br/>现在可以去按下面的惊喜按钮了！</strong> 🎁✨';
        }
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
    } else {
        // 计算剩余时间
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('countdownTime').textContent = timeStr;
    }
}

// 更新关卡进度显示
function updateLevelProgress() {
    document.getElementById('levelProgress').textContent = `${completedLevels}/3`;
}

// 更新惊喜按钮状态
function updateSurpriseButton() {
    const btn = document.getElementById('surpriseBtn');
    const hint = document.getElementById('surpriseHint');
    
    const levelsComplete = completedLevels >= 3;
    const timeComplete = timeReached;
    
    if (levelsComplete && timeComplete) {
        // 两个条件都满足
        btn.classList.remove('disabled');
        btn.disabled = false;
        hint.textContent = '✨ 点击查看惊喜！✨';
        hint.style.color = '#FF69B4';
    } else {
        // 显示还需要满足什么条件
        const conditions = [];
        if (!levelsComplete) conditions.push('完成3关');
        if (!timeComplete) conditions.push('等待时间到');
        hint.textContent = `还需要: ${conditions.join(' 和 ')}`;
    }
}

// 跳转到惊喜页面
function goToSurprise() {
    if (completedLevels >= 3 && timeReached) {
        window.location.href = 'loading.html';
    }
}

// 关闭教程弹窗
function closeTutorial() {
    document.getElementById('tutorialModal').style.display = 'none';
    localStorage.setItem('hasSeenTutorial', 'true');
}

// 关闭胜利弹窗
function closeWinModal() {
    document.getElementById('winModal').style.display = 'none';
}
