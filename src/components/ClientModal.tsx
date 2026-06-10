import React, { useState } from 'react';
import { useStore } from '../store';
import { Client } from '../types';
import Modal from './ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, la modale passe en mode édition (avec suppression possible). */
  client?: Client | null;
}

const inputClass = 'w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm';
const labelClass = 'block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1';

export default function ClientModal({ isOpen, onClose, client = null }: Props) {
  const addClient = useStore(state => state.addClient);
  const updateClient = useStore(state => state.updateClient);
  const deleteClient = useStore(state => state.deleteClient);

  const [name, setName] = useState(client?.name || '');
  const [contactName, setContactName] = useState(client?.contactName || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [address, setAddress] = useState(client?.address || '');
  const [notes, setNotes] = useState(client?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, contactName, email, phone, address, notes };
    if (client) {
      updateClient(client.id, data);
    } else {
      addClient(data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (client && window.confirm(`Supprimer le client « ${client.name} » ? Les missions associées seront conservées mais perdront le lien vers cette fiche.`)) {
      deleteClient(client.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Modifier le client' : 'Nouveau client'}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-between items-center">
          {client ? (
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
              Supprimer
            </button>
          ) : <div></div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">Annuler</button>
            <button type="submit" form="client-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">Enregistrer</button>
          </div>
        </div>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="client-name" className={labelClass}>Nom de l'entreprise / organisation</label>
          <input id="client-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Acme Corp" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client-contact" className={labelClass}>Personne de contact</label>
            <input id="client-contact" type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="ex: Marie Dupont" className={inputClass} />
          </div>
          <div>
            <label htmlFor="client-phone" className={labelClass}>Téléphone</label>
            <input id="client-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="ex: 06 12 34 56 78" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="client-email" className={labelClass}>Email</label>
          <input id="client-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ex: contact@acme.fr" className={inputClass} />
        </div>
        <div>
          <label htmlFor="client-address" className={labelClass}>Adresse</label>
          <input id="client-address" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="ex: 12 rue des Fêtes, 75019 Paris" className={inputClass} />
        </div>
        <div>
          <label htmlFor="client-notes" className={labelClass}>Notes internes</label>
          <textarea id="client-notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Accès, contraintes, historique..." className={inputClass} />
        </div>
      </form>
    </Modal>
  );
}
