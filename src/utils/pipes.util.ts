export interface Pipe {
    name: ShapeName;
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
    isDone: boolean;
    allowedPositions: Position[];
    position: Position;
}

export type Position = 0 | 90 | 180 | 270;

export type Direction = 'top' | 'right' | 'bottom' | 'left';

export type ShapeType =
    | '┏'
    | '┓'
    | '┗'
    | '┛'
    | '╸'
    | '╺'
    | '╹'
    | '╻'
    | '┣'
    | '┳'
    | '┻'
    | '┫'
    | '━'
    | '┃'
    | '╋';

type ShapeName = 'Line' | 'Elbow' | 'Tee' | 'End' | 'Cross';

interface Output {
    rotateMessage: string;
    pipesLeft: number;
}

export const splitRawDataInShapeRows = (mapAsString: string): string[] => {
    const legitMapData = mapAsString.split('\n');
    legitMapData.shift();
    legitMapData.pop();
    return legitMapData;
};

export const makeShapeGridFromRows = (rows: string[]): ShapeType[][] => {
    const output: ShapeType[][] = rows.map((row) => {
        return row.split('') as ShapeType[];
    });
    return output;
};

export const initNewPipe = (
    name: ShapeName,
    top: boolean,
    right: boolean,
    bottom: boolean,
    left: boolean,
    position: Position
): Pipe => {
    return {
        name,
        top,
        right,
        bottom,
        left,
        position,
        isDone: name === 'Cross' ? true : false,
        allowedPositions: name === 'Cross' ? [0] : [0, 90, 180, 270],
    };
};

export const translateFromShapeToPipe = (shape: ShapeType): Pipe => {
    switch (shape) {
        case '┗': {
            return initNewPipe('Elbow', true, true, false, false, 0);
        }
        case '┏': {
            return initNewPipe('Elbow', false, true, true, false, 90);
        }
        case '┓': {
            return initNewPipe('Elbow', false, false, true, true, 180);
        }
        case '┛': {
            return initNewPipe('Elbow', true, false, false, true, 270);
        }
        case '╹': {
            return initNewPipe('End', true, false, false, false, 0);
        }
        case '╺': {
            return initNewPipe('End', false, true, false, false, 90);
        }
        case '╻': {
            return initNewPipe('End', false, false, true, false, 180);
        }
        case '╸': {
            return initNewPipe('End', false, false, false, true, 270);
        }
        case '┻': {
            return initNewPipe('Tee', true, true, false, true, 0);
        }
        case '┣': {
            return initNewPipe('Tee', true, true, true, false, 90);
        }
        case '┳': {
            return initNewPipe('Tee', false, true, true, true, 180);
        }
        case '┫': {
            return initNewPipe('Tee', true, false, true, true, 270);
        }
        case '┃': {
            return initNewPipe('Line', true, false, true, false, 0);
        }
        case '━': {
            return initNewPipe('Line', false, true, false, true, 90);
        }
        case '╋': {
            return initNewPipe('Cross', true, true, true, true, 0);
        }
        default: {
            return initNewPipe('Cross', false, false, false, false, 0);
        }
    }
};
export const translateFromPipeToShape = (pipe: Pipe): ShapeType => {
    const { top, right, bottom, left } = pipe;
    const pipePositions = [top, right, bottom, left];
    switch (JSON.stringify(pipePositions)) {
        case JSON.stringify([false, true, true, false]):
            return '┏';
        case JSON.stringify([false, false, true, true]):
            return '┓';
        case JSON.stringify([true, false, false, true]):
            return '┛';
        case JSON.stringify([true, true, false, false]):
            return '┗';
        case JSON.stringify([true, false, true, false]):
            return '┃';
        case JSON.stringify([false, true, false, true]):
            return '━';
        case JSON.stringify([true, false, true, true]):
            return '┫';
        case JSON.stringify([true, true, true, false]):
            return '┣';
        case JSON.stringify([true, true, false, true]):
            return '┻';
        case JSON.stringify([false, true, true, true]):
            return '┳';
        case JSON.stringify([false, false, false, true]):
            return '╸';
        case JSON.stringify([false, false, true, false]):
            return '╻';
        case JSON.stringify([false, true, false, false]):
            return '╺';
        case JSON.stringify([true, false, false, false]):
            return '╹';
        case JSON.stringify([true, true, true, true]):
            return '╋';
        default:
            return '╋';
    }
};

