'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
import { Save, DollarSign, CreditCard, Calculator, Shield } from 'lucide-react';
import Link from 'next/link';

interface SalarySettings {
  default_payment_method: 'bank_transfer' | 'cash' | 'cheque' | 'mobile_money' | 'other';
  auto_calculate_allowances: boolean;
  auto_calculate_deductions: boolean;
  require_approval: boolean;
  default_currency: string;
  tax_rate: number;
  nssf_rate: number;
  nhif_rate: number;
  payment_reminder_days: number;
  auto_close_periods: boolean;
}

export default function SalarySettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState<SalarySettings>({
    default_payment_method: 'bank_transfer',
    auto_calculate_allowances: true,
    auto_calculate_deductions: true,
    require_approval: false,
    default_currency: 'UGX',
    tax_rate: 10,
    nssf_rate: 5,
    nhif_rate: 15000,
    payment_reminder_days: 3,
    auto_close_periods: false
  });
 
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // TODO: Fetch salary settings data
    // For now, using mock data
     
  }, [isAuthenticated, router]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save settings to backend
    setTimeout(() => {
      setSaving(false);
      // Show success message
    }, 1000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure salary management settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Settings */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Payment Settings</span>
            </CardTitle>
            <CardDescription>
              Configure default payment methods and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Payment Method
              </label>
              <select 
                value={settings.default_payment_method}
                onChange={(e) => setSettings({...settings, default_payment_method: e.target.value as 'bank_transfer' | 'cash' | 'cheque' | 'mobile_money' | 'other'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select 
                value={settings.default_currency}
                onChange={(e) => setSettings({...settings, default_currency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UGX">Ugandan Shilling (UGX)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                id="require_approval"
                checked={settings.require_approval}
                onChange={(e) => setSettings({...settings, require_approval: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="require_approval" className="text-sm text-gray-700">
                Require approval for salary payments
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Settings */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Calculation Settings</span>
            </CardTitle>
            <CardDescription>
              Configure automatic calculations and rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_calculate_allowances"
                checked={settings.auto_calculate_allowances}
                onChange={(e) => setSettings({...settings, auto_calculate_allowances: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto_calculate_allowances" className="text-sm text-gray-700">
                Automatically calculate allowances
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_calculate_deductions"
                checked={settings.auto_calculate_deductions}
                onChange={(e) => setSettings({...settings, auto_calculate_deductions: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto_calculate_deductions" className="text-sm text-gray-700">
                Automatically calculate deductions
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reminder (days before due)
              </label>
              <input
                type="number"
                value={settings.payment_reminder_days}
                onChange={(e) => setSettings({...settings, payment_reminder_days: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax and Deduction Rates */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Tax & Deduction Rates</span>
            </CardTitle>
            <CardDescription>
              Configure default tax and deduction rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAYE Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.tax_rate}
                onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NSSF Rate (%)
              </label>
              <input
                type="number"
                value={settings.nssf_rate}
                onChange={(e) => setSettings({...settings, nssf_rate: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NHIF Amount (UGX)
              </label>
              <input
                type="number"
                value={settings.nhif_rate}
                onChange={(e) => setSettings({...settings, nhif_rate: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Period Management */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              <span>Period Management</span>
            </CardTitle>
            <CardDescription>
              Configure salary period settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_close_periods"
                checked={settings.auto_close_periods}
                onChange={(e) => setSettings({...settings, auto_close_periods: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto_close_periods" className="text-sm text-gray-700">
                Automatically close salary periods
              </label>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Link href="/salary-management/periods">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Manage Salary Periods
                  </Button>
                </Link>
                <Link href="/salary-management/allowances">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Allowances
                  </Button>
                </Link>
                <Link href="/salary-management/deductions">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Deductions
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Settings Summary */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Current Settings Summary</CardTitle>
          <CardDescription>
            Overview of your current salary management configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Method</h4>
              <p className="text-blue-700">{settings.default_payment_method.replace('_', ' ')}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Currency</h4>
              <p className="text-green-700">{settings.default_currency}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Tax Rate</h4>
              <p className="text-purple-700">{settings.tax_rate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 