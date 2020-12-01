import { router } from './router/router.js';

router(window.location.hash);
window.addEventListener('hashchange', async () => {
  router(window.location.hash);
});
