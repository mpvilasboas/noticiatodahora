import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('apps/frontend/dist/frontend/browser');
const destDir = path.resolve('public');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('✅ Coletados arquivos do frontend para public/ com sucesso!');
} else {
  console.warn('⚠️ Diretório de build do frontend não encontrado em:', srcDir);
}
