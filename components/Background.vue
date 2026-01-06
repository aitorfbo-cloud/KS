<template>
  <div class="bg-root">
    <div class="bg-track" :style="trackStyle">
      <img v-for="tile in tiles" :key="tile.key" :src="tile.src" alt="" class="bg-img" :style="imgStyle(tile.absIndex)" draggable="false"/>
    </div>
    <div class="bg-mask" :style="maskStyle"/>
  </div>
</template>

<script setup lang="ts">
import type {CSSProperties} from 'vue'
import {computed,inject,onBeforeUnmount,onMounted,ref,watch} from 'vue'
import {gsap} from 'gsap'

const s=inject<any>('carousel')!
const STEP_RATIO=s.stepRatio||1
const RATIO=4/5
const MAX_PAGES_GROWTH=3
const SCALE_MAX=3
const PIN_BG_INDEX=21
const RESTRICTED_START=18

function fyShuffle<T>(a:readonly T[]){
  const b=a.slice()
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1))
    const tmp=b[i]!
    b[i]=b[j]!
    b[j]=tmp
  }
  return b
}

function buildConstrainedPinnedFirst(src:string[],pinIndex:number){
  const pinned=src[pinIndex]
  if(!pinned) return fyShuffle(src)

  const rest=src.slice(0,pinIndex).concat(src.slice(pinIndex+1))
  const restrictedRest=rest.filter(x=>/background\((19|20|21)\)\.webp$/i.test(x))
  const others=rest.filter(x=>!/background\((19|20|21)\)\.webp$/i.test(x))

  const o=fyShuffle(others)
  const r=fyShuffle(restrictedRest)

  if(!o.length) return [pinned,...r]

  const slots=o.length-1
  const maxInsert=Math.min(r.length,slots)
  const picked=new Set<number>()
  while(picked.size<maxInsert){
    const k=Math.floor(Math.random()*slots)
    picked.add(k)
  }

  const out:string[]=[pinned]
  let ri=0
  for(let i=0;i<o.length;i++){
    out.push(o[i]!)
    if(i<o.length-1 && picked.has(i) && ri<r.length) out.push(r[ri++]!)
  }

  while(ri<r.length){
    const insertAt=1+Math.floor(Math.random()*Math.max(1,out.length-2))
    if(/background\((19|20|21|22)\)\.webp$/i.test(out[insertAt-1]||'')||/background\((19|20|21|22)\)\.webp$/i.test(out[insertAt]||'')) continue
    out.splice(insertAt,0,r[ri++]!)
  }

  if(/background\((19|20|21|22)\)\.webp$/i.test(out[out.length-1]||'')){
    for(let i=out.length-2;i>=1;i--){
      if(!/background\((19|20|21|22)\)\.webp$/i.test(out[i]||'')){const last=out.pop()!;out.splice(i+1,0,last);break}
    }
  }

  return out
}

const shuffledImages=ref<string[]>([])
function reshuffle(){
  const src=(s.bgImages||[]).slice()
  if(!src.length){shuffledImages.value=[];return}
  shuffledImages.value=buildConstrainedPinnedFirst(src,PIN_BG_INDEX)
}

const viewport=ref({width:1024,height:768})
function updateViewport(){viewport.value={width:window.innerWidth,height:window.innerHeight}}

const maskOpacity=ref(1)
onMounted(()=>{
  reshuffle()
  updateViewport()
  window.addEventListener('resize',updateViewport)
  gsap.to(maskOpacity,{value:0,delay:3,duration:.8,ease:'power2.out'})
})
onBeforeUnmount(()=>window.removeEventListener('resize',updateViewport))

watch(()=>s.bgImages,()=>reshuffle(),{deep:true})

const lastTickSample=ref<number>(s.stepTicks||0)
const lastTimeMs=ref<number>(performance.now())
const tickVelocity=ref<number>(0)
watch(()=>s.stepTicks,(ticks)=>{
  const now=performance.now()
  const dt=Math.max(1,now-lastTimeMs.value)/1000
  const dv=ticks-lastTickSample.value
  tickVelocity.value=dv/dt
  lastTickSample.value=ticks
  lastTimeMs.value=now
},{immediate:true})

const displayedIndex=ref(0)
watch(()=>s.stepTicks,(ticks)=>{
  const targetIdx=ticks/STEP_RATIO
  gsap.to(displayedIndex,{value:targetIdx,duration:1.5,ease:s.isDragging?'none':'expo.out',overwrite:'auto',force3D:true})
},{immediate:true})

const styleIndex=ref(0)
watch(displayedIndex,(val)=>{
  gsap.to(styleIndex,{value:val,duration:.3,ease:s.isDragging?'none':'linear',overwrite:'auto',force3D:true})
},{immediate:true})

const imgHeight=computed(()=>viewport.value.height)
const imgWidth=computed(()=>Math.round(imgHeight.value*RATIO))
const centerOffset=computed(()=>viewport.value.width/2-imgWidth.value/2)

type Tile={absIndex:number;key:string;src:string}
const tiles=computed<Tile[]>(()=>{
  const arr:Tile[]=[]
  const total=s.total
  const imgs=shuffledImages.value.length?shuffledImages.value:(s.bgImages||[])
  const n=imgs.length||1
  for(let band=-3;band<=3;band++){
    for(let i=0;i<total;i++){
      const absIndex=band*total+i
      const idx=((absIndex%n)+n)%n
      arr.push({absIndex,key:`${band}:${i}`,src:imgs[idx]})
    }
  }
  return arr
})

const trackStyle=computed<CSSProperties>(()=>({
  transform:`translate3d(${centerOffset.value-displayedIndex.value*imgWidth.value}px,0,0)`,
  height:'100vh',
  position:'absolute',
  top:'0',
  left:'0',
  willChange:'transform'
}))

function clamp01(x:number){return Math.max(0,Math.min(1,x))}
function scaleByDistLinear(d:number){
  const t=clamp01(d/MAX_PAGES_GROWTH)
  return 1+(SCALE_MAX-1)*t
}

function imgStyle(absIndex:number):CSSProperties{
  const rel=absIndex-styleIndex.value
  const dist=Math.abs(rel)
  const scale=scaleByDistLinear(dist)
  const originY=rel<=0?'35%':'75%'
  const halfExtraW=(scale-1)*imgWidth.value*.5
  const tx=(rel<0?-1:rel>0?1:0)*halfExtraW
  const z=10000-Math.round(dist*1200)
  return{
    position:'absolute',
    top:'0',
    left:`${absIndex*imgWidth.value}px`,
    height:'100vh',
    width:`${imgWidth.value}px`,
    objectFit:'cover',
    transformOrigin:`50% ${originY}`,
    transform:`translateX(${tx}px) scale(${scale}) translateZ(0)`,
    zIndex:z,
    willChange:'transform'
  }
}

const maskStyle=computed<CSSProperties>(()=>({opacity:maskOpacity.value}))
</script>

<style scoped>
.bg-root{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#000;}
.bg-track{will-change:transform;}
.bg-img{display:block;user-select:none;-webkit-user-drag:none;will-change:transform;}
.bg-mask{position:absolute;inset:0;background:#000;transition:opacity .2s linear;pointer-events:none;z-index:1;}
</style>
