import { useState } from 'react';
import { Menu, X, Music, Mic, FileText } from 'lucide-react';
import styles from './Nav.module.css';

export type View = 'tuner' | 'recorder' | 'transcripts';

interface Props {
  view: View;
  onViewChange: (v: View) => void;
}

const NAV_ITEMS: { view: View; label: string; Icon: React.ElementType }[] = [
  { view: 'tuner', label: 'Afinador', Icon: Music },
  { view: 'recorder', label: 'Grabadora', Icon: Mic },
  { view: 'transcripts', label: 'Transcripciones', Icon: FileText },
];

export function Nav({ view, onViewChange }: Props) {
  const [open, setOpen] = useState(false);

  const navigate = (v: View) => {
    onViewChange(v);
    setOpen(false);
  };

  return (
    <>
      <header className={styles.topbar}>
        <button
          className={styles.menuBtn}
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          type="button"
        >
          <Menu size={22} />
        </button>
        <span className={styles.appTitle}>Cuatro</span>
        <div className={styles.spacer} />
      </header>

      {open && (
        <div
          className={styles.overlay}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <button
          className={styles.closeBtn}
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          type="button"
        >
          <X size={20} />
        </button>

        <nav className={styles.navList}>
          {NAV_ITEMS.map(({ view: v, label, Icon }) => (
            <button
              key={v}
              className={`${styles.navItem} ${view === v ? styles.active : ''}`}
              onClick={() => navigate(v)}
              type="button"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
