
import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Trash2, Package, Tag, Clock, Scissors, StickyNote } from 'lucide-react';

interface Props {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => void;
  onDelete: (id: string) => void;
}

const CatalogManager: React.FC<Props> = ({ products, onAdd, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    priceRetail: 0,
    priceWholesale: 0,
    material: '',
    deliveryTime: '',
    wholesaleDiscount: '',
    additionalConsiderations: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const productData: Omit<Product, 'id'> = {
      name: formData.name.toUpperCase(),
      priceRetail: formData.priceRetail,
      priceWholesale: formData.priceWholesale,
      material: formData.material.toUpperCase(),
      description: `Tiempo de entrega: ${formData.deliveryTime}. Mayoreo: ${formData.wholesaleDiscount}`,
      additionalConsiderations: formData.additionalConsiderations.toUpperCase(),
      stock: 0,
      category: 'producto',
      storeId: 'global'
    };
    
    onAdd(productData);
    setFormData({ 
      name: '', 
      priceRetail: 0, 
      priceWholesale: 0, 
      material: '', 
      deliveryTime: '', 
      wholesaleDiscount: '',
      additionalConsiderations: ''
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catálogo de Productos</h2>
          <p className="text-gray-500">Alimenta al asistente con tus productos y precios.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus size={20} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Nombre del Producto</label>
              <input
                required
                type="text"
                placeholder="Ej: Camisa de Lino"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Precio Detal ($)</label>
              <input
                required
                type="number"
                placeholder="0.00"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.priceRetail}
                onChange={e => setFormData({...formData, priceRetail: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Precio Mayor ($)</label>
              <input
                required
                type="number"
                placeholder="0.00"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.priceWholesale}
                onChange={e => setFormData({...formData, priceWholesale: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Tipo de Tela</label>
              <input
                type="text"
                placeholder="Ej: Algodón 100%, Seda, Lino"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                value={formData.material}
                onChange={e => setFormData({...formData, material: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Tiempo de Entrega</label>
              <input
                type="text"
                placeholder="Ej: 3-5 días hábiles"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                value={formData.deliveryTime}
                onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Consideraciones Adicionales</label>
              <input
                type="text"
                placeholder="Notas especiales o restricciones"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                value={formData.additionalConsiderations}
                onChange={e => setFormData({...formData, additionalConsiderations: e.target.value})}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Descuento Mayorista</label>
              <input
                type="text"
                placeholder="Ej: 20% en compras mayores a 12 unidades"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                value={formData.wholesaleDiscount}
                onChange={e => setFormData({...formData, wholesaleDiscount: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tu catálogo está vacío</h3>
          <p className="text-gray-500">Agrega productos para que la IA sepa qué responder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative italic">
              <button
                onClick={() => onDelete(product.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex items-start gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <Package size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 uppercase">{product.name}</h3>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag size={14} className="text-gray-400" />
                      <span className="font-medium text-emerald-700">Detal: ${product.priceRetail.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag size={14} className="text-gray-400" />
                      <span className="font-medium text-emerald-700">Mayor: ${product.priceWholesale.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Scissors size={14} className="text-gray-400" />
                      <span className="uppercase">{product.material || 'N/A'}</span>
                    </div>
                  </div>
                  {(product.description || product.additionalConsiderations) && (
                    <div className="mt-3 space-y-2">
                      {product.description && (
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Detalles</p>
                          <p className="text-xs text-emerald-800 uppercase">{product.description}</p>
                        </div>
                      )}
                      {product.additionalConsiderations && (
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-400 uppercase mb-1 flex items-center gap-1">
                            <StickyNote size={10} /> Notas
                          </p>
                          <p className="text-xs text-blue-800 uppercase">{product.additionalConsiderations}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogManager;
