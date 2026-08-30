import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Bot, BrainCircuit, ChevronDown, Clock3, Layers3, Minimize2, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EducationalVideo } from '@/lib/videoSearch';
import { loadVideoNotes, loadVideoStates, removeVideoNote, saveVideoNote, saveVideoState, type VideoNote } from '@/lib/videoProgress';
import { recordStudyAction } from '@/lib/studyProgress';

type YTPlayer = {
  getCurrentTime: () => number; getDuration: () => number; seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void; pauseVideo: () => void; destroy: () => void; getPlayerState: () => number;
};
type YTWindow = Window & {
  YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer; PlayerState: { PLAYING: number; ENDED: number } };
  onYouTubeIframeAPIReady?: () => void;
};

const text = {
  ar: { notes: 'ملاحظات الفيديو', notePlaceholder: 'اكتب ملاحظة مرتبطة بهذه اللحظة…', add: 'حفظ الملاحظة', bookmark: 'حفظ اللحظة', favorite: 'إضافة الفيديو للمفضلة', ask: 'اسأل فَهيم عن هذه اللحظة', quiz: 'اختبار من الفيديو', flashcards: 'بطاقات مراجعة', progress: 'التقدم', completed: 'اكتمل', empty: 'لم تضف ملاحظات بعد.', mini: 'تصغير المشغّل', close: 'إغلاق', resume: 'متابعة من', related: 'التالي في نتائجك' },
  en: { notes: 'Video notes', notePlaceholder: 'Write a note linked to this moment…', add: 'Save note', bookmark: 'Bookmark moment', favorite: 'Favorite video', ask: 'Ask Fahim at this moment', quiz: 'Quiz from video', flashcards: 'Review flashcards', progress: 'Progress', completed: 'Completed', empty: 'No notes yet.', mini: 'Minimize player', close: 'Close', resume: 'Resume from', related: 'Next from your results' },
} as const;

