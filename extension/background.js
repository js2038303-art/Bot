const DEFAULT_API = "https://trader-ia-analise-e.hatchable.site/api/analyze";
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apiUrl","timeframe"], data => {
    if (!data.apiUrl) chrome.storage.local.set({apiUrl:DEFAULT_API});
    if (!data.timeframe) chrome.storage.local.set({timeframe:"M1"});
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "TRADER_ANALYZE") return;
  (async () => {
    const cfg = await chrome.storage.local.get(["apiUrl","apiToken","timeframe"]);
    if (!cfg.apiToken) throw new Error("Configure o token de acesso nas opções da extensão.");
    if (!Array.isArray(message.candles) || message.candles.length < 30) throw new Error("Não consegui obter 30 candles do gráfico. Aguarde o gráfico carregar e tente novamente.");
    const response = await fetch(cfg.apiUrl || DEFAULT_API, {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+cfg.apiToken},
      body:JSON.stringify({symbol:message.symbol || "ATIVO_ATUAL",timeframe:cfg.timeframe || "M1",candles:message.candles.slice(-300)})
    });
    const body = await response.json().catch(()=>({error:"Resposta inválida do servidor"}));
    if (!response.ok) throw new Error(body.error || ("Erro HTTP "+response.status));
    sendResponse({ok:true,result:body});
  })().catch(error => sendResponse({ok:false,error:error.message}));
  return true;
});
