import React from 'react';
import { format } from 'date-fns';
import { Expense } from '@/types';

interface ExpenseTableProps {
  expenses: Expense[];
  onApprove: (id: number, approved: boolean) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  currentUserId?: number;
  userType?: string;
  loading?: boolean;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onApprove,
  onEdit,
  onDelete,
  currentUserId,
  userType,
  loading = false,
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
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodColors: Record<string, string> = {
      cash: 'bg-gray-100 text-gray-800',
      bank_transfer: 'bg-blue-100 text-blue-800',
      cheque: 'bg-purple-100 text-purple-800',
      mobile_money: 'bg-green-100 text-green-800',
      credit_card: 'bg-indigo-100 text-indigo-800',
      other: 'bg-orange-100 text-orange-800',
    };

    const color = methodColors[method] || methodColors.other;
    const label = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expense
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900">
                    {expense.title}
                  </div>
                  {expense.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {expense.description}
                    </div>
                  )}
                  {expense.invoice_number && (
                    <div className="text-xs text-gray-400">
                      Invoice: {expense.invoice_number}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(expense.amount)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {expense.category_name || 'Unknown'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {expense.department_name || 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {formatDate(expense.incurred_on)}
                </div>
              </td>
              <td className="px-6 py-4">
                {getPaymentMethodBadge(expense.payment_method)}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(expense.approved)}
              </td>
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex items-center space-x-2">
                  {/* View/Edit button */}
                  <button
                    onClick={() => onEdit(expense.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>

                  {/* Approve/Disapprove button - Only for school owners */}
                  {userType === 'school_owner' && !expense.approved && (
                    <button
                      onClick={() => onApprove(expense.id, true)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                  )}

                  {userType === 'school_owner' && expense.approved && (
                    <button
                      onClick={() => onApprove(expense.id, false)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Disapprove
                    </button>
                  )}

                  {/* Delete button */}
                  {(userType === 'school_owner' || (!expense.approved && expense.recorded_by === currentUserId)) && (
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 