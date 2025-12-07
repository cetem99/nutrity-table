# Nutrity Table

Backend em Node.js/Express para gerar e salvar tabelas nutricionais com base em JSONs locais do TACO/AGTACO e MongoDB. Inclui autenticação JWT, páginas estáticas em `src/public` e APIs para CRUD de usuários, perfis e tabelas.

## Integrantes
- Lucas Catem Vianna
- Lucas Mendonça
- Humberto Nacimento

## Requisitos
- Node.js 18+ e npm
- MongoDB (URI de conexão)
- Arquivos de dados no diretório raiz: `cmvcol_taco3.json` e `agtaco3.json`

## Configuração
1) Copie o `.env` de exemplo e preencha:
```
PORT=3000
MONGO_URI=coloque_sua_uri_aqui
JWT_SECRET=uma_chave_forte
JWT_EXPIRES=7d
```
2) Instale dependências e rode:
```
npm install
npm start   # produção
npm run dev # desenvolvimento com nodemon
```
O servidor expõe as páginas estáticas em `http://localhost:PORT/` e as APIs em `/api/...`.

## Estrutura rápida
- `src/server.js` – bootstrap do Express, middlewares e rotas.
- `src/config/db.js` – conexão com MongoDB.
- `src/middleware/authMiddleware.js` – validação do JWT (Bearer).
- `src/models` – esquemas `User` e `NutritionTable`.
- `src/controllers` – regras de usuário, perfil e tabelas (inclui busca/enriquecimento via JSON local).
- `src/routes` – rotas REST.
- `src/public` – HTML/CSS/JS da interface.

## Endpoints principais
- `POST /api/users/register` – cria usuário e retorna token.
- `POST /api/users/login` – autentica e retorna token.
- `GET/PUT/DELETE /api/users/profile` – obter/atualizar/remover conta (token obrigatório).
- `GET/PUT/DELETE /api/profile` e `PUT /api/profile/password` – fluxo alternativo de perfil.
- `POST /api/tables` – cria tabela nutricional (gera itens enriquecidos do JSON local).
- `GET /api/tables` – lista tabelas do usuário.
- `GET /api/tables/:id` – obtém tabela por id.
- `PUT /api/tables/:id` – atualiza porção, título, base e itens.
- `DELETE /api/tables/:id` – exclui tabela.
- `GET /api/tables/search-food?query=...` – autocomplete combinando DB e JSON local.
- `GET /api/tables/food?name=...` – retorno normalizado do alimento (JSON local, opcional AGTACO).

Envie o token JWT no cabeçalho `Authorization: Bearer <token>` para rotas protegidas.

## Deploy no Render
- Build command: `npm install`
- Start command: `npm start`
- Vars obrigatórias: `MONGO_URI`, `JWT_SECRET`, opcional `PORT`, `JWT_EXPIRES`.
- Garanta que os arquivos `cmvcol_taco3.json` e `agtaco3.json` estejam no diretório do projeto.
- Em sistemas Linux (Render), respeite a caixa dos arquivos/ imports (`NutritionTable.js`).

## Teste rápido (exemplo cURL)
```
# registrar
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"123456"}'

# login (guarde o token retornado)
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"123456"}'
```
