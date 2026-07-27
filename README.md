# API Transporte de Pacientes

API REST em NestJS + TypeScript + Prisma + PostgreSQL baseada no esquema lógico de viagens, veículos, motoristas, pessoas e cidades.

## O que tem no projeto

- NestJS com Express por baixo
- PostgreSQL via Docker Compose
- Prisma ORM
- Validação global com `class-validator` e `ValidationPipe`
- Swagger em `/docs`
- Entidade `Pessoa` unificando paciente e acompanhante
- Relação 1:1 entre o usuário `OPERADOR` e o seu cadastro de motorista
- Histórico de pessoa/paciente
- Consulta de viagens por motorista e veículo
- Alerta de habilitação vencendo
- Seed opcional com dados de exemplo

## Rodando com Docker

```bash
cp .env.example .env
docker compose up --build
```

A API fica em:

```text
http://localhost:3000/api
```

Swagger:

```text
http://localhost:3000/docs
```

Health check publico:

```text
http://localhost:3000/api/health
```

## Autenticacao e front web

Faça login em:

```text
POST /api/auth/login
```

Corpo:

```json
{
  "email": "admin@local.com",
  "password": "admin123"
}
```

Crie o admin inicial antes do primeiro login:

```bash
ADMIN_EMAIL=admin@local.com ADMIN_PASSWORD=troque-essa-senha npm run admin:create
```

A resposta retorna `accessToken`. Todos os demais endpoints em `/api` exigem:

```http
Authorization: Bearer accessToken
```

Configure no `.env`:

```env
JWT_SECRET="gere-um-segredo-forte-e-longo"
JWT_EXPIRES_IN="8h"
CORS_ORIGINS="http://localhost:5173,https://seu-front.com"
ADMIN_EMAIL="admin@local.com"
ADMIN_PASSWORD="troque-essa-senha"
```

Em producao (`NODE_ENV=production`), a API nao sobe sem `JWT_SECRET` e `CORS_ORIGINS`.
O Swagger em `/docs` fica desabilitado em producao, exceto se `ENABLE_SWAGGER=true`.

## Deploy gratuito (Render + Neon)

O banco PostgreSQL deve ser criado no Neon e a API publicada no Render a partir
do repositorio GitHub. Nunca envie o arquivo `.env` ao GitHub: cadastre os
valores sensiveis como variaveis de ambiente no Render.

Variaveis obrigatorias em producao:

```env
NODE_ENV=production
DATABASE_URL=postgresql://... # Secret: URL fornecida pelo Neon, com SSL
JWT_SECRET=...                # Secret: ao menos 32 caracteres aleatorios
JWT_EXPIRES_IN=8h
CORS_ORIGINS=https://seu-frontend.exemplo
ENABLE_SWAGGER=false
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=...            # Secret: senha forte e exclusiva
```

