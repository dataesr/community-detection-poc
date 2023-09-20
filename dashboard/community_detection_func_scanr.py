import os
import requests

from dotenv import load_dotenv

import networkx as nx
from netgraph import Graph, InteractiveGraph
from pyvis.network import Network

import matplotlib
import matplotlib.pyplot as plt
import mpld3


def scanr_get_credentials() -> tuple[str, str]:
    """
    Returns:
        tuple[str, str]: scanr api url and token
    """

    # Load server environment
    load_dotenv(os.path.dirname(os.path.dirname(__file__)) + "/server/.env")

    # SCANR api
    url = os.environ.get("SCANR_API_URL")
    token = os.environ.get("SCANR_API_TOKEN")

    return url, token


def scanr_query_by_keywords(keywords: list[str]) -> dict:
    """Get api query with keywords

    Args:
        keywords (list[str]): list of keywords

    Returns:
        dict: json query
    """

    # Make sure keywords is a list
    if not isinstance(keywords, list):
        keywords = [keywords]

    # Create query block
    must_block = []
    for q in keywords:
        must_block.append(
            {
                "query_string": {
                    "fields": [
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
                        "alternativeSummary.en",
                    ],
                    "query": f'"{q}"',
                }
            }
        )

    # Query json
    json_query = {
        "size": 10000,
        "query": {
            "bool": {
                "filter": [
                    {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
                    {"terms": {"year": [2018, 2019, 2020, 2021, 2022, 2023]}},
                ],
                "must": must_block,
            }
        },
        "aggs": {"idref": {"terms": {"field": "authors.person.id.keyword", "size": 10}}},
    }

    return json_query


def scanr_query_by_authors(idrefs) -> dict:
    """Get api query with authors

    Args:
        idrefs (list[str]): authors idrefs

    Returns:
        dict: json query
    """

    # Make sure idrefs is a list
    if not isinstance(idrefs, list):
        idrefs = [idrefs]

    idrefs = ["idref" + str(id) for id in idrefs]

    # Query json
    json_query = {
        "size": 10000,
        "query": {
            "bool": {
                "filter": [
                    {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
                    {"terms": {"authors.person.id.keyword": idrefs}},
                ]
            }
        },
    }

    return json_query


def scanr_get_results(search_type: str, args: list[str]) -> dict:
    """Get search results from api

    Args:
        search_type (str): type of search
        args (list[str]): list of arguments

    Returns:
        dict: answer from api
    """
    # Api
    url, token = scanr_get_credentials()

    # Query
    query = scanr_query_by_keywords(args)

    # Request answer
    return requests.post(url, json=query, headers={"Authorization": token}).json()


def scanr_filter_results(answer: dict, max_coauthors: int = 20) -> tuple[dict, dict]:
    """Get authors data from results

    Args:
        results (list[dict]): list of results
        max_coauthors (int, optional): max number of coauthors

    Returns:
        tuple[dict, dict]: authors data and authors names
    """
    max_coauthors = 20

    # Init arrays
    nb_pub_removed = 0
    authors_data = {}
    authors_names = {}
    wikidata_names = {}

    # Filter data
    # 1. Loop over works
    for work in answer.get("hits").get("hits"):
        work_id = work.get("_id")
        authorships = work.get("_source").get("authors")

        # 2. Loop over authors and remove publication if too many coauthors
        if len(authorships) > max_coauthors:
            print(f"{work.get('_id')}: removing publication ({len(authorships)} authors)")
            nb_pub_removed += 1
            continue

        # 3. Get author information
        for author in authorships:
            if "person" in author:
                author_id = author.get("person").get("id")
                author_name = author.get("person").get("fullName")
            elif "fullName" in author:
                author_id = author.get("fullName")
                author_name = author.get("fullName")
            else:
                continue
            authors_names.setdefault(author_id, author_name)

            # Add author
            author_data = {"name": author_name}
            authors_data.setdefault(
                author_id, {"work_count": 0, "work_id": [], "coauthors": {}, "wikidata": {}}
            ).update(author_data)
            authors_data.get(author_id)["work_count"] += 1
            authors_data.get(author_id)["work_id"].append(work_id)

            # print(f"{author_name}: number of coauthors = {len(authorships) - 1}")

            # 4. Add coauthors information
            for coauthor in authorships:
                if "person" in coauthor:
                    coauthor_id = coauthor.get("person").get("id")
                    cauthor_name = coauthor.get("person").get("fullName")
                elif "fullName" in coauthor:
                    coauthor_id = coauthor.get("fullName")
                    coauthor_name = coauthor.get("fullName")
                else:
                    continue
                if coauthor_id != author_id:
                    authors_data.get(author_id).get("coauthors").setdefault(coauthor_id, 0)
                    authors_data.get(author_id).get("coauthors")[coauthor_id] += 1

            # 5. Get wikidata topics information
            for concept in work.get("_source").get("domains") or []:
                wikidata = concept.get("code")
                wikidata_names.setdefault(wikidata, concept.get("label").get("default"))
                authors_data.get(author_id).get("wikidata").setdefault(wikidata, 0)
                authors_data.get(author_id).get("wikidata")[wikidata] += 1

    return authors_data, authors_names
