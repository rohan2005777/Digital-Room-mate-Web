import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  Home,
  DollarSign,
  CheckSquare,
  FileText,
  Brain,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Moon,
  Search,
  User as UserIcon,
  Plus,
  Trash2,
  ChevronRight,
  MessageSquare,
  Send,
  ShieldCheck,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Filter,
  Download,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from './api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a12] flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={48} className="text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong.</h1>
          <p className="text-slate-400 mb-6">We've encountered an unexpected error. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- API Error Handling ---
function handleApiError(error: unknown, action: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`API Error during ${action}:`, errorMessage);
  window.alert(`Action '${action}' failed:\n\n${errorMessage}`);
}

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIST(dateInput: any) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(date);
}

export function isOverdueIST(dateInput: any) {
  if (!dateInput) return false;
  const target = new Date(dateInput);
  const now = new Date();

  const targetIST = new Date(target.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  targetIST.setHours(0, 0, 0, 0);
  nowIST.setHours(0, 0, 0, 0);

  return targetIST.getTime() < nowIST.getTime();
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

// --- TYPES ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  splitWith: string[];
  status: 'pending' | 'settled';
  createdAt: any;
}

interface Chore {
  id: string;
  title: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: any;
  createdAt: any;
}

interface Agreement {
  id: string;
  content: string;
  version: string;
  signedBy: string[];
  createdAt: any;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  photoURL?: string;
  roomId?: string;
}

// --- COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active
        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-medium"
        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
    )}
  >
    <Icon size={18} className={cn("transition-transform group-hover:scale-110", active && "text-indigo-400")} />
    <span className="text-sm">{label}</span>
    {badge && (
      <span className="ml-auto bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
        {badge}
      </span>
    )}
  </button>
);

const Card = ({ children, className, title, icon: Icon, headerAction, onClick }: any) => (
  <div onClick={onClick} className={cn("bg-[#15152a] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all duration-300", className)}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-indigo-400" />}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>
        {headerAction}
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ title, value, delta, icon: Icon, colorClass, onClick }: any) => (
  <Card onClick={onClick} className={cn("relative overflow-hidden group", onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]")}>
    <div className={cn("absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-2xl", colorClass)} />
    <div className="relative z-10">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colorClass.replace('bg-', 'bg-opacity-20 text-'))}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-extrabold text-white mb-1">{value}</h4>
      <p className="text-xs text-emerald-400 flex items-center gap-1">
        <TrendingUp size={12} /> {delta}
      </p>
    </div>
  </Card>
);

