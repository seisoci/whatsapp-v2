'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Text, Select, Title, ActionIcon } from 'rizzui';
import { getOltBoards, getOltBoardPorts } from '@/lib/sanctum-api';
import { PiX } from 'react-icons/pi';

interface BoardPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  oltId: string;
  currentBoard?: string;
  currentPort?: string;
  onSuccess?: (board: string, port: string) => void;
}

// Backend returns array of numbers directly, not objects
type Board = number;
type Port = number;

export default function BoardPortModal({
  isOpen,
  onClose,
  oltId,
  currentBoard,
  currentPort,
  onSuccess
}: BoardPortModalProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (isOpen && oltId) {
      setInitialLoad(true);
      fetchBoards();
      // Set initial values when modal opens
      if (currentBoard) {
        setSelectedBoard(currentBoard);
      }
      if (currentPort) {
        setSelectedPort(currentPort);
      }
    }
  }, [isOpen, oltId, currentBoard, currentPort]);

  useEffect(() => {
    if (selectedBoard) {
      fetchPorts(selectedBoard);
    } else if (!initialLoad) {
      setPorts([]);
      setSelectedPort('');
    }
  }, [selectedBoard]);

  const fetchBoards = async () => {
    try {
      setLoadingBoards(true);
      setError(null);
      const response = await getOltBoards(oltId);

      if (response.data && Array.isArray(response.data)) {
        setBoards(response.data);
      } else {
        setBoards([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load boards');
      setBoards([]);
    } finally {
      setLoadingBoards(false);
    }
  };

  const fetchPorts = async (board: string) => {
    try {
      setLoadingPorts(true);
      setError(null);
      const response = await getOltBoardPorts(oltId, board);

      if (response.data && Array.isArray(response.data)) {
        setPorts(response.data);
      } else {
        setPorts([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load ports');
      setPorts([]);
    } finally {
      setLoadingPorts(false);
      setInitialLoad(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedBoard) {
      setError('Please select a board');
      return;
    }

    if (!selectedPort) {
      setError('Please select a port');
      return;
    }

    onSuccess?.(selectedBoard, selectedPort);
    onClose();
  };

  const handleClose = () => {
    setSelectedBoard('');
    setSelectedPort('');
    setBoards([]);
    setPorts([]);
    setError(null);
    setInitialLoad(true);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="m-auto px-7 pt-6 pb-8">
        <div className="mb-7 flex items-center justify-between">
          <Title as="h3">Move ONU</Title>
          <ActionIcon
            size="sm"
            variant="text"
            onClick={handleClose}
          >
            <PiX className="h-auto w-6" />
          </ActionIcon>
        </div>

        {loadingBoards ? (
          <div className="py-8 text-center">
            <Text className="text-sm text-gray-500">Loading...</Text>
          </div>
        ) : (
          <div className="space-y-6 [&_label>span]:font-medium">
            {/* Board Select */}
            <Select
              label="Board"
              value={selectedBoard}
              onChange={(val) => {
                const newValue = typeof val === 'object' && val !== null && 'value' in val
                  ? (val as any).value
                  : val;
                setSelectedBoard(newValue as string);
              }}
              options={boards.map(board => ({
                value: String(board),
                label: String(board)
              }))}
              displayValue={(value) => {
                if (!value || boards.length === 0) return '';
                return String(value);
              }}
              placeholder={loadingBoards ? "Loading boards..." : "Select board"}
              disabled={loadingBoards}
              size="lg"
              searchable
              clearable
              onClear={() => setSelectedBoard('')}
            />

            {/* Port Select */}
            <Select
              label="Port"
              value={selectedPort}
              onChange={(val) => {
                const newValue = typeof val === 'object' && val !== null && 'value' in val
                  ? (val as any).value
                  : val;
                setSelectedPort(newValue as string);
              }}
              options={ports.map(port => ({
                value: String(port),
                label: String(port)
              }))}
              displayValue={(value) => {
                if (!value || ports.length === 0) return '';
                return String(value);
              }}
              placeholder={
                loadingPorts
                  ? "Loading ports..."
                  : !selectedBoard
                  ? "Select board first"
                  : "Select port"
              }
              disabled={!selectedBoard || loadingPorts}
              size="lg"
              searchable
              clearable
              onClear={() => setSelectedPort('')}
            />

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-600">{error}</Text>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedBoard || !selectedPort || loadingBoards}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
