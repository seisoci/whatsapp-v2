'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Terminal from './terminal';
import { apiRequest } from '@/lib/sanctum-api';

interface TerminalSession {
  id: string;
  channelName: string;
  title: string;
}

interface FloatingTerminalProps {
  isOpen: boolean;
  session: TerminalSession | null;
  onClose: () => void;
}

export default function FloatingTerminal({ isOpen, session, onClose }: FloatingTerminalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });

  useEffect(() => {
    if (isOpen && !position.x && !position.y) {
      const centerX = (window.innerWidth - size.width) / 2;
      const centerY = (window.innerHeight - size.height) / 2;
      setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    }
  }, [isOpen]);

  const handleClose = async () => {
    if (session) {
      try {
        await apiRequest(`/api/v1/terminal/${session.id}/close`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error closing terminal:', error);
      }
    }
    onClose();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (isResizing && resizeDirection) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = size.width;
      let newHeight = size.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(400, resizeStart.width + deltaX);
      } else if (resizeDirection.includes('w')) {
        newWidth = Math.max(400, resizeStart.width - deltaX);
        if (newWidth > 400) {
          newX = resizeStart.posX + deltaX;
        }
      }

      if (resizeDirection.includes('s')) {
        newHeight = Math.max(300, resizeStart.height + deltaY);
      } else if (resizeDirection.includes('n')) {
        newHeight = Math.max(300, resizeStart.height - deltaY);
        if (newHeight > 300) {
          newY = resizeStart.posY + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  const handleHeaderDoubleClick = () => {
    toggleFullscreen();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsMinimized(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeStart]);

  if (!isOpen || !session) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: isFullscreen ? 0 : position.x,
          y: isFullscreen ? 0 : position.y,
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[9999] rounded-lg shadow-2xl overflow-hidden border border-gray-700"
        style={{
          width: isFullscreen ? '100vw' : (isMinimized ? 300 : size.width),
          height: isFullscreen ? '100vh' : (isMinimized ? 'auto' : size.height),
          left: 0,
          top: 0,
        }}
      >
        <div
          className={`flex items-center justify-between bg-gray-800 px-4 py-2 select-none border-b border-gray-700 ${
            isFullscreen ? 'cursor-default' : 'cursor-move'
          }`}
          onMouseDown={isFullscreen ? undefined : handleMouseDown}
          onDoubleClick={handleHeaderDoubleClick}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-200">{session.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isFullscreen && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="h-full bg-gray-900 relative">
            <Terminal
              sessionId={session.id}
              channelName={session.channelName}
              onClose={handleClose}
            />

            {!isFullscreen && (
              <>
                <div
                  onMouseDown={(e) => handleResizeStart(e, 'n')}
                  className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-blue-500/20 z-10"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 's')}
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-blue-500/20 z-10"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 'w')}
                  className="absolute top-0 left-0 bottom-0 w-2 cursor-w-resize hover:bg-blue-500/20 z-10"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 'e')}
                  className="absolute top-0 right-0 bottom-0 w-2 cursor-e-resize hover:bg-blue-500/20 z-10"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 'nw')}
                  className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-20"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 'ne')}
                  className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-20"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 'sw')}
                  className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-20"
                  style={{ touchAction: 'none' }}
                />

                <div
                  onMouseDown={(e) => handleResizeStart(e, 'se')}
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group z-20"
                  style={{ touchAction: 'none' }}
                >
                  <svg
                    className="absolute bottom-0 right-0 text-gray-600 group-hover:text-gray-400 transition-colors"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M14 10l-4 4M14 6l-8 8M14 2l-12 12" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
