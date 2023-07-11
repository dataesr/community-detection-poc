import { Alert, Button, Callout, CalloutText, CalloutTitle, Container, Select, Title } from '@dataesr/react-dsfr';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageSpinner } from '../components/spinner';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

async function getData({ datasource, query, type }) {
  return fetch(`/api/${datasource}?query=${query.join(',')}&type=${type}`)
    .then((response) => (response.ok ? response.json() : 'Oops... The request to the API failed'));
}

async function loadCountries() {
  return fetch('https://api.openalex.org/works?group_by=institutions.country_code&mailto=bso@recherche.gouv.fr')
    .then((response) => (response.ok ? response.json() : 'Oops... The request to the OpenAlex API failed'));
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formCountry, setFormCountry] = useState(searchParams.getAll('country')?.[0] || 'FR');
  const [formDatasource, setFormDatasource] = useState(searchParams.getAll('datasource')?.[0] || 'scanr');
  const [formQuery, setFormQuery] = useState(searchParams.getAll('query') || []);
  const [formType, setFormType] = useState(searchParams.getAll('type')?.[0] || 'keyword');
  const [isError, setFormIsError] = useState(false);

  useEffect(() => setSearchParams({ country: formCountry, datasource: formDatasource, query: formQuery, type: formType }), [formCountry, formDatasource, formQuery, setSearchParams, formType]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['graph'],
    queryFn: () => getData({ datasource: formDatasource, query: formQuery, type: formType }),
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data: countries, isFetching: isCountriesFetching } = useQuery(['countries'], loadCountries);

  const datasources = [
    {
      label: 'scanR',
      value: 'scanr',
    },
    {
      label: 'OpenAlex',
      value: 'openalex',
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
      disabled: formDatasource !== 'scanr',
    },
    {
      label: 'Coauthoring by structure id',
      value: 'structure',
      disabled: formDatasource !== 'scanr',
    },
  ];

  return (
    <Container className="fr-my-15w">
      <Title as="h1">
        Community Detection POC
      </Title>
      <Callout>
        <CalloutTitle as="h3">
          This app is ongoing development and is a proof of concept.
        </CalloutTitle>
        <CalloutText>
          This project use only open and reusable data. There might be errors in it. Please take those results carefully.
        </CalloutText>
      </Callout>
      <Select
        label="Choose your datasource"
        options={datasources}
        selected={formDatasource}
        onChange={(e) => {
          setFormDatasource(e.target.value);
          setFormType('keyword');
          setFormQuery([]);
        }}
      />
      <Select
        label="Choose your graph type"
        options={types}
        selected={formType}
        onChange={(e) => {
          setFormType(e.target.value);
          setFormQuery([]);
        }}
      />
      {(formDatasource === 'openalex')
        && (isCountriesFetching
          ? <Container><PageSpinner /></Container>
          : (
            <Select
              label="Choose your country"
              options={countries.group_by.filter((country) => country.key !== 'unknown').map((item) => ({ value: item.key, label: item.key_display_name }))}
              selected={formCountry}
              onChange={(e) => {
                setFormCountry(e.target.value);
              }}
            />
          )
        )}
      <TagInput
        label="Query"
        hint='Validate you add by pressing "Return" key'
        tags={formQuery}
        onTagsChange={(tags) => setFormQuery(tags)}
      />
      <Button onClick={() => (formQuery.length === 0 ? setFormIsError(true) : (setFormIsError(false), refetch()))}>
        Generate graph
      </Button>
      <Alert title="Error" description="Your query is empty" type="error" show={isError} closable onClose={() => setFormIsError(false)} />
      {(isFetching) && (<Container><PageSpinner /></Container>)}
      {(!isFetching && data) && <Graph data={data} />}
    </Container>
  );
}
