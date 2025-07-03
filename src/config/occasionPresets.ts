interface OccasionPreset {
  genres: string[]
  instruments: string[]
  customInstruments?: string[]
  singer: 'male' | 'female' | ''
  energy: 'low' | 'medium' | 'high' | ''
}

export const occasionPresets: Record<string, OccasionPreset> = {
  love: {
    genres: ['Indie Folk', 'Acoustic', 'Singer-Songwriter'],
    instruments: ['Piano'],
    customInstruments: ['Finger Picked Acoustic Guitar'],
    singer: 'male',
    energy: 'medium'
  },
  
  wedding: {
    genres: ['Acoustic', 'Folk', 'Singer-Songwriter'],
    instruments: ['Acoustic Guitar', 'Piano', 'Violin'],
    singer: '',
    energy: 'medium'
  },
  
  anniversary: {
    genres: ['R&B', 'Acoustic', 'Singer-Songwriter'],
    instruments: ['Piano', 'Acoustic Guitar'],
    singer: '',
    energy: 'medium'
  },
  
  birthday: {
    genres: ['Pop', 'Dance'],
    instruments: ['Piano', 'Guitar', 'Drums'],
    singer: '',
    energy: 'high'
  },
  
  graduation: {
    genres: ['Pop', 'Rock', 'Indie Rock'],
    instruments: ['Guitar', 'Piano', 'Drums'],
    singer: '',
    energy: 'high'
  },
  
  mothers_day: {
    genres: ['Acoustic', 'Folk', 'Singer-Songwriter'],
    instruments: ['Acoustic Guitar', 'Piano'],
    singer: '',
    energy: 'medium'
  },
  
  fathers_day: {
    genres: ['Rock', 'Country', 'Acoustic'],
    instruments: ['Guitar', 'Acoustic Guitar'],
    singer: '',
    energy: 'medium'
  },
  
  friendship: {
    genres: ['Pop', 'Indie Folk', 'Alternative'],
    instruments: ['Guitar', 'Piano', 'Drums'],
    singer: '',
    energy: 'medium'
  },
  
  funny: {
    genres: ['Pop', 'Alternative', 'Indie Rock'],
    instruments: ['Guitar', 'Piano', 'Drums'],
    singer: '',
    energy: 'high'
  },
  
  dedication: {
    genres: ['Acoustic', 'Singer-Songwriter', 'Folk'],
    instruments: ['Acoustic Guitar', 'Piano'],
    singer: '',
    energy: 'medium'
  },
  
  celebration: {
    genres: ['Pop', 'Dance', 'Hip-Hop'],
    instruments: ['Piano', 'Guitar', 'Drums', 'Synthesizer'],
    singer: '',
    energy: 'high'
  },
  
  // Custom songs have no presets
  custom: {
    genres: [],
    instruments: [],
    singer: '',
    energy: ''
  }
}

export function getOccasionPreset(songType: string): OccasionPreset | null {
  return occasionPresets[songType] || null
}

export function hasOccasionPreset(songType: string): boolean {
  return songType in occasionPresets && songType !== 'custom'
}