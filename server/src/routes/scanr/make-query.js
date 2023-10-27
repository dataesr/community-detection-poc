const DEFAULT_SIZE = 5000;
const ELASTIC_SOURCE_FIELDS = ['id', 'authors', 'domains', 'title', 'year', 'isOa', 'type', 'affiliations'];

export const makeQueryByKeywords = (queries, condition, startyear, endyear, size = DEFAULT_SIZE) => ({
  size,
  _source: ELASTIC_SOURCE_FIELDS,
  query: {
    // function_score: {
    //   query: {
    bool: {
      filter: [
        { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
        { range: { year: { gte: startyear, lte: endyear } } },
      ],
      must: {
        query_string: {
          fields: [
            'title.default^3',
            'title.fr^3',
            'title.en^3',
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
          query: queries
            .split(',')
            .map((q) => `(${q})`)
            .join(` ${condition} `),
          phrase_slop: 0,
        },
      },
    },
  },
  //     random_score: { seed: 2001 },
  //     boost_mode: 'replace',
  //   },
  // },
});

export const makeQueryByAuthors = (queries, condition, startyear, endyear, size = DEFAULT_SIZE) => {
  const filterBlock = [
    { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
    { range: { year: { gte: startyear, lte: endyear } } },
  ];

  if (condition === 'AND') {
    queries.split(',').map((id) => filterBlock.push({ terms: { 'authors.person.id.keyword': [`idref${id}`] } }));
  } else {
    filterBlock.push({ terms: { 'authors.person.id.keyword': queries.split(',').map((id) => `idref${id}`) } });
  }

  return {
    size,
    _source: ELASTIC_SOURCE_FIELDS,
    query: {
      // function_score: {
      //   query: {
      bool: {
        filter: filterBlock,
      },
    },
    //     random_score: { seed: 2001 },
    //     boost_mode: 'replace',
    //   },
    // },
  };
};

export const makeQueryByStructures = (queries, condition, startyear, endyear, size = DEFAULT_SIZE) => {
  const filterBlock = [
    { terms: { 'authors.role.keyword': ['author', 'directeurthese'] } },
    { range: { year: { gte: startyear, lte: endyear } } },
  ];

  if (condition === 'AND') {
    queries.split(',').map((id) => filterBlock.push({ terms: { 'affiliations.id.keyword': [`${id}`] } }));
  } else {
    filterBlock.push({ terms: { 'affiliations.id.keyword': queries.split(',') } });
  }

  return {
    size,
    _source: ELASTIC_SOURCE_FIELDS,
    query: {
      // function_score: {
      //   query: {
      bool: {
        filter: filterBlock,
      },
    },
    //     random_score: { seed: 2001 },
    //     boost_mode: 'replace',
    //   },
    // },
  };
};
