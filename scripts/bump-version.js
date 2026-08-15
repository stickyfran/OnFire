import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, '../package.json');
const publicVersionPath = path.resolve(__dirname, '../public/version.json');

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Parse current version as a float (e.g. "1.0" or "1.00")
  let currentVer = parseFloat(pkg.version || "1.00");
  if (isNaN(currentVer) || currentVer < 1.0) {
    currentVer = 1.00;
  }
  
  // Increment by 0.01
  const newVer = (currentVer + 0.01).toFixed(2);
  pkg.version = newVer;
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  
  const versionData = {
    version: `v${newVer}`,
    versionNum: parseFloat(newVer),
    buildTime: new Date().toISOString()
  };
  
  fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`[Version Bump] Bumped from v${currentVer.toFixed(2)} to v${newVer}`);
} catch (err) {
  console.error('[Version Bump Error]', err);
}
