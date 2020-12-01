import { defaultRoute } from './controllers-utils.js';

export default function Home() {
  return fetch(`${defaultRoute}/home.html`)
    .then((data) => {
      return data.text();
    })
    .then((html) => {
      const template = document.createElement('template');
      template.innerHTML = html;
      return template.content;
    });
}
