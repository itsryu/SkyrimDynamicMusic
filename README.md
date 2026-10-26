# 🎵 Skyrim Dynamic Music

Add-on para **Minecraft Bedrock** que substitui a trilha sonora do jogo pela música de **The Elder Scrolls V: Skyrim**, escolhida de acordo com o que o jogador está vivendo: exploração, noite, chuva, cavernas, vilas, combate e chefes. · _Add-on that replaces Minecraft's soundtrack with Skyrim's, chosen dynamically from the player's situation._

## Requisitos · Requirements

- Minecraft Bedrock **1.26.50** ou superior · or newer
- Script API estável: `@minecraft/server` **2.10.0**, `@minecraft/server-ui` **2.2.0** (sem _Beta APIs_, conquistas continuam habilitadas · no Beta APIs, achievements stay enabled)

## Instalação · Installation

1. Baixe o `.mcaddon` e abra-o para importar no Minecraft. · Download and open the `.mcaddon`.
2. Ative **os dois pacotes** (Behavior + Resources) no mundo. · Enable both packs in your world.
3. Pegue o **Livro de Configuração** (entregue no primeiro login; receita: Livro + Bloco Musical).

## Experiência sonora · Soundtrack behaviour

| Situação                                     | Comportamento                                                   |
| -------------------------------------------- | --------------------------------------------------------------- |
| Exploração, noite, chuva, tempestade, neve   | Faixas ambientes; a música em curso termina antes de trocar     |
| Vila, caverna, caverna profunda, Nether, End | Entrada corta a faixa atual com _crossfade_                     |
| Combate e chefes                             | Interrompem de imediato e encadeiam faixas sem pausa            |
| Fim de uma faixa                             | Silêncio com vento/atmosfera (15–45 s por padrão, configurável) |
| Saída de combate/caverna/vila                | Histerese de 5 s e silêncio de liberação antes de voltar        |
| Repetição                                    | _Shuffle bag_: toda faixa toca antes de qualquer repetição      |

## Comandos · Commands

| Comando       | Ação                        |
| ------------- | --------------------------- |
| `/sdm:np`     | Mostra a faixa atual        |
| `/sdm:skip`   | Pula para a próxima faixa   |
| `/sdm:config` | Abre o menu de configuração |

O menu controla volume de música/atmosfera, música de combate, pop-up de faixa e **frequência das músicas** (frequente / normal / rara). Configurações são salvas por jogador e migradas automaticamente da versão 1.x.

## Desenvolvimento · Development

```bash
npm install
npm run check   # formatação, lint, tipos (JSDoc) e testes
npm run build   # gera dist/SkyrimDynamicMusic-vX.Y.Z.mcaddon
```

Arquitetura, decisões e como adicionar faixas: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Histórico: [`CHANGELOG.md`](CHANGELOG.md).

Os arquivos `.ogg` não ficam no repositório (`.gitignore`); coloque-os em `SDM_RP/sounds/music/skyrim/` com os nomes de `sound_definitions.json`.

## Licença · License

MIT — veja [`LICENSE`](LICENSE). A trilha sonora de Skyrim pertence aos seus detentores; este projeto não distribui os áudios.
