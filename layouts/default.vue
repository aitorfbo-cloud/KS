<template>
  <div class="layout-root" ref="rootEl" :class="{dragging:state.isDragging}" @pointerdown.capture="onPointerDown">
    <Background/>
    <Ring/>
    <div class="drag-layer" @pointerdown.stop.prevent="onPointerDown"/>
    <Brand/>
  </div>
</template>

<script setup lang="ts">
import {computed,onMounted,onBeforeUnmount,provide,reactive,ref,watch} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {gsap} from 'gsap'

usePageSeo()

const SLUGS=['/','arte','diseno','marca','fotografia','video','marketing','publicidad','branding','creatividad','contenido','redes','digital','estudio','portfolio','proyectos','equipo','contacto'] as const
const TOTAL=SLUGS.length,ANGLE=360/TOTAL,STEP_RATIO=1
const BG_TOTAL=22

function slugToIndex(path:string){const clean=path.startsWith('/')?path.slice(1):path;if(clean==='')return 0;const idx=SLUGS.indexOf(clean as any);return idx>=0?idx:0}
function pathForIndex(idx:number){const slug=SLUGS[idx];return slug==='/'?'/':`/${slug}`}
function textForSlug(path:string){const idx=slugToIndex(path);return idx===0?'texto1':'texto2'}
function ticksToPage(ticks:number){const q=ticks>=0?Math.floor(ticks/STEP_RATIO):Math.ceil(ticks/STEP_RATIO);return((q%TOTAL)+TOTAL)%TOTAL}

type CarouselCtx={total:number;angle:number;ringImages:string[];bgImages:string[];currentIndex:number;fractionalIndex:number;stepTicks:number;isDragging:boolean;pageSlugs:string[];stepRatio:number}
const state=reactive<CarouselCtx>({
  total:TOTAL,angle:ANGLE,
  ringImages:Array.from({length:TOTAL},(_,i)=>`/images/ring/ring(${i+1}).webp`),
  bgImages:Array.from({length:BG_TOTAL},(_,i)=>`/images/background/background(${i+1}).webp`),
  currentIndex:0,fractionalIndex:0,stepTicks:0,isDragging:false,
  pageSlugs:SLUGS.map(s=>(s==='/'?'/':s)),stepRatio:STEP_RATIO
})
provide('carousel',state)

const route=useRoute(),router=useRouter()
const midText=computed(()=>textForSlug(route.path))

watch(()=>route.path,(p)=>{
  const idx=slugToIndex(p)
  if(idx!==state.currentIndex){
    state.currentIndex=idx
    state.stepTicks=idx*STEP_RATIO
    gsap.killTweensOf(state)
    state.fractionalIndex=state.stepTicks
  }
})

let activeTween:gsap.core.Tween|null=null
let inputLocked=false
function killActive(){if(activeTween){activeTween.kill();activeTween=null}}
function tweenToCurrentTicks(){
  killActive()
  activeTween=gsap.to(state,{fractionalIndex:state.stepTicks,duration:1,ease:'power3.out'})
}
function commitPageFromTicks(){
  const newPage=ticksToPage(state.stepTicks)
  if(newPage!==state.currentIndex){
    state.currentIndex=newPage
    const path=pathForIndex(newPage)
    if(route.path!==path)router.replace(path)
  }
}

const rootEl=ref<HTMLElement|null>(null)

function onWheel(e:WheelEvent){
  e.preventDefault()
  if(inputLocked)return
  const dm=e.deltaMode===1?40:e.deltaMode===2?window.innerHeight:1
  const dx=e.deltaX*dm,dy=e.deltaY*dm
  const raw=Math.abs(dx)>Math.abs(dy)?dx:dy
  if(!raw)return
  state.stepTicks+=raw>0?1:-1
  state.isDragging=false
  commitPageFromTicks()
  tweenToCurrentTicks()
}

function onKey(e:KeyboardEvent){
  if(inputLocked)return
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();state.stepTicks+=1}
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();state.stepTicks-=1}
  else return
  state.isDragging=false
  commitPageFromTicks()
  tweenToCurrentTicks()
}

let dragStartX=0,dragStartY=0
let pointerId:number|null=null
const SWIPE_MIN_PX=24

function onPointerDown(e:PointerEvent){
  if(inputLocked)return
  const root=rootEl.value
  if(root&&!root.contains(e.target as Node))return
  pointerId=e.pointerId
  try{(e.target as Element).setPointerCapture?.(e.pointerId)}catch{}
  state.isDragging=true
  dragStartX=e.clientX
  dragStartY=e.clientY
  window.addEventListener('pointermove',onPointerMove,{passive:false})
  window.addEventListener('pointerup',onPointerUp,{once:true})
}

function onPointerMove(e:PointerEvent){
  if(pointerId!==e.pointerId)return
  e.preventDefault()
}

function onPointerUp(e:PointerEvent){
  if(pointerId!==e.pointerId)return
  pointerId=null
  window.removeEventListener('pointermove',onPointerMove)
  state.isDragging=false
  if(inputLocked)return
  const dx=e.clientX-dragStartX,dy=e.clientY-dragStartY
  const dominant=Math.abs(dx)>=Math.abs(dy)?dx:dy
  if(Math.abs(dominant)>=SWIPE_MIN_PX)state.stepTicks+=dominant>0?1:-1
  state.stepTicks=Math.round(state.stepTicks)
  commitPageFromTicks()
  tweenToCurrentTicks()
}

onMounted(()=>{
  const idx=slugToIndex(route.path)
  state.currentIndex=idx
  state.stepTicks=idx*STEP_RATIO
  state.fractionalIndex=state.stepTicks
  inputLocked=true
  setTimeout(()=>{inputLocked=false},3000)
  window.addEventListener('wheel',onWheel,{passive:false})
  window.addEventListener('keydown',onKey,true)
})

onBeforeUnmount(()=>{
  window.removeEventListener('wheel',onWheel)
  window.removeEventListener('keydown',onKey,true)
})
</script>

<style scoped>
.layout-root{position:relative;width:100%;height:100vh;overflow:hidden}
.layout-root.dragging{cursor:grabbing;user-select:none}
.midtext-wrap{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;z-index:3}
.drag-layer{position:fixed;inset:0;z-index:1;pointer-events:none;background:transparent}
@media (max-width:767px){.drag-layer{pointer-events:auto;touch-action:none}}
</style>
