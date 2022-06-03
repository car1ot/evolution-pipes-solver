import 'dotenv/config';
import cluster from 'cluster';
import { GatewayService } from './services/gateway.service';

async function init() {
    await GatewayService.connect();
    await GatewayService.setupMap(6);
    const isCorrect = await GatewayService.solve();

    if (isCorrect !== 1) {
        GatewayService.reset();
        init();
    }
}

if (cluster.isMaster) {
    for (let i = 0; i < 1; i++) {
        cluster.fork();
    }

    cluster.on('exit', () => {
        cluster.fork();
    });
} else {
    init();
}
