
export default async (req) => {
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/assets/logo.png')) return new Response('Not found', {status:404});
  const png = await fetch(new URL('./assets/logo.png', import.meta.url)).then(r=>r.arrayBuffer());
  return new Response(png, {status:200, headers:{'Content-Type':'image/png'}});
}
