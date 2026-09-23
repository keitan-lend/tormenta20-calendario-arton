/**
 * Dados canônicos do Calendário Artoniano.
 *
 * Fontes:
 * - Meses, dias da semana, Dias de Nimb, formato de hora: capítulo
 *   "Tempo & Calendário" do Livro Básico de Tormenta 20.
 * - Ciclo lunar (Vitália / fases Escudo, Foice, Treva, Arco): material
 *   de referência de calendário artoniano (não está no capítulo do
 *   Livro Básico, incluído aqui por pedido do mestre).
 * - Notas históricas de 1420 a 1425: Atlas de Arton e material de
 *   campanhas/streams oficiais recentes (ver README).
 */

export const MONTHS = [
  { id: 1, name: "Caravana", abbreviation: "Car", season: "primavera" },
  { id: 2, name: "Pomo", abbreviation: "Pom", season: "primavera" },
  { id: 3, name: "Keenvia", abbreviation: "Kee", season: "primavera" },
  { id: 4, name: "Sirravia", abbreviation: "Sir", season: "verao" },
  { id: 5, name: "Vigília", abbreviation: "Vig", season: "verao" },
  { id: 6, name: "Prussvia", abbreviation: "Pru", season: "verao" },
  { id: 7, name: "Ceifa", abbreviation: "Cei", season: "outono" },
  { id: 8, name: "Contenda", abbreviation: "Con", season: "outono" },
  { id: 9, name: "Clausura", abbreviation: "Cla", season: "outono" },
  { id: 10, name: "Pharstyth", abbreviation: "Pha", season: "inverno" },
  { id: 11, name: "Véu", abbreviation: "Véu", season: "inverno" },
  { id: 12, name: "Pyra", abbreviation: "Pyr", season: "inverno" }
];

export const SEASONS = {
  primavera: "Primavera",
  verao: "Verão",
  outono: "Outono",
  inverno: "Inverno"
};

// Índice 0-based. Dia 1 do ano-âncora corresponde a WEEKDAYS[settings.anchorWeekday].
export const WEEKDAYS = [
  { id: 0, name: "Valk", abbreviation: "Val" },
  { id: 1, name: "Hedryl", abbreviation: "Hed" },
  { id: 2, name: "Luna", abbreviation: "Lun" },
  { id: 3, name: "Astar", abbreviation: "Ast" },
  { id: 4, name: "Dallia", abbreviation: "Dal" },
  { id: 5, name: "Haya", abbreviation: "Hay" }, // dia de festejos
  { id: 6, name: "Leen", abbreviation: "Lee" } // dia de descanso ("descanso dos mortos")
];

/**
 * Vitália, a lua de Arton. Ciclo de 29 dias, calculado a partir dos
 * dias corridos de worldTime (independente dos Dias de Nimb — a lua
 * não segue o calendário artoniano, segue o próprio ciclo).
 */
export const MOON = {
  name: "Vitália",
  cycleLength: 29,
  phases: [
    { name: "Escudo", length: 16, icon: "shield" },
    { name: "Foice", length: 5, icon: "sickle" },
    { name: "Treva", length: 3, icon: "new" },
    { name: "Arco", length: 5, icon: "bow" }
  ]
};

/**
 * Datas especiais que se repetem todo ano (Livro Básico).
 * month/day usam o calendário normal de 30 dias (Dias de Nimb não
 * têm "mês", então nenhuma dessas cai em Dias de Nimb).
 */
