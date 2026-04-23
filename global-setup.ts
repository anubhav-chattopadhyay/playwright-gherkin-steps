import dotenv from 'dotenv';
import path from 'path';

async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

export default globalSetup;
