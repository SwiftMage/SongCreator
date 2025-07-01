'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { getBestAudioUrl } from '@/lib/audio-player'

interface VersionDownloadButtonProps {
  song: {
    id: string
    title: string
    audio_url?: string
    backup_audio_url?: string
  }
  className?: string
}

export default function VersionDownloadButton({ song, className = '' }: VersionDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const downloadVersion = async (version: 1 | 2) => {
    setIsOpen(false) // Close dropdown after selection
    
    try {
      console.log(`=== DOWNLOADING VERSION ${version} ===`)
      console.log('Song:', song)
      
      const url = version === 1 ? song.audio_url : song.backup_audio_url
      
      if (!url) {
        alert(`Version ${version} is not available for this song.`)
        return
      }

      // Verify URL is accessible
      const bestUrl = await getBestAudioUrl(url, undefined)
      if (!bestUrl) {
        alert(`Version ${version} is temporarily unavailable.`)
        return
      }

      // Create version-specific filename
      const cleanTitle = song.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
      const filename = `${cleanTitle}-v${version}.mp3`
      
      console.log('Download URL:', bestUrl)
      console.log('Filename:', filename)
      
      // Use API to proxy the download with custom filename
      const downloadUrl = `/api/download-song?url=${encodeURIComponent(bestUrl)}&filename=${encodeURIComponent(filename)}`
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error(`Error downloading version ${version}:`, error)
      alert(`Unable to download version ${version}. The file may be temporarily unavailable.`)
    }
  }

  // Check if we have both versions
  const hasVersion1 = !!song.audio_url
  const hasVersion2 = !!song.backup_audio_url
  const hasBothVersions = hasVersion1 && hasVersion2

  // If only one version exists, show simple button
  if (!hasBothVersions) {
    const versionNumber = hasVersion1 ? 1 : 2
    return (
      <button
        onClick={() => downloadVersion(versionNumber)}
        className={`p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors ${className}`}
        title={`Download Version ${versionNumber} (MP3 + FLAC)`}
      >
        <Download className="h-5 w-5" />
      </button>
    )
  }

  // Split button for two versions
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex">
        {/* Main download button (Version 1) */}
        <button
          onClick={() => downloadVersion(1)}
          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-l-lg transition-colors border-r border-blue-200 dark:border-blue-700"
          title="Download Version 1 (MP3 + FLAC)"
        >
          <Download className="h-5 w-5" />
        </button>
        
        {/* Dropdown toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-r-lg transition-colors"
          title="Download other versions"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <button
            onClick={() => downloadVersion(1)}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors flex items-center gap-2"
            title="Download Version 1 (MP3 + FLAC)"
          >
            <Download className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Version 1</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">MP3 + FLAC</span>
            </div>
          </button>
          <button
            onClick={() => downloadVersion(2)}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors flex items-center gap-2"
            title="Download Version 2 (MP3 + FLAC)"
          >
            <Download className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Version 2</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">MP3 + FLAC</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}