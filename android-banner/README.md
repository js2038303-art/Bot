# Trader IA — Banner Android (protótipo inicial)

Projeto-fonte Android Studio do painel flutuante do Trader IA.

## Incluído
- Atividade inicial para solicitar permissão de sobreposição.
- Serviço Android `TYPE_APPLICATION_OVERLAY`.
- Painel escuro com contadores demonstrativos WIN/LOSS, estado e botão **ANALISAR GRÁFICO**.
- Painel arrastável e minimizável em uma bolha “IA”.

## Ainda não conectado
- Captura/leitura do gráfico da Pocket Option.
- Envio de candles/imagem ao backend Hatchable/Gemini.
- Análise real COMPRA/VENDA/AGUARDAR.
- Histórico e estatísticas reais.
- Execução de ordens.

Os números WIN/LOSS e o resultado exibidos são apenas dados de demonstração. O botão de análise está deliberadamente sem integração; nenhuma ordem é enviada.

## Como abrir
1. Abra esta pasta no Android Studio.
2. Aguarde a sincronização do Gradle.
3. Compile e instale em um Android 8.0 (API 26) ou superior.
4. Abra “Trader IA Banner”, conceda a permissão de sobreposição e ative o painel.

## Observações
A permissão de sobreposição não dá acesso ao conteúdo de outros aplicativos. Captura de tela exige fluxo próprio com consentimento do Android (MediaProjection). Este projeto é fonte de protótipo, não APK pronto.
