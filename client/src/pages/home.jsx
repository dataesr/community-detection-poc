import {
  Alert,
  Button,
  Callout,
  CalloutText,
  CalloutTitle,
  Col,
  Container,
  Row,
  SearchableSelect,
  Select,
  Tag,
  TagGroup,
  TextInput,
  Title,
} from '@dataesr/react-dsfr';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageSpinner } from '../components/spinner';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

async function getData({ countries, datasource, endyear, queries, startyear, type }) {
  return fetch(`/api/${datasource}?countries=${countries}&endyear=${endyear}&queries=${queries.join(',')}&startyear=${startyear}&type=${type}`)
    .then((response) => (response.ok ? response.json() : 'Oops... The request to the API failed'));
}

async function getCountries() {
  return fetch('https://api.openalex.org/works?group_by=institutions.country_code&mailto=bso@recherche.gouv.fr')
    .then((response) => (response.ok ? response.json() : 'Oops... The request to the OpenAlex API failed'));
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formCountries, setFormCountries] = useState(searchParams.getAll('countries') || ['FR']);
  const [formDatasource, setFormDatasource] = useState(searchParams.getAll('datasource')?.[0] || 'scanr');
  const [formEndYear, setFormEndYear] = useState(searchParams.getAll('endyear')[0] || 2023);
  const [formQueries, setFormQueries] = useState(searchParams.getAll('queries') || []);
  const [formStartYear, setFormStartYear] = useState(searchParams.getAll('startyear')[0] || 2018);
  const [formType, setFormType] = useState(searchParams.getAll('type')?.[0] || 'keyword');
  const [isError, setFormIsError] = useState(false);

  useEffect(() => setSearchParams({
    countries: formCountries,
    datasource: formDatasource,
    endyear: formEndYear,
    queries: formQueries,
    startyear: formStartYear,
    type: formType,
  }), [formCountries, formDatasource, formEndYear, formQueries, formStartYear, formType, setSearchParams]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['data'],
    queryFn: () => getData({
      countries: formCountries,
      datasource: formDatasource,
      endyear: formEndYear,
      queries: formQueries,
      startyear: formStartYear,
      type: formType,
    }),
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data: countries, isFetching: isCountriesFetching } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const addCountry = (country) => {
    if (country && country.length > 0) {
      setFormCountries([...new Set([...formCountries, country])].sort());
    }
  };

  const removeCountry = (country) => {
    setFormCountries(formCountries.filter((item) => item !== country));
  };

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
          setFormQueries([]);
        }}
      />
      <Select
        label="Choose your graph type"
        options={types}
        selected={formType}
        onChange={(e) => {
          setFormType(e.target.value);
          setFormQueries([]);
        }}
      />
      {(formDatasource === 'openalex')
        && (isCountriesFetching
          ? <Container><PageSpinner /></Container>
          : (
            <>
              <SearchableSelect
                label="Select your country"
                hint="An OR will be perform"
                onChange={(selectedCountry) => addCountry(selectedCountry)}
                options={countries.group_by.filter((country) => country.key !== 'unknown').map((item) => ({ value: item.key, label: item.key_display_name }))}
              />
              <TagGroup>
                {formCountries.map((country) => (
                  <Tag key={country}>
                    {country}
                    <Button
                      onClick={() => removeCountry(country)}
                      icon="ri-close-line"
                      tertiary
                      hasBorder={false}
                      size="sm"
                    />
                  </Tag>
                ))}
              </TagGroup>
            </>
          )
        )}
      <TagInput
        label="Queries"
        hint='Validate you add by pressing "Return" key, an "OR" will be perform'
        tags={formQueries}
        onTagsChange={(tags) => setFormQueries(tags)}
      />
      <Row gutters>
        <Col>
          <TextInput
            label="Start year"
            onChange={(e) => setFormStartYear(e.target.value)}
            type="number"
            value={formStartYear}
          />
        </Col>
        <Col>
          <TextInput
            label="End year"
            onChange={(e) => setFormEndYear(e.target.value)}
            type="number"
            value={formEndYear}
          />
        </Col>
      </Row>
      <Row gutters>
        <Col>
          <Button onClick={() => (formQueries.length === 0 ? setFormIsError(true) : (setFormIsError(false), refetch()))}>
            Generate graph
          </Button>
        </Col>
      </Row>
      <Alert title="Error" description="Your query is empty" type="error" show={isError} closable onClose={() => setFormIsError(false)} />
      {isFetching && (<Container><PageSpinner /></Container>)}
      {!isFetching && data && <Graph data={data} />}
    </Container>
  );
}
