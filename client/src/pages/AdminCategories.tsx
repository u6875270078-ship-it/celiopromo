import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import type { Category, InsertCategory } from '@shared/schema';

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: ''
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      return apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowAddForm(false);
      resetForm();
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      return apiRequest(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingId(null);
      resetForm();
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/categories/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '' });
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name
      if (field === 'name') {
        updated.slug = value
          .toLowerCase()
          .replace(/[àâäé]/g, 'a')
          .replace(/[èêë]/g, 'e')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestione Categorie</h1>
                <p className="text-gray-600">Gestisci le categorie del tuo Celio</p>
              </div>
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingId(null);
                  resetForm();
                }}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-add-category"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Categoria
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Add/Edit Form */}
            {(showAddForm || editingId) && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingId ? 'Modifica Categoria' : 'Nuova Categoria'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Categoria
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                        placeholder="Es: Abbigliamento Uomo"
                        required
                        data-testid="input-category-name"
                      />
                    </div>
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                        Slug (URL)
                      </label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('slug', e.target.value)}
                        placeholder="vetements-femme"
                        required
                        data-testid="input-category-slug"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descrizione
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                      placeholder="Descrizione della categoria..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      data-testid="input-category-description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-category"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? 'Modifica' : 'Aggiungi'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      data-testid="button-cancel-category"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annulla
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Categorie Esistenti</h3>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nessuna categoria trovata</p>
                  <p className="text-sm">Aggiungi la tua prima categoria per iniziare</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`category-card-${category.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg" data-testid={`text-category-name-${category.id}`}>
                            {category.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Slug:</span> {category.slug}
                          </p>
                          {category.description && (
                            <p className="text-gray-700" data-testid={`text-category-description-${category.id}`}>
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              category.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {category.isActive ? 'Attiva' : 'Inattiva'}
                            </span>
                            <span>Creata il {category.createdAt ? new Date(category.createdAt).toLocaleDateString('it-IT') : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Sei sicuro di voler eliminare la categoria "${category.name}"?`)) {
                                deleteMutation.mutate(category.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}