/**
 * Utility functions for audio playback with fallback support
 */

/**
 * Check if an audio URL is accessible
 */
async function isAudioUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Allow checking external URLs
    })
    return response.ok
  } catch {
    // If HEAD request fails, try to create an audio element as fallback
    return new Promise((resolve) => {
      const audio = new Audio()
      let resolved = false
      
      const cleanup = () => {
        audio.src = ''
        audio.onloadedmetadata = null
        audio.onerror = null
      }
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          cleanup()
          resolve(false)
        }
      }, 5000) // 5 second timeout
      
      audio.onloadedmetadata = () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          cleanup()
          resolve(true)
        }
      }
      
      audio.onerror = () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          cleanup()
          resolve(false)
        }
      }
      
      audio.src = url
    })
  }
}

/**
 * Get the best available audio URL with fallback support
 */
export async function getBestAudioUrl(
  primaryUrl: string | null | undefined,
  backupUrl: string | null | undefined
): Promise<string | null> {
  // If no URLs available, return null
  if (!primaryUrl && !backupUrl) {
    return null
  }
  
  // If only one URL is available, return it
  if (primaryUrl && !backupUrl) {
    return primaryUrl
  }
  
  if (!primaryUrl && backupUrl) {
    return backupUrl
  }
  
  // Both URLs available - check primary first
  if (primaryUrl) {
    try {
      const isPrimaryAccessible = await isAudioUrlAccessible(primaryUrl)
      if (isPrimaryAccessible) {
        console.log('Using primary audio URL:', primaryUrl)
        return primaryUrl
      }
    } catch (error) {
      console.warn('Error checking primary audio URL:', error)
    }
  }
  
  // If primary fails or is not accessible, try backup
  if (backupUrl) {
    try {
      const isBackupAccessible = await isAudioUrlAccessible(backupUrl)
      if (isBackupAccessible) {
        console.log('Using backup audio URL:', backupUrl)
        return backupUrl
      }
    } catch (error) {
      console.warn('Error checking backup audio URL:', error)
    }
  }
  
  // If both fail, return primary URL as last resort (let the audio element handle the error)
  console.warn('Both primary and backup URLs failed accessibility check, returning primary as fallback')
  return primaryUrl || backupUrl || null
}

/**
 * Play audio with automatic fallback
 */
export async function playAudioWithFallback(
  primaryUrl: string | null | undefined,
  backupUrl: string | null | undefined
): Promise<HTMLAudioElement | null> {
  const bestUrl = await getBestAudioUrl(primaryUrl, backupUrl)
  
  if (!bestUrl) {
    console.error('No audio URL available for playback')
    return null
  }
  
  try {
    const audio = new Audio(bestUrl)
    await audio.play()
    return audio
  } catch (error) {
    console.error('Error playing audio:', error)
    
    // If primary URL failed and we have a backup, try the backup
    if (bestUrl === primaryUrl && backupUrl && backupUrl !== primaryUrl) {
      try {
        console.log('Primary audio failed, trying backup URL')
        const backupAudio = new Audio(backupUrl)
        await backupAudio.play()
        return backupAudio
      } catch (backupError) {
        console.error('Backup audio also failed:', backupError)
      }
    }
    
    return null
  }
}

/**
 * Create audio element with fallback support
 */
export function createAudioElementWithFallback(
  primaryUrl: string | null | undefined,
  backupUrl: string | null | undefined,
  onError?: (error: Event) => void
): HTMLAudioElement | null {
  const bestUrl = primaryUrl || backupUrl
  
  if (!bestUrl) {
    return null
  }
  
  const audio = new Audio(bestUrl)
  
  // Add error handling with fallback
  audio.addEventListener('error', (error) => {
    console.error('Audio error:', error)
    
    // If primary URL failed and we have a backup, try the backup
    if (audio.src === primaryUrl && backupUrl && backupUrl !== primaryUrl) {
      console.log('Audio failed, trying backup URL')
      audio.src = backupUrl
    } else if (onError) {
      onError(error)
    }
  })
  
  return audio
}