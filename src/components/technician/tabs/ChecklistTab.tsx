import React, { useState, useEffect } from 'react';
import { Truck as TruckIcon, Wrench, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { triggerVibrate } from '../useTechDashboard';
import { useAuthStore } from '../../../store/auth';
import { InfoCard } from './InfoCard';

interface ChecklistItem {
  id: string;
  label: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  items: ChecklistItem[];
}

interface ChecklistTabProps {
  mission: any;
}

export default function ChecklistTab({ mission }: ChecklistTabProps) {
  const user = useAuthStore(state => state.user);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string | null>('prep');

  const sections: ChecklistSection[] = [
    {
      id: 'prep',
      title: 'Avant la mission',
      subtitle: 'Préparation & Départ',
      icon: <TruckIcon className="w-4 h-4" />,
      color: '#4d9fff', // blue
      items: [
        { id: 'prep_route', label: "Consulter l'itinéraire, l'adresse et les consignes" },
        { id: 'prep_equip', label: 'Contrôler le matériel chargé par rapport à la liste' },
        { id: 'prep_epi', label: "S'équiper des EPI (chaussures de sécurité, gants...)" },
        { id: 'prep_vehicle', label: 'Vérifier le véhicule (niveaux, carburant, pneus)' },
        { id: 'prep_docs', label: 'Récupérer les documents de livraison' }
      ]
    },
    {
      id: 'setup',
      title: 'Pendant la mission',
      subtitle: 'Sur place & Installation',
      icon: <Wrench className="w-4 h-4" />,
      color: '#ffb700', // orange
      items: [
        { id: 'site_contact', label: 'Prendre contact avec le responsable sur place' },
        { id: 'site_safety', label: 'Sécuriser la zone de montage' },
        { id: 'site_setup', label: "Réaliser l'installation technique (montage/câblage)" },
        { id: 'site_tests', label: "Tester les équipements de sonorisation / d'éclairage" },
        { id: 'site_clean', label: 'Nettoyer et ranger la zone après installation' }
      ]
    },
    {
      id: 'cleanup',
      title: 'Après la mission',
      subtitle: 'Clôture & Restitutions',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: '#00e5a0', // green
      items: [
        { id: 'end_reception', label: 'Valider le bon fonctionnement final avec le client' },
        { id: 'end_signature', label: "Faire signer le bon technique dans l'application" },
        { id: 'end_photos', label: 'Prendre des photos du rendu de la prestation' },
        { id: 'end_report', label: 'Saisir le rapport technique (onglet Rapport)' },
        { id: 'end_return', label: 'Restituer les clés et signaler toute anomalie véhicule' }
      ]
    }
  ];

  useEffect(() => {
    if (user?.id && mission.id) {
      const saved = localStorage.getItem(`eventflow_checklist_${user.id}_${mission.id}`);
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch {}
      }
    }
  }, [user?.id, mission.id]);

  const toggleItem = (itemId: string) => {
    triggerVibrate('click');
    const updated = { ...checkedItems, [itemId]: !checkedItems[itemId] };
    setCheckedItems(updated);
    if (user?.id && mission.id) {
      localStorage.setItem(`eventflow_checklist_${user.id}_${mission.id}`, JSON.stringify(updated));
    }
  };

  const checkAllSection = (sectionId: string, items: { id: string }[]) => {
    const allChecked = items.every(item => checkedItems[item.id]);
    const updated = { ...checkedItems };
    items.forEach(item => {
      updated[item.id] = !allChecked;
    });
    setCheckedItems(updated);
    triggerVibrate(allChecked ? 'click' : 'success');
    if (user?.id && mission.id) {
      localStorage.setItem(`eventflow_checklist_${user.id}_${mission.id}`, JSON.stringify(updated));
    }
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const checkedCount = sections.reduce((acc, s) => acc + s.items.filter(i => checkedItems[i.id]).length, 0);
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const isFinished = percent === 100;

  return (
    <div className="space-y-3 tech-stagger">
      <InfoCard>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Checklist Mission</h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                Toutes les étapes indispensables à valider
              </p>
            </div>
            <div className="text-right">
              <span
                className="text-2xl font-black transition-all"
                style={{ color: isFinished ? 'var(--tech-accent)' : mission.color }}
              >
                {percent}%
              </span>
              <div className="text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                {checkedCount}/{totalItems}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="tech-progress-track">
            <div
              className="tech-progress-fill"
              style={{
                width: `${percent}%`,
                background: isFinished
                  ? 'linear-gradient(90deg, var(--tech-accent), var(--tech-accent-dim))'
                  : `linear-gradient(90deg, ${mission.color}, ${mission.color}aa)`,
                boxShadow: isFinished ? '0 0 10px rgba(0,229,160,0.4)' : 'none',
              }}
            />
          </div>
        </div>
      </InfoCard>

      {sections.map((sec) => {
        const isOpen = activeSection === sec.id;
        const secCheckedCount = sec.items.filter(i => checkedItems[i.id]).length;
        const isSecDone = secCheckedCount === sec.items.length;

        return (
          <InfoCard key={sec.id}>
            <div
              onClick={() => {
                triggerVibrate('click');
                setActiveSection(isOpen ? null : sec.id);
              }}
              className="px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors hover:bg-white/[0.015]"
              tabIndex={0}
              role="button"
              aria-expanded={isOpen}
              aria-label={`${sec.title}. ${secCheckedCount} éléments sur ${sec.items.length} validés.`}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setActiveSection(isOpen ? null : sec.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isSecDone ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)',
                    color: isSecDone ? 'var(--tech-accent)' : 'var(--tech-text-muted)'
                  }}
                >
                  {sec.icon}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs" style={{ color: 'var(--tech-text)' }}>{sec.title}</h4>
                  <p className="text-[9px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>{sec.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                  style={{
                    background: isSecDone ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)',
                    color: isSecDone ? 'var(--tech-accent)' : 'var(--tech-text-secondary)'
                  }}
                >
                  {secCheckedCount}/{sec.items.length}
                </span>
                <ChevronRight
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{
                    color: 'var(--tech-text-muted)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}
                />
              </div>
            </div>

            {isOpen && (
              <div className="p-1 space-y-1">
                <div className="px-3 py-1 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      checkAllSection(sec.id, sec.items);
                    }}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all hover:bg-white/5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ color: isSecDone ? sec.color : 'var(--tech-accent)' }}
                  >
                    {isSecDone ? 'Décocher tout' : 'Tout cocher'}
                  </button>
                </div>

                <ul>
                  {sec.items.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <li
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="px-3 py-2.5 flex items-center gap-3 cursor-pointer rounded-xl transition-all"
                        style={{
                          background: isChecked ? 'rgba(0,229,160,0.03)' : 'transparent',
                        }}
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={isChecked}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleItem(item.id);
                          }
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
                          style={
                            isChecked
                              ? {
                                  background: 'var(--tech-accent)',
                                  borderColor: 'var(--tech-accent)',
                                  boxShadow: '0 0 6px rgba(0,229,160,0.3)',
                                }
                              : { borderColor: 'var(--tech-border-strong)', background: 'transparent' }
                          }
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </div>

                        <span
                          className={`text-xs font-semibold leading-snug flex-1 ${
                            isChecked ? 'line-through text-opacity-40' : ''
                          }`}
                          style={{ color: isChecked ? 'var(--tech-text-muted)' : 'var(--tech-text)' }}
                        >
                          {item.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </InfoCard>
        );
      })}
    </div>
  );
}
