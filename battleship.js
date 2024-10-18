
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomCoord() {
    const x = randomIntFromInterval(0, 9);
    const y = randomIntFromInterval(0, 9);

    return [x, y];
}

class Ship{
    constructor(length, name, coordinates, marker){
        this.length = length;
        this.timesHit = 0;
        this.sunk = false;
        this.name = name;
        this.coordinates = coordinates;
        this.marker = marker;
    }

    hit = () => {
        this.timesHit++;
        this.sunk = this.timesHit >= this.length ? true : false;
    }

    isSunk = () => {
        return this.sunk;
    }

    getLabel = () => {
        return this.name;
    }

    parseCoord = (coordList) => {
        return coordList.map((coor) => {
            if(typeof coor[0] === "number"){
                return coor;
            }else{
                const x = parseInt(coor.getAttribute("data-coordinates")[0]);
                const y = parseInt(coor.getAttribute("data-coordinates")[2]);
                return [x,y];
            }
        })
    }

    getCoord = () => {
        return this.parseCoord(this.coordinates);
    }

    getMarker = () => {
        return this.marker;
    }

}

class Player{
    constructor(type, board){
        this.playerType = type;
        this.board = board;
    }

    getBoard = () => {
        return this.board;
    }
}

class GameBoard{
    constructor(ships){
        this.board = Array.from({ length: 10 }, e => Array.from({ length: 10 }, e => 0));
        this.ships = ships;
        this.initializeShips();
    }

    getBoard = () => {
        return this.board;
    }

    initializeShips = () => {
        this.ships.forEach((ship) => {
            const startX = ship.getCoord()[0][0];
            const startY = ship.getCoord()[0][1];
            const sStart = [startX, startY];

            const endX = ship.getCoord()[ship.length - 1][0];
            const endY = ship.getCoord()[ship.length - 1][1];
            const sEnd = [endX, endY];

            const marker = ship.getMarker();

            this.placeShips(sStart, sEnd, marker);
        });
    }

    placeShips = (start, end, label) => {
        const x = start[0];
        const y = start[1];

        if(x === end[0]){
            const startNum = start[1] > end[1] ? end[1] : start[1];
            const endNum = start[1] > end[1] ? start[1] : end[1];

            for(let i = startNum; i <= endNum; i++){
                this.board[x][i] = label;
            }
        }else{
            const startNum = start[0] > end[0] ? end[0] : start[0];
            const endNum = start[0] > end[0] ? start[0] : end[0];

            for (let i = startNum; i <= endNum; i++){
                this.board[i][y] = label;
            }
        }
    }

    recieveAttack = (coordinates) => {
        const x = coordinates[0];
        const y = coordinates[1];
        
        if (this.board[x][y] === "-" || this.board[x][y] === "x" || this.board[x][y] == "0"){
            this.board[x][y] = "x";
            return false;
        }else{
            let hitShip;
            this.ships.forEach((ship) => {
                if(ship.getMarker() === this.board[x][y]) {
                    hitShip = ship;
                    ship.hit();
                }; 
            });
            this.board[x][y] = "X";
            return hitShip;
        }

    }

    areShipsSunk = () => {
        return this.ships.every((ship) => {
            return ship.isSunk()
        });
    }

    numOfShipsSunk = () => {
        return this.ships.filter((ship) => {
            return ship.isSunk();
        }).length;
    }
}

class ShipPlacementUI {

    isShipSelected = false;
    selectedShipSize = 0;
    shipOrientation = "X";
    shipCoordinate = [];
    blockList = [];

    ships = [];

    constructor(callback) {
        this.paintEmptyBoard("water");
        this.paintShipBlocks();
        this.finish = callback;
    }

    rotateShip = (e) => {
        const currentPos = e.target.getAttribute("data-ship");
        const shipClassStart = currentPos.slice(0, -1);
        const newPos = currentPos.slice(-1) === "X" ? shipClassStart + "Y" : shipClassStart + "X";

        const rotateButton = e.target;
        rotateButton.setAttribute("data-ship", newPos);

        const ship = e.target.parentNode.parentNode.firstChild;
        ship.classList.remove(currentPos);
        ship.classList.add(newPos);
    }

