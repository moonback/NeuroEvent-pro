/**
 * Utilitaires de formatage temporel partagés.
 * Centralise formatDuration (précédemment dupliqué dans TimeLogPanel et TechnicianHoursAdmin).
 */

/**
 * Formate la durée entre deux dates sous la forme "Xh00".
 * Si endTime est null, utilise la date courante (chrono en cours).
 */
export function formatDuration(startTime: Date, endTime: Date | null): string {
  const end = endTime || new Date();
  const diffMs = Math.max(0, end.getTime() - startTime.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

/**
 * Convertit un nombre de minutes en affichage "Xh00".
 */
export function minutesToDisplay(mins: number): string {
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`;
}

/**
 * Calcule le total de minutes pour un ensemble de créneaux.
 */
export function totalMinutesFor(logs: { startTime: Date; endTime: Date | null }[]): number {
  return logs.reduce((acc, l) => {
    const end = l.endTime || new Date();
    return acc + Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 60000));
  }, 0);
}

/**
 * Formate une Date en valeur compatible datetime-local (<input type="datetime-local">).
 */
export function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
