import { removeChildren } from '../utils.js';
import { Home, Projects, NotFound } from '../controllers/index.js';

const rootElement = document.getElementById('root');
removeChildren(rootElement);

const routes = {
  ['/']: Home,
  ['#/home']: Home,
  ['#/projects']: Projects,
};

async function router(route) {
  removeChildren(rootElement);

  const viewToRender = routes[route || '/'];
  const view = await (viewToRender ? viewToRender() : NotFound());

  rootElement.appendChild(view);
}

export { router };
