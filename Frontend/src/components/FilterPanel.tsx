import React, { useState } from 'react';
import type { FilterParams } from '../types/analytics';
import { BLOOD_GROUPS, EMERGENCY_LEVELS } from '../types/donor';

interface FilterPanelProps {
  onApply: (filters: FilterParams) => void;
  onReset: () => void;
  loading?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApply, onReset, loading }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  const handleChange = (key: keyof FilterParams, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const hasFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm"
      >
        <span className="font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-rose-500" />}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Blood Group</label>
              <select
                value={filters.blood_group || ''}
                onChange={e => handleChange('blood_group', e.target.value)}
                className="text-xs w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">All</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Status</label>
              <select
                value={filters.status || ''}
                onChange={e => handleChange('status', e.target.value)}
                className="text-xs w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="arrived">Arrived</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Emergency</label>
              <select
                value={filters.emergency_level || ''}
                onChange={e => handleChange('emergency_level', e.target.value)}
                className="text-xs w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">All</option>
                {EMERGENCY_LEVELS.map(el => <option key={el} value={el}>{el}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">From Date</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={e => handleChange('date_from', e.target.value)}
                className="text-xs w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">To Date</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={e => handleChange('date_to', e.target.value)}
                className="text-xs w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleApply}
              disabled={loading}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
            {hasFilters && (
              <button
                onClick={handleReset}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
