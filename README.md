# Dungeon World — Ficha White Label

Aplicação web/PWA baseada no projeto `Zyvens/RPG-Dungeon-World`, reconstruída como uma ficha genérica e personalizável para personagens de Dungeon World.

## Objetivo

- Nenhuma referência a Kael Frostborn no estado inicial.
- Construção orientada por classe, raça/origem, alinhamento e regras específicas da classe.
- Classes disponíveis conforme o manual de classes utilizado no projeto: Bardo, Bárbaro, Clérigo, Druida, Engenheiro Arcano, Guerreiro, Ladrão, Mago, Paladino e Ranger.
- White label: cores, fundo, retrato, escala de fonte, transparência dos painéis e identidade da campanha/personagem.
- Inventário com peso/quantidade e cálculo automático de carga.
- Personagens/NPCs, história e anotações ricas.
- Persistência local e sincronização opcional em Neon Postgres por uma URL privada de edição.
- PWA instalável e pronta para Vercel.

## Neon

O banco foi criado separadamente no Neon com o projeto `dungeon-world`. A aplicação lê a conexão exclusivamente da variável de ambiente `DATABASE_URL`; a credencial não é versionada no GitHub.

Schema principal: `character_sheets`, contendo o estado JSON da ficha e um token de edição armazenado apenas como hash.

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Em **Project Settings → Environment Variables**, crie `DATABASE_URL` com a connection string do projeto Neon `dungeon-world`.
3. Faça o deploy.
4. Abra a aplicação e use **Criar ficha na nuvem** para gerar uma URL de edição. A chave fica no fragmento `#key=...`, portanto não é enviada ao servidor em navegação normal; ela só é usada pelo app ao salvar.

## Segurança do link

Quem possuir a URL completa com `#key=...` pode editar a ficha. Uma URL contendo apenas `?sheet=<id>` funciona como leitura pública daquela ficha. Para uma versão futura com contas individuais, o backend pode ser migrado para Neon Auth sem mudar o formato do estado da ficha.

## Referência de regras

Os dados de classe foram modelados a partir dos manuais em PT-BR fornecidos para o projeto. As regras de classe controlam PV máximo, dado de dano, carga, raça/origem disponível, alinhamentos, movimentos iniciais e lista de movimentos avançados.
