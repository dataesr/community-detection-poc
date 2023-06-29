const DEFAULT_YEARS = [2018, 2019, 2020, 2021, 2022, 2023];
const DEFAULT_SIZE = 10000;

export const makeQueryByAuthor = (query, size = DEFAULT_SIZE, years = DEFAULT_YEARS) => ({
  size,
  query: {
    bool: {
      filter: [
        { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
        { terms: { year: years } },
        { terms: { 'authors.person.id.keyword': query.split(',').map((id) => `idref${id}`) } },
      ],
    },
  },
});

export const makeQueryByKeyword = (query, size = DEFAULT_SIZE, years = DEFAULT_YEARS) => ({
  size,
  _source: ['id', 'authors', 'domains'],
  query: {
    bool: {
      filter: [
        { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
        { terms: { year: years } },
      ],
      must: {
        query_string: {
          fields: [
            'title.default',
            'title.fr',
            'title.en',
            'keywords.en',
            'keywords.fr',
            'keywords.default',
            'domains.label.default',
            'domains.label.fr',
            'domains.label.en',
            'summary.default',
            'summary.fr',
            'summary.en',
            'alternativeSummary.default',
            'alternativeSummary.fr',
            'alternativeSummary.en',
          ],
          query: query.split(',').map((q) => `"${q}"`).join(' '),
        },
      },
    },
  },
});

export const makeQueryByStructure = (query, size = DEFAULT_SIZE, years = DEFAULT_YEARS) => ({
  size,
  query: {
    bool: {
      filter: [
        { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
        { terms: { year: years } },
        { terms: { 'affiliations.id.keyword': query.split(',') } },
      ],
    },
  },
});
