// Service worker mínimo: habilita a instalação do app. Não faz cache offline
// (os dados operacionais precisam sempre vir do servidor).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
