<template>
  <div class="ring-root" :style="{ perspective: '1000px' }">
    <div class="ring-stage">
      <div class="ring-track" :style="trackStyle">
        <img
          v-for="(src, i) in s.ringImages"
          :key="i"
          :src="src"
          alt=""
          class="ring-img"
          :style="imgStyle(i)"
          draggable="false"
          :class="{ visible: i < loadedImages }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

const s = inject<any>('carousel')!
const STEP_RATIO = s.stepRatio || 1 

const viewport = ref({ width: 1024, height: 768 })
const isMobileViewport = computed(() => viewport.value.width < 768)

const introProgress = ref(0)
const introRotation = ref(1080)
const loadedImages = ref(0)

onMounted(() => {
  const updateViewport = () => { viewport.value = { width: window.innerWidth, height: window.innerHeight } }
  updateViewport()
  window.addEventListener('resize', updateViewport)
  onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

  const tl = gsap.timeline({ defaults: { duration: 5 } })
  tl.to(introProgress, {
    keyframes: [
      { value: 0.4, duration: 1, ease: 'power2.out' },
      { value: 1, duration: 3.8, ease: 'power4.out' }
    ]
  }, 0)
  tl.fromTo(introRotation, { value: 1080 }, { value: 0, ease: 'power4.out', duration: 5 }, 0)

  const totalImages = s.ringImages.length
  const endTime = 3.0
  const delayBetween = endTime / totalImages
  for (let i = 0; i < totalImages; i++) {
    tl.to(loadedImages, { value: i + 1, duration: 0.05 }, i * delayBetween)
  }
})

const ringPage = ref(0)
watch(
  () => s.stepTicks,
  (ticks) => {
    const page = ticks >= 0 ? Math.floor(ticks / STEP_RATIO) : Math.ceil(ticks / STEP_RATIO)
    if (page !== ringPage.value) ringPage.value = page
  },
  { immediate: true }
)

const displayedRotationDeg = ref(0)
watch(
  () => -((ringPage.value % s.total + s.total) % s.total) * s.angle,
  (rawTargetDeg) => {
    let target = rawTargetDeg
    const cur = displayedRotationDeg.value
    while (target - cur > 180) target -= 360
    while (target - cur < -180) target += 360

    gsap.to(displayedRotationDeg, {
      value: target,
      duration: s.isDragging ? 0 : 0.45,
      ease: s.isDragging ? 'none' : 'power3.out'
    })
  },
  { immediate: true }
)

const trackStyle = computed<CSSProperties>(() => ({
  transform: `rotate(${displayedRotationDeg.value + introRotation.value}deg)`,
  transition: s.isDragging ? 'none' : 'transform .45s cubic-bezier(.2,.6,0,1)'
}))

function imgStyle(i: number): CSSProperties {
  const isMobile = isMobileViewport.value
  const base = Math.min(viewport.value.width, viewport.value.height)

  const scale = isMobile ? 0.45 : 0.42
  const fullR = base * scale
  const START_R = 50
  const startR = Math.min(START_R, fullR)
  const r = startR + (fullR - startR) * introProgress.value

  const angle = (360 / s.total) * i
  const containerRot = angle + 90
  const counter = -introRotation.value - displayedRotationDeg.value - containerRot + 90 - 90

  const size = isMobile ? { w: 27, h: 38 } : { w: 38, h: 54 }
  const marginTop = -(size.h / 2)
  const marginLeft = -(size.w / 2)

  return {
    width: `${size.w}px`,
    height: `${size.h}px`,
    margin: `${marginTop}px ${marginLeft}px`,
    transform: `rotate(${containerRot}deg) translate(${r}px) rotate(${counter}deg)`,
    opacity: i < loadedImages.value ? 1 : 0,
    transition: s.isDragging
      ? 'none'
      : 'transform .45s cubic-bezier(.2,.6,0,1), opacity .3s ease-out'
  }
}
</script>

<style scoped>
.ring-root{position:fixed;inset:0;z-index:2;pointer-events:none;display:block}
.ring-stage{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)}
.ring-track{position:relative;width:min(76vmin,880px);height:min(76vmin,880px);border-radius:50%}
.ring-img{position:absolute;top:50%;left:50%;object-fit:cover;user-select:none;-webkit-user-drag:none;opacity:0;transition:opacity .3s ease-out}
.ring-img.visible{opacity:1}
</style>
