import express from 'express';
import { openAlexToGraphology } from './open-alex-to-graphology';

const router = new express.Router();

// const getLalilou = (cursor = '*') => {
//   const url = `https://api.openalex.org/works?filter=authorships.institutions.country_code:FR,publication_year:2018-2023,is_paratext:false,title.search:${query},abstract.search:${query}&mailto=bso@recherche.gouv.fr&per_page=200&cursor=*`;
//   const data = await fetch(url)
//     .then((response) => response.json());
//   return data;
// }

const getAllData = (query, cursor = '*', previousResponse = []) => {
  const url = `https://api.openalex.org/works?filter=authorships.institutions.country_code:FR,publication_year:2018-2023,is_paratext:false,title.search:${query},abstract.search:${query}&mailto=bso@recherche.gouv.fr&per_page=200`;
  return fetch(`${url}&cursor=${cursor}`)
    .then((response) => response.json())
    .then(({ meta, results }) => {
      const response = [...previousResponse, ...results];
      if (results.length !== 0) {
        return getAllData(query, meta.next_cursor, response);
      }
      return response;
    });
};

router.route('/openalex')
  .get(async (req, res) => {
    const { query } = req.query;
    // Filter publications on France, publication year between 2018 and 2023
    const data = await getAllData(query);
    const graph = openAlexToGraphology(data);
    res.json(graph);
  });

export default router;
