import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import net from 'node:net';
import { env } from '../config/env.js';

const execFileAsync = promisify(execFile);

export interface ScanResult {
  clean: boolean;
  threat?: string;
  scanner: 'clamav' | 'none';
  error?: string;
}

/**
 * Scan a file for malware using ClamAV.
 * 
 * Tries ClamAV TCP (clamd) first, then falls back to `clamscan` CLI.
 * If neither is available, returns clean=true with scanner='none'.
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
  // Try clamd TCP connection first (fastest)
  try {
    const result = await scanViaClamd(filePath);
    return result;
  } catch {
    // clamd not available, try CLI
  }

  // Try clamscan CLI
  try {
    const result = await scanViaCli(filePath);
    return result;
  } catch {
    // ClamAV not installed
  }

  // Graceful degradation — no scanner available
  console.warn('[Scan] ClamAV not available — skipping malware scan');
  return { clean: true, scanner: 'none', error: 'ClamAV not available' };
}

/** Scan via clamd TCP socket */
async function scanViaClamd(filePath: string): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let response = '';

    client.setTimeout(10000);

    client.connect(env.clamavPort, env.clamavHost, () => {
      // Use SCAN command (clamd protocol)
      client.write(`SCAN ${filePath}\n`);
    });

    client.on('data', (data) => {
      response += data.toString();
    });

    client.on('end', () => {
      client.destroy();
      if (response.includes('OK')) {
        resolve({ clean: true, scanner: 'clamav' });
      } else if (response.includes('FOUND')) {
        const threat = response.split(':')[1]?.trim().replace(' FOUND', '') || 'Unknown';
        resolve({ clean: false, threat, scanner: 'clamav' });
      } else {
        resolve({ clean: true, scanner: 'clamav', error: `Unexpected response: ${response}` });
      }
    });

    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error('ClamAV timeout'));
    });
  });
}

/** Scan via clamscan CLI */
async function scanViaCli(filePath: string): Promise<ScanResult> {
  try {
    const { stdout } = await execFileAsync('clamscan', ['--no-summary', filePath], {
      timeout: 30000,
    });

    if (stdout.includes('OK')) {
      return { clean: true, scanner: 'clamav' };
    }

    const match = stdout.match(/:\s*(.+)\s*FOUND/);
    const threat = match?.[1]?.trim() || 'Unknown threat';
    return { clean: false, threat, scanner: 'clamav' };
  } catch (err: any) {
    // clamscan returns exit code 1 for infected files
    if (err.code === 1 && err.stdout) {
      const match = err.stdout.match(/:\s*(.+)\s*FOUND/);
      const threat = match?.[1]?.trim() || 'Unknown threat';
      return { clean: false, threat, scanner: 'clamav' };
    }
    throw err;
  }
}
