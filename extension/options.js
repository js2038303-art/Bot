const $ = id => document.getElementById(id);
const DEFAULT_API = "https://trader-ia-analise-e.hatchable.site/api/analyze";
chrome.storage.local.get(["apiUrl","apiToken","timeframe","pairedDeviceName"], data => {
  $("apiUrl").value = data.apiUrl || DEFAULT_API;
  $("timeframe").value = data.timeframe || "M1";
  $("deviceName").value = data.pairedDeviceName || "Pocket Option Extension";
  $("status").textContent = data.apiToken ? "Extensão já pareada. Você pode gerar um novo pareamento se necessário." : "Ainda não pareada. Gere um código na plataforma.";
  $("status").className = data.apiToken ? "good" : "warn";
});
$("pair").onclick = async () => {
  const button = $("pair");
  button.disabled = true;
  button.textContent = "CONECTANDO…";
  try {
    const apiUrl = $("apiUrl").value.trim();
    const origin = new URL(apiUrl).origin;
    const code = $("pairCode").value.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) throw new Error("Digite o código de 8 caracteres gerado na plataforma.");
    const response = await fetch(origin + "/api/extension-pair", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({code,deviceName:$("deviceName").value.trim() || "Pocket Option Extension"})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error === "pair_code_expired_or_invalid" ? "Código expirado ou já utilizado. Gere outro na plataforma." : data.error || "Falha ao parear.");
    await chrome.storage.local.set({apiUrl,apiToken:data.token,pairedDeviceName:data.device.device_name});
    $("pairCode").value = "";
    $("status").textContent = "Conectada com sucesso. A extensão já pode enviar candles para análise.";
    $("status").className = "good";
  } catch (error) {
    $("status").textContent = error.message;
    $("status").className = "warn";
  } finally {
    button.disabled = false;
    button.textContent = "PAREAR EXTENSÃO";
  }
};
$("save").onclick = async () => {
  try {
    const apiUrl = $("apiUrl").value.trim();
    new URL(apiUrl);
    await chrome.storage.local.set({apiUrl,timeframe:$("timeframe").value,pairedDeviceName:$("deviceName").value.trim() || "Pocket Option Extension"});
    $("status").textContent = "Preferências salvas neste navegador.";
    $("status").className = "good";
  } catch {
    $("status").textContent = "Informe uma URL de API válida.";
    $("status").className = "warn";
  }
};