import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

export function getDatabaseConfig() {
  const gitBranch = getGitBranch();
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }
  
  console.error(`🔧 Git Branch: ${gitBranch} → Local Dev Environment`);
  
  const dbInfo = new URL(databaseUrl);
  const dbName = dbInfo.pathname.slice(1);
  const isDevDb = dbName.includes('dev') || databaseUrl.includes('dev');
  console.error(`🗄️  Database: ${dbInfo.hostname}/${dbName} (${isDevDb ? 'DEV' : 'PROD'})`);
  
  return {
    environment: 'development',
    gitBranch: gitBranch,
    databaseUrl: databaseUrl,
    isDevDb: isDevDb
  };
}

export function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}