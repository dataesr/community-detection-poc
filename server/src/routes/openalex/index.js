import express from 'express';
import { openAlexToGraphology } from './open-alex-to-graphology';

const router = new express.Router();

const getData = ({ countries, queries, cursor = '*', previousResponse = [] }) => {
  const url = `https://api.openalex.org/works?filter=institutions.country_code:${countries.split(',').join('|')},publication_year:2018-2023,is_paratext:false,title.search:${queries.split(',').join('|')},abstract.search:${queries.split(',').join('|')}&mailto=bso@recherche.gouv.fr&per_page=200`;
  return fetch(`${url}&cursor=${cursor}`)
    .then((response) => response.json())
    .then(({ meta, results }) => {
      const response = [...previousResponse, ...results];
      if (results.length !== 0) {
        return getData({ countries, queries, cursor: meta.next_cursor, previousResponse: response });
      }
      return response;
    });
};

router.route('/openalex')
  .get(async (req, res) => {
    const { countries, queries } = req.query;
    const data = await getData({ countries, queries });
    const graph = openAlexToGraphology(data);
    res.json(graph);
  });

export default router;
