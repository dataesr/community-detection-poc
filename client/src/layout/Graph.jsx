import '@react-sigma/core/lib/react-sigma.min.css';
import { SigmaContainer } from '@react-sigma/core';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';

async function getScanr({ query, type }) {
  return fetch(`/api/scanr?query=${query.join(',')}&type=${type}`).then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requête à l'API n'a pas fonctionné";
  });
}

export default function Graph({ query, type }) {
  const { data, isLoading } = useQuery(
    ['hello'],
    () => getScanr({ query, type }),
    { staleTime: Infinity, cacheTime: Infinity },
  );
  if (isLoading) return <div>Loading data...</div>;
  const graph = UndirectedGraph.from(data);
  return <SigmaContainer style={{ height: '500px', backgroundColor: 'transparent !important' }} graph={graph} />;
}
