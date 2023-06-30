import { Button, Container, Select, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

async function getScanr({ query, type }) {
  return fetch(`/api/scanr?query=${query.join(',')}&type=${type}`).then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requête à l'API n'a pas fonctionné";
  });
}

export default function Home() {
  const [datasource, setDatasource] = useState('scanr');
  const [query, setQuery] = useState([]);
  const [type, setType] = useState('keyword');

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['graph'],
    queryFn: () => getScanr({ query, type }),
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const datasources = [
    {
      label: 'scanR',
      value: 'scanr',
    },
    {
      label: 'OpenAlex',
      value: 'openalex',
      disabled: true,
    },
    {
      label: 'HAL',
      value: 'hal',
      disabled: true,
    },
  ];

  const types = [
    {
      label: 'Coauthoring by keyword',
      value: 'keyword',
    },
    {
      label: 'Coauthoring by author id (idref)',
      value: 'author',
    },
    {
      label: 'Coauthoring by structure id',
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
        onChange={(e) => {
          setType(e.target.value);
        }}
      />
      <TagInput
        label="Query"
        hint='Validate you add by pressing "Return" key'
        tags={query}
        onTagsChange={(tags) => setQuery(tags)}
      />
      <Button onClick={refetch}>
        Generate graph
      </Button>
      {(isFetching) && (<div>Fetching data...</div>)}
      {data && <Graph data={data} />}
    </Container>
  );
}
