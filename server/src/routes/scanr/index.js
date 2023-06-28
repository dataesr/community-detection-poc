import express from 'express';
import { scanrToGraphology } from './scanr-to-graphology';
import { makeQuery, makeIdrefQuery, makeStructureQuery } from './make-query';
import config from '../../config';

const router = new express.Router();

router.route('/scanr')
  .get(async (req, res) => {
    const { query, idref, structure } = req.query;
    if (idref) {}
    const body = query
      ? makeQuery(query)
      : idref
        ? makeIdrefQuery(idref)
        : structure
          ? makeStructureQuery(structure)
          : makeQuery('');
    const data = await fetch(
      `${config.scanr.apiUrl}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Authorization: config.scanr.apiToken, 'Content-Type': 'application/json' },
      },
    )
      .then((response) => response.json())
      .then(({ hits }) => hits?.hits?.map(({ _source }) => _source));
    const graph = scanrToGraphology(data);
    res.json(graph);
  });

export default router;
