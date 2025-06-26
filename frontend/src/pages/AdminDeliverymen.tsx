import React, { useEffect, useState } from 'react';
import { apiService, User } from '../services/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

const AdminDeliverymen: React.FC = () => {
  const [deliverymen, setDeliverymen] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [details, setDetails] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchDeliverymen = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllDeliveryMen();
      setDeliverymen(res.deliverymen || res.data || []);
    } catch (e) {
      toast({ title: 'Error', description: 'Error fetching deliverymen', variant: 'destructive' });
      setDeliverymen([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliverymen(); }, []);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/deliveryman/approve/${id}`, { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Approved', description: `Email: ${result.email}\nTemp Password: ${result.password}` });
        fetchDeliverymen();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error approving deliveryman', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/deliveryman/reject/${id}`, { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      if (response.ok) {
        toast({ title: 'Rejected', description: 'Application rejected.' });
        fetchDeliverymen();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error rejecting deliveryman', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery man?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/deliveryman/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Delivery man deleted.' });
        fetchDeliverymen();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error deleting delivery man', variant: 'destructive' });
    }
  };

  const openDetails = async (id: string) => {
    try {
      const res = await apiService.getDeliveryManById(id);
      setDetails(res.deliveryman || res.data || null);
      setDetailsOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Error fetching details', variant: 'destructive' });
    }
  };

  // Filter deliverymen by search
  const filtered = deliverymen.filter(dm =>
    dm.name?.toLowerCase().includes(search.toLowerCase()) ||
    dm.email?.toLowerCase().includes(search.toLowerCase()) ||
    dm.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Men Management</h1>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search delivery men"
        />
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500"><span className="animate-spin h-5 w-5 border-2 border-food-orange-500 border-t-transparent rounded-full inline-block"></span> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No delivery men found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dm => (
                <tr key={dm._id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border font-medium flex items-center gap-2">
                    <span className="inline-block w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-lg">
                      {dm.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                    {dm.name}
                  </td>
                  <td className="px-4 py-2 border">{dm.email}</td>
                  <td className="px-4 py-2 border">{dm.phone}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[dm.status || 'active'] || ''}`}>{dm.status || 'active'}</span>
                  </td>
                  <td className="px-4 py-2 border space-x-2">
                    <Button size="sm" variant="outline" aria-label="View details" onClick={() => openDetails(dm._id)}>Details</Button>
                    {dm.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 text-white" aria-label="Approve" onClick={() => handleApprove(dm._id)}>Approve</Button>
                        <Button size="sm" className="bg-red-600 text-white" aria-label="Reject" onClick={() => handleReject(dm._id)}>Reject</Button>
                      </>
                    )}
                    <Button size="sm" className="bg-red-700 text-white" aria-label="Delete" onClick={() => handleDelete(dm._id)}>
                      Delete
                    </Button>
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
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="inline-block w-14 h-14 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-2xl">
                  {details.name?.charAt(0).toUpperCase() || '?'}
                </span>
                <div>
                  <div className="font-bold text-lg">{details.name}</div>
                  <div className="text-sm text-gray-500">{details.email}</div>
                  <div className="text-sm text-gray-500">{details.phone}</div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[details.status || 'active'] || ''}`}>{details.status || 'active'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><b>Vehicle Type:</b> {details.vehicleType || <span className="text-gray-400">N/A</span>}</div>
                <div><b>Status:</b> {details.status}</div>
                {details.address && <div className="col-span-2"><b>Address:</b> {details.address}</div>}
                {details.createdAt && <div><b>Created:</b> {new Date(details.createdAt).toLocaleString()}</div>}
                {details.updatedAt && <div><b>Updated:</b> {new Date(details.updatedAt).toLocaleString()}</div>}
              </div>
              <div>
                <div className="font-semibold mb-2">Documents & Photos:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    {details.vehiclePhoto ? (
                      <img src={`http://localhost:5000/api/uploads/deliveryman/${details.vehiclePhoto}`} alt="Vehicle/Bike" className="w-28 h-28 object-cover rounded border mb-1" />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center bg-gray-100 rounded border text-gray-400">No Image</div>
                    )}
                    <span className="text-xs text-gray-600 mt-1">Vehicle/Bike</span>
                  </div>
                  <div className="flex flex-col items-center">
                    {details.facePhoto ? (
                      <img src={`http://localhost:5000/api/uploads/deliveryman/${details.facePhoto}`} alt="Face" className="w-28 h-28 object-cover rounded border mb-1" />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center bg-gray-100 rounded border text-gray-400">No Image</div>
                    )}
                    <span className="text-xs text-gray-600 mt-1">Face</span>
                  </div>
                  <div className="flex flex-col items-center">
                    {details.cinPhoto ? (
                      <img src={`http://localhost:5000/api/uploads/deliveryman/${details.cinPhoto}`} alt="CIN" className="w-28 h-28 object-cover rounded border mb-1" />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center bg-gray-100 rounded border text-gray-400">No Image</div>
                    )}
                    <span className="text-xs text-gray-600 mt-1">CIN</span>
                  </div>
                </div>
              </div>
            </div>
          ) : <div className="flex items-center gap-2 text-gray-500"><span className="animate-spin h-5 w-5 border-2 border-food-orange-500 border-t-transparent rounded-full inline-block"></span> Loading...</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AdminDeliverymen; 