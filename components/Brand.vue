<template>
  <div class="brand-root">
    <div class="stack" ref="stackEl">
      <h1 class="brand" ref="brandEl">{{ brandText }}</h1>

      <nav class="icons" ref="iconsEl" aria-label="Contacto">
        <a
          v-for="(item,i) in contacts"
          :key="i"
          class="iconlink"
          :href="item.href"
          :aria-label="item.label"
          :target="item.target"
          :rel="item.target?'noopener noreferrer':undefined"
          :ref="(el:any)=>el&&(iconRefs[i]=el)"
        >
          <span class="icon-text">{{ item.text }}</span>
        </a>
      </nav>
    </div>

    <div class="invert-layer" ref="invertEl"></div>
  </div>
</template>

<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount,nextTick} from 'vue'
import {gsap} from 'gsap'

type ContactItem={text:string;href:string;label:string;target?:string}
const contacts:ContactItem[]=[
  {text:'telephone',href:'tel:+34688641474',label:'Teléfono',target:undefined},
  {text:'mail',href:'mailto:info@kalambrestudio.es',label:'Correo',target:undefined},
  {text:'instagram',href:'https://instagram.com/kalambrestudio',label:'Instagram',target:'_blank'},
  {text:'whatsapp',href:'https://wa.me/34688641474',label:'WhatsApp',target:'_blank'}
]

const brandText=ref('KALAMBRE STUDIO')
const stackEl=ref<HTMLDivElement|null>(null)
const brandEl=ref<HTMLElement|null>(null)
const iconsEl=ref<HTMLElement|null>(null)
const invertEl=ref<HTMLDivElement|null>(null)
const iconRefs=ref<HTMLElement[]>([])
let resizeObs:ResizeObserver|null=null

function drawMask(){
  if(!stackEl.value||!invertEl.value||!brandEl.value)return
  const stackBox=stackEl.value.getBoundingClientRect()
  const dpr=Math.min(2,window.devicePixelRatio||1)
  const canvas=document.createElement('canvas')
  canvas.width=Math.max(1,Math.floor(stackBox.width*dpr))
  canvas.height=Math.max(1,Math.floor(stackBox.height*dpr))
  const ctx=canvas.getContext('2d')!
  ctx.scale(dpr,dpr)
  ctx.clearRect(0,0,stackBox.width,stackBox.height)
  ctx.fillStyle='#fff'

  const fsBrand=parseFloat(getComputedStyle(brandEl.value).fontSize||'18')
  const ffBrand=getComputedStyle(brandEl.value).fontFamily
  ctx.textAlign='center'
  ctx.textBaseline='alphabetic'
  ctx.font=`900 ${fsBrand}px ${ffBrand}`

  const brandBox=brandEl.value.getBoundingClientRect()
  const brandX=brandBox.left-stackBox.left+brandBox.width/2
  const brandY=brandBox.bottom-stackBox.top
  ctx.fillText((brandText.value||'').toUpperCase(),brandX,brandY)

  iconRefs.value.forEach((linkEl)=>{
    const opacity=parseFloat(getComputedStyle(linkEl).opacity||'1')
    if(opacity<=0.001)return
    const span=linkEl.querySelector('.icon-text') as HTMLElement|null
    if(!span)return

    const cs=getComputedStyle(span)
    const fs=parseFloat(cs.fontSize||'12')
    const ff=cs.fontFamily
    const fw=cs.fontWeight||'400'
    const ls=cs.letterSpacing||'0px'
    const tt=cs.textTransform||'none'

    const box=span.getBoundingClientRect()
    const cx=box.left-stackBox.left+box.width/2
    const cy=box.top-stackBox.top+box.height/2

    let text=(span.textContent??'').trim()
    if(!text)return
    if(tt==='uppercase')text=text.toUpperCase()
    if(tt==='lowercase')text=text.toLowerCase()
    if(tt==='capitalize')text=text.replace(/\b\w/g,m=>m.toUpperCase())

    ctx.save()
    ctx.globalAlpha=Math.max(0,Math.min(1,opacity))
    ctx.translate(cx,cy)
    ctx.rotate(Math.PI/2)
    ctx.textAlign='center'
    ctx.textBaseline='middle'
    ctx.font=`${fw} ${fs}px ${ff}`

    if(ls!=='0px'){
      const tracking=parseFloat(ls)||0
      const base=ctx.measureText(text).width
      let x=-(base+tracking*(text.length-1))/2
      for(let i=0;i<text.length;i++){
        const ch=text.charAt(i)
        ctx.fillText(ch,x,0)
        x+=ctx.measureText(ch).width+tracking
      }
    }else{
      ctx.fillText(text,0,0)
    }
    ctx.restore()
  })

  const url=canvas.toDataURL('image/png')
  const inv=invertEl.value
  inv.style.width=`${stackBox.width}px`
  inv.style.height=`${stackBox.height}px`
  inv.style.left=`calc(50% - ${stackBox.width/2}px)`
  inv.style.top=`calc(50% - ${stackBox.height/2}px)`
  inv.style.maskImage=`url("${url}")`
  inv.style.webkitMaskImage=`url("${url}")`
  inv.style.maskRepeat='no-repeat'
  inv.style.webkitMaskRepeat='no-repeat'
  inv.style.maskSize=`${stackBox.width}px ${stackBox.height}px`
  inv.style.webkitMaskSize=`${stackBox.width}px ${stackBox.height}px`
}

