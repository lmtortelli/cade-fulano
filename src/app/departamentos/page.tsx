'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, Edit2, Trash2, Users } from 'lucide-react'
import { DepartamentoModal, ConfirmModal } from '@/components/modals'

interface Departamento {
  id: string
  nome: string
  sigla: string | null
  limiteAusencias: number
  ativo: boolean
  _count?: {
    colaboradores: number
  }
}

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedDepartamento, setSelectedDepartamento] = useState<Departamento | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchDepartamentos()
  }, [])

  const fetchDepartamentos = async () => {
    try {
      const response = await fetch('/api/departamentos')
      if (response.ok) {
        const data = await response.json()
        setDepartamentos(data)
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (departamento: Departamento) => {
    setSelectedDepartamento(departamento)
    setModalOpen(true)
  }

  const handleDelete = (departamento: Departamento) => {
    setSelectedDepartamento(departamento)
    setConfirmModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedDepartamento) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/departamentos/${selectedDepartamento.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir departamento')
        return
      }

      fetchDepartamentos()
      setConfirmModalOpen(false)
      setSelectedDepartamento(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir departamento')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredDepartamentos = departamentos.filter(d => 
    d.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (d.sigla && d.sigla.toLowerCase().includes(busca.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
          <p className="text-gray-500 mt-1">Gerencie os departamentos da empresa</p>
        </div>
        <Button onClick={() => { setSelectedDepartamento(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Departamento
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou sigla..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartamentos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {busca ? 'Nenhum departamento encontrado' : 'Nenhum departamento cadastrado'}
          </div>
        ) : (
          filteredDepartamentos.map((departamento) => (
            <Card key={departamento.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{departamento.nome}</CardTitle>
                      {departamento.sigla && (
                        <p className="text-sm text-gray-500">{departamento.sigla}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Colaboradores</span>
                    </div>
                    <span className="font-medium">{departamento._count?.colaboradores || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Limite de ausências</span>
                    <span className="font-medium">{departamento.limiteAusencias}</span>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(departamento)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(departamento)}
                      disabled={(departamento._count?.colaboradores || 0) > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {(departamento._count?.colaboradores || 0) > 0 && (
                    <p className="text-xs text-gray-400 text-center">
                      Não é possível excluir departamentos com colaboradores
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <DepartamentoModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedDepartamento(null); }}
        onSuccess={fetchDepartamentos}
        departamento={selectedDepartamento}
      />

      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setSelectedDepartamento(null); }}
        onConfirm={confirmDelete}
        title="Excluir Departamento"
        description={`Tem certeza que deseja excluir o departamento "${selectedDepartamento?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        loading={deleteLoading}
      />
    </div>
  )
}
