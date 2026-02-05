import * as fs from 'fs';
import * as path from 'path';

export default async function () {
    const envPath = path.join(__dirname, 'test-env.json');
    if (fs.existsSync(envPath)) {
        const testEnv = JSON.parse(fs.readFileSync(envPath, 'utf-8'));

        if (testEnv.pid) {
            console.log('\nStopping Cloudflare Worker...');
            try {
                // process.kill(-testEnv.pid) if we used detached: true and want to kill process group?
                // But on Windows/Mac simple kill might assume pid.
                // With 'detached: true', on non-Windows, we might need to kill the process group.
                // But let's try standard kill first.
                try {
                    process.kill(testEnv.pid, 'SIGTERM');
                } catch (e) {
                    // might have already exited
                }

                // If it was a shell spawn (npx), the pid might be the shell, not wrangler.
                // Using 'detached: true' allows us to kill the group with negative PID on *nix.
                if (process.platform !== 'win32') {
                    try {
                        process.kill(-testEnv.pid, 'SIGTERM');
                    } catch (e) {
                        // ignore
                    }
                }
            } catch (e) {
                console.error('Error stopping worker:', e);
            }
        }

        fs.unlinkSync(envPath);
    }
}
