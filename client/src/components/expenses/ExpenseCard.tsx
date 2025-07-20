import React from 'react';
import Link from 'next/link';
import { Expense } from '@/types';

interface ExpenseCardProps {
  expense: Expense;
  onApprove?: (id: number, approved: boolean) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
  currentUserId?: number;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onApprove,
  onEdit,
  onDelete,
  showActions = true,
  currentUserId
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (status === 'Approved') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  const canApprove = currentUserId !== expense.recorded_by && !expense.approved;
  const canEdit = currentUserId === expense.recorded_by && !expense.approved;
  const canDelete = currentUserId === expense.recorded_by;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link href={`/expenses/${expense.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            {expense.title}
          </Link>
          <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
        </div>
        <span className={getStatusBadge(expense.status)}>
          {expense.status}
        </span>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <span className="text-2xl font-bold text-gray-900">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Category</p>
          <p className="text-sm font-medium text-gray-900">{expense.category_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Department</p>
          <p className="text-sm font-medium text-gray-900">{expense.department_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Vendor</p>
          <p className="text-sm font-medium text-gray-900">{expense.vendor_name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(expense.incurred_on)}</p>
        </div>
      </div>

      {/* Payment Method & Invoice */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Payment: {expense.payment_method.replace('_', ' ')}</span>
        {expense.invoice_number && (
          <span>Invoice: {expense.invoice_number}</span>
        )}
      </div>

      {/* Recorded By */}
      <div className="text-sm text-gray-500 mb-4">
        Recorded by {expense.recorded_by_name} on {formatDate(expense.created_at)}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Link
            href={`/expenses/${expense.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            View Details
          </Link>
          
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(expense.id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}

          {canApprove && onApprove && (
            <button
              onClick={() => onApprove(expense.id, true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          )}

          {expense.approved && onApprove && (
            <button
              onClick={() => onApprove(expense.id, false)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              Disapprove
            </button>
          )}

          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this expense?')) {
                  onDelete(expense.id);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors ml-auto"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseCard; 