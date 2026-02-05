// 创建星星
function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        starsContainer.appendChild(star);
    }

    // 流星
    for (let i = 0; i < 3; i++) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        shootingStar.style.left = (Math.random() * 50 + 50) + '%';
        shootingStar.style.top = Math.random() * 30 + '%';
        shootingStar.style.animationDelay = (Math.random() * 10 + i * 5) + 's';
        starsContainer.appendChild(shootingStar);
    }
}

// 创建萤火虫
function createFireflies() {
    for (let i = 0; i < 15; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        firefly.style.left = Math.random() * 100 + '%';
        firefly.style.top = Math.random() * 100 + '%';
        firefly.style.animationDelay = Math.random() * 10 + 's';
        firefly.style.animationDuration = (8 + Math.random() * 6) + 's';
        document.body.appendChild(firefly);
    }
}

// 创建漂浮爱心
function createFloatingHearts() {
    const heartsContainer = document.getElementById('hearts');
    const hearts = ['💕', '💖', '💗', '💝', '💘', '❤️', '🌹', '✨', '💫'];
    
    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = Math.random() * 20 + 15 + 'px';
        heart.style.animationDuration = Math.random() * 4 + 6 + 's';
        heartsContainer.appendChild(heart);
        
        setTimeout(() => heart.remove(), 10000);
    }, 800);
}

// 烟花效果
function createFirework(x, y) {
    const colors = ['#ff6b9d', '#ff9ecf', '#ffb6c1', '#ffd1dc', '#fff', '#ffc0cb'];
    for (let i = 0; i < 40; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = (Math.PI * 2 / 40) * i;
        const velocity = 80 + Math.random() * 120;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        document.body.appendChild(firework);
        
        let posX = x;
        let posY = y;
        let opacity = 1;
        
        const animate = () => {
            posX += vx * 0.016;
            posY += vy * 0.016;
            opacity -= 0.015;
            
            firework.style.left = posX + 'px';
            firework.style.top = posY + 'px';
            firework.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                firework.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// 彩带效果
function createConfetti() {
    const colors = ['#ff6b9d', '#ff9ecf', '#ffb6c1', '#ffd700', '#fff', '#87ceeb'];
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

// ==================== 拼图游戏 ====================
let selectedPiece = null;
let draggedPiece = null;
let dragSourceCell = null; // 记录拖拽来源格子
let placedPieces = { 1: {}, 2: {} };
let puzzleCompleted = false; // 拼图是否已完成
const GRID_SIZE = 3;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE * 2;
const STORAGE_KEY = 'puzzle_progress';
const STORAGE_COMPLETED_KEY = 'puzzle_completed';

// 保存进度到 localStorage
function saveProgress() {
    const data = {
        placedPieces: placedPieces,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 保存完成状态
function saveCompleted() {
    localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
}

// 加载进度
function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// 检查是否已完成
function isCompleted() {
    return localStorage.getItem(STORAGE_COMPLETED_KEY) === 'true';
}

// 清除进度
function clearProgress() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_COMPLETED_KEY);
}

function initPuzzle() {
    const board1 = document.getElementById('board1');
    const board2 = document.getElementById('board2');
    const pool = document.getElementById('piecesPool');

    // 创建棋盘格子
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell1 = createCell(1, i);
        const cell2 = createCell(2, i);
        board1.appendChild(cell1);
        board2.appendChild(cell2);
    }

    // 检查是否已经完成
    if (isCompleted()) {
        restoreCompletedState();
        return;
    }

    // 检查是否有保存的进度
    const savedData = loadProgress();
    if (savedData && savedData.placedPieces) {
        restoreFromSave(savedData.placedPieces);
    } else {
        // 创建新的拼图块并打乱
        const pieces = [];
        for (let photo = 1; photo <= 2; photo++) {
            for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
                pieces.push(createPiece(photo, i));
            }
        }
        shuffleArray(pieces);
        pieces.forEach(piece => pool.appendChild(piece));
    }

    // 设置拼图池为拖拽目标（用于撤销）
    setupPoolDrop();
}

// 从保存恢复进度
function restoreFromSave(savedPlacedPieces) {
    const pool = document.getElementById('piecesPool');
    placedPieces = { 1: {}, 2: {} };

    // 记录哪些拼图块已经放置
    const placedPieceKeys = new Set();
    
    // 恢复已放置的拼图块
    for (let boardNum = 1; boardNum <= 2; boardNum++) {
        const boardData = savedPlacedPieces[boardNum] || {};
        for (const cellIndex in boardData) {
            const pieceIndex = boardData[cellIndex];
            const cell = document.querySelector(`#board${boardNum} .puzzle-cell[data-index="${cellIndex}"]`);
            
            if (cell) {
                const placedPiece = createPlacedPiece(boardNum, pieceIndex, cell);
                cell.appendChild(placedPiece);
                cell.classList.add('occupied');
                
                if (parseInt(pieceIndex) === parseInt(cellIndex)) {
                    cell.classList.add('correct');
                }
                
                placedPieces[boardNum][cellIndex] = pieceIndex;
                placedPieceKeys.add(`${boardNum}-${pieceIndex}`);
            }
        }
    }

    // 创建未放置的拼图块到池子
    const remainingPieces = [];
    for (let photo = 1; photo <= 2; photo++) {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            if (!placedPieceKeys.has(`${photo}-${i}`)) {
                remainingPieces.push(createPiece(photo, i));
            }
        }
    }
    shuffleArray(remainingPieces);
    remainingPieces.forEach(piece => pool.appendChild(piece));

    // 设置拖拽目标
    setupPoolDrop();
    
    // 更新进度显示
    updateProgress();
}

// 恢复完成状态
function restoreCompletedState() {
    puzzleCompleted = true;
    
    // 恢复所有拼图块到正确位置
    for (let boardNum = 1; boardNum <= 2; boardNum++) {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.querySelector(`#board${boardNum} .puzzle-cell[data-index="${i}"]`);
            if (cell) {
                const placedPiece = createPlacedPiece(boardNum, i, cell);
                cell.appendChild(placedPiece);
                cell.classList.add('occupied', 'correct');
                placedPieces[boardNum][i] = i;
            }
        }
    }

    // 显示完成界面
    document.getElementById('puzzleComplete').style.display = 'block';
    document.getElementById('piecesPool').style.display = 'none';
    document.getElementById('shuffleBtn').style.display = 'none';
    
    // 禁用拼图操作
    disablePuzzle();
    
    // 更新进度显示
    updateProgress();
    
    setupPoolDrop();
}

