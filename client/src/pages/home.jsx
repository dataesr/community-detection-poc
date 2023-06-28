import { Button, Container, TextInput, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [clicked2, setClicked2] = useState(false);
  const [query, setQuery] = useState('athlete');
  const [idref, setIdref] = useState('');

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
      <div className='fr-card fr-card--shadow'>
        {clicked && <Graph query={query} />}
      </div>
      <Title as="h1">
        Community Detection POC
      </Title>
      <TextInput
        label="Enter one or more idref"
        value={idref}
        onChange={(e) => setIdref(e.target.value)}
      />
      <Button onClick={() => setClicked2(true)}>
        Generate graph for an idref
      </Button>
      {clicked2 && <Graph idref={idref} />}
    </Container>
  );
}
