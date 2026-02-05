import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

export default async function () {
    console.log('\nStarting Cloudflare Worker for testing...');

    const port = 8788;
    const logStream = fs.openSync(path.join(__dirname, 'wrangler.log'), 'a');

    const child = spawn('npx', ['wrangler', 'dev', '--env', 'development', '--port', String(port)], {
        shell: true,
        detached: true, // Allows the child to run independently so we can kill it properly
        stdio: ['ignore', logStream, logStream],
    });

    // Store the PID and Port so teardown can access it
    const testEnv = {
        pid: child.pid,
        port: port,
        baseUrl: `http://127.0.0.1:${port}/api/v1`
    };

    fs.writeFileSync(path.join(__dirname, 'test-env.json'), JSON.stringify(testEnv));

    // Wait for the server to be ready
    await waitForServer(port);

    console.log(`\nCloudflare Worker started on port ${port}`);
}

async function waitForServer(port: number, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await new Promise<void>((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(500);
                socket.on('connect', () => {
                    socket.end();
                    resolve();
                });
                socket.on('timeout', () => {
                    socket.destroy();
                    reject();
                });
                socket.on('error', (err) => {
                    socket.destroy();
                    reject(err);
                });
                socket.connect(port, '127.0.0.1');
            });
            return;
        } catch (e) {
            await new Promise(r => setTimeout(r, 500));
        }
    }
    throw new Error(`Server did not start within ${timeout}ms`);
}
