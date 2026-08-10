(() => {
  const c = (id, name, description) => ({ id, name, description });

  window.DW_CLASSES = {
    bardo: {
      name: "Bardo", damage: "d6", hpBase: 6, loadBase: 9,
      alignments: [
        c("bom", "Bom", "Executar sua arte para ajudar alguém."),
        c("neutro", "Neutro", "Evitar um conflito ou desfazer uma situação tensa."),
        c("caotico", "Caótico", "Estimular outros a uma ação decisiva, significativa e mal planejada.")
      ],
      heritageLabel: "Raça",
      heritages: [
        c("elfo", "Elfo", "Quando entrar em um local importante, você pode pedir ao MJ um fato sobre a história daquele lugar."),
        c("humano", "Humano", "Ao entrar pela primeira vez em um local civilizado, alguém que respeita a hospitalidade aos menestréis o recebe como convidado.")
      ],
      startingMoves: [
        c("arte-arcana", "Arte Arcana (CAR)", "A partir de uma performance, escolha um aliado e um efeito: curar 1d8 PV; +1d4 adiante para dano; remover encantamento mental; ou melhorar Ajudar para +2. Role+CAR: 10+ aplica; 7-9 aplica com atenção indesejada ou reverberação."),
        c("conhecimento-bardo", "Conhecimento de Bardo", "Escolha uma área de especialização. Ao encontrar pela primeira vez algo importante ligado a ela, faça uma pergunta ao MJ, que deve responder honestamente."),
        c("charmoso", "Charmoso(a) e Receptivo(a)", "Ao conversar francamente com alguém, faça uma pergunta da lista do movimento e responda honestamente se a outra pessoa fizer o mesmo."),
        c("porto-tempestade", "Um Porto na Tempestade", "Ao retornar a um local civilizado já visitado, diga quando esteve lá por último; o MJ conta o que mudou.")
      ],
      setup: [
        { key: "conhecimento", label: "Conhecimento de Bardo", type: "select", options: ["Magias e Feitiços","Mortos e Mortos-Vivos","Grandes Histórias do Mundo Conhecido","Bestiário de Criaturas Incomuns","Esferas Planares","Lendas de Heróis do Passado","Deuses e seus Servos"] },
        { key: "instrumento", label: "Instrumento", type: "select", options: ["Bandolim restaurado","Bela flauta","Gaita de um antigo amor","Corneta roubada","Rabeca nunca tocada","Livro de canções em língua esquecida"] }
      ],
      advanced: ["Canção da Cura","Cacofonia Violenta","Volume Máximo (CAR)","Grito Metálico (CON)","Uma Pequena Ajuda de Meus Amigos","Tons Sobrenaturais","Rosto Inesquecível","Aparo do Duelista","Mistificar","Amador em Multiclasse","Iniciado em Multiclasse","Refrão da Cura","Explosão Sonora Violenta","Reputação (CAR)","Acorde Sobrenatural","Ouvido Bom para Magia","Desleal","Bloqueio do Duelista","Passar a Perna","Mestre em Multiclasse"],
      equipmentGuide: "Carga 9+FOR. Rações de masmorra. Escolha instrumento; armadura de couro ou roupas ostensivas; florete ou arco+flechas+espada curta; e um item de apoio."
    },

    barbaro: {
      name: "Bárbaro", damage: "d8", hpBase: 8, loadBase: 8,
      alignments: [c("neutro","Neutro","Ensinar a alguém os modos de seu povo."), c("caotico","Caótico","Afastar-se de uma convenção do mundo civilizado.")],
      heritageLabel: "Origem",
      heritages: ["anao","elfo","halfling","humano"].map((id) => c(id, id === "anao" ? "Anão" : id[0].toUpperCase()+id.slice(1), "Forasteiro: seu povo não é destas redondezas. No início de cada sessão, responda ao MJ sobre sua terra natal, por que partiu ou o que deixou para trás para marcar XP.")),
      startingMoves: [
        c("defesa-barbaro", "Escolha de Defesa", "No início escolha: Armadura de Placas e Portando Aço (ignora desengonçada) OU Desimpedido e Ileso (+1 armadura abaixo da Carga, sem armadura nem escudo)."),
        c("apetite", "Apetite Hercúleo", "Escolha dois apetites. Enquanto perseguir um deles, role 1d6+1d8 no lugar de 2d6; se o d6 for o maior dado, o MJ introduz uma complicação ou perigo ligado à busca."),
        c("controle", "Controle da Situação", "+1 constante para Último Suspiro e possibilidade de fazer uma oferta à Morte em troca de sua vida."),
        c("musculoso", "Musculoso", "Quando portar uma arma, ela recebe os rótulos poderoso e grotesco."),
        c("esperando", "O Que Você Está Esperando? (CON)", "Ao gritar um desafio aos inimigos, role+CON. 10+: eles o tratam como ameaça principal e você recebe +2 dano contra eles; 7-9: apenas os mais fracos ou tolos caem na provocação.")
      ],
      setup: [
        { key: "defesa", label: "Defesa inicial", type: "select", options: ["Armadura de Placas e Portando Aço","Desimpedido e Ileso"] },
        { key: "apetites", label: "Apetites (escolha 2)", type: "multi", max: 2, options: ["Pura destruição","Poder sobre outras pessoas","Prazeres mortais","Conquista","Riquezas e propriedades","Fama e glória"] }
      ],
      advanced: ["Contínuo Faminto","Apetite por Destruição","Meu Amor por Você é Como um Caminhão","As Melhores Coisas da Vida","Grande Viajante","Usurpador","Khan dos Khans","Sansão","Esmagar!","Fome Indestrutível","Percepção de Pontos Fracos","Sempre em Frente","Um Ótimo Dia para Morrer","Mate a Todos","Grito de Guerra (CAR)","Marca de Poder","Mais! Sempre Mais!","Aquele que Bate à Porta","Desconfiança Saudável","Pelo Deus do Sangue (SAB)"],
      equipmentGuide: "Carga 8+FOR. Rações, adaga, lembrança da jornada/terra natal e machado ou espada de duas mãos. Escolha equipamento de aventureiro+rações ou cota de malha."
    },

    clerigo: {
      name: "Clérigo", damage: "d6", hpBase: 8, loadBase: 10,
      alignments: [c("bom","Bom","Colocar-se em perigo para curar outra pessoa."), c("ordeiro","Ordeiro","Colocar-se em perigo seguindo os preceitos de sua igreja ou deus."), c("mau","Mau","Prejudicar outra pessoa para provar a superioridade de sua igreja ou deus.")],
      heritageLabel: "Raça",
      heritages: [c("anao","Anão","Você é um com a pedra. Ao comungar, recebe uma versão especial de Palavras dos Silenciosos que só funciona com pedras."), c("humano","Humano","Escolha um feitiço de Mago; você pode recebê-lo e conjurá-lo como feitiço de Clérigo.")],
      startingMoves: [
        c("divindade","Divindade","Nomeie sua divindade/poder, escolha um domínio e um preceito religioso."),
        c("orientacao","Orientação Divina","Ao fazer uma súplica adequada aos preceitos de sua religião, sua divindade concede conhecimento útil ou benefício ligado aos seus domínios."),
        c("expulsar","Expulsar Mortos-Vivos","Erga seu símbolo sagrado e role+SAB. Em sucesso, mortos-vivos são mantidos à distância; em 10+, os sem mente fogem e os inteligentes ficam momentaneamente ofuscados."),
        c("comungar","Comungar","Após comunhão ininterrupta, perca feitiços concedidos e escolha novos até total de níveis igual a nível+1; orações não contam para o limite."),
        c("conjurar-clerigo","Conjurar Feitiços (SAB)","Role+SAB ao conjurar feitiço concedido. 10+: sucesso e não é revogado. 7-9: sucesso com uma consequência da lista do movimento.")
      ],
      setup: [
        { key: "dominio", label: "Domínio da divindade", type: "select", options: ["Cura e Restauração","Conquista Sangrenta","Civilização","Conhecimento e Coisas Ocultas","Oprimidos e Esquecidos","O Que Existe Abaixo"] },
        { key: "preceito", label: "Preceito", type: "select", options: ["Santidade do sofrimento","Cultista e insular","Rituais de sacrifício","Julgamento pelo combate"] }
      ],
      advanced: ["O Escolhido","Revigorar","O Equilíbrio entre a Vida e a Morte","Serenidade","Primeiros Socorros","Intervenção Divina","Penitente","Potencializar","Prece por Orientação","Proteção Divina","Curandeiro Devoto","Amador em Multiclasse","Abençoado","Apoteose","Ceifador","Providência","Primeiros Socorros Superiores","Invencibilidade Divina","Mártir","Armadura Divina","Potencializar Superior"],
      equipmentGuide: "Carga 10+FOR. Rações e símbolo sagrado. Escolha defesa, arma e item de apoio conforme a ficha de classe."
    },

    druida: {
      name: "Druida", damage: "d6", hpBase: 6, loadBase: 6,
      alignments: [c("caotico","Caótico","Destruir um símbolo de civilização."), c("bom","Bom","Ajudar alguma coisa ou alguém a crescer."), c("neutro","Neutro","Eliminar uma ameaça não natural.")],
      heritageLabel: "Raça",
      heritages: [
        c("elfo","Elfo","A Grande Floresta é sempre considerada sua terra, além das outras ligações."),
        c("humano","Humano","Você sempre pode assumir a forma de qualquer animal domesticado, além das opções normais."),
        c("halfling","Halfling","Ao montar acampamento, você e seus aliados curam +1d6.")
      ],
      startingMoves: [
        c("nascido-solo","Nascido do Solo","Escolha uma terra à qual esteja ligado. Ao se metamorfosear, pode assumir formas de animais nativos dela. Escolha também uma marca física de nascido do solo."),
        c("nutrido","Nutrido pela Natureza","Você não precisa comer ou beber; ignore exigências de marcar uma ração."),
        c("linguagem","Linguagem dos Espíritos","Você compreende os chamados de animais nativos de sua terra ou similares a essências estudadas."),
        c("metamorfose","Metamorfose (SAB)","Chame os espíritos e role+SAB para assumir forma animal; domínio obtido é gasto para fazer movimentos da forma."),
        c("essencia","Essência Estudada","Ao passar tempo contemplando um espírito animal, pode adicionar sua espécie às formas que assume.")
      ],
      setup: [{ key: "terra", label: "Terra de origem espiritual", type: "select", options: ["Grande Floresta","Vasto Deserto","Delta do Rio","Ilhas de Safira","Montanhas Elevadas","Terra Devastada","Planícies Sussurrantes","Lamaçal Fedorento","Profundezas da Terra","Mar Aberto","Norte Gelado"] }],
      advanced: ["Irmão do Caçador","Garras e Dentes Vermelhos","Comunhão dos Sussurros (SAB)","Pele de Madeira","Olhos do Tigre","Trocar a Pele","Falar com Coisas","Criador de Formas","Maestria Elemental (SAB)","Equilíbrio","Adotar Forma Alguma","Sangue e Trovão","O Sono do Druida","Falar com o Mundo","Irmã do Espreitador","Moldador de Formas","Quimera","Tecer o Clima"],
      equipmentGuide: "Carga 6+FOR. Lembrança de sua terra e escolhas de armamento/defesa conforme a ficha de classe."
    },

    engenheiro: {
      name: "Engenheiro Arcano", damage: "d4", hpBase: 4, loadBase: 7,
      alignments: [c("coracao","Coração de Lata","Usar máquinas para ajudar diretamente outra pessoa."), c("verdade","A Verdade Está Lá Fora","Descobrir informações sobre tecnologias ancestrais e esquecidas."), c("supremacia","Supremacia Tecnológica","Usar as máquinas para causar medo e terror.")],
      alignmentLabel: "Motivação",
      heritageLabel: "Especialização",
      heritages: [c("pesquisa","Pesquisa e Desenvolvimento","Magitecnologia é natural para você; Detectar Magia e Máquinas é considerada uma rotina."), c("biotecnologia","Biotecnologia","Escolha um feitiço de Clérigo; você pode ativá-lo no dispositivo como se fosse um efeito de Engenheiro.")],
      startingMoves: [
        c("codex","Codex","Comece com 3 efeitos de primeiro nível anotados no codex e todas as rotinas. Ao ganhar nível, adicione um efeito de nível igual ou inferior ao seu. Peso 1."),
        c("preparar-dispositivos","Preparar Dispositivos","Após cerca de uma hora conectando dispositivos ao codex, desative efeitos antigos e prepare novos até total de níveis igual a nível+1; rotinas não contam."),
        c("ativar-efeitos","Ativar Efeitos (INT)","Role+INT ao ativar efeito preparado. 10+: sucesso sem defeitos. 7-9: sucesso com atenção, bug (-1 até preparar novamente) ou gasto total da energia do efeito."),
        c("escudo-eletro","Escudo Eletromagnético","Desative um efeito contínuo e transfira sua energia para gerar escudo contra um ataque; reduza o dano pelo nível do efeito."),
        c("invencoes","Invenções Fantásticas","Com energia/recursos e acesso a alta tecnologia ou magia, diga ao MJ o efeito da invenção; ele apresenta condições/custos para realizá-la.")
      ],
      setup: [],
      advanced: ["Prodígio","Efeito Potencializado","Fonte de Conhecimento","Sabe-Tudo","Codex Expandido","Escâner","Lógica","Proteção Eletrostática","Nulificador XPTO","Estudar Rapidamente","Mestre","Efeito Potencializado Superior","Engenharia Reversa","Lógica Extrema","Armadura Magitrônica","Domo de Nulificação","Corrente Etérea","Fios de Marionete","Ampliação Mágico-Energética","Autossuficiente"],
      equipmentGuide: "Carga 7+FOR. Codex (peso 1), rações; escolha armadura improvisada ou mochila de livros; adaga ou chave mecânica longa; kit cicatrizante ou antitoxinas."
    },

    guerreiro: {
      name: "Guerreiro", damage: "d10", hpBase: 10, loadBase: 12,
      alignments: [c("bom","Bom","Defender aqueles mais fracos que você."), c("neutro","Neutro","Derrotar um adversário à sua altura."), c("mau","Mau","Matar um inimigo indefeso ou cercado.")],
      heritageLabel: "Raça",
      heritages: [
        c("anao","Anão","Ao compartilhar uma bebida com alguém, negocie usando CON no lugar de CAR."),
        c("elfo","Elfo","Escolha um tipo de arma; você trata armas desse tipo como se sempre possuíssem o rótulo precisa."),
        c("halfling","Halfling","Ao desafiar o perigo usando seu tamanho diminuto a seu favor, receba +1."),
        c("humano","Humano","Uma vez por batalha, role novamente um rolamento de dano seu ou de outra pessoa.")
      ],
      startingMoves: [
        c("dobrar","Dobrar Barras, Suspender Portais (FOR)","Ao usar força bruta para destruir objeto inanimado, role+FOR. 10+: escolha 3 benefícios; 7-9: escolha 2."),
        c("fortificado","Fortificado","Ignore o rótulo desengonçada em qualquer armadura que vestir."),
        c("arma-favorita","Arma Favorita","Escolha descrição básica, alcance, duas melhorias e aparência. A arma é especial e não se perde permanentemente sem uma ação que realmente a coloque em risco.")
      ],
      setup: [
        { key: "armaBase", label: "Arma favorita", type: "select", options: ["Espada","Machado","Martelo","Lança","Mangual","Punhos"] },
        { key: "alcance", label: "Alcance", type: "select", options: ["Mão","Corpo a corpo","Alcance"] },
        { key: "melhorias", label: "Melhorias (escolha 2)", type: "multi", max: 2, options: ["Ganchos e espinhos (+1 dano, +1 peso)","Afiada (+2 penetrante)","Perfeitamente balanceada (precisa)","Fio serrilhado (+1 dano)","Brilha na presença de uma criatura","Enorme (grotesca e poderosa)","Versátil (alcance adicional)","Alta qualidade (-1 peso)"] },
        { key: "aparenciaArma", label: "Aparência da arma", type: "select", options: ["Antiga","Imaculada","Ornada","Manchada de sangue","Sinistra"] }
      ],
      advanced: ["Implacável","Relíquia de Família","Maestria com Armadura","Arma Melhorada","Visão Rubra","Inquisidor","Cheiro de Sangue","Amador em Multiclasse","Pele de Ferro","Ferreiro","Sede de Sangue","Perfeição com Armadura","Mau Olhado","Gosto por Sangue","Iniciado em Multiclasse","Pele de Aço","Através dos Olhos da Morte","Foco no Armamento","Guerreiro Superior"],
      equipmentGuide: "Carga 12+FOR. Arma favorita e rações; escolha defesas, arma secundária e equipamento conforme a ficha do Guerreiro."
    },

    ladrao: {
      name: "Ladrão", damage: "d8", hpBase: 6, loadBase: 9,
      alignments: [c("caotico","Caótico","Pular sobre o perigo sem um plano."), c("neutro","Neutro","Evitar ser detectado ou infiltrar-se em um local."), c("mau","Mau","Repassar o perigo ou a culpa para outra pessoa.")],
      heritageLabel: "Raça",
      heritages: [c("halfling","Halfling","Ao atacar com arma de longo alcance, cause +2 dano."), c("humano","Humano","Ao falar difícil ou discernir realidades sobre atividades criminosas, receba +1.")],
      startingMoves: [
        c("armadilhas","Especialista em Armadilhas (DES)","Ao parar para avaliar uma área perigosa, role+DES e ganhe domínio para perguntar sobre armadilhas e coisas escondidas."),
        c("truques","Truques do Ofício (DES)","Ao arrombar fechaduras, bater carteiras ou desarmar armadilhas, role+DES. 10+: consegue; 7-9: consegue com escolha entre suspeita, perigo ou preço."),
        c("costas","Ataque pelas Costas (DES)","Contra oponente surpreso/indefeso em corpo a corpo, cause dano direto ou role+DES para escolher benefícios como dano extra, não entrar em combate, criar vantagem ou reduzir armadura."),
        c("moral","Moral Flexível","Quando alguém tentar detectar seu alinhamento, você pode dizer qualquer alinhamento que quiser."),
        c("envenenador","Envenenador","Você domina o uso e preparo de venenos; escolha o veneno inicial conforme a ficha de classe.")
      ],
      setup: [],
      advanced: ["Golpe Desonesto","Cauteloso","Riqueza e Bom Gosto","Atirar Primeiro","Mestre dos Venenos","Envenenar","Produtor","Oprimido","Conexões","Lutador Desonesto","Extremamente Cauteloso","Alquimista","Muito Oprimido","Evasão","Rota de Fuga","Disfarce","Assalto"],
      equipmentGuide: "Carga 9+FOR. Rações e escolhas de arma curta, arma de longo alcance, munição e ferramentas conforme a ficha do Ladrão."
    },

    mago: {
      name: "Mago", damage: "d4", hpBase: 4, loadBase: 7,
      alignments: [c("bom","Bom","Usar magia para ajudar diretamente outra pessoa."), c("neutro","Neutro","Descobrir informações sobre um enigma ou mistério mágico."), c("mau","Mau","Usar magia para causar medo e terror.")],
      heritageLabel: "Raça",
      heritages: [c("elfo","Elfo","A magia é tão natural quanto respirar. Detectar Magia é considerado um truque para você."), c("humano","Humano","Escolha um feitiço de Clérigo; você pode conjurá-lo como se fosse de Mago.")],
      startingMoves: [
        c("grimorio","Grimório","Comece com 3 feitiços de primeiro nível e todos os truques. A cada nível, adicione um feitiço de nível igual ou inferior ao seu. Peso 1."),
        c("preparar-feiticos","Preparar Feitiços","Após cerca de uma hora com o grimório, perca preparações anteriores e escolha feitiços cujo total de níveis não exceda nível+1; truques não contam."),
        c("conjurar-mago","Conjurar Feitiços (INT)","Role+INT. 10+: conjura e mantém preparado. 7-9: conjura com atenção indesejada, -1 até preparar novamente ou esquecimento do feitiço."),
        c("defesa-magica","Defesa Mágica","Você pode encerrar um feitiço contínuo para usar sua energia como defesa; subtraia o nível do feitiço do dano recebido."),
        c("ritual","Ritual","Em um local de poder, diga ao MJ o efeito mágico que quer obter; ele impõe de uma a quatro condições para realizá-lo.")
      ],
      setup: [{ key: "feiticosIniciais", label: "3 feitiços iniciais de nível 1", type: "text", placeholder: "Ex.: Míssil Mágico, Encantar Pessoa, Invisibilidade" }],
      advanced: ["Prodígio","Magia Potencializada","Fonte de Conhecimento","Sabe-Tudo","Grimório Expandido","Encantador","Lógica","Proteção Arcana","Contramágica","Estudar Rapidamente","Mestre","Magia Potencializada Superior","Alma de Encantador","Lógica Extrema","Armadura Arcana","Contramágica Protetora","Corrente Etérea","Fios Místicos de Marionete","Ampliação Mágica","Autossuficiente"],
      equipmentGuide: "Carga 7+FOR. Grimório (peso 1), rações e escolhas de armamento/itens arcanos conforme a ficha do Mago."
    },

    paladino: {
      name: "Paladino", damage: "d10", hpBase: 10, loadBase: 12,
      alignments: [c("ordeiro","Ordeiro","Negar misericórdia a um criminoso ou infiel."), c("bom","Bom","Colocar-se em perigo para proteger alguém mais fraco.")],
      heritageLabel: "Raça",
      heritages: [c("humano","Humano","Ao rezar pedindo orientação e perguntar ‘O que é maligno aqui?’, o MJ responde honestamente.")],
      startingMoves: [
        c("maos","Impor as Mãos (CAR)","Toque pele com pele e role+CAR. 10+: cure 1d8 ou remova doença. 7-9: a cura acontece, mas dano/doença é transferido para você."),
        c("fortificado-paladino","Fortificado","Ignore o rótulo desajeitada em qualquer armadura que usar."),
        c("lei","Eu Sou a Lei (CAR)","Ordene um PNJ com base em autoridade divina e role+CAR. Em 7-9 ele obedece, recua/foge ou ataca; 10+ também dá +1 adiante contra ele."),
        c("busca","Busca","Dedique-se a uma missão por oração/purificação; escolha objetivo, duas dádivas e mantenha os votos definidos pelo MJ para conservá-las.")
      ],
      setup: [
        { key: "buscaObjetivo", label: "Objetivo da Busca", type: "text", placeholder: "Destruir…, defender… ou descobrir a verdade sobre…" },
        { key: "dadivas", label: "Dádivas (escolha 2)", type: "multi", max: 2, options: ["Senso de direção infalível","Invulnerabilidade contra algo","Marca de autoridade divina","Sentidos que atravessam mentiras","Voz que transcende a linguagem","Livre de fome, sede e sono"] }
      ],
      advanced: ["Favor Divino","Proteção Sangrenta","Punição","Exterminatus","Investir!","Defensor Convicto","Preparar Ataque","Proteção Sagrada","Voz de Autoridade","Hospitalário","Prova de Fé","Punição Divina","Sempre em Frente","Defensor Intransponível","Proteção Divina","Autoridade Divina","Hospitalário Perfeito","Indomável","Cavaleiro Perfeito"],
      equipmentGuide: "Carga 12+FOR. Rações e escolhas de armadura, escudo, arma e equipamento sagrado conforme a ficha do Paladino."
    },

    ranger: {
      name: "Ranger", damage: "d8", hpBase: 8, loadBase: 11,
      alignments: [c("caotico","Caótico","Libertar alguém de amarras literais ou metafóricas."), c("bom","Bom","Colocar-se em perigo para combater uma ameaça sobrenatural."), c("neutro","Neutro","Ajudar um animal ou espírito selvagem.")],
      heritageLabel: "Raça",
      heritages: [c("elfo","Elfo","Em jornada perigosa por terras ermas, qualquer que seja seu papel, você sempre consegue um acerto como 10+."), c("humano","Humano","Ao preparar acampamento em masmorra ou cidade, você não precisa consumir uma ração.")],
      startingMoves: [
        c("rastrear","Caçar e Rastrear (SAB)","Siga uma trilha e role+SAB. 7-9: acompanha até mudança significativa. 10+: também obtenha informação sobre a presa ou determine o que interrompeu o rastro."),
        c("tiro","Tiro ao Alvo (DES)","Ao atacar à distância inimigo surpreso/indefeso, cause dano ou mire cabeça, braços ou pernas e role+DES para aplicar efeitos específicos."),
        c("animal","Companheiro Animal","Escolha espécie, base, forças, treinamentos e fraquezas de acordo com ferocidade, astúcia e instinto."),
        c("comandar","Comandar","Ao trabalhar com o companheiro em algo para o qual foi treinado, some atributos dele ao dano, rastreamento, armadura, discernir realidades, negociar ou interferir conforme o caso.")
      ],
      setup: [
        { key: "animal", label: "Companheiro animal", type: "select", options: ["Lobo","Puma","Urso","Águia","Cachorro","Falcão","Gato","Coruja","Pombo","Rato","Mula"] },
        { key: "baseAnimal", label: "Base do companheiro", type: "select", options: ["Ferocidade +2, Astúcia +1, Armadura 1, Instinto +1","Ferocidade +2, Astúcia +2, Armadura 0, Instinto +1","Ferocidade +1, Astúcia +2, Armadura 1, Instinto +1","Ferocidade +3, Astúcia +1, Armadura 1, Instinto +2"] }
      ],
      advanced: ["Meio-Elfo","Empatia Selvagem","Presa Conhecida","Golpe da Víbora","Camuflagem","Melhor Amigo do Homem","Apagar o Sol","Bem Treinado","Sigam-me","Local Seguro","Discurso Selvagem","Presa do Caçador","Mordida da Víbora","Barriga do Smaug","Andarilho","Local Ainda Mais Seguro","Observador","Truque Especial","Aliado Sobrenatural"],
      equipmentGuide: "Carga 11+FOR. Rações e escolhas de arco/munição, armas e equipamento de viagem conforme a ficha do Ranger."
    }
  };
})();
