import React from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number; // estimated fixed height
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  buffer?: number;
}

export default function VirtualList<T>({ items, itemHeight, renderItem, className = '', buffer = 5 }: VirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => setViewportHeight(el.clientHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onScroll = (e: React.UIEvent) => {
    setScrollTop((e.target as HTMLElement).scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer);
  const offsetY = startIndex * itemHeight;

  const visible = items.slice(startIndex, endIndex + 1);

  return (
    <div ref={containerRef} onScroll={onScroll} className={`w-full overflow-auto ${className}`} style={{ willChange: 'transform' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visible.map((item, i) => (
            <div key={(item as any).id || i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
