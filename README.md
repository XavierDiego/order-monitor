# Order Monitor

Aplicativo mobile de monitoramento de pedidos em tempo real, feito com React Native + Expo.

---

## Como rodar o projeto

### Pré-requisitos

Você vai precisar ter instalado na sua máquina:

- [Node.js v22](https://nodejs.org/) via [nvm](https://github.com/nvm-sh/nvm)
- [Git](https://git-scm.com/)

---

### Passo 1 — Baixar o projeto

```bash
git clone https://github.com/XavierDiego/order-monitor.git
cd order-monitor
```

---

### Passo 2 — Ativar a versão correta do Node

```bash
nvm use v22.13.0
```

> Se aparecer o erro "version not found", rode antes: `nvm install v22.13.0`

---

### Passo 3 — Instalar as dependências

```bash
npm install
```
---

### Passo 4 — Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env-example .env
```

---

### Passo 5 — Subir o front-end

```bash
nvm use v22.13.0
npm run dev
```

---

### Passo 6 - Rodar o back-end

```bash
nvm use v22.13.0
npm run server
```
---

### Passo 7 (OPCIONAL) - Para rodar o mock

```bash
nvm use v22.13.0
npm run mock
```