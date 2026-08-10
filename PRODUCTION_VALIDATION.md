# Validação de Produção — Dungeon World 1.0.0

Data: 2026-08-10

## Status

**APROVADO para produção.**

A release `1.0.0` foi validada antes do merge por GitHub Actions e por testes de integração no Neon. O PR de release foi incorporado em `main` após os checks passarem.

## GitHub Actions

Run de validação final: `31421203597`

Resultado: **success**.

Etapas aprovadas:

- checkout;
- Node 24;
- `node --check` em `classes.js`, `class-rules.js`, `app.js`, `config.js`, `auth.js`, `data-api.js`, `github-pages-adapter.js`, `gameplay.js`, `sw.js` e `scripts/validate.mjs`;
- validação estrutural, de segurança e das regras;
- verificação de disponibilidade do `@neondatabase/neon-js@0.6.2-beta` no CDN;
- smoke test da ficha em Chrome headless;
- smoke test do Gameplay em Chrome headless.

O primeiro candidato usava `0.6.3-beta`; o check de CDN falhou com HTTP 404. A versão inexistente foi substituída por `0.6.2-beta` e todo o pipeline foi executado novamente com sucesso.

## Teste de integração do Neon

Foi executado um teste transacional com duas identidades autenticadas simuladas, com limpeza ao final.

Cenários aprovados:

1. criação de sala com PIN e código de oito caracteres;
2. criação de token e leitura da posição inicial;
3. bloqueio de acesso à sala para uma segunda identidade ainda não associada;
4. rejeição de PIN incorreto;
5. entrada com PIN correto;
6. leitura compartilhada do metadata da sala;
7. movimento do token e leitura da nova posição pela fonte compartilhada;
8. atualização de mapa/grade e avanço dos contadores de versão;
9. criação de ficha com `hpCurrent = 0` e preservação desse valor na leitura;
10. rejeição de chave de edição incorreta;
11. aceitação de chave de edição correta e leitura do estado atualizado;
12. remoção de todos os dados temporários.

Após o teste, não restaram salas nem fichas de integração temporárias.

## Segurança do banco

Validado no banco de produção:

- RLS habilitado em `character_sheets`, `gameplay_sessions`, `gameplay_members` e `gameplay_tokens`;
- papel `authenticated` sem SELECT direto nas tabelas da aplicação;
- papel `authenticated` sem UPDATE direto nas tabelas da aplicação;
- RPCs de ficha/Gameplay executáveis por `authenticated`;
- RPCs de ficha/Gameplay não executáveis pelo papel anônimo.

## Bugs corrigidos

- PV igual a zero era convertido em PV máximo ao normalizar/recarregar a ficha.
- Normalização de ficha importada podia calcular PV com a classe da ficha já aberta, e não com a classe importada.
- HTML de anotações importadas/remotas podia chegar ao `innerHTML` sem sanitização.
- Primeira versão do sanitizador removia a classe visual de spoiler; corrigido preservando somente a classe segura `spoiler`.
- Registro absoluto `/sw.js` era incompatível com GitHub Pages em subdiretório.
- Cliente de autenticação antigo gerenciava token/JWT manualmente; substituído pelo SDK oficial Neon JS.
- Referências e mensagens legadas de Vercel foram eliminadas.
- `pointercancel` durante arraste podia produzir salto de token.
- Cliques repetidos podiam disparar criação/entrada/token duplicados.
- Imagens não tinham validação explícita de MIME/tamanho antes do processamento.
- Polling e gravação de posições eram mais agressivos que o necessário.
- CI anterior validava basicamente sintaxe e não detectava dependência CDN inexistente.
- Workflows ainda usavam Node 20, já sinalizado como depreciado pelo runner; migrados para Node 24.

## Melhorias implementadas

- SDK oficial `@neondatabase/neon-js`, com Auth + Data API no mesmo cliente.
- Polling do Gameplay em aproximadamente 750 ms com aba visível e 3 s em segundo plano.
- Throttle de movimento em 280 ms, com confirmação da posição final ao soltar.
- Reconexão ao recuperar internet/visibilidade.
- PIN de 6 a 8 dígitos para novas salas; entrada continua aceitando 4 a 8 para compatibilidade com salas antigas.
- Metadados de níveis dos movimentos avançados para as 10 classes.
- Bloqueio visual/funcional dos movimentos de níveis 2–5 no nível 1 e dos movimentos de níveis 6–10 antes do nível 6.
- Ranger sinaliza `Meio-Elfo` como opção disponível apenas no primeiro avanço.
- Aviso explícito quando a carga ultrapassa o máximo da classe.
- Backup/importação normalizados e sanitizados.
- PWA com cache versionado `dungeon-world-v1.0.0` e caminhos relativos ao escopo do GitHub Pages.
- Workflow de deploy só publica depois de executar a validação de produção.

## Modelo de sincronização

O Gameplay é **quase em tempo real por polling**, e não por WebSocket. Todos os membros de uma mesma sala leem e gravam o mesmo estado no Neon. A posição dos tokens é persistida em percentual do tabuleiro para manter consistência entre diferentes tamanhos de tela.

Em edição concorrente do mesmo token, a semântica atual é `last write wins`; isso é adequado para a versão 1.0.0, mas não equivale a locking distribuído.

## Release

- Versão: `1.0.0`
- PR de produção: `#4`
- Merge de produção: `790f1a0fc628b3c26eda94c7fcf2b329c5c544ac`
- Branch de produção: `main`

O arquivo `VERSION` é a fonte canônica da versão publicada.
