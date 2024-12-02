import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { deploy } from '@jezvejs/release-tools';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

dotenv.config();

if (!process.env.SFTP_SERVER) {
    process.exit(0);
}

const run = async () => {
    const processRes = await deploy({
        clientConfig: {
            host: process.env.SFTP_SERVER,
            username: process.env.SFTP_USER,
            password: process.env.SFTP_PASSWORD,
            port: process.env.SFTP_PORT,
        },
        sourceDir: join(currentDir, '..', process.env.SOURCE_DIR),
        destDir: process.env.DEPLOY_PATH,
        appDir: process.env.APP_DIR,
    });

    process.exit(processRes);
};

run();