    toggleShipButton = (e) => {
        let block;
        let shipSize;

        if (e.target.tagName === "P" || e.target.className.slice(0, 10) === "ship ship-") {
            block = e.target.parentNode;
        } else if (e.target.tagName === "SPAN") {
            block = e.target.parentNode.parentNode;
        } else {
            block = e.target;
        }

        shipSize = block.firstChild.className.slice(10, 11);

        document.querySelectorAll(".ship-block").forEach((div) => {
            if (div !== block) {
                div.classList.remove("selected-ship-block");
            }
        })

        if (block.className !== "ship-block" && e.target.tagName !== "SPAN") {
            block.classList.remove("selected-ship-block");
            this.isShipSelected = false;
        } else {
            block.classList.add("selected-ship-block");
            this.isShipSelected = true;
            this.selectedShipSize = parseInt(shipSize);
            this.shipOrientation = block.firstChild.className.slice(-1);
        }

    }

    isShipPlaced = (name) => {
        return this.ships.some((ship) => {
            return ship[0] === name;
        });
    }

    removeShip = (name) => {
        this.ships.forEach((ship) => {
            if (ship[0] === name) {
                ship[1].forEach((ele) => {
                    ele.classList.remove("ship");
                    ele.classList.remove("ship-X");
                    ele.classList.remove("ship-Y");
                    ele.classList.remove("ship-X-start");
                    ele.classList.remove("ship-Y-start");
                    ele.classList.remove("ship-X-end");
                    ele.classList.remove("ship-Y-end");
                });
            }
        });

        this.ships = this.ships.filter((ship) => {
            return ship[0] !== name;
        });
    }

    isSpaceFree = (name) => {
        const spaceArr = [];

        //Check if this space is occupied by another ship
        this.ships.forEach((ship) => {
            if (ship[0] !== name) {
                spaceArr.push(
                    ship[1].some((space) => {
                        return this.blockList.some((curSpace) => {
                            return curSpace === space;
                        });
                    })
                );
            }
        });


        return spaceArr.every((condition) => { return !condition });
    }

    addShipToList = (name) => {
        this.blockList.forEach((ele,i) => {
            ele.classList.add("ship");

            if(this.shipOrientation === "X"){
                if (i === 0) ele.classList.add("ship-X-start");
                if (i === this.blockList.length - 1) ele.classList.add("ship-X-end");
                ele.classList.add("ship-X");
            }else{
                if (i === 0) ele.classList.add("ship-Y-start");
                if (i === this.blockList.length - 1) ele.classList.add("ship-Y-end");
                ele.classList.add("ship-Y");
            }
        });

        this.ships.push([name, this.blockList]);
    }

    placeShip = (e) => {
        if (this.isShipSelected){
            const shipName = document.querySelector(".selected-ship-block p").textContent.slice(0, -4);

            if (this.isShipPlaced(shipName)) {
                this.removeShip(shipName);
            }

            if (this.isSpaceFree(shipName)) {
                this.addShipToList(shipName);

                if (this.ships.length === 5) {
                    this.showDoneButton();
                }
            } else {
                alert("Space already occupied.");
            }
        }
    }

