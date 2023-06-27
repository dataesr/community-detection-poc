import { Button, Container, TextInput, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [query, setQuery] = useState('athlete');

  return (
    <Container className="fr-my-15w">
      <Title as="h1">
        Community Detection POC
      </Title>
      <TextInput
        label="Query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button
        onClick={() => setClicked(true)}
      >
        Generate graph
      </Button>
      {clicked && <Graph query={query} />}
    </Container>
  );
}