export const transformShapeGridToPipeGrid = (
    shapeGrid: ShapeType[][]
): Pipe[][] => {
    const output = shapeGrid.map((row) => {
        return row.map((shape) => {
            return translateFromShapeToPipe(shape);
        });
    });
    return output;
};

export const rotatePipe = (pipe: Pipe): Pipe => {
    const output = { ...pipe };
    output.top = pipe.left;
    output.left = pipe.bottom;
    output.bottom = pipe.right;
    output.right = pipe.top;
    if (output.position > 200) {
        output.position = 0;
    } else {
        output.position += 90;
    }
    return output;
};

export const appendRotateMessage = (
    base: string,
    x: number,
    y: number
): string => {
    if (base.length > 8) {
        return (base += `\n${x} ${y}`);
    }
    return (base += ` ${x} ${y}`);
};

export const calculateRotationCount = (
    positionNow: Position,
    desiredPosition: Position
): number => {
    let output = 0;
    let tmp = positionNow;
    while (tmp !== desiredPosition) {
        output += 1;
        if (tmp > 200) {
            tmp = 0;
        } else {
            tmp += 90;
        }
    }
    return output;
};

// Check if pipe must be NOT connected given direction even if it's not done
export const mustBeNotConnected = (
    x: number,
    y: number,
    direction: Direction,
    grid: Pipe[][]
): boolean => {
    const pipe = grid[y][x];
    // if all pipes posotions possible, then it's not certain and return false
    if (pipe.allowedPositions.length > 3) return false;

    let output = true;
    const positionNow = pipe.position;

    pipe.allowedPositions.forEach((posAllowed) => {
        const count = calculateRotationCount(positionNow, posAllowed);
        let tmpPipe = { ...pipe };
        for (let i = 0; i < count; i++) {
            tmpPipe = rotatePipe(tmpPipe);
        }
        if (tmpPipe[direction]) output = false;
    });
    return output;
};

// Check if pipe must be connected given direction even if it's not done
export const mustBeConnected = (
    x: number,
    y: number,
    direction: Direction,
    grid: Pipe[][]
): boolean => {
    const pipe = grid[y][x];

    if (pipe.allowedPositions.length > 3) return false;

    let output = true;
    const positionNow = pipe.position;
    pipe.allowedPositions.forEach((posAllowed) => {
        const count = calculateRotationCount(positionNow, posAllowed);
        let tmpPipe = { ...pipe };
        for (let i = 0; i < count; i++) {
            tmpPipe = rotatePipe(tmpPipe);
        }
        if (!tmpPipe[direction]) output = false;
    });

    return output;
};

// Removes given positions from positions array and returns updated positions array
export const spliceOutPositions = (
    allowdPositons: Position[],
    ...positionsToRemove: Position[]
): Position[] => {
    const output = [...allowdPositons];
    positionsToRemove.forEach((pos) => {
        const idx = output.indexOf(pos);
        if (idx > -1) output.splice(idx, 1);
    });
    return output;
};

// --------------- CHECK LINE SHAPE -------------

export const checkLeft_Line = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const leftPipe = grid[y][x - 1];
    // If there is no pipe on the left, reduce to single possible position
    if (!leftPipe) return [0];
    // If left pipe does not allow right connection, reduce to single possible position
    if (mustBeNotConnected(x - 1, y, 'right', grid)) return [0];
    // If left pipe must have right connection, reduce to single possible position
    if (mustBeConnected(x - 1, y, 'right', grid)) return [90];
    return grid[y][x].allowedPositions;
};

export const checkRight_Line = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const rightPipe = grid[y][x + 1];
    if (!rightPipe) return [0];
    if (mustBeConnected(x + 1, y, 'left', grid)) return [90];
    if (mustBeNotConnected(x + 1, y, 'left', grid)) return [0];

    return grid[y][x].allowedPositions;
};