    showShipPlacement = (e) => {
        this.blockList = [];
        const block = e.target.className.slice(0, 3) === "peg" ? e.target.parentNode : e.target;

        const coordinateString = block.getAttribute("data-coordinates");
        const x = parseInt(coordinateString.slice(0, 1));
        const y = parseInt(coordinateString.slice(-1));

        let coordinateList = [];

        for (let i = 0; i < this.selectedShipSize; i++) {
            if (this.shipOrientation === "X" && y <= this.selectedShipSize) {
                coordinateList.push([x, y + i]);
            } else if (this.shipOrientation === "X" && y > this.selectedShipSize) {
                coordinateList.push([x, y - i]);
            } else if (this.shipOrientation === "Y" && x <= this.selectedShipSize) {
                coordinateList.push([x + i, y]);
            } else {
                coordinateList.push([x - i, y]);
            }
        }

        if (this.shipOrientation === "X"){
            coordinateList.sort((coordA, coordB) => {
                return coordA[1] - coordB[1];
            });
        }else{
            coordinateList.sort((coordA, coordB) => {
                return coordA[0] - coordB[0];
            });
        }


        coordinateList.forEach((coord) => {
            const space = document.querySelector(`.board-container [data-coordinates="${coord[0]},${coord[1]}"`);
            this.blockList.push(space);
        });

        if (this.isShipSelected) {
            this.blockList.forEach((ele) => {
                ele.classList.add("shipHover");
            });
        }

    }

    removeHover = () => {
        this.blockList.forEach((ele) => {
            ele.classList.remove("shipHover");
        })
    }

    paintShipBlocks = () => {
        const col = document.createElement("div");
        col.classList.add("col");
        col.classList.add("ship-block-col");

        const shipArr = [["Carrier", 5], ["Battleship", 4], ["Cruiser", 3], ["Submarine", 3], ["Destroyer", 2]]

        shipArr.forEach((ship) => {
            const block = document.createElement("div");
            block.classList.add("ship-block");

            block.innerHTML = `<div class="ship ship-${ship[1]}-X"></div>
                                <p>${ship[0]} (${ship[1]})</p>`;

            block.addEventListener("click", this.toggleShipButton);

            const rotateBlock = document.createElement("div");
            rotateBlock.classList.add("rotate");
            rotateBlock.innerHTML = `<span data-ship="ship-${ship[1]}-X" class="material-symbols-outlined">
                                        rotate_right
                                        </span>`;
            rotateBlock.addEventListener("click", this.rotateShip);

            block.appendChild(rotateBlock);
            col.appendChild(block);
        })

        document.querySelector(".game-container").appendChild(col);
    }

    paintEmptyBoard = (type) => {
        let col = document.createElement("div");
        col.classList.add("col");
        col.classList.add("player-col");
        col.setAttribute("data-colType", "playerOne-col");

        let container = document.createElement("div");
        container.classList.add("board-container");

        for (let j = 0; j < 11; j++) {
            let axisXSpot = document.createElement("div");
            axisXSpot.classList.add("space");

            if (j !== 0) {
                axisXSpot.innerHTML = "<p>" + j + "</p>";
            }

            container.appendChild(axisXSpot);
        }

        let row = 0;

        for (let i = 0; i < 110; i++) {
            if (i % 11 === 0) {
                let axisYSpot = document.createElement("div");
                axisYSpot.classList.add("space");
                axisYSpot.innerHTML = "<p>" + (row + 1) + "</p>";
                container.appendChild(axisYSpot);
                row++;
            } else {
                let column = row === 1 ? i : (i - ((row - 1) * 10)) - (row - 1);
                let spot = document.createElement("div");
                spot.classList.add("space");
                spot.classList.add("space-border");
                spot.classList.add(type);
                spot.setAttribute("data-coordinates", [(row - 1), (column - 1)])
                spot.addEventListener("mouseover", this.showShipPlacement);
                spot.addEventListener("mouseout", this.removeHover);
                spot.addEventListener("click", this.placeShip);

                spot.innerHTML = "<div class='peg' data-coordinates='" + [(row - 1), (column - 1)] + "'></div>";

                container.appendChild(spot);
            }

        }


        col.appendChild(container);
        document.querySelector(".game-container").appendChild(col);
    }
    
