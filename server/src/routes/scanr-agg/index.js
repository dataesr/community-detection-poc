import express from 'express';
import { aggToGraphology } from '../../graphology/graph';
import { makeQuery } from './make-query';
import config from '../../config';

const router = new express.Router();

router.route('/scanr-agg').get(async (req, res) => {
  const { queries, condition, startyear, endyear } = req.query;
  const body = makeQuery(queries, condition, startyear, endyear);
  console.log('scanr body', JSON.stringify(body));
  const json = await fetch(`${config.scanr.apiUrl}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: config.scanr.apiToken, 'Content-Type': 'application/json' },
  }).then((response) => response.json());
  const publicationList = json?.hits?.hits?.map(({ _source }) => _source);
  const aggregations = json?.aggregations;

  console.log('Bucket co_authors : ', aggregations?.agg_authors?.buckets.length);
  console.log('Bucket co_institutions : ', aggregations?.agg_institutions?.buckets.length);
  console.log('Bucket co_domains : ', aggregations?.agg_domains?.buckets.length);
  console.log('Publications count : ', publicationList.length);

  const data = {
    graph: aggToGraphology(aggregations?.agg_authors?.buckets),
    publications: {},
    structures: {},
  };

  res.json(data);
});

export default router;
