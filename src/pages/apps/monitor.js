import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

// Fake system stats generator
function getFakeStats() {
  return {
    cpu: (Math.random() * 100).toFixed(1),
    ram: (Math.random() * 16).toFixed(1),
    storage: (Math.random() * 512).toFixed(1),
  };
}

export default function Monitor() {
  const [stats, setStats] = useState(getFakeStats());
  const [dateTime, setDateTime] = useState(new Date());
  const { state, dispatch } = useApp();
  const { openApps } = state;

  useEffect(() => {
    const statsInterval = setInterval(() => {
      setStats(getFakeStats());
    }, 1500);

    const clockInterval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-8 p-4 relative">
        <div className="my-2">
          <h4 className="text-lg font-semibold mb-3">Running Processes</h4>
          <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 py-2 font-medium">App</th>
                  <th className="px-3 py-2 font-medium">PID</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {openApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{app.name}</td>
                    <td className="px-3 py-2">{app.processId}</td>
                    <td
                      className="px-3 py-2 text-red-500 cursor-pointer"
                      onClick={() =>
                        dispatch({ type: 'CLOSE_APP', payload: app.id })
                      }
                    >
                      close app
                    </td>
                  </tr>
                ))}
                {openApps.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-center text-gray-500 italic"
                    >
                      No apps running
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* System Stats */}
        <div className="absolute top-0 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 rounded-lg text-center">
            <div className="text-sm text-gray-500">CPU Usage</div>
            <div className="text-sm">{stats.cpu}%</div>
          </div>
          <div className="flex items-center gap-2 rounded-lg text-center">
            <div className="text-sm text-gray-500">RAM Usage</div>
            <div className="text-sm">{stats.ram} GB</div>
          </div>
          <div className="flex items-center gap-2 rounded-lg text-center">
            <div className="text-sm text-gray-500">Storage Used</div>
            <div className="text-sm">{stats.storage} GB</div>
          </div>
        </div>
      </div>
      {/* Clock (fixed at bottom right) */}
      <div className="absolute bottom-0 right-0 m-4 flex items-center gap-2 text-sm bg-white px-3 py-1 rounded-lg shadow">
        <span>{dateTime.toLocaleTimeString()}</span>
        <span className="text-gray-400">|</span>
        <span>{dateTime.toLocaleDateString()}</span>
      </div>
    </div>
  );
}
