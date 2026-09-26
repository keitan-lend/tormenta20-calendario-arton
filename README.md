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
- **Ciclo lunar de Vitália** (fases Escudo, Foice, Treva, Arco): não consta no capítulo do Livro Básico — incluído a pedido do mestre, com base em material de referência do calendário artoniano.
- **Crônicas de 1420 a 1425** (ascensão de Aharadak, Supremacia Purista, Aslothia, reconstrução do Reinado sob Shivara Sharpblade etc.): Atlas de Arton e material de campanhas/streams oficiais recentes, não do Livro Básico.

O ano padrão para novas campanhas é **1425**, configurável pelo mestre nas configurações do módulo.

## Como funciona

- O `worldTime` do Foundry (segundos desde a criação do mundo) é convertido para uma data artoniana automaticamente. Não é preciso fazer nada além de avançar o tempo normalmente (combate, descanso, ou os botões do widget).
- **Dias de Nimb**: a quantidade (2 a 8) é sorteada automaticamente na primeira vez que o módulo precisa resolver uma data daquele ano, e **cada Dia de Nimb sorteia seu próprio mês** de inserção (podem empilhar vários no mesmo mês ou se espalhar pelo ano). O mestre pode "Rerrolar" os Dias de Nimb de um ano específico nas ferramentas do mestre. Para anos futuros (ainda não alcançados pelo relógio do mundo), a janela do calendário não revela onde caem os Dias de Nimb — só quando o tempo chega lá, como no livro ("nem os astrônomos conseguem prever").
- **Dias da semana**: o ciclo de 7 dias (Valk, Hedryl, Luna, Astar, Dallia, Haya, Leen) ignora os Dias de Nimb, como sugerido no próprio livro (eles estão "fora do tempo normal"). Dias de Nimb não têm dia da semana.
- **Vitália (lua)**: segue seu próprio ciclo de 29 dias corridos, independente dos Dias de Nimb.
- **Notas/eventos**: as 10 datas especiais do Livro Básico e as crônicas de 1420-1425 já vêm cadastradas, e o mestre pode adicionar outras. Por padrão, as oficiais só podem ser ocultadas (não editadas nem excluídas) — ative "Permitir editar/excluir eventos e crônicas canônicos" nas configurações do módulo se sua mesa altera esses fatos do mundo. O botão "Restaurar canônicos" nas ferramentas do mestre desfaz qualquer edição/exclusão do oficial a qualquer momento, sem tocar no personalizado.
- **Ocultar eventos dos jogadores**: cada evento/crônica (oficial ou personalizado) tem um ícone de olho — o mestre pode ocultar algo dos jogadores e revelar só quando acontecer na narrativa. Jogadores não veem nem a estrelinha do dia na grade quando o único evento daquele dia está oculto.
- **Ocultar o calendário inteiro**: nas ferramentas do mestre dá pra esconder o widget e a janela do calendário de todos os jogadores, ou de jogadores específicos — útil pra quando os personagens perdem a noção do tempo (masmorra, inconsciência etc.). Quem está afetado só vê "Você perdeu a noção do tempo...".
- **Acesso ao widget**: aparece para todos os conectados, é arrastável (a posição fica salva por jogador) e pode ser recolhido/reaberto clicando nele. Também dá pra mostrar/esconder pelo ícone de calendário nos controles de cena (grupo de ferramentas de token), pelo comando de chat `/t20cal`, ou via `window.t20cal.show()` / `.hide()` no console (F12) como plano B se o widget sumir da tela.

## Configurações (Configurar Módulos)

- **Ano artoniano padrão** (e **hora/minuto iniciais**): usados só automaticamente na primeira vez que o módulo roda no mundo, para calibrar a data (trata o `worldTime` atual como esse dia/hora — funciona tanto pra mundo novo quanto pra campanha já em andamento). Depois disso, use "Calibrar data atual" na janela do calendário para corrigir/ajustar.
- **Dia da semana do dia 1 de Caravana do ano de calibração**: define o "alinhamento" dos dias da semana. Padrão: Valk.
- **Mostrar fase da lua**: liga/desliga a exibição de Vitália.

## Ferramentas do mestre (na janela do calendário)