    showDoneButton = () => {
        if (!document.querySelector(".done-btn")) {
            const row = document.querySelector(".row");

            const doneButton = document.createElement("button");
            doneButton.classList.add("done-btn");
            doneButton.textContent = "On to the Game!";
            doneButton.addEventListener("click", ()=>{
                document.querySelectorAll(".space").forEach((div) => {
                    div.removeEventListener("mouseover", this.showShipPlacement);
                    div.removeEventListener("mouseout", this.removeHover);
                    div.removeEventListener("click", this.placeShip);
                });
                this.finish(this.ships, "human")
            });

            row.appendChild(doneButton);
        }
    }

}

class ComputerShipPlacementUI{

    ships = [];

    constructor(callback) {
        this.finish = callback;
        this.initialize();
    }

    initialize = () => {
        this.makeShip("Carrier", 5);
        this.makeShip("Battleship", 4);
        this.makeShip("Cruiser", 3);
        this.makeShip("Submarine", 3);
        this.makeShip("Destroyer", 2);
        this.finish(this.ships, "computer");
    }

    makeShip = (name, length) => {
        let startCoord = getRandomCoord();

        while(this.checkIfCoordTaken(startCoord)){
            startCoord = getRandomCoord();
        }

        const orientation = getRandomInt(10) % 2 === 0 ? "vertical" : "horizontal" ;
        const addSubtract = this.isInbounds(startCoord, length, orientation) ? "add" : "subtract";

        const coordList = [startCoord];

        //create coordinate list
        for(let i = 1; i < length; i++){
            const lastSpace = coordList[i-1];
            let x;
            let y;

            if(orientation === "vertical"){
                x = addSubtract === "subtract" ? lastSpace[0] - 1 : lastSpace[0] + 1;
                y  = lastSpace[1];
            }else{            
                x = lastSpace[0];
                y = addSubtract === "subtract" ? lastSpace[1] - 1 : lastSpace[1] + 1;
            }

            const coord = [x,y];
            if (this.checkIfCoordTaken(coord)){
                return this.makeShip(name,length);
            }else{
                coordList.push(coord);
            }
        }

        this.ships.push([name,coordList]);

    }

    checkIfCoordTaken = (coord) => {
        return this.ships.some((ship) => {
            return ship[1].some((curCoord) => {
                return (curCoord[0] === coord[0] && curCoord[1] === coord[1])
            });        
        });
    }

    isInbounds = (coord, length, orientation) => {        
        if (orientation === "vertical"){
            return ((coord[0] + length) < 9);
        }else{
            return ((coord[1] + length) < 9);
        }
    }


}

class Ui{

    players = [];
    computerAttacks = [];
    computerHit = [];
    tryOrientation = "horizontal";

    constructor(){
        this.initialize();        
    }

    initialize = () => {
        document.querySelector(".game-container").classList.remove('mainScreen');
        document.querySelector(".game-container").classList.add('gameBG');
        this.updateHeaderMessage(1);
        const shipPlacementScreen = new ShipPlacementUI(this.addPlayer);
    }

    addPlayer = (ships, playerType) => {
        const shipObjs = [];

        ships.forEach((ship) => {
            const sName = ship[0];
            const sLength = ship[1].length;
            const sCoord = ship[1];
            let sMarker;

            if (sName === "Carrier"){
                sMarker = "K";
            } else if (sName === "Battleship"){
                sMarker = "B";
            } else if (sName === "Cruiser") {
                sMarker = "C";
            } else if (sName === "Submarine") {
                sMarker = "S";
            }else{
                sMarker = "D";
            }

            const obj = new Ship(sLength, sName, sCoord, sMarker);
            shipObjs.push(obj);

        });

        const pBoard = new GameBoard(shipObjs);
        this.players.push(new Player(playerType, pBoard));
        this.nextStep();
    }

    nextStep = () => {
        if(this.players.length === 2){
            this.startGame();
        }else{
            const computerShipPlacement = new ComputerShipPlacementUI(this.addPlayer);
        }
    }

    clearScreen = () => {
        document.querySelector(".ship-block-col").remove();
        document.querySelector(".done-btn").remove();
    }

