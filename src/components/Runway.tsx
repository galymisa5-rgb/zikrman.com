import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../config'
import { cutouts } from '../data/cutouts'
import { runwayLooks, type RunwayLook } from '../data/runway'
import { useProducts } from '../hooks/useProducts'
import { formatPrice, orderLink } from '../lib/format'
import type { Product } from '../lib/types'
import { ArrowLeft, ArrowRight, CloseIcon } from './Icons'

/* ------------------------------------------------------------------ */
/* «Примерьте образ»: модели в полный рост стоят в ряд. Центральная —   */
/* крупно и резко, дальние — меньше и в дымке. Нажмите на модель —      */
/* остальные растворяются, справа появляется то, что на ней надето.     */
/* ------------------------------------------------------------------ */

const ease = [0.16, 1, 0.3, 1] as const
const snapSpring = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 } as const

type Look = RunwayLook & { product: Product }

/** Ряд закольцован: кратчайшее расстояние по кругу, со знаком (−n/2…n/2) */
function ringDist(d: number, n: number) {
  if (n <= 0) return d
  const r = ((d % n) + n) % n
  return r > n / 2 ? r - n : r
}
const ringIndex = (v: number, n: number) => (n ? ((Math.round(v) % n) + n) % n : 0)

/** Костюмы продаются комплектом — куртка и брюки */
const SUIT_CATEGORIES = ['casual', 'sport']

/** Миниатюра вещи для панели: вырезка одежды, если есть, иначе фото товара */
function thumbOf(p: Product) {
  const cut = p.images
    .map((src) => cutouts[src])
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank)[0]
  return cut ? { src: cut.src, cut: true } : { src: p.images[0], cut: false }
}

