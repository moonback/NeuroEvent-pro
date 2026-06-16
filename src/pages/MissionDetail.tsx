import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ClipboardList,
  ChevronRight,
  Truck,
  Package,
  Camera,
  AlertTriangle,
  FileText,
  Image as LucideImage,
  Lock,
  ZoomIn,
} from 'lucide-react';
import { UserAvatar } from '../components/ui/UserAvatar';
import ImageLightbox from '../components/ui/ImageLightbox';
import MissionModal from '../components/MissionModal';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Planifiée': return { color: '#2563eb', bg: '#eff6ff', label: 'Planifiée' };
    case 'En cours': return { color: '#d97706', bg: '#fffbeb', label: 'En cours' };
    case 'Terminée': return { color: '#059669', bg: '#ecfdf5', label: 'Terminée' };
    default: return { color: '#64748b', bg: '#f8fafc', label: status };
  }
};

export default function MissionDetail() {
  const { id } = useParams<{ id?: string }>();
  const missions = useStore(state => state.missions);
  const technicians = useStore(state => state.technicians);
  const trucks = useStore(state => state.trucks);
  const equipment = useStore(state => state.equipment);
  const clients = useStore(state => state.clients);
  const fetchMissionPhotos = useStore(state => state.fetchMissionPhotos);
  const deleteMission = useStore(state => state.deleteMission);
  const [editOpen, setEditOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; urls: string[]; index: number }>({ open: false, urls: [], index: 0 });
  const navigate = useNavigate();

  const mission = useMemo(
    () => (id ? missions.find((missionItem) => missionItem.id === id) : undefined),
    [id, missions]
  );

  useEffect(() => {
    if (mission && !Array.isArray(mission.photos)) {
      fetchMissionPhotos(mission.id).catch(() => undefined);
    }
  }, [mission?.id, mission?.photos, fetchMissionPhotos]);

  if (!mission) {
    return (
      <div className="h-full p-6 flex flex-col items-start gap-4 bg-white shadow-sm rounded-3xl">
        <div className="flex items-center gap-3 text-sm text-[#2563eb]">
          <ArrowLeft className="w-4 h-4" />
          <Link to="/missions" className="font-semibold hover:underline">Retour à la liste des missions</Link>
        </div>
        <div className="rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-8 w-full">
          <h1 className="text-xl font-bold text-[#0f172a]">Mission introuvable</h1>
          <p className="text-sm text-[#64748b]">La mission demandée n'existe pas ou a été supprimée.</p>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(mission.status);
  const truck = mission.truckId ? trucks.find((t) => t.id === mission.truckId) : undefined;
  const client = mission.clientId ? clients.find((c) => c.id === mission.clientId) : undefined;
  const techList = mission.technicianIds
    .map((tid) => technicians.find((tech) => tech.id === tid))
    .filter(Boolean);
  const allPhotos = [
    ...(mission.photos || []),
    ...(mission.photoBeforeUrl ? [{ id: 'legacy-before', missionId: mission.id, type: 'before', url: mission.photoBeforeUrl, filePath: '', uploadedBy: null, createdAt: new Date() }] : []),
    ...(mission.photoAfterUrl ? [{ id: 'legacy-after', missionId: mission.id, type: 'after', url: mission.photoAfterUrl, filePath: '', uploadedBy: null, createdAt: new Date() }] : []),
  ];
  const beforePhotos = allPhotos.filter((photo) => photo.type === 'before');
  const afterPhotos = allPhotos.filter((photo) => photo.type === 'after');

  const handleDelete = async () => {
    if (window.confirm(`Supprimer la mission « ${mission.title} » ? Cette action est définitive.`)) {
      await deleteMission(mission.id);
      navigate('/missions');
    }
  };

  const openLightbox = (urls: string[], index: number) =>
    setLightbox({ open: true, urls, index });
  const closeLightbox = () => setLightbox((prev) => ({ ...prev, open: false }));

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#0f172a]">
            <Link to="/missions" className="inline-flex items-center gap-2 text-sm text-[#2563eb] hover:underline">
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </Link>
            <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#2563eb] uppercase tracking-[0.15em]">
              {status.label}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">{mission.title}</h1>
          <p className="text-sm text-[#64748b]">{client ? client.name : mission.client} — {mission.type}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={mission.status === 'Terminée'}
            className={mission.status === 'Terminée' ? 'inline-flex items-center gap-2 rounded-full bg-[#94a3b8] px-4 py-2 text-sm font-semibold text-white shadow-sm cursor-not-allowed' : 'inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors'}
          >
            {mission.status === 'Terminée' ? (
              <>
                <Lock className="w-4 h-4" /> Mission verrouillée
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" /> Modifier
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={mission.status === 'Terminée'}
            className={mission.status === 'Terminée' ? 'inline-flex items-center gap-2 rounded-full border border-[#f1f5f9] bg-white px-4 py-2 text-sm font-semibold text-[#cbd5e1] cursor-not-allowed' : 'inline-flex items-center gap-2 rounded-full border border-[#f1f5f9] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fef2f2] transition-colors'}
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">Détails de la mission</div>
                <h2 className="mt-2 text-xl font-bold text-[#0f172a]">Informations principales</h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{mission.status}</span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#475569] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Période</div>
                    <div className="mt-1 text-sm text-[#0f172a]">
                      {format(mission.start, 'dd MMM yyyy HH:mm', { locale: fr })}
                      <br />
                      {format(mission.end, 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#475569] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Adresse</div>
                    <div className="mt-1 text-sm text-[#0f172a]">{mission.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#475569] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Techniciens</div>
                    <div className="mt-1 text-sm text-[#0f172a] space-y-1.5">
                      {techList.length > 0 ? (
                        techList.map((tech) => (
                          <div key={tech!.id} className="flex items-center gap-2">
                            <UserAvatar
                              src={tech!.avatarUrl}
                              name={`${tech!.firstName} ${tech!.lastName}`}
                              size="xs"
                              shape="circle"
                              variant="emerald"
                              className="w-5 h-5 text-[9px]"
                            />
                            <span>
                              {tech!.firstName} {tech!.lastName}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[#64748b] italic">Aucun technicien assigné</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#475569] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Véhicule</div>
                    <div className="mt-1 text-sm text-[#0f172a]">{truck ? `${truck.name} (${truck.plate})` : 'Aucun camion attribué'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#475569] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Livraison / Reprise</div>
                    <div className="mt-1 text-sm text-[#0f172a] space-y-1">
                      <div>{mission.deliveryDate ? format(mission.deliveryDate, 'dd MMM yyyy HH:mm', { locale: fr }) : 'Non définie'}</div>
                      <div>{mission.pickupDate ? format(mission.pickupDate, 'dd MMM yyyy HH:mm', { locale: fr }) : 'Non définie'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-[#475569] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Durée de montage</div>
                    <div className="mt-1 text-sm text-[#0f172a]">{mission.setupDuration ? `${mission.setupDuration} min` : 'Non renseignée'}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#0f172a]">
              <Package className="w-5 h-5" />
              <h2 className="text-lg font-bold">Produits / Matériel</h2>
            </div>
            <div className="mt-4 overflow-hidden rounded-3xl border border-[#e2e8f0] bg-[#f8fafc]">
              <table className="min-w-full text-sm text-left">
                <thead className="border-b border-[#e2e8f0] bg-white">
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#64748b]">Qté</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#64748b]">Produit</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#64748b]">Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {mission.equipments.length > 0 ? (
                    mission.equipments.map((item, index) => {
                      const equipmentItem = equipment.find((eq) => eq.id === item.equipmentId);
                      return (
                        <tr key={`${item.equipmentId}-${index}`} className="border-b border-[#e2e8f0] last:border-none">
                          <td className="px-4 py-3 font-semibold text-[#0f172a]">{item.quantity}</td>
                          <td className="px-4 py-3 text-[#334155]">{equipmentItem?.name || 'Matériel inconnu'}</td>
                          <td className="px-4 py-3 text-[#64748b]">{equipmentItem?.category || '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-[#64748b]">Aucun produit ajouté à cette mission.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#0f172a]">
                <Camera className="w-5 h-5" />
                <h3 className="text-lg font-bold">Photos</h3>
              </div>
              <div className="mt-4 space-y-5">
                {beforePhotos.length > 0 && (
                  <div>
                    <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[#94a3b8]">Avant</div>
                    <div className="grid grid-cols-2 gap-3">
                      {beforePhotos.map((photo, idx) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => openLightbox(beforePhotos.map(p => p.url), idx)}
                          className="group overflow-hidden rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] text-left"
                        >
                          <div className="relative">
                            <img src={photo.url} alt="Photo avant" className="h-40 w-full object-cover transition-transform group-hover:scale-[1.03]" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {afterPhotos.length > 0 && (
                  <div>
                    <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[#94a3b8]">Après</div>
                    <div className="grid grid-cols-2 gap-3">
                      {afterPhotos.map((photo, idx) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => openLightbox(afterPhotos.map(p => p.url), idx)}
                          className="group overflow-hidden rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] text-left"
                        >
                          <div className="relative">
                            <img src={photo.url} alt="Photo après" className="h-40 w-full object-cover transition-transform group-hover:scale-[1.03]" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {beforePhotos.length === 0 && afterPhotos.length === 0 && (
                  <p className="text-sm text-[#64748b]">Aucune photo terrain enregistrée pour cette mission.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#0f172a]">
                <LucideImage className="w-5 h-5" />
                <h3 className="text-lg font-bold">Signature</h3>
              </div>
              <div className="mt-4 min-h-[10rem] rounded-3xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-6 flex items-center justify-center">
                {mission.signatureUrl ? (
                  <img src={mission.signatureUrl} alt="Signature client" className="max-h-64 object-contain" />
                ) : (
                  <p className="text-sm text-[#64748b]">Aucune signature disponible.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#0f172a]">
              <FileText className="w-5 h-5" />
              <h3 className="text-lg font-bold">Rapport</h3>
            </div>
            <div className="mt-4 rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-6 min-h-[10rem] text-sm leading-6 text-[#334155]">
              {mission.report ? mission.report : <span className="text-[#64748b]">Aucun rapport de fin de mission enregistré.</span>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-[#0f172a]">
              <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              <h3 className="text-lg font-bold">Résumé</h3>
            </div>
            <div className="mt-6 space-y-4 text-sm text-[#334155]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748b]">Client</span>
                <span>{client ? client.name : mission.client}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748b]">Type</span>
                <span>{mission.type}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748b]">Statut</span>
                <span>{mission.status}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748b]">Techniciens</span>
                <span>{mission.technicianIds.length || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748b]">Camion</span>
                <span>{truck ? truck.name : '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748b]">Photos</span>
                <span>{allPhotos.length}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {editOpen && (
        <MissionModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          missionId={mission.id}
        />
      )}

      {lightbox.open && (
        <ImageLightbox
          isOpen={lightbox.open}
          onClose={closeLightbox}
          index={lightbox.index}
          urls={lightbox.urls}
          onIndexChange={(next) =>
            setLightbox((prev) => ({ ...prev, index: next }))
          }
        />
      )}
    </div>
  );
}
