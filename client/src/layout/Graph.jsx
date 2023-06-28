import '@react-sigma/core/lib/react-sigma.min.css';
import { SigmaContainer } from '@react-sigma/core';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';

async function getScanr({ tags }) {
  return fetch(`/api/scanr?query=${tags.join(',')}`).then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requète à l'API n'a pas fonctionné";
  });
}

export default function Graph({ tags }) {
  const { data, isLoading } = useQuery(['hello'], () => getScanr({ tags }));
  if (isLoading) return <div>Chargement...</div>;
  const graph = UndirectedGraph.from(data);
  return <SigmaContainer style={{ height: '500px' }} graph={graph} />;
}
