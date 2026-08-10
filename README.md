# Dungeon World — Ficha White Label

Aplicação web/PWA baseada no projeto `Zyvens/RPG-Dungeon-World`, reconstruída como uma ficha genérica e personalizável para personagens de Dungeon World, agora publicada como site estático no **GitHub Pages** e sincronizada diretamente com **Neon Auth + Neon Data API**.

## O que o projeto oferece

- Nenhuma referência a Kael Frostborn no estado inicial.
- Construção orientada por classe, raça/origem, alinhamento e regras específicas da classe.
- Classes disponíveis conforme o manual utilizado no projeto: Bardo, Bárbaro, Clérigo, Druida, Engenheiro Arcano, Guerreiro, Ladrão, Mago, Paladino e Ranger.
- White label: cores, fundo, retrato, escala de fonte, transparência dos painéis e identidade da campanha/personagem.
- Inventário com peso/quantidade e cálculo automático de carga.
- Personagens/NPCs, história e anotações ricas.
- Conta por jogador com Neon Auth.
- Ficha individual sincronizada pelo Neon.
- **Gameplay compartilhado** com código de sala, PIN, mapa, grade, bonecos/tokens e participantes online.
- PWA instalável e preparada para o caminho de projeto do GitHub Pages.

## GitHub Pages

O deploy é feito pelo workflow `.github/workflows/pages.yml`. Para a primeira publicação, abra no GitHub:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

Depois disso, cada `push` em `main` publica automaticamente a versão atual do repositório.

Endereço esperado deste repositório:

`https://zyvens.github.io/Dungeon-World/`

O Gameplay também pode ser aberto diretamente em:

`https://zyvens.github.io/Dungeon-World/gameplay.html`

Não há Vercel, função serverless própria nem `DATABASE_URL` no GitHub Pages.

## Neon: autenticação e persistência

O projeto Neon utilizado é `dungeon-world`. O navegador usa somente os endpoints públicos do **Neon Auth** e da **Neon Data API** definidos em `config.js`; a connection string administrativa do Postgres não é publicada no repositório.

A Data API valida o JWT emitido pelo Neon Auth. As tabelas internas têm RLS habilitado e acesso direto revogado para clientes. O navegador executa apenas as funções RPC liberadas especificamente para as operações da ficha e do Gameplay.

A ficha individual continua usando uma chave de edição própria. O adaptador `github-pages-adapter.js` preserva a interface já usada por `app.js`, mas encaminha as operações ao Neon Data API em vez de depender de um backend da hospedagem.

## Gameplay compartilhado

Cada partida possui um **código de 8 caracteres** e um **PIN de 4 a 8 dígitos**. O criador entra automaticamente. Uma nova conta informa código + PIN uma vez; após a validação, essa conta passa a ser membro daquela partida.

Todos os membros da mesma partida enxergam o mesmo:

- mapa e enquadramento;
- grade e tamanho da grade;
- lista de bonecos/tokens;
- imagens, nomes, cores e tamanhos dos tokens;
- posições dos tokens;
- título da partida;
- lista aproximada de participantes online.

Qualquer membro da partida pode mover os bonecos. Durante o arraste, a posição é enviada de forma limitada para evitar excesso de requisições e confirmada novamente ao soltar. Os demais navegadores consultam versões leves do estado em intervalos curtos e baixam somente a parte que mudou. Na prática, o tabuleiro converge normalmente em cerca de **um segundo**, dependendo da rede.

O link compartilhado contém o código da partida (`?game=...`), mas não inclui o PIN. Recomenda-se enviar o PIN separadamente.

## Estrutura de sincronização

O banco usa três estruturas principais para o Gameplay:

- `gameplay_sessions`: estado do mapa e contadores de versão;
- `gameplay_members`: contas autorizadas na partida e presença recente;
- `gameplay_tokens`: metadados e coordenadas dos bonecos.

As posições são armazenadas em percentual do tabuleiro, então jogadores em telas de tamanhos diferentes enxergam os tokens no mesmo ponto relativo.

## Referência de regras

Os dados de classe foram modelados a partir dos manuais em PT-BR fornecidos para o projeto. As regras de classe controlam PV máximo, dado de dano, carga, raça/origem disponível, alinhamentos, movimentos iniciais e lista de movimentos avançados.
