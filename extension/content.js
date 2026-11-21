(() => {
  if (window.__traderIaOverlay) return;
  window.__traderIaOverlay = true;
  let latestCandles = [];
  let latestAt = 0;
  const bridge = document.createElement("script");
  bridge.src = chrome.runtime.getURL("page-bridge.js");
  bridge.onload = () => bridge.remove();
  (document.documentElement || document.head).appendChild(bridge);
  window.addEventListener("message", event => {
    if (event.source !== window || event.data?.source !== "TRADER_IA_BRIDGE") return;
    const rows = event.data.candles;
    if (!Array.isArray(rows)) return;
    const clean = rows.map(c=>({open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close),volume:Number(c.volume||0)}))
      .filter(c=>[c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite) && c.high>=Math.max(c.open,c.close,c.low) && c.low<=Math.min(c.open,c.close,c.high));
    if(clean.length>=30){latestCandles=clean.slice(-300);latestAt=Date.now();status.textContent="Gráfico detectado · "+latestCandles.length+" candles";status.dataset.state="ok";}
  });
  const host=document.createElement("div"); host.id="trader-ia-host";
  Object.assign(host.style,{position:"fixed",right:"18px",top:"28%",zIndex:"2147483647"});
  (document.body||document.documentElement).appendChild(host);
  const root=host.attachShadow({mode:"open"});
  root.innerHTML=`
  <style>
  *{box-sizing:border-box} .panel{width:270px;color:#edf5ff;background:linear-gradient(145deg,#101827,#080d18);border:1px solid #16b8e8;border-radius:15px;box-shadow:0 12px 38px #0009,0 0 18px #00b8e455;font:13px Arial,sans-serif;overflow:hidden}
  .head{display:flex;align-items:center;justify-content:space-between;padding:12px 13px;background:#101f31;border-bottom:1px solid #1b3a51;font-weight:700;letter-spacing:.4px}.brand{color:#54d8ff}.close{border:0;color:#9fb4c8;background:transparent;font-size:19px;cursor:pointer}
  .body{padding:13px}.status{font-size:11px;color:#9fb4c8;margin-bottom:10px}.status[data-state=ok]{color:#63e6ad}.status[data-state=bad]{color:#ff9a9a}
  button{width:100%;border:0;border-radius:9px;padding:12px;background:linear-gradient(90deg,#087fbd,#12c4df);color:white;font-weight:800;letter-spacing:.4px;cursor:pointer}button:disabled{opacity:.55;cursor:wait}
  .result{margin-top:11px;padding:10px;border:1px solid #24445c;border-radius:9px;background:#0b1422;min-height:48px;line-height:1.45}.direction{font-size:19px;font-weight:800}.buy{color:#54e6a2}.sell{color:#ff727e}.wait{color:#ffd166}.small{font-size:11px;color:#9fb4c8;margin-top:7px}
  </style>
  <div class="panel"><div class="head"><span class="brand">◈ TRADER IA</span><button class="close" title="Minimizar">−</button></div>
  <div class="body"><div class="status" id="status" data-state="idle">Aguardando leitura do gráfico…</div>
  <button id="analyze">ANALISAR GRÁFICO</button><div class="result" id="result">A análise considera os candles recebidos do gráfico atual.</div>
  <div class="small">Análise assistida por Gemini · Nenhuma ordem é enviada.</div></div></div>`;
  const status=root.querySelector("#status"), result=root.querySelector("#result"), button=root.querySelector("#analyze");
  root.querySelector(".close").onclick=()=>host.remove();
  button.onclick=()=>{
    if(latestCandles.length<30){status.textContent="Não detectei candles suficientes. O gráfico pode não expor os dados via WebSocket.";status.dataset.state="bad";return;}
    button.disabled=true;button.textContent="ANALISANDO…";result.textContent="Enviando candles para análise…";
    chrome.runtime.sendMessage({type:"TRADER_ANALYZE",candles:latestCandles,symbol:(document.querySelector("[data-testid*=asset],.current-symbol,.pair-name")?.textContent||"ATIVO_ATUAL").trim()},response=>{
      button.disabled=false;button.textContent="ANALISAR GRÁFICO";
      if(chrome.runtime.lastError || !response?.ok){result.textContent=response?.error||chrome.runtime.lastError?.message||"Falha na comunicação.";return;}
      const r=response.result||{}, dir=r.direction||"WAIT", cls=dir==="BUY"?"buy":dir==="SELL"?"sell":"wait";
      const label=dir==="BUY"?"COMPRA":dir==="SELL"?"VENDA":"AGUARDAR";
      result.innerHTML="";
      const title=document.createElement("div");title.className="direction "+cls;title.textContent=label+" · "+(r.confidence??0)+"%";
      const why=document.createElement("div");why.textContent=r.rationale||"Sem justificativa retornada.";
      const risk=document.createElement("div");risk.className="small";risk.textContent="Riscos: "+((r.risks||[]).join(" · ")||"não informado");
      result.append(title,why,risk);status.textContent="Análise concluída · "+new Date().toLocaleTimeString();status.dataset.state="ok";
    });
  };
})();