import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Text, Title } from '@dataesr/react-dsfr';
import { useQuery } from '@tanstack/react-query';
import { MultiDirectedGraph } from 'graphology';
import { SigmaContainer } from '@react-sigma/core';

async function getHello() {
  return fetch('/api/hello').then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requète à l'API n'a pas fonctionné";
  });
}

const graph = new MultiDirectedGraph();
graph.addNode('A', { x: 0, y: 0, label: 'Node A', size: 10 });
graph.addNode('B', { x: 1, y: 1, label: 'Node B', size: 10 });
graph.addEdgeWithKey('rel1', 'A', 'B', { label: 'REL_1' });

export default function Home() {
  const { data, isLoading } = useQuery({ queryKey: ['hello'], queryFn: getHello });
  return (
    <Container className="fr-my-15w">
      <Title as="h1">Doadify</Title>
      <Text>{isLoading ? 'Chargement...' : data?.hello}</Text>
      <SigmaContainer style={{ height: '500px' }} graph={graph} />
    </Container>
  );
}