function animateIcons(){
  if(!iconsEl.value)return
  const tl=gsap.timeline({delay:0.55,onUpdate:()=>{void nextTick(drawMask)},onComplete:()=>{void nextTick(drawMask)}})
  iconRefs.value.forEach((el,i)=>{
    tl.to(el,{opacity:1,y:0,duration:0.4,ease:'power3.out'},i*0.18)
  })
}

onMounted(async ()=>{
  await nextTick()
  gsap.set(iconRefs.value,{opacity:0,y:10})

  brandText.value='KS'
  await nextTick()
  drawMask()

  const insert='ALAMBRE '
  const suffix='TUDIO'
  const insertProg={v:0}
  const suffixProg={v:0}

  const tl=gsap.timeline({onUpdate:()=>{void nextTick(drawMask)},onComplete:()=>{void nextTick(drawMask)}})

  tl.to({}, {duration:0.85})

  tl.to(insertProg,{
    v:insert.length,
    duration:0.35,
    ease:'none',
    onUpdate:()=>{
      const n=Math.round(insertProg.v)
      brandText.value='K'+insert.slice(0,n)+'S'
    }
  })

  tl.to(suffixProg,{
    v:suffix.length,
    duration:0.75,
    ease:'none',
    onUpdate:()=>{
      const n=Math.round(suffixProg.v)
      brandText.value='KALAMBRE S'+suffix.slice(0,n)
    }
  },'>+0.05')

  tl.add(()=>{animateIcons()},'>+0.25')

  resizeObs=new ResizeObserver(()=>drawMask())
  if(stackEl.value)resizeObs.observe(stackEl.value)
  window.addEventListener('resize',drawMask)
})

onBeforeUnmount(()=>{
  resizeObs?.disconnect()
  window.removeEventListener('resize',drawMask)
})
</script>

<style scoped>
.brand-root{position:fixed;inset:0;display:grid;place-items:center;z-index:10;pointer-events:none;}
.stack{display:grid;grid-template-columns:repeat(4,auto);grid-template-rows:auto auto;column-gap:.35rem;row-gap:1.3rem;justify-items:center;align-items:left;}
.brand{grid-column:1 / span 4;margin:0;font-family:"Helvetica Neue",Helvetica,Arial,system-ui,-apple-system,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.04em;line-height:1.05;font-size:clamp(21px,1.425vw + 9px,36px);color:transparent;pointer-events:none;}
.icons{grid-column:1 / span 4;display:contents;}
.iconlink{pointer-events:auto;color:transparent;}
.icon-text{writing-mode:vertical-rl;text-orientation:mixed;font-family:"Helvetica Neue",Helvetica,Arial,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:.08em;text-transform:lowercase;user-select:none;}
.invert-layer{position:fixed;backdrop-filter:invert(1);-webkit-backdrop-filter:invert(1);pointer-events:none;}
</style>