// 重新开始拼图
function restartPuzzle() {
    // 清除保存
    clearProgress();
    puzzleCompleted = false;
    photo1WasComplete = false;
    photo2WasComplete = false;
    
    // 清空棋盘
    const board1 = document.getElementById('board1');
    const board2 = document.getElementById('board2');
    const pool = document.getElementById('piecesPool');
    
    board1.innerHTML = '';
    board2.innerHTML = '';
    pool.innerHTML = '';
    
    // 重置状态
    placedPieces = { 1: {}, 2: {} };
    selectedPiece = null;
    draggedPiece = null;
    dragSourceCell = null;
    
    // 隐藏完成界面
    document.getElementById('puzzleComplete').style.display = 'none';
    document.getElementById('piecesPool').style.display = 'flex';
    document.getElementById('shuffleBtn').style.display = 'inline-block';
    
    // 启用拼图
    enablePuzzle();
    
    // 重新初始化
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell1 = createCell(1, i);
        const cell2 = createCell(2, i);
        board1.appendChild(cell1);
        board2.appendChild(cell2);
    }
    
    const pieces = [];
    for (let photo = 1; photo <= 2; photo++) {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            pieces.push(createPiece(photo, i));
        }
    }
    shuffleArray(pieces);
    pieces.forEach(piece => pool.appendChild(piece));
    
    setupPoolDrop();
    updateProgress();
}