No Render, publique como **Web Service** usando o runtime **Docker** e o
`Dockerfile` da raiz do repositorio. Configure o health check HTTP em
`/api/health`. O Render fornece a porta pela variavel `PORT`; nao defina um
valor fixo para ela. O container aplica somente migrations ja versionadas com
`prisma migrate deploy` antes de iniciar a API. Em seguida, cria o primeiro
administrador a partir de `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
Se o email ja existir, ele nao altera a senha nem as permissoes do usuario.

Para criar uma migration futura, gere e versione-a localmente antes do deploy:

```bash
npx prisma migrate dev --name descricao_da_alteracao
git add prisma/migrations prisma/schema.prisma
git commit -m "chore: adiciona migrations"
```

## Controle de acesso por role

A API possui duas roles:

- `ADMIN`: acesso a todos os endpoints, incluindo o gerenciamento de usuarios.
- `OPERADOR`: acesso aos recursos operacionais, mas sem acesso ao gerenciamento de usuarios.

### Endpoints publicos

Nao exigem token:

| Metodo | Endpoint                | Acesso                                     | Descricao                              |
| ------ | ----------------------- | ------------------------------------------ | -------------------------------------- |
| `POST` | `/api/auth/login`       | Publico, somente credenciais de `OPERADOR` | Login do aplicativo operacional        |
| `POST` | `/api/auth/admin/login` | Publico, somente credenciais de `ADMIN`    | Login exclusivo do site administrativo |

O endpoint `/api/auth/admin/login` retorna `401 Unauthorized` quando as
credenciais pertencem a um usuario que nao possui a role `ADMIN`.
Da mesma forma, `/api/auth/login` retorna `401 Unauthorized` quando as
credenciais pertencem a um usuario que nao possui a role `OPERADOR`.

### Endpoints autenticados

Exigem o cabecalho `Authorization: Bearer accessToken`:

| Endpoints                    | `ADMIN` | `OPERADOR` |
| ---------------------------- | :-----: | :--------: |
| `GET /api/auth/me`           |   Sim   |    Sim     |
| `/api/pessoas`               |   Sim   |    Sim     |
| `/api/veiculos`              |   Sim   |    Sim     |
| Leitura em `/api/motoristas` |   Sim   |    Sim     |
| Escrita em `/api/motoristas` |   Sim   |    Não     |
| `/api/cidades`               |   Sim   |    Sim     |
| `/api/viagens`               |   Sim   |    Sim     |
| `/api/dashboard`             |   Sim   |    Sim     |
| `/api/usuarios`              |   Sim   |    Nao     |

Nos recursos que possuem permissões diferentes por operação, a tabela indica a
exceção: somente `ADMIN` altera motoristas; e somente `OPERADOR` cria viagens,
pois o motorista é definido pelo usuário logado. Consultas e as demais
operações de `/api/viagens` continuam disponíveis para as duas roles.

Endpoints de usuarios, exclusivos para `ADMIN`:

```text
POST  /api/usuarios
GET   /api/usuarios
GET   /api/usuarios/:id
PATCH /api/usuarios/:id
PATCH /api/usuarios/:id/senha
```

Respostas relacionadas a autenticacao e autorizacao:

- `401 Unauthorized`: token ausente, invalido ou expirado; credenciais invalidas;
  ou tentativa de usar um endpoint de login com uma role nao permitida.
- `403 Forbidden`: usuario autenticado, mas sem permissao para acessar o recurso.

PgAdmin:

```text
http://localhost:5050
email: admin@local.com
senha: admin
```

## Rodando localmente sem container da API

Suba apenas o banco:

```bash
docker compose up postgres -d
npm install
npx prisma migrate dev --name init
npm run admin:create
npm run prisma:seed # opcional, cria dados de exemplo
npm run start:dev
```

## Principais endpoints

### Pessoas

```text
POST   /api/pessoas
GET    /api/pessoas
GET    /api/pessoas/:id
GET    /api/pessoas/:id/historico
PATCH  /api/pessoas/:id
DELETE /api/pessoas/:id
```

### Veículos

```text
POST   /api/veiculos
GET    /api/veiculos
GET    /api/veiculos/:id
PATCH  /api/veiculos/:id
DELETE /api/veiculos/:id
```

### Motoristas

```text
POST   /api/motoristas
GET    /api/motoristas
GET    /api/motoristas/:id
GET    /api/motoristas/alertas/habilitacoes-vencendo?dias=30
PATCH  /api/motoristas/:id
PATCH  /api/motoristas/:id/usuario
DELETE /api/motoristas/:id
```

### Cidades

```text
POST   /api/cidades
GET    /api/cidades
GET    /api/cidades/:id
PATCH  /api/cidades/:id
DELETE /api/cidades/:id
```

### Viagens

```text
POST   /api/viagens
GET    /api/viagens
GET    /api/viagens/:id
GET    /api/viagens/motorista/:motoristaId
GET    /api/viagens/veiculo/:veiculoId
PATCH  /api/viagens/:id
DELETE /api/viagens/:id
```

`POST /api/viagens` é exclusivo do operador. O motorista é identificado pelo
token do usuário autenticado; portanto, o corpo da requisição não recebe
`motoristaId`. A cidade de origem é sempre **Marizópolis/PB** e também não é
enviada no corpo da requisição.

## Cadastro do operador e motorista

Ao criar um usuário `OPERADOR`, envie seus dados de motorista no mesmo
cadastro. A API cria os dois registros vinculados e mantém o nome sincronizado.

```json
{
  "nome": "Maria Motorista",
  "email": "maria.motorista@exemplo.com",
  "password": "senha-segura",
  "role": "OPERADOR",
  "motorista": {
    "cpf": "12345678901",
    "endereco": "Rua A, 100",
    "renach": "PB1234567",
    "validadeHabilitacao": "2027-12-31",
    "tipoHabilitacao": "D",
    "tipoVinculo": "EFETIVO"
  }
}
```

Para bases que já tinham motoristas sem vínculo, o administrador pode associar
um registro existente com `PATCH /api/motoristas/:id/usuario` e o corpo
`{ "usuarioId": 123 }`.

### Dashboard

```text
GET /api/dashboard
GET /api/dashboard/metricas
```

`GET /api/dashboard` retorna os totais de viagens, passageiros e veículos, a
quantidade de motoristas em viagem (viagens sem `dataEntrada`) e a quantidade
de viagens por cidade de destino. `GET /api/dashboard/metricas` retorna somente os quatro
totais numéricos. As duas rotas aceitam `dataInicio` e `dataFim` (datas ISO,
inclusivas) para filtrar as viagens por `dataSaida`, por exemplo:

```text
GET /api/dashboard?dataInicio=2026-05-01&dataFim=2026-05-31
```

Quando há filtro de período, `totalMotoristasAtivos` é a quantidade de
motoristas distintos que realizaram viagem no intervalo, e `totalVeiculos` é
a quantidade de veículos distintos utilizados nesse intervalo.

## Exemplo de criação de viagem

```json
{
  "veiculoId": 1,
  "cidadeDestinoId": 2,
  "dataSaida": "2026-06-20T05:30:00.000Z",
  "dataEntrada": "2026-06-20T21:00:00.000Z",
  "observacao": "Consulta especializada",
  "pessoas": [
    {
      "pessoaId": 1,
      "tipoParticipacao": "PACIENTE"
    },
    {
      "pessoaId": 2,
      "tipoParticipacao": "ACOMPANHANTE"
    }
  ]
}
```

## Modelo lógico resumido

- `Pessoa`: guarda dados comuns de paciente e acompanhante.
- `ViagemPessoa`: define se a pessoa participou como `PACIENTE` ou `ACOMPANHANTE`.
- `Viagem`: concentra motorista, veículo, origem, destino, saída, entrada e participantes.
- `Motorista`: é o perfil 1:1 de um usuário `OPERADOR`, guarda CNH/RENACH/vínculo e permite alerta de validade.
- `Veiculo`: guarda placa, RENAVAM, ano e se é próprio ou locado.
- `Cidade`: origem e destino das viagens.
