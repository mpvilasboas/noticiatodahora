import fs from 'fs';
import path from 'path';

// Dynamically resolve monorepo root directory containing vercel.json
let rootDir = process.cwd();
while (rootDir && !fs.existsSync(path.join(rootDir, 'vercel.json')) && path.dirname(rootDir) !== rootDir) {
  rootDir = path.dirname(rootDir);
}

const srcDir = path.join(rootDir, 'apps/frontend/dist/frontend/browser');
const destDir = path.join(rootDir, 'public');

fs.mkdirSync(destDir, { recursive: true });

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('✅ Coletados arquivos do frontend para public/ com sucesso!');
} else {
  console.warn('⚠️ Build do frontend ainda não encontrado em:', srcDir);
}