    updateHeaderMessage = (screenNum) => {
        const screenMessages = ["Click a ship to choose its placement", "Click a coordinate on your radar to fire missile.", "Screen 3", "Screen 4"]
        const msgContainer = document.querySelector("#header-message");
        msgContainer.innerHTML = screenMessages[screenNum-1];
    }

    startGame = () => {
        this.clearScreen();
        this.updateHeaderMessage(2);
        this.paintRadar();
        this.paintPlayerBoard();
    }
    
    paintPlayerBoard = () => {
        const playBoardContainer = document.querySelector("[data-colType = 'playerOne-col']");
        const legend = document.createElement("div");
        legend.classList.add("info-container");
        legend.innerHTML = `<h3>Your Ships</h3>
                            <p id="player-ships-legend">Ships sunk: 0</p>`;
        playBoardContainer.appendChild(legend);
        /*
        let col = document.createElement("div");
        col.classList.add("col");
        col.classList.add("player-col");
        col.setAttribute("data-colType","playerOne-col");
        col.innerHTML = `<div class="info-container">
                            <h3>Your Ships</h3>
                            <p id="player-ships-legend">Ships sunk: 0</p>
                         </div> `;

        let container = document.createElement("div");
        container.classList.add("board-container");

        for(let j = 0; j < 11; j++){
            let axisXSpot = document.createElement("div");
            axisXSpot.classList.add("space");

            if(j !== 0){
                axisXSpot.innerHTML = "<p>" + j + "</p>";
            }

            container.appendChild(axisXSpot);
        }

        this.players[0].getBoard().getBoard().forEach((row, i) => {
            let axisYSpot = document.createElement("div");
            axisYSpot.classList.add("space");
            axisYSpot.innerHTML = "<p>" + (i + 1) + "</p>";
            container.appendChild(axisYSpot);

            row.forEach((spot, j) => {
                let divSpot = document.createElement("div");
                divSpot.classList.add("space");
                divSpot.classList.add("space-border");
                divSpot.setAttribute("data-coordinates", [(i), (j)]);

                let peg = document.createElement("div");
                peg.classList.add("peg");

                switch(spot){
                    case 0:
                    case "-":
                    case "x":
                        divSpot.classList.add("water");

                        if(spot === "x"){
                            peg.classList.add("white");
                        }

                        divSpot.appendChild(peg);
                    break;

                    case "K":
                    case "C":
                    case "B":
                    case "S":
                    case "D":
                    case "X":
                        console.log(row);
                        divSpot.classList.add("ship");

                        if (spot === "x") {
                            peg.classList.add("red");
                        }

                        divSpot.appendChild(peg);
                    break;
                }
                container.appendChild(divSpot);
            });
        });

        col.insertBefore(container, col.firstChild);
        document.querySelector(".game-container").appendChild(col);
        */
    }
    
    paintRadar = () => {
        let col = document.createElement("div");
        col.classList.add("col");
        col.classList.add("player-col");
        col.innerHTML = `<div class="info-container">
                            <h3>Your Radar</h3>
                            <p id="enemy-ships-legend">Ships sunk: 0</p>
                         </div> `;

        let container = document.createElement("div");
        container.classList.add("board-container");

        for (let j = 0; j < 11; j++) {
            let axisXSpot = document.createElement("div");
            axisXSpot.classList.add("space");

            if (j !== 0) {
                axisXSpot.innerHTML = "<p>" + j + "</p>";
            }

            container.appendChild(axisXSpot);
        }

        this.players[1].getBoard().getBoard().forEach((row, i) => {
            let axisYSpot = document.createElement("div");
            axisYSpot.classList.add("space");
            axisYSpot.innerHTML = "<p>" + (i + 1) + "</p>";
            container.appendChild(axisYSpot);

            row.forEach((spot,j) => {
                let divSpot = document.createElement("div");
                divSpot.classList.add("space");
                divSpot.classList.add("space-border");
                divSpot.setAttribute("data-coordinates", [(i), (j)]);
                divSpot.addEventListener("click", this.fireMissile);

                let peg = document.createElement("div");
                peg.classList.add("peg");
                peg.setAttribute("data-coordinates", [(i), (j)]);

                divSpot.classList.add("radar");

                /* Testing
                switch (spot) {
                    case 0:
                    case "-":
                    case "x":

                        if (spot === "x") {
                            peg.classList.add("white");
                        }
                        break;

                    case "K":
                    case "C":
                    case "B":
                    case "S":
                    case "D":
                    case "X":

                        if (spot === "x") {
                            peg.classList.add("red");
                        }
                        break;
                }
                        */

                divSpot.appendChild(peg);
                container.appendChild(divSpot);
            });
        });

        col.insertBefore(container, col.firstChild);

        const gameContainer = document.querySelector(".game-container");
        gameContainer.insertBefore(col, gameContainer.lastChild);
    }

