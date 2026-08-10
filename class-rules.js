(() => {
  "use strict";
  const classes = window.DW_CLASSES || {};
  const d = (entries) => Object.fromEntries(entries);

  const meta = {
    bardo: {
      advancedSplit: 10,
      advancedDescriptions: d([
        ["Canção da Cura","Ao curar com Arte Arcana, cure +1d8 adicional."],
        ["Cacofonia Violenta","Ao conceder bônus de dano com Arte Arcana, conceda +1d4 de dano extra."],
        ["Volume Máximo (CAR)","Desencadeie uma performance ensandecida contra um alvo que possa ouvi-lo e role+CAR; em sucesso ele volta sua agressão contra um aliado próximo, com consequências maiores em 7–9."],
        ["Grito Metálico (CON)","Grite ou toque uma nota devastadora e role+CON; cause 1d10 e ensurdeça o alvo, com risco de atingir outro alvo em 7–9."],
        ["Uma Pequena Ajuda de Meus Amigos","Quando conseguir Ajudar alguém, receba +1 adiante também."],
        ["Tons Sobrenaturais","Sua Arte Arcana permite escolher dois efeitos em vez de um."],
        ["Rosto Inesquecível","Ao reencontrar alguém depois de algum tempo, receba +1 adiante contra essa pessoa."],
        ["Aparo do Duelista","Quando Matar e Pilhar, receba +1 adiante de armadura."],
        ["Mistificar","Ao Negociar com 7+, receba +1 adiante contra o alvo."],
        ["Amador em Multiclasse","Adquira um movimento de outra classe considerando seu nível como 1 menor para a escolha."],
        ["Iniciado em Multiclasse","Adquira outro movimento de outra classe considerando seu nível como 1 menor para a escolha."],
        ["Refrão da Cura","Substitui Canção da Cura; ao curar com Arte Arcana, cure +2d8 adicional."],
        ["Explosão Sonora Violenta","Substitui Cacofonia Violenta; ao conceder bônus de dano com Arte Arcana, conceda +2d4 de dano extra."],
        ["Reputação (CAR)","Ao encontrar pessoas que já ouviram histórias sobre você, role+CAR para definir o que elas sabem a seu respeito."],
        ["Acorde Sobrenatural","Substitui Tons Sobrenaturais; escolha dois efeitos de Arte Arcana e aplique um deles em dobro."],
        ["Ouvido Bom para Magia","Ao ouvir um inimigo conjurar magia, descubra nome e efeitos e receba +1 adiante ao agir com essa informação."],
        ["Desleal","Charmoso e Receptivo passa a incluir a pergunta sobre como o alvo seria vulnerável a você."],
        ["Bloqueio do Duelista","Substitui Aparo do Duelista; ao Matar e Pilhar, receba +2 adiante de armadura."],
        ["Passar a Perna","Substitui Mistificar; em 7+ ao Negociar, receba +1 adiante e faça uma pergunta que deve ser respondida honestamente."],
        ["Mestre em Multiclasse","Adquira um movimento de outra classe considerando seu nível como 1 menor para a escolha."]
      ])
    },
    barbaro: {
      advancedSplit: 12,
      advancedDescriptions: d([
        ["Contínuo Faminto","Escolha um apetite adicional."],
        ["Apetite por Destruição","Adquira um movimento de Guerreiro, Bardo ou Ladrão, exceto movimentos de multiclasse."],
        ["Meu Amor por Você é Como um Caminhão","Após um grande feito de força, escolha alguém impressionado e receba +1 adiante para Negociar com essa pessoa."],
        ["As Melhores Coisas da Vida","No fim da sessão, se tiver esmagado inimigos, feito-os fugir e ouvido os lamentos dos vencidos, marque XP."],
        ["Grande Viajante","Ao chegar a um lugar, pergunte ao MJ sobre tradições, rituais e costumes importantes; ele lhe dirá o necessário."],
        ["Usurpador","Ao provar-se superior a alguém no poder, receba +1 adiante contra seus seguidores e lacaios."],
        ["Khan dos Khans","Seus lacaios aceitam a satisfação gratuita de um de seus apetites como pagamento."],
        ["Sansão","Aceite uma debilidade para se libertar imediatamente de uma restrição física ou mental."],
        ["Esmagar!","Em 12+ ao Matar e Pilhar, além do dano, faça o alvo perder um objeto físico importante, posição ou membro conforme a ficção."],
        ["Fome Indestrutível","Ao receber dano, você pode sofrer -1 constante até saciar um apetite em vez de sofrer o dano."],
        ["Percepção de Pontos Fracos","Adicione 'o que aqui é fraco ou vulnerável?' às perguntas de Discernir Realidades."],
        ["Sempre em Frente","Receba +1 ao Desafiar o Perigo provocado por um movimento ou obstáculo em curso."],
        ["Um Ótimo Dia para Morrer","Enquanto seus PV estiverem abaixo de sua CON, ou 1 se maior, receba +1 constante."],
        ["Mate a Todos","Requer Apetite por Destruição; adquira mais um movimento de Guerreiro, Bardo ou Ladrão que não seja de multiclasse."],
        ["Grito de Guerra (CAR)","Ao entrar em batalha com uma demonstração de força, role+CAR para encorajar aliados e/ou amedrontar inimigos."],
        ["Marca de Poder","Após refletir sobre suas glórias, marque-se com um símbolo que faz criaturas inteligentes reconhecerem instintivamente sua força."],
        ["Mais! Sempre Mais!","Ao satisfazer um apetite de forma extrema, você pode resolvê-lo permanentemente, marcar XP e escolher um novo apetite."],
        ["Aquele que Bate à Porta","Em 12+ ao Desafiar o Perigo, vire o próprio perigo contra ele mesmo."],
        ["Desconfiança Saudável","Quando magia mortal o força a Desafiar o Perigo, resultados de 6- são tratados como 7–9."],
        ["Pelo Deus do Sangue (SAB)","Sacrifique algo valorizado por seus deuses e role+SAB para receber conhecimento ou uma bênção, com custo adicional em 7–9."]
      ])
    },
    clerigo: {
      advancedSplit: 11,
      advancedDescriptions: d([
        ["O Escolhido","Escolha um feitiço; ele é concedido como se fosse 1 nível menor."],
        ["Revigorar","Quando curar alguém, essa pessoa recebe +2 adiante no dano."],
        ["O Equilíbrio entre a Vida e a Morte","Quando alguém der seu Último Suspiro em sua presença, recebe +1 na rolagem."],
        ["Serenidade","Ao conjurar, ignore uma penalidade de -1 causada por feitiço contínuo."],
        ["Primeiros Socorros","Curar Ferimentos Leves passa a ser uma oração e não conta no limite de feitiços concedidos."],
        ["Intervenção Divina","Ao Comungar, receba domínio 1; gaste-o quando você ou um aliado sofrer dano para a divindade negar o dano."],
        ["Penitente","Ao receber dano, aceite +1d4 ignorando armadura para receber +1 adiante em Conjurar Feitiços."],
        ["Potencializar","Em 10+ ao Conjurar Feitiços, aceite uma consequência de 7–9 para dobrar efeitos ou alvos."],
        ["Prece por Orientação","Sacrifique algo valioso e peça orientação; se cumprir o que a divindade ordenar, marque XP."],
        ["Proteção Divina","Sem armadura ou escudo, você possui armadura 2."],
        ["Curandeiro Devoto","Ao curar outra pessoa, some seu nível ao total curado."],
        ["Amador em Multiclasse","Adquira um movimento de outra classe considerando seu nível como 1 menor."],
        ["Abençoado","Requer O Escolhido; escolha outro feitiço, concedido como se fosse 1 nível menor."],
        ["Apoteose","Após oração apropriada, ganhe permanentemente uma característica física associada à sua divindade."],
        ["Ceifador","Após um conflito, dedique a vitória à divindade e cuide dos mortos para receber +1 adiante."],
        ["Providência","Substitui Serenidade; ignore a penalidade de -1 de dois feitiços contínuos."],
        ["Primeiros Socorros Superiores","Requer Primeiros Socorros; Curar Ferimentos Moderados passa a ser uma oração."],
        ["Invencibilidade Divina","Substitui Intervenção Divina; ao Comungar receba domínio 2 para negar dano a você ou aliados."],
        ["Mártir","Substitui Penitente; aceite +1d4 dano para +1 adiante em conjuração e some seu nível ao dano ou cura do feitiço."],
        ["Armadura Divina","Substitui Proteção Divina; sem armadura ou escudo, você possui armadura 3."],
        ["Potencializar Superior","Substitui Potencializar; em 10+ pode aceitar consequência para dobrar efeitos ou alvos e, em 12+, recebe um desses efeitos gratuitamente."]
      ])
    },
    druida: {
      advancedSplit: 10,
      advancedDescriptions: d([
        ["Irmão do Caçador","Adquira um movimento da lista do Ranger."],
        ["Garras e Dentes Vermelhos","Em forma animal apropriada, seu dano passa a d8."],
        ["Comunhão dos Sussurros (SAB)","Quando passar tempo em um lugar contemplando seus espíritos, role+SAB para receber domínio e fazer perguntas sobre o ambiente."],
        ["Pele de Madeira","Enquanto seus pés tocarem o chão, receba +1 armadura."],
        ["Olhos do Tigre","Ao marcar um animal com sangue, você pode enxergar através dos olhos dele como se estivesse presente."],
        ["Trocar a Pele","Ao sofrer dano em forma animal, você pode retornar à forma normal para negar o dano."],
        ["Falar com Coisas","Você consegue conversar com criaturas e elementos ligados às formas e essências que estudou."],
        ["Criador de Formas","Ao Metamorfosear, em 10+ receba domínio 3; em 7–9 receba domínio 2; em 6- receba domínio 1 além do movimento do MJ."],
        ["Maestria Elemental (SAB)","Ao invocar espíritos elementais, role+SAB para fazê-los realizar um efeito, aceitando preço, perigo ou descontrole conforme o resultado."],
        ["Equilíbrio","Ao causar dano, receba equilíbrio; gaste equilíbrio para curar quando tocar alguém e canalizar a força vital."],
        ["Adotar Forma Alguma","Você pode permanecer em forma animal sem gastar domínio apenas para manter a forma."],
        ["Sangue e Trovão","Substitui Garras e Dentes Vermelhos; em forma animal adequada, seu dano passa a d10."],
        ["O Sono do Druida","Ao descansar em sua terra, receba um benefício especial de recuperação e comunhão definido pela ficção."],
        ["Falar com o Mundo","Substitui Falar com Coisas; você pode conversar com praticamente qualquer aspecto natural do mundo."],
        ["Irmã do Espreitador","Adquira outro movimento da lista do Ranger."],
        ["Moldador de Formas","Substitui Criador de Formas; ao Metamorfosear, obtenha ainda mais domínio e controle sobre a forma."],
        ["Quimera","Ao Metamorfosear, você pode criar uma forma combinando características de múltiplas criaturas estudadas."],
        ["Tecer o Clima","Após passar tempo em comunhão com o céu, você pode declarar um padrão climático apropriado que se manifesta."]
      ])
    },
    engenheiro: {
      advancedSplit: 10,
      advancedDescriptions: d([
        ["Prodígio","Escolha um efeito; você o prepara como se fosse 1 nível menor."],
        ["Efeito Potencializado","Ao ativar um efeito, aceite uma complicação para maximizar o efeito ou dobrar seus alvos."],
        ["Fonte de Conhecimento","Ao Falar Difícil sobre algo que ninguém mais saiba, receba +1."],
        ["Sabe-Tudo","Quando outro personagem pedir seu conselho, seguir sua solução dá +1 adiante a ele e marca XP para você."],
        ["Codex Expandido","Adicione ao Codex um efeito de outra tradição/classe compatível com a ficção do Engenheiro."],
        ["Escâner","Ao estudar com segurança um artefato mágico ou tecnológico, pergunte ao MJ o que ele faz; a resposta é honesta."],
        ["Lógica","Use INT no lugar de SAB ao Discernir Realidades por dedução e análise."],
        ["Proteção Eletrostática","Enquanto tiver ao menos um efeito de nível 1+ preparado, receba armadura +2."],
        ["Nulificador XPTO","Quando um efeito mágico/tecnológico for atingi-lo, comprometa um efeito preparado e role+INT para anulá-lo."],
        ["Estudar Rapidamente","Ao observar um efeito arcano ou tecnológico, descubra seu nome e função e receba +1 adiante ao agir com a informação."],
        ["Mestre","Requer Prodígio; escolha outro efeito para preparar como se fosse 1 nível menor."],
        ["Efeito Potencializado Superior","Substitui Efeito Potencializado; potencialize efeitos com benefício maior e menor custo em resultados altos."],
        ["Engenharia Reversa","Ao desmontar e estudar uma tecnologia ou magia, aprenda princípios que podem ser incorporados a seus dispositivos."],
        ["Lógica Extrema","Substitui Lógica; sua análise por INT torna Discernir Realidades ainda mais eficiente em resultados altos."],
        ["Armadura Magitrônica","Substitui Proteção Eletrostática; sua proteção preparada concede armadura superior."],
        ["Domo de Nulificação","Substitui Nulificador XPTO; sua anulação pode proteger também aliados ou uma área próxima."],
        ["Corrente Etérea","Você consegue sustentar conexões energéticas entre dispositivos/efeitos para ampliar alcance e continuidade."],
        ["Fios de Marionete","Seus dispositivos podem controlar ou direcionar temporariamente um alvo quando a ficção permitir."],
        ["Ampliação Mágico-Energética","Amplifique alcance, intensidade ou escala de um efeito preparado mediante energia e risco apropriados."],
        ["Autossuficiente","Com tempo, ferramentas e sucata adequada, você consegue improvisar os recursos técnicos essenciais de que precisa."]
      ])
    },
    guerreiro: {
      advancedSplit: 10,
      advancedDescriptions: d([
        ["Implacável","Quando causar dano, cause +1d4 de dano."],
        ["Relíquia de Família","Consulte os espíritos de sua arma favorita e role+CAR para receber informações sobre a situação atual."],
        ["Maestria com Armadura","Deixe armadura ou escudo absorver todo o dano de um golpe em troca de reduzir seu valor de armadura em 1."],
        ["Arma Melhorada","Escolha uma melhoria adicional para sua arma favorita."],
        ["Visão Rubra","Ao Discernir Realidades durante um combate, receba +1."],
        ["Inquisidor","Ao Negociar por ameaça de violência iminente, use FOR no lugar de CAR."],
        ["Cheiro de Sangue","Depois de Matar e Pilhar contra um inimigo, seu próximo ataque contra ele causa +1d4 de dano."],
        ["Amador em Multiclasse","Adquira um movimento de outra classe considerando seu nível como 1 menor."],
        ["Pele de Ferro","Receba +1 armadura."],
        ["Ferreiro","Em uma forja, transfira os poderes mágicos de outra arma para sua arma favorita, destruindo a arma doadora."],
        ["Sede de Sangue","Substitui Implacável; quando causar dano, cause +1d8 de dano."],
        ["Perfeição com Armadura","Substitui Maestria com Armadura; negue o dano, receba +1 adiante contra o atacante e reduza armadura/escudo em 1."],
        ["Mau Olhado","Requer Visão Rubra; ao entrar em combate role+CAR, ganhe domínio e gaste-o para congelar/hesitar PNJs por contato visual."],
        ["Gosto por Sangue","Substitui Cheiro de Sangue; após Matar e Pilhar, o próximo ataque contra o alvo causa +1d8."],
        ["Iniciado em Multiclasse","Requer Amador em Multiclasse; adquira outro movimento de outra classe como se tivesse 1 nível a menos."],
        ["Pele de Aço","Substitui Pele de Ferro; receba +2 armadura."],
        ["Através dos Olhos da Morte","Ao entrar em batalha role+SAB para profetizar quais PNJs sobreviverão ou morrerão; o MJ torna a visão real."],
        ["Foco no Armamento","Ao examinar as armas inimigas, pergunte ao MJ quanto dano elas causam."],
        ["Guerreiro Superior","Em 12+ ao Matar e Pilhar, cause dano, evite o contra-ataque e impressione, desanime ou amedronte o adversário."]
      ])
    },
    ladrao: {
      advancedSplit: 9,
      advancedDescriptions: d([
        ["Golpe Desonesto","Com arma precisa ou de mão, Ataque pelas Costas causa +1d6 de dano."],
        ["Cauteloso","Ao usar Especialista em Armadilhas, receba domínio +1 mesmo em 6-."],
        ["Riqueza e Bom Gosto","Exiba sua posse mais valiosa; escolha alguém presente que fará qualquer coisa para obter esse item ou algo similar."],
        ["Atirar Primeiro","Você nunca é surpreendido; quando um inimigo o surpreender, você age primeiro."],
        ["Mestre dos Venenos","Depois de usar um veneno pela primeira vez, ele deixa de ser perigoso para você."],
        ["Envenenar","Aplique com facilidade venenos seguros para você; em arma, eles passam a funcionar como venenos de toque."],
        ["Produtor","Com tempo, componentes e local seguro, produza 3 doses de um veneno que já tenha usado."],
        ["Oprimido","Enquanto estiver em menor número, receba armadura +1."],
        ["Conexões","Espalhe rumores no submundo e role+CAR para encontrar aquilo de que precisa, com preço ou compromisso em 7–9."],
        ["Lutador Desonesto","Substitui Golpe Desonesto; Ataque pelas Costas com arma precisa/de mão causa +1d8 e seus outros ataques causam +1d4."],
        ["Extremamente Cauteloso","Substitui Cauteloso; Especialista em Armadilhas concede ainda mais domínio e informação."],
        ["Alquimista","Ao analisar um veneno, descubra sua composição e possa recriá-lo ou adaptá-lo com os recursos adequados."],
        ["Muito Oprimido","Substitui Oprimido; enquanto estiver em menor número, receba armadura +2."],
        ["Evasão","Quando Desafiar o Perigo para escapar de um efeito de área, em sucesso você evita completamente o efeito."],
        ["Rota de Fuga","Quando estiver em perigo e precisar sair, diga qual rota de fuga preparou ou percebeu; o MJ descreve o custo ou obstáculo."],
        ["Disfarce","Com tempo e materiais, crie um disfarce convincente; observadores o tratam como a identidade representada até haver motivo para suspeitar."],
        ["Assalto","Ao planejar um roubo, diga o que pretende tomar e pergunte ao MJ sobre oportunidades, riscos e segurança antes de agir."]
      ])
    },
    mago: {
      advancedSplit: 10,
      advancedDescriptions: d([
        ["Prodígio","Escolha um feitiço; você o prepara como se fosse 1 nível menor."],
        ["Magia Potencializada","Em 10+ ao Conjurar Feitiços, aceite uma consequência de 7–9 para maximizar efeitos ou dobrar alvos."],
        ["Fonte de Conhecimento","Ao Falar Difícil sobre algo que ninguém mais saiba, receba +1."],
        ["Sabe-Tudo","Quando outro personagem pedir seu conselho, se seguir sua solução recebe +1 adiante e você marca XP."],
        ["Grimório Expandido","Adicione ao grimório um feitiço de qualquer outra classe."],
        ["Encantador","Ao estudar um item mágico com segurança, pergunte ao MJ o que ele faz; a resposta é honesta."],
        ["Lógica","Use INT no lugar de SAB ao Discernir Realidades por dedução."],
        ["Proteção Arcana","Enquanto tiver pelo menos um feitiço de nível 1+ preparado, receba armadura +2."],
        ["Contramágica","Comprometa um feitiço preparado e role+INT para conter um feitiço arcano que o afetaria."],
        ["Estudar Rapidamente","Ao observar um feitiço arcano, descubra seu nome e efeitos e receba +1 adiante ao agir com a informação."],
        ["Mestre","Requer Prodígio; escolha outro feitiço para preparar como se fosse 1 nível menor."],
        ["Magia Potencializada Superior","Substitui Magia Potencializada; amplie efeitos/alvos com benefício maior em resultados elevados."],
        ["Alma de Encantador","Substitui Encantador; sua compreensão de itens mágicos se aprofunda e revela informação adicional útil."],
        ["Lógica Extrema","Substitui Lógica; sua dedução por INT em Discernir Realidades se torna ainda mais poderosa."],
        ["Armadura Arcana","Substitui Proteção Arcana; enquanto mantiver magia preparada, receba armadura superior."],
        ["Contramágica Protetora","Substitui Contramágica; sua contramágica pode proteger também alvos além de você."],
        ["Corrente Etérea","Ao tocar alguém, estabeleça uma ligação mística que permite perceber ou influenciar a conexão à distância enquanto persistir."],
        ["Fios Místicos de Marionete","Quando controlar magicamente uma pessoa, suas ações podem ser dirigidas com maior precisão enquanto o efeito durar."],
        ["Ampliação Mágica","Ao Conjurar Feitiços, estenda alcance, duração ou escala quando a ficção permitir e aceite o custo associado."],
        ["Autossuficiente","Quando tiver tempo e segurança, prepare recursos mágicos e soluções sem depender de assistência externa."]
      ])
    },
    paladino: {
      advancedSplit: 10,
      advancedDescriptions: d([
        ["Favor Divino","Dedique-se a uma divindade e adquira a capacidade de Conjurar Feitiços de Clérigo como se fosse de nível 1."],
        ["Proteção Sangrenta","Ao receber dano, você pode sofrer uma debilidade para reduzir o dano recebido."],
        ["Punição","Enquanto estiver em uma Busca, cause +1d4 de dano."],
        ["Exterminatus","Ao pronunciar julgamento sobre um inimigo de sua Busca, marque-o como alvo da sua autoridade e violência sagrada."],
        ["Investir!","Quando liderar uma investida ao combate, os aliados que o seguirem recebem +1 adiante."],
        ["Defensor Convicto","Ao Defender, receba domínio adicional e mantenha-se entre o perigo e aqueles que protege."],
        ["Preparar Ataque","Ao Matar e Pilhar, escolha um aliado; o próximo ataque dele contra o mesmo alvo causa +1d4."],
        ["Proteção Sagrada","Enquanto estiver em uma Busca, receba armadura +1."],
        ["Voz de Autoridade","Receba +1 ao comandar servos e seguidores que reconheçam sua autoridade."],
        ["Hospitalário","Quando curar um aliado, cure +1d8 adicional."],
        ["Prova de Fé","Requer Favor Divino; ao observar um feitiço divino, descubra qual divindade o concedeu e seus efeitos, recebendo +1 adiante ao agir com isso."],
        ["Punição Divina","Substitui Punição; enquanto estiver em uma Busca, cause +1d8 de dano."],
        ["Sempre em Frente","Substitui Investir!; aliados que seguem sua investida recebem +1 adiante e armadura +2 adiante."],
        ["Defensor Intransponível","Substitui Defensor Convicto; ao Defender, receba domínio extra e, em falha, ainda se coloque no caminho do atacante com vantagem ficcional."],
        ["Proteção Divina","Substitui Proteção Sagrada; enquanto estiver em uma Busca, receba armadura +2."],
        ["Autoridade Divina","Substitui Voz de Autoridade; +1 para comandar servos e resultados altos produzem obediência excepcional."],
        ["Hospitalário Perfeito","Substitui Hospitalário; quando curar um aliado, cure +2d8 adicional."],
        ["Indomável","Quando sofrer uma debilidade, receba +1 adiante contra quem a causou."],
        ["Cavaleiro Perfeito","Ao iniciar uma Busca, escolha três dádivas em vez de duas."]
      ])
    },
    ranger: {
      advancedSplit: 10,
      firstAdvanceOnly: ["Meio-Elfo"],
      advancedDescriptions: d([
        ["Meio-Elfo","No primeiro avanço, escolha uma raça de outra classe; você passa a contar como essa raça para movimentos raciais compatíveis."],
        ["Empatia Selvagem","Você pode falar e ser compreendido por animais."],
        ["Presa Conhecida","Ao Falar Difícil sobre um monstro, use SAB no lugar de INT e receba informação útil sobre a presa."],
        ["Golpe da Víbora","Ao lutar com duas armas, cause dano com ambas de modo coordenado quando a ficção permitir."],
        ["Camuflagem","Quando permanecer imóvel em ambiente natural, inimigos não o percebem até você agir ou se revelar."],
        ["Melhor Amigo do Homem","Quando permitir que seu companheiro animal receba um golpe por você, reduza ou negue o dano conforme a ficção e o treinamento dele."],
        ["Apagar o Sol","Ao Disparar, você pode gastar munição adicional para atingir múltiplos alvos ou pressionar uma área."],
        ["Bem Treinado","Escolha um treinamento adicional para seu companheiro animal."],
        ["Sigam-me","Ao realizar uma Jornada Perigosa, aliados que seguirem sua liderança recebem benefício em seu papel."],
        ["Local Seguro","Ao preparar acampamento em ambiente natural, você encontra ou cria um local defensável e seguro."],
        ["Discurso Selvagem","Substitui Empatia Selvagem; você se comunica amplamente com criaturas selvagens e entende seus sinais."],
        ["Presa do Caçador","Substitui Presa Conhecida; sua experiência com monstros concede informação e vantagem ainda maiores contra a presa."],
        ["Mordida da Víbora","Substitui Golpe da Víbora; sua técnica com duas armas causa dano mais devastador."],
        ["Barriga do Smaug","Quando souber explorar o ponto fraco de um monstro, seus ataques atravessam melhor sua defesa/armadura."],
        ["Andarilho","Você se move por ambientes naturais extremos com grande facilidade e reduz os perigos da jornada."],
        ["Local Ainda Mais Seguro","Substitui Local Seguro; o acampamento que você prepara oferece proteção superior para o grupo."],
        ["Observador","Ao Caçar e Rastrear, obtenha informação adicional sobre a presa e seu comportamento."],
        ["Truque Especial","Escolha um novo truque/treinamento excepcional para seu companheiro animal, definido com o MJ."],
        ["Aliado Sobrenatural","Seu companheiro animal ganha natureza sobrenatural e capacidades extraordinárias adequadas à ficção."]
      ])
    }
  };

  for (const [id, rules] of Object.entries(meta)) {
    if (!classes[id]) continue;
    Object.assign(classes[id], rules);
  }
})();