export const checkTop_Line = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y - 1 < 0) return [90];
    if (mustBeConnected(x, y - 1, 'bottom', grid)) return [0];
    if (mustBeNotConnected(x, y - 1, 'bottom', grid)) return [90];
    return grid[y][x].allowedPositions;
};

export const checkBottom_Line = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y + 1 >= grid.length) return [90];
    if (mustBeConnected(x, y + 1, 'top', grid)) return [0];
    if (mustBeNotConnected(x, y + 1, 'top', grid)) return [90];
    return grid[y][x].allowedPositions;
};

// --------------- CHECK TEE SHAPE -------------

export const checkLeft_Tee = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const leftPipe = grid[y][x - 1];
    // If there is no pipe on the left, reduce to single possible position
    if (!leftPipe) return [90];
    // If left pipe does not allow right connection, reduce to single possible position
    if (mustBeNotConnected(x - 1, y, 'right', grid)) return [90];
    // If left pipe must have right connection, slice out one not possible connection
    if (mustBeConnected(x - 1, y, 'right', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 90);
    return grid[y][x].allowedPositions;
};

export const checkRight_Tee = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const rightPipe = grid[y][x + 1];
    if (!rightPipe) return [270];
    if (mustBeNotConnected(x + 1, y, 'left', grid)) return [270];
    if (mustBeConnected(x + 1, y, 'left', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 270);
    return grid[y][x].allowedPositions;
};

export const checkTop_Tee = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y - 1 < 0) return [180];
    if (mustBeNotConnected(x, y - 1, 'bottom', grid)) return [180];
    if (mustBeConnected(x, y - 1, 'bottom', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 180);
    return grid[y][x].allowedPositions;
};

export const checkBottom_Tee = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y + 1 >= grid.length) return [0];
    if (mustBeNotConnected(x, y + 1, 'top', grid)) return [0];
    if (mustBeConnected(x, y + 1, 'top', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 0);
    return grid[y][x].allowedPositions;
};

// --------------- CHECK END SHAPE -------------

export const checkLeft_End = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const leftPipe = grid[y][x - 1];
    // If there is no pipe on the left, slice out one not possible position
    if (!leftPipe) return spliceOutPositions(grid[y][x].allowedPositions, 270);
    // If left pipe must NOT be connected to right, slice out one not possible position
    if (mustBeNotConnected(x - 1, y, 'right', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 270);
    // If left pipe must be connected to right, reduce to one possible connection
    if (mustBeConnected(x - 1, y, 'right', grid)) return [270];
    // If left pipe is End too, slice out one not possible direction
    else if (leftPipe.name === 'End')
        return spliceOutPositions(grid[y][x].allowedPositions, 270);
    // if no pattern found
    return grid[y][x].allowedPositions;
};

export const checkRight_End = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const rightPipe = grid[y][x + 1];
    if (!rightPipe) return spliceOutPositions(grid[y][x].allowedPositions, 90);
    if (mustBeNotConnected(x + 1, y, 'left', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 90);
    if (mustBeConnected(x + 1, y, 'left', grid)) return [90];
    else if (rightPipe.name === 'End')
        return spliceOutPositions(grid[y][x].allowedPositions, 90);
    return grid[y][x].allowedPositions;
};

export const checkTop_End = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y - 1 < 0) return spliceOutPositions(grid[y][x].allowedPositions, 0);
    if (mustBeNotConnected(x, y - 1, 'bottom', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 0);
    if (mustBeConnected(x, y - 1, 'bottom', grid)) return [0];
    else if (grid[y - 1][x].name === 'End')
        return spliceOutPositions(grid[y][x].allowedPositions, 0);
    return grid[y][x].allowedPositions;
};

export const checkBottom_End = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y + 1 >= grid.length)
        return spliceOutPositions(grid[y][x].allowedPositions, 180);
    if (mustBeNotConnected(x, y + 1, 'top', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 180);
    if (mustBeConnected(x, y + 1, 'top', grid)) return [180];
    else if (grid[y + 1][x].name === 'End')
        return spliceOutPositions(grid[y][x].allowedPositions, 180);
    return grid[y][x].allowedPositions;
};

