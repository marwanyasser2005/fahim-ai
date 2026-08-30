export type VideoNote = { id: string; videoId: string; time: number; text: string; createdAt: string };
export type VideoState = { videoId: string; title: string; channel: string; seconds: number; duration: number; progress: number; updatedAt: string; completed: boolean; favorite: boolean };

const STATE_KEY = 'fahim-video-state-v2';
const NOTES_KEY = 'fahim-video-notes-v2';

export function loadVideoStates(): VideoState[] {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || '[]') as VideoState[]; } catch { return []; }
}
export function loadVideoNotes(videoId?: string): VideoNote[] {
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]') as VideoNote[];
    return videoId ? notes.filter((note) => note.videoId === videoId) : notes;
  } catch { return []; }
}
export function saveVideoState(state: VideoState) {
  const states = loadVideoStates().filter((item) => item.videoId !== state.videoId);
  states.unshift(state);
  localStorage.setItem(STATE_KEY, JSON.stringify(states.slice(0, 100)));
  window.dispatchEvent(new Event('fahim-progress'));
}
export function saveVideoNote(note: VideoNote) {
  const notes = loadVideoNotes();
  notes.unshift(note);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes.slice(0, 500)));
}
export function removeVideoNote(id: string) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(loadVideoNotes().filter((note) => note.id !== id)));
}
