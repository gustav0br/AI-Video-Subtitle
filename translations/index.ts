export type Language = 'en' | 'pt';

export const translations = {
  en: {
    header: {
      docs: "Documentation"
    },
    hero: {
      poweredBy: "Powered by Gemini 2.5 Multimodal",
      titlePart1: "Video to",
      titleHighlight: "Translated SRT",
      titlePart2: "in seconds.",
      description: "Upload a video file, and our AI will transcribe the audio and generate a perfectly timed, translated subtitle file (Portuguese) ready for use."
    },
    features: {
      dragCheck: "Drag & Drop",
      dragDesc: "Simply drag your video file into the browser. No complex setup required.",
      aiTrans: "AI Translation",
      aiDesc: "Uses advanced multimodal models to understand context and translate accurately.",
      instantDl: "Instant Download",
      instantDesc: "Get a standard .srt file compatible with VLC, YouTube, and Premiere Pro."
    },
    upload: {
      title: "Upload Video",
      supported: "Supported formats: MP4, WebM, MOV (Max 50MB)",
      clickDrag: "Click to upload or drag and drop",
      videoOnly: "Video files only",
      remove: "Remove file",
      searching: "Checking TheSubDB database...",
      generating: "Generating subtitles with AI...",
      disclaimer: "This uses Gemini's multimodal capabilities. It may take a minute.",
      ready: "Subtitle ready!",
      btnStart: "Find or Generate Subtitles",
      btnProcessing: "Processing...",
      btnSearching: "Searching...",
      btnTryAgain: "Try Again",
      errorFile: "Please upload a valid video file.",
      errorSize: "File size is too large for this demo. Please use files under 50MB.",
      errorNotFoundName: "Subtitle not found by name.",
      errorSearchFailed: "Error searching for subtitles.",
      errorNotFoundHash: "Subtitle not found via hash/OpenSubtitles.",
      errorEnglishNotFound: "English subtitle also not found.",
      errorFallbackFailed: "Error during translation fallback.",
      cancelled: "Cancelled",
      btnSearch: "Search",
      placeholderSearch: "Search movie/episode name...",
      or: "OR"
    },
    fallback: {
      title: "Subtitle not found in Portuguese",
      description: "Would you like to search for the English version and translate it automatically?",
      yes: "Yes, Search English & Translate",
      no: "No, cancel"
    },
    translate: {
      title: "Translate SRT",
      supported: "Supported format: .srt",
      clickDrag: "Click to upload or drag and drop",
      srtOnly: "SRT files only",
      remove: "Remove file",
      translating: "Translating subtitles with AI...",
      ready: "Translation ready!",
      btnStart: "Translate Subtitles",
      btnProcessing: "Translating...",
      errorFile: "Please upload a valid .srt file.",
      errorGeneric: "An unknown error occurred.",
      errorTitle: "Error"
    },
    tabs: {
      video: "Video Search & Generate",
      srt: "Translate Existing SRT"
    },
    result: {
      title: "Your Subtitles are Ready",
      btnAnother: "Translate Another",
      btnDownload: "Download .srt",
      preview: "Preview"
    },
    footer: {
      text: "SubGen AI. Built with React & Gemini."
    }
  },
  pt: {
    header: {
      docs: "Documentação"
    },
    hero: {
      poweredBy: "Desenvolvido com Gemini 2.5 Multimodal",
      titlePart1: "Vídeo para",
      titleHighlight: "SRT Traduzido",
      titlePart2: "em segundos.",
      description: "Envie um arquivo de vídeo e nossa IA transcreverá o áudio e gerará um arquivo de legenda traduzido (Português) perfeitamente sincronizado e pronto para uso."
    },
    features: {
      dragCheck: "Arrastar e Soltar",
      dragDesc: "Basta arrastar seu arquivo de vídeo para o navegador. Sem configurações complexas.",
      aiTrans: "Tradução por IA",
      aiDesc: "Usa modelos multimodais avançados para entender o contexto e traduzir com precisão.",
      instantDl: "Download Instantâneo",
      instantDesc: "Obtenha um arquivo .srt padrão compatível com VLC, YouTube e Premiere Pro."
    },
    upload: {
      title: "Enviar Vídeo",
      supported: "Formatos suportados: MP4, WebM, MOV (Máx 50MB)",
      clickDrag: "Clique para enviar ou arraste e solte",
      videoOnly: "Apenas arquivos de vídeo",
      remove: "Remover arquivo",
      searching: "Verificando banco de dados TheSubDB...",
      generating: "Gerando legendas com IA...",
      disclaimer: "Isso usa as capacidades multimodais do Gemini. Pode levar um minuto.",
      ready: "Legenda pronta!",
      btnStart: "Encontrar ou Gerar Legendas",
      btnProcessing: "Processando...",
      btnSearching: "Pesquisando...",
      btnTryAgain: "Tentar Novamente",
      errorFile: "Por favor, envie um arquivo de vídeo válido.",
      errorSize: "O arquivo é muito grande para esta demonstração. Use arquivos menores que 50MB.",
      errorNotFoundName: "Legenda não encontrada pelo nome.",
      errorSearchFailed: "Erro ao buscar legendas.",
      errorNotFoundHash: "Legenda não encontrada via hash/OpenSubtitles.",
      errorEnglishNotFound: "Legenda em inglês também não encontrada.",
      errorFallbackFailed: "Erro durante a tradução alternativa.",
      cancelled: "Cancelado",
      btnSearch: "Pesquisar",
      placeholderSearch: "Nome do filme/episódio...",
      or: "OU"
    },
    fallback: {
      title: "Legenda não encontrada em Português",
      description: "Deseja pesquisar a versão em Inglês e traduzi-la automaticamente?",
      yes: "Sim, Buscar Inglês e Traduzir",
      no: "Não, cancelar"
    },
    translate: {
      title: "Traduzir SRT",
      supported: "Formato suportado: .srt",
      clickDrag: "Clique para enviar ou arraste e solte",
      srtOnly: "Apenas arquivos SRT",
      remove: "Remover arquivo",
      translating: "Traduzindo legendas com IA...",
      ready: "Tradução pronta!",
      btnStart: "Traduzir Legendas",
      btnProcessing: "Traduzindo...",
      errorFile: "Por favor, envie um arquivo .srt válido.",
      errorGeneric: "Ocorreu um erro desconhecido.",
      errorTitle: "Erro"
    },
    tabs: {
      video: "Pesquisar e Gerar (Vídeo)",
      srt: "Traduzir Existente (SRT)"
    },
    result: {
      title: "Suas legendas estão prontas",
      btnAnother: "Traduzir Outro",
      btnDownload: "Baixar .srt",
      preview: "Prévia"
    },
    footer: {
      text: "SubGen AI. Criado com React & Gemini."
    }
  }
};
