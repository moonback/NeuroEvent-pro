import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Calendar, Users, Truck, Package, Settings, Menu, Printer, LogOut,
  Building2, UserCog, FileText, BarChart3, Plus, Timer
} from 'lucide-react';
import { cn } from '../../lib/utils';
import MissionModal from '../MissionModal';
import { useAuthStore } from '../../store/auth';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  end?: boolean;
}

const mainNavigation: NavItem[] = [
  { name: 'Planning Global', to: '/', icon: Calendar, end: true },
  { name: 'Tableau Kanban', to: '/kanban', icon: Package },
  { name: 'Techniciens', to: '/technicians', icon: Users },
  { name: 'Camions', to: '/trucks', icon: Truck },
  { name: 'Matériel', to: '/equipment', icon: Package },
];

const managementNavigation: NavItem[] = [
  { name: 'Clients', to: '/clients', icon: Building2 },
  { name: 'Utilisateurs', to: '/users', icon: UserCog },
];

const toolsNavigation: NavItem[] = [
  { name: 'Fiches Mission', to: '/fiches', icon: FileText },
  { name: 'Heures Techniciens', to: '/heures', icon: Timer },
  { name: 'Statistiques', to: '/stats', icon: BarChart3 },
  { name: 'Paramètres', to: '/settings', icon: Settings },
];

export function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore(state => state.user);
  const role = useAuthStore(state => state.role);
  const signOut = useAuthStore(state => state.signOut);

  const handlePrint = () => {
    window.print();
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.name}
      to={item.to}
      end={item.end}
      onClick={() => setSidebarOpen(false)}
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
            className={cn('flex-shrink-0 h-4 w-4', isActive ? 'opacity-100' : 'opacity-70')}
            aria-hidden="true"
          />
          {item.name}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="flex flex-col h-screen bg-[#fdfdfd] text-[#1e293b] font-sans print:h-auto print:bg-white print:block">
      {/* Header Section */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[#e2e8f0] bg-white shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(open => !open)}
            className="md:hidden p-2 -ml-2 text-[#64748b] hover:text-[#0f172a] rounded-md"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center text-white font-bold">E</div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">NeuroEvent<span className="text-[#64748b] font-normal text-sm ml-2 uppercase tracking-widest hidden sm:inline">Planning v2.4</span></h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={handlePrint} className="p-2 text-[#64748b] hover:text-[#2563eb] transition-colors flex items-center space-x-2 border border-[#e2e8f0] rounded-md bg-[#f1f5f9]">
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Exporter PDF</span>
          </button>
          <div className="h-8 w-[1px] bg-[#e2e8f0] mx-1 sm:mx-2 hidden sm:block"></div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#0f172a] text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">
            <Plus className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">+ Nouvelle Mission</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Voile mobile lorsque le menu est ouvert */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 bg-black/30 z-30 md:hidden print:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={cn(
            'w-64 md:w-56 bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col shrink-0 print:hidden',
            'fixed md:static top-16 bottom-0 left-0 z-40 transition-transform duration-200 md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-2 ml-2">Vues Principales</div>
            {mainNavigation.map(renderNavItem)}

            <div className="pt-6 text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-2 ml-2">Gestion</div>
            {managementNavigation.map(renderNavItem)}

            <div className="pt-6 text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-2 ml-2">Outils & Exports</div>
            {toolsNavigation.map(renderNavItem)}
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
                  <span className="text-[10px] text-[#64748b]">{role || 'Authentifié'}</span>
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

      {/* Monté uniquement à l'ouverture : l'état du formulaire repart de zéro à chaque fois */}
      {isModalOpen && (
        <MissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          missionId={null}
          initialDates={null}
        />
      )}
    </div>
  );
}
