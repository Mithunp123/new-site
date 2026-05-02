import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Wallet, ArrowDownRight, Plus } from 'lucide-react';
import BrandLayout from '../components/layout/BrandLayout';
import * as brandApi from '../api/brandApi';

export default function BrandPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await brandApi.getBrandPayments();
      setPayments(res.data.payments || []);
      setEscrowBalance(res.data.escrow_balance || 0);
      setTotalSpent(res.data.total_spent || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFundEscrow = async () => {
    if (!fundAmount || isNaN(fundAmount)) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      await brandApi.fundEscrow(parseFloat(fundAmount));
      setFundAmount('');
      setShowFundModal(false);
      fetchPayments();
      alert('Escrow funded successfully!');
    } catch (err) {
      console.error('Failed to fund escrow:', err);
      alert('Failed to fund escrow');
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </motion.div>
  );

  return (
    <BrandLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Payments & Escrow</h1>
            <p className="text-slate-600">Manage your campaign budget and payments</p>
          </div>
          <button
            onClick={() => setShowFundModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus size={20} />
            Fund Escrow
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Wallet}
            title="Escrow Balance"
            value={`₹${escrowBalance.toLocaleString()}`}
            subtitle="Available to spend"
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Spent"
            value={`₹${totalSpent.toLocaleString()}`}
            subtitle="Across all campaigns"
            color="bg-blue-500"
          />
          <StatCard
            icon={CreditCard}
            title="Payment Method"
            value="Bank Transfer"
            subtitle="Primary payment method"
            color="bg-purple-500"
          />
        </div>

        {/* Fund Modal */}
        {showFundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">Fund Escrow</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFundEscrow}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  Fund Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No payments yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Creator</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Campaign</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{payment.creator_name}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{payment.campaign_title}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </BrandLayout>
  );
}
