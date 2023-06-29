import { Button, Container, Select, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [type, setType] = useState('keyword');
  const [query, setQuery] = useState(['athlete']);

  const options = [
    {
      label: 'Coauthoring by keyword',
      value: 'keyword',
    },
    {
      label: 'Coauthoring by idref',
      value: 'author',
    },
    {
      label: 'Coauthoring in a structure',
      value: 'structure',
    },
  ];

  return (
    <Container className="fr-my-15w">
      <Title as="h1">
        Community Detection POC
      </Title>
      <Select
        label="Choose your network"
        options={options}
        selected={type}
        onChange={(e) => setType(e.target.value)}
      />
      <TagInput
        label="Query"
        hint='Validate you add by pressing "Return" key'
        tags={query}
        onTagsChange={(tags) => setQuery(tags)}
      />
      <Button
        onClick={() => setClicked(true)}
      >
        Generate graph
      </Button>
      {clicked && <Graph type={type} query={query} />}
    </Container>
  );
}
