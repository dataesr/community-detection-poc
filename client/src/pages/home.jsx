import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Text, Title } from '@dataesr/react-dsfr';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';
import { SigmaContainer } from '@react-sigma/core';

async function getHello() {
  return fetch('/api/scanr').then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requète à l'API n'a pas fonctionné";
  });
}


export default function Home() {
  const { data, isLoading } = useQuery({ queryKey: ['hello'], queryFn: getHello });
  if (isLoading) return <div>Chargement...</div>;
  const graph = UndirectedGraph.from(data)
  return (
    <Container className="fr-my-15w">
      <Title as="h1">Doadify</Title>
      <SigmaContainer style={{ height: '500px' }} graph={graph} />
    </Container>
  );
}
