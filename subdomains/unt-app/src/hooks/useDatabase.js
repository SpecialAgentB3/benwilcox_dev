import { useState, useEffect } from 'react';

const useDatabase = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        // Using the global initSqlJs from the CDN
        const SQL = await window.initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });

        // Fetch your database file from the public folder.
        const response = await fetch('/courses.db');
        const buffer = await response.arrayBuffer();

        // Load the database from the fetched file.
        const database = new SQL.Database(new Uint8Array(buffer));
        setDb(database);
      } catch (err) {
        console.error("Failed to load database:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);

  return { db, loading, error };
};

export default useDatabase;