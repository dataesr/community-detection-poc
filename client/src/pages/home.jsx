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

async function getData({ datasource, type, queries, condition, startyear, endyear, countries }) {
  return fetch(`/api/${datasource}?type=${type}&queries=${queries.join(',')}&condition=${condition}&startyear=${startyear}&endyear=${endyear}&countries=${countries}`)
    .then((response) => (response.ok ? response.json() : 'Oops... The request to the API failed'));
}

async function getCountries() {
  return fetch('https://api.openalex.org/works?group_by=institutions.country_code&mailto=bso@recherche.gouv.fr')
    .then((response) => (response.ok ? response.json() : 'Oops... The request to the OpenAlex API failed'));
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formDatasource, setFormDatasource] = useState(searchParams.getAll('datasource')?.[0] || 'scanr');
  const [formType, setFormType] = useState(searchParams.getAll('type')?.[0] || 'keyword');
  const [formQueries, setFormQueries] = useState(searchParams.getAll('queries') || []);
  const [formCondition, setFormCondition] = useState(searchParams.getAll('condition')[0] || 'OR');
  const [formStartYear, setFormStartYear] = useState(searchParams.getAll('startyear')[0] || 2018);
  const [formEndYear, setFormEndYear] = useState(searchParams.getAll('endyear')[0] || 2023);
  const [formCountries, setFormCountries] = useState(searchParams.getAll('countries') || ['FR']);
  const [isError, setFormIsError] = useState(false);

  useEffect(() => setSearchParams({
    datasource: formDatasource,
    type: formType,
    queries: formQueries,
    condition: formCondition,
    startyear: formStartYear,
    endyear: formEndYear,
    countries: formCountries,
  }), [, formDatasource, formType, formQueries, formCondition, formStartYear, formEndYear, formCountries, setSearchParams]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['data'],
    queryFn: () => getData({
      datasource: formDatasource,
      type: formType,
      queries: formQueries,
      condition: formCondition,
      startyear: formStartYear,
      endyear: formEndYear,
      countries: formCountries,
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
      label: 'Coauthoring by keywords',
      value: 'keyword',
    },
    {
      label: 'Coauthoring by authors ids',
      value: 'author',
    },
    {
      label: 'Coauthoring by structures ids',
      value: 'structure',
    },
  ];

  const conditions = [
    {
      label: 'OR',
      value: 'OR',
    },
    {
      label: 'AND',
      value: 'AND',
    }
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
          // setFormType('keyword');
          // setFormQueries([]);
          // setFormCondition('OR')
        }}
      />
      <Select
        label="Choose your graph type"
        options={types}
        selected={formType}
        onChange={(e) => {
          setFormType(e.target.value);
          setFormQueries([]);
          setFormCondition('OR')
        }}
      />
      <Row gutters>
        <Col>
          <TagInput
            label={formType.charAt(0).toUpperCase() + formType.slice(1) + 's'}
            hint='Validate by pressing "Return" key'
            tags={formQueries}
            onTagsChange={(tags) => setFormQueries(tags)}
          />
        </Col>
        {(formQueries.length > 1) &&
          (<Col>
            <Select
              label='Condition'
              hint='Operation for multiple queries'
              options={conditions}
              selected={formCondition}
              onChange={(e) => {
                setFormCondition(e.target.value);
              }}
            />
          </Col>
          )}
      </Row>
      {(formDatasource === 'openalex' && formType != 'structure')
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
