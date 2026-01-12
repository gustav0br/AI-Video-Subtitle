# SubGen-AI

SubGen-AI é uma aplicação web moderna para buscar, baixar e traduzir legendas de vídeos automaticamente. O projeto combina uma interface React intuitiva com um backend poderoso em Node.js e scripts Python para automação de legendas.

## 🚀 Funcionalidades

- **Busca por Hash**: Identifica o arquivo de vídeo e busca a legenda exata usando o hash do arquivo (precisão máxima).
- **Busca por Nome**: Busca legendas baseadas no nome do arquivo ou termo digitado.
- **Tradução Automática**: Se não houver legenda em Português, o sistema baixa a legenda em Inglês e a traduz automaticamente para PT-BR usando o Google Translate.
- **Correção de Codificação**: Tratamento automático de problemas de encoding (mojibake) para exibir caracteres especiais como "♪" corretamente.
- **Processamento em Lote**: Sistema otimizado para traduzir arquivos SRT inteiros em segundos.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18+** (Vite)
- **TypeScript**
- **Tailwind CSS** (Estilização)
- **Lucide React** (Ícones)

### Backend
- **Node.js** com **Express**
- **Python 3** (Scripts de automação)

### Bibliotecas Python Principais
- `subliminal`: Para busca e download de legendas em provedores como OpenSubtitles, Podnapisi, etc.
- `deep-translator`: Para tradução automatizada de textos.

## 📂 Estrutura do Projeto

```
SubGen-AI/
├── components/          # Componentes React da interface (Upload, Display, etc.)
├── services/            # Serviços TypeScript para comunicação com APIs
├── server/              # Servidor Express (API Backend)
│   └── index.js         # Ponto de entrada do servidor e endpoints
├── python/              # Scripts de processamento e automação
│   ├── search_subtitles.py    # Script de busca via Subliminal
│   └── translate_subtitles.py # Motor de tradução e manipulação de SRT
├── App.tsx              # Componente principal
└── package.json         # Dependências e scripts do projeto
```

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js instalado
- Python 3.x instalado e adicionado ao PATH do sistema

### 1. Instalar Dependências do Node
```bash
npm install
```

### 2. Instalar Dependências do Python
Certifique-se de ter as bibliotecas necessárias:
```bash
pip install subliminal deep-translator
```

## ▶️ Como Executar

Para iniciar o ambiente de desenvolvimento (Frontend + Backend simultaneamente):

```bash
npm run dev
```

Isso iniciará:
- O servidor Backend na porta **3002** (http://localhost:3002)
- O servidor Frontend (Vite) geralmente na porta **5173** (http://localhost:5173)

## 📝 Notas de Desenvolvimento

- **Tradução**: O script `translate_subtitles.py` utiliza agrupamento (batching) para enviar blocos de legendas para tradução, evitando bloqueios de API e acelerando o processo.
- **Busca**: O sistema tenta primeiro a busca exata (hash). Se falhar, permite fallback para busca por nome ou tradução automática de uma legenda em inglês encontrada.