export const RECURRING_EVENTS = [
  {
    id: "dia-do-reencontro",
    month: 1,
    day: 1,
    title: "Dia do Reencontro",
    description:
      "O dia mais importante do ano artoniano: aniversário da chegada dos refugiados de Lamnor aos pés da estátua de Valkaria. Grandes festas em todo o Reinado, especialmente em Valkaria. Também é o equinócio da primavera, celebrado por povos silvestres como elfos, sílfides e centauros."
  },
  {
    id: "cerimonia-do-plantio",
    month: 1,
    day: 15,
    title: "Cerimônia do Plantio",
    description:
      "Feriado popular entre camponeses que marca o início do plantio. Costuma-se plantar uma semente simbólica no solo. A Ordem de Lena também realiza, nesta data, a cerimônia que ordena suas jovens clérigas."
  },
  {
    id: "sckharal",
    month: 3,
    day: 20,
    durationDays: 7,
    title: "Sckharal",
    description:
      "Sete dias de festividades em Sckharshantallas, com dragões de vime, dançarinos, mágicos e companhias teatrais. O último dia é reservado à execução de criminosos."
  },
  {
    id: "dia-da-memoria",
    month: 4,
    day: 6,
    title: "Dia da Memória",
    description:
      "Cerimônia recente celebrada no Reinado para comemorar o fim da Guerra Artoniana e honrar os que caíram diante das tropas puristas."
  },
  {
    id: "admissao-ordem-da-luz",
    month: 5,
    day: 12,
    title: "Cerimônia de Admissão da Ordem da Luz",
    description:
      "Norm recebe jovens nobres, escudeiros e aventureiros que buscam ingressar na prestigiosa ordem de cavalaria."
  },
  {
    id: "exposicao-de-inventos",
    month: 7,
    day: 1,
    title: "Exposição de Inventos",
    description:
      "Grande mostra de engenhocas no Palácio Imperial de Valkaria, criada por Lorde Niebling. Recebe inventores de todas as raças, incluindo goblins."
  },
  {
    id: "grande-feira",
    month: 8,
    day: 11,
    durationDays: 7,
    title: "Grande Feira",
    description:
      "Semana de festividades que atrai milhares de aventureiros e visitantes para Nova Malpetrim."
  },
  {
    id: "noite-das-mascaras",
    month: 9,
    day: 17,
    title: "Noite das Máscaras",
    description:
      "Comemoração da fundação do reino de Ahlen. Em Thartann, todos usam máscaras e não há distinção entre nobres e plebeus. O ponto alto é o baile no Palácio Rishantor."
  },
  {
    id: "noite-das-sombras",
    month: 10,
    day: 7,
    title: "Noite das Sombras",
    description:
      "Noite temida em que espíritos e seres feéricos vagam com poder ampliado. A maioria dos artonianos se tranca em casa, orando por proteção."
  },
  {
    id: "dia-da-profecia",
    month: 12,
    day: 3,
    title: "Dia da Profecia",
    description:
      "Dia em que o povo busca orientação de seus clérigos — diz-se que, nesta data, as profecias costumam ser mais precisas."
  }
];

/**
 * Notas históricas ancoradas a um ano (sem dia específico conhecido).
 * Cobrem 1420 (ano em que o Livro Básico e o Atlas de Arton se
 * encerram) até 1425 (ano padrão sugerido para novas campanhas).
 */
export const YEAR_NOTES = [
  {
    id: "1420-ascensao-aharadak",
    year: 1420,
    title: "Ascensão de Aharadak",
    description:
      "Aharadak assume o posto de Deus Maior da Tormenta no Panteão; Ezequias Heldret torna-se seu sumo-sacerdote. A área de Tormenta de Zakharov é absorvida e reorganizada, dando origem ao domínio de Ahar'kadhan.",
    source: "Atlas de Arton"
  },
  {
    id: "1420-supremacia-purista",
    year: 1420,
    title: "Surge a Supremacia Purista",
    description:
      "O reino de Yudennach se transforma na Supremacia Purista, iniciando uma campanha de anexação e perseguição contra elfos, gnomos e outras raças não humanas.",
    source: "Atlas de Arton"
  },
  {
    id: "1420-aslothia",
    year: 1420,
    title: "Nasce o reino de Aslothia",
    description:
      "O antigo reino de Trebuck passa a ser governado pelo Rei Liche Asloth, consolidando-se como uma nação de mortos-vivos e magia sombria.",
    source: "Atlas de Arton"
  },
  {
    id: "1420-1421-campanhas-oficiais",
    year: 1420,
    title: "Início das grandes campanhas oficiais",
    description:
      "1420 marca o início de jornadas e transmissões oficiais como Coração de Rubi e Fim dos Tempos, além de outras aventuras como Lágrimas da Dragoa-Rainha, Ossos Afogados e Rastros do Terceiro.",
    source: "Material de campanhas oficiais"
  },
  {
    id: "1420-1425-montanhas-temerarias",
    year: 1421,
    title: "Disputas nas Montanhas Temerárias",
    description:
      "Lideranças locais, como Valette, enfrentam sucessivas disputas políticas para manter a autonomia da região frente a pressões externas — tensão que se estende até 1425.",
    source: "Atlas de Arton"
  },
  {
    id: "1420-1425-reconstrucao",
    year: 1425,
    title: "A reconstrução do Reinado",
    description:
      "Sob a Rainha-Imperatriz Shivara Sharpblade, o Reinado segue se reconstruindo. Vectora se estabiliza e se expande sob Vectorius, e o necromante Vladislav Tpish assume a reitoria da Academia Arcana após a abdicação de Talude.",
    source: "Atlas de Arton"
  }
];

export const DEFAULT_STARTING_YEAR = 1425;
