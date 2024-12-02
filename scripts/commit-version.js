import * as dotenv from 'dotenv';
import { commitVersion } from '@jezvejs/release-tools';

dotenv.config();

commitVersion({
    versionFiles: [
        'package-lock.json',
        'package.json',
    ],
    gitDir: process.env.PROJECT_GIT_DIR,
});