export function Runway() {
  const { products } = useProducts()
  const looks = useMemo<Look[]>(() => {
    const bySlug = new Map((products ?? []).map((p) => [p.slug, p]))
    return runwayLooks.flatMap((l) => {
      const product = bySlug.get(l.slug)
      return product ? [{ ...l, product }] : []
    })
  }, [products])

  const stageRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = looks.length
  const mobile = size.w > 0 && size.w < 760
  const figH = size.h * (mobile ? 0.8 : 0.84)
  const spacing = mobile ? size.w * 0.4 : Math.min(size.w * 0.15, figH * 0.42)

  // pos — дробный номер модели в центре; focus — 0..1, насколько открыт «образ»
  const pos = useMotionValue(0)
  const focus = useMotionValue(0)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()

  // pos не ограничен: ряд крутится по кругу, номер модели — pos по модулю n
  useMotionValueEvent(pos, 'change', (v) => {
    const r = ringIndex(v, n)
    if (r !== active) setActive(r)
  })

  const slideTo = (t: number) => {
    if (reduceMotion) pos.set(t)
    else animate(pos, t, snapSpring)
  }
  /** К модели i — кратчайшим путём по кругу */
  const goTo = (i: number) => {
    const base = Math.round(pos.get())
    slideTo(base + ringDist(i - ringIndex(base, n), n))
  }
  const step = (k: number) => slideTo(Math.round(pos.get()) + k)

  useEffect(() => {
    animate(focus, open ? 1 : 0, { duration: reduceMotion ? 0 : 0.7, ease })
  }, [open, focus, reduceMotion])

  // Клавиши: стрелки листают, Esc закрывает образ
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Перетаскивание пальцем или мышью
  const drag = useRef<{ x: number; start: number; moved: boolean; t: number; vx: number } | null>(null)
  const suppressClick = useRef(false)
  const onDown = (e: ReactPointerEvent) => {
    if (open || n < 2) return
    pos.stop()
    drag.current = { x: e.clientX, start: pos.get(), moved: false, t: performance.now(), vx: 0 }
  }
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    const now = performance.now()
    const p = d.start - dx / spacing
    d.vx = (p - pos.get()) / Math.max(1, now - d.t)
    d.t = now
    pos.set(p)
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    suppressClick.current = true
    window.setTimeout(() => (suppressClick.current = false), 0)
    slideTo(Math.round(pos.get() + d.vx * 160))
  }

  // Горизонтальная прокрутка тачпадом
  const wheelAcc = useRef(0)
  const onWheel = (e: WheelEvent) => {
    if (open || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    wheelAcc.current += e.deltaX
    if (Math.abs(wheelAcc.current) > 60) {
      step(Math.sign(wheelAcc.current))
      wheelAcc.current = 0
    }
  }

  const current = looks[active]
  const progressLeft = useTransform(pos, (v) => `${(n ? (((v % n) + n) % n) / n : 0) * 100}%`)

  return (
    <section id="looks" className="relative overflow-hidden bg-[#f4f3f0] pt-14 md:pt-20">
      <div className="container-x relative z-30 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-muted">Образы {site.brand}</p>
          <h2 className="font-display text-3xl font-medium md:text-5xl">Примерьте образ.</h2>
          <p className="mt-2 max-w-[40ch] text-sm text-muted">
            {mobile ? 'Листайте ряд пальцем.' : 'Листайте ряд.'} Нажмите на образ — покажем, что на нём надето.
          </p>
        </div>
      </div>

      {/* Сцена */}
      <div
        ref={stageRef}
        className={`relative mt-4 h-[clamp(500px,76svh,840px)] touch-pan-y select-none ${open ? '' : 'cursor-grab active:cursor-grabbing'}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
        role="region"
        aria-roledescription="карусель"
        aria-label="Образы в полный рост"
      >
        {/* Пол: лёгкая тень у ног */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-black/[0.035] to-transparent" />

        {size.w > 0 &&
          looks.map((look, i) => (
            <Figure
              key={look.slug}
              look={look}
              i={i}
              n={n}
              pos={pos}
              focus={focus}
              figH={figH}
              spacing={spacing}
              stageW={size.w}
              stageH={size.h}
              mobile={mobile}
              isActive={i === active}
              open={open}
              onSelect={() => {
                if (suppressClick.current) return
                if (i === active) setOpen(true)
                else goTo(i)
              }}
            />
          ))}

        <AnimatePresence>
          {open && current && (
            <LookPanel key={current.slug} look={current} mobile={mobile} onClose={() => setOpen(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Низ: прогресс и стрелки */}
      <div className="container-x relative z-30 flex items-center justify-between gap-6 pt-3 pb-10 md:pb-14">
        <div className="min-w-0 flex-1">
          <div className="relative h-px w-full max-w-[420px] bg-ink/15">
            <motion.div
              className="absolute top-[-1px] h-[3px] bg-ink"
              style={{
                width: `${100 / Math.max(1, n)}%`,
                left: progressLeft,
              }}
            />
          </div>
          <p className="mt-3 truncate text-[11px] tracking-[0.16em] text-muted uppercase">
            <span className="text-ink tabular-nums">{String(active + 1).padStart(2, '0')}</span>
            <span className="mx-1.5">/</span>
            <span className="tabular-nums">{String(n).padStart(2, '0')}</span>
            {current && <span className="ml-3">{current.product.name}</span>}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => {
              if (open) setOpen(false)
              step(-1)
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 transition-colors hover:bg-ink hover:text-paper"
            aria-label="Предыдущий образ"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => {
              if (open) setOpen(false)
              step(1)
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 transition-colors hover:bg-ink hover:text-paper"
            aria-label="Следующий образ"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Одна модель в ряду                                                  */
/* ------------------------------------------------------------------ */

function Figure({
  look,
  i,
  n,
  pos,
  focus,
  figH,
  spacing,
  stageW,
  stageH,
  mobile,
  isActive,
  open,
  onSelect,
}: {
  look: Look
  i: number
  n: number
  pos: MotionValue<number>
  focus: MotionValue<number>
  figH: number
  spacing: number
  stageW: number
  stageH: number
  mobile: boolean
  isActive: boolean
  open: boolean
  onSelect: () => void
}) {
  const figW = (figH * look.w) / look.h
  // В открытом образе модель отходит влево (на телефоне — вверх), освобождая место под вещи
  const shiftX = mobile ? 0 : -stageW * 0.17
  // На телефоне модель уменьшается и поднимается над нижней панелью
  const liftY = mobile ? -stageH * 0.47 : 0
  const shrink = mobile ? 0.5 : 0.04

  const x = useTransform([pos, focus], ([p, f]: number[]) => {
    const d = ringDist(i - p, n)
    const a = Math.abs(d)
    // Дальние модели стоят теснее — как в перспективе
    const off = Math.sign(d) * spacing * (a < 1 ? a : 1 + (a - 1) * 0.74)
    return off + (Math.abs(d) < 0.5 ? shiftX * f : off * f * 0.6)
  })
  const y = useTransform([pos, focus], ([p, f]: number[]) => {
    const a = Math.min(Math.abs(ringDist(i - p, n)), 6)
    return -a * figH * 0.012 + (Math.abs(ringDist(i - p, n)) < 0.5 ? liftY * f : 0)
  })
  const scale = useTransform([pos, focus], ([p, f]: number[]) => {
    const a = Math.min(Math.abs(ringDist(i - p, n)), 6)
    const base = 1 - a * 0.1
    return Math.abs(ringDist(i - p, n)) < 0.5 ? base * (1 - shrink * f) : base
  })
  const filter = useTransform([pos, focus], ([p, f]: number[]) => {
    const a = Math.abs(ringDist(i - p, n))
    const b = Math.min(8, Math.max(0, a - 0.2) * 1.9) + (a >= 0.5 ? f * 6 : 0)
    return b < 0.15 ? 'none' : `blur(${b.toFixed(2)}px)`
  })
  const opacity = useTransform([pos, focus], ([p, f]: number[]) => {
    const a = Math.abs(ringDist(i - p, n))
    const base = a > 6 ? 0 : 1 - Math.max(0, a - 3.6) * 0.42
    return a < 0.5 ? base : base * (1 - f)
  })
  const zIndex = useTransform(pos, (p) => 100 - Math.round(Math.abs(ringDist(i - p, n)) * 10))
  const visibility = useTransform(opacity, (o) => (o <= 0.01 ? 'hidden' : 'visible'))

  const product = look.product
  const suit = SUIT_CATEGORIES.includes(product.category)

  return (
    <motion.div
      className="absolute bottom-[5%] left-1/2"
      style={{ x, y, scale, opacity, zIndex, visibility, width: figW, height: figH, marginLeft: -figW / 2, transformOrigin: '50% 100%' }}
    >
      <motion.button
        type="button"
        onClick={onSelect}
        tabIndex={isActive && !open ? 0 : -1}
        aria-label={isActive ? `${product.name} — показать, что надето` : product.name}
        className="relative block h-full w-full outline-none focus-visible:[&>img]:drop-shadow-[0_0_0_2px_#0e0e0e]"
        style={{ filter }}
        whileHover={isActive && !open ? { y: -4 } : undefined}
        transition={{ duration: 0.4, ease }}
      >
        {/* Тень у ног */}
        <span className="absolute bottom-[-1.5%] left-1/2 h-[3%] w-[78%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-[6px]" />
        <img
          src={look.src}
          alt={product.name}
          draggable={false}
          loading={i < 6 ? 'eager' : 'lazy'}
          className="relative h-full w-full object-contain object-bottom"
        />
      </motion.button>

      {/* Точки на одежде — в открытом образе */}
      <AnimatePresence>
        {open && isActive && (
          <>
            <Hotspot top="32%" left="52%" label={suit ? 'Куртка' : 'Футболка'} delay={0.45} />
            {suit && <Hotspot top="66%" left="46%" label="Брюки" delay={0.55} />}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Hotspot({ top, left, label, delay }: { top: string; left: string; label: string; delay: number }) {
  return (
    <motion.span
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ top, left }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ duration: 0.4, delay, ease }}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
      <span className="relative grid h-5 w-5 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <span className="h-1.5 w-1.5 rounded-full bg-ink" />
      </span>
      <span className="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase opacity-0 shadow transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </motion.span>
  )
}

/* ------------------------------------------------------------------ */
/* Панель «В этом образе»                                              */
/* ------------------------------------------------------------------ */

function LookPanel({ look, mobile, onClose }: { look: Look; mobile: boolean; onClose: () => void }) {
  const p = look.product
  const thumb = thumbOf(p)
  const suit = SUIT_CATEGORIES.includes(p.category)
  const [size, setSize] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  const orderText = `Здравствуйте! Хочу заказать: ${p.name}${size ? `, размер ${size}` : ''} — ${formatPrice(p.price)}`

  return (
    <motion.aside
      role="dialog"
      aria-label={`В этом образе: ${p.name}`}
      className={
        mobile
          ? 'absolute inset-x-3 bottom-3 z-[200] max-h-[50%] overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]'
          : 'absolute top-[6%] right-[clamp(16px,4vw,64px)] bottom-[6%] z-[200] flex w-[min(400px,34vw)] flex-col overflow-y-auto rounded-2xl bg-white p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]'
      }
      initial={mobile ? { y: '110%' } : { x: 60, opacity: 0 }}
      animate={mobile ? { y: 0 } : { x: 0, opacity: 1 }}
      exit={mobile ? { y: '110%' } : { x: 40, opacity: 0 }}
      transition={{ duration: 0.55, ease }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-muted">В этом образе</p>
          <p className="mt-1 text-xs text-muted">{suit ? 'Комплект: куртка и брюки' : '1 вещь'}</p>
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/15 transition-colors hover:bg-ink hover:text-paper"
          aria-label="Закрыть образ"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="mt-6 flex gap-4 border-t border-ink/10 pt-6">
        <div className={`flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg ${thumb.cut ? 'bg-[#f4f3f0]' : 'bg-stone'}`}>
          <img
            src={thumb.src}
            alt=""
            className={thumb.cut ? 'max-h-[88%] max-w-[88%] object-contain' : 'h-full w-full object-cover object-top'}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">{site.brand}</p>
          <h3 className="mt-1 font-display text-base leading-snug font-medium">{p.name}</h3>
          <p className="mt-1.5 text-sm tabular-nums">{formatPrice(p.price)}</p>
          {p.colors[0] && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted">
              <span className="h-3 w-3 rounded-full ring-1 ring-black/15" style={{ background: p.colors[0].hex }} />
              {p.colors[0].name}
            </p>
          )}
        </div>
      </div>

      {p.sizes.length > 0 && (
        <div className="mt-6">
          <p className="label">Размер</p>
          <div className="flex flex-wrap gap-1.5">
            {p.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s === size ? null : s)}
                aria-pressed={s === size}
                className={`min-w-11 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  s === size ? 'border-ink bg-ink text-paper' : 'border-ink/15 hover:border-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${mobile ? 'mt-6' : 'mt-auto pt-6'} flex flex-col gap-3`}>
        <a href={orderLink(orderText)} target="_blank" rel="noreferrer" className="btn-dark w-full rounded-full">
          Заказать образ <ArrowRight size={14} />
        </a>
        <Link to={`/product/${p.slug}`} className="btn-outline w-full rounded-full">
          Подробнее о вещи
        </Link>
      </div>
    </motion.aside>
  )
}
