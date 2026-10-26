# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [SemVer](https://semver.org/lang/pt-BR/).

## [2.0.0]

### Adicionado

- Modelo de reprodução inspirado em Skyrim: modos que interrompem × modos ambientes, silêncio de liberação, histerese de saída e encadeamento de faixas em combate/chefe.
- _Shuffle bag_ (Fisher–Yates) por modo, sem repetir faixas antes de esgotar a playlist.
- Comandos `/sdm:skip` e `/sdm:config`; configuração de **frequência das músicas**.
- Localização `pt_BR` e `en_US` (mensagens, menu e nome do item) via `texts/*.lang`.
- Detecção de bioma subterrâneo (`deep_dark`, `lush_caves`, `dripstone_caves`) e de terreno nevado mais precisa.
- Testes automatizados (`node:test`), CI, `npm run build` multiplataforma e verificação de tipos por JSDoc.

### Alterado

- Código reorganizado em camadas: `core` (lógica pura), `platform` (API do Minecraft) e `ui`.
- Configurações unificadas em uma propriedade dinâmica (`sdm_settings`) com migração das chaves antigas.
- `Entity.isValid` como propriedade, `Dimension.getWeather()` no lugar de estado global por evento, `world.getAllPlayers()`.
- Menu reabre automaticamente enquanto o jogador estiver com chat/inventário aberto.
- Pop-up: laço por tick só existe enquanto há pop-ups; reposicionamento ignora quadros sem mudança; entidade passa a se autodestruir (`minecraft:timer`) e é invulnerável.
- Livro de Configuração devolvido ao chão se o inventário estiver cheio.
- Catálogo de faixas com fonte única de durações e nomes de exibição.

### Corrigido

- `music_definitions.json`: chave `water` duplicada e eventos `skyrim:music.exploration`/`skyrim:music.water` inexistentes.
- Música de caverna tocando ao nadar em oceano profundo.
- Faixa de combate em _loop_ continuava tocando após o combate com a atmosfera desativada.
- Limpeza de pop-ups órfãos também em _chunks_ carregados depois da inicialização.
- Detecção de aldeões (`villager_v2`).

## [1.8.0]

Pop-up 3D, subpacks de estilo, comandos de chat, coleta de órfãos e refatoração para a API 1.21.40.
