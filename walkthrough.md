# Walkthrough do Projeto Monorepo: Notícia Toda Hora (Jornalismo de Campo)

## Funcionalidade de Notificação por E-mail Implementada

Foi adicionado um serviço automatizado de disparo transacional de e-mails (`email.service.ts`) no backend Node.js.

Sempre que o jornalista clica em **"🚀 Enviar Notícia à Redação"**, o backend processa o relato e dispara um e-mail formatado em HTML diretamente para **`matheuspvilasboas@gmail.com`**.

### Conteúdo do E-mail Enviado:
1. 📻 **Roteiro para o Locutor no Ar (Rádio)**:
   - Título do boletim em destaque.
   - Roteiro pronto em linguagem falada, direto e dinâmico.
   - Duração estimada de locução em segundos (ex: 45s).
2. 📰 **Matéria Formata para o Portal Web**:
   - Título jornalístico e Lead.
   - Corpo completo da matéria formatado em Markdown.
   - Legenda da foto e Tags.
3. 📍 **Localização e Endereço**:
   - Endereço e cidade do fato capturados pelo GPS.
4. 🎙️ **Links das Mídias Originais**:
   - Links diretos para ouvir o áudio gravado e visualizar a foto enviada.

---

## Estrutura Atualizada do Monorepo

```
noticiatodahora/
├── package.json
└── apps/
    ├── backend/               # Node.js API
    │   └── src/
    │       ├── services/
    │       │   ├── email.service.ts     # Envio de e-mail (Resend API / SMTP / Log)
    │       │   ├── geocoding.service.ts # Reverse Geocode via OpenStreetMap
    │       │   ├── groqSTT.service.ts   # Transcrição de Áudio (Groq Whisper v3)
    │       │   ├── geminiLLM.service.ts # Geração de Matéria Portal + Roteiro Rádio
    │       │   ├── r2Storage.service.ts # Storage de Mídia Cloudflare R2
    │       │   └── supabase.service.ts  # Persistência no Banco PostgreSQL
    │       └── controllers/
    │           └── report.controller.ts # Orquestrador com disparo de e-mail
    │
    └── frontend/              # Angular Mobile PWA
        └── src/
            └── app/
                ├── services/
                │   ├── location.service.ts  # GPS com geocodificação reversa de cidade/bairro
                │   └── offline-queue.service.ts # Fila offline IndexedDB (Dexie.js)
                └── components/
                    └── report-form/report-form.ts # Formulário com nomes de seções atualizados
```

---

## Validação de Compilação
- **Backend Build (`npm run build:backend`)**: Exit Code 0.
- **Frontend Build (`npm run build:frontend`)**: Exit Code 0.
