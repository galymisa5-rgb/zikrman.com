import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { useRef, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BadgeIcon, InstagramIcon, LockIcon, ReturnIcon, TruckIcon } from '../components/Icons'
import { Marquee } from '../components/Marquee'
import { Rack } from '../components/Rack'
import { AnimatedLogo } from '../components/Logo'
import { useIntroDone } from '../components/Preloader'
import { ProductCard, ProductGridSkeleton } from '../components/ProductCard'
import { MaskText, Reveal } from '../components/Reveal'
import { categories, site } from '../config'
import { useProducts } from '../hooks/useProducts'

const ease = [0.16, 1, 0.3, 1] as const

export default function Home() {
  return (
    <>
      <Hero />
      <Rack />
      <Marquee
        items={['Помни, кто ты', site.brand, 'Стиль и скромность', 'Стамбул · Бишкек', 'Одежда с намерением']}
        className="bg-ink py-4 font-display text-2xl font-light tracking-wide text-paper uppercase md:py-5 md:text-4xl"
      />
      <Categories />
      <SeasonBanner />
      <Mission />
      <Features />
      <Bestsellers />
      <NewArrivals />
      <InstagramCta />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Hero: буквы бренда, фото «проходит» сквозь них, разлёт при скролле  */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const introDone = useIntroDone()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  // Параллакс за курсором
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const imgShiftX = useTransform(sx, (v) => v * 18)
  const imgShiftY = useTransform(sy, (v) => v * 12)
  const imgRotate = useTransform(sx, (v) => v * 2)

  const onMove = (e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      className="relative -mt-16 flex h-[100svh] min-h-[620px] flex-col overflow-hidden pt-16 md:-mt-20 md:pt-20"
    >
      {/* Фото */}
      <motion.div
        className="pointer-events-none absolute top-[53%] left-1/2 aspect-[2/3] w-[min(86vw,calc(78svh*2/3))] -translate-x-1/2 -translate-y-1/2 sm:w-[min(60vw,calc(78svh*2/3))] lg:w-[min(30vw,calc(80svh*2/3))]"
        style={{ x: imgShiftX, y: imgShiftY, rotate: imgRotate }}
      >
        <motion.div
          className="relative h-full w-full overflow-hidden"
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={introDone ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
          transition={{ duration: 1.4, delay: 0.35, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.img
            src="/images/brand/hero.webp"
            alt="Образ из новой коллекции"
            className="h-full w-full object-cover object-top grayscale"
            style={{ scale: imgScale, y: imgY }}
            initial={{ scale: 1.35 }}
            animate={introDone ? { scale: 1 } : undefined}
            transition={{ duration: 1.8, delay: 0.35, ease }}
          />
        </motion.div>
      </motion.div>

      {/* Слоган */}
      <motion.div className="container-x relative z-10 pt-6 md:pt-10" style={{ opacity: fade }}>
        {introDone && (
          <MaskText
            text={'Одежда\nдля тех, кто помнит\nо главном.'}
            className="eyebrow block leading-[2] text-ink"
            delay={0.9}
            stagger={0.05}
          />
        )}
        <motion.span
          className="mt-3 block h-px w-10 origin-left bg-ink"
          initial={{ scaleX: 0 }}
          animate={introDone ? { scaleX: 1 } : undefined}
          transition={{ duration: 1, delay: 1.4, ease }}
        />
      </motion.div>

      {/* Гигантский логотип — mix-blend-difference инвертирует его поверх фото */}
      <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center text-white mix-blend-difference">
        <h1 className="w-[80vw] sm:w-[68vw] lg:w-[60vw] 2xl:w-[56vw]">
          <AnimatedLogo play={introDone} progress={scrollYProgress} className="h-auto w-full" />
        </h1>
      </div>

      {/* Нижняя строка */}
      <div className="container-x relative z-10 flex items-end justify-between gap-6 pb-8 md:pb-12">
        <motion.div
          className="flex flex-wrap items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={introDone ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, delay: 1.3, ease }}
        >
          <Link to="/catalog" className="btn-dark">
            Каталог
          </Link>
          <Link to="/catalog?filter=new" className="link-underline hidden sm:inline-flex">
            Новинки
          </Link>
        </motion.div>
        <motion.div
          className="eyebrow text-right leading-[2]"
          initial={{ opacity: 0, y: 20 }}
          animate={introDone ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, delay: 1.45, ease }}
        >
          Новая
          <br />
          коллекция
          <br />
          2026
          <span className="mt-2 ml-auto block h-px w-10 bg-ink" />
        </motion.div>
      </div>

      {/* Индикатор прокрутки */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-10 hidden h-12 w-px -translate-x-1/2 overflow-hidden bg-ink/15 md:block"
        style={{ opacity: fade }}
      >
        <motion.span
          className="absolute inset-x-0 top-0 h-1/2 bg-ink"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Categories() {
  return (
    <section className="bg-ink py-16 text-paper md:py-20">
      <div className="container-x">
        <div className="mb-10 flex items-end justify-between">
          <MaskText as="h2" text="Категории" className="font-display text-3xl font-medium uppercase md:text-5xl" />
          <Link to="/catalog" className="link-underline text-paper">
            Весь каталог <ArrowRight size={14} />
          </Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08} className="w-[70vw] shrink-0 snap-start sm:w-auto">
              <Link to={`/catalog/${c.slug}`} className="group block">
                <div className="aspect-[3/4] overflow-hidden bg-neutral-800">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-all duration-[1200ms] ease-out-expo group-hover:scale-110 [@media(hover:hover)]:grayscale [@media(hover:hover)]:group-hover:grayscale-0"
                  />
                </div>
                <h3 className="mt-4 font-display text-lg font-medium tracking-wide uppercase">{c.title}</h3>
                <p className="mt-1 text-sm text-paper/60">{c.description}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  Смотреть
                  <ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-2" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function SeasonBanner() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const bigX = useTransform(scrollYProgress, [0, 1], ['10%', '-30%'])

  return (
    <section ref={ref} className="relative overflow-hidden bg-mist">
      <motion.div
        aria-hidden
        style={{ x: bigX }}
        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 font-display text-[28vw] leading-none font-medium whitespace-nowrap text-white/40 select-none"
      >
        NEW SEASON
      </motion.div>
      <div className="container-x relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-0">
        <div className="md:py-24">
          <Reveal>
            <p className="eyebrow mb-6">Новый сезон</p>
          </Reveal>
          <MaskText
            as="h2"
            text={'NEW\nVIBES'}
            className="font-display text-6xl leading-[0.9] font-medium md:text-8xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xs text-base leading-relaxed text-ink/70">
              Новые костюмы, камис и ихрам — для города, поездок и поклонения.
            </p>
            <Link to="/catalog?filter=new" className="btn-dark mt-8">
              Смотреть новинки
            </Link>
          </Reveal>
        </div>
        <motion.div
          className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:h-[640px]"
          initial={{ clipPath: 'inset(0 0 0 100%)' }}
          whileInView={{ clipPath: 'inset(0 0 0 0%)' }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.img
            src="/images/brand/season.webp"
            alt="Новый сезон"
            loading="lazy"
            style={{ y }}
            className="absolute inset-0 h-[124%] w-full -translate-y-[12%] object-cover grayscale"
          />
        </motion.div>
      </div>
    </section>
  )
}

function Mission() {
  return (
    <section className="bg-ink py-24 text-paper md:py-32">
      <div className="container-x grid gap-12 md:grid-cols-[1fr_1.4fr] md:items-center">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src="/images/brand/detail-logo.webp"
              alt="Логотип ZIKR на футболке"
              loading="lazy"
              className="h-full w-full object-cover grayscale"
            />
          </div>
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow mb-6 text-paper/50">Миссия бренда</p>
          </Reveal>
          <MaskText
            as="h2"
            text={'Помни, кто ты\nи для чего был создан'}
            className="font-display text-4xl leading-tight font-medium md:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl leading-relaxed text-paper/70">
              ZIKR — это больше, чем просто одежда. Это выражение веры, достоинства и стиля. Мы создаём мужскую
              одежду, которая сочетает традиции Ислама с современным дизайном, позволяя каждому мужчине чувствовать
              себя уверенно и комфортно в любой ситуации.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-paper/70">
              Каждая вещь — это напоминание (зикр) о вере, чистоте намерений и стремлении к лучшему.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const features = [
  { icon: TruckIcon, title: 'Шоурум в Бишкеке', text: 'ул. Шабдан Баатыра, 97' },
  { icon: ReturnIcon, title: 'Ежедневно', text: 'С 09:00 до 20:00' },
  { icon: BadgeIcon, title: 'Головной офис', text: 'Турция, Стамбул' },
  { icon: LockIcon, title: 'Заказ в WhatsApp', text: '+996 702 555 599' },
]

function Features() {
  return (
    <section className="border-b border-mist bg-stone">
      <div className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4 md:py-14">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08} y={20} className="flex items-start gap-4">
            <f.icon size={30} strokeWidth={1.2} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase">{f.title}</p>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Bestsellers() {
  const { products, loading } = useProducts()
  const featured = (products ?? []).filter((p) => p.is_featured).slice(0, 8)

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="mb-10 flex items-end justify-between gap-6">
          <MaskText
            as="h2"
            text={`Лучшее от ${site.brand}`}
            className="font-display text-3xl font-medium uppercase md:text-5xl"
          />
          <Link to="/catalog" className="link-underline shrink-0">
            Смотреть все
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function NewArrivals() {
  const { products } = useProducts()
  const scroller = useRef<HTMLDivElement>(null)
  const items = (products ?? []).filter((p) => p.is_new)
  if (items.length === 0) return null

  const scrollBy = (dir: number) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <section className="bg-stone py-20 md:py-28">
      <div className="container-x">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <Reveal>
              <p className="eyebrow mb-4 text-muted">Только что в каталоге</p>
            </Reveal>
            <MaskText as="h2" text="Новинки" className="font-display text-3xl font-medium uppercase md:text-5xl" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollBy(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-paper"
              aria-label="Назад"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-paper"
              aria-label="Вперёд"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div
          ref={scroller}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-12 lg:scroll-px-12 lg:px-12"
        >
          {items.map((p, i) => (
            <div key={p.id} className="w-[64vw] shrink-0 snap-start sm:w-[40vw] lg:w-[23vw]">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InstagramCta() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-x text-center">
        <Reveal>
          <p className="eyebrow mb-6 text-muted">Следите за нами</p>
        </Reveal>
        <a href={site.contacts.instagram} target="_blank" rel="noreferrer" className="group inline-block">
          <MaskText
            as="h2"
            text={`@${site.contacts.instagram.replace(/\/+$/, '').split('/').pop()}`}
            className="font-display text-[9vw] leading-none font-medium transition-opacity group-hover:opacity-70 md:text-[7vw]"
          />
        </a>
        <Reveal delay={0.2}>
          <a href={site.contacts.instagram} target="_blank" rel="noreferrer" className="btn-outline mt-8">
            <InstagramIcon size={16} /> Открыть Instagram
          </a>
        </Reveal>
      </div>
    </section>
  )
}
