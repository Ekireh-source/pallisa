import React from 'react';
import { format } from 'date-fns';
import { Expense } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';

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
      <Badge className="bg-green-100 text-green-800 border-0">
        Approved
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 border-0">
        Pending
      </Badge>
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
      <Badge className={`${color} border-0`}>
        {label}
      </Badge>
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

  // Mobile Card View
  const MobileExpenseCard = ({ expense }: { expense: Expense }) => (
    <Card className="mb-4 shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {expense.title}
              </h3>
              {expense.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {expense.description}
                </p>
              )}
              {expense.invoice_number && (
                <p className="text-xs text-gray-400 mt-1">
                  Invoice: {expense.invoice_number}
                </p>
              )}
            </div>
            <div className="ml-3 flex-shrink-0">
              {getStatusBadge(expense.approved)}
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Amount:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(expense.amount)}
            </span>
          </div>

          {/* Category and Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Category:</span>
              <p className="text-sm text-gray-900">
                {expense.category_name || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Department:</span>
              <p className="text-sm text-gray-900">
                {expense.department_name || 'N/A'}
              </p>
            </div>
          </div>

          {/* Date and Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500">Date:</span>
              <p className="text-sm text-gray-900">
                {formatDate(expense.incurred_on)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Payment:</span>
              <div className="mt-1">
                {getPaymentMethodBadge(expense.payment_method)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(expense.id)}
              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            {/* Approve/Disapprove button - Only for school owners */}
            {userType === 'school_owner' && !expense.approved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onApprove(expense.id, true)}
                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="sr-only">Approve</span>
              </Button>
            )}

            {userType === 'school_owner' && expense.approved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onApprove(expense.id, false)}
                className="h-8 px-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Disapprove</span>
              </Button>
            )}

            {/* Delete button */}
            {(userType === 'school_owner' || (!expense.approved && expense.recorded_by === currentUserId)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(expense.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Mobile View */}
      <div className="block sm:hidden">
        <div className="p-4">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-sm text-gray-600">No expenses match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <MobileExpenseCard key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(expense.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Button>

                    {/* Approve/Disapprove button - Only for school owners */}
                    {userType === 'school_owner' && !expense.approved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(expense.id, true)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </Button>
                    )}

                    {userType === 'school_owner' && expense.approved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(expense.id, false)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Disapprove
                      </Button>
                    )}

                    {/* Delete button */}
                    {(userType === 'school_owner' || (!expense.approved && expense.recorded_by === currentUserId)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 