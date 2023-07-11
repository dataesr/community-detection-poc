import express from 'express';
import { openAlexToGraphology } from './open-alex-to-graphology';

const router = new express.Router();

const getAllData = ({ country, query, cursor = '*', previousResponse = [] }) => {
  const url = `https://api.openalex.org/works?filter=authorships.institutions.country_code:${country},publication_year:2018-2023,is_paratext:false,title.search:${query},abstract.search:${query}&mailto=bso@recherche.gouv.fr&per_page=200`;
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
    const { country, query } = req.query;
    const data = await getAllData({ country, query });
    const graph = openAlexToGraphology(data);
    res.json(graph);
  });

export default router;