// 禁用拼图操作
function disablePuzzle() {
    document.querySelectorAll('.puzzle-board').forEach(board => {
        board.classList.add('puzzle-disabled');
    });
}

// 启用拼图操作
function enablePuzzle() {
    document.querySelectorAll('.puzzle-board').forEach(board => {
        board.classList.remove('puzzle-disabled');
    });
}

function createCell(boardNum, index) {
    const cell = document.createElement('div');
    cell.className = 'puzzle-cell';
    cell.dataset.board = boardNum;
    cell.dataset.index = index;
    
    // 点击放置
    cell.addEventListener('click', (e) => {
        // 如果点击的是已放置的拼图块，撤销它
        if (cell.classList.contains('occupied')) {
            const placedPiece = cell.querySelector('.puzzle-piece');
            if (placedPiece) {
                removePieceFromCell(cell, boardNum, index);
            }
            return;
        }
        
        // 如果有选中的拼图块，放置它
        if (selectedPiece && !cell.classList.contains('occupied')) {
            const pieceBoard = parseInt(selectedPiece.dataset.photo);
            
            if (pieceBoard === boardNum) {
                placePiece(cell, selectedPiece, boardNum, index);
            } else {
                showWrongBoardHint(cell);
            }
        }
    });

    // 拖拽进入
    cell.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedPiece) {
            const pieceBoard = parseInt(draggedPiece.dataset.photo);
            if (pieceBoard === boardNum && cell !== dragSourceCell) {
                cell.classList.add('highlight');
            }
        }
    });

    cell.addEventListener('dragleave', () => {
        cell.classList.remove('highlight');
    });

    // 拖拽放下
    cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('highlight');
        
        if (draggedPiece && cell !== dragSourceCell) {
            const pieceBoard = parseInt(draggedPiece.dataset.photo);
            
            if (pieceBoard === boardNum) {
                // 如果目标格子已有拼图，交换位置
                if (cell.classList.contains('occupied')) {
                    swapPieces(dragSourceCell, cell, boardNum);
                } else {
                    // 如果是从格子拖来的，先清理源格子
                    if (dragSourceCell) {
                        const sourceBoardNum = parseInt(dragSourceCell.dataset.board);
                        const sourceIndex = parseInt(dragSourceCell.dataset.index);
                        clearCell(dragSourceCell, sourceBoardNum, sourceIndex);
                    }
                    placePiece(cell, draggedPiece, boardNum, index);
                }
            } else {
                showWrongBoardHint(cell);
            }
        }
        draggedPiece = null;
        dragSourceCell = null;
    });

    // 鼠标悬停高亮
    cell.addEventListener('mouseenter', () => {
        if (selectedPiece && !cell.classList.contains('occupied')) {
            const pieceBoard = parseInt(selectedPiece.dataset.photo);
            if (pieceBoard === boardNum) {
                cell.classList.add('highlight');
            }
        }
    });

    cell.addEventListener('mouseleave', () => {
        cell.classList.remove('highlight');
    });

    return cell;
}

function showWrongBoardHint(cell) {
    cell.style.borderColor = '#ff4444';
    cell.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.5)';
    setTimeout(() => {
        cell.style.borderColor = '';
        cell.style.boxShadow = '';
    }, 500);
}

