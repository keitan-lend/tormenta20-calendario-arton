# Calendário de Arton (Tormenta 20)

Módulo de calendário, relógio e ciclo lunar de Arton para o sistema **Tormenta 20** no Foundry VTT. Independente — não depende de nenhum outro módulo (não usa Seasons & Stars nem qualquer outro framework de calendário).

## Instalação

No Foundry, em **Configurar Módulos > Instalar Módulo**, cole o link do manifesto:

```
https://raw.githubusercontent.com/keitan-lend/tormenta20-calendario-arton/main/module.json
```

## Créditos

A ideia deste módulo nasceu de olhar o [Seasons-And-Stars-Tormenta20](https://github.com/Solemmbum/Seasons-And-Stars-Tormenta20), de Solemmbum — um pacote de calendário para o framework Seasons & Stars. Este módulo, porém, foi **construído do zero**: não usa o Seasons & Stars nem nenhum código daquele repositório, e segue um modelo de dados próprio (por conta, principalmente, da necessidade de representar os Dias de Nimb, que variam de ano para ano de um jeito que o formato do Seasons & Stars não previa).

## Fontes

- **Meses, dias da semana, Dias de Nimb, formato de hora**: capítulo "Tempo & Calendário" do Livro Básico de Tormenta 20. As regras vão até o ano **1420**, que é onde o Livro Básico e o Atlas de Arton encerram a linha do tempo oficial.
- **Ciclo lunar de Vitália** (fases Escudo, Foice, Treva, Arco): não consta no capítulo do Livro Básico ou no Altas de Arton — incluído com base em material antigo do Tormenta RPG.
- **Crônicas de 1420 a 1425** (ascensão de Aharadak, Supremacia Purista, Aslothia, reconstrução do Reinado sob Shivara Sharpblade etc.): Atlas de Arton e material de campanhas/streams oficiais recentes, não do Livro Básico.

O ano padrão para novas campanhas é **1425**, configurável pelo mestre nas configurações do módulo.

## Como funciona

- O `worldTime` do Foundry (segundos desde a criação do mundo) é convertido para uma data artoniana automaticamente. Não é preciso fazer nada além de avançar o tempo normalmente (combate, descanso, ou os botões do widget).
- **Dias de Nimb**: a quantidade (2 a 8) e a posição (depois de qual mês) são sorteadas automaticamente na primeira vez que o módulo precisa resolver uma data daquele ano, e o resultado fica salvo — não há botão de re-rolar, mas isso pode ser adicionado depois se for útil.
- **Dias da semana**: o ciclo de 7 dias (Valk, Hedryl, Luna, Astar, Dallia, Haya, Leen) ignora os Dias de Nimb, como sugerido no próprio livro (eles estão "fora do tempo normal"). Dias de Nimb não têm dia da semana.
- **Vitália (lua)**: segue seu próprio ciclo de 29 dias corridos, independente dos Dias de Nimb.
- **Notas/eventos**: as 10 datas especiais do Livro Básico e as crônicas de 1420-1425 já vêm cadastradas. O mestre pode editar, ocultar ou excluir qualquer uma delas, e adicionar novas — tudo pela janela do calendário (ícone de calendário nos controles de Anotações da cena, ou clicando no widget).

## Configurações (Configurar Módulos)

- **Ano inicial da campanha**: ano artoniano correspondente a `worldTime = 0`. Padrão: 1425.
- **Dia da semana do dia 1 de Caravana do ano inicial**: define o "alinhamento" dos dias da semana. Padrão: Valk.
- **Mostrar fase da lua**: liga/desliga a exibição de Vitália.

## Considerações

Outras simplificações assumidas de propósito:
- Anos antes da chegada dos elfos (era "AE") são suportados matematicamente (anos negativos), mas não têm interface dedicada — é um cenário raro de usar em jogo.
- O acesso ao botão do calendário foi colocado nos controles de "Anotações" da barra lateral de cenas; se o Foundry mudar esse layout, pode ser preciso ajustar `main.js`.
