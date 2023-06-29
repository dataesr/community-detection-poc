import '@react-sigma/core/lib/react-sigma.min.css';
import { SigmaContainer } from '@react-sigma/core';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';

async function getScanr({ tags, idrefs, structures }) {
  if (idrefs) {
    return fetch(`/api/scanr?idref=${idrefs.join(',')}`).then((response) => {
      if (response.ok) return response.json();
      return "Oops... La requête à l'API n'a pas fonctionné";
    });
  }
  if (structures) {
    return fetch(`/api/scanr?structure=${structures.join(',')}`).then((response) => {
      if (response.ok) return response.json();
      return "Oops... La requête à l'API n'a pas fonctionné";
    });
  }
  return fetch(`/api/scanr?query=${tags.join(',')}`).then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requête à l'API n'a pas fonctionné";
  });
}

export default function Graph({ tags, idrefs, structures }) {
  const { data, isLoading } = useQuery(
    ['hello'],
    () => getScanr({ tags, idrefs, structures }),
    { staleTime: Infinity, cacheTime: Infinity },
  );
  if (isLoading) return <div>Loading data...</div>;
  const graph = UndirectedGraph.from(data);
  return <SigmaContainer style={{ height: '500px', backgroundColor: 'transparent !important' }} graph={graph} />;
}