- **Calibrar data atual**: define que "agora" corresponde a um ano/mês/dia específico. Use isso se a data mostrada não bater com a sua campanha (por exemplo, logo após instalar o módulo numa campanha que já estava em andamento).
- **Definir hora atual**: ajusta a hora/minuto sem mexer no dia.
- **Avançar/retroceder**: pula quantidade de horas, dias ou anos pra frente ou pra trás (útil pra viagens no tempo ou pra adiantar o relógio rapidamente).
- **Rerrolar Dias de Nimb**: sorteia de novo a quantidade e a posição dos Dias de Nimb do ano exibido (pede confirmação antes).
- **Restaurar canônicos**: desfaz edições/exclusões feitas nas datas e crônicas oficiais, sem afetar as personalizadas.
- **Ocultar calendário dos jogadores**: de todos ou de jogadores específicos.
- Clicar em qualquer dia da grade do mês, ou em um Dia de Nimb específico na lista abaixo da grade, também pula o tempo do mundo pra lá (mantendo a hora atual).

## Limitações conhecidas / pontos para testar

Este módulo foi escrito sem acesso a uma instância real do Foundry para testar — a API de `ApplicationV2`/`DialogV2` usada aqui segue a documentação oficial do Foundry v13/v14, mas pode haver ajustes finos necessários (nomes de hooks, classes CSS do core, etc.). Ao instalar:

1. Confira o console do navegador (F12) por erros ao carregar o módulo.
2. Teste abrir o widget, avançar o tempo e abrir a janela do calendário.
3. Teste adicionar/editar uma data e uma crônica.

Qualquer erro de console, é só colar o texto — ajusto rapidamente.

Outras simplificações assumidas de propósito:
- Anos antes da chegada dos elfos (era "AE") são suportados matematicamente (anos negativos), mas não têm interface dedicada — é um cenário raro de usar em jogo.
- O widget flutuante aparece para todos os conectados (jogadores e mestre); só o mestre vê/usa os controles de avanço de tempo e edição.

### Changelog

- **1.3.0**: três pedidos de mesas que testaram o módulo — (1) nova configuração "Permitir editar/excluir eventos e crônicas canônicos" (desativada por padrão) para mesas que alteram o mundo, com botão "Restaurar canônicos" para desfazer sem afetar o personalizado; (2) ícone de olho em cada evento/crônica para o mestre ocultar/revelar individualmente aos jogadores; (3) opção de ocultar o calendário inteiro (widget + janela) de todos os jogadores ou de jogadores específicos, para narrar perda de noção do tempo.
- **1.2.1**: corrige o widget ficar preso no lugar errado e não ser arrastável (faltava `position: fixed` no CSS — sem isso, mudar a posição não tinha efeito visual nenhum). A posição padrão agora respeita a borda real da sidebar do Foundry, então o widget nunca nasce nem pode ser arrastado por trás/embaixo dela. O cabeçalho da janela do calendário e o seletor de mês nas ferramentas do mestre agora mostram o número do mês antes do nome (ex.: "7 - Ceifa"); o resto do texto (datas por extenso, eventos) continua só com o nome, pra não ficar estranho na leitura.
- **1.2.0**: Dias de Nimb agora são sorteados individualmente (cada um com seu próprio mês, podendo empilhar ou se espalhar pelo ano), com ferramenta de "Rerrolar" para o mestre; anos futuros não revelam onde caem os Dias de Nimb até o relógio do mundo chegar lá; widget agora é arrastável com posição salva por jogador, e pode ser mostrado/escondido por um ícone nos controles de cena, pelo comando `/t20cal` ou por `window.t20cal` no console; datas e crônicas oficiais não podem mais ser excluídas (só editadas), e excluir uma personalizada agora pede confirmação; formulários de evento/crônica escapam HTML para evitar problemas com títulos/descrições copiados de outro lugar; novas configurações de hora/minuto padrão para a calibração automática inicial.
- **1.1.0**: corrige o bug em que instalar o módulo numa campanha já em andamento fazia o ano "pular" para um valor aleatório (agora a primeira execução calibra automaticamente a data pelo `worldTime` atual, e há uma ferramenta de "Calibrar data atual" pra corrigir manualmente quando precisar). Widget agora é uma caixinha flutuante fixa (canto superior direito), recolhível/reabrível clicando nela — não depende mais dos controles de Anotações da cena. Adiciona ferramentas do mestre para definir hora exata e avançar/retroceder em horas, dias ou anos. Mostra o total de Dias de Nimb do ano sempre visível (widget e janela do calendário).
- **1.0.0**: versão inicial.
