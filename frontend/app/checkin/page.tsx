'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkinAPI } from '@/lib/api';

export default function CheckinPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    date: today,
    sleep_hours: '',
    sleep_quality: '',
    hrv: '',
    rhr: '',
    soreness_level: '',
    soreness_areas: [] as string[],
    energy_level: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sorenessOptions = ['quads', 'hamstrings', 'calves', 'achilles', 'knees', 'lower_back', 'shoulders'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        date: formData.date,
        sleep_hours: formData.sleep_hours ? parseInt(formData.sleep_hours) : null,
        sleep_quality: formData.sleep_quality ? parseInt(formData.sleep_quality) : null,
        hrv: formData.hrv ? parseInt(formData.hrv) : null,
        rhr: formData.rhr ? parseInt(formData.rhr) : null,
        soreness_level: formData.soreness_level ? parseInt(formData.soreness_level) : null,
        soreness_areas: formData.soreness_areas.length > 0 ? formData.soreness_areas : null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
        notes: formData.notes || null,
      };

      await checkinAPI.create(payload);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save check-in');
    } finally {
      setLoading(false);
    }
  };

  const toggleSorenessArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      soreness_areas: prev.soreness_areas.includes(area)
        ? prev.soreness_areas.filter(a => a !== area)
        : [...prev.soreness_areas, area]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2">Daily Check-in</h1>
          <p className="text-gray-600 mb-6">Track your recovery metrics</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Section */}
            <div>
              <h3 className="font-semibold mb-3">Sleep</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Hours of Sleep</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.sleep_hours}
                    onChange={(e) => setFormData({...formData, sleep_hours: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Sleep Quality (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.sleep_quality}
                    onChange={(e) => setFormData({...formData, sleep_quality: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="4"
                  />
                </div>
              </div>
            </div>

            {/* Heart Metrics */}
            <div>
              <h3 className="font-semibold mb-3">Heart Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">HRV (ms)</label>
                  <input
                    type="number"
                    value={formData.hrv}
                    onChange={(e) => setFormData({...formData, hrv: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Resting HR (bpm)</label>
                  <input
                    type="number"
                    value={formData.rhr}
                    onChange={(e) => setFormData({...formData, rhr: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="58"
                  />
                </div>
              </div>
            </div>

            {/* Energy & Soreness */}
            <div>
              <h3 className="font-semibold mb-3">How You Feel</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Energy Level (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.energy_level}
                    onChange={(e) => setFormData({...formData, energy_level: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Soreness Level (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.soreness_level}
                    onChange={(e) => setFormData({...formData, soreness_level: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="2"
                  />
                </div>
              </div>
            </div>

            {/* Soreness Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sore Areas (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sorenessOptions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleSorenessArea(area)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      formData.soreness_areas.includes(area)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {area.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="How are you feeling? Any injuries or concerns?"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}