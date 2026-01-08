export default defineEventHandler((event)=>{
  const raw=(getHeader(event,'x-forwarded-host')||getHeader(event,'host')||'').toString()
  const host=raw.split(',')[0].trim().toLowerCase().split(':')[0]
  const url=event.node.req.url||'/'
  const CANON='kalambrestudio.com'

  if(host===CANON) return

  if(host==='www.kalambrestudio.com'||host==='kalambrestudio.es'||host==='www.kalambrestudio.es'){
    return sendRedirect(event,`https://${CANON}${url}`,308)
  }
})
