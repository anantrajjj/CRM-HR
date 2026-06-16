'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  code: string
  category_id: string
  description: string
  unit_price: number
  currency_id: string
  tax_rate_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  product_categories?: { name: string }
  currencies?: { name: string; code: string; symbol: string }
}

interface ProductCategory {
  id: string
  name: string
  code: string
}

interface Currency {
  id: string
  name: string
  code: string
  symbol: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    description: '',
    unit_price: '',
    currency_id: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchCurrencies()
  }, [])

  const fetchProducts = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, product_categories(name), currencies(name, code, symbol)')
      .order('name')

    if (data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('product_categories')
      .select('id, name, code')
      .order('name')

    if (data) {
      setCategories(data)
    }
  }

  const fetchCurrencies = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('currencies')
      .select('id, name, code, symbol')
      .order('name')

    if (data) {
      setCurrencies(data)
    }
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        code: product.code,
        category_id: product.category_id || '',
        description: product.description || '',
        unit_price: product.unit_price?.toString() || '',
        currency_id: product.currency_id || '',
        is_active: product.is_active,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        code: '',
        category_id: '',
        description: '',
        unit_price: '',
        currency_id: '',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      code: '',
      category_id: '',
      description: '',
      unit_price: '',
      currency_id: '',
      is_active: true,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const record = {
      name: formData.name,
      code: formData.code,
      category_id: formData.category_id || null,
      description: formData.description || null,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
      currency_id: formData.currency_id || null,
      is_active: formData.is_active,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(record)
        .eq('id', editingProduct.id)

      if (!error) {
        await fetchProducts()
        handleCloseModal()
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(record)

      if (!error) {
        await fetchProducts()
        handleCloseModal()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchProducts()
    }
  }

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (item) => (
        <div>
          <p className="font-medium text-charcoal">{item.name}</p>
          <p className="text-xs text-pebble">{item.code}</p>
        </div>
      )
    },
    {
      key: 'product_categories',
      header: 'Category',
      render: (item) => item.product_categories?.name || <span className="text-pebble">-</span>
    },
    {
      key: 'unit_price',
      header: 'Price',
      render: (item) => item.unit_price ? (
        <span className="text-sm text-charcoal">
          {item.currencies?.symbol || '$'}{item.unit_price.toLocaleString()}
        </span>
      ) : <span className="text-pebble">-</span>
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const uniqueCategories = new Set(products.filter((p) => p.category_id).map((p) => p.category_id)).size

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="coda-heading-monument text-3xl text-charcoal">
              Products
            </h1>
            <p className="text-olive-slate mt-1">
              Manage your product catalog
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pebble" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coda-input pl-10"
                />
              </div>
              <Button variant="secondary">Filter</Button>
              <Button variant="secondary">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card pastelColor="mint">
            <CardContent>
              <p className="text-sm text-forest-depths">Total Products</p>
              <p className="text-2xl font-bold text-forest-depths">{products.length}</p>
            </CardContent>
          </Card>
          <Card pastelColor="sky">
            <CardContent>
              <p className="text-sm text-cobalt-ink">Active</p>
              <p className="text-2xl font-bold text-cobalt-ink">
                {products.filter((p) => p.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card pastelColor="lilac">
            <CardContent>
              <p className="text-sm text-plum-depth">Categories</p>
              <p className="text-2xl font-bold text-plum-depth">
                {uniqueCategories}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          emptyMessage="No products found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              placeholder="Widget Pro"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="SKU / Code"
              placeholder="WP-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
              placeholder="Select category..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Unit Price"
                type="number"
                placeholder="29.99"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
              <Select
                label="Currency"
                value={formData.currency_id}
                onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                options={currencies.map((cur) => ({ value: cur.id, label: `${cur.code} (${cur.symbol})` }))}
                placeholder="Select..."
              />
            </div>
          </div>
          <Textarea
            label="Description"
            placeholder="Product description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-charcoal">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
