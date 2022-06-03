import WebSocket from 'ws';
import { APP_GATEWAY_URL } from '../constants/enviroment.constant';
import { log } from '../utils/log.util';
import {
    fastAutoSolve,
    makeShapeGridFromRows,
    Pipe,
    splitRawDataInShapeRows,
    transformShapeGridToPipeGrid,
} from '../utils/pipes.util';

export class GatewayService {
    private static title = 'gateway';
    private static socket: WebSocket;
    private static map: Pipe[][] = [];
    private static isCorrect: number = -1;

    public static reset() {
        this.socket.close();
        this.map = [];
        this.isCorrect = -1;
    }

    public static connect() {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(APP_GATEWAY_URL);
            this.socket.onopen = () => {
                // log('onopen', this.title);
                resolve(true);
                this.socket.send('help');
            };
            this.socket.onmessage = (e) => {
                const data = e.data as string;
                const cmd = data.split(':')[0];

                log(`-> ${e.data.toString()}`, this.title);

                if (cmd === 'map') {
                    const step1 = splitRawDataInShapeRows(data);
                    const step2 = makeShapeGridFromRows(step1);
                    const step3 = transformShapeGridToPipeGrid(step2);
                    this.map = step3;
                } else if (cmd === 'verify') {
                    this.isCorrect = data === 'verify: Incorrect.' ? 0 : 1;
                }

                // if (cmd === 'verify') {
                if (cmd === 'verify' && data !== 'verify: Incorrect.') {
                    log(`-> ${e.data.toString()}`, this.title);
                }
            };
            this.socket.onerror = (e) => {
                log('onerror', this.title);
                reject();
            };
            this.socket.onclose = (e) => {
                // log('onclose', this.title);
                reject();
            };
        });
    }

    public static setupMap(level: number) {
        this.socket.send(`new ${level}`);
        this.socket.send('map');

        return new Promise((resolve) => {
            let atts = 200; // 10 secs
            const interval = setInterval(() => {
                atts--;
                if (this.map.length > 0 || atts <= 0) {
                    clearInterval(interval);
                    resolve(true);
                }
            }, 50);
        });
    }

    public static solve() {
        let result: string;
        result = fastAutoSolve(this.map);

        while (true) {
            for (let j = 0; j < this.map.length; j++) {
                for (let k = 0; k < this.map[j].length; k++) {
                    this.map[j][k].isDone = false;
                }
            }
            const moreResult = fastAutoSolve(this.map);
            if (moreResult === 'rotate') {
                break;
            } else {
                result = moreResult;
            }
        }

        this.socket.send(result);
        this.socket.send('verify');

        return new Promise((resolve) => {
            let atts = 200; // 10 secs
            const interval = setInterval(() => {
                atts--;
                if (this.isCorrect !== -1 || atts <= 0) {
                    clearInterval(interval);
                    resolve(this.isCorrect);
                }
            }, 50);
        });
    }
}