function createPiece(photoNum, index, isInPool = true) {
    const piece = document.createElement('div');
    piece.className = `puzzle-piece piece-photo${photoNum}`;
    piece.dataset.photo = photoNum;
    piece.dataset.index = index;
    piece.draggable = true;
    
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    
    piece.style.backgroundImage = `url('media/puzzle/${photoNum}.jpg')`;
    piece.style.backgroundPosition = `${-col * 76}px ${-row * 76}px`;
    
    // 点击选中
    piece.addEventListener('click', (e) => {
        if (piece.classList.contains('placed')) {
            e.stopPropagation();
            return;
        }
        
        document.querySelectorAll('.puzzle-piece.selected').forEach(p => {
            p.classList.remove('selected');
        });
        
        piece.classList.add('selected');
        selectedPiece = piece;
    });

    // 拖拽开始
    piece.addEventListener('dragstart', (e) => {
        if (piece.classList.contains('placed')) {
            e.preventDefault();
            return;
        }
        draggedPiece = piece;
        piece.classList.add('selected');
        selectedPiece = piece;
        e.dataTransfer.effectAllowed = 'move';
        
        setTimeout(() => {
            piece.style.opacity = '0.5';
        }, 0);
    });

    // 拖拽结束
    piece.addEventListener('dragend', () => {
        piece.style.opacity = '1';
        if (!piece.classList.contains('placed')) {
            piece.classList.remove('selected');
        }
        draggedPiece = null;
    });

    return piece;
}

function setupPoolDrop() {
    const pool = document.getElementById('piecesPool');
    
    pool.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedPiece && dragSourceCell) {
            pool.style.borderColor = 'rgba(255, 107, 157, 0.8)';
            pool.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.4)';
        }
    });
    
    pool.addEventListener('dragleave', () => {
        pool.style.borderColor = '';
        pool.style.boxShadow = '';
    });
    
    pool.addEventListener('drop', (e) => {
        e.preventDefault();
        pool.style.borderColor = '';
        pool.style.boxShadow = '';
        
        // 从格子拖回池子
        if (draggedPiece && dragSourceCell) {
            const boardNum = parseInt(dragSourceCell.dataset.board);
            const cellIndex = parseInt(dragSourceCell.dataset.index);
            removePieceFromCell(dragSourceCell, boardNum, cellIndex);
        }
        draggedPiece = null;
        dragSourceCell = null;
    });
}

function clearCell(cell, boardNum, cellIndex) {
    const placedPiece = cell.querySelector('.puzzle-piece');
    if (placedPiece) {
        placedPiece.remove();
    }
    cell.classList.remove('occupied', 'correct');
    delete placedPieces[boardNum][cellIndex];
}

function swapPieces(sourceCell, targetCell, boardNum) {
    if (!sourceCell || !targetCell) return;
    
    const sourcePiece = sourceCell.querySelector('.puzzle-piece');
    const targetPiece = targetCell.querySelector('.puzzle-piece');
    
    if (!sourcePiece || !targetPiece) return;
    
    // 获取两个拼图的信息
    const sourcePhotoNum = parseInt(sourcePiece.dataset.photo);
    const sourcePieceIndex = parseInt(sourcePiece.dataset.index);
    const targetPhotoNum = parseInt(targetPiece.dataset.photo);
    const targetPieceIndex = parseInt(targetPiece.dataset.index);
    
    const sourceIndex = parseInt(sourceCell.dataset.index);
    const targetIndex = parseInt(targetCell.dataset.index);
    
    // 只允许同一张照片的拼图交换
    if (sourcePhotoNum !== targetPhotoNum) {
        showWrongBoardHint(targetCell);
        return;
    }
    
    // 清理两个格子
    sourcePiece.remove();
    targetPiece.remove();
    sourceCell.classList.remove('occupied', 'correct');
    targetCell.classList.remove('occupied', 'correct');
    
    // 创建新的拼图块并放置
    const newSourcePiece = createPlacedPiece(targetPhotoNum, targetPieceIndex, sourceCell);
    const newTargetPiece = createPlacedPiece(sourcePhotoNum, sourcePieceIndex, targetCell);
    
    sourceCell.appendChild(newSourcePiece);
    targetCell.appendChild(newTargetPiece);
    sourceCell.classList.add('occupied');
    targetCell.classList.add('occupied');
    
    // 检查是否正确
    if (targetPieceIndex === sourceIndex) {
        sourceCell.classList.add('correct');
        createMiniCelebration(sourceCell);
    }
    if (sourcePieceIndex === targetIndex) {
        targetCell.classList.add('correct');
        createMiniCelebration(targetCell);
    }
    
    // 更新记录
    placedPieces[boardNum][sourceIndex] = targetPieceIndex;
    placedPieces[boardNum][targetIndex] = sourcePieceIndex;
    
    // 保存进度
    saveProgress();
    
    selectedPiece = null;
    draggedPiece = null;
    dragSourceCell = null;
    
    document.querySelectorAll('.puzzle-piece.selected').forEach(p => {
        p.classList.remove('selected');
    });
    
    checkCompletion();
}

