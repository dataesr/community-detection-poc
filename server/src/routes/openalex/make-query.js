const DEFAULT_SIZE = 5000;

export const makeQueryByKeywords = ({
  queries,
  condition,
  startyear,
  endyear,
  countries = [],
  cursor = "*",
  previousResponse = [],
}) => {
  let url = "https://api.openalex.org/works?search=";
  const cond = condition === "OR" ? "|" : "+";
  url += `${queries.split(",").join(cond)}`;
  url += `&filter=publication_year:${startyear}-${endyear},is_paratext:false`;
  url += countries.length > 0 ? `,institutions.country_code:${countries.split(",").join("|")}` : "";
  url += "&mailto=bso@recherche.gouv.fr&per_page=200";
  console.log("openalex url", url);
  return fetch(`${url}&cursor=${cursor}`)
    .then((response) => response.json())
    .then(({ meta, results }) => {
      const response = [...previousResponse, ...results];
      if (results.length !== 0 && response.length < DEFAULT_SIZE) {
        return makeQueryByKeywords({
          queries,
          condition,
          startyear,
          endyear,
          countries,
          cursor: meta.next_cursor,
          previousResponse: response,
        });
      }
      return response;
    });
};

export const makeQueryByAuthors = ({
  queries,
  condition,
  startyear,
  endyear,
  countries = [],
  cursor = "*",
  previousResponse = [],
}) => {
  let url = "https://api.openalex.org/works?mailto=bso@recherche.gouv.fr&per_page=200";
  url += `&filter=publication_year:${startyear}-${endyear},is_paratext:false`;
  const cond = condition === "OR" ? "|" : "+";
  url += `,author.orcid:${queries.split(",").join(cond)}`;
  url += countries.length > 0 ? `,institutions.country_code:${countries.split(",").join("|")}` : "";
  console.log("openalex url", url);
  return fetch(`${url}&cursor=${cursor}`)
    .then((response) => response.json())
    .then(({ meta, results }) => {
      const response = [...previousResponse, ...results];
      if (results.length !== 0 && response.length < DEFAULT_SIZE) {
        return makeQueryByAuthors({
          queries,
          condition,
          startyear,
          endyear,
          countries,
          cursor: meta.next_cursor,
          previousResponse: response,
        });
      }
      return response;
    });
};

export const makeQueryByStructures = ({
  queries,
  condition,
  startyear,
  endyear,
  countries = [],
  cursor = "*",
  previousResponse = [],
}) => {
  let url = "https://api.openalex.org/works?mailto=bso@recherche.gouv.fr&per_page=200";
  url += `&filter=publication_year:${startyear}-${endyear},is_paratext:false`;
  const cond = condition === "OR" ? "|" : "+";
  url += `,institutions.ror:${queries.split(",").join(cond)}`;
  console.log("openalex url", url);
  return fetch(`${url}&cursor=${cursor}`)
    .then((response) => response.json())
    .then(({ meta, results }) => {
      const response = [...previousResponse, ...results];
      if (results.length !== 0 && response.length < DEFAULT_SIZE) {
        return makeQueryByStructures({
          queries,
          condition,
          startyear,
          endyear,
          cursor: meta.next_cursor,
          previousResponse: response,
        });
      }
      return response;
    });
};
