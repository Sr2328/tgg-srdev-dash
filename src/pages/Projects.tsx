import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, MapPin, Calendar, TrendingUp, TrendingDown, FolderOpen, IndianRupee } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Header from '../components/layout/Header';
import AddProjectModal from '../components/modals/AddProjectModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import AddExpenseModal from '../components/modals/AddExpenseModal'; // <-- Added import
import { supabase } from '../lib/supabase';
import type { SideProject, ProjectExpense } from '../types/database';

export default function Projects() {
  const [projects, setProjects] = useState<SideProject[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<SideProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SideProject | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Added states for Add Expense modal ----
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedProjectForExpense, setSelectedProjectForExpense] = useState<SideProject | null>(null);

  const handleAddExpenseClick = (project: SideProject) => {
    setSelectedProjectForExpense(project);
    setShowAddExpenseModal(true);
  };

  useEffect(() => {
    loadProjects();
    loadExpenses();
    
    // Set up real-time subscriptions
    const subscriptions = [
      supabase
        .channel('projects_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'side_projects' }, () => {
          loadProjects();
        })
        .subscribe(),
      
      supabase
        .channel('project_expenses_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'project_expenses' }, () => {
          loadExpenses();
        })
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm]);

  const filterProjects = () => {
    if (!searchTerm) {
      setFilteredProjects(projects);
      return;
    }

    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('side_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('project_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('side_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getProjectExpenses = (projectId: string) => {
    return expenses.filter(e => e.project_id === projectId);
  };

  const getTotalProjectExpenses = (projectId: string) => {
    return getProjectExpenses(projectId).reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getNetProfit = (project: SideProject) => {
    const totalExpenses = getTotalProjectExpenses(project.id);
    return Number(project.profit) - totalExpenses;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleEdit = (project: SideProject) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header 
        onSearch={setSearchTerm} 
        searchPlaceholder="Search projects by name or location..."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Side Projects</h1>
          <p className="text-gray-600">Manage one-time and temporary projects</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Active Projects</p>
            <p className="text-3xl font-bold text-green-600">
              {projects.filter(p => p.status === 'active').length}
            </p>
          </div>
        </GlassCard>
       <GlassCard>
  <div className="text-center">
    <p className="text-gray-600 text-sm">Total Revenue</p>
    <p className="text-3xl font-bold text-blue-600">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(projects.reduce((sum, p) => sum + Number(p.profit), 0))}
    </p>
  </div>
</GlassCard>

<GlassCard>
  <div className="text-center">
    <p className="text-gray-600 text-sm">Total Expenses</p>
    <p className="text-3xl font-bold text-red-600">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(expenses.reduce((sum, e) => sum + Number(e.amount), 0))}
    </p>
  </div>
</GlassCard>

      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const projectExpenses = getProjectExpenses(project.id);
          const totalExpenses = getTotalProjectExpenses(project.id);
          const netProfit = getNetProfit(project);

          return (
            <GlassCard key={project.id} hover>
              <div className="space-y-4">
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(project)}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteProject(project.id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      {project.end_date && (
                        <>
                          <span>-</span>
                          <span>{new Date(project.end_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
  <div className="flex justify-between items-center">
    <span className="text-gray-500 text-sm">Revenue</span>
    <span className="text-green-600 font-semibold text-sm">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(project.profit))}
    </span>
  </div>

  <div className="flex justify-between items-center">
    <span className="text-gray-500 text-sm">Expenses</span>
    <span className="text-red-600 font-semibold text-sm">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(totalExpenses)}
    </span>
  </div>

  <div className="border-t border-gray-200 pt-2">
    <div className="flex justify-between items-center">
      <span className="text-gray-900 font-medium text-sm">Net Profit</span>
      <div className="flex items-center gap-1">
        {netProfit >= 0 ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
        <span
          className={`font-semibold text-sm ${
            netProfit >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(Math.abs(netProfit))}
        </span>
      </div>
    </div>
  </div>
</div>


                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAddExpenseClick(project)}
                    className="flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    Add Expense
                  </button>
                  <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>


 {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Start growing your business with side projects'}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      )}

      {/* Modals */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadProjects}
      />
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadProjects}
        project={selectedProject}
      />
    </div>
  );
}