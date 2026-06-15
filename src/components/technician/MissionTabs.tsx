import React, { Suspense } from 'react';

const LazyDrawerTabs = React.lazy(() => import('./DrawerTabs'));

export default function MissionTabs(props: any) {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-[var(--tech-text-muted)]">Chargement…</div>}>
      {/* DrawerTabs is code-split to reduce initial bundle for the drawer */}
      <LazyDrawerTabs {...props} />
    </Suspense>
  );
}