    updateLegend = (i) => {
        const shipsSunk = this.players[i].getBoard().numOfShipsSunk();
        const legendID = i === 0 ? "#player-ships-legend" : "#enemy-ships-legend";
        document.querySelector(legendID).innerHTML = `Ships sunk: ${shipsSunk}`;
    }

    fireMissile = (e) => {
        const coordinateString = e.target.getAttribute("data-coordinates");
        const coordinates = [parseInt(coordinateString[0]), parseInt(coordinateString[2])];

        const enemyBoard = this.players[1].getBoard();
        
        const pegColor = enemyBoard.recieveAttack(coordinates) ? "red" : "white";
        const boardEle = e.target.firstChild ? e.target.firstChild : e.target;
        boardEle.classList.add(pegColor);
        this.updateLegend(1);

        boardEle.parentNode.removeEventListener("click", this.fireMissile);
        boardEle.parentNode.style.cursor = "default";

        if(this.isGameOver()){
            this.endGame();
        }else{
            window.setTimeout(this.computerTurn, 200);
        }
    }

    checkIfCoordAlreadyAttacked = (attackCoord) => {
        return this.computerAttacks.some((coord) => {
            return coord[0] === attackCoord[0] && coord[1] === attackCoord[1]
        })
    }

    attackAdjacent = (coord) => {
        const right = [coord[0], coord[1] + 1];
        const left = [coord[0], coord[1] - 1];
        const top = [coord[0] + 1, coord[1]];
        const bottom = [coord[0] - 1, coord[1]];

        const horizontalSpots = [right,left];
        const verticalSpots = [top, bottom];

        let adjacentSpots = this.tryOrientation === "horizontal" ? horizontalSpots : verticalSpots;

        const validAttacks = adjacentSpots.filter((spot) => {
            return  spot[0] >= 0 && 
                    spot[0] < 10 && 
                    spot[1] >= 0 && 
                    spot[1] < 10 &&
                    !this.checkIfCoordAlreadyAttacked(spot);
        });
        
        if(validAttacks.length > 0){
            //If there are valid attacks, chooose one
            const randomIndex = randomIntFromInterval(0, validAttacks.length-1);
            return validAttacks[randomIndex];
        } else if (this.computerHit[0][0] === coord[0] && this.computerHit[0][1] === coord[1]){
            //If no more valid attacks in one orientation/axis, try the other orientation/axis
            this.tryOrientation = this.tryOrientation === "horizontal" ? "vertical" : "horizontal";
        }    
        
        return this.attackAdjacent(this.computerHit[0]);
    }

    clearHitList = (ship) => {
        this.computerHit = this.computerHit.filter((coord) => {
            const isPartOfShip = ship.getCoord().some((shipCoord) => {
                return  coord[0] === shipCoord[0] && coord[1] === shipCoord[1];
            });

            return !isPartOfShip;
        });
    }

