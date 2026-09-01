import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Pause, 
  Play 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { eventsApi } from '../../services/api';
import { SystemEventItem } from '../../types';

export const EventStreamView: React.FC = () => {
  const { refreshKey } = useApp();
  const [events, setEvents] = useState<SystemEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('All');
  const [isLive, setIsLive] = useState<boolean>(true);

  useEffect(() => {
    fetchEvents();
    let interval: any = null;
    if (isLive) {
      interval = setInterval(fetchEvents, 3000);
    }
    return () => clearInterval(interval);
  }, [eventTypeFilter, isLive, refreshKey]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.list({
        event_type: eventTypeFilter !== 'All' ? eventTypeFilter : undefined,
        limit: 100
      });
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch event stream:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Usage Events
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live stream of billing metrics, scaling operations, and ML anomaly detector events.
          </p>
        </div>

        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isLive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isLive ? 'Streaming Live' : 'Paused'}</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {['All', 'ANOMALY_DETECTED', 'AI_ANALYSIS', 'USAGE_EVENT', 'RECOMMENDATION', 'SCHEDULER_DECISION'].map((t) => (
          <button
            key={t}
            onClick={() => setEventTypeFilter(t)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              eventTypeFilter === t
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Stream List */}
      <div className="space-y-2">
        {loading && events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
            No events found.
          </div>
        ) : (
          events.map((ev) => {
            const isAnomaly = ev.event_type === 'ANOMALY_DETECTED';
            const isAI = ev.event_type === 'AI_ANALYSIS';
            const isRec = ev.event_type === 'RECOMMENDATION';

            const textColor = isAnomaly
              ? 'text-rose-400'
              : isAI
              ? 'text-emerald-400'
              : isRec
              ? 'text-amber-400'
              : 'text-slate-400';

            return (
              <div
                key={ev.id}
                className="p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${textColor} shrink-0`}>
                    {ev.event_type}
                  </span>
                  <p className="text-slate-300 font-medium">
                    {ev.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono shrink-0">
                  {ev.service && <span>{ev.service}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
