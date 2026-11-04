'use strict';
const handler = import('../worker/calendar.mjs').then(({ createHandler }) => createHandler());

module.exports = async function classes(req, res) {
  const response = await (await handler)(new Request('https://schedule-lab.invalid/api/classes', {
    method: req.method
  }), process.env);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
};
