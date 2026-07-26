"use client";

import React, { useState, useEffect } from 'react';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Activity,
  PlusCircle,
  AlertCircle,
  X 
} from 'lucide-react';

export default function Home() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]); // NEW: State for MongoDB logs
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // --- MODAL & FORM STATE ---
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', description: '', owner_id: '' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', project_id: '', assignee_id: '' });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'engineer' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);

    try {
      // NEW: Added the /api/logs endpoint to our Promise.all
      const [projectsRes, tasksRes, usersRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/projects`).catch(() => null),
        fetch(`${API_BASE_URL}/api/tasks`).catch(() => null),
        fetch(`${API_BASE_URL}/api/users`).catch(() => null),
        fetch(`${API_BASE_URL}/api/logs`).catch(() => null)
      ]);

      if (!projectsRes?.ok || !usersRes?.ok) {
        throw new Error('Backend unreachable or missing routes');
      }

      const projectsData = await projectsRes.json();
      const tasksData = tasksRes?.ok ? await tasksRes.json() : { data: [] };
      const usersData = await usersRes.json();
      const logsData = logsRes?.ok ? await logsRes.json() : { data: [] };

      setProjects(projectsData.data || []);
      setTasks(tasksData.data || []);
      setUsers(usersData.data || []);
      setLogs(logsData.data || []);

    } catch (err) {
      console.error("CRITICAL API ERROR:", err);
      setUsingMockData(true);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setProjects([
      { id: 1, project_name: 'Apollo Redesign', description: 'Revamp the UI', owner_name: 'Alice Engineer', created_at: new Date().toISOString() }
    ]);
    setTasks([
      { id: 1, title: 'Design Database Schema', status: 'todo', project_name: 'Apollo Redesign', assignee_name: 'Alice Engineer', created_at: new Date().toISOString() }
    ]);
    setUsers([
      { id: 1, name: 'Alice Engineer', email: 'alice@synchub.com', role: 'engineer', created_at: new Date().toISOString() }
    ]);
    setLogs([]);
  };

  // --- FORM HANDLERS ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3005/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        setIsUserModalOpen(false); 
        setNewUserForm({ name: '', email: '', role: 'engineer' }); 
        fetchAllData(); 
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3005/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectForm.name,
          description: newProjectForm.description,
          owner_id: parseInt(newProjectForm.owner_id) 
        })
      });
      if (res.ok) {
        setIsProjectModalOpen(false); 
        setNewProjectForm({ name: '', description: '', owner_id: '' }); 
        fetchAllData(); 
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3005/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskForm.title,
          project_id: parseInt(newTaskForm.project_id),
          assignee_id: parseInt(newTaskForm.assignee_id)
        })
      });
      if (res.ok) {
        setIsTaskModalOpen(false);
        setNewTaskForm({ title: '', project_id: '', assignee_id: '' });
        fetchAllData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HELPER FOR MONGODB LOGS ---
  // This cross-references the PostgreSQL user ID with the MongoDB log!
  const getLogMessage = (log: any) => {
    const user = users.find(u => u.id === log.userId);
    const userName = user ? user.name : 'Unknown User';

    if (log.action === 'CREATED_PROJECT') {
      return <span><span className="font-semibold text-slate-900">{userName}</span> created project <span className="text-blue-600 font-medium">{log.metadata?.projectName}</span></span>;
    }
    if (log.action === 'CREATED_TASK') {
      return <span><span className="font-semibold text-slate-900">{userName}</span> created task <span className="text-blue-600 font-medium">{log.metadata?.taskTitle}</span></span>;
    }
    return <span><span className="font-semibold text-slate-900">{userName}</span> performed {log.action}</span>;
  };

  // --- SUB-COMPONENTS ---
  const StatCard = ({ title, count, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{count}</h3>
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Projects" count={projects.length} icon={FolderKanban} colorClass="bg-blue-500" />
        <StatCard title="Active Tasks" count={tasks.length} icon={CheckSquare} colorClass="bg-emerald-500" />
        <StatCard title="Team Members" count={users.length} icon={Users} colorClass="bg-purple-500" />
      </div>

      {/* NEW: Real MongoDB Activity Logs! */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-blue-500" size={20} />
          <h3 className="text-lg font-bold text-slate-800">Recent Activity (Live from MongoDB)</h3>
        </div>
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <p className="text-slate-700 text-sm">
                {getLogMessage(log)}
                <span className="text-slate-400 text-xs ml-3">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-slate-500 text-sm">No recent activity yet. Create a project to test MongoDB!</p>}
        </div>
      </div>
    </div>
  );

  const ProjectsView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Projects</h2>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <PlusCircle size={18} /> New Project
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project: any) => (
          <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{project.project_name}</h3>
            <p className="text-slate-600 mb-4 text-sm line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                <Users size={14} /> {project.owner_name}
              </span>
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && <div className="text-slate-500">No projects found. Create one to get started!</div>}
      </div>
    </div>
  );

  const TasksView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tasks</h2>
        <button 
          onClick={() => setIsTaskModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <PlusCircle size={18} /> New Task
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-medium">Task</th>
              <th className="p-4 font-medium">Project</th>
              <th className="p-4 font-medium">Assignee</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task: any) => (
              <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-800 font-medium">{task.title}</td>
                <td className="p-4 text-slate-600 text-sm">{task.project_name}</td>
                <td className="p-4 text-slate-600 text-sm">{task.assignee_name || 'Unassigned'}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700 uppercase tracking-wider">
                    {task.status || 'todo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && <div className="p-8 text-center text-slate-500">No tasks found. Create one to get started!</div>}
      </div>
    </div>
  );

  const UsersView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Team Members</h2>
        <button 
          onClick={() => setIsUserModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <PlusCircle size={18} /> Add Member
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user: any) => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{user.name}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              <span className="inline-block mt-1 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md capitalize">
                {user.role}
              </span>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="text-slate-500 col-span-full">No team members found. Add one to get started!</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="bg-blue-500 p-2 rounded-xl">
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SyncHub</h1>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'projects', icon: FolderKanban, label: 'Projects' },
              { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
              { id: 'users', icon: Users, label: 'Team' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {activeTab === 'users' ? 'Team' : activeTab}
          </h2>
          
          <div className="flex items-center gap-4">
            {usingMockData && (
              <span className="flex items-center gap-2 text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                <AlertCircle size={14} /> Preview Mode (API Offline)
              </span>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-sm border-2 border-white"></div>
          </div>
        </header>

        {/* Scrollable Content View */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'projects' && <ProjectsView />}
              {activeTab === 'tasks' && <TasksView />}
              {activeTab === 'users' && <UsersView />}
            </>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      
      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Add Team Member</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. Alice Engineer"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="alice@synchub.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                >
                  <option value="engineer">Engineer</option>
                  <option value="designer">Designer</option>
                  <option value="manager">Product Manager</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Create New Project</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. Website Redesign"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Brief description of the project..."
                  rows={3}
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({...newProjectForm, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Owner</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  value={newProjectForm.owner_id}
                  onChange={(e) => setNewProjectForm({...newProjectForm, owner_id: e.target.value})}
                >
                  <option value="" disabled>Select an owner...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Create New Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. Design homepage mockup"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  value={newTaskForm.project_id}
                  onChange={(e) => setNewTaskForm({...newTaskForm, project_id: e.target.value})}
                >
                  <option value="" disabled>Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  value={newTaskForm.assignee_id}
                  onChange={(e) => setNewTaskForm({...newTaskForm, assignee_id: e.target.value})}
                >
                  <option value="" disabled>Select an assignee...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}