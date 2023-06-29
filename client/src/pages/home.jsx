import { Button, Container, Select, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

export default function Home() {
  const [counter, setCounter] = useState(0);
  const [datasource, setDatasource] = useState('scanr');
  const [query, setQuery] = useState(['athlete']);
  const [type, setType] = useState('keyword');

  const datasources = [
    {
      label: 'Scanr',
      value: 'scanr',
    },
    {
      label: 'OpenAlex',
      value: 'openalex',
      disabled: true,
    },
  ];

  const types = [
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
        label="Choose your datasource"
        options={datasources}
        selected={datasource}
        onChange={(e) => setDatasource(e.target.value)}
      />
      <Select
        label="Choose your graph type"
        options={types}
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
        onClick={() => setCounter(counter + 1)}
      >
        Generate graph
      </Button>
      {(counter > 0) && <Graph counter={counter} query={query} type={type} />}
    </Container>
  );
}
