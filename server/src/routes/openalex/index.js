import express from 'express';
import { openAlexToGraphology } from './open-alex-to-graphology';
import { makeQueryByKeywords, makeQueryByAuthors, makeQueryByStructures } from './make-query';

const getQueryFunction = {
  keyword: makeQueryByKeywords,
  author: makeQueryByAuthors,
  structure: makeQueryByStructures,
};

const router = new express.Router();

router.route('/openalex').get(async (req, res) => {
  const {
    queries, type, condition, startyear, endyear, countries,
  } = req.query;
  const data = await getQueryFunction[type]({ queries, condition, startyear, endyear, countries });
  const graph = openAlexToGraphology(data);
  res.json(graph);
});

export default router;
