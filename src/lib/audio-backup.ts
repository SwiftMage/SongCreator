import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create Supabase client with service role key for backend operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Check if audio backup is enabled
 * Only enable in production mode when explicitly set
 */
export function isAudioBackupEnabled(): boolean {
  const isEnabled = process.env.ENABLE_AUDIO_BACKUP === 'true'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // For now, allow backup in development for testing (remove this in production)
  const allowInDev = process.env.ENABLE_AUDIO_BACKUP === 'true'
  
  const enabled = isEnabled && (isProduction || allowInDev)
  
  console.log(`Audio backup status: enabled=${isEnabled}, production=${isProduction}, result=${enabled}`)
  
  return enabled
}

/**
 * Download audio file from URL and return as buffer
 */
async function downloadAudioFile(url: string): Promise<Buffer> {
  console.log('Downloading audio file from:', url)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'SongCreator/1.0'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.status} ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Upload audio buffer to Supabase Storage
 */
async function uploadToSupabaseStorage(
  buffer: Buffer, 
  fileName: string, 
  contentType: string = 'audio/mpeg'
): Promise<string> {
  console.log('Uploading audio file to Supabase Storage:', fileName)
  
  const { data, error } = await supabaseAdmin.storage
    .from('audio-backups')
    .upload(fileName, buffer, {
      contentType,
      upsert: false
    })
  
  if (error) {
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`)
  }
  
  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from('audio-backups')
    .getPublicUrl(data.path)
  
  return publicUrlData.publicUrl
}

/**
 * Extract file extension from URL
 */
function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    
    // Common audio file extensions
    if (pathname.includes('.mp3')) return 'mp3'
    if (pathname.includes('.flac')) return 'flac'
    if (pathname.includes('.wav')) return 'wav'
    if (pathname.includes('.m4a')) return 'm4a'
    
    // Default to mp3 if we can't determine
    return 'mp3'
  } catch {
    return 'mp3'
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg'
    case 'flac':
      return 'audio/flac'
    case 'wav':
      return 'audio/wav'
    case 'm4a':
      return 'audio/mp4'
    default:
      return 'audio/mpeg'
  }
}

/**
 * Backup a single audio file from Mureka to Supabase Storage
 */
export async function backupAudioFile(
  audioUrl: string, 
  songId: string, 
  variationIndex: number = 0
): Promise<string> {
  if (!isAudioBackupEnabled()) {
    console.log('Audio backup is disabled, skipping backup')
    throw new Error('Audio backup is not enabled')
  }
  
  const startTime = Date.now()
  
  try {
    console.log(`Starting backup for song ${songId}, variation ${variationIndex}, URL: ${audioUrl}`)
    
    // Validate inputs
    if (!audioUrl || !songId) {
      throw new Error('Invalid parameters: audioUrl and songId are required')
    }
    
    // Download the audio file
    console.log(`Downloading audio file from: ${audioUrl}`)
    const audioBuffer = await downloadAudioFile(audioUrl)
    console.log(`Downloaded ${audioBuffer.length} bytes`)
    
    // Generate unique filename
    const extension = getFileExtension(audioUrl)
    const fileName = `songs/${songId}/variation-${variationIndex}.${extension}`
    const contentType = getContentType(extension)
    
    console.log(`Uploading to: ${fileName} (${contentType})`)
    
    // Upload to Supabase Storage
    const backupUrl = await uploadToSupabaseStorage(audioBuffer, fileName, contentType)
    
    const duration = Date.now() - startTime
    console.log(`Successfully backed up audio file in ${duration}ms: ${backupUrl}`)
    return backupUrl
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Error during audio backup after ${duration}ms:`, {
      error: error instanceof Error ? error.message : error,
      songId,
      variationIndex,
      audioUrl
    })
    throw error
  }
}

/**
 * Backup all audio variations for a song
 */
export async function backupSongAudioVariations(
  audioVariations: Array<{
    index: number
    url: string
    flacUrl: string
    duration: number
  }>,
  songId: string
): Promise<{
  primaryBackupUrl: string | null
  backupVariations: Array<{
    index: number
    backupUrl: string
    originalUrl: string
  }>
}> {
  if (!isAudioBackupEnabled()) {
    console.log('Audio backup is disabled, skipping backup')
    return {
      primaryBackupUrl: null,
      backupVariations: []
    }
  }
  
  const backupVariations: Array<{
    index: number
    backupUrl: string
    originalUrl: string
  }> = []
  
  let primaryBackupUrl: string | null = null
  
  try {
    console.log(`Starting backup for song ${songId} with ${audioVariations.length} variations`)
    
    // Backup each variation
    for (const variation of audioVariations) {
      try {
        const backupUrl = await backupAudioFile(variation.url, songId, variation.index)
        
        backupVariations.push({
          index: variation.index,
          backupUrl,
          originalUrl: variation.url
        })
        
        // Use first variation as primary backup URL
        if (variation.index === 0) {
          primaryBackupUrl = backupUrl
        }
        
        console.log(`Successfully backed up variation ${variation.index}`)
        
      } catch (error) {
        console.error(`Failed to backup variation ${variation.index}:`, error)
        // Continue with other variations even if one fails
      }
    }
    
    console.log(`Completed backup for song ${songId}. Backed up ${backupVariations.length}/${audioVariations.length} variations`)
    
    return {
      primaryBackupUrl,
      backupVariations
    }
    
  } catch (error) {
    console.error('Error during song audio backup:', error)
    return {
      primaryBackupUrl: null,
      backupVariations: []
    }
  }
}

/**
 * Create the audio-backups storage bucket if it doesn't exist
 */
export async function ensureAudioBackupBucket(): Promise<void> {
  if (!isAudioBackupEnabled()) {
    return
  }
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing storage buckets:', listError)
      return
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'audio-backups')
    
    if (!bucketExists) {
      console.log('Creating audio-backups storage bucket')
      
      const { error: createError } = await supabaseAdmin.storage.createBucket('audio-backups', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit per file
        allowedMimeTypes: ['audio/mpeg', 'audio/flac', 'audio/wav', 'audio/mp4']
      })
      
      if (createError) {
        console.error('Error creating storage bucket:', createError)
        throw createError
      }
      
      console.log('Successfully created audio-backups storage bucket')
    } else {
      console.log('audio-backups storage bucket already exists')
    }
    
  } catch (error) {
    console.error('Error ensuring audio backup bucket:', error)
    throw error
  }
}