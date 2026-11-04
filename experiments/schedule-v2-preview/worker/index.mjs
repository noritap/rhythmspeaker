import { createHandler } from './calendar.mjs';

const classes = createHandler();
export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/classes') return classes(request, env);
    if (path !== '/' && path !== '/index.html') return new Response(null, { status: 404 });
    return env.ASSETS.fetch(request);
  }
};
