import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let rootDir = process.cwd();
while (rootDir && !fs.existsSync(path.join(rootDir, 'vercel.json')) && path.dirname(rootDir) !== rootDir) {
  rootDir = path.dirname(rootDir);
}

console.log('🚀 [Build Orchestrator] Iniciando compilação do monorepo em:', rootDir);

const backendDir = path.join(rootDir, 'apps/backend');
const frontendDir = path.join(rootDir, 'apps/frontend');
const distDir = path.join(rootDir, 'apps/frontend/dist/frontend/browser');
const publicDir = path.join(rootDir, 'public');

// 1. Build backend TypeScript
console.log('📦 [1/3] Compilando Backend TypeScript...');
execSync('npx tsc', { cwd: backendDir, stdio: 'inherit' });

// 2. Build frontend Angular PWA
console.log('🎨 [2/3] Compilando Frontend Angular PWA...');
execSync('npx ng build --configuration production', { cwd: frontendDir, stdio: 'inherit' });

// 3. Copy frontend dist to root public
console.log('📂 [3/3] Copiando bundle para a pasta public...');
fs.mkdirSync(publicDir, { recursive: true });
if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, publicDir, { recursive: true });
  console.log('✅ Build concluído com sucesso! Pasta public populada com index.html.');
} else {
  console.error('❌ Erro: Diretório dist não encontrado em:', distDir);
  process.exit(1);
}