// --------------- CHECK ELBOW SHAPE -------------

export const checkLeft_Elbow = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const leftPipe = grid[y][x - 1];
    // If there is no pipe on the left, slice out two not possible positions
    if (!leftPipe)
        return spliceOutPositions(grid[y][x].allowedPositions, 180, 270);
    // If left pipe cant have right connection, slice out two not possible positions
    if (mustBeNotConnected(x - 1, y, 'right', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 180, 270);
    // If left pipe must have right connection, slice out two not possible positions
    if (mustBeConnected(x - 1, y, 'right', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 0, 90);

    return grid[y][x].allowedPositions;
};

export const checkRight_Elbow = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    const rightPipe = grid[y][x + 1];
    if (!rightPipe)
        return spliceOutPositions(grid[y][x].allowedPositions, 0, 90);
    if (mustBeNotConnected(x + 1, y, 'left', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 0, 90);
    if (mustBeConnected(x + 1, y, 'left', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 180, 270);

    return grid[y][x].allowedPositions;
};

export const checkTop_Elbow = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y - 1 < 0)
        return spliceOutPositions(grid[y][x].allowedPositions, 0, 270);
    if (mustBeNotConnected(x, y - 1, 'bottom', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 0, 270);
    if (mustBeConnected(x, y - 1, 'bottom', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 90, 180);

    return grid[y][x].allowedPositions;
};

export const checkBottom_Elbow = (
    x: number,
    y: number,
    grid: Pipe[][]
): Position[] => {
    if (y + 1 >= grid.length)
        return spliceOutPositions(grid[y][x].allowedPositions, 90, 180);
    if (mustBeNotConnected(x, y + 1, 'top', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 90, 180);
    if (mustBeConnected(x, y + 1, 'top', grid))
        return spliceOutPositions(grid[y][x].allowedPositions, 0, 270);

    return grid[y][x].allowedPositions;
};

export const solvePipe = (
    x: number,
    y: number,
    grid: Pipe[][],
    rotateMsg: string,
    pipesToSolve: number
): Output => {
    let output = rotateMsg;
    let pipesLeft = pipesToSolve;

    const count = calculateRotationCount(
        grid[y][x].position,
        grid[y][x].allowedPositions[0]
    );
    for (let i = 0; i < count; i++) {
        grid[y][x] = rotatePipe(grid[y][x]);
        output = appendRotateMessage(output, x, y);
    }
    grid[y][x].isDone = true;
    pipesLeft -= 1;

    const outputObj = { rotateMessage: output, pipesLeft };
    return outputObj;
};

export const checkLine = (
    x: number,
    y: number,
    grid: Pipe[][],
    rotateMsg: string,
    pipesToSolve: number
): Output => {
    let output = rotateMsg;
    grid[y][x].allowedPositions = checkLeft_Line(x, y, grid);
    grid[y][x].allowedPositions = checkRight_Line(x, y, grid);
    grid[y][x].allowedPositions = checkTop_Line(x, y, grid);
    grid[y][x].allowedPositions = checkBottom_Line(x, y, grid);
    if (grid[y][x].allowedPositions.length === 1) {
        return solvePipe(x, y, grid, output, pipesToSolve);
    }
    const outputObj = { rotateMessage: output, pipesLeft: pipesToSolve };
    return outputObj;
};

export const checkTee = (
    x: number,
    y: number,
    grid: Pipe[][],
    rotateMsg: string,
    pipesToSolve: number
): Output => {
    let output = rotateMsg;
    grid[y][x].allowedPositions = checkLeft_Tee(x, y, grid);
    grid[y][x].allowedPositions = checkRight_Tee(x, y, grid);
    grid[y][x].allowedPositions = checkTop_Tee(x, y, grid);
    grid[y][x].allowedPositions = checkBottom_Tee(x, y, grid);
    if (grid[y][x].allowedPositions.length === 1) {
        return solvePipe(x, y, grid, output, pipesToSolve);
    }
    const outputObj = { rotateMessage: output, pipesLeft: pipesToSolve };
    return outputObj;
};

export const checkEnd = (
    x: number,
    y: number,
    grid: Pipe[][],
    rotateMsg: string,
    pipesToSolve: number
) => {
    let output = rotateMsg;
    grid[y][x].allowedPositions = checkLeft_End(x, y, grid);
    grid[y][x].allowedPositions = checkRight_End(x, y, grid);
    grid[y][x].allowedPositions = checkTop_End(x, y, grid);
    grid[y][x].allowedPositions = checkBottom_End(x, y, grid);
    if (grid[y][x].allowedPositions.length === 1) {
        return solvePipe(x, y, grid, output, pipesToSolve);
    }
    const outputObj = { rotateMessage: output, pipesLeft: pipesToSolve };
    return outputObj;
};

const checkElbow = (
    x: number,
    y: number,
    grid: Pipe[][],
    rotateMsg: string,
    pipesToSolve: number
) => {
    let output = rotateMsg;
    grid[y][x].allowedPositions = checkLeft_Elbow(x, y, grid);
    grid[y][x].allowedPositions = checkRight_Elbow(x, y, grid);
    grid[y][x].allowedPositions = checkTop_Elbow(x, y, grid);
    grid[y][x].allowedPositions = checkBottom_Elbow(x, y, grid);
    if (grid[y][x].allowedPositions.length === 1) {
        return solvePipe(x, y, grid, output, pipesToSolve);
    }
    const outputObj = { rotateMessage: output, pipesLeft: pipesToSolve };
    return outputObj;
};

export const checkPipe = (
    x: number,
    y: number,
    grid: Pipe[][],
    rotateMsg: string,
    pipesToSolve: number
): { rotateMessage: string; pipesLeft: number } => {
    switch (grid[y][x].name) {
        case 'Line': {
            return checkLine(x, y, grid, rotateMsg, pipesToSolve);
        }
        case 'Tee': {
            return checkTee(x, y, grid, rotateMsg, pipesToSolve);
        }
        case 'End': {
            return checkEnd(x, y, grid, rotateMsg, pipesToSolve);
        }
        case 'Elbow': {
            return checkElbow(x, y, grid, rotateMsg, pipesToSolve);
        }
        default: {
            const outputObj = {
                rotateMessage: rotateMsg,
                pipesLeft: pipesToSolve,
            };
            return outputObj;
        }
    }
};

export const findNextCoordinates = (
    count: number,
    totalPipes: number,
    xx: number,
    yy: number,
    grid: Pipe[][]
): { x: number; y: number } => {
    let loopCountLeft = totalPipes;
    let keepLooping = true;
    let x = xx;
    let y = yy;

    do {
        if (count) {
            x += 1;
        }
        if (x >= grid[0].length) {
            x = 0;
            y += 1;
        }
        if (y >= grid.length) {
            y = 0;
            x = 0;
        }

        if (!grid[y][x].isDone) {
            keepLooping = false;
        }

        loopCountLeft -= 1;
        if (loopCountLeft < 0) {
            keepLooping = false;
        }
    } while (keepLooping);

    return { x, y };
};

export const fastAutoSolve = (grid: Pipe[][]) => {
    let counter = 0;
    let rotateCount = 0;
    let totalPipes = grid.length * grid[0].length;
    let xx = 0;
    let yy = 0;
    let pipesToSolve = grid.length * grid[0].length;
    let verifyMsg = 'rotate';

    while (true) {
        const { x, y } = findNextCoordinates(counter, totalPipes, xx, yy, grid);

        xx = x;
        yy = y;

        const { rotateMessage, pipesLeft } = checkPipe(
            xx,
            yy,
            grid,
            verifyMsg,
            pipesToSolve
        );

        if (rotateMessage.length !== verifyMsg.length) {
            verifyMsg = rotateMessage;
            rotateCount = counter;
        }

        pipesToSolve = pipesLeft;
        if (counter - rotateCount > pipesToSolve) {
            break;
        }
        counter++;
    }

    return verifyMsg;
};