    computerTurn = () => {
        const enemyBoard = this.players[0].getBoard();
        let attackCoord;

        const isShipWasHit = this.computerHit.length > 0;
        if(isShipWasHit){
            //Attack spot next to last hit
            attackCoord = this.attackAdjacent(this.computerHit[this.computerHit.length - 1]);        
        }else{
            //Get Random Coordinate
            attackCoord = getRandomCoord();

            while (this.checkIfCoordAlreadyAttacked(attackCoord)) {
                attackCoord = getRandomCoord();
            }
        }
        
        this.computerAttacks.push(attackCoord);
        const boardEle = document.querySelector("[data-colType = 'playerOne-col'] .board-container [data-coordinates = '" + attackCoord[0] + "," + attackCoord[1] + "'] .peg");
        const shipAttacked = enemyBoard.recieveAttack(attackCoord);
        
        if (shipAttacked){
            boardEle.classList.add("red");
            this.showComputerTurnOverlay("hit", attackCoord, shipAttacked);
            this.computerHit.push(attackCoord);
            if(shipAttacked.isSunk()) this.clearHitList(shipAttacked);//this.computerHit = [];
        }else{
            boardEle.classList.add("white");
            this.showComputerTurnOverlay("miss", attackCoord);
        }

        this.updateLegend(0);

        if (this.isGameOver()) {
            this.endGame();
        }

    }

    showComputerTurnOverlay = (type,coord, ship) => {
        const playerBoard = document.querySelector("[data-colType = 'playerOne-col'] .board-container");
        

        const container = document.createElement("div");
        container.classList.add("computerMessage");
        const message = document.createElement("h3");

        if(type === "hit"){
            const extraMessage = ship.isSunk() ? "<br>" + ship.getLabel() + " has sunk" : "";
            message.innerHTML = "Player 2 fires missile at " + (coord[0] + 1) + ", " + (coord[1] + 1) + " for a direct hit!" + extraMessage;
            container.classList.add("hitBG");
        }else{
            message.innerHTML = "Player 2 fires missile at " + (coord[0] + 1) + ", " + (coord[1] + 1) + " and misses!";
            container.classList.add("missBG");
        }
        
        container.appendChild(message);
        playerBoard.appendChild(container);

        window.setTimeout(()=>{container.remove()}, 2000);
    }

    isGameOver = () => {
        return this.players.some((player, i) => {
            return player.getBoard().areShipsSunk();
        });
    }

    endGame = () => {
        const divContainer = document.querySelector(".end-game");
        divContainer.style.display = "flex";

        const header = document.querySelector(".end-game h1");
        header.innerHTML = "Game Over."
        const message = document.querySelector("#end-game-message");

        if(this.players[0].getBoard().areShipsSunk()){
            //alert("Game Over. All your ships are sunk. You lose.");
            message.innerHTML = "All your ships are sunk. You lose."
           
        }else{
            //alert("Game Over. You sunk all the enemy ships. You win!");
            message.innerHTML = "You sunk all the enemy ships. You win!"
        }

        document.querySelector(".play-again").addEventListener("click", () => {
            divContainer.style.display = "none";
            document.querySelectorAll(".col").forEach((col) => {
                col.remove();
            })
            const newGame = new Ui();
        });

    }

}



(() => {
    document.querySelector(".start-button").addEventListener("click", ()=>{
        const newGame = new Ui();
     })
})();




/*
[
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]


[
  ['K','K','K','K','K', 0, 0, 0, 0, 0],
  [ 0,  0,  0,  0,  0, 0, 0, 0, 0,  0],
  [ 0,  0,  0,  0,  0, 0, 0, 0, 0,  0],
  [ 0,  0,  0, 'C', 0, 0, 0, 0, 0, 'S'],
  [ 0,  0,  0, 'C', 0, 0, 0, 0, 0, 'S'],
  [ 0,  0,  0, 'C', 0, 0, 0, 0, 0, 'S'],
  [ 0,  0,  0,  0,  0, 0, 0, 0, 0,  0],
  [ 0,  0,  0,  0,  0, 0, 0, 0, 0,  0],
  [ 0,  0,  0,  0,  0, 0, 0, 0, 0,  0],
  ['B','B','B','B', 0, 0, 0, 0,'D','D']
]


*/