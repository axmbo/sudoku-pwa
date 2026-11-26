import type { JSX } from 'preact';
import type { Announcement } from './model/reducer';

export interface AnnouncerProps {
  readonly announcement: Announcement | null;
}

/** Região viva única; `key={id}` remonta o nó e faz o leitor falar de novo o mesmo texto. */
export function Announcer({ announcement }: AnnouncerProps): JSX.Element {
  return (
    <div role="status" aria-live="polite">
      {announcement && <span key={announcement.id}>{announcement.text}</span>}
    </div>
  );
}
