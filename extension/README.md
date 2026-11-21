# Trader IA — extensão Chrome/Chromium

## Instalação
1. Extraia o ZIP.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta `extension`.
5. Abra a Pocket Option. O painel flutuante aparece no canto direito.

## Pareamento com a plataforma
1. Entre na plataforma Trader IA: https://trader-ia-analise-e.hatchable.site
2. Na seção **Conectar extensão**, gere um código temporário.
3. Abra os detalhes da extensão → **Opções**.
4. Digite o código de 8 caracteres e clique em **Parear extensão**.
5. O token individual é emitido e salvo automaticamente no armazenamento local do navegador. Não é necessário copiar token de sessão.

O código expira em 10 minutos e só pode ser usado uma vez. Cada dispositivo recebe um token revogável na lista **Extensões conectadas** da plataforma.

## Leitura do gráfico
A extensão observa mensagens WebSocket da página e procura arrays com OHLC. A estrutura interna da Pocket Option pode mudar; se a plataforma não transmitir candles nesse formato, o painel avisará que não conseguiu detectar dados. Não inventa candles nem produz sinal com dados ausentes.

## Limites de segurança
Esta extensão apenas analisa e exibe COMPRA/VENDA/AGUARDAR. Não clica nos botões de compra/venda e não envia ordens. A chave Gemini permanece no backend; o token da extensão é individual, armazenado como hash no banco e pode ser revogado pela plataforma.

**Atenção à publicação:** o projeto Hatchable está com visibilidade privada. Para a extensão alcançar as rotas de API fora da sua sessão, o proprietário precisa mudar a visibilidade para pública em Settings → Sharing. As rotas continuam protegidas por login, código temporário ou token individual.
