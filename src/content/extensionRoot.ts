export const EXTENSION_ROOT_ID = "chatgpt-section-nav-extension-root";

export function getOrCreateExtensionRoot(): ShadowRoot {
  const existingHost = document.getElementById(EXTENSION_ROOT_ID);

  if (existingHost instanceof HTMLElement) {
    return existingHost.shadowRoot ?? existingHost.attachShadow({ mode: "open" });
  }

  const host = document.createElement("div");
  host.id = EXTENSION_ROOT_ID;
  host.dataset.extension = "chatgpt-section-nav";
  document.body.append(host);

  return host.attachShadow({ mode: "open" });
}
