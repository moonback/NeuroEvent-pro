import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Users, Truck, Package, Settings, Menu, Printer, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import MissionModal from '../MissionModal';
import { useAuthStore } from '../../store/auth';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Planning Global', to: '/', icon: Calendar },
  { name: 'Techniciens', to: '/technicians', icon: Users },
  { name: 'Camions', to: '/trucks', icon: Truck },
  { name: 'Matériel', to: '/equipment', icon: Package },
];

export function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen bg-[#fdfdfd] text-[#1e293b] font-sans print:h-auto print:bg-white print:block">
      {/* Header Section */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-[#e2e8f0] bg-white shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center text-white font-bold">E</div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">EVENTFLOW <span className="text-[#64748b] font-normal text-sm ml-2 uppercase tracking-widest hidden sm:inline">Planning v2.4</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handlePrint} className="p-2 text-[#64748b] hover:text-[#2563eb] transition-colors flex items-center space-x-2 border border-[#e2e8f0] rounded-md bg-[#f1f5f9]">
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Exporter PDF</span>
          </button>
          <div className="h-8 w-[1px] bg-[#e2e8f0] mx-2"></div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">
            <span>+ Nouvelle Mission</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Sidebar Navigation */}
        <aside className="w-56 bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col shrink-0 print:hidden">
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2 ml-2">Vues Principales</div>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-[#e2e8f0] text-[#2563eb] font-semibold'
                      : 'text-[#64748b] hover:bg-[#f1f5f9] font-medium'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'flex-shrink-0 h-4 w-4',
                        isActive ? 'opacity-100' : 'opacity-70'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
            
            <div className="pt-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2 ml-2">Outils & Exports</div>
            <NavLink to="/fiches" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive ? 'bg-[#e2e8f0] text-[#2563eb] font-semibold' : 'text-[#64748b] hover:bg-[#f1f5f9]')}>
              <span className={cn("opacity-70", "grayscale")}>📄</span> Fiches Mission
            </NavLink>
            <NavLink to="/stats" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive ? 'bg-[#e2e8f0] text-[#2563eb] font-semibold' : 'text-[#64748b] hover:bg-[#f1f5f9]')}>
              <span className={cn("opacity-70", "grayscale")}>📈</span> Statistiques
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive ? 'bg-[#e2e8f0] text-[#2563eb] font-semibold' : 'text-[#64748b] hover:bg-[#f1f5f9]')}>
              <Settings className="flex-shrink-0 h-4 w-4 opacity-70" /> Paramètres
            </NavLink>
          </nav>
          <div className="p-4 border-t border-[#e2e8f0] bg-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-xs font-bold text-[#0f172a] uppercase">
                  {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-[#0f172a] truncate">
                    {user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : (user?.email || 'Utilisateur')}
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">{user?.user_metadata?.role || 'Authentifié'}</span>
                </div>
              </div>
              <button onClick={() => signOut()} className="p-1.5 shrink-0 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded-md transition-colors" title="Déconnexion">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto flex flex-col bg-white print:p-0 print:overflow-visible print:block">
          <div className="flex-1 overflow-auto p-4 sm:p-6 print:p-0 print:overflow-visible">
            <Outlet />
          </div>
        </main>
      </div>

      <MissionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        missionId={null}
        initialDates={null}
      />
    </div>
  );
}
