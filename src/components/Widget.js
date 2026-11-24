import { useEffect, useRef, useState } from 'react';

export default function Widget({
  id,
  title,
  icon,
  defaultPosition,
  defaultSize = { width: 320, height: 400 },
  minSize = { width: 280, height: 360 },
  refreshInterval,
  onRefresh,
  onOpen,
  children,
}) {
  const [position, setPosition] = useState({ x: 16, y: 72 });
  const [size, setSize] = useState(defaultSize);
  const [ready, setReady] = useState(false);
  const interaction = useRef(null);

  useEffect(() => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(`orbitos-widget-${id}`));
    } catch (error) {
      saved = null;
    }
    const fallbackPosition =
      typeof defaultPosition === 'function'
        ? defaultPosition()
        : defaultPosition;
    if (saved?.position && saved?.size) {
      setPosition(saved.position);
      setSize(saved.size);
    } else {
      setPosition(fallbackPosition || { x: 16, y: 72 });
      setSize(defaultSize);
    }
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(
        `orbitos-widget-${id}`,
        JSON.stringify({ position, size }),
      );
    }
  }, [id, position, size, ready]);

  useEffect(() => {
    if (!refreshInterval || !onRefresh) return undefined;
    const interval = setInterval(onRefresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  const startInteraction = (type, event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = {
      type,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position,
      size,
    };
  };

  const moveInteraction = (event) => {
    const current = interaction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;

    if (current.type === 'drag') {
      setPosition({
        x: Math.max(
          0,
          Math.min(current.position.x + deltaX, window.innerWidth - size.width),
        ),
        y: Math.max(
          0,
          Math.min(
            current.position.y + deltaY,
            window.innerHeight - size.height - 64,
          ),
        ),
      });
    } else {
      setSize({
        width: Math.max(
          minSize.width,
          Math.min(current.size.width + deltaX, window.innerWidth - position.x),
        ),
        height: Math.max(
          minSize.height,
          Math.min(
            current.size.height + deltaY,
            window.innerHeight - position.y - 64,
          ),
        ),
      });
    }
  };

  const endInteraction = (event) => {
    if (interaction.current?.pointerId === event.pointerId) {
      interaction.current = null;
    }
  };

  return (
    <section
      aria-label={`${title} widget`}
      className="absolute z-20 overflow-hidden rounded-xl border border-white/20 bg-slate-900 text-white shadow-2xl backdrop-blur-md"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      onPointerMove={moveInteraction}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    >
      <header
        className="flex h-9 cursor-move touch-none select-none items-center justify-between border-b border-white/10 bg-white/10 px-3"
        onPointerDown={(event) => startInteraction('drag', event)}
        onDoubleClick={onOpen}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span aria-hidden="true">{icon}</span>
          <span>{title}</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            aria-label={`Refresh ${title}`}
            title="Refresh"
            onClick={onRefresh}
            onPointerDown={(event) => event.stopPropagation()}
            className="rounded px-1.5 py-0.5 text-base text-slate-200 hover:bg-white/10 hover:text-white"
          >
            ↻
          </button>
        )}
      </header>
      <div className="h-[calc(100%-2.25rem)]">{children}</div>
      <button
        type="button"
        aria-label={`Resize ${title} widget`}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none"
        onPointerDown={(event) => startInteraction('resize', event)}
      >
        <span className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-white/50" />
      </button>
    </section>
  );
}
