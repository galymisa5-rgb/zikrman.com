import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../config'
import { useProducts } from '../hooks/useProducts'
import { formatPrice, orderLink } from '../lib/format'
import { cutouts, type Cutout } from '../data/cutouts'
import type { Product } from '../lib/types'
import { ArrowLeft, ArrowRight, CloseIcon } from './Icons'

/* ------------------------------------------------------------------ */
/* Гардероб: вещи висят на штанге боком, при наведении разворачиваются, */
/* по клику открываются крупно с бирками цветов.                       */
/* ------------------------------------------------------------------ */

const ease = [0.16, 1, 0.3, 1] as const
const spring = { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 } as const

/** Модель одежды: несколько товаров, отличающихся только цветом. */
export interface Garment {
  key: string
  title: string
  variants: Product[]
}

// Слова, которые описывают цвет, — по ним товары одной модели собираются в одну вешалку
const COLOR_WORD = /^(черн|бел|сер|темн|тёмн|пурпурно|темно|тёмно|аквамарин|коричнев|бежев|зелен|зелён|син|grey|gray|white|black|верх|низ)/i

function modelWords(name: string) {
  const words = name.replace(/,/g, ' ').split(/\s+/).filter(Boolean)
  // «с белым текстом» — часть модели, а не цвет вещи, поэтому слово после «с» оставляем
  return words.filter((w, i) => !COLOR_WORD.test(w) || words[i - 1]?.toLowerCase() === 'с')
}

export function groupGarments(products: Product[]): Garment[] {
  const map = new Map<string, Garment>()
  for (const p of products) {
    const words = modelWords(p.name)
    const key = `${p.category}|${p.price}|${words.join(' ').toLowerCase().replace(/ё/g, 'е')}`
    const g = map.get(key)
    if (g) g.variants.push(p)
    else map.set(key, { key, title: words.join(' ') || p.name, variants: [p] })
  }
  return [...map.values()]
}

/** Чёрный или белый текст поверх цвета бирки */
function inkOn(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return '#0e0e0e'
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0e0e0e' : '#f5f4f1'
}

function variantLabel(p: Product) {
  return p.colors[0]?.name ?? p.name
}

/* ------------------------------------------------------------------ */
/* Вешалка: вещь без фона висит на крючке                               */
/* ------------------------------------------------------------------ */

/** Вид вещи: вырезка без фона или, если её нет, обычное фото */
export type View = { src: string; cut: Cutout | null }

/** Виды товара для штанги: сначала вырезки «по пояс», потом в полный рост, без вырезок — обычные фото */
export function viewsOf(p: Product): View[] {
  const cuts = p.images
    .map((src) => cutouts[src])
    .filter((c): c is Cutout => Boolean(c))
    .map((cut) => ({ src: cut.src, cut, tall: (cut.h * (1 - cut.neck)) / cut.w > 2 }))
  if (cuts.length) return [...cuts.filter((c) => !c.tall), ...cuts.filter((c) => c.tall)].map(({ src, cut }) => ({ src, cut }))
  return p.images.map((src) => ({ src, cut: null }))
}

