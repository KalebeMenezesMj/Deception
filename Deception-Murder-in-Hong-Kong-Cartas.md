# Deception: Murder in Hong Kong — Lista Completa de Cartas

> Lista de **todas as cartas** do jogo base **Deception: Murder in Hong Kong**, com o que está
> **escrito** em cada uma (nome/legenda) e uma descrição do que está **desenhado**.
>
> **Fonte da lista:** implementação digital fiel do jogo no GitHub —
> [thomashorta/mihk-compose-desktop](https://github.com/thomashorta/mihk-compose-desktop)
> (arquivo `src/main/kotlin/data/source/HardcodedDataSource.kt`), conferida contra as regras oficiais.
> Os nomes correspondem ao conteúdo real do jogo físico.
>
> ⚠️ **Nota sobre as ilustrações:** cada carta traz o **nome do item** impresso e um **ícone/pictograma
> (desenho simplificado) do objeto**. As cartas de Pista são **vermelhas**; as de Meio são **azuis**.
> Os Scene tiles trazem o **título da categoria** e **6 opções**, cada uma com texto e ícone.
> Este documento lista o **texto** de cada carta; os desenhos são ícones correspondentes a cada item
> (ex.: a carta "Knife"/Faca mostra uma faca; "Fingerprint" mostra uma impressão digital etc.).

---

## Índice

1. [Cartas de Papel (Role Cards) — 12](#1-cartas-de-papel-role-cards--12)
2. [Scene Tiles (Ladrilhos de Cena)](#2-scene-tiles-ladrilhos-de-cena)
3. [Cartas de Meio (Means of Murder) — 90](#3-cartas-de-meio-means-of-murder--90)
4. [Cartas de Pista (Clue Cards) — 200](#4-cartas-de-pista-clue-cards--200)
5. [Cartas da Expansão (Undercover Allies)](#5-cartas-da-expansão-undercover-allies)

---

## 1. Cartas de Papel (Role Cards) — 12

Cada carta traz o **nome do papel** e uma **instrução curta** do que aquele papel faz (resumo do
texto/função, conforme as regras):

| # | Papel (EN) | Papel (PT) | Lado | Função escrita na carta (resumo) |
|---|---|---|---|---|
| 1 | Forensic Scientist | Cientista Forense | Investigadores | Conhece a solução. Deve guiar os investigadores **apenas** com os Scene tiles — sem falar, gesticular ou dar pistas. Vence com os investigadores. |
| 2 | Murderer | Assassino | Culpados | Escolhe secretamente 1 Pista + 1 Meio como a solução do crime. Vence se o crime não for solucionado, mesmo que seja descoberto. |
| 3 | Accomplice | Cúmplice | Culpados | Conhece o Assassino e a solução. Vence junto com o Assassino. |
| 4 | Witness | Testemunha | Investigadores | Viu os culpados, mas não sabe qual é o Assassino e qual é o Cúmplice. Se o Assassino acertar quem é a Testemunha, os culpados vencem. |
| 5–12 | Investigator (×8) | Investigador | Investigadores | Analisa as pistas e tenta nomear corretamente as duas cartas da solução. |

> Distribuição típica por nº de jogadores (ver regras): o **Forensic Scientist**, **Murderer** e os
> **Investigators** são sempre usados; **Accomplice**, **Witness** e papéis da expansão entram conforme
> o tamanho do grupo.

---

## 2. Scene Tiles (Ladrilhos de Cena)

Cada Scene tile tem um **título de categoria** e **6 descritores**. O Forensic Scientist coloca os
marcadores de bala (Bullets) sobre os descritores que se aplicam à solução.

### Fixos (sempre presentes)

**Cause of Death (Causa da Morte):**
`Suffocation` (Asfixia) · `Severe Injury` (Ferimento grave) · `Loss of Blood` (Perda de sangue) ·
`Illness/Disease` (Doença) · `Poisoning` (Envenenamento) · `Accident` (Acidente)

**Location of Crime (Local do Crime) — 4 tiles, o Forensic Scientist escolhe um:**
- Título 1: `Living Room` (Sala) · `Bedroom` (Quarto) · `Storeroom` (Depósito) · `Bathroom` (Banheiro) · `Kitchen` (Cozinha) · `Balcony` (Varanda)
- Título 2: `Vacation Home` (Casa de veraneio) · `Park` (Parque) · `Supermarket` (Supermercado) · `School` (Escola) · `Woods` (Mata) · `Bank` (Banco)
- Título 3: `Pub` (Bar) · `Bookstore` (Livraria) · `Restaurant` (Restaurante) · `Hotel` (Hotel) · `Hospital` (Hospital) · `Building Site` (Obra)
- Título 4: `Playground` (Parquinho) · `Classroom` (Sala de aula) · `Dormitory` (Dormitório) · `Cafeteria` (Refeitório) · `Elevator` (Elevador) · `Toilet` (Banheiro público)

### Demais tiles (categoria + 6 opções)

| Categoria (EN) | Tradução | Opções (texto do tile) |
|---|---|---|
| Motive of Crime | Motivo do crime | Hatred (Ódio) · Power (Poder) · Money (Dinheiro) · Love (Amor) · Jealousy (Ciúme) · Justice (Justiça) |
| Weather | Clima | Sunny (Ensolarado) · Stormy (Tempestade) · Dry (Seco) · Humid (Úmido) · Cold (Frio) · Hot (Quente) |
| Hint on Corpse | Indício no corpo | Head (Cabeça) · Chest (Peito) · Hand (Mão) · Leg (Perna) · Partial (Parcial) · All-over (Todo o corpo) |
| General Impression | Impressão geral | Common (Comum) · Creative (Criativo) · Fishy (Suspeito) · Cruel (Cruel) · Horrible (Horrível) · Suspenseful (Cheio de suspense) |
| Corpse Condition | Estado do corpo | Still Warm (Ainda quente) · Stiff (Rígido) · Decayed (Decomposto) · Incomplete (Incompleto) · Intact (Intacto) · Twisted (Retorcido) |
| Victim's Identity | Identidade da vítima | Child (Criança) · Young Adult (Jovem adulto) · Middle-Aged (Meia-idade) · Senior (Idoso) · Male (Masculino) · Female (Feminino) |
| Murderer's Personality | Personalidade do assassino | Arrogant (Arrogante) · Despicable (Desprezível) · Furious (Furioso) · Greedy (Ganancioso) · Forceful (Brutal) · Perverted (Perverso) |
| State of The Scene | Estado da cena | Bits and Pieces (Em pedaços) · Ashes (Cinzas) · Water Stain (Mancha de água) · Cracked (Rachado) · Disorderly (Desordenado) · Tidy (Arrumado) |
| Victim's Build | Compleição da vítima | Large (Grande) · Thin (Magro) · Tall (Alto) · Short (Baixo) · Disfigured (Desfigurado) · Fit (Em forma) |
| Victim's Clothes | Roupas da vítima | Neat (Arrumadas) · Untidy (Desarrumadas) · Elegant (Elegantes) · Shabby (Surradas) · Bizarre (Bizarras) · Naked (Nua) |
| Evidence Left Behind | Evidência deixada | Natural (Natural) · Artistic (Artística) · Written (Escrita) · Synthetic (Sintética) · Personal (Pessoal) · Unrelated (Sem relação) |
| Victim's Expression | Expressão da vítima | Peaceful (Serena) · Struggling (Lutando) · Frightened (Assustada) · In Pain (Com dor) · Blank (Vazia) · Angry (Brava) |
| Time of Death | Hora da morte | Dawn (Amanhecer) · Morning (Manhã) · Noon (Meio-dia) · Afternoon (Tarde) · Evening (Noite) · Midnight (Meia-noite) |
| Duration of Crime | Duração do crime | Instantaneous (Instantâneo) · Brief (Breve) · Gradual (Gradual) · Prolonged (Prolongado) · Few Days (Alguns dias) · Unclear (Incerto) |
| Trace at the Scene | Vestígio na cena | Fingerprint (Impressão digital) · Footprint (Pegada) · Bruise (Contusão) · Blood Stain (Mancha de sangue) · Body Fluid (Fluido corporal) · Scar (Cicatriz) |
| Noticed by Bystander | Percebido por testemunha | Sudden sound (Som súbito) · Prolonged sound (Som prolongado) · Smell (Cheiro) · Visual (Visual) · Action (Ação) · Nothing (Nada) |
| Social Relationship | Relação social | Relatives (Parentes) · Friends (Amigos) · Colleagues (Colegas) · Employer/Employee (Patrão/Empregado) · Lovers (Amantes) · Strangers (Estranhos) |
| Victim's Occupation | Ocupação da vítima | Boss (Chefe) · Professional (Profissional liberal) · Worker (Operário) · Student (Estudante) · Unemployed (Desempregado) · Retired (Aposentado) |
| In Progress | Em andamento (o que fazia) | Entertainment (Entretenimento) · Relaxation (Relaxamento) · Assembly (Reunião) · Trading (Negócio) · Visit (Visita) · Dining (Jantar) |
| Sudden Incident | Incidente súbito | Power Failure (Queda de energia) · Fire (Incêndio) · Conflict (Conflito) · Loss of Valuables (Perda de valores) · Scream (Grito) · Nothing (Nada) |
| Day of Crime | Dia do crime | Weekday (Dia de semana) · Weekend (Fim de semana) · Spring (Primavera) · Summer (Verão) · Autumn (Outono) · Winter (Inverno) |

---

## 3. Cartas de Meio (Means of Murder) — 90

Cartas **azuis** — a "arma"/meio do assassinato. Cada uma tem o **nome** impresso e um **ícone** do objeto.

| # | Carta (EN) | Tradução (PT) | # | Carta (EN) | Tradução (PT) |
|---|---|---|---|---|---|
| 1 | Alcohol | Álcool | 46 | Match | Fósforo |
| 2 | Amoeba | Ameba | 47 | Mercury | Mercúrio |
| 3 | Arsenic | Arsênico | 48 | Metal Chain | Corrente de metal |
| 4 | Arson | Incêndio criminoso | 49 | Metal Wire | Arame |
| 5 | Axe | Machado | 50 | Overdose | Overdose |
| 6 | Bamboo Tip | Ponta de bambu | 51 | Packing Tape | Fita adesiva |
| 7 | Bat | Taco (bastão) | 52 | Pesticide | Pesticida |
| 8 | Belt | Cinto | 53 | Pill | Pílula |
| 9 | Bite And Tear | Morder e rasgar | 54 | Pillow | Travesseiro |
| 10 | Blender | Liquidificador | 55 | Pistol | Pistola |
| 11 | Blood Release | Sangria | 56 | Plague | Praga |
| 12 | Box Cutter | Estilete | 57 | Plastic Bag | Saco plástico |
| 13 | Brick | Tijolo | 58 | Poisonous Gas | Gás venenoso |
| 14 | Bury | Enterrar | 59 | Poisonous Needle | Agulha envenenada |
| 15 | Candlestick | Castiçal | 60 | Potted Plant | Vaso de planta |
| 16 | Chainsaw | Motosserra | 61 | Powder Drug | Droga em pó |
| 17 | Chemicals | Produtos químicos | 62 | Punch | Soco |
| 18 | Cleaver | Cutelo | 63 | Push | Empurrão |
| 19 | Crutch | Muleta | 64 | Radiation | Radiação |
| 20 | Dagger | Adaga | 65 | Razor Blade | Lâmina de barbear |
| 21 | Dirty Water | Água suja | 66 | Rope | Corda |
| 22 | Dismember | Esquartejar | 67 | Scarf | Cachecol |
| 23 | Drill | Furadeira | 68 | Scissors | Tesoura |
| 24 | Drown | Afogar | 69 | Sculpture | Escultura |
| 25 | Dumbbell | Haltere | 70 | Smoke | Fumaça |
| 26 | E-Bike | Bicicleta elétrica | 71 | Sniper | Sniper (atirador) |
| 27 | Electric Baton | Cassetete elétrico | 72 | Starvation | Inanição |
| 28 | Electric Current | Corrente elétrica | 73 | Steel Tube | Tubo de aço |
| 29 | Explosives | Explosivos | 74 | Stone | Pedra |
| 30 | Folding Chair | Cadeira dobrável | 75 | Sulfuric Acid | Ácido sulfúrico |
| 31 | Gunpowder | Pólvora | 76 | Surgery | Cirurgia |
| 32 | Hammer | Martelo | 77 | Throat Slit | Garganta cortada |
| 33 | Hook | Gancho | 78 | Towel | Toalha |
| 34 | Ice Skates | Patins de gelo | 79 | Trophy | Troféu |
| 35 | Illegal Drug | Droga ilegal | 80 | Trowel | Colher de pedreiro |
| 36 | Injection | Injeção | 81 | Unarmed | Desarmado |
| 37 | Kerosene | Querosene | 82 | Venomous Scorpion | Escorpião venenoso |
| 38 | Kick | Chute | 83 | Venomous Snake | Cobra venenosa |
| 39 | Knife And Fork | Faca e garfo | 84 | Video Game Console | Videogame |
| 40 | Lighter | Isqueiro | 85 | Virus | Vírus |
| 41 | Liquid Drug | Droga líquida | 86 | Whip | Chicote |
| 42 | Locked Room | Quarto trancado | 87 | Wine | Vinho |
| 43 | Machete | Facão | 88 | Wire | Fio |
| 44 | Machine | Máquina | 89 | Work | Trabalho/esforço |
| 45 | Mad Dog | Cachorro raivoso | 90 | Wrench | Chave inglesa |

---

## 4. Cartas de Pista (Clue Cards) — 200

Cartas **vermelhas** — a "evidência-chave". Cada uma tem o **nome** impresso e um **ícone** do objeto.

| # | Carta (EN) | Tradução (PT) | # | Carta (EN) | Tradução (PT) |
|---|---|---|---|---|---|
| 1 | Air Conditioning | Ar-condicionado | 101 | Lock | Cadeado |
| 2 | Ants | Formigas | 102 | Lottery Ticket | Bilhete de loteria |
| 3 | Antique | Antiguidade | 103 | Love Letter | Carta de amor |
| 4 | Apple | Maçã | 104 | Luggage | Bagagem |
| 5 | Badge | Distintivo | 105 | Lunch Box | Marmita |
| 6 | Bandage | Atadura | 106 | Magazine | Revista |
| 7 | Banknote | Cédula de dinheiro | 107 | Mahjong Tiles | Peças de mahjong |
| 8 | Bell | Sino | 108 | Map | Mapa |
| 9 | Betting Chips | Fichas de aposta | 109 | Mark | Marca |
| 10 | Blood | Sangue | 110 | Mask | Máscara |
| 11 | Bone | Osso | 111 | Maze | Labirinto |
| 12 | Book | Livro | 112 | Menu | Cardápio |
| 13 | Bracelet | Pulseira | 113 | Mirror | Espelho |
| 14 | Bread | Pão | 114 | Mobile Phone | Celular |
| 15 | Briefs | Cueca | 115 | Model | Modelo/maquete |
| 16 | Broom | Vassoura | 116 | Mosquito | Mosquito |
| 17 | Bullet | Bala (projétil) | 117 | Mosquito Coil | Espiral anti-mosquito |
| 18 | Button | Botão | 118 | Nail | Prego |
| 19 | Cake | Bolo | 119 | Name Card | Cartão de visita |
| 20 | Calendar | Calendário | 120 | Necklace | Colar |
| 21 | Candy | Doce | 121 | Needle And Thread | Agulha e linha |
| 22 | Carton | Caixa de papelão | 122 | Newspaper | Jornal |
| 23 | Cassette Tape | Fita cassete | 123 | Note | Bilhete/nota |
| 24 | Cat | Gato | 124 | Notebook | Caderno |
| 25 | Certificate | Certificado | 125 | Numbers | Números |
| 26 | Chalk | Giz | 126 | Office Supplies | Material de escritório |
| 27 | Cigar | Charuto | 127 | Oil Painting | Pintura a óleo |
| 28 | Cigarette Ash | Cinza de cigarro | 128 | Oil Stain | Mancha de óleo |
| 29 | Cigarette Butt | Bituca de cigarro | 129 | Paint | Tinta |
| 30 | Cleaning Cloth | Pano de limpeza | 130 | Panties | Calcinha |
| 31 | Cockroach | Barata | 131 | Peanut | Amendoim |
| 32 | Coffee | Café | 132 | Perfume | Perfume |
| 33 | Coins | Moedas | 133 | Photograph | Fotografia |
| 34 | Comics | Quadrinhos | 134 | Plant | Planta |
| 35 | Computer | Computador | 135 | Plastic | Plástico |
| 36 | Computer Disk | Disquete | 136 | Playing Cards | Baralho |
| 37 | Computer Mouse | Mouse | 137 | Pocket Watch | Relógio de bolso |
| 38 | Confidential Letter | Carta confidencial | 138 | Postal Stamp | Selo postal |
| 39 | Cosmetic Mask | Máscara de beleza | 139 | Powder | Pó |
| 40 | Cotton | Algodão | 140 | Prescription | Receita médica |
| 41 | Cup | Xícara | 141 | Puppet | Marionete |
| 42 | Curtains | Cortinas | 142 | Push Pin | Tacha/alfinete |
| 43 | Dentures | Dentadura | 143 | Puzzle | Quebra-cabeça |
| 44 | Diamond | Diamante | 144 | Raincoat | Capa de chuva |
| 45 | Diary | Diário | 145 | Rat | Rato |
| 46 | Dice | Dados | 146 | Receipt | Recibo |
| 47 | Dictionary | Dicionário | 147 | Red Wine | Vinho tinto |
| 48 | Dirt | Sujeira/terra | 148 | Riddle | Charada |
| 49 | Documents | Documentos | 149 | Ring | Anel |
| 50 | Dog Fur | Pelo de cachorro | 150 | Rose | Rosa |
| 51 | Dust | Poeira | 151 | Rubber Stamp | Carimbo |
| 52 | Earrings | Brincos | 152 | Sack | Saco |
| 53 | Eggs | Ovos | 153 | Safety Pin | Alfinete de segurança |
| 54 | Electric Circuit | Circuito elétrico | 154 | Sand | Areia |
| 55 | Envelope | Envelope | 155 | Sawdust | Serragem |
| 56 | Exam Paper | Prova | 156 | Seasoning | Tempero |
| 57 | Express Courier | Entrega expressa | 157 | Signature | Assinatura |
| 58 | Fan | Ventilador | 158 | Skull | Crânio |
| 59 | Fax | Fax | 159 | Snacks | Salgadinhos |
| 60 | Fiber Optics | Fibra óptica | 160 | Soap | Sabonete |
| 61 | Fingernails | Unhas | 161 | Sock | Meia |
| 62 | Flashlight | Lanterna | 162 | Soft Drink | Refrigerante |
| 63 | Flip-Flop | Chinelo | 163 | Speaker | Caixa de som |
| 64 | Flute | Flauta | 164 | Specimen | Amostra |
| 65 | Flyer | Panfleto | 165 | Spider | Aranha |
| 66 | Food Ingredients | Ingredientes | 166 | Spinning Top | Pião |
| 67 | Gear | Engrenagem | 167 | Sponge | Esponja |
| 68 | Gift | Presente | 168 | Spring | Mola |
| 69 | Gloves | Luvas | 169 | Steamed Buns | Pãezinhos no vapor |
| 70 | Glue | Cola | 170 | Stockings | Meia-calça |
| 71 | Graffiti | Grafite/pichado | 171 | Stuffed Toy | Bicho de pelúcia |
| 72 | Hair | Cabelo | 172 | Suit | Terno |
| 73 | Hairpin | Grampo de cabelo | 173 | Sunglasses | Óculos de sol |
| 74 | Handcuffs | Algemas | 174 | Surgical Mask | Máscara cirúrgica |
| 75 | Hanger | Cabide | 175 | Surveillance Camera | Câmera de vigilância |
| 76 | Hat | Chapéu | 176 | Switch | Interruptor |
| 77 | Headset | Fone de ouvido | 177 | Syringe | Seringa |
| 78 | Helmet | Capacete | 178 | Table Lamp | Abajur |
| 79 | Herbal Medicine | Remédio herbal | 179 | Take-Out | Comida para viagem |
| 80 | High Heel | Salto alto | 180 | Tattoo | Tatuagem |
| 81 | Hourglass | Ampulheta | 181 | Tea Leaves | Folhas de chá |
| 82 | Ice | Gelo | 182 | Telephone | Telefone |
| 83 | ID Card | Documento de identidade | 183 | Test Tube | Tubo de ensaio |
| 84 | Ink | Tinta (caneta) | 184 | Tie | Gravata |
| 85 | Insect | Inseto | 185 | Timber | Madeira/tora |
| 86 | Internet Cable | Cabo de internet | 186 | Tissue | Lenço de papel |
| 87 | Invitation Card | Convite | 187 | Tool Box | Caixa de ferramentas |
| 88 | IOU Note | Nota promissória | 188 | Toothpicks | Palitos de dente |
| 89 | Iron | Ferro de passar | 189 | Toy | Brinquedo |
| 90 | IV Bag | Bolsa de soro | 190 | Toy Blocks | Blocos de montar |
| 91 | Jacket | Jaqueta | 191 | Tweezers | Pinça |
| 92 | Jewelry | Joias | 192 | Umbrella | Guarda-chuva |
| 93 | Juice | Suco | 193 | Uniform | Uniforme |
| 94 | Key | Chave | 194 | USB Flash Drive | Pendrive |
| 95 | Leaf | Folha | 195 | Vegetables | Legumes |
| 96 | Leather Bag | Bolsa de couro | 196 | Video Camera | Filmadora |
| 97 | Leather Shoe | Sapato de couro | 197 | Violin | Violino |
| 98 | Lens | Lente | 198 | Wallet | Carteira |
| 99 | Light Bulb | Lâmpada | 199 | Watch | Relógio de pulso |
| 100 | Lipstick | Batom | 200 | Wig | Peruca |

---

## 5. Cartas da Expansão (Undercover Allies)

A expansão **adiciona** (componentes oficiais):

- **3 Role cards** novas (pretas): `Lab Technician`, `Protective Detail`, `Inside Man`;
- **90 Clue cards** e **54 Means cards** adicionais (nomes não listados nesta fonte — embaralhadas junto às do base);
- **9 Scene tiles** novos;
- **2 Badge tokens**;
- **Event tile "The Perfect Crime"**.

> A lista completa dos nomes das **90 Clue + 54 Means extras da expansão** não consta na fonte
> consultada (que cobre o conjunto base de 200 Clue + 90 Means). Para obtê-la, seria necessário o
> conteúdo físico da expansão ou uma fonte que a liste explicitamente.

---

## Observações gerais sobre o design das cartas

- **Cartas de Pista (Clue):** fundo/identidade visual **vermelha**; no centro, um **ícone (pictograma)**
  representando o item; o **nome do item** impresso abaixo/acima do ícone.
- **Cartas de Meio (Means):** identidade visual **azul**; mesmo layout (ícone + nome do item).
- **Scene tiles:** retângulos com o **título da categoria** no topo e **6 opções**, cada uma com um
  **pequeno ícone** e o **texto** correspondente. Os dois fixos são **Location of Crime** e
  **Cause of Death**.
- **Role cards:** cartas de papel (não de item) com o **nome do papel** e uma **instrução** curta.
- **Bullet markers (6):** marcadores em forma de bala usados para apontar as opções nos Scene tiles.
- **Badges (11):** fichas que representam a **tentativa de solução** de cada jogador.

---

*Lista compilada em 20/09/2026 a partir da implementação digital do jogo
([github.com/thomashorta/mihk-compose-desktop](https://github.com/thomashorta/mihk-compose-desktop))
e conferida contra as regras oficiais. Typos da fonte foram corrigidos (ex.: "Calender" → Calendar).*
