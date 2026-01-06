import type {SeoEntry} from '~/seo/pages'
import {SEO_PAGES} from '~/seo/pages'

function stripHashQuery(p:string){
  const s=p||''
  const q=s.indexOf('?'),h=s.indexOf('#')
  const cut=q===-1?h:h===-1?q:Math.min(q,h)
  return (cut===-1?s:s.slice(0,cut))||'/'
}
function ensureLeadingSlash(p:string){return p.startsWith('/')?p:`/${p}`}
function normalizePath(p:string){const x=ensureLeadingSlash(stripHashQuery(p));return x==='/'?'/':x.replace(/\/+$/,'')}
function joinUrl(base:string,path:string){
  const b=(base||'').replace(/\/+$/,'')
  const p=normalizePath(path)
  return p==='/'?`${b}/`:`${b}${p}`
}

export function usePageSeo(){
  const route=useRoute()
  const config=useRuntimeConfig()
  const hosts=((config.public as any).siteHosts||[]) as string[]
  const fallback=((config.public as any).defaultSiteUrl||'') as string
  const primary=((config.public as any).primarySiteUrl||fallback) as string

  const serverHeaders=import.meta.server?useRequestHeaders(['host','x-forwarded-proto']):null
  const host=(import.meta.server?(serverHeaders?.host||''):(import.meta.client?window.location.host:'' )).toLowerCase()

  let proto='https'
  if(import.meta.server){
    const xf=(serverHeaders?.['x-forwarded-proto'] ?? 'https')
    proto=(xf.split(',')[0]?.trim() || 'https')
  }else if(import.meta.client){
    proto=(window.location.protocol.replace(':','') || 'https')
  }

  const siteUrl=computed(()=>hosts.includes(host)?`${proto}://${host}`:fallback)
  const primaryUrl=computed(()=>primary||siteUrl.value)

  const entry=computed<SeoEntry>(()=>{const path=normalizePath(route.path);return (SEO_PAGES.find(x=>x.path===path) ?? SEO_PAGES[0]) as SeoEntry})

  const canonicalPrimary=computed(()=>joinUrl(primaryUrl.value,entry.value.path))
  const alternateEs=computed(()=>{
    const p=canonicalPrimary.value
    if(p.includes('kalambrestudio.com'))return p.replace('kalambrestudio.com','kalambrestudio.es')
    if(p.includes('kalambrestudio.es'))return p.replace('kalambrestudio.es','kalambrestudio.com')
    return ''
  })

  const ogImageAbs=computed(()=>entry.value.ogImage?joinUrl(primaryUrl.value,entry.value.ogImage):undefined)

  useSeoMeta({
    title:()=>entry.value.title,
    description:()=>entry.value.description,
    robots:()=>entry.value.robots||'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogType:()=>entry.value.path==='/'?'website':'article',
    ogTitle:()=>entry.value.title,
    ogDescription:()=>entry.value.description,
    ogUrl:()=>canonicalPrimary.value,
    ogImage:()=>ogImageAbs.value,
    ogLocale:()=> 'es_ES',
    ogSiteName:()=> 'KalambreStudio',
    ogImageWidth:()=> '1200',
    ogImageHeight:()=> '630',
    twitterCard:()=>'summary_large_image',
    twitterTitle:()=>entry.value.title,
    twitterDescription:()=>entry.value.description,
    twitterImage:()=>ogImageAbs.value
  })

  useHead(() => {
    const orgId=`${primaryUrl.value}#org`
    const founderId=`${primaryUrl.value}#founder`
    const websiteId=`${primaryUrl.value}/#website`
    const pageId=`${canonicalPrimary.value}#webpage`

    const pageName=(entry.value.title||'').replace(' | KalambreStudio','').trim()||'KalambreStudio'

    const breadcrumbs = entry.value.path==='/' ? [{
      '@type':'ListItem',
      position:1,
      name:'Inicio',
      item:`${primaryUrl.value}/`
    }] : [
      {'@type':'ListItem',position:1,name:'Inicio',item:`${primaryUrl.value}/`},
      {'@type':'ListItem',position:2,name:pageName,item:canonicalPrimary.value}
    ]

    const ld={
      '@context':'https://schema.org',
      '@graph':[
        {'@type':'WebSite','@id':websiteId,url:`${primaryUrl.value}/`,name:'KalambreStudio',description:SEO_PAGES[0]?.description||'',publisher:{'@id':orgId},inLanguage:'es-ES'},
        {'@type':'Organization','@id':orgId,name:'KalambreStudio',url:primaryUrl.value,logo:{'@type':'ImageObject',url:joinUrl(primaryUrl.value,'/favicon.ico')},founder:{'@id':founderId},areaServed:[{'@type':'AdministrativeArea',name:'Gipuzkoa'},{'@type':'AdministrativeArea',name:'Bizkaia'},{'@type':'Country',name:'España'}],knowsAbout:['Fotografía','Vídeo','Producción audiovisual','Dirección de arte','Branding','Diseño','Imagen de marca','Contenido','Marketing','Publicidad'],sameAs:['https://instagram.com/kalambrestudio']},
        {'@type':'Person','@id':founderId,name:'AnderNikolay',jobTitle:'Artista y fotógrafo',worksFor:{'@id':orgId},url:primaryUrl.value,sameAs:['https://instagram.com/kalambrestudio']},
        {'@type':'WebPage','@id':pageId,url:canonicalPrimary.value,name:entry.value.title,description:entry.value.description,isPartOf:{'@id':websiteId},about:{'@id':orgId},primaryImageOfPage:ogImageAbs.value?{'@type':'ImageObject',url:ogImageAbs.value}:undefined,inLanguage:'es-ES'},
        {'@type':'BreadcrumbList','@id':`${canonicalPrimary.value}#breadcrumbs`,itemListElement:breadcrumbs}
      ].filter(Boolean)
    }

    const links:Array<Record<string,any>>=[
      {rel:'canonical',href:canonicalPrimary.value},
      {rel:'alternate',href:canonicalPrimary.value,hrefLang:'x-default'}
    ]
    if(alternateEs.value)links.push({rel:'alternate',href:alternateEs.value,hrefLang:'es'})

    const metas:Array<Record<string,any>>=[
      ...(entry.value.keywords?.length?[{name:'keywords',content:entry.value.keywords.join(', ')}]:[]),
      {name:'author',content:'AnderNikolay'},
      ...(ogImageAbs.value?[{property:'og:image:type',content:'image/webp'},{property:'og:image:secure_url',content:ogImageAbs.value}]:[]),
      {name:'geo.region',content:'ES-PV'},
      {name:'geo.placename',content:'Gipuzkoa, Bizkaia'},
      {name:'ICBM',content:'43.3128, -1.97499'}
    ].filter(m=>m.content!=='')

    return{
      link:links,
      meta:metas,
      script:[{key:'ldjson',type:'application/ld+json',innerHTML:JSON.stringify(ld)}],
      __dangerouslyDisableSanitizersByTagID:{ldjson:['innerHTML']}
    }
  })

  return {entry,canonical:canonicalPrimary,siteUrl:primaryUrl}
}
