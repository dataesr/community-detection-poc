const DEFAULT_YEARS = [2018, 2019, 2020, 2021, 2022, 2023];
const DEFAULT_SIZE = 10000;

const getMustBlockFromQuery = (query) => query.split(',').map(q => ({
  query_string: {
    fields: [
      "title.default",
      "title.fr",
      "title.en",
      "keywords.en",
      "keywords.fr",
      "keywords.default",
      "domains.label.default",
      "domains.label.fr",
      "domains.label.en",
      "summary.default",
      "summary.fr",
      "summary.en",
      "alternativeSummary.default",
      "alternativeSummary.fr",
      "alternativeSummary.en"],
    query: q
  }
})
);

export const makeQuery = (query, size = DEFAULT_SIZE, years = DEFAULT_YEARS) => ({
  size,
  query: {
    bool: {
      filter: [
        { terms: { "authors.role.keyword": ["author", "directeurthese"] } },
        { terms: { year: years } }
      ],
      should: getMustBlockFromQuery(query)
    }
  }
})