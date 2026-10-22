<h1>📜 Changelog - Skyrim Dynamic Music</h1>

<p class="subtitle">Todas as mudanças notáveis do <strong>Skyrim Dynamic Music</strong> estão documentadas aqui.</p>

<div id="versao-1-8-0">
        <h2>🚀 [1.8.0] - A Grande Atualização Visual & Estabilidade</h2>
        <h3>✨ Adicionado</h3>
        <ul>
            <li><strong>Pop-up Visual de Música em 3D:</strong> Implementação completa de notificação visual imersiva e nativa usando renderização de Entidade. Não sequestra a Action Bar do jogo.</li>
            <li><strong>Configurações por Subpacks (Slider):</strong> Agora é possível escolher entre o design Padrão (Painel Escuro) ou Minimalista (Texto Flutuante Transparente) através da engrenagem do Resource Pack, semelhante ao Actions & Stuff.</li>
            <li><strong>Comandos de Chat Interativos:</strong> Adicionado suporte nativo aos comandos <code>!musica</code>, <code>!music</code> e <code>!np</code>. Digite-os no chat para o addon informar privadamente qual faixa está tocando.</li>
            <li><strong>Limpeza de Órfãos (Garbage Collection):</strong> Sistema robusto que varre e limpa placas/pop-ups soltos ao reiniciar o mundo (<code>/reload</code>) ou quando o jogador sai, evitando "fantasmas" visuais.</li>
        </ul>
        <h3>🔄 Modificado</h3>
        <ul>
            <li><strong>Fluidez Musical (Menu de Config):</strong> Salvar as opções no <em>Livro de Configuração</em> não reseta mais a música bruscamente. Agora suas alterações são aplicadas graciosamente na próxima transição, permitindo que a orquestra flua sem interrupções.</li>
            <li><strong>Receita de Crafting:</strong> O Livro de Configurações agora requer <strong>1 Livro + 1 Bloco Musical</strong> (Note Block), fazendo muito mais sentido temático com o mod.</li>
            <li><strong>Refatoração para API 1.21.40:</strong> Remoção completa de sintaxes depreciadas e componentes incompatíveis. O código agora apresenta zero logs e avisos nativos.</li>
        </ul>
        <h3>🐛 Corrigido</h3>
        <ul>
            <li>Bugs de persistência de iteradores de memória na contagem de jogadores online (prevenção do erro de mapeamento usando Array.from).</li>
            <li>Resolução do problema de <em>billboarding</em> do texto da nameTag que ficava descentralizado da geometria personalizada.</li>
        </ul>
</div>

<hr />

<p class="footer">Skyrim vibes. Minecraft forever.</p>
