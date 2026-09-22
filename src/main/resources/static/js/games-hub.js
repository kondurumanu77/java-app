(function () {
    function byId(id) { return document.getElementById(id); }
    function qsa(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
    function rand(max) { return Math.floor(Math.random() * max); }

    var gameModes = { ttt: "pvp", c4: "pvp", memory: "pvp", rps: "pvp", guess: "pvp" };

    var modal = byId("result-modal");
    var modalTitle = byId("result-title");
    var modalMsg = byId("result-message");
    byId("result-close").addEventListener("click", function () { modal.classList.remove("show"); });

    function showWin(message) {
        modalTitle.textContent = "Congratulations";
        modalMsg.textContent = message || "You have winned congratulations!";
        modal.classList.add("show");
    }

    function showLoss(message) {
        modalTitle.textContent = "Game Over";
        modalMsg.textContent = message || "Loss this time. Try again!";
        modal.classList.add("show");
    }

    function showInfo(message) {
        modalTitle.textContent = "Result";
        modalMsg.textContent = message;
        modal.classList.add("show");
    }

    qsa(".game-card").forEach(function (card) {
        card.addEventListener("click", function () {
            var target = card.getAttribute("data-target");
            qsa(".game-card").forEach(function (x) { x.classList.remove("active"); });
            qsa(".game-panel").forEach(function (x) { x.classList.remove("active"); });
            card.classList.add("active");
            byId(target).classList.add("active");
        });
    });

    qsa(".mode-switch").forEach(function (block) {
        var game = block.getAttribute("data-game");
        block.querySelectorAll(".mode-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                block.querySelectorAll(".mode-btn").forEach(function (x) { x.classList.remove("active"); });
                btn.classList.add("active");
                gameModes[game] = btn.getAttribute("data-mode");
                if (game === "ttt") tttReset();
                if (game === "c4") c4Reset();
                if (game === "memory") memoryReset();
                if (game === "rps") rpsReset();
                if (game === "guess") guessReset();
            });
        });
    });

    // Tic-Tac-Toe
    var tttState, tttTurn, tttOver;
    var tttLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    var tttStatus = byId("ttt-status");
    var tttCells = qsa(".ttt-cell");

    function tttCheckWinner() {
        for (var i = 0; i < tttLines.length; i++) {
            var l = tttLines[i];
            var a = l[0], b = l[1], c = l[2];
            if (tttState[a] && tttState[a] === tttState[b] && tttState[b] === tttState[c]) return l;
        }
        return null;
    }

    function tttAvailable() {
        var arr = [];
        for (var i = 0; i < tttState.length; i++) if (!tttState[i]) arr.push(i);
        return arr;
    }

    function tttCpuMove() {
        var choices = tttAvailable();
        if (!choices.length) return;
        tttPlayAt(choices[rand(choices.length)], true);
    }

    function tttPlayAt(idx, fromCpu) {
        if (tttOver || tttState[idx]) return;
        tttState[idx] = tttTurn;
        tttCells[idx].textContent = tttTurn;
        tttCells[idx].disabled = true;
        var win = tttCheckWinner();
        if (win) {
            tttOver = true;
            win.forEach(function (w) { tttCells[w].classList.add("win"); });
            if (gameModes.ttt === "cpu") {
                if (fromCpu) showLoss("Loss this time. Computer won Tic-Tac-Toe.");
                else showWin("You have winned congratulations! You beat the computer.");
            } else {
                showWin("Player " + tttTurn + " won. Congratulations!");
            }
            tttStatus.textContent = "Winner: " + tttTurn;
            return;
        }
        if (!tttAvailable().length) {
            tttOver = true;
            tttStatus.textContent = "Draw";
            showInfo("Draw game. Good fight!");
            return;
        }
        tttTurn = tttTurn === "X" ? "O" : "X";
        tttStatus.textContent = "Turn: " + tttTurn;
        if (gameModes.ttt === "cpu" && tttTurn === "O" && !tttOver) {
            window.setTimeout(tttCpuMove, 280);
        }
    }

    function tttReset() {
        tttState = ["", "", "", "", "", "", "", "", ""];
        tttTurn = "X";
        tttOver = false;
        tttStatus.textContent = gameModes.ttt === "cpu" ? "Turn: You (X)" : "Turn: X";
        tttCells.forEach(function (cell) {
            cell.textContent = "";
            cell.disabled = false;
            cell.classList.remove("win");
        });
    }

    tttCells.forEach(function (cell) {
        cell.addEventListener("click", function () {
            var idx = parseInt(cell.getAttribute("data-i"), 10);
            if (gameModes.ttt === "cpu" && tttTurn === "O") return;
            tttPlayAt(idx, false);
        });
    });
    byId("ttt-reset").addEventListener("click", tttReset);
    tttReset();

    // Connect Four
    var c4Rows = 6, c4Cols = 7, c4Grid, c4Turn, c4Over;
    var c4Status = byId("c4-status");
    var c4Board = byId("c4-board");
    var c4DropBtns = qsa(".c4-drop");

    function c4InitGrid() {
        c4Grid = [];
        for (var r = 0; r < c4Rows; r++) {
            var row = [];
            for (var c = 0; c < c4Cols; c++) row.push("");
            c4Grid.push(row);
        }
    }
    function c4InBounds(r, c) { return r >= 0 && r < c4Rows && c >= 0 && c < c4Cols; }
    function c4HasSpace() {
        for (var r = 0; r < c4Rows; r++) for (var c = 0; c < c4Cols; c++) if (!c4Grid[r][c]) return true;
        return false;
    }
    function c4ValidCols() {
        var cols = [];
        for (var c = 0; c < c4Cols; c++) if (!c4Grid[0][c]) cols.push(c);
        return cols;
    }
    function c4HasWinner(r, c, token) {
        var dirs = [[1,0],[0,1],[1,1],[1,-1]];
        for (var i = 0; i < dirs.length; i++) {
            var dr = dirs[i][0], dc = dirs[i][1], count = 1;
            var rr = r + dr, cc = c + dc;
            while (c4InBounds(rr, cc) && c4Grid[rr][cc] === token) { count++; rr += dr; cc += dc; }
            rr = r - dr; cc = c - dc;
            while (c4InBounds(rr, cc) && c4Grid[rr][cc] === token) { count++; rr -= dr; cc -= dc; }
            if (count >= 4) return true;
        }
        return false;
    }
    function c4Render() {
        c4Board.innerHTML = "";
        for (var r = 0; r < c4Rows; r++) {
            for (var c = 0; c < c4Cols; c++) {
                var dot = document.createElement("div");
                dot.className = "c4-slot";
                if (c4Grid[r][c] === "R") dot.classList.add("red");
                if (c4Grid[r][c] === "Y") dot.classList.add("yellow");
                c4Board.appendChild(dot);
            }
        }
    }
    function c4CpuMove() {
        var cols = c4ValidCols();
        if (!cols.length) return;
        c4Drop(cols[rand(cols.length)], true);
    }
    function c4Drop(col, fromCpu) {
        if (c4Over) return;
        for (var r = c4Rows - 1; r >= 0; r--) {
            if (!c4Grid[r][col]) {
                c4Grid[r][col] = c4Turn;
                c4Render();
                if (c4HasWinner(r, col, c4Turn)) {
                    c4Over = true;
                    c4Status.textContent = (c4Turn === "R" ? "Red" : "Yellow") + " wins";
                    if (gameModes.c4 === "cpu") {
                        if (fromCpu) showLoss("Loss this time. Computer won Connect Four.");
                        else showWin("You have winned congratulations! You won Connect Four.");
                    } else {
                        showWin((c4Turn === "R" ? "Player Red" : "Player Yellow") + " won. Congratulations!");
                    }
                    return;
                }
                if (!c4HasSpace()) {
                    c4Over = true;
                    c4Status.textContent = "Draw";
                    showInfo("Draw game. Try one more round.");
                    return;
                }
                c4Turn = c4Turn === "R" ? "Y" : "R";
                c4Status.textContent = "Turn: " + (c4Turn === "R" ? "Red" : "Yellow");
                if (gameModes.c4 === "cpu" && c4Turn === "Y" && !c4Over) window.setTimeout(c4CpuMove, 280);
                return;
            }
        }
    }
    function c4Reset() {
        c4InitGrid();
        c4Turn = "R";
        c4Over = false;
        c4Status.textContent = gameModes.c4 === "cpu" ? "Turn: You (Red)" : "Turn: Red";
        c4Render();
    }
    c4DropBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            if (gameModes.c4 === "cpu" && c4Turn === "Y") return;
            c4Drop(parseInt(btn.getAttribute("data-col"), 10), false);
        });
    });
    byId("c4-reset").addEventListener("click", c4Reset);
    c4Reset();

    // Memory Match
    var memoryIcons = ["A","A","B","B","C","C","D","D","E","E","F","F"];
    var memoryGrid = byId("memory-grid");
    var memoryStatus = byId("memory-status");
    var memoryDeck = [];
    var opened = [];
    var lockMemory = false;
    var memoryCpuActing = false;
    var memoryTurn = 1;
    var memoryScore = { 1: 0, 2: 0 };

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = rand(i + 1);
            var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    }
    function memoryUpdateStatus(text) {
        if (text) memoryStatus.textContent = text;
        else {
            var p2 = gameModes.memory === "cpu" ? "CPU" : "P2";
            memoryStatus.textContent = "Turn: " + (memoryTurn === 1 ? "P1" : p2) + " | P1: " + memoryScore[1] + " - " + p2 + ": " + memoryScore[2];
        }
    }
    function memoryAllSolved() { return qsa(".memory-card.solved").length === memoryIcons.length; }
    function memoryCpuPick() {
        if (gameModes.memory !== "cpu" || memoryTurn !== 2 || lockMemory) return;
        var openable = qsa(".memory-card").filter(function (c) { return !c.classList.contains("solved") && !c.classList.contains("open"); });
        if (openable.length < 2) return;
        lockMemory = true;
        memoryCpuActing = true;
        var first = openable[rand(openable.length)];
        var second = openable.filter(function (c) { return c !== first; })[rand(openable.length - 1)];
        window.setTimeout(function () {
            first.click();
            window.setTimeout(function () { second.click(); lockMemory = false; memoryCpuActing = false; }, 360);
        }, 280);
    }
    function memoryFinish() {
        var p2Name = gameModes.memory === "cpu" ? "Computer" : "Player 2";
        if (memoryScore[1] > memoryScore[2]) showWin("You have winned congratulations! P1 won Memory Match.");
        else if (memoryScore[1] < memoryScore[2]) {
            if (gameModes.memory === "cpu") showLoss("Loss this time. Computer won Memory Match.");
            else showWin("Player 2 won. Congratulations!");
        } else showInfo("Memory Match draw.");
    }
    function memoryReset() {
        memoryDeck = shuffle(memoryIcons);
        opened = [];
        memoryTurn = 1;
        memoryScore = { 1: 0, 2: 0 };
        lockMemory = false;
        memoryGrid.innerHTML = "";
        memoryDeck.forEach(function (icon, i) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "memory-card";
            btn.setAttribute("data-i", String(i));
            btn.setAttribute("data-icon", icon);
            btn.textContent = "?";
            btn.addEventListener("click", function () {
                if (lockMemory || btn.classList.contains("solved") || btn.classList.contains("open")) return;
                if (gameModes.memory === "cpu" && memoryTurn === 2 && !memoryCpuActing) return;
                btn.classList.add("open");
                btn.textContent = icon;
                opened.push(btn);
                if (opened.length === 2) {
                    lockMemory = true;
                    if (opened[0].getAttribute("data-icon") === opened[1].getAttribute("data-icon")) {
                        window.setTimeout(function () {
                            opened[0].classList.add("solved");
                            opened[1].classList.add("solved");
                            opened = [];
                            memoryScore[memoryTurn] += 1;
                            memoryUpdateStatus();
                            lockMemory = false;
                            if (memoryAllSolved()) memoryFinish();
                            if (gameModes.memory === "cpu" && memoryTurn === 2) memoryCpuPick();
                        }, 260);
                    } else {
                        window.setTimeout(function () {
                            opened[0].classList.remove("open");
                            opened[1].classList.remove("open");
                            opened[0].textContent = "?";
                            opened[1].textContent = "?";
                            opened = [];
                            memoryTurn = memoryTurn === 1 ? 2 : 1;
                            memoryUpdateStatus();
                            lockMemory = false;
                            memoryCpuPick();
                        }, 450);
                    }
                }
            });
            memoryGrid.appendChild(btn);
        });
        memoryUpdateStatus();
    }
    byId("memory-reset").addEventListener("click", memoryReset);
    memoryReset();

    // Rock Paper Scissors
    var rpsMoves = ["Rock", "Paper", "Scissors"];
    var rpsStatus = byId("rps-status");
    var rpsP1 = 0, rpsP2 = 0, rpsSel = null, rpsTurn = 1;

    function rpsWinner(a, b) {
        if (a === b) return 0;
        if ((a === "Rock" && b === "Scissors") || (a === "Paper" && b === "Rock") || (a === "Scissors" && b === "Paper")) return 1;
        return 2;
    }
    function rpsUpdateScore() {
        byId("rps-user").textContent = rpsP1;
        byId("rps-cpu").textContent = rpsP2;
    }
    function rpsRoundEnd(winner, p1, p2) {
        if (winner === 1) {
            rpsP1++;
            if (gameModes.rps === "cpu") showWin("You have winned congratulations! " + p1 + " beats " + p2 + ".");
            else showWin("Player 1 won this round. Congratulations!");
            rpsStatus.textContent = "P1 won: " + p1 + " beats " + p2;
        } else if (winner === 2) {
            rpsP2++;
            if (gameModes.rps === "cpu") showLoss("Loss this time. Computer chose " + p2 + ".");
            else showWin("Player 2 won this round. Congratulations!");
            rpsStatus.textContent = "P2 won: " + p2 + " beats " + p1;
        } else {
            showInfo("Draw round. Both picked " + p1 + ".");
            rpsStatus.textContent = "Draw: both chose " + p1;
        }
        rpsUpdateScore();
        rpsTurn = 1;
        rpsSel = null;
    }
    function rpsReset() {
        rpsP1 = 0; rpsP2 = 0; rpsTurn = 1; rpsSel = null;
        rpsStatus.textContent = gameModes.rps === "cpu" ? "Choose your move." : "Player 1 choose move.";
        rpsUpdateScore();
    }
    qsa(".rps-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var move = btn.getAttribute("data-move");
            if (gameModes.rps === "cpu") {
                var cpu = rpsMoves[rand(3)];
                rpsRoundEnd(rpsWinner(move, cpu), move, cpu);
                return;
            }
            if (rpsTurn === 1) {
                rpsSel = move;
                rpsTurn = 2;
                rpsStatus.textContent = "Player 2 choose move.";
            } else {
                rpsRoundEnd(rpsWinner(rpsSel, move), rpsSel, move);
            }
        });
    });
    rpsReset();

    // Number Guess
    var guessSecret, guessStatus = byId("guess-status"), guessInput = byId("guess-input"), guessAttempts;
    var guessTurn = 1, cpuLow = 1, cpuHigh = 100;
    function guessReset() {
        guessSecret = rand(100) + 1;
        guessAttempts = 0;
        guessTurn = 1;
        cpuLow = 1; cpuHigh = 100;
        byId("guess-attempts").textContent = "0";
        guessInput.value = "";
        guessStatus.textContent = gameModes.guess === "cpu" ? "Your turn. Guess 1 to 100" : "Player 1 turn. Guess 1 to 100";
    }
    function guessCpuTry() {
        if (gameModes.guess !== "cpu") return;
        var cpuGuess = Math.floor((cpuLow + cpuHigh) / 2);
        guessAttempts++;
        byId("guess-attempts").textContent = String(guessAttempts);
        if (cpuGuess === guessSecret) {
            guessStatus.textContent = "CPU guessed " + cpuGuess + " and won.";
            showLoss("Loss this time. Computer guessed the number.");
            return true;
        }
        if (cpuGuess < guessSecret) cpuLow = cpuGuess + 1;
        else cpuHigh = cpuGuess - 1;
        guessStatus.textContent = "CPU guessed " + cpuGuess + ". Your turn.";
        return false;
    }
    byId("guess-submit").addEventListener("click", function () {
        var val = parseInt(guessInput.value, 10);
        if (isNaN(val) || val < 1 || val > 100) {
            guessStatus.textContent = "Enter a valid number from 1 to 100";
            return;
        }
        guessAttempts++;
        byId("guess-attempts").textContent = String(guessAttempts);
        if (val === guessSecret) {
            if (gameModes.guess === "cpu") showWin("You have winned congratulations! You found the number.");
            else showWin("Player " + guessTurn + " won. Congratulations!");
            guessStatus.textContent = "Correct! Number was " + guessSecret;
            return;
        }
        if (val < guessSecret) guessStatus.textContent = "Too low.";
        else guessStatus.textContent = "Too high.";

        if (gameModes.guess === "pvp") {
            guessTurn = guessTurn === 1 ? 2 : 1;
            guessStatus.textContent += " Player " + guessTurn + " turn.";
        } else {
            window.setTimeout(guessCpuTry, 320);
        }
    });
    byId("guess-reset").addEventListener("click", guessReset);
    guessReset();
})();