// --- MAIN APP ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showChoreModal, setShowChoreModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [roomSettings, setRoomSettings] = useState({
    name: "Room 304 — Sunrise Apts",
    rent: 8000,
    city: "Hyderabad, Telangana"
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const removeRoommate = async (uid: string) => {
    try {
      await apiFetch(`/rooms/${userProfile?.roomId}/remove/${uid}`, { method: 'PUT' });
      await fetchData();
      showToast('Roommate removed successfully');
    } catch (error) {
      handleApiError(error, 'Remove Roommate');
    }
  };

  const leaveRoom = async () => {
    try {
      await apiFetch(`/rooms/${userProfile?.roomId}/leave`, { method: 'PUT' });
      await fetchData();
      showToast('You left the room');
    } catch (error) {
      handleApiError(error, 'Leave Room');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Init / Data Fetching
  const fetchData = async () => {
    try {
      const u = await apiFetch('/auth/me');
      setUser({ uid: u._id, email: u.email, displayName: u.name, photoURL: u.photoURL });
      setUserProfile({ uid: u._id, email: u.email, name: u.name, role: u.role, photoURL: u.photoURL, roomId: u.roomId });

      if (u.roomId) {
        const [roomData, expensesData, choresData] = await Promise.all([
          apiFetch(`/rooms/${u.roomId}`),
          apiFetch(`/expenses/room/${u.roomId}`),
          apiFetch(`/chores/room/${u.roomId}`)
        ]);

        setRoomSettings({ name: roomData.name, rent: roomData.rent || 0, city: roomData.city || '' });
        if (roomData.agreements) {
          setAgreements(roomData.agreements.map((a: any) => ({ id: a._id, content: a.content, version: `v${a.version}.0`, signedBy: a.signedBy, createdAt: a.createdAt })));
        }
        setUsers((roomData.members || []).map((m: any) => ({ uid: m._id, name: m.name, email: m.email, role: m.role, roomId: m.roomId, photoURL: m.photoURL })));
        setExpenses(expensesData.map((e: any) => ({ id: e._id, description: e.description, amount: e.amount, category: e.category, paidBy: e.paidBy?._id || e.paidBy, splitWith: e.splitWith.map((s: any) => s._id || s), status: e.status, createdAt: e.createdAt })));
        setChores(choresData.map((c: any) => ({ id: c._id, title: c.title, assignedTo: c.assignedTo?._id || c.assignedTo, status: c.status, dueDate: c.dueDate, createdAt: c.createdAt })));
      }
    } catch (e) {
      console.log("Not logged in");
      setUser(null);
      setUserProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', res.token);
      await fetchData();
    } catch (err: any) {
      handleApiError(err, 'Login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      localStorage.setItem('token', res.token);
      await fetchData();
    } catch (err: any) {
      handleApiError(err, 'Register');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUserProfile(null);
  };

  const createRoom = async (name: string) => {
    try {
      const res = await apiFetch('/rooms/create', { method: 'POST', body: JSON.stringify({ name }) });
      await fetchData();
      showToast(`Room created! ID: ${res.joinCode}`);
    } catch (error) {
      handleApiError(error, 'Create Room');
    }
  };

  const joinRoom = async (joinCode: string) => {
    try {
      await apiFetch('/rooms/join', { method: 'POST', body: JSON.stringify({ joinCode }) });
      await fetchData();
      showToast('Joined room successfully!');
    } catch (error) {
      handleApiError(error, 'Join Room');
    }
  };





  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const customSplit = formData.getAll('splitWith') as string[];
    const finalSplit = customSplit.length > 0 ? customSplit : users.map(u => u.uid);

    const newExpense = {
      description: formData.get('description'),
      amount: Number(formData.get('amount')),
      category: formData.get('category'),
      splitWith: finalSplit,
      roomId: userProfile?.roomId
    };

    try {
      await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(newExpense) });
      await fetchData();
      setShowExpenseModal(false);
      showToast('Expense added successfully!');
    } catch (error) {
      handleApiError(error, 'Add Expense');
    }
  };


  const settleExpense = async (id: string) => {
    try {
      await apiFetch(`/expenses/${id}/settle`, { method: 'PUT' });
      await fetchData();
      showToast('Expense settled!');
    } catch (error) {
      handleApiError(error, 'Settle Expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      await fetchData();
      showToast('Expense deleted');
    } catch (error) {
      handleApiError(error, 'Delete Expense');
    }
  };

  const addChore = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newChore = {
      title: formData.get('title'),
      assignedTo: formData.get('assignedTo'),
      roomId: userProfile?.roomId,
      dueDate: new Date(formData.get('dueDate') as string).toISOString()
    };

    try {
      await apiFetch('/chores', { method: 'POST', body: JSON.stringify(newChore) });
      await fetchData();
      setShowChoreModal(false);
      showToast('Chore assigned!');
    } catch (error) {
      handleApiError(error, 'Add Chore');
    }
  };


  const updateChoreStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/chores/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      await fetchData();
      showToast(`Chore marked as ${status.replace('-', ' ')}`);
    } catch (error) {
      handleApiError(error, 'Update Chore Status');
    }
  };

  const saveAgreement = async (content: string) => {
    if (userProfile?.role !== 'admin') {
      showToast('Only admins can edit the agreement', 'error');
      return;
    }
    try {
      await apiFetch(`/rooms/${userProfile?.roomId}/agreement`, {
        method: 'PUT',
        body: JSON.stringify({ agreement: content })
      });
      await fetchData();
      showToast('Agreement updated successfully!');
    } catch (error) {
      handleApiError(error, 'Update Agreement');
    }
  };


  const askAI = async (prompt?: string) => {
    const queryText = prompt || (document.getElementById('ai-prompt') as HTMLInputElement)?.value;
    if (!queryText) return;

    setIsAiThinking(true);
    setAiResponse("");

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a smart roommate assistant. Here is the current room state:
        Expenses: ${JSON.stringify(expenses)}
        Chores: ${JSON.stringify(chores)}
        Roommates: ${JSON.stringify(users)}
        
        User question: ${queryText}
        
        Provide a helpful, concise response in markdown.`,
      });

      const response = await model;
      setAiResponse(response.text || "I couldn't generate a response.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Sorry, I encountered an error while thinking.");
    } finally {
      setIsAiThinking(false);
      if (!prompt) {
        const input = document.getElementById('ai-prompt') as HTMLInputElement;
        if (input) input.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#15152a] border border-white/5 rounded-[32px] p-10 shadow-2xl relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
              <Home className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">RoomMate OS</h1>
            <p className="text-slate-400">{isRegistering ? 'Create your account' : 'Welcome back'}</p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input name="name" required className="w-full bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none text-white" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
              <input name="email" type="email" required className="w-full bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
              <input name="password" type="password" required className="w-full bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none text-white" />
            </div>
            <button
              type="submit"
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all duration-300"
            >
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-indigo-400 hover:text-indigo-300">
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  if (!userProfile?.roomId) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#15152a] border border-white/5 rounded-[32px] p-10 shadow-2xl relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-indigo-400" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Room Setup</h2>
            <p className="text-slate-400 text-sm">Join an existing room or create a new one.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Join with Room ID</label>
              <div className="flex gap-2">
                <input
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="ENTER ID"
                  className="flex-1 bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 uppercase"
                />
                <button
                  onClick={() => joinRoom(joinRoomId)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold transition-all"
                >
                  Join
                </button>
              </div>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-600"><span className="bg-[#15152a] px-4">Or</span></div>
            </div>

            <button
              onClick={() => createRoom(`${user.displayName}'s Room`)}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Create New Room
            </button>

            <button onClick={handleLogout} className="w-full text-slate-500 text-xs hover:text-rose-400 transition-colors mt-4">
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-200 flex font-sans selection:bg-indigo-500/30">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111120] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">RoomMate OS</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Smart Living</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-4">Main</p>
          <SidebarItem icon={Home} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={DollarSign} label="Expenses" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} badge={expenses.filter(e => e.status === 'pending').length} />
          <SidebarItem icon={CheckSquare} label="Chores" active={activeTab === 'chores'} onClick={() => setActiveTab('chores')} badge={chores.filter(c => c.status !== 'completed').length} />
          <SidebarItem icon={FileText} label="Agreements" active={activeTab === 'agreements'} onClick={() => setActiveTab('agreements')} />

          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">Tools</p>
          <SidebarItem icon={Brain} label="AI Insights" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <SidebarItem icon={CreditCard} label="Payments" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-[#181830] rounded-2xl p-3 flex items-center gap-3">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-xl border border-white/10" alt="User" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userProfile?.role || 'Member'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* TOPBAR */}
        <header className="h-16 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-8 sticky top-0 z-40">
          <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input
                placeholder="Search everything..."
                className="bg-[#15152a] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
              />
            </div>
            <button className="w-10 h-10 rounded-full bg-[#15152a] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#15152a]" />
            </button>
            <div className="h-8 w-px bg-white/5 mx-2" />
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Active</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {(() => {
                    const myDebts = expenses.filter(e => e.status === 'pending' && e.paidBy !== user?.uid && (e.splitWith || users.map(u => u.uid)).includes(user?.uid || '')).reduce((acc, e) => acc + (e.amount / (e.splitWith || users.map(u => u.uid)).length), 0);
                    const owedToMe = expenses.filter(e => e.status === 'pending' && e.paidBy === user?.uid).reduce((acc, e) => acc + ((e.amount / (e.splitWith || users.map(u => u.uid)).length) * ((e.splitWith || users.map(u => u.uid)).length - 1)), 0);

                    const myOverdueChores = chores.filter(c => c.status !== 'completed' && isOverdueIST(c.dueDate) && c.assignedTo === user?.uid).length;
                    const myChoreFines = myOverdueChores * 20;

                    const totalDebt = myDebts + myChoreFines;
                    const netBalance = owedToMe - totalDebt;
                    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

                    const rentExpenseThisMonth = expenses.find(e => {
                      if (e.category?.toLowerCase() !== 'rent') return false;
                      const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
                      return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                    });

                    let rentStatus = "Pending";
                    let rentDelta = `Your explicit share: ₹${(roomSettings.rent / (users.length || 1)).toFixed(0)}`;
                    let rentColor = "bg-amber-500";

                    if (rentExpenseThisMonth) {
                      rentStatus = "Paid";
                      rentDelta = "Covered for this month";
                      rentColor = "bg-emerald-500";
                    } else {
                      const today = new Date();
                      if (today.getDate() > 10) {
                        rentStatus = "Overdue";
                        rentDelta = `Missed 10th deadline (Share: ₹${(roomSettings.rent / (users.length || 1)).toFixed(0)})!`;
                        rentColor = "bg-rose-500";
                      }
                    }

                    return (
                      <>
                        <StatCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} delta="Room spending" icon={DollarSign} colorClass="bg-indigo-500" />
                        <StatCard title="Your Net Balance" value={`₹${Math.abs(netBalance).toFixed(0)}`} delta={netBalance >= 0 ? "You are owed money" : (myChoreFines > 0 ? `You owe money (inc. ₹${myChoreFines} fines)` : "You owe money")} icon={DollarSign} colorClass={netBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"} />
                        <StatCard title="Your Split To Pay" value={`₹${totalDebt.toFixed(0)}`} delta="Explicit pending debt" icon={Clock} colorClass="bg-rose-500" />
                        <StatCard title="Rent Status" value={rentStatus} delta={rentDelta} icon={Home} colorClass={rentColor} onClick={() => setActiveTab('payments')} />
                      </>
                    )
                  })()}
                  <StatCard title="Chores Due" value={chores.filter(c => c.status !== 'completed').length} delta={`${chores.filter(c => c.status !== 'completed' && isOverdueIST(c.dueDate)).length} overdue (${chores.filter(c => c.status !== 'completed' && isOverdueIST(c.dueDate)).length * 20}₹ pending fines)`} icon={CheckSquare} colorClass="bg-amber-500" />
                  <StatCard title="Roommates" value={users.length} delta="All active" icon={UserIcon} colorClass="bg-indigo-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card title="Monthly Spending Overview" className="lg:col-span-2">
                    <div className="h-[300px]">
                      <Bar
                        data={(() => {
                          const monthlyData: Record<string, number> = {};
                          // Initialize last 4 months in IST
                          for (let i = 3; i >= 0; i--) {
                            const d = new Date();
                            d.setMonth(d.getMonth() - i);
                            const monthName = d.toLocaleString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });
                            monthlyData[monthName] = 0;
                          }

                          expenses.forEach(e => {
                            if (!e.createdAt) return;
                            const date = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
                            const monthName = date.toLocaleString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });
                            if (monthlyData[monthName] !== undefined) {
                              monthlyData[monthName] += e.amount;
                            }
                          });

                          return {
                            labels: Object.keys(monthlyData),
                            datasets: [{
                              label: 'Spending (₹)',
                              data: Object.values(monthlyData),
                              backgroundColor: '#6366f1',
                              borderRadius: 8,
                            }]
                          };
                        })()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                            x: { grid: { display: false }, ticks: { color: '#64748b' } }
                          }
                        }}
                      />
                    </div>
                  </Card>

                  <Card title="Room Insights" icon={Brain} className="bg-gradient-to-br from-[#15152a] to-[#1e1e38] border-indigo-500/20">
                    <div className="space-y-4">
                      {(() => {
                        const rentExpenseThisMonth = expenses.find(e => {
                          if (e.category?.toLowerCase() !== 'rent') return false;
                          const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
                          return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                        });

                        const overdueChores = chores.filter(c => c.status !== 'completed' && isOverdueIST(c.dueDate));

                        return (
                          <>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {rentExpenseThisMonth
                                  ? <><span className="text-emerald-400 font-bold">✅ Rent Logged:</span> The rent for this month (₹{rentExpenseThisMonth.amount}) was added by {users.find(u => u.uid === rentExpenseThisMonth.paidBy)?.name || 'a roommate'}. Great job staying on top of it!</>
                                  : <><span className="text-amber-400 font-bold">⚠️ Rent Missing:</span> If a rent payment was made, it hasn't been added to the system yet. Your room rent is configured at ₹{roomSettings.rent}.</>
                                }
                              </p>
                              {!rentExpenseThisMonth && (
                                <button onClick={() => { setActiveTab('expenses'); setShowExpenseModal(true); }} className="mt-3 w-full py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-bold rounded-lg transition-all border border-amber-500/20">
                                  + Log Rent Now
                                </button>
                              )}
                            </div>

                            {overdueChores.length > 0 && (
                              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  <span className="text-rose-400 font-bold">🚨 Action Required:</span> You have {overdueChores.length} overdue chores dragging down the room score!
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <button onClick={() => setActiveTab('ai')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        Ask AI Assistant
                      </button>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card title="Upcoming Chores" icon={CheckSquare}>
                    <div className="space-y-4">
                      {chores.filter(c => c.status !== 'completed').slice(0, 4).map(chore => {
                        const isOverdue = isOverdueIST(chore.dueDate);
                        const assignedUser = users.find(u => u.uid === chore.assignedTo);
                        return (
                          <div key={chore.id} className={cn("p-4 rounded-xl border transition-all", isOverdue ? "bg-rose-500/10 border-rose-500/20" : "bg-[#0a0a12] border-white/5 hover:border-indigo-500/30")}>
                            <div className="flex justify-between items-start mb-3">
                              <p className="text-sm font-bold text-white">{chore.title}</p>
                              {isOverdue && <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/20 px-2 py-0.5 rounded">Overdue</span>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                {assignedUser?.name[0] || '?'}
                              </div>
                              <p className="text-xs text-slate-300">
                                Assigned to <strong className="text-indigo-400 font-black">{assignedUser?.name || 'Someone'}</strong>
                              </p>
                            </div>
                            {chore.dueDate && (
                              <p className="text-[10px] items-center flex gap-1 font-medium text-slate-500">
                                ⏳ Due {formatIST(chore.dueDate)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      {chores.filter(c => c.status !== 'completed').length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 opacity-60">
                          <CheckSquare size={32} className="mb-2 text-emerald-400" />
                          <p className="text-xs font-bold text-emerald-400">All caught up on chores!</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card title="Recent Activity" icon={Clock}>
                    <div className="space-y-4">
                      {expenses.slice(0, 4).map(e => {
                        const isSettled = e.status === 'settled';
                        const userObj = users.find(u => u.uid === e.paidBy);
                        return (
                          <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", isSettled ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                              {userObj?.name[0] || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-200">
                                <strong>{userObj?.name || 'Someone'}</strong> {isSettled ? `settled ${e.description}` : `added ${e.description}`}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">
                                {formatIST(e.createdAt)} • {e.category}
                              </p>
                            </div>
                            <p className={cn("text-sm font-bold", isSettled ? "text-emerald-400" : "text-rose-400")}>
                              {isSettled ? '+' : '-'}₹{e.amount}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Who Owes Whom" icon={ShieldCheck}>
                    <div className="space-y-6">
                      {users.filter(u => u.uid !== user.uid).map(u => {
                        const owedToMe = expenses
                          .filter(e => e.paidBy === user.uid && e.splitWith.includes(u.uid) && e.status === 'pending')
                          .reduce((acc, e) => acc + (e.amount / e.splitWith.length), 0);
                        const iOwe = expenses
                          .filter(e => e.paidBy === u.uid && e.splitWith.includes(user.uid) && e.status === 'pending')
                          .reduce((acc, e) => acc + (e.amount / e.splitWith.length), 0);
                        const net = owedToMe - iOwe;
                        if (net === 0) return null;

                        return (
                          <div key={u.uid} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <div className="flex items-center gap-3">
                                <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.name}`} className="w-8 h-8 rounded-lg" alt="" />
                                <span className="text-sm font-medium text-slate-300">
                                  {net > 0 ? `${u.name} owes you` : `You owe ${u.name}`}
                                </span>
                              </div>
                              <span className={cn("text-sm font-bold", net > 0 ? "text-emerald-400" : "text-rose-400")}>
                                ₹{Math.abs(net).toFixed(0)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", net > 0 ? "bg-emerald-500" : "bg-rose-500")}
                                style={{ width: `${Math.min((Math.abs(net) / 5000) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Brain size={200} />
                  </div>
                  <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl font-black mb-4 tracking-tight">AI Roommate Insights</h2>
                    <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
                      Get smart analysis of your living patterns, expense splits, and conflict resolution suggestions powered by Gemini AI.
                    </p>
                  </div>
                </div>

                <Card title="Ask RoomBot" icon={MessageSquare} className="border-indigo-500/30">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {["Who hasn't paid rent?", "Analyze spending", "Chore status", "Suggest split"].map(q => (
                        <button
                          key={q}
                          onClick={() => askAI(q)}
                          className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-xs text-slate-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    <div className="min-h-[200px] bg-[#0a0a12] rounded-2xl p-6 border border-white/5 relative">
                      {isAiThinking ? (
                        <div className="flex items-center gap-3 text-indigo-400">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span className="text-sm font-medium">Thinking...</span>
                        </div>
                      ) : aiResponse ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{aiResponse}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 py-10">
                          <MessageSquare size={48} className="mb-4 opacity-20" />
                          <p className="text-sm">Ask me anything about your shared living space!</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <input
                        id="ai-prompt"
                        placeholder="Type your question here..."
                        className="flex-1 bg-[#15152a] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && askAI()}
                      />
                      <button
                        onClick={() => askAI()}
                        disabled={isAiThinking}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 rounded-2xl font-bold transition-all flex items-center gap-2"
                      >
                        <Send size={18} />
                        Ask
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Expense Management</h2>
                    <p className="text-sm text-slate-500">Track and split shared costs</p>
                  </div>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Expense
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pending Payments */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Pending Expenses</h3>
                    {expenses.filter(e => e.status === 'pending').length === 0 ? (
                      <div className="text-center py-10 bg-[#15152a] rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-sm">No pending expenses.</p>
                      </div>
                    ) : (
                      expenses.filter(e => e.status === 'pending').map(expense => {
                        const currentSplitWith = expense.splitWith || users.map(u => u.uid);
                        const splitAmount = expense.amount / currentSplitWith.length;
                        const isMyExpense = expense.paidBy === user?.uid;
                        const iOwe = !isMyExpense && currentSplitWith.includes(user?.uid || '');

                        return (
                          <Card key={expense.id} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                  <DollarSign size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-white">{expense.description}</h4>
                                  <p className="text-[10px] text-slate-500">Paid by {users.find(u => u.uid === expense.paidBy)?.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-white">₹{expense.amount}</p>
                              </div>
                            </div>

                            <div className="bg-[#0a0a12] rounded-xl p-3 border border-white/5 flex justify-between items-center">
                              <div className="text-xs text-slate-400">
                                Split exactly ₹{splitAmount.toFixed(0)} between {currentSplitWith.length}
                              </div>
                              <div className={cn("text-sm font-bold", isMyExpense ? "text-emerald-400" : (iOwe ? "text-rose-400" : "text-slate-500"))}>
                                {isMyExpense ? `You get back: ₹${(splitAmount * (currentSplitWith.length - 1)).toFixed(0)}` : (iOwe ? `Your share: ₹${splitAmount.toFixed(0)}` : 'Not involved')}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-2">
                              {(isMyExpense || iOwe || userProfile?.role === 'admin') && (
                                <button
                                  onClick={() => settleExpense(expense.id)}
                                  className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center"
                                >
                                  {isMyExpense ? 'Mark as Settled' : 'I Paid My Share'}
                                </button>
                              )}
                              {(userProfile?.role === 'admin' || isMyExpense) && (
                                <button onClick={() => deleteExpense(expense.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-all">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>

                  {/* Settlement History */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Settlement History</h3>
                    {expenses.filter(e => e.status === 'settled').length === 0 ? (
                      <div className="text-center py-10 bg-[#15152a] rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-sm">No settled expenses yet.</p>
                      </div>
                    ) : (
                      expenses.filter(e => e.status === 'settled').map(expense => (
                        <Card key={expense.id} className="opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-2 border-emerald-500/10">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <span className="text-sm font-bold text-white line-through decoration-emerald-500/50">{expense.description}</span>
                            </div>
                            <span className="text-sm font-black text-emerald-400">₹{expense.amount}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 ml-7">Paid and settled entirely by {users.find(u => u.uid === expense.paidBy)?.name}</p>
                          <p className="text-[9px] text-slate-600 mt-2 ml-7 uppercase tracking-wide">Finished on {formatIST(expense.createdAt)}</p>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'chores' && (
              <motion.div
                key="chores"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chore Board</h2>
                    <p className="text-sm text-slate-500">Assign and track household tasks</p>
                  </div>
                  <button
                    onClick={() => setShowChoreModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Assign Chore
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['pending', 'in-progress', 'completed'].map(status => (
                    <div key={status} className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          {status === 'pending' && <Clock size={14} className="text-amber-500" />}
                          {status === 'in-progress' && <Zap size={14} className="text-indigo-500" />}
                          {status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                          {status.replace('-', ' ')}
                        </h3>
                        <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-slate-500">
                          {chores.filter(c => c.status === status).length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[200px] bg-white/[0.02] rounded-2xl p-2 border border-dashed border-white/5">
                        {chores.filter(c => c.status === status).map(chore => {
                          const isOverdue = isOverdueIST(chore.dueDate);
                          const assignedUser = users.find(u => u.uid === chore.assignedTo);
                          return (
                            <Card key={chore.id} className={cn("p-4 cursor-pointer hover:translate-x-1 transition-all", isOverdue && status !== 'completed' ? "bg-rose-500/5 border-rose-500/20" : "")}>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className={cn("text-sm font-bold text-white", status === 'completed' && "line-through opacity-50")}>{chore.title}</h4>
                                {isOverdue && status !== 'completed' && (
                                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/20 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                    OVERDUE <span className="bg-rose-500 text-white px-1 rounded-sm shadow-md">-₹20 FINE</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                  {assignedUser?.name[0] || '?'}
                                </div>
                                <span className="text-[10px] text-slate-400">Assigned to <strong className={cn("font-bold", assignedUser?.uid === user?.uid ? "text-indigo-400" : "text-slate-300")}>{assignedUser?.uid === user?.uid ? 'You' : assignedUser?.name}</strong></span>
                              </div>

                              <div className="flex items-center justify-between">
                                {chore.dueDate && (
                                  <p className={cn("text-[10px] font-bold flex items-center gap-1", isOverdue && status !== 'completed' ? "text-rose-400" : "text-slate-500")}>
                                    ⏳ {formatIST(chore.dueDate)}
                                  </p>
                                )}
                                <div className="flex items-center gap-1">
                                  {status !== 'completed' && (
                                    <button
                                      onClick={() => updateChoreStatus(chore.id, status === 'pending' ? 'in-progress' : 'completed')}
                                      className={cn("px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold", status === 'pending' ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20")}
                                    >
                                      {status === 'pending' ? 'Start' : 'Finish'} <ChevronRight size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'agreements' && (
              <motion.div
                key="agreements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Roommate Agreements</h2>
                    <p className="text-sm text-slate-500">Digital contracts and house rules {userProfile?.role !== 'admin' && <span className="text-amber-500 font-bold ml-2">(View Only)</span>}</p>
                  </div>
                  {userProfile?.role === 'admin' && (
                    <button
                      onClick={() => saveAgreement((document.getElementById('agreement-editor') as HTMLTextAreaElement)?.value)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <Plus size={18} /> Save New Version
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <Card title="Agreement Editor" icon={FileText}>
                      <textarea
                        id="agreement-editor"
                        defaultValue={agreements[0]?.content || "# Roommate Agreement\n\n1. Rent is split equally.\n2. No loud music after 10 PM.\n3. Kitchen must be cleaned after use."}
                        readOnly={userProfile?.role !== 'admin'}
                        className={cn("w-full h-[400px] border border-white/5 rounded-2xl p-6 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all font-mono", userProfile?.role !== 'admin' ? "bg-white/5 cursor-not-allowed" : "bg-[#0a0a12]")}
                      />
                    </Card>
                  </div>
                  <div className="space-y-4">
                    <Card title="Version History" icon={Clock}>
                      <div className="space-y-3">
                        {agreements.map(agreement => (
                          <div key={agreement.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all">
                            <div>
                              <p className="text-sm font-bold text-white">{agreement.version}</p>
                              <p className="text-[10px] text-slate-500 mt-1">{new Date(agreement.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button className="p-2 text-slate-500 group-hover:text-indigo-400">
                              <Download size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Payment Center</h2>
                    <p className="text-sm text-slate-500">Settle up with your roommates</p>
                  </div>
                </div>

                {(() => {
                  const rentExpenseThisMonth = expenses.find(e => {
                    if (e.category?.toLowerCase() !== 'rent') return false;
                    const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
                    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                  });

                  if (rentExpenseThisMonth) {
                    return (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2">✅ Rent Completed</h3>
                          <p className="text-sm text-emerald-500/80 mt-1">The rent for this month (₹{roomSettings.rent}) has been successfully submitted to the system!</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 md:flex items-center justify-between space-y-4 md:space-y-0 mb-8">
                        <div>
                          <h3 className="text-rose-400 font-bold text-lg flex items-center gap-2">⚠️ Rent Due</h3>
                          <p className="text-sm text-rose-500/80 mt-1">You have to pay rent. Total outstanding base is ₹{roomSettings.rent} (Your target fraction: ₹{(roomSettings.rent / (users.length || 1)).toFixed(0)})</p>
                        </div>
                        <button onClick={() => { setActiveTab('expenses'); setShowExpenseModal(true); }} className="bg-rose-500 hover:bg-rose-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all text-sm w-full md:w-auto">
                          Register Rent Payment
                        </button>
                      </div>
                    );
                  }
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card title="Net Balances" icon={ShieldCheck}>
                    <div className="space-y-6">
                      {users.filter(u => u.uid !== user?.uid).map(u => {
                        const owedToMe = expenses
                          .filter(e => e.paidBy === user?.uid && (e.splitWith || users.map(u => u.uid)).includes(u.uid) && e.status === 'pending')
                          .reduce((acc, e) => acc + (e.amount / (e.splitWith || users.map(u => u.uid)).length), 0);
                        const iOwe = expenses
                          .filter(e => e.paidBy === u.uid && (e.splitWith || users.map(u => u.uid)).includes(user?.uid || '') && e.status === 'pending')
                          .reduce((acc, e) => acc + (e.amount / (e.splitWith || users.map(u => u.uid)).length), 0);

                        const net = owedToMe - iOwe;

                        return (
                          <div key={u.uid} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                {u.name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{u.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                                  {net > 0 ? 'Owes you' : net < 0 ? 'You owe' : 'Settled'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-lg font-black", net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-slate-500")}>
                                ₹{Math.abs(net).toFixed(0)}
                              </p>
                              {net !== 0 && (
                                <button
                                  onClick={() => showToast(`Reminder sent to ${u.name}!`)}
                                  className="text-[10px] font-bold text-indigo-400 hover:underline mt-1"
                                >
                                  Send Reminder
                                </button>
                              )}
                              {userProfile?.role === 'admin' && (
                                <button
                                  onClick={() => removeRoommate(u.uid)}
                                  className="text-[10px] font-bold text-rose-400 hover:underline mt-1 ml-2"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Quick Actions" icon={Zap}>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          const upiId = "roommate@upi"; // Dummy UPI ID
                          const amount = Math.abs(expenses.filter(e => e.status === 'pending').reduce((acc, e) => acc + (e.amount / e.splitWith.length), 0)).toFixed(0);
                          const upiUrl = `upi://pay?pa=${upiId}&pn=RoomMate&am=${amount}&cu=INR`;
                          showToast(`Opening UPI deep link: ${upiUrl}`);
                          // In a real app, window.location.href = upiUrl;
                          // But here we show a dummy QR code modal
                          setShowPaymentQR(true);
                        }}
                        className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col items-center gap-3 hover:bg-indigo-600/20 transition-all"
                      >
                        <CreditCard className="text-indigo-400" size={32} />
                        <span className="text-xs font-bold text-indigo-400">Pay via UPI</span>
                      </button>
                      <button
                        onClick={async () => {
                          const pending = expenses.filter(e => e.status === 'pending');
                          if (pending.length === 0) {
                            showToast('Everything is already settled!');
                            return;
                          }
                          try {
                            await Promise.all(pending.map(e => apiFetch(`/expenses/${e.id}/settle`, { method: 'PUT' })));
                            await fetchData();
                            showToast('All expenses settled!');
                          } catch (error) {
                            showToast('Failed to settle all', 'error');
                          }
                        }}
                        className="p-6 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex flex-col items-center gap-3 hover:bg-emerald-600/20 transition-all"
                      >
                        <DollarSign className="text-emerald-400" size={32} />
                        <span className="text-xs font-bold text-emerald-400">Settle All</span>
                      </button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <p className="text-sm text-slate-500">Manage your room and account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card title="Room Information" icon={Home}>
                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const name = formData.get('roomName') as string;
                      const rent = Number(formData.get('rent'));
                      const city = formData.get('city') as string;

                      try {
                        if (userProfile?.role !== 'admin') {
                          showToast('Only admins can update room settings', 'error');
                          return;
                        }
                        await apiFetch(`/rooms/${userProfile?.roomId}`, {
                          method: 'PUT',
                          body: JSON.stringify({ name, rent, city })
                        });
                        await fetchData();
                        showToast('Settings updated successfully!');
                      } catch (error) {
                        handleApiError(error, 'Update room settings');
                      }
                    }}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Room ID (Share this with roommates)</label>
                        <div className="flex gap-2">
                          <input readOnly value={userProfile?.roomId} className="flex-1 bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-indigo-400 font-mono" />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(userProfile?.roomId || '');
                              showToast('Room ID copied!');
                            }}
                            className="bg-white/5 hover:bg-white/10 px-4 rounded-xl border border-white/5 transition-all"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Room Name</label>
                        <input name="roomName" defaultValue={roomSettings.name} className="w-full bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Rent (₹)</label>
                        <input name="rent" type="number" defaultValue={roomSettings.rent} className="w-full bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">City</label>
                        <input name="city" defaultValue={roomSettings.city} className="w-full bg-[#0a0a12] border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50" />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all mt-4">
                        Save Changes
                      </button>
                    </form>
                  </Card>

                  <Card title="Account & Security" icon={ShieldCheck}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">Two-Factor Auth</p>
                          <p className="text-[10px] text-slate-500 mt-1">Secure your account</p>
                        </div>
                        <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-slate-500 rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">Email Notifications</p>
                          <p className="text-[10px] text-slate-500 mt-1">Get updates on expenses</p>
                        </div>
                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                      <button onClick={handleLogout} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-3 rounded-xl font-bold transition-all border border-rose-500/20 mt-4">
                        Sign Out
                      </button>
                      <button onClick={leaveRoom} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-3 rounded-xl font-bold transition-all border border-rose-500/20 mt-2">
                        Leave Room
                      </button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExpenseModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#15152a] border border-white/10 rounded-[32px] p-8 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight">Add Expense</h3>
                <button onClick={() => setShowExpenseModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={addExpense} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                  <input name="description" required placeholder="e.g. Electricity Bill" className="w-full bg-[#0a0a12] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount (₹)</label>
                    <input name="amount" type="number" required placeholder="0.00" className="w-full bg-[#0a0a12] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                    <select name="category" className="w-full bg-[#0a0a12] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50 appearance-none">
                      <option>Utilities</option>
                      <option>Rent</option>
                      <option>Food</option>
                      <option>Groceries</option>
                      <option>Entertainment</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Split With</label>
                  <div className="flex flex-wrap gap-3">
                    {users.map(u => (
                      <label key={u.uid} className="flex items-center gap-2 cursor-pointer bg-[#0a0a12] px-4 py-3 rounded-2xl hover:border-indigo-500/30 transition-all border border-white/5">
                        <input type="checkbox" name="splitWith" value={u.uid} defaultChecked className="w-4 h-4 rounded-lg bg-white/5 border-white/10 accent-indigo-500" />
                        <span className="text-sm font-bold text-slate-300">{u.uid === user?.uid ? 'You' : u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20">
                  Save Expense
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showChoreModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChoreModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#15152a] border border-white/10 rounded-[32px] p-8 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight">Assign Chore</h3>
                <button onClick={() => setShowChoreModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={addChore} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chore Title</label>
                  <input name="title" required placeholder="e.g. Kitchen Cleaning" className="w-full bg-[#0a0a12] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assign To</label>
                    <select name="assignedTo" className="w-full bg-[#0a0a12] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50 appearance-none">
                      {users.map(u => (
                        <option key={u.uid} value={u.uid}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date & Time</label>
                    <input name="dueDate" type="datetime-local" required className="w-full bg-[#0a0a12] border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20">
                  Assign Chore
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showPaymentQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentQR(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 relative z-10 shadow-2xl text-center"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Scan to Pay</h3>
                <button onClick={() => setShowPaymentQR(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("upi://pay?pa=roommate@upi&pn=RoomMate&cu=INR")}`}
                  alt="UPI QR Code"
                  className="mx-auto"
                />
              </div>
              <p className="text-sm text-slate-600 mb-2">Scan this QR code with any UPI app</p>
              <p className="text-xs font-bold text-indigo-600">UPI ID: roommate@upi</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 right-8 px-6 py-3 rounded-2xl shadow-2xl z-[200] flex items-center gap-3",
              toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
