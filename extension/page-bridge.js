(() => {
  if (window.__traderIaBridgeInstalled) return;
  window.__traderIaBridgeInstalled = true;
  const emit = value => window.postMessage({source:"TRADER_IA_BRIDGE",candles:value}, location.origin);
  const looksLikeCandle = x => x && typeof x === "object" &&
    ["open","o"].some(k=>k in x) && ["close","c"].some(k=>k in x) &&
    ["high","h"].some(k=>k in x) && ["low","l"].some(k=>k in x);
  const normalize = x => ({open:Number(x.open ?? x.o),high:Number(x.high ?? x.h),low:Number(x.low ?? x.l),close:Number(x.close ?? x.c),volume:Number(x.volume ?? x.v ?? 0)});
  const scan = (value, depth=0) => {
    if (depth>7 || value==null) return;
    if (Array.isArray(value)) {
      if (value.length>=30 && value.every(looksLikeCandle)) { emit(value.map(normalize)); return; }
      for (const item of value) scan(item,depth+1);
    } else if (typeof value==="object") {
      const keys=Object.keys(value);
      if (keys.length && keys.length<1000) for (const k of keys) scan(value[k],depth+1);
    }
  };
  const OriginalWebSocket = window.WebSocket;
  function WrappedWebSocket(...args) {
    const ws = new OriginalWebSocket(...args);
    ws.addEventListener("message", event => {
      if (typeof event.data !== "string" || event.data.length>2_000_000) return;
      try {
        const raw=event.data;
        const start=raw.indexOf("[");
        if(start<0) return;
        const parsed=JSON.parse(raw.slice(start));
        scan(parsed);
      } catch {}
    });
    return ws;
  }
  WrappedWebSocket.prototype=OriginalWebSocket.prototype;
  Object.setPrototypeOf(WrappedWebSocket,OriginalWebSocket);
  window.WebSocket=WrappedWebSocket;
})();