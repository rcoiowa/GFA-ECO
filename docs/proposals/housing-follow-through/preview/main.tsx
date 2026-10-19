import React from 'react';
import { createRoot } from 'react-dom/client';
import { CollaborationWorkspace } from '../../../../apps/platform/src/admin/pages/CollaborationPage';
import '../../../../apps/platform/src/styles.css';
createRoot(document.getElementById('root')!).render(
  <main className="mx-auto max-w-4xl space-y-5 p-8">
    <p className="rounded border p-4 font-bold">
      SYNTHETIC LOCAL REVIEW — no login, production connection or resident data. This separate
      development harness is not an application access path.
    </p>
    <CollaborationWorkspace actorId={9001} />
  </main>,
);
