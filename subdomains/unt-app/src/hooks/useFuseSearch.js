import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

const useFuseSearch = (data, options) => {
  const [term, setTerm] = useState('');

  const fuse = useMemo(() => {
    return new Fuse(data, options);
  }, [data, options]);

  const results = useMemo(() => {
    if (!term) return data;
    return fuse.search(term).map(result => result.item);
  }, [term, data, fuse]);

  return { results, term, setTerm };
};

export default useFuseSearch;
