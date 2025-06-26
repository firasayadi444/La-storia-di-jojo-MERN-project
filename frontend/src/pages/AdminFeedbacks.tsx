import React, { useEffect, useState } from 'react';
import { apiService, Order } from '../services/api';

const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllFeedbacks();
      setFeedbacks(res.feedbacks || res.data || []);
    } catch (e) {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Customer Feedbacks</h1>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">User</th>
                <th className="px-4 py-2 border">Delivery Man</th>
                <th className="px-4 py-2 border">Food Rating</th>
                <th className="px-4 py-2 border">Delivery Rating</th>
                <th className="px-4 py-2 border">Comment</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(fb => (
                <tr key={fb._id} className="border-b">
                  <td className="px-4 py-2 border">{fb._id.slice(-6)}</td>
                  <td className="px-4 py-2 border">{fb.user?.name}</td>
                  <td className="px-4 py-2 border">{fb.deliveryMan?.name || '-'}</td>
                  <td className="px-4 py-2 border">{fb.foodRating ?? '-'}</td>
                  <td className="px-4 py-2 border">{fb.deliveryRating ?? '-'}</td>
                  <td className="px-4 py-2 border">{fb.feedbackComment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AdminFeedbacks; 