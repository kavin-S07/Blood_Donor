import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import { hospitalService } from '../services/hospitalService';
import type { Donation } from '../types/donor';

const DonationHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = user?.role === 'donor'
          ? await donorService.getDonationHistory()
          : await hospitalService.getDonationHistory();
        setHistory(Array.isArray(data) ? data : []);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {user?.role === 'donor' ? 'Donation History' : 'Donation Records'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {user?.role === 'donor' ? 'All your completed blood donations' : 'Donations completed at your hospital'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🩸</div>
          <p className="text-slate-900 font-semibold">No donations yet</p>
          <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
            {user?.role === 'donor'
              ? 'Accept a blood request to start your donation journey'
              : 'Completed donations will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <span className="text-slate-900 font-semibold">{history.length} record{history.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3.5">Date</th>
                  <th className="text-left px-6 py-3.5">Blood Group</th>
                  <th className="text-left px-6 py-3.5">Units</th>
                  <th className="text-left px-6 py-3.5">
                    {user?.role === 'donor' ? 'Hospital' : 'Donor'}
                  </th>
                  <th className="text-left px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      {d.donation_date ? new Date(d.donation_date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-rose-600 font-bold">{d.blood_group || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {d.units_donated ? `${d.units_donated} unit${d.units_donated !== 1 ? 's' : ''}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user?.role === 'donor'
                        ? (d.hospital_name || `Hospital #${d.hospital_id}`)
                        : (d.donor_name || `Donor #${d.donor_id}`)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistoryPage;
