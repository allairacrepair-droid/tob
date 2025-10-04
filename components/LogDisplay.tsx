
import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '../types';
import { LogSource } from '../types';

interface LogDisplayProps {
  logs: LogEntry[];
}

const getLogColor = (source: LogSource) => {
  switch (source) {
    case LogSource.BOT:
      return 'text-green-400';
    case LogSource.GEMINI:
      return 'text-purple-400';
    case LogSource.SYSTEM:
      return 'text-cyan-400';
    case LogSource.ERROR:
        return 'text-red-500';
    default:
      return 'text-white';
  }
};

export const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
    const endOfLogsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

  return (
    <div className="bg-gray-900 bg-opacity-75 border-4 border-gray-600 p-4 h-full flex flex-col">
        <h2 className="text-yellow-300 text-center mb-2 text-lg">EVENT LOG</h2>
        <div className="overflow-y-auto flex-grow pr-2 text-sm">
            {logs.map((log, index) => (
            <div key={index} className="mb-1">
                <span className="text-gray-500 mr-2">{log.timestamp}</span>
                <span className={`${getLogColor(log.source)} mr-1`}>[{log.source}]</span>
                <span className="text-white">{log.message}</span>
            </div>
            ))}
            <div ref={endOfLogsRef} />
        </div>
    </div>
  );
};
