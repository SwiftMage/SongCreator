'use client'

import Link from 'next/link'

interface LogoProps {
  href?: string
  className?: string
}

export default function Logo({ href = '/', className = '' }: LogoProps) {
  return (
    <Link href={href} className={`songmint-logo ${className}`}>
      <div className="logo-icon">
        <div className="music-note">♪</div>
      </div>
      <div className="logo-text">SongMint</div>
      <div className="mini-waves">
        <div className="mini-wave"></div>
        <div className="mini-wave"></div>
        <div className="mini-wave"></div>
        <div className="mini-wave"></div>
        <div className="mini-wave"></div>
      </div>
    </Link>
  )
}