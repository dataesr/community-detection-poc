import '@react-sigma/core/lib/react-sigma.min.css';
import { SigmaContainer } from '@react-sigma/core';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';

async function getScanr({ query, idref }) {
  if (idref) {
    return fetch(`/api/scanr?idref=${idref}`).then((response) => {
      if (response.ok) return response.json();
      return "Oops... La requète à l'API n'a pas fonctionné";
    });
  }
  return fetch(`/api/scanr?query=${query}`).then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requète à l'API n'a pas fonctionné";
  });
}

export default function Graph({ query, idref }) {
  const { data, isLoading } = useQuery(
    ['hello'],
    () => getScanr({ query, idref }),
    { staleTime: Infinity, cacheTime: Infinity }
  );
  if (isLoading) return <div>Chargement...</div>;
  const graph = UndirectedGraph.from(data);
  return <SigmaContainer style={{ height: '500px', backgroundColor: 'transparent !important' }} graph={graph} />;
}
