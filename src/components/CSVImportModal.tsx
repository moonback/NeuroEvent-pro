import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Equipment, EquipmentCategory } from '../types';
import Modal from './ui/Modal';
import { Upload, AlertCircle, CheckCircle, FileText, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedProduct {
  id?: string;
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
  isUpdate: boolean;
}

// RFC 4180 compliant CSV parser
function parseCSV(content: string, delimiter: string = ';'): string[][] {
  const result: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField);
      if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
        result.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    result.push(currentRow);
  }
  
  return result;
}

export default function CSVImportModal({ isOpen, onClose }: Props) {
  const storeEquipment = useStore(state => state.equipment);
  const importEquipment = useStore(state => state.importEquipment);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        processFile(droppedFile);
      } else {
        setError('Veuillez sélectionner un fichier au format .csv');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    setError(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setError('Le fichier est vide.');
        return;
      }
      try {
        parseCSVContent(text);
      } catch (err: any) {
        setError(`Erreur lors de la lecture du fichier : ${err.message || err}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const parseCSVContent = (content: string) => {
    // Auto-detect delimiter from first line
    const firstLine = content.split(/\r?\n/)[0] || '';
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const allRows = parseCSV(content, delimiter);
    if (allRows.length < 2) {
      setError('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données.');
      return;
    }

    // Parse headers
    const headers = allRows[0].map(h => h.trim().toLowerCase());
    
    const idIdx = headers.findIndex(h => ['id', 'uuid', 'identifiant'].includes(h));
    const nameIdx = headers.findIndex(h => ['nom', 'name', 'title', 'titre', 'reference', 'référence'].includes(h));
    const qtyIdx = headers.findIndex(h => ['stock', 'total_quantity', 'quantite', 'quantité', 'quantity', 'totalquantity'].includes(h));
    const catIdx = headers.findIndex(h => ['categorie', 'catégorie', 'category'].includes(h));
    const subCatIdx = headers.findIndex(h => ['sous-categorie', 'sous-catégorie', 'subcategory'].includes(h));
    const subSubCatIdx = headers.findIndex(h => ['sous-sous-categorie', 'sous-sous-catégorie'].includes(h));

    if (nameIdx === -1) {
      setError('Impossible de trouver la colonne contenant le nom du matériel. Vérifiez l\'en-tête.');
      return;
    }

    // Prepare indices of existing products to differentiate updates and creations
    const existingIds = new Set(storeEquipment.map(e => e.id));
    const existingNames = new Map(storeEquipment.map(e => [e.name.toLowerCase().trim(), e.id]));

    const productsList: ParsedProduct[] = [];

    // Keyword mapping for categories
    const mapCategory = (catStr: string, subCatStr: string, subSubCatStr: string): EquipmentCategory => {
      const allTerms = `${catStr} ${subCatStr} ${subSubCatStr}`.toLowerCase();
      if (
        allTerms.includes('sono') || 
        allTerms.includes('micro') || 
        allTerms.includes('audio') || 
        allTerms.includes('enceinte') || 
        allTerms.includes('cable-triphase') || 
        allTerms.includes('distribution') || 
        allTerms.includes('boitier-electrique') || 
        allTerms.includes('cable triphas') ||
        allTerms.includes('boîtier électrique') ||
        allTerms.includes('alimentation')
      ) {
        return 'Sonorisation';
      }
      if (
        allTerms.includes('eclair') || 
        allTerms.includes('projecteur') || 
        allTerms.includes('lumiere') || 
        allTerms.includes('lumière') || 
        allTerms.includes('laser') || 
        allTerms.includes('led') || 
        allTerms.includes('blinder') || 
        allTerms.includes('lyre') ||
        allTerms.includes('boule à facette') ||
        allTerms.includes('showbar') ||
        allTerms.includes('spot')
      ) {
        return 'Éclairage';
      }
      if (
        allTerms.includes('scene') || 
        allTerms.includes('scène') || 
        allTerms.includes('praticable') || 
        allTerms.includes('structure-aluminium') || 
        allTerms.includes('structure aluminum') ||
        allTerms.includes('pupitre') || 
        allTerms.includes('pied-de-levage') ||
        allTerms.includes('pied de levage')
      ) {
        return 'Scène';
      }
      if (
        allTerms.includes('decor') || 
        allTerms.includes('décor') || 
        allTerms.includes('lumineux') || 
        allTerms.includes('mobilier') || 
        allTerms.includes('housse') || 
        allTerms.includes('nappe') || 
        allTerms.includes('tapis')
      ) {
        return 'Décoration';
      }
      if (
        allTerms.includes('jeux') || 
        allTerms.includes('arcade') || 
        allTerms.includes('gonflable') || 
        allTerms.includes('photobooth') || 
        allTerms.includes('simulation') || 
        allTerms.includes('selfie') || 
        allTerms.includes('billard') || 
        allTerms.includes('ping-pong') ||
        allTerms.includes('château') ||
        allTerms.includes('simulateur') ||
        allTerms.includes('borne')
      ) {
        return 'Arcade';
      }
      return 'Autre';
    };

    // Parse each line starting from row index 1
    for (let i = 1; i < allRows.length; i++) {
      const parsedFields = allRows[i];
      
      if (parsedFields.length === 0 || !parsedFields[nameIdx]?.trim()) {
        continue; // ignore empty or name-less lines
      }

      const name = parsedFields[nameIdx].trim();
      const rawId = idIdx !== -1 ? parsedFields[idIdx]?.trim() : '';
      const isValidId = rawId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

      const rawQty = qtyIdx !== -1 ? parsedFields[qtyIdx]?.trim() : '';
      let totalQuantity = parseInt(rawQty, 10);
      if (isNaN(totalQuantity) || totalQuantity < 0) {
        totalQuantity = 0;
      }

      const category = mapCategory(
        catIdx !== -1 ? parsedFields[catIdx] : '',
        subCatIdx !== -1 ? parsedFields[subCatIdx] : '',
        subSubCatIdx !== -1 ? parsedFields[subSubCatIdx] : ''
      );

      // Check if it already exists to define creation vs update
      let isUpdate = false;
      let idToUse: string | undefined = undefined;

      if (isValidId) {
        if (existingIds.has(rawId)) {
          isUpdate = true;
          idToUse = rawId;
        } else {
          // If valid UUID but not in DB, we still insert with that UUID
          idToUse = rawId;
        }
      } else {
        // Match by name if ID is missing or invalid
        const matchedId = existingNames.get(name.toLowerCase().trim());
        if (matchedId) {
          isUpdate = true;
          idToUse = matchedId;
        }
      }

      productsList.push({
        id: idToUse,
        name,
        category,
        totalQuantity,
        isUpdate
      });
    }

    if (productsList.length === 0) {
      setError('Aucun matériel valide n\'a pu être extrait du fichier.');
      return;
    }

    setParsedData(productsList);
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    try {
      await importEquipment(parsedData);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de l\'importation en base de données.');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Get statistics
  const total = parsedData.length;
  const updates = parsedData.filter(p => p.isUpdate).length;
  const creations = total - updates;

  const categoryCounts = parsedData.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importer un fichier CSV"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm disabled:opacity-50"
          >
            Annuler
          </button>
          {parsedData.length > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importation...
                </>
              ) : (
                <>
                  Confirmer l'importation ({total})
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erreur de traitement</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {parsedData.length === 0 ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-[#2563eb] bg-blue-50/50'
                : 'border-[#cbd5e1] hover:border-[#94a3b8] bg-[#f8fafc]'
            }`}
          >
            <div className="p-3 bg-white rounded-full shadow-sm border border-[#e2e8f0] mb-3 text-[#2563eb]">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-[#0f172a] text-sm mb-1">
              Glissez-déposez votre fichier CSV ici
            </p>
            <p className="text-xs text-[#64748b] mb-4">
              ou cliquez pour parcourir vos dossiers (format .csv uniquement)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleButtonClick}
              className="px-4 py-2 bg-[#0f172a] text-white rounded-md text-xs font-semibold hover:bg-black transition-colors"
            >
              Sélectionner un fichier
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#0f172a]">{file?.name}</p>
                  <p className="text-xs text-[#64748b]">{(file?.size ? (file.size / 1024).toFixed(1) : 0)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setError(null);
                }}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Changer de fichier
              </button>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-center">
                <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Total trouvé</span>
                <span className="text-2xl font-extrabold text-blue-900">{total}</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-center">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">À créer</span>
                <span className="text-2xl font-extrabold text-emerald-900">{creations}</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-center">
                <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">À mettre à jour</span>
                <span className="text-2xl font-extrabold text-amber-900">{updates}</span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
              <span className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Distribution par catégorie</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-white border-[#e2e8f0] text-[#0f172a]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {cat} : <strong className="text-blue-700">{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">Aperçu des données (premiers 20 éléments)</span>
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-bold uppercase tracking-wider">
                      <th className="px-4 py-2.5">Matériel</th>
                      <th className="px-4 py-2.5">Catégorie détectée</th>
                      <th className="px-4 py-2.5 text-right">Stock</th>
                      <th className="px-4 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {parsedData.slice(0, 20).map((prod, idx) => (
                      <tr key={idx} className="hover:bg-[#f8fafc]/50">
                        <td className="px-4 py-2.5 font-medium text-[#0f172a] truncate max-w-[200px]" title={prod.name}>
                          {prod.name}
                        </td>
                        <td className="px-4 py-2.5 text-[#64748b]">
                          {prod.category}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-[#0f172a]">
                          {prod.totalQuantity}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {prod.isUpdate ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Mise à jour
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Création
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 20 && (
                <p className="text-[10px] text-right text-[#64748b] font-medium italic">
                  + {total - 20} autres éléments non affichés dans l'aperçu
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
