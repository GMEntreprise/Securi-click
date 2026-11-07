import type {
  HistoryDetail,
  HistoryEntry,
  HistoryService,
} from '@/features/parent/services/history.service';
import { demoUnavailable, readWorld, writeWorld } from './world';

function matchesSearch(entry: HistoryEntry, search: string): boolean {
  const haystack = [
    entry.child?.first_name,
    entry.child?.last_name,
    entry.guardian?.first_name,
    entry.guardian?.last_name,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(search.trim().toLowerCase());
}

function inMonth(entry: HistoryEntry, year: number, month: number): boolean {
  const date = new Date(entry.scanned_at);
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

function setMonthArchived(
  year: number,
  month: number,
  archived: boolean
): number {
  const targets = readWorld().history.filter(
    entry => inMonth(entry, year, month) && entry.is_archived !== archived
  );
  const ids = new Set(targets.map(entry => entry.id));
  const archivedAt = archived ? new Date().toISOString() : null;
  writeWorld(world => ({
    ...world,
    history: world.history.map(entry =>
      ids.has(entry.id)
        ? { ...entry, is_archived: archived, archived_at: archivedAt }
        : entry
    ),
  }));
  return targets.length;
}

export const demoHistoryService: HistoryService = {
  async fetchPage(_parentId, filters, cursor, pageSize = 30) {
    const matching = readWorld()
      .history.filter(entry => filters.showArchived || !entry.is_archived)
      .filter(entry => !filters.status || entry.status === filters.status)
      .filter(entry => !filters.childId || entry.child_id === filters.childId)
      .filter(entry => !cursor || entry.scanned_at < cursor)
      .sort((a, b) => b.scanned_at.localeCompare(a.scanned_at));
    const items = matching.slice(0, pageSize);
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: items.length === pageSize && last ? last.scanned_at : null,
      total: matching.length,
    };
  },

  async fetchDetail(entryId) {
    const world = readWorld();
    const entry = world.history.find(item => item.id === entryId);
    if (!entry) throw demoUnavailable();
    const detail: HistoryDetail = {
      ...entry,
      device_info: null,
      school: {
        name: world.school.name,
        address: world.school.address,
        city: world.school.city,
      },
    };
    return detail;
  },

  async fetchMonthlyCounts() {
    const counts = new Map<
      string,
      { year: number; month: number; count: number; archived_count: number }
    >();
    for (const entry of readWorld().history) {
      const date = new Date(entry.scanned_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      const current = counts.get(key) ?? {
        year,
        month,
        count: 0,
        archived_count: 0,
      };
      if (entry.is_archived) current.archived_count += 1;
      else current.count += 1;
      counts.set(key, current);
    }
    return [...counts.values()];
  },

  async pinEntry(entryId, pinned) {
    writeWorld(world => ({
      ...world,
      history: world.history.map(entry =>
        entry.id === entryId ? { ...entry, is_pinned: pinned } : entry
      ),
    }));
  },

  async archiveMonth(_parentId, year, month) {
    return setMonthArchived(year, month, true);
  },

  async restoreMonth(_parentId, year, month) {
    return setMonthArchived(year, month, false);
  },

  async searchEntries(_parentId, search, limit = 20) {
    return readWorld()
      .history.filter(entry => matchesSearch(entry, search))
      .slice(0, limit);
  },
};
