export default defineEventHandler((event)=>{
  const host=(getHeader(event,'x-forwarded-host')||getHeader(event,'host')||'').toLowerCase()
  const isEs=host==='kalambrestudio.es'||host==='www.kalambrestudio.es'
  const isWwwCom=host==='www.kalambrestudio.com'
  if(!isEs&&!isWwwCom) return
  const url=event.node.req.url||'/'
  return sendRedirect(event,`https://kalambrestudio.com${url}`,308)
})
