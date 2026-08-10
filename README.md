# Dungeon World — Ficha White Label

**Versão de produção: 1.0.0**

Aplicação web/PWA baseada no projeto `Zyvens/RPG-Dungeon-World`, reconstruída como ficha genérica e personalizável de Dungeon World. O frontend é publicado no **GitHub Pages** e usa **Neon Auth + Neon Data API** para autenticação e persistência, sem Vercel e sem credencial administrativa no navegador.

## Recursos

- Ficha genérica, sem dados específicos de Kael Frostborn no estado inicial.
- 10 classes: Bardo, Bárbaro, Clérigo, Druida, Engenheiro Arcano, Guerreiro, Ladrão, Mago, Paladino e Ranger.
- Classe, raça/origem/especialização e alinhamento/motivação alteram os textos e regras exibidos.
- PV máximo, dado de dano e carga calculados pelas regras da classe.
- Movimentos avançados separados por disponibilidade de nível 2–5 e 6–10; Ranger sinaliza `Meio-Elfo` como movimento do primeiro avanço.
- White label: cores, fundo, retrato, escala de fonte, transparência dos painéis e nome da campanha.
- Inventário com peso × quantidade e aviso explícito de sobrecarga.
- Personagens/NPCs, vínculos, história e anotações ricas com citação e spoiler.
- Backup/importação com normalização e sanitização de conteúdo.
- Ficha individual com persistência local e sincronização opcional na nuvem.
- **Gameplay compartilhado** com sala, PIN, mapa, grade, tokens e presença aproximada.
- PWA compatível com o subdiretório do GitHub Pages.

## GitHub Pages

O deploy é feito por `.github/workflows/pages.yml`. Antes de publicar, o workflow executa a validação de produção; um build inválido não é enviado ao Pages.

Na primeira ativação do repositório, configure:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

Depois, cada `push` válido em `main` publica automaticamente.

Endereços esperados:

- Ficha: `https://zyvens.github.io/Dungeon-World/`
- Gameplay: `https://zyvens.github.io/Dungeon-World/gameplay.html`

## Neon

O projeto usa os endpoints públicos de Neon Auth e Neon Data API definidos em `config.js`. A aplicação usa o SDK oficial `@neondatabase/neon-js`, com versão fixada no frontend.

A connection string administrativa do Postgres não é publicada. As tabelas de aplicação têm RLS habilitado, sem SELECT/UPDATE direto para clientes autenticados. O navegador acessa somente RPCs liberadas para as operações necessárias.

### Ficha individual

Cada ficha na nuvem recebe um ID e uma chave de edição. A chave completa permanece no fragmento da URL (`#key=...`). Sem chave, alterações são tratadas como locais até o usuário criar uma cópia editável.

## Gameplay compartilhado

Cada partida tem:

- código de 8 caracteres;
- PIN;
- membros vinculados por conta;
- estado compartilhado do mapa;
- tokens compartilhados e suas posições.

**Novas partidas exigem PIN de 6 a 8 dígitos.** A entrada aceita 4 a 8 dígitos para manter compatibilidade com salas anteriores.

O criador entra automaticamente. Uma nova conta informa código + PIN uma vez; depois fica associada à sala. O link compartilhado contém somente o código (`?game=...`), nunca o PIN.

Todos os membros da mesma sala enxergam o mesmo:

- mapa, enquadramento, grade e tamanho da grade;
- título da partida;
- lista, imagens, nomes, cores e tamanhos dos tokens;
- posições dos tokens;
- participantes vistos recentemente como online.

Qualquer membro pode mover os tokens. Com a aba visível, o cliente consulta versões leves do estado aproximadamente a cada 750 ms e envia posições durante o arraste com throttle, confirmando a posição final ao soltar. Em segundo plano o polling é reduzido para economizar requisições. O modelo é **quase em tempo real por polling**, não WebSocket.

## Estrutura do banco

Gameplay:

- `gameplay_sessions`: mapa e contadores de versão;
- `gameplay_members`: autorização da conta e presença;
- `gameplay_tokens`: metadados e coordenadas.

Ficha:

- `character_sheets`: estado JSON e hash da chave de edição.

As posições dos tokens são percentuais, mantendo o mesmo ponto relativo em telas diferentes.

## Validação de produção

`node scripts/validate.mjs` verifica, entre outros pontos:

- arquivos obrigatórios e referências locais;
- ausência de dependências/mensagens legadas de Vercel;
- configuração HTTPS e versão fixa do Neon JS;
- presença das 10 classes, bases de PV/dano/carga e cortes de nível dos movimentos;
- proteção contra regressão de PV atual igual a zero;
- sanitização das anotações;
- mecanismos essenciais de sincronização do Gameplay;
- escopo relativo do PWA e conteúdo do cache do service worker.

O CI também executa `node --check`, verifica a disponibilidade do SDK e abre ficha/Gameplay em Chrome headless como smoke test.

O banco foi validado com teste de integração para: criação de sala, PIN incorreto, entrada de segunda conta, isolamento antes da associação, mapa, criação/movimento de token, versões de sincronização e ciclo completo de criação/leitura/atualização de ficha com rejeição de chave inválida.

## Referência das regras

Os dados de classe foram modelados a partir dos manuais PT-BR fornecidos ao projeto. Alterações de regra devem preservar a terminologia e a estrutura desses materiais.

Consulte `CHANGELOG.md` para as correções e melhorias da versão 1.0.0.
