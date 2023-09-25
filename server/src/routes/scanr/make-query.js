const DEFAULT_SIZE = 5000;
const ELASTIC_SOURCE_FIELDS = ['id', 'authors', 'domains', 'title'];

export const makeQueryByKeywords = (queries, startyear, endyear, size = DEFAULT_SIZE) => ({
  size,
  _source: ELASTIC_SOURCE_FIELDS,
  query: {
    function_score: {
      query: {
        bool: {
          filter: [
            { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
            { range: { year: { gte: startyear, lte: endyear } } },
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
              query: queries.split(',').map((q) => `"${q}"`).join(' '),
            },
          },
        },
      },
      random_score: { seed: 2001 },
      boost_mode: 'replace',
    },
  },
});

export const makeQueryByAuthors = (queries, startyear, endyear, size = DEFAULT_SIZE) => ({
  size,
  _source: ELASTIC_SOURCE_FIELDS,
  query: {
    function_score: {
      query: {
        bool: {
          filter: [
            { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
            { terms: { 'authors.person.id.keyword': queries.split(',').map((id) => `idref${id}`) } },
            { range: { year: { gte: startyear, lte: endyear } } },
          ],
        },
      },
      random_score: { seed: 2001 },
      boost_mode: 'replace',
    },
  },
});

export const makeQueryByStructures = (queries, startyear, endyear, size = DEFAULT_SIZE) => ({
  size,
  _source: ELASTIC_SOURCE_FIELDS,
  query: {
    function_score: {
      query: {
        bool: {
          filter: [
            { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
            { terms: { 'affiliations.id.keyword': queries.split(',') } },
            { range: { year: { gte: startyear, lte: endyear } } },
          ],
        },
      },
      random_score: { seed: 2001 },
      boost_mode: 'replace',
    },
  },
});
