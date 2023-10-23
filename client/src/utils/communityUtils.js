const communityGetUniquePublications = (community) => (
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], [])
);

function communityGetTopicsCount(community, publications, limit = 0) {
  const topics = {};

  // Count topics from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((id) => {
    publications[id]?.topics?.forEach(({ label }) => { topics[label] = topics[label] + 1 || 1; });
  });

  const numberOfTopics = Object.keys(topics).length;
  if (numberOfTopics === 0) return [];

  // Get max topics
  const endSlice = limit > 0 ? limit : numberOfTopics;
  const topTopics = Object.assign(
    ...Object
      .entries(topics)
      .sort(({ 1: a }, { 1: b }) => b - a)
      .slice(0, endSlice)
      .map(([k, v]) => ({ [k]: v })),
  );

  return Object.entries(topTopics);
}

function communityGetTypesCount(community, publications, limit = 0) {
  const types = {};

  // Count types from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((id) => {
    types[publications[id].type] = types[publications[id].type] + 1 || 1;
  });

  const numberOfTypes = Object.keys(types).length;
  // console.log('numberOfTopics', numberOfTopics);

  if (numberOfTypes === 0) return [];

  // Get max types
  const endSlice = limit > 0 ? limit : numberOfTypes;
  const topTypes = Object.assign(
    ...Object
      .entries(types)
      .sort(({ 1: a }, { 1: b }) => b - a)
      .slice(0, endSlice)
      .map(([k, v]) => ({ [k]: v })),
  );

  return Object.entries(topTypes);
}

function communityGetBestAuthors(community, limit = 0) {
  const endSlice = limit > 0 ? limit : community.length;
  // Count and sort authors by publications
  return community.sort((a, b) => b.attributes.publications.length - a.attributes.publications.length).slice(0, endSlice);
}

function communityGetAffiliationsCount(community, publications, structures, limit = 0) {
  const affiliations = {};

  // Count affiliations from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((publicationId) => {
    publications[publicationId]?.affiliations?.forEach((structureId) => { affiliations[structures[structureId].name] = affiliations[structures[structureId].name] + 1 || 1; });
  });

  const numberOfAffiliations = Object.keys(affiliations).length;

  if (numberOfAffiliations === 0) return [];

  // Get max affiliations
  const endSlice = limit > 0 ? limit : numberOfAffiliations;
  const topAffiliations = Object.assign(
    ...Object
      .entries(affiliations)
      .sort(({ 1: a }, { 1: b }) => b - a)
      .slice(0, endSlice)
      .map(([k, v]) => ({ [k]: v })),
  );

  return Object.entries(topAffiliations);
}

function communityGetCountryCount(community, publications, structures, limit = 0) {
  const countries = {};

  // Count countries from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((publicationId) => {
    publications[publicationId]?.affiliations?.forEach((structureId) => { countries[structures[structureId].country] = countries[structures[structureId].country] + 1 || 1; });
  });

  const numberOfCountries = Object.keys(countries).length;

  if (numberOfCountries === 0) return [];

  // Get max countries
  const endSlice = limit > 0 ? limit : numberOfCountries;
  const topCountries = Object.assign(
    ...Object
      .entries(countries)
      .sort(({ 1: a }, { 1: b }) => b - a)
      .slice(0, endSlice)
      .map(([k, v]) => ({ [k]: v })),
  );

  return Object.entries(topCountries);
}

function communityGetYearsCount(community, publications) {
  const DEFAULT_YEARS = [2018, 2019, 2020, 2021, 2022, 2023];
  const years = {};

  // Count years from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((id) => {
    years[publications[id].year] = years[publications[id].year] + 1 || 1;
  });

  return DEFAULT_YEARS.map((year) => ({ year, publications: years[year] ?? 0 }));
}

export function fillAndSortCommunities(communities, publications, structures, { communitiesLimit = 0, topicsLimit = 0, typesLimit = 0, authorsLimit = 0, institutionsLimit = 0 }) {
  const filledCommunities = {};
  const numberOfCommunities = Object.keys(communities).length;
  const endSlice = communitiesLimit > 0 ? communitiesLimit : numberOfCommunities;

  // Sort communities
  const sortedCommunities = Object.entries(communities).sort((a, b) => b[1].length - a[1].length).slice(0, endSlice);

  // Fill communities
  sortedCommunities.forEach(([key, values]) => {
    filledCommunities[key] = {
      nodes: values,
      size: values.length,
      publications: communityGetUniquePublications(values),
      topics: communityGetTopicsCount(values, publications, topicsLimit),
      types: communityGetTypesCount(values, publications, typesLimit),
      authors: communityGetBestAuthors(values, authorsLimit),
      affiliations: communityGetAffiliationsCount(values, publications, structures, institutionsLimit),
      years: communityGetYearsCount(values, publications),
      country: communityGetCountryCount(values, publications, structures, 1),
    };
  });

  return filledCommunities;
}
