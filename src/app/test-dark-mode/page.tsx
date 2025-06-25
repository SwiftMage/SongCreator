'use client'

import DarkModeToggle from '@/components/DarkModeToggle'
import { useTheme } from '@/context/ThemeContext'

export default function TestDarkMode() {
  const { isDarkMode } = useTheme()
  
  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Dark Mode Test Page
          </h1>
          <DarkModeToggle />
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-800 dark:text-gray-200">
            Current mode: <strong>{isDarkMode ? 'Dark' : 'Light'}</strong>
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Card 1</h2>
              <p className="text-gray-700 dark:text-gray-300">This should change color in dark mode</p>
            </div>
            
            <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Card 2</h2>
              <p className="text-gray-700 dark:text-gray-300">This should also change color</p>
            </div>
          </div>
          
          <div className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              Border color should change in dark mode
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}