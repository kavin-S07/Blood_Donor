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
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Donation History</h1>
      <p className="text-slate-400 text-sm mb-8">
        {user?.role === 'donor' ? 'All your past blood donations' : 'Donations completed at your hospital'}
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-900 font-semibold">No donations yet</p>
          <p className="text-slate-400 text-sm mt-2">
            {user?.role === 'donor' ? 'Accept a blood request to start your donation journey' : 'Completed donations will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Blood Group</th>
                  <th className="text-left px-6 py-3">Units</th>
                  <th className="text-left px-6 py-3">
                    {user?.role === 'donor' ? 'Hospital' : 'Donor'}
                  </th>
                  <th className="text-left px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((d) => (
                  <tr key={d.id} className="border-b border-red-950/20 hover:bg-red-950/10 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {d.donation_date ? new Date(d.donation_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-rose-600 font-bold">{d.blood_group || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{d.units_donated ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {user?.role === 'donor' ? (d.hospital_name || `Hospital #${d.hospital_id}`) : (d.donor_name || `Donor #${d.donor_id}`)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{d.remarks || '—'}</td>
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