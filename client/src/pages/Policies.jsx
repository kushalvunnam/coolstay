import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Clock, 
  Users, 
  CreditCard, 
  HeartHandshake, 
  Edit3, 
  Check, 
  Plus, 
  Sparkles,
  BookOpen
} from 'lucide-react';

const Policies = () => {
  const { user, showToast } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const [activeCategory, setActiveCategory] = useState('gate');
  const [isEditing, setIsEditing] = useState(false);

  // Default Policies Data
  const [policies, setPolicies] = useState({
    gate: {
      title: 'Curfew & Gate Policies',
      icon: Clock,
      color: 'blue',
      rules: [
        'Main PG entrance gates close strictly at 10:30 PM every night.',
        'Late check-ins (up to 11:30 PM) must be pre-authorized by submitting a notice to management.',
        'Emergency entries after midnight require biometric registration and registry logs at the guard room.',
        'Silent hours in all corridors start from 11:00 PM onwards.'
      ]
    },
    guest: {
      title: 'Guest & Visitor Policies',
      icon: Users,
      color: 'violet',
      rules: [
        'Day visitors are allowed in common rooms only between 9:00 AM and 8:00 PM.',
        'All visitors must register their name and contact details in the guard room visitor log.',
        'Overnight stays for guests are strictly prohibited in shared rooms.',
        'No guest is allowed inside rooms without the explicit consent of all roommates.'
      ]
    },
    payment: {
      title: 'Rent & Security Policies',
      icon: CreditCard,
      color: 'emerald',
      rules: [
        'Monthly rent invoices are generated on the 1st of every month and due by the 10th.',
        'A late fee penalty of Rs. 50/day will be automatically added past the due date.',
        'Security deposits are refundable after a 30-day checkout notice period.',
        'Damage to property fittings will be charged directly to the resident deposit.'
      ]
    },
    conduct: {
      title: 'Code of Conduct & Safety',
      icon: ShieldCheck,
      color: 'rose',
      rules: [
        'Consumption of alcohol, smoking, or illegal substances is strictly prohibited on the premises.',
        'Residents are requested to keep their valuables locked; management is not liable for lost items.',
        'Hostel facilities (laundry, gym, dining room) should be used keeping hygiene guidelines in mind.',
        'Harassment, bullying, or creating nuisance is a zero-tolerance offence.'
      ]
    }
  });

  const [editRules, setEditRules] = useState([]);
  const [newRuleText, setNewRuleText] = useState('');

  // Start Editing policy rules
  const handleStartEdit = () => {
    setEditRules([...policies[activeCategory].rules]);
    setIsEditing(true);
  };

  // Update a single rule index
  const handleRuleChange = (idx, val) => {
    const updated = [...editRules];
    updated[idx] = val;
    setEditRules(updated);
  };

  // Add a new rule item
  const handleAddRule = () => {
    if (!newRuleText) return;
    setEditRules([...editRules, newRuleText]);
    setNewRuleText('');
  };

  // Delete a rule index
  const handleRemoveRule = (idx) => {
    setEditRules(editRules.filter((_, i) => i !== idx));
  };

  // Save changes
  const handleSavePolicies = () => {
    setPolicies({
      ...policies,
      [activeCategory]: {
        ...policies[activeCategory],
        rules: editRules
      }
    });
    setIsEditing(false);
    showToast('PG Policies updated successfully!', 'success');
  };

  // Category map colors
  const colorMap = {
    blue: 'text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30',
    violet: 'text-violet-500 bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30',
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30',
    rose: 'text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30'
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" /> House Rules & Policies
          </h1>
          <p className="text-sm text-slate-400 font-medium">Official conduct rules, curfew terms, and rental guidelines for CoolStay.</p>
        </div>
        
        {isAdmin && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" /> Edit Rules
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          {Object.keys(policies).map((key) => {
            const cat = policies[key];
            const Icon = cat.icon;
            const isActive = activeCategory === key;

            return (
              <button
                key={key}
                disabled={isEditing}
                onClick={() => {
                  setActiveCategory(key);
                  setIsEditing(false);
                }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                  isActive 
                    ? 'bg-violet-600 border-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
                    : 'bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Content Card Panel */}
        <div className="md:col-span-3 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            {/* Header category details */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-4 mb-6">
              {React.createElement(policies[activeCategory].icon, {
                className: `w-7 h-7 p-1.5 rounded-xl border ${colorMap[policies[activeCategory].color]}`
              })}
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {policies[activeCategory].title}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Official Terms & Conduct</p>
              </div>
            </div>

            {/* List of rules (Normal vs Edit mode) */}
            {isEditing ? (
              <div className="space-y-4">
                {editRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0 mt-2">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleRuleChange(idx, e.target.value)}
                      className="flex-grow px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-xs text-rose-500 font-bold hover:underline self-center px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {/* Add new rule row */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 mt-4">
                  <input
                    type="text"
                    placeholder="Type a new policy rule..."
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    className="flex-grow px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3.5 py-2 rounded-lg bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {policies[activeCategory].rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 group">
                    <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-violet-100/30">
                      {idx + 1}
                    </div>
                    <p className="text-xs font-semibold text-slate-655 dark:text-slate-300 leading-relaxed pt-0.5">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Actions Save buttons */}
          {isEditing && (
            <div className="flex gap-3 justify-end pt-6 border-t border-slate-105 dark:border-slate-850 mt-8">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-350 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicies}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-650 bg-violet-600 hover:bg-violet-555 text-white shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Policy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Policies;