function createPlacedPiece(photoNum, pieceIndex, cell) {
    const placedPiece = document.createElement('div');
    placedPiece.className = `puzzle-piece piece-photo${photoNum} placed`;
    placedPiece.dataset.photo = photoNum;
    placedPiece.dataset.index = pieceIndex;
    placedPiece.draggable = true;
    placedPiece.style.width = '100%';
    placedPiece.style.height = '100%';
    placedPiece.style.margin = '0';
    placedPiece.style.cursor = 'grab';
    
    const cellSize = cell.offsetWidth;
    const row = Math.floor(pieceIndex / GRID_SIZE);
    const col = pieceIndex % GRID_SIZE;
    placedPiece.style.backgroundImage = `url('media/puzzle/${photoNum}.jpg')`;
    placedPiece.style.backgroundSize = `${cellSize * GRID_SIZE}px ${cellSize * GRID_SIZE}px`;
    placedPiece.style.backgroundPosition = `${-col * cellSize}px ${-row * cellSize}px`;
    placedPiece.title = '拖拽移动 | 点击撤销';
    
    // 添加拖拽事件
    placedPiece.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        draggedPiece = placedPiece;
        dragSourceCell = cell;
        placedPiece.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
    });
    
    placedPiece.addEventListener('dragend', () => {
        placedPiece.style.opacity = '1';
        draggedPiece = null;
        dragSourceCell = null;
    });
    
    return placedPiece;
}

function removePieceFromCell(cell, boardNum, cellIndex) {
    const placedPiece = cell.querySelector('.puzzle-piece');
    if (!placedPiece) return;
    
    const photoNum = parseInt(placedPiece.dataset.photo);
    const pieceIndex = parseInt(placedPiece.dataset.index);
    
    // 创建新的拼图块放回池子
    const newPiece = createPiece(photoNum, pieceIndex, true);
    document.getElementById('piecesPool').appendChild(newPiece);
    
    // 清理格子
    placedPiece.remove();
    cell.classList.remove('occupied', 'correct');
    
    // 更新记录
    delete placedPieces[boardNum][cellIndex];
    
    // 清除选中状态
    selectedPiece = null;
    document.querySelectorAll('.puzzle-piece.selected').forEach(p => {
        p.classList.remove('selected');
    });
    
    // 更新进度
    updateProgress();
    
    // 保存进度
    saveProgress();
    
    // 隐藏完成提示（如果之前显示了）
    document.getElementById('puzzleComplete').style.display = 'none';
}

function placePiece(cell, piece, boardNum, cellIndex) {
    const pieceIndex = parseInt(piece.dataset.index);
    const photoNum = parseInt(piece.dataset.photo);
    const isCorrect = pieceIndex === cellIndex;
    
    // 创建放置在格子中的拼图块（使用公共函数）
    const placedPiece = createPlacedPiece(photoNum, pieceIndex, cell);
    
    cell.appendChild(placedPiece);
    cell.classList.add('occupied');
    
    if (isCorrect) {
        cell.classList.add('correct');
        createMiniCelebration(cell);
    }
    
    // 移除池中的原拼图块
    piece.remove();
    selectedPiece = null;
    draggedPiece = null;
    dragSourceCell = null;
    
    // 清除所有选中状态
    document.querySelectorAll('.puzzle-piece.selected').forEach(p => {
        p.classList.remove('selected');
    });
    
    // 记录放置
    placedPieces[boardNum][cellIndex] = pieceIndex;
    
    // 保存进度
    saveProgress();
    
    updateProgress();
    checkCompletion();
}

function createMiniCelebration(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 6px;
            height: 6px;
            background: #ff6b9d;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(spark);
        
        const angle = (Math.PI * 2 / 8) * i;
        let posX = x, posY = y, opacity = 1;
        
        const animate = () => {
            posX += Math.cos(angle) * 3;
            posY += Math.sin(angle) * 3;
            opacity -= 0.05;
            spark.style.left = posX + 'px';
            spark.style.top = posY + 'px';
            spark.style.opacity = opacity;
            
            if (opacity > 0) requestAnimationFrame(animate);
            else spark.remove();
        };
        requestAnimationFrame(animate);
    }
}

function updateProgress() {
    const total = Object.keys(placedPieces[1]).length + Object.keys(placedPieces[2]).length;
    const percent = (total / TOTAL_PIECES) * 100;
    
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressText').textContent = total;
    
    // 更新每张照片的状态
    updatePhotoStatus();
}

// 记录之前的完成状态（用于检测新完成）
let photo1WasComplete = false;
let photo2WasComplete = false;

function updatePhotoStatus() {
    // 检查照片1的正确放置数量
    let correct1 = 0;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        if (placedPieces[1][i] === i) {
            correct1++;
        }
    }
    
    // 检查照片2的正确放置数量
    let correct2 = 0;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        if (placedPieces[2][i] === i) {
            correct2++;
        }
    }
    
    const totalPieces = GRID_SIZE * GRID_SIZE;
    const status1 = document.getElementById('status1');
    const status2 = document.getElementById('status2');
    
    // 更新显示
    status1.querySelector('.status-count').textContent = `${correct1}/${totalPieces}`;
    status2.querySelector('.status-count').textContent = `${correct2}/${totalPieces}`;
    
    // 检查是否完成
    const photo1Complete = correct1 === totalPieces;
    const photo2Complete = correct2 === totalPieces;
    
    // 照片1完成状态
    if (photo1Complete) {
        status1.classList.add('complete');
        if (!photo1WasComplete) {
            // 刚刚完成，庆祝！
            celebratePhotoComplete(1);
            photo1WasComplete = true;
        }
    } else {
        status1.classList.remove('complete');
        photo1WasComplete = false;
    }
    
    // 照片2完成状态
    if (photo2Complete) {
        status2.classList.add('complete');
        if (!photo2WasComplete) {
            // 刚刚完成，庆祝！
            celebratePhotoComplete(2);
            photo2WasComplete = true;
        }
    } else {
        status2.classList.remove('complete');
        photo2WasComplete = false;
    }
}

function celebratePhotoComplete(photoNum) {
    // 在对应的棋盘上放烟花
    const board = document.getElementById('board' + photoNum);
    const rect = board.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    createFirework(x, y);
    
    // 播放小彩带
    const colors = ['#ff6b9d', '#ff9ecf', '#ffb6c1', '#ffd700'];
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = (rect.left + Math.random() * rect.width) + 'px';
            confetti.style.top = rect.top + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (1.5 + Math.random()) + 's';
            confetti.style.position = 'fixed';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 50);
    }
}

