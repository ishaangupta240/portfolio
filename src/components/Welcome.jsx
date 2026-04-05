import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const FONT_WEIGHT ={
    subtitle: {min:100, max:400, default:100},
    title: {min:400, max:900, default:400}
}

const renderText = (text, className, baseWeight = 400) => {
    return [...text].map((char, i) => (
        <span key={i} className={className} style={{ '--wght': baseWeight, fontVariationSettings: '"wght" var(--wght)' }}>
            {char === ' ' ? '\u00A0' : char}
        </span>
    ))
}

const setupTextHover = (container, type) => {
    if (!container) return

    const letters = Array.from(container.querySelectorAll('span'))
    const { min, max, default: defaultWeight } = FONT_WEIGHT[type]
    const sigma = type === 'subtitle' ? 98 : 78
    let containerLeft = 0

    const letterData = letters.map((letter) => {
        letter.style.setProperty('--wght', String(defaultWeight))

        return {
            letter,
            centerX: 0,
            isWhitespace: (letter.textContent || '').trim() === '',
            toWeight: gsap.quickTo(letter, '--wght', {
                duration: type === 'subtitle' ? 0.2 : 0.22,
                ease: 'power3.out',
            }),
        }
    })

    const recalcCenters = () => {
        const containerRect = container.getBoundingClientRect()
        containerLeft = containerRect.left

        letterData.forEach((entry) => {
            const rect = entry.letter.getBoundingClientRect()
            entry.centerX = rect.left - containerLeft + rect.width / 2
        })
    }

    recalcCenters()

    const handleMouseMove = (e) => {
        const mouseX = e.clientX - containerLeft

        letterData.forEach((entry) => {
            if (entry.isWhitespace) return

            const distance = Math.abs(mouseX - entry.centerX)
            const intensity = Math.exp(-(distance * distance) / (2 * sigma * sigma))
            entry.toWeight(min + (max - min) * intensity)
        })
    }

    const handleMouseLeave = () => {
        letterData.forEach((entry) => {
            if (entry.isWhitespace) return
            entry.toWeight(defaultWeight)
        })
    }

    const handleMouseEnter = () => {
        recalcCenters()
    }

    const handleResize = () => {
        recalcCenters()
    }

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    return () => {
        container.removeEventListener('mouseenter', handleMouseEnter)
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', handleMouseLeave)
        window.removeEventListener('resize', handleResize)
    }
}

const Welcome = () => {
    const titleRef = useRef(null)
    const subtitleRef = useRef(null)

    useGSAP(() => {
        const titleCleanup = setupTextHover(titleRef.current, 'title')
        const subtitleCleanup = setupTextHover(subtitleRef.current, 'subtitle')

        return () => {
            titleCleanup?.()
            subtitleCleanup?.()
        }
    }, [])

  return (
    <section id='welcome'>
        <p ref={subtitleRef}>
            {renderText("Developer • Designer • Creator", 'text-3xl font-georama', 100)}
        </p>
        <h1 ref={titleRef} className='mt-7'>
            {renderText("ishaan",'text-9xl italic font-georama')}
        </h1>

        <div className="small-screen">
            <p>This portfolio is designed for desktop/tablet screens only</p>
        </div>        
    </section>
  )
}

export default Welcome