export default function VideoLearningStudio({ video, related, language, onClose, onSelect }: { video: EducationalVideo; related: EducationalVideo[]; language: 'ar' | 'en'; onClose: () => void; onSelect: (video: EducationalVideo) => void }) {
  const t = text[language];
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mini, setMini] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<VideoNote[]>(() => loadVideoNotes(video.id));
  const prior = loadVideoStates().find((item) => item.videoId === video.id);
  const [favorite, setFavorite] = useState(Boolean(prior?.favorite));
  const favoriteRef = useRef(favorite);

  useEffect(() => { favoriteRef.current = favorite; }, [favorite]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    setNotes(loadVideoNotes(video.id));
    const existing = loadVideoStates().find((item) => item.videoId === video.id);
    setFavorite(Boolean(existing?.favorite));
    recordStudyAction('video', video.title);

    let cancelled = false;
    const initialise = () => {
      if (cancelled || !hostRef.current || !(window as YTWindow).YT) return;
      playerRef.current?.destroy();
      playerRef.current = new (window as YTWindow).YT!.Player(hostRef.current, {
        videoId: video.id,
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, cc_load_policy: video.hasCaptions ? 1 : 0, origin: window.location.origin },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            const saved = loadVideoStates().find((item) => item.videoId === video.id);
            if (saved?.seconds && saved.progress < 95) event.target.seekTo(saved.seconds, true);
            event.target.playVideo();
          },
          onStateChange: (event: { data: number }) => setPlaying(event.data === (window as YTWindow).YT?.PlayerState.PLAYING),
        },
      });
    };
    if ((window as YTWindow).YT?.Player) initialise();
    else {
      const existingScript = document.querySelector('script[data-fahim-youtube]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api'; script.async = true; script.dataset.fahimYoutube = 'true';
        document.head.appendChild(script);
      }
      const previous = (window as YTWindow).onYouTubeIframeAPIReady;
      (window as YTWindow).onYouTubeIframeAPIReady = () => { previous?.(); initialise(); };
    }
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const current = Math.floor(player.getCurrentTime() || 0);
      const total = Math.floor(player.getDuration() || 0);
      setTime(current); setDuration(total);
      if (total > 0) saveVideoState({ videoId: video.id, title: video.title, channel: video.channel, seconds: current, duration: total, progress: Math.min(100, Math.round((current / total) * 100)), completed: current / total >= .9, favorite: favoriteRef.current, updatedAt: new Date().toISOString() });
    }, 2500);
    return () => { cancelled = true; window.clearInterval(interval); playerRef.current?.destroy(); playerRef.current = null; };
  }, [video]);

  const addNote = () => {
    if (!noteText.trim()) return;
    const note = { id: `${Date.now()}`, videoId: video.id, time, text: noteText.trim(), createdAt: new Date().toISOString() };
    saveVideoNote(note); setNotes((items) => [note, ...items]); setNoteText('');
  };
  const removeNote = (id: string) => { removeVideoNote(id); setNotes((items) => items.filter((note) => note.id !== id)); };
  const bookmarkMoment = () => {
    const note = { id: `${Date.now()}`, videoId: video.id, time, text: language === 'ar' ? 'لحظة محفوظة' : 'Bookmarked moment', createdAt: new Date().toISOString() };
    saveVideoNote(note); setNotes((items) => [note, ...items]);
  };
  const toggleFavorite = () => {
    const next = !favorite; setFavorite(next);
    saveVideoState({ videoId: video.id, title: video.title, channel: video.channel, seconds: time, duration, progress: duration ? Math.round((time / duration) * 100) : 0, completed: duration > 0 && time / duration >= .9, favorite: next, updatedAt: new Date().toISOString() });
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const progress = duration ? Math.min(100, Math.round((time / duration) * 100)) : 0;
  const askQuery = language === 'ar'
    ? `اشرح لي النقطة في فيديو "${video.title}" عند ${formatTime(time)}. موضوع الفيديو: ${video.description || video.title}`
    : `Explain the point in "${video.title}" at ${formatTime(time)}. Video topic: ${video.description || video.title}`;
  const learningContext = `${video.title} · ${formatTime(time)}`;

  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={mini ? 'fixed bottom-20 end-4 z-[70] w-[min(25rem,calc(100vw-2rem))]' : 'fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 p-0 backdrop-blur-md sm:p-5'} role="dialog" aria-modal={!mini} aria-label={video.title}>
    <motion.div initial={{ scale: .98, y: 12 }} animate={{ scale: 1, y: 0 }} className={`overflow-hidden border border-white/10 bg-[#090d16] text-white shadow-2xl ${mini ? 'rounded-2xl' : 'mx-auto min-h-full max-w-7xl rounded-none sm:min-h-0 sm:rounded-[2rem]'}`}>
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{video.title}</p><p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">{video.channel}</p></div><button type="button" title={t.favorite} aria-label={t.favorite} onClick={toggleFavorite} className={`icon-button border-white/10 ${favorite ? 'bg-amber-300 text-slate-950' : 'text-white'}`}><Bookmark className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} /></button><button type="button" title={t.mini} aria-label={t.mini} onClick={() => setMini((value) => !value)} className="icon-button border-white/10 text-white">{mini ? <ChevronDown className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}</button><button type="button" title={t.close} aria-label={t.close} onClick={onClose} className="icon-button border-white/10 text-white"><X className="h-4 w-4" /></button></header>
      <div className={mini ? '' : 'grid lg:grid-cols-[1fr_23rem]'}>
        <section>
          <div className="relative aspect-video bg-black"><div ref={hostRef} className="absolute inset-0" /></div>
          <div className="border-t border-white/10 px-4 py-3"><div className="flex items-center gap-3"><button type="button" onClick={() => playing ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-950">{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button><div className="min-w-0 flex-1"><div className="flex items-center justify-between text-[10px] font-bold text-slate-400"><span>{formatTime(time)} / {formatTime(duration)}</span><span>{t.progress} {progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400" style={{ width: `${progress}%` }} /></div></div></div></div>
          {!mini && <div className="border-t border-white/10 p-4 sm:p-6"><div className="flex flex-wrap gap-2"><button type="button" onClick={bookmarkMoment} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-black hover:border-violet-400/40"><Bookmark className="h-3.5 w-3.5" />{t.bookmark} · {formatTime(time)}</button><Link to={`/ask-fahim?mode=explain&q=${encodeURIComponent(askQuery)}&subject=${encodeURIComponent(video.title)}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-black text-violet-200 hover:border-violet-400/40"><Bot className="h-3.5 w-3.5" />{t.ask}</Link><Link to={`/quiz-lab?topic=${encodeURIComponent(learningContext)}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-black text-teal-200 hover:border-teal-400/40"><BrainCircuit className="h-3.5 w-3.5" />{t.quiz}</Link><Link to={`/ask-fahim?mode=flashcards&q=${encodeURIComponent(language === 'ar' ? `أنشئ بطاقات مراجعة من ${learningContext}` : `Create review flashcards from ${learningContext}`)}&subject=${encodeURIComponent(video.title)}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-black text-amber-200 hover:border-amber-400/40"><Layers3 className="h-3.5 w-3.5" />{t.flashcards}</Link></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder={t.notePlaceholder} className="min-h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" /><button type="button" onClick={addNote} disabled={!noteText.trim()} className="premium-button justify-center sm:self-stretch"><Plus className="h-4 w-4" />{t.add}</button></div><div className="mt-5"><h3 className="text-sm font-black">{t.notes}</h3>{notes.length === 0 ? <p className="mt-3 text-xs text-slate-500">{t.empty}</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{notes.map((note) => <div key={note.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-3"><button type="button" onClick={() => playerRef.current?.seekTo(note.time, true)} className="flex items-center gap-1 text-[10px] font-black text-teal-300"><Clock3 className="h-3 w-3" />{formatTime(note.time)}</button><p className="mt-2 text-xs leading-6 text-slate-300">{note.text}</p><button type="button" aria-label={language === 'ar' ? 'حذف الملاحظة' : 'Delete note'} onClick={() => removeNote(note.id)} className="mt-2 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}</div></div>}
        </section>
        {!mini && <aside className="border-t border-white/10 p-4 lg:border-s lg:border-t-0"><h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.related}</h3><div className="mt-4 space-y-3">{related.slice(0, 6).filter((item) => item.id !== video.id).map((item) => <button type="button" key={item.id} onClick={() => onSelect(item)} className="flex w-full gap-3 rounded-2xl p-2 text-start transition hover:bg-white/5"><img src={item.thumbnail} alt="" className="aspect-video w-28 rounded-xl object-cover" /><div className="min-w-0"><p className="line-clamp-2 text-xs font-black leading-5">{item.title}</p><p className="mt-1 truncate text-[10px] text-slate-500">{item.channel}</p></div></button>)}</div></aside>}
      </div>
    </motion.div>
  </motion.div></AnimatePresence>;
}