function checkCompletion() {
    let allCorrect = true;
    
    // 检查所有格子是否都正确放置
    for (let board = 1; board <= 2; board++) {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            if (placedPieces[board][i] !== i) {
                allCorrect = false;
                break;
            }
        }
        if (!allCorrect) break;
    }
    
    if (allCorrect) {
        // 两张照片都完成！
        puzzleCompleted = true;
        
        // 保存完成状态
        saveCompleted();
        saveProgress();
        
        // 禁用拼图操作
        disablePuzzle();
        
        createConfetti();
        
        // 大庆祝：多次烟花
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                createFirework(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight * 0.5
                );
            }, i * 400);
        }
        
        // 延迟一下再显示问卷，让用户先看到烟花和庆祝
        setTimeout(() => {
            showQuestion1();
        }, 1000);
    } else {
        // 如果撤销后不再完成，隐藏完成提示
        document.getElementById('puzzleComplete').style.display = 'none';
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function shufflePieces() {
    const pool = document.getElementById('piecesPool');
    const pieces = Array.from(pool.children);
    shuffleArray(pieces);
    pool.innerHTML = '';
    pieces.forEach(p => pool.appendChild(p));
}

// ==================== 倒计时 ====================
let timeReached = false; // 追踪时间是否已到达

function updateCountdown() {
    // 目标时间: 2026年2月5日 22:00:00 马来西亚时间 (UTC+8)
    const targetUTC = new Date('2026-02-05T14:00:00Z').getTime(); // 22:00 MYT = 14:00 UTC
    const nowUTC = Date.now();
    const diff = targetUTC - nowUTC;

    if (diff <= 0) {
        if (!timeReached) {
            timeReached = true;
            // 如果消息框已经打开，更新按钮状态
            if (document.getElementById('messageModal').classList.contains('show')) {
                updateGoSurpriseButton();
            }
        }
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

function showSurprise() {
    // 隐藏倒计时并跳转到加载页面
    document.getElementById('countdownSection').style.display = 'none';
    window.location.href = 'loading.html';
}

// 初始化
createStars();
createFireflies();
createFloatingHearts();
initPuzzle();
updateCountdown();
setInterval(updateCountdown, 1000);

// ==================== 问卷调查系统 ====================

// 第一个问题：想不想看看我想对你说的话
function showQuestion1() {
    const modal = document.getElementById('questionnaireModal');
    const content = document.getElementById('questionContent');
    
    content.innerHTML = `
        <h2>💕 一个问题 💕</h2>
        <p>想不想看看我想对你说的话？</p>
        <div class="question-buttons">
            <button class="question-btn yes" onclick="answerQuestion1('yes')">是 💕</button>
            <button class="question-btn no" onclick="answerQuestion1('no')">否 💔</button>
        </div>
    `;
    
    modal.classList.add('show');
}

// 处理第一个问题的答案
function answerQuestion1(answer) {
    if (answer === 'yes') {
        // 进入第二个问题
        document.getElementById('questionnaireModal').classList.remove('show');
        setTimeout(() => {
            showQuestion2();
        }, 300);
    } else {
        // 显示拒绝界面
        document.getElementById('questionnaireModal').classList.remove('show');
        setTimeout(() => {
            document.getElementById('rejectionModal').classList.add('show');
        }, 300);
    }
}

// 关闭消息后继续答题
function closeMessageAndContinue() {
    document.getElementById('messageModal').classList.remove('show');
    setTimeout(() => {
        showQuestion2();
    }, 300);
}

// 第二个问题：你知道我们是什么时候在一起的吗
function showQuestion2() {
    const modal = document.getElementById('questionnaireModal');
    const content = document.getElementById('questionContent');
    
    content.innerHTML = `
        <h2>💕 第二个问题 💕</h2>
        <p>你知道我们是什么时候在一起的吗？</p>
        <p style="font-size: 0.9rem; opacity: 0.7;">（请输入日期，格式：YYYY年M月D日）</p>
        <input type="text" class="answer-input" id="answerInput2" placeholder="例如: 2023年4月9日" />
        <button class="submit-answer-btn" onclick="checkQuestion2Answer()">提交答案</button>
    `;
    
    modal.classList.add('show');
    
    // 让输入框自动获得焦点
    setTimeout(() => {
        document.getElementById('answerInput2').focus();
    }, 100);
}

// 检查第二个问题的答案 - 答对才能看消息
function checkQuestion2Answer() {
    const input = document.getElementById('answerInput2').value.trim();
    const correctAnswers = ['2023年4月9日', '2023年4月9', '4月9日', '2023/4/9', '2023-4-9'];
    
    // 规范化输入
    const normalized = input.toLowerCase().replace(/\s+/g, '');
    const isCorrect = correctAnswers.some(ans => ans.toLowerCase().replace(/\s+/g, '') === normalized);
    
    if (input === '') {
        alert('请输入答案呦 💕');
        return;
    }
    
    if (isCorrect) {
        // 答对了！显示"我想对你说的话"消息框
        document.getElementById('questionnaireModal').classList.remove('show');
        setTimeout(() => {
            showMessageAfterCorrectAnswer();
        }, 300);
    } else {
        alert('不对哦，再想想 💭');
    }
}

// 显示"我想对你说的话"消息框，并检查时间状态
function showMessageAfterCorrectAnswer() {
    document.getElementById('messageModal').classList.add('show');
    updateGoSurpriseButton();
}

// 更新"转到惊喜页面"按钮的状态
function updateGoSurpriseButton() {
    const btn = document.getElementById('goSurpriseBtn');
    const warning = document.getElementById('timeWarning');
    
    if (timeReached) {
        btn.disabled = false;
        warning.textContent = '✅ 时间已到，你可以继续了！';
    } else {
        btn.disabled = true;
        warning.textContent = '⏳ 请等待时间到达...';
    }
}

// 转到惊喜页面 - 需要时间到 + 拼图完成
function goToSurprise() {
    if (!timeReached) {
        alert('时间还没有到呢，再等等吧 💕');
        return;
    }
    
    if (!puzzleCompleted) {
        alert('拼图还没有完成呢 🧩');
        return;
    }
    
    // 两个条件都满足了
    document.getElementById('messageModal').classList.remove('show');
    setTimeout(() => {
        // 隐藏倒计时区域，跳转到加载页面
        document.getElementById('countdownSection').style.display = 'none';
        window.location.href = 'loading.html';
    }, 300);
}

// 第三个问题：你想打屁屁吗
function showQuestion3() {
    const modal = document.getElementById('questionnaireModal');
    const content = document.getElementById('questionContent');
    
    content.innerHTML = `
        <h2>💕 第三个问题 💕</h2>
        <p>你想打屁屁吗？</p>
        <div class="question-buttons">
            <button class="question-btn yes" onclick="answerQuestion3('yes')">想 💋</button>
            <button class="question-btn no" onclick="answerQuestion3('no')">不想 😊</button>
        </div>
    `;
    
    modal.classList.add('show');
}

// 处理第三个问题的答案
function answerQuestion3(answer) {
    document.getElementById('questionnaireModal').classList.remove('show');
    
    if (answer === 'yes') {
        // 显示打屁屁内容
        setTimeout(() => {
            document.getElementById('spankinModal').classList.add('show');
        }, 300);
    } else {
        // 显示拒绝界面（和第一个问题不想的结局一样）
        setTimeout(() => {
            document.getElementById('rejectionModal').classList.add('show');
        }, 300);
    }
}

// 打屁屁后继续
function continueAfterSpanking() {
    document.getElementById('spankinModal').classList.remove('show');
    setTimeout(() => {
        showFinalMessage();
    }, 300);
}

// 重新开始问卷
function restartQuestionnaire() {
    document.getElementById('rejectionModal').classList.remove('show');
    setTimeout(() => {
        showQuestion1();
    }, 300);
}

// 最终消息（所有问题都答完了）
function showFinalMessage() {
    const modal = document.getElementById('messageModal');
    const container = modal.querySelector('.message-container');
    
    container.innerHTML = `
        <h2>💕 永远爱你 💕</h2>
        <div class="love-message">
            <p>谢谢你完成了拼图，也谢谢你回答了我的问题。无论怎样，我都深深地爱着你。希望我们能一起走到最后，一起经历更多美好的时光。</p>
            <p style="margin-top: 20px;">我爱你，老婆 💕</p>
        </div>
        <button class="help-btn" onclick="finishQuestionnaire()">完成</button>
    `;
    
    modal.classList.add('show');
}

// 完成问卷，跳转到惊喜页面
function finishQuestionnaire() {
    document.getElementById('messageModal').classList.remove('show');
    setTimeout(() => {
        // 隐藏拼图区域
        document.getElementById('countdownSection').style.display = 'none';
        window.location.href = 'loading.html';
    }, 300);
}
