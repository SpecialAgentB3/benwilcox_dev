import { useState, useEffect } from 'react';

const useDatabase = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0); // 0-100

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        // Using the global initSqlJs from the CDN
        const SQL = await window.initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });

        // Fetch database with streaming progress
        const response = await fetch('/courses.db');
        const contentLength = response.headers.get('Content-Length');
        if (!response.body || !contentLength) {
          // Fallback: no progress available
          const buffer = await response.arrayBuffer();
          setProgress(100);
          const database = new SQL.Database(new Uint8Array(buffer));
          setDb(database);
        } else {
          const total = parseInt(contentLength, 10);
          const reader = response.body.getReader();
          let received = 0;
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            setProgress(Math.round((received / total) * 100));
          }
          // concatenate chunks
          const concatenated = new Uint8Array(received);
          let position = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, position);
            position += chunk.length;
          }
          const database = new SQL.Database(concatenated);
          setDb(database);
        }
      } catch (err) {
        console.error('Failed to load database:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);

  return { db, loading, error, progress };
};

export default useDatabase;