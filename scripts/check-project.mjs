import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = ['package.json','index.html','vite.config.ts','src/main.tsx','src/App.tsx','src/services/api.ts','google-apps-script/Code.gs'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
if (missing.length) { console.error('Missing project files:',missing.join(', ')); process.exitCode=1; }
else { console.log('Project root and required files: OK'); }
