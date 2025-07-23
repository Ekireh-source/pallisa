import React, { useState } from 'react';
import Image from 'next/image';
import { ExpenseCreateUpdate, ExpenseCategory, Department, Vendor, Term } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ExpenseFormProps {
  initialData?: Partial<ExpenseCreateUpdate>;
  categories: ExpenseCategory[];
  departments: Department[];
  vendors: Vendor[];
  terms: Term[];
  initialTerm?: number;
  onSubmit: (data: ExpenseCreateUpdate) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  categories,
  departments,
  vendors,
  terms,
  initialTerm,
  onSubmit,
  onCancel,
  loading = false,
  error,
  fieldErrors = {}
}) => {
  const [formData, setFormData] = useState<ExpenseCreateUpdate>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    category: initialData?.category || 0,
    department: initialData?.department || undefined,
    vendor: initialData?.vendor || undefined,
    term: initialData?.term || initialTerm,
    incurred_on: initialData?.incurred_on || new Date().toISOString().split('T')[0],
    receipt_image: undefined,
    invoice_number: initialData?.invoice_number || '',
    payment_method: initialData?.payment_method || 'cash'
  });

  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : 
               (name === 'category' || name === 'department' || name === 'vendor' || name === 'term') && value ? 
               parseInt(value) : value === '' ? undefined : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        receipt_image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter expense title"
            required
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter expense description"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">UGX</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
              required
            />
          </div>
          {fieldErrors.amount && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.category ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
          )}
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            id="department"
            name="department"
            value={formData.department || ''}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.department ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a department</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {fieldErrors.department && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.department}</p>
          )}
        </div>

        {/* Vendor */}
        <div>
          <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
            Vendor
          </label>
          <select
            id="vendor"
            name="vendor"
            value={formData.vendor || ''}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.vendor ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a vendor</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          {fieldErrors.vendor && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.vendor}</p>
          )}
        </div>

        {/* Term */}
        <div>
          <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
            Academic Term
          </label>
          <select
            id="term"
            name="term"
            value={formData.term || ''}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.term ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a term</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.name} ({term.academic_year_name || 'Unknown Year'})
              </option>
            ))}
          </select>
          {fieldErrors.term && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.term}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="incurred_on" className="block text-sm font-medium text-gray-700 mb-2">
            Date Incurred *
          </label>
          <input
            type="date"
            id="incurred_on"
            name="incurred_on"
            value={formData.incurred_on}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.incurred_on ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.incurred_on && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.incurred_on}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.payment_method ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {fieldErrors.payment_method && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.payment_method}</p>
          )}
        </div>

        {/* Invoice Number */}
        <div>
          <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Number
          </label>
          <input
            type="text"
            id="invoice_number"
            name="invoice_number"
            value={formData.invoice_number}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.invoice_number ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter invoice number"
          />
          {fieldErrors.invoice_number && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.invoice_number}</p>
          )}
        </div>

        {/* Receipt Upload */}
        <div>
          <label htmlFor="receipt_image" className="block text-sm font-medium text-gray-700 mb-2">
            Receipt/Invoice Image
          </label>
          <input
            type="file"
            id="receipt_image"
            name="receipt_image"
            onChange={handleFileChange}
            accept="image/*"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.receipt_image ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {fieldErrors.receipt_image && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.receipt_image}</p>
          )}
          
          {/* Receipt Preview */}
          {receiptPreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <Image
                src={receiptPreview}
                alt="Receipt preview"
                width={100}
                height={100}
                className="max-w-xs max-h-48 rounded-md border border-gray-300"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>{initialData ? 'Update Expense' : 'Create Expense'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm; 