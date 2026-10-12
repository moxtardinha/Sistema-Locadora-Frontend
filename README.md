# Frontend: Sistema Locadora

Interface web para gerenciar carros, clientes e aluguéis de uma locadora. Consome a API do backend (Express + MySQL) e foi pensada para uso interno na intranet da empresa.

## Tecnologias

| Item | Uso |
|---|---|
| React (JSX) | Interface |
| Bootstrap 5 | Layout e componentes (tabelas, cards, modais, formulários) |
| React Router (`react-router-dom`) | Navegação entre páginas |
| `fetch` | Requisições à API |
| Axios | Requisições à API |

## Instalação e execução

```bash
npm install
npm install bootstrap react-router-dom
npm run dev
```

O backend precisa estar rodando em `http://localhost:5000`, com o CORS liberando a origem do front e os cabeçalhos `Content-Type` e `Authorization`.

## Estrutura de arquivos

```
src/
├── components/
│   ├── Header.jsx      # Barra de navegação
│   ├── Dashboard.jsx   # Visão geral
│   ├── Carros.jsx      # Gerenciamento de carros
│   ├── Alugueis.jsx    # Gerenciamento de aluguéis
│   └── Clientes.jsx    # Gerenciamento de clientes
└── styles/
    └── Dashboard.css   # Fundo em gradiente das páginas
```

> Os imports usam `./Header` e `../styles/Dashboard.css`. Se a sua estrutura for diferente, ajuste os caminhos.

## Rotas do front

| Caminho | Página |
|---|---|
| `/` | Dashboard |
| `/carros` | Carros |
| `/alugueis` | Aluguéis |
| `/clientes` | Clientes |
| `/login` | Login (fora do escopo desta documentação) |

## Autenticação

- O token JWT fica no `localStorage`, na chave `token`.
- Toda requisição envia o token no header:

```js
headers: { Authorization: "Bearer " + localStorage.getItem("token") }
```

- O token vai no header, e não no body, porque o `fetch` não permite body em requisições `GET`.
- O botão **Sair** do Header remove o token e redireciona para `/login`.
- O backend valida o token com o middleware `authCheck`. Token ausente, inválido ou expirado retorna `401`.

## Comunicação com a API

Todas as páginas de gerenciamento usam a mesma função `requisicao(url, method, body)`:

- Adiciona o header `Authorization`.
- Envia o body como JSON quando existe.
- Lê a resposta como texto antes de converter, então uma resposta que não é JSON (por exemplo, uma página de erro 404) gera uma mensagem clara com status, método e URL, em vez de quebrar.
- Lança um erro com `json.message` quando o status não é 2xx, e a página exibe a mensagem em um alerta.

### Endpoints utilizados

As URLs ficam em constantes no topo de cada arquivo.

| Ação | Método | URL | Confirmada |
|---|---|---|---|
| Listar carros | GET | `/carros/listar` | Sim |
| Listar aluguéis | GET | `/alugueis/listar` | Sim |
| Listar clientes | GET | `/clientes/listar` | Sim |
| Cadastrar carro | POST | `/carros/inserir` | Ajustar |
| Buscar carro | GET | `/carros/buscar/:placa` | Ajustar |
| Excluir carro | DELETE | `/carros/deletar/:placa` | Ajustar |
| Registrar aluguel | POST | `/alugueis/criar` | Ajustar |
| Desativar aluguel | PUT | `/alugueis/desativar` | Ajustar |
| Cadastrar cliente | POST | `/clientes/criar` | Ajustar |
| Buscar cliente | GET | `/clientes/buscar/:cpf` | Ajustar |
| Excluir cliente | DELETE | `/clientes/deletar/:cpf` | Ajustar |

Base: `http://localhost:5000`. As linhas marcadas como "Ajustar" foram assumidas e precisam ser conferidas com o arquivo de rotas do backend.

### Formatos de resposta tratados

| Endpoint | Formato | Tratamento no front |
|---|---|---|
| Listar carros | `{ query: [...] }` | `json.query` |
| Listar aluguéis | `[...]` | usado direto |
| Listar clientes | `[rows, fields]` (ou `[...]` se o backend for corrigido) | `Array.isArray(json[0]) ? json[0] : json` |

## Páginas

### Header
Barra de navegação com links para Dashboard, Carros, Aluguéis e Clientes, e botão **Sair**. Em telas pequenas o menu vira um botão que abre e fecha.

### Dashboard
- **Cards:** total de carros, total de clientes, aluguéis ativos e receita dos aluguéis ativos.
- **Tabelas:** aluguéis, carros e clientes, somente leitura.
- Os dados são carregados em paralelo (`Promise.all`) ao abrir a página.

### Carros
- **Formulário de cadastro:** modelo, categoria, complementos e placa (7 caracteres, convertida para maiúsculas).
- **Tabela** com filtro por placa, modelo ou categoria.
- **Ações por linha:**
  - **Detalhes:** abre um modal com os dados do carro.
  - **Excluir:** pede confirmação antes de apagar.

### Aluguéis
- **Formulário de novo aluguel:**
  - Combobox de **cliente** (nome e CPF) e de **carro** (modelo, placa e categoria), preenchidos pelas listagens da API para evitar erro de digitação de ID.
  - O combobox de carro mostra **apenas carros sem aluguel ativo**.
  - Datas com validação: início não pode ser no passado e fim não pode ser antes do início.
  - O **total é calculado automaticamente** (diária × dias, mínimo de 1 dia).
  - Senha do cliente para confirmar o aluguel.
  - O botão só habilita com todos os campos válidos.
- **Tabela** com filtro por status (todos, ativos, encerrados) e busca por cliente, CPF, placa ou modelo.
- **Ações por linha:**
  - **Detalhes:** modal com cliente, carro, período e valores.
  - **Desativar:** modal que pede a senha do cliente, habilitado apenas para aluguéis ativos.
- O `id_cliente` usado ao desativar é encontrado pelo CPF do aluguel na lista de clientes.

### Clientes
- **Formulário de cadastro:** nome, CPF (11 dígitos), CNH (11 dígitos), senha e confirmação de senha.
  - Os campos de CPF e CNH aceitam só números.
  - A confirmação de senha é conferida no front e **não é enviada** ao backend.
  - Há um botão para mostrar ou ocultar as senhas.
- **Tabela** com filtro por nome, CPF ou CNH.
- **Ações por linha:**
  - **Detalhes:** modal com os dados do cliente.
  - **Excluir:** modal de confirmação.

## Validações no front

Servem para evitar erros e espelham as do backend, mas **não substituem** a validação do servidor.

| Campo | Regra |
|---|---|
| Nome | Mínimo de 3 caracteres |
| CPF e CNH | Exatamente 11 dígitos numéricos |
| Senha | Mínimo de 5 caracteres, igual à confirmação |
| Placa | 7 caracteres, em maiúsculas |
| Datas do aluguel | Início a partir de hoje, fim não anterior ao início |
