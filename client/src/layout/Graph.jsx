import { SigmaContainer } from '@react-sigma/core';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';

async function getHello() {
  return fetch('/api/scanr').then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requète à l'API n'a pas fonctionné";
  });
}

export default function Graph() {
  const { data, isLoading } = useQuery({ queryKey: ['hello'], queryFn: getHello });

  if (isLoading) return <div>Chargement...</div>;
  const graph = UndirectedGraph.from(data);
  return <SigmaContainer style={{ height: '500px' }} graph={graph} />;
}
