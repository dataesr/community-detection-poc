const DEFAULT_SIZE = 5000;
const ELASTIC_SOURCE_FIELDS = ['id', 'authors', 'domains', 'title', 'year', 'isOa', 'type', 'affiliations'];

export const makeQuery = (queries, condition, startyear, endyear, size = DEFAULT_SIZE) => ({
  size,
  _source: ELASTIC_SOURCE_FIELDS,
  query: {
    // function_score: {
    //   query: {
    bool: {
      filter: [
        { range: { year: { gte: startyear, lte: endyear } } },
      ],
      must: {
        query_string: {
          fields: [
            'title.*^3',
            'authors.fullName^3',
            'summary.*^2',
            'domains.label.*^2',
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
