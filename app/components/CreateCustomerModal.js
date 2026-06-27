import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, Calendar, Users, Award } from 'lucide-react-native';
import ApiService from './ApiServices';

const CreateCustomerModal = ({ isOpen, onClose, onSuccess }) => {
  // Step 1: User Registration
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: 'Password@123',
  });

  // Step 2: Plan & Subscription
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subscription, setSubscription] = useState({
    start_date: '',
    end_date: '',
    purchased_user_count: 1,
    total_price: 0,
  });
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Step 3: Employees
  const [employee, setEmployee] = useState({
    name: '',
    email: '',
    mobile: '',
    password: 'Password@123',
  });
  const [employees, setEmployees] = useState([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Register, 2: Subscribe, 3: Employees
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [error, setError] = useState('');

  // Fetch plans on mount
  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      setSubscription(prev => ({ ...prev, start_date: today }));
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await ApiService.get('9023/api/plans/', null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.success) {
        setPlans(response.plans);
        if (response.plans.length > 0) {
          setSelectedPlanId(response.plans[0].id);
          handlePlanSelect(response.plans[0]);
        }
      } else {
        setError('Failed to load plans');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error loading plans');
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSelectedPlanId(plan.id);
    // Auto-calculate end_date
    const start = subscription.start_date ? new Date(subscription.start_date) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days);
    setSubscription(prev => ({
      ...prev,
      end_date: end.toISOString().split('T')[0],
      purchased_user_count: plan.NOU || 1,
      total_price: parseFloat(plan.price) * (plan.NOU || 1),
    }));
  };

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    if (section === 'user') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (section === 'subscription') {
      setSubscription(prev => ({ ...prev, [name]: value }));
      // If start_date changes, recalc end_date
      if (name === 'start_date' && selectedPlan) {
        const start = new Date(value);
        const end = new Date(start);
        end.setDate(end.getDate() + selectedPlan.duration_days);
        setSubscription(prev => ({
          ...prev,
          end_date: end.toISOString().split('T')[0],
        }));
      }
      // If purchased_user_count changes, recalc total_price
      if (name === 'purchased_user_count' && selectedPlan) {
        const count = parseInt(value) || 0;
        setSubscription(prev => ({
          ...prev,
          total_price: parseFloat(selectedPlan.price) * count,
        }));
      }
    } else if (section === 'employee') {
      setEmployee(prev => ({ ...prev, [name]: value }));
    }
  };

  // Step 1: Register User
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await ApiService.post('register', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.success) {
        setRegisteredUserId(response.userId);
        setStep(2);
      } else {
        setError(response?.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err?.response?.data?.message || 'Server error during registration');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create Subscription
  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!registeredUserId) {
      setError('User not registered yet');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        user_id: registeredUserId,
        plan: selectedPlan?.name,
        plan_id: selectedPlanId,
        total_price: subscription.total_price,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_active: true,
        is_cancelled: false,
        purchased_user_count: subscription.purchased_user_count,
        cancellation_reason: null,
      };
      const token = localStorage.getItem('accessToken');
      const response = await ApiService.post('api/subscriptions/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.success || response?.subscription) {
        setSubscriptionData(response.subscription);
        setStep(3);
        // Optionally call onSuccess to refresh parent list
        if (onSuccess) onSuccess();
      } else {
        setError(response?.message || 'Subscription creation failed');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err?.response?.data?.message || 'Server error during subscription');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!registeredUserId) {
      setError('No owner found');
      return;
    }
    setIsAddingEmployee(true);
    setError('');
    try {
      const payload = {
        ...employee,
        role: 'employee',
        owner_user_id: registeredUserId,
      };
      const token = localStorage.getItem('accessToken');
      const response = await ApiService.post('register', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.success) {
        // Add to local list
        setEmployees(prev => [...prev, { ...employee, id: response.userId }]);
        // Reset employee form
        setEmployee({ name: '', email: '', mobile: '', password: 'Password@123' });
      } else {
        setError(response?.message || 'Failed to add employee');
      }
    } catch (err) {
      console.error('Add employee error:', err);
      setError(err?.response?.data?.message || 'Server error adding employee');
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const removeEmployee = (index) => {
    setEmployees(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    // Reset state
    setFormData({ name: '', email: '', mobile: '', password: 'Password@123' });
    setSubscription({ start_date: '', end_date: '', purchased_user_count: 1, total_price: 0 });
    setEmployees([]);
    setEmployee({ name: '', email: '', mobile: '', password: 'Password@123' });
    setStep(1);
    setRegisteredUserId(null);
    setSubscriptionData(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 1 && 'Create Customer with Subscription'}
              {step === 2 && 'Select Plan & Subscribe'}
              {step === 3 && 'Subscription Complete – Add Employees (Optional)'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Register User */}
          {step === 1 && (
            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange(e, 'user')}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange(e, 'user')}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange(e, 'user')}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange(e, 'user')}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Register & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Choose Plan & Subscribe */}
          {step === 2 && (
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan *</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    const plan = plans.find(p => p.id === parseInt(e.target.value));
                    if (plan) handlePlanSelect(plan);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price} / {plan.duration_days} days (NOU: {plan.NOU})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlan && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600"><strong>Description:</strong> {selectedPlan.description}</p>
                  <p className="text-sm text-gray-600"><strong>Features:</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedPlan.points?.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="start_date"
                      value={subscription.start_date}
                      onChange={(e) => handleInputChange(e, 'subscription')}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (auto-calculated)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="end_date"
                      value={subscription.end_date}
                      readOnly
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Users (NOU)</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="purchased_user_count"
                      value={subscription.purchased_user_count}
                      onChange={(e) => handleInputChange(e, 'subscription')}
                      min="1"
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Default from plan: {selectedPlan?.NOU}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (₹)</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="total_price"
                      value={subscription.total_price}
                      readOnly
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Calculated as plan price × NOU</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Subscribing...' : 'Subscribe & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Add Employees (Optional) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-700 font-medium">✅ Subscription created successfully!</p>
                <p className="text-sm text-gray-600 mt-1">
                  Owner: {subscriptionData?.user?.name} (ID: {registeredUserId})
                </p>
                <p className="text-sm text-gray-600">
                  Plan: {subscriptionData?.planDetails?.name}, Valid until {subscriptionData?.end_date}
                </p>
              </div>

              {/* Employee Addition */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Add Employees to this Owner</h4>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={employee.name}
                        onChange={(e) => handleInputChange(e, 'employee')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={employee.email}
                        onChange={(e) => handleInputChange(e, 'employee')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={employee.mobile}
                        onChange={(e) => handleInputChange(e, 'employee')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={employee.password}
                        onChange={(e) => handleInputChange(e, 'employee')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingEmployee}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isAddingEmployee ? 'Adding...' : 'Add Employee'}
                  </button>
                </form>

                {/* List of added employees */}
                {employees.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700">Added Employees:</h5>
                    <ul className="mt-2 space-y-1">
                      {employees.map((emp, idx) => (
                        <li key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                          <span>{emp.name} ({emp.mobile})</span>
                          <button
                            onClick={() => removeEmployee(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerModal;