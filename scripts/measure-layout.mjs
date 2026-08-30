const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = pages.find((item) => item.type === 'page');
const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++nextId;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);
  if (resolve) { pending.delete(message.id); resolve(message); }
});
socket.addEventListener('open', async () => {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.reload', { ignoreCache: true });
  await new Promise((resolve) => setTimeout(resolve, 7000));
  const message = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      viewport: innerWidth,
      path: location.pathname,
      readyState: document.readyState,
      textLength: document.body.innerText.trim().length,
      title: document.title,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      scrollX,
      scrollOverflowers: [...document.querySelectorAll('*')].map((element) => ({ tag: element.tagName, className: String(element.className), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })).filter((item) => item.scrollWidth > item.clientWidth + 1).sort((a, b) => b.scrollWidth - a.scrollWidth).slice(0, 25),
      offenders: [...document.querySelectorAll('*')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: String(element.className), x: rect.x, right: rect.right, width: rect.width };
      }).filter((item) => item.x < -1 || item.right > innerWidth + 1).sort((a, b) => b.width - a.width).slice(0, 25)
    })`,
    returnByValue: true,
  });
  process.stdout.write(message.result.result.value);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  writeFileSync(new URL('../artifacts/mobile-app-cdp.png', import.meta.url), Buffer.from(screenshot.result.data, 'base64'));
  socket.close();
});
await new Promise((resolve) => socket.addEventListener('close', resolve));
import { writeFileSync } from 'node:fs';
