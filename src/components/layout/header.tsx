'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  subtitle?: string
  onSearch?: (term: string) => void
  onNewClick?: () => void
  newButtonLabel?: string
  showSearch?: boolean
  showNewButton?: boolean
}

export function Header({
  title,
  subtitle,
  onSearch,
  onNewClick,
  newButtonLabel = 'Nova Solicitação',
  showSearch = true,
  showNewButton = true,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch?.(value)
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        )}

        {showNewButton && (
          <Button onClick={onNewClick} className="gap-2">
            <Plus className="w-4 h-4" />
            {newButtonLabel}
          </Button>
        )}
      </div>
    </header>
  )
}
