'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getEcho } from '@/lib/echo';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sessionId: string;
  onClose: () => void;
}

export default function Terminal({ sessionId }: TerminalProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const isConnectedRef = useRef(false);
  const sendBufferRef = useRef<string>('');
  const flushTimerRef = useRef<any>(null);
  const lineBufRef = useRef<string>('');
  const remoteSyncedLenRef = useRef<number>(0);
  const moreVisibleRef = useRef<boolean>(false);
  const stickToBottomRef = useRef<boolean>(true);
  const pendingSentRef = useRef<string>('');
  const lastReceivedRef = useRef<string>('');
  const afterTabRef = useRef<boolean>(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Hack, Menlo, Monaco, "Courier New", monospace',
      lineHeight: 1,
      allowProposedApi: true,
      convertEol: true,
      scrollback: 5000,
      theme: {
        background: '#111827',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;

    const safeFit = () => {
      const el = hostRef.current;
      if (!el || el.clientWidth <= 0 || el.clientHeight <= 0) return;
      requestAnimationFrame(() => { try { fit.fit(); } catch { } });
    };

    safeFit();
    setTimeout(safeFit, 50);
    setTimeout(safeFit, 200);

    const ro = new ResizeObserver(safeFit);
    ro.observe(host);

    if (document.fonts?.ready) {
      document.fonts.ready.then(safeFit).catch(() => {});
    }

    const viewport = () => host.querySelector('.xterm-viewport') as HTMLElement | null;
    const isAtBottom = () => {
      const vp = viewport();
      if (!vp) return true;
      return vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2;
    };
    const onViewportScroll = () => { stickToBottomRef.current = isAtBottom(); };
    viewport()?.addEventListener('scroll', onViewportScroll, { passive: true });

    const write = (s: string) => {
      term.write(s);
      if (stickToBottomRef.current) term.scrollToBottom();
    };

    const echo = getEcho();
    const channel = echo.private(`terminal.${sessionId}`);

    channel.subscribed(() => {
      isConnectedRef.current = true;
      setStatus('connected');

      const checkStatus = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/terminal/${sessionId}/status`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
          });
          const data = await response.json() as { status: string; reason?: string };
          if (data.status === 'open') {
          } else if (data.status === 'opening') {
            setTimeout(checkStatus, 500);
          } else if (data.status === 'failed') {
            write(`\r\nTerminal connection failed: ${data.reason || 'Unknown error'}\r\n`);
            setStatus('error');
          }
        } catch {}
      };
      setTimeout(checkStatus, 300);
    });

    channel.error(() => {
      write('\r\nConnection error\r\n');
      setStatus('error');
    });

    channel.listen('.output', (event: { type: string; data: string }) => {
      let s = atob(event.data);
      if (s === lastReceivedRef.current) return;
      lastReceivedRef.current = s;
      if (s.includes('--More--')) moreVisibleRef.current = true;
      let pending = pendingSentRef.current;
      if (pending) {
        const normPending = pending.replace(/\t/g, '');
        if (normPending && s.startsWith(normPending)) {
          s = s.substring(normPending.length);
          setTimeout(() => {
            if (pendingSentRef.current === pending) pendingSentRef.current = '';
          }, 120);
        } else if (pending && s.startsWith(pending)) {
          s = s.substring(pending.length);
          pendingSentRef.current = '';
        }
      }
      if (s) write(s);
    });

    const enqueueSend = (data: string) => { if (data) sendBufferRef.current += data; };
    const flush = () => {
      if (!isConnectedRef.current) return;
      const data = sendBufferRef.current;
      if (!data) return;
      sendBufferRef.current = '';
      pendingSentRef.current = data;
      try {
        channel.whisper('terminal-input', { d: btoa(data) });
      } catch {}
    };
    const scheduleFlush = (immediate = false) => {
      if (immediate) {
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
        flush();
        return;
      }
      if (flushTimerRef.current) return;
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        flush();
      }, 0);
    };
    const sendLineDeltaIfAny = () => {
      const buf = lineBufRef.current;
      const synced = remoteSyncedLenRef.current;
      if (buf.length > synced) {
        const delta = buf.slice(synced);
        enqueueSend(delta);
        remoteSyncedLenRef.current = buf.length;
        scheduleFlush(true);
      }
    };

    term.onKey(({ key, domEvent }) => {
      if (domEvent.type !== 'keydown' || domEvent.repeat) return;
      if (key === '\t') {
        domEvent.preventDefault();
        domEvent.stopPropagation();
        if (!isConnectedRef.current) return;
        const line = lineBufRef.current;
        if (line) enqueueSend(line);
        enqueueSend('\t');
        scheduleFlush(true);
        afterTabRef.current = true;
        lineBufRef.current = '';
        remoteSyncedLenRef.current = 0;
        return;
      }
      if (key === ' ' && moreVisibleRef.current) {
        domEvent.preventDefault();
        domEvent.stopPropagation();
        enqueueSend(' ');
        scheduleFlush(true);
        write('\r\x1b[2K');
        moreVisibleRef.current = false;
        return;
      }
    });

    term.onData((data) => {
      if (!isConnectedRef.current) return;
      const c = data.charCodeAt(0);
      if (c === 9) return;
      if (c >= 32 && c <= 126) {
        lineBufRef.current += data;
          write(data);
        return;
      }
      if (c === 13) {
        if (moreVisibleRef.current) {
          write('\r\x1b[2K');
          enqueueSend(' ');
          scheduleFlush(true);
          moreVisibleRef.current = false;
          return;
        }
        if (afterTabRef.current && lineBufRef.current.length === 0) {
          enqueueSend('\r');
          scheduleFlush(true);
          afterTabRef.current = false;
          return;
        }
        const line = lineBufRef.current;
        if (line) enqueueSend(line);
        enqueueSend('\r');
        scheduleFlush(true);
        lineBufRef.current = '';
        remoteSyncedLenRef.current = 0;
        afterTabRef.current = false;
        return;
      }
      if (c === 127 || c === 8) {
        if (lineBufRef.current.length > 0) {
          write('\b \b');
          lineBufRef.current = lineBufRef.current.slice(0, -1);
        }
        return;
      }
      if (data.startsWith('\x1b[') || c === 3 || c === 4) {
        sendLineDeltaIfAny();
        enqueueSend(data);
        scheduleFlush(true);
        return;
      }
      enqueueSend(data);
      scheduleFlush();
    });

    return () => {
      ro.disconnect();
      viewport()?.removeEventListener('scroll', onViewportScroll);
      echo.leave(`terminal.${sessionId}`);
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      term.dispose();
    };
  }, [sessionId]);

  return (
    <div className="flex h-screen min-h-0 flex-col p-2" style={{ backgroundColor: '#111827' }}>
      <div className="flex-1 min-h-0">
        <div className="h-full w-full">
          <div ref={hostRef} className="h-full w-full min-h-0" />
        </div>
      </div>
    </div>
  );
}
