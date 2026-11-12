export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://weifish0.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if(req.method === 'OPTIONS') return res.status(204).end();
  const {kind, q} = req.query;
  if(!['gp', 'ngram', 'example'].includes(kind)) return res.status(400).json({error:'Invalid API'});
  if(req.method !== (kind === 'example' ? 'POST' : 'GET')) return res.status(405).json({error:'Invalid method'});
  const query = kind === 'example' ? req.body?.ngram : q;
  if(typeof query !== 'string' || !query.trim() || query.length > 240) return res.status(400).json({error:'Invalid query'});
  let path = kind === 'gp' ? `/gp/?term=${encodeURIComponent(query)}` : `/ngram/${encodeURIComponent(query.replaceAll('/', '@'))}`;
  if(kind === 'example') path='/example/';
  try {
    const upstream = await fetch('https://search.linggle.com/api'+path, {
      method: req.method,
      headers: kind==='example' ? {'Content-Type':'application/json'} : {'Accept':'application/json'},
      ...(kind==='example' ? {body:JSON.stringify({ngram:query})} : {}),
      signal: AbortSignal.timeout(20000),
    });
    if(!upstream.ok) return res.status(502).json({error:`Linggle HTTP ${upstream.status}`});
    const data = await upstream.json();
    if(kind!=='example') res.setHeader('Cache-Control','public, s-maxage=300');
    return res.status(200).json(data);
  } catch {return res.status(502).json({error:'Linggle 連線失敗，請重試'});}
}
