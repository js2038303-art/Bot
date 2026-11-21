# Trader IA — extensão Chrome/Chromium

## Instalação
1. Extraia o ZIP.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta `extension`.
5. Abra a Pocket Option. O painel flutuante aparece no canto direito.

## Configuração
Abra os detalhes da extensão → Opções. Informe a URL do endpoint e um token de sessão válido para o endpoint `/api/analyze`. O backend existente exige usuário autenticado.

## Leitura do gráfico
A extensão observa mensagens WebSocket da página e procura arrays com OHLC. A estrutura interna da Pocket Option pode mudar; se a plataforma não transmitir candles nesse formato, o painel avisará que não conseguiu detectar dados. Não inventa candles nem produz sinal com dados ausentes.

## Limites de segurança
Esta extensão apenas analisa e exibe COMPRA/VENDA/AGUARDAR. Não clica nos botões de compra/venda e não envia ordens. A integração com o backend Gemini depende de token válido e de permissões CORS do endpoint para a origem da extensão.
