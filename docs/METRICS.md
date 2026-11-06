# Como analisar seus projetos no CapitalScope

O painel foi revisado para comparar o ciclo completo de cada projeto, o caixa já movimentado e o custo de oportunidade do tempo. As mesmas definições são usadas na visão do projeto, na lista e na carteira.

## Comece por estes passos

1. Abra o projeto em [CapitalScope](http://localhost:3000). O idioma padrão é inglês; para seguir os rótulos deste guia, selecione **Português** no seletor **Language** do cabeçalho.
2. Em **Lançamentos**, cadastre aquisição, reforma, manutenção, comissões, impostos e venda. Inclua custos futuros conhecidos. A recorrência é informativa: selecionar “mensal” não gera parcelas automaticamente.
3. Preencha o valor realizado quando a linha estiver encerrada. Para uma parcela paga/recebida e outra futura, use linhas separadas. Zero ou vazio significa pendente; marque **Liquidado a zero** para encerrar uma despesa sem pagamento ou uma receita sem recebimento.
4. Em **Visão geral**, confira lucro, ROI e margem previstos. A previsão usa o valor realizado nas linhas encerradas e o planejado nas pendentes.
5. Em **Projeto × CDI**, informe a duração total, do primeiro desembolso ao recebimento da venda, e a taxa anual hipotética. Clique em **Salvar premissas**. Prazo e taxa são salvos por projeto e usados também na simulação.
6. Leia o lucro acima do CDI, a receita necessária para empatar e os meses para o CDI alcançar o ROI. Abra a comparação de prazos para testar atrasos.
7. Em **Simulação de risco**, ajuste a incerteza das receitas e despesas pendentes e do tempo. Confira a chance de superar o CDI e os resultados mais desfavoráveis. Há explicações clicáveis em cada cartão e na aba **Como usar**.

## As métricas que respondem às decisões

| Métrica | O que responde | Como usar |
|---|---|---|
| Lucro previsto | Quanto sobra no ciclo completo? | Receita prevista de conclusão menos custo estimado de conclusão. Confira se todos os custos e tributos foram incluídos. |
| ROI sobre custos | Quanto o projeto rende sobre seu custo? | Lucro ÷ custo. É retorno do ciclo inteiro; não é taxa mensal, TIR ou retorno sobre o aporte. |
| Margem prevista | Quanto da receita sobra? | Lucro ÷ receita. Com custos constantes, também é a queda de receita que zeraria o lucro. |
| Ponto de equilíbrio | Qual receita total cobre os custos? | É o custo estimado de conclusão. Não remunera o tempo do capital. |
| Resultado de caixa operacional | Quanto entrou menos quanto saiu até aqui? | Pode ser negativo antes da venda e coexistir com lucro previsto positivo. |
| Saldo com aportes | Quanto haveria no caixa do projeto com o financiamento cadastrado? | Aportes + recebimentos − pagamentos. Não inclui retiradas, dívidas ou movimentações ausentes. |
| Lucro/ROI final | Qual foi o resultado depois de encerrar todas as linhas? | Fica pendente enquanto houver receitas ou custos não realizados. |
| Desvio dos custos registrados | Estou pagando mais ou menos que o orçamento? | Compara apenas as mesmas linhas realizadas. Custos pendentes não criam economia fictícia. |
| Mudança no lucro previsto | Como a previsão atual difere do plano? | Previsão de conclusão − lucro planejado. Alterar o valor projetado também altera essa referência. |
| ROI mensal equivalente | Como comparar ciclos de durações diferentes? | Converte o retorno total por juros compostos. Não representa pagamento mensal. |
| Lucro acima do CDI | O projeto supera o benchmark no mesmo prazo? | Lucro do projeto − rendimento do CDI sobre o mesmo custo. Positivo é vantagem no modelo, ainda sujeita aos riscos e ao trabalho da operação. |
| Receita para empatar com CDI | Qual receita total remunera também o tempo do capital? | Custo × fator de crescimento do CDI no prazo. A diferença até a receita prevista é a folga de preço. |
| Meses para o CDI alcançar | Quanto tempo o CDI leva para produzir o mesmo ROI total? | Se o ciclo do projeto termina antes desse ponto, ele supera o CDI no modelo de custo e receita constantes. |

## Exemplo fictício de planejamento

Considere uma operação com custo total de **R$ 100.000,00** e receita prevista de **R$ 120.000,00**:

- Lucro previsto: **R$ 20.000,00**.
- ROI sobre custos: **20%**.
- Margem prevista: **16,67%**.

Com duração total de **6 meses** e CDI hipotético de **12% a.a.**:

| Comparação | Resultado aproximado |
|---|---:|
| ROI mensal equivalente do projeto | 3,09% a.m. |
| CDI equivalente mensal | 0,95% a.m. |
| Rendimento CDI em seis meses sobre o custo total | R$ 5.830,05 |
| Lucro do projeto acima do CDI | R$ 14.169,95 |
| Receita total para empatar com o CDI | R$ 105.830,05 |
| Folga na receita até esse empate | 11,81% |
| Meses para o CDI alcançar o ROI de 20% | 19,3 meses |
| Folga entre o ciclo de seis meses e o empate | 13,3 meses |

**Interpretação:** nessas hipóteses, o CDI levaria aproximadamente 19,3 meses para render os mesmos 20% esperados do projeto. Se a venda acontecer ao final de seis meses, há vantagem estimada. Se demorar mais, o CDI acumula por mais tempo; se surgirem novos custos, recalcule a previsão e o prazo de empate.

Todos os valores deste exemplo são fictícios. O prazo e a taxa devem ser ajustados e salvos para cada projeto; não são uma cotação atual do CDI.

## Fórmulas

Use taxas em decimal: 20% = 0,20; 12% = 0,12.

- ROI total = (receita − custo) ÷ custo.
- Margem = (receita − custo) ÷ receita.
- CDI mensal equivalente = (1 + CDI anual)^(1/12) − 1.
- CDI no prazo = (1 + CDI anual)^(meses/12) − 1.
- ROI mensal equivalente do projeto = (1 + ROI total)^(1/meses) − 1.
- Meses para o CDI alcançar = 12 × ln(1 + ROI total) ÷ ln(1 + CDI anual).
- Receita para empatar com CDI = custo × (1 + CDI anual)^(meses/12).

Não existe um prazo positivo de igualdade entre uma perda e CDI não negativo. CDI de 0% nunca alcança um lucro positivo. Sem custos, o ROI e a comparação de capital ficam indisponíveis em vez de exibirem 0% artificial.

## Como ler a simulação

- A simulação usa 10 mil cenários reproduzíveis. Ela varia somente os valores ainda pendentes. Se todas as linhas já estão realizadas, os valores e o prazo ficam fixos.
- “Incerteza de 20%” significa desvio padrão de 20% sobre o valor pendente, não 20% de chance de perder.
- Receita, custos fixos, custos variáveis e duração são sorteados de forma independente. Valores monetários negativos são limitados a zero; o prazo tem mínimo de meio mês. O teto de receita, quando informado, limita os cenários sem apagar receita já recebida.
- P10, P50 e P90 são percentis dos resultados simulados. Lucro e ROI são ordenados separadamente, então os percentis podem representar cenários diferentes. Com empates, as proporções estritamente acima/abaixo podem diferir.
- “Chance de superar o CDI” compara lucro com o benchmark usando o custo e o prazo de cada cenário. As probabilidades dependem das premissas; não são probabilidades observadas do mercado.
- “Lucro no percentil 5” e “média dos 5% piores” mostram o tamanho da cauda desfavorável. Um valor positivo ainda é lucro, não uma perda VaR.
- “Excesso médio / dispersão” é um índice descritivo dos cenários, não um Sharpe histórico ou uma probabilidade. Fica indisponível sem dispersão.

## Limites importantes para interpretar os números

A comparação temporal é um modelo simplificado: trata todo o custo como disponível no início e a receita no final, com taxa anual constante. Não calcula VPL/TIR por data para operações parceladas ou receitas recorrentes, nem pressupõe que o projeto possa ser repetido com o mesmo retorno.

A comparação é **bruta**. O painel não desconta automaticamente IR, taxas ou inflação do benchmark. Tributos e despesas do projeto só entram se cadastrados. Compare alternativas na mesma base de impostos e risco.

O CDI efetivo é apurado por dias úteis. A projeção usa equivalência mensal de uma taxa constante, sem histórico diário ou calendário de feriados. Para projetos em outra moeda, selecione um benchmark da própria moeda; CDI em reais não resolve a exposição cambial.

A carteira nunca soma moedas diferentes. O ROI agregado é a soma dos lucros dividida pela soma dos custos, não a média simples dos percentuais. Como os ciclos podem durar tempos diferentes, esse ROI agregado não é uma taxa anual da carteira.

Referências: [B3 — conversões de taxas e base de dias úteis](https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/juros/s_di_train_prog/02-taxas-de-juros.htm), [B3 — metodologia do índice DI](https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/di/metodologia-de-calculo-do-indice-di/) e [Banco Central — Calculadora do Cidadão](https://www.bcb.gov.br/acessoinformacao/calculadoradocidadao).
