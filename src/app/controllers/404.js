import { defaultRoute } from './controllers-utils.js';

export default function NotFound() {
  return fetch(`${defaultRoute}/404.html`)
    .then((data) => {
      return data.text();
    })
    .then((html) => {
      const template = document.createElement('template');
      template.innerHTML = html;
      return template.content;
    });
}
