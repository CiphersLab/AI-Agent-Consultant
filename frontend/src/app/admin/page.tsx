'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { adminAPI } from '@/app/lib/admin-api';
import { 
  TrendingUp, 
  Users, 
  Star, 
  Mail, 
  Phone, 
  Calendar,
  ExternalLink,
  LogOut,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface Lead {
  lead_id: string;
  name: string;
  email: string;
  phone?: string;
  lead_score: number;
  idea: string;
  captured_at: string;
  status: string;
}

interface Analytics {
  total_leads: number;
  high_quality_leads: number;
  average_lead_score: number;
  conversion_rate: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, filterScore, leads]);

  const checkAuth = () => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  };

  const loadData = async () => {
    try {
      const [analyticsData, leadsData] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getTopLeads(100)
      ]);
      
      setAnalytics(analyticsData);
      setLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.idea.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Score filter
    if (filterScore !== 'all') {
      filtered = filtered.filter(lead => {
        if (filterScore === 'high') return lead.lead_score >= 70;
        if (filterScore === 'medium') return lead.lead_score >= 40 && lead.lead_score < 70;
        if (filterScore === 'low') return lead.lead_score < 40;
        return true;
      });
    }

    setFilteredLeads(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const exportLeads = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Score', 'Status', 'Date', 'Idea'],
      ...filteredLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone || '',
        lead.lead_score,
        lead.status,
        new Date(lead.captured_at).toLocaleDateString(),
        lead.idea.substring(0, 100) + '...'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High Quality';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Lead Management & Analytics</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.total_leads}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">High Quality</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.high_quality_leads}</p>
                </div>
                <Star className="w-10 h-10 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.average_lead_score.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Conversion</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.conversion_rate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-indigo-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters & Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or idea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterScore === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterScore('all')}
              >
                All
              </Button>
              <Button
                variant={filterScore === 'high' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterScore('high')}
              >
                High (70+)
              </Button>
              <Button
                variant={filterScore === 'medium' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterScore('medium')}
              >
                Medium (40-69)
              </Button>
              <Button
                variant={filterScore === 'low' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterScore('low')}
              >
                Low (&lt;40)
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={exportLeads}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Showing {filteredLeads.length} of {leads.length} leads
          </p>
        </Card>

        {/* Leads Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Idea
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.lead_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <Badge variant="default" className="mt-1">
                          {lead.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          <a href={`mailto:${lead.email}`} className="hover:text-gray-900">
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            <a href={`tel:${lead.phone}`} className="hover:text-gray-900">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {lead.lead_score}
                        </span>
                        <Badge variant={getScoreBadgeVariant(lead.lead_score)}>
                          {getScoreLabel(lead.lead_score)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                        {lead.idea}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(lead.captured_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/leads/${lead.lead_id}`)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leads found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}