function Hook({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 44" style={{ width: size, height: size * 1.1 }} className="mx-auto block text-neutral-500" aria-hidden>
      <path
        d="M20 44 V24 C20 16 30 15 30 8.5 C30 3 24.5 0.5 20 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Вешалка с вещью. maxAspect — предел высоты к ширине: длинные кадры (в полный рост)
 * обрезаются снизу с мягким растворением, чтобы штанга оставалась ровной.
 */
function Hanger({
  view,
  width,
  maxAspect = 1.9,
  eager,
}: {
  view: View
  width: number
  maxAspect?: number
  eager?: boolean
}) {
  const hookSize = Math.max(26, Math.round(width * 0.16))
  const { cut } = view

  // Нет вырезки — обычное фото в рамке, как раньше
  if (!cut) {
    return (
      <div style={{ width }} className="relative">
        <Hook size={hookSize} />
        <ClipBar />
        <div className="relative -mt-0.5 overflow-hidden bg-stone" style={{ aspectRatio: '2 / 3' }}>
          <img src={view.src} alt="" loading={eager ? 'eager' : 'lazy'} draggable={false} className="h-full w-full object-cover object-top" />
        </div>
      </div>
    )
  }

  const top = cut.neck > 0
  // Низ кадра уже растворён в самом файле вырезки, у штанов отрезана обувь
  const aspect = (cut.h * (1 - cut.neck)) / cut.w
  const shown = Math.min(aspect, maxAspect)

  return (
    <div style={{ width }} className="relative">
      <Hook size={hookSize} />
      {top ? (
        // Плечики: треугольная планка прячется под воротником
        <svg
          viewBox="0 0 100 14"
          preserveAspectRatio="none"
          className="absolute left-1/2 z-0 -translate-x-1/2 text-neutral-800"
          style={{ top: hookSize * 1.1 - 2, width: '62%', height: Math.max(8, width * 0.07) }}
          aria-hidden
        >
          <path d="M50 1 L97 12 Q98.5 13 96 13 L4 13 Q1.5 13 3 12 Z" fill="currentColor" />
        </svg>
      ) : (
        <ClipBar />
      )}
      <div
        className="relative z-10 overflow-hidden"
        style={{
          aspectRatio: `1 / ${shown}`,
          marginTop: top ? Math.max(4, width * 0.035) : -2,
        }}
      >
        <img
          src={cut.src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          draggable={false}
          className="block w-full max-w-none"
          style={{ marginTop: `-${((cut.neck * cut.h) / cut.w) * 100}%` }}
        />
      </div>
    </div>
  )
}

/** Вид для штанги: первый вариант цвета, у которого есть вырезка */
function rackView(g: Garment): View {
  for (const v of g.variants) {
    const first = viewsOf(v)[0]
    if (first?.cut) return first
  }
  return viewsOf(g.variants[0])[0]
}

/** Планка с прищепками — для штанов и обычных фото */
function ClipBar() {
  return (
    <div className="relative z-20 mx-auto -mt-px h-[7px] w-[88%] rounded-full bg-gradient-to-b from-neutral-600 to-neutral-900 shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
      <span className="absolute top-[3px] left-[10%] h-4 w-[9%] rounded-[2px] bg-gradient-to-b from-neutral-400 to-neutral-600" />
      <span className="absolute top-[3px] right-[10%] h-4 w-[9%] rounded-[2px] bg-gradient-to-b from-neutral-400 to-neutral-600" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Штанга                                                              */
/* ------------------------------------------------------------------ */

export function Rack() {
  const { products, loading } = useProducts()
  const garments = useMemo(() => groupGarments((products ?? []).filter((p) => p.images.length > 0)), [products])

  const railRef = useRef<HTMLDivElement>(null)
  const [railW, setRailW] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = railRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setRailW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

  const n = garments.length
  const wide = railW >= 760
  const cardW = wide ? Math.round(Math.min(250, Math.max(190, railW * 0.18))) : 150
  const activeW = cardW + 28
  const baseW = wide ? Math.max(30, Math.min(78, (railW - activeW - 120) / Math.max(1, n - 1))) : 62
  const current = hovered ?? null

  return (
    <section id="wardrobe" className="relative overflow-hidden bg-paper pt-16 pb-10 md:pt-24 md:pb-14">
      <div className="container-x">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <div>
            <p className="eyebrow mb-3 text-muted">Гардероб {site.brand}</p>
            <h2 className="font-display text-3xl font-medium uppercase md:text-5xl">Вся коллекция на одной штанге</h2>
          </div>
          <p className="max-w-[30ch] text-sm text-muted">
            {wide ? 'Наведите на вещь, чтобы рассмотреть, и нажмите, чтобы открыть.' : 'Листайте штангу и нажмите на вещь.'}
          </p>
        </div>

        <div ref={railRef} className="relative">
          {/* Штанга */}
          <div className="absolute inset-x-0 top-[6px] z-0 h-[6px] rounded-full bg-gradient-to-b from-neutral-300 via-neutral-100 to-neutral-400 shadow-[0_2px_4px_rgba(0,0,0,0.18)]" />
          <span className="absolute top-0 left-0 z-0 h-[18px] w-2 rounded-sm bg-neutral-400" />
          <span className="absolute top-0 right-0 z-0 h-[18px] w-2 rounded-sm bg-neutral-400" />

          {loading ? (
            <div style={{ height: cardW * 0.18 + cardW * 1.95 }} />
          ) : (
            <div
              className={
                wide
                  ? 'relative flex justify-center'
                  : '-mx-4 flex snap-x overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:-mx-6'
              }
              onMouseLeave={() => setHovered(null)}
            >
              {garments.map((g, i) => {
                const isActive = wide && current === i
                const dist = current === null ? 0 : Math.abs(i - current)
                return (
                  <motion.button
                    key={g.key}
                    type="button"
                    aria-label={`${g.title}, ${formatPrice(g.variants[0].price)}`}
                    onMouseEnter={() => wide && setHovered(i)}
                    onFocus={() => wide && setHovered(i)}
                    onClick={() => setOpen(i)}
                    className="relative shrink-0 snap-center outline-none [perspective:1100px] focus-visible:[&_.rack-photo]:ring-2 focus-visible:[&_.rack-photo]:ring-ink"
                    style={{ height: cardW * 0.18 + cardW * 1.95, zIndex: isActive ? 60 : 40 - dist }}
                    initial={false}
                    animate={{ width: isActive ? activeW : baseW }}
                    transition={spring}
                  >
                    <motion.div
                      className="rack-photo pointer-events-none absolute top-0 left-1/2"
                      style={{ x: '-50%', transformOrigin: '50% 0%', transformStyle: 'preserve-3d' }}
                      initial={{ opacity: 0, y: -30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-10% 0px' }}
                      transition={{ duration: 0.9, delay: 0.04 * i, ease }}
                    >
                      <motion.div
                        style={{ transformOrigin: '50% 0%' }}
                        initial={false}
                        animate={
                          isActive
                            ? { rotateY: 0, rotateZ: [0, 1.8, -1.2, 0.6, 0], scale: 1.02 }
                            : { rotateY: -62, rotateZ: 0, scale: 1 }
                        }
                        transition={{
                          rotateY: spring,
                          scale: spring,
                          rotateZ: { duration: 1.4, ease: 'easeOut' },
                        }}
                      >
                        <Hanger view={rackView(g)} width={cardW} eager={i < 8} />
                      </motion.div>
                    </motion.div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        {/* Подпись под штангой */}
        <div className="mt-8 flex min-h-[76px] flex-col items-center justify-start gap-4 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={current ?? 'none'}
              className="text-xs tracking-[0.16em] text-muted uppercase"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {current !== null && garments[current]
                ? `${garments[current].title} — ${formatPrice(garments[current].variants[0].price)}`
                : `${n} моделей · ${products?.length ?? 0} вещей`}
            </motion.p>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setOpen(current ?? 0)}
            disabled={n === 0}
            className="rounded-full border border-ink/25 px-6 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            {current !== null ? 'Открыть' : 'Смотреть по одной'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open !== null && garments[open] && (
          <Look
            garments={garments}
            index={open}
            onIndex={setOpen}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Крупный просмотр одной вещи                                         */
/* ------------------------------------------------------------------ */

/** Высокие кадры (в полный рост) сужаем, чтобы вещь целиком помещалась по высоте */
function fitWidth(view: View, width: number) {
  if (!view.cut) return width
  const aspect = (view.cut.h * (1 - view.cut.neck)) / view.cut.w
  return Math.round(Math.min(width, (width * 1.8) / aspect))
}

/** Ширина вещи в крупном просмотре: влезает в экран по высоте и ширине */
function useLookWidth() {
  const calc = () => Math.round(Math.min(window.innerWidth * 0.62, (window.innerHeight - 300) / 1.95, 380))
  const [w, setW] = useState(calc)
  useEffect(() => {
    const on = () => setW(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return Math.max(170, w)
}

function Look({
  garments,
  index,
  onIndex,
  onClose,
}: {
  garments: Garment[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const g = garments[index]
  const [variant, setVariant] = useState(0)
  const [view, setView] = useState(0)
  const [dir, setDir] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const product = g.variants[Math.min(variant, g.variants.length - 1)]
  const views = viewsOf(product).slice(0, 5)
  const current = views[Math.min(view, views.length - 1)]
  const lookW = useLookWidth()

  const go = useCallback(
    (d: number) => {
      setDir(d)
      setVariant(0)
      setView(0)
      onIndex((index + d + garments.length) % garments.length)
    },
    [index, garments.length, onIndex],
  )

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const lastFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      lastFocus?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  const pickVariant = (i: number) => {
    setVariant(i)
    setView(0)
  }

  const tags = [
    ...(g.variants.length > 1
      ? g.variants.map((v, i) => ({
          key: v.id,
          label: variantLabel(v),
          fill: v.colors[0]?.hex ?? '#d9d8d3',
          active: i === variant,
          onClick: () => pickVariant(i),
        }))
      : []),
  ]

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={g.title}
      className="fixed inset-0 z-[90] flex flex-col bg-paper/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <button
        ref={closeRef}
        onClick={onClose}
        className="absolute top-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-ink/20 bg-paper transition-colors hover:bg-ink hover:text-paper md:top-6 md:right-6"
        aria-label="Закрыть"
      >
        <CloseIcon size={18} />
      </button>

      {garments.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute top-1/2 left-3 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-ink/20 bg-paper/80 transition-colors hover:bg-ink hover:text-paper md:left-8"
            aria-label="Предыдущая вещь"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute top-1/2 right-3 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-ink/20 bg-paper/80 transition-colors hover:bg-ink hover:text-paper md:right-8"
            aria-label="Следующая вещь"
          >
            <ArrowRight size={18} />
          </button>
        </>
      )}

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-16">
        {/* Вешалка + бирки */}
        <div className="pointer-events-auto relative">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={g.key}
              custom={dir}
              style={{ transformOrigin: '50% 0%' }}
              initial={{ opacity: 0, x: dir * 120, rotateZ: dir * 4 }}
              animate={{ opacity: 1, x: 0, rotateZ: [dir * 4, dir * -1.5, 0] }}
              exit={{ opacity: 0, x: dir * -120 }}
              transition={{ duration: 0.6, ease }}
            >
              <div className="grid" style={{ width: lookW }} aria-label={`${product.name}, вид ${view + 1}`} role="img">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={current.src}
                    className="[grid-area:1/1]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex justify-center">
                      <Hanger view={current} width={fitWidth(current, lookW)} maxAspect={3} eager />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Бирки: цена и цвета */}
          <div className="absolute top-12 right-2 z-20 flex items-start gap-1.5 md:right-auto md:left-full md:ml-5 md:gap-3">
            <Tag fill="#cbb594" label={product.in_stock ? formatPrice(product.price) : 'Нет в наличии'} string={34} />
            {tags.map((t, i) => (
              <Tag
                key={t.key}
                fill={t.fill}
                label={t.label}
                string={52 + (i % 3) * 18}
                active={t.active}
                onClick={t.onClick}
              />
            ))}
          </div>
        </div>

        {/* Подпись */}
        <div className="pointer-events-auto mt-6 flex flex-col items-center gap-3 text-center">
          <h3 className="font-display text-lg font-medium tracking-[0.08em] uppercase md:text-2xl">{g.title}</h3>
          {g.variants.length > 1 && <p className="-mt-2 text-xs text-muted">{variantLabel(product)}</p>}

          {views.length > 1 && (
            <div className="flex rounded-full border border-ink/20 p-0.5" role="group" aria-label="Фото">
              {views.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setView(i)}
                  aria-pressed={i === view}
                  className={`rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors ${
                    i === view ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  Фото {i + 1}
                </button>
              ))}
            </div>
          )}

          {product.sizes.length > 0 && (
            <p className="text-[11px] tracking-[0.12em] text-muted uppercase">Размеры: {product.sizes.join(' · ')}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center justify-center gap-5">
            <Link to={`/product/${product.slug}`} className="link-underline">
              Подробнее <ArrowRight size={13} />
            </Link>
            <a
              href={orderLink(`Здравствуйте! Хочу заказать: ${product.name} — ${formatPrice(product.price)}`)}
              target="_blank"
              rel="noreferrer"
              className="btn-dark !px-5 !py-2.5"
            >
              Заказать
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Бумажная бирка на нитке */
function Tag({
  fill,
  label,
  string,
  active,
  onClick,
}: {
  fill: string
  label: string
  string: number
  active?: boolean
  onClick?: () => void
}) {
  const color = inkOn(fill)
  const body = (
    <motion.span
      className="flex flex-col items-center"
      style={{ transformOrigin: '50% 0%' }}
      whileHover={onClick ? { rotateZ: [0, 6, -4, 2, 0] } : undefined}
      transition={{ duration: 0.9 }}
    >
      <span className="w-px bg-ink/35" style={{ height: string }} />
      <span
        className={`relative flex h-[76px] w-8 items-center justify-center rounded-[3px] shadow-[0_6px_10px_-6px_rgba(0,0,0,0.4)] transition-transform md:h-[96px] md:w-10 ${
          active ? 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''
        }`}
        style={{ background: fill, color }}
      >
        <span className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-paper/80 ring-1 ring-black/15" />
        <span className="mt-3 text-[9px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase [writing-mode:vertical-rl] md:text-[10px]">
          {label}
        </span>
      </span>
    </motion.span>
  )
  if (!onClick) return <span aria-hidden>{body}</span>
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={`Цвет: ${label}`} className="outline-none focus-visible:[&>span>span:last-child]:ring-2">
      {body}
    </button>
  )
}
