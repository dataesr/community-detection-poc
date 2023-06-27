import '@react-sigma/core/lib/react-sigma.min.css';
import { Button, Container, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';

export default function Home() {
  const [clicked, setClicked] = useState(false);

  return (
    <Container className="fr-my-15w">
      <Title as="h1">
        Community Detection POC
      </Title>
      <Button
        onClick={() => setClicked(true)}
      >
        Generate graph
      </Button>
      {clicked && <Graph />}
    </Container>
  );
}
