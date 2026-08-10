# Changelog

## 1.0.0 — Produção

### Corrigido
- Preservação correta de PV atual igual a zero após recarregar, importar ou sincronizar a ficha.
- Cálculo de PV máximo durante normalização/importação usando a classe da própria ficha importada.
- Sanitização do HTML das anotações para impedir scripts, handlers e elementos perigosos vindos de backups ou dados remotos.
- Preservação segura de citação, formatação de fonte e spoiler após sanitização.
- Remoção do registro absoluto `/sw.js`, incompatível com GitHub Pages em subdiretório.
- Remoção de mensagens e dependências legadas da arquitetura Vercel.
- Tratamento de cancelamento de ponteiro durante o arraste para impedir saltos acidentais de tokens.
- Bloqueio de operações duplicadas por clique repetido em criar/entrar/adicionar token.

### Arquitetura
- Autenticação e Data API migradas para o SDK oficial `@neondatabase/neon-js`.
- SDK fixado em `0.6.2-beta` para builds reproduzíveis; uma referência inicial a `0.6.3-beta` foi detectada pelo CI como versão não publicada e corrigida antes da liberação.
- GitHub Pages permanece 100% estático; nenhum segredo de banco é versionado no repositório.
- Acesso ao Postgres continua restrito por RLS + RPC autenticada.

### Regras
- Metadados de níveis dos movimentos avançados adicionados para todas as 10 classes.
- Movimentos de níveis 2–5 ficam bloqueados no nível 1; movimentos 6–10 ficam bloqueados até o nível 6.
- Ranger sinaliza `Meio-Elfo` como movimento disponível apenas no primeiro avanço.
- Carga acima do limite fica explicitamente marcada na ficha.

### Gameplay
- Polling adaptativo: rápido com a aba visível e reduzido em segundo plano.
- Throttle de movimento aumentado para reduzir gravações no banco sem perder a sensação de quase tempo real.
- Posição final do token continua confirmada ao soltar.
- Reconexão automática ao voltar à internet ou retornar à aba.
- Novas salas exigem PIN de 6 a 8 dígitos; salas antigas de 4 a 8 dígitos continuam compatíveis para entrada.
- Validação de tipo e tamanho das imagens antes de processamento/upload para o estado compartilhado.

### Qualidade
- CI ampliada com validação de sintaxe, estrutura, regras, segurança, referências locais, PWA, disponibilidade do SDK e smoke test em Chrome headless.
- Deploy do GitHub Pages agora é bloqueado se a validação de produção falhar.
- Teste de integração do Neon cobre criação/entrada de sala, PIN inválido, isolamento por associação, mapa, token, movimento, contadores de versão, criação/leitura/atualização de ficha e token de edição inválido.
