import React, { useEffect, useState } from 'react';
import { apiService, User } from '../services/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const AdminDeliverymen: React.FC = () => {
  const [deliverymen, setDeliverymen] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [details, setDetails] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchDeliverymen = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllDeliveryMen();
      setDeliverymen(res.deliverymen || res.data || []);
    } catch (e) {
      setDeliverymen([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliverymen(); }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/deliveryman/approve/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchDeliverymen();
  };
  const handleReject = async (id: string) => {
    await fetch(`/api/deliveryman/reject/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchDeliverymen();
  };
  const openDetails = async (id: string) => {
    const res = await apiService.getDeliveryManById(id);
    setDetails(res.deliveryman || res.data || null);
    setDetailsOpen(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Men Management</h1>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliverymen.map(dm => (
                <tr key={dm._id} className="border-b">
                  <td className="px-4 py-2 border">{dm.name}</td>
                  <td className="px-4 py-2 border">{dm.email}</td>
                  <td className="px-4 py-2 border">{dm.phone}</td>
                  <td className="px-4 py-2 border capitalize">{dm.status || 'active'}</td>
                  <td className="px-4 py-2 border space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openDetails(dm._id)}>Details</Button>
                    {dm.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 text-white" onClick={() => handleApprove(dm._id)}>Approve</Button>
                        <Button size="sm" className="bg-red-600 text-white" onClick={() => handleReject(dm._id)}>Reject</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery Man Details</DialogTitle>
          </DialogHeader>
          {details ? (
            <div className="space-y-2">
              <div><b>Name:</b> {details.name}</div>
              <div><b>Email:</b> {details.email}</div>
              <div><b>Phone:</b> {details.phone}</div>
              <div><b>Status:</b> {details.status}</div>
              <div><b>Vehicle Type:</b> {details.vehicleType}</div>
              <div className="flex gap-4 mt-2">
                {details.vehiclePhoto && <img src={`/api/uploads/deliveryman/${details.vehiclePhoto}`} alt="Vehicle" className="w-24 h-24 object-cover rounded" />}
                {details.facePhoto && <img src={`/api/uploads/deliveryman/${details.facePhoto}`} alt="Face" className="w-24 h-24 object-cover rounded" />}
                {details.cinPhoto && <img src={`/api/uploads/deliveryman/${details.cinPhoto}`} alt="CIN" className="w-24 h-24 object-cover rounded" />}
              </div>
            </div>
          ) : <div>Loading...</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AdminDeliverymen; 