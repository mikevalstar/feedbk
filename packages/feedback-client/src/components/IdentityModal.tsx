import { useState } from "react";
import type { Identity } from "../types";

type Props = {
  initial: Identity | null;
  onSave: (identity: Identity) => void;
  onCancel: () => void;
};

export function IdentityModal({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    onSave({ name: trimmedName, email: trimmedEmail });
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close; Cancel button is the accessible path
    <div className="dfb-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="dfb-modal" onSubmit={submit}>
        <h2>Who's reviewing?</h2>
        <p className="dfb-modal-sub">
          Your name and email are attached to the feedback you leave. Stored locally in this browser.
        </p>
        <div className="dfb-field">
          <label htmlFor="dfb-id-name">Name</label>
          <input
            id="dfb-id-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            autoFocus
          />
        </div>
        <div className="dfb-field">
          <label htmlFor="dfb-id-email">Email</label>
          <input
            id="dfb-id-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
          />
        </div>
        {error && <div className="dfb-error">{error}</div>}
        <div className="dfb-modal-actions">
          <button type="button" className="dfb-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="dfb-btn dfb-btn--primary">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
