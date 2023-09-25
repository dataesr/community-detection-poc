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


def scanr_query_by_keywords(keywords: list[str], filters) -> dict:
    """Get api query with keywords

    Args:
        keywords (list[str]): list of keywords

    Returns:
        dict: json query
    """

    # Create query block
    condition = "AND" if filters.get("and_condition") else "OR"
    keywords = [f"({keyword})" for keyword in keywords]
    keywords = f" {condition} ".join(keywords)
    print(keywords)

    # Query json
    json_query = {
        "size": 10000,
        "query": {
            "bool": {
                "filter": [
                    {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
                    {"range": {"year": {"gte": filters.get("start_year"), "lte": filters.get("end_year")}}},
                ],
                "must": {
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
                        "query": f"{keywords}",
                    }
                },
            }
        },
    }

    return json_query


def scanr_query_by_authors(idrefs: list[str], filters: dict) -> dict:
    """Get api query with authors

    Args:
        idrefs (list[str]): authors idrefs
        filters (dict): search filters

    Returns:
        dict: json query
    """

    idrefs = ["idref" + id if not id.startswith("idref") else id for id in idrefs]

    filter_block = [
        {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
        {"range": {"year": {"gte": filters.get("start_year"), "lte": filters.get("end_year")}}},
    ]

    if filters.get("and_condition") and len(idrefs) > 1:
        for id in idrefs:
            filter_block.append({"terms": {"authors.person.id.keyword": id}})
    else:
        filter_block.append({"terms": {"authors.person.id.keyword": idrefs}})

    # Query json
    json_query = {
        "size": 10000,
        "query": {"bool": {"filter": filter_block}},
    }

    return json_query


def scanr_query_by_structures(struc_ids: list[str], filters: dict) -> dict:
    """Get api query with structures

    Args:
        struc_ids (list[str]): structures ids
        filters (dict): search filters

    Returns:
        dict: json query
    """

    filter_block = [
        {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
        {"range": {"year": {"gte": 2014, "lte": filters.get("end_year")}}},
    ]

    if filters.get("and_condition") and len(struc_ids) > 1:
        for id in struc_ids:
            filter_block.append({"terms": {"affiliations.id.keyword": id}})
    else:
        filter_block.append({"terms": {"affiliations.id.keyword": struc_ids}})

    # Query json
    json_query = {
        "size": 10000,
        "query": {"bool": {"filter": filter_block}},
    }

    return json_query


def scanr_get_results(search_type: int, args: list[str], filters: dict) -> dict:
    """Get search results from api

    Args:
        search_type (int): type of search 0: by keywords - 1: by authors (idrefs)
        args (list[str]): list of search arguments
        filters (dict): search filters

    Returns:
        dict: answer from api
    """
    # Api
    url, token = scanr_get_credentials()

    # Query
    match search_type:
        case 0:
            # Keywords
            query = scanr_query_by_keywords(args, filters)
        case 1:
            # Idrefs
            query = scanr_query_by_authors(args, filters)
        case 2:
            # Structures
            query = scanr_query_by_structures(args, filters)
        case _:
            raise ValueError("Incorrect search type")

    # Request answer
    return requests.post(url, json=query, headers={"Authorization": token}).json()


def scanr_filter_results(answer: dict, max_coauthors: int = 20) -> dict:
    """Get authors data from results

    Args:
        results (list[dict]): list of results
        max_coauthors (int, optional): max number of coauthors

    Returns:
        dict: authors data
    """

    # Init arrays
    nb_pub_removed = 0
    authors_data = {}
    wikidata_names = {}

    print("Number of results :", answer.get("hits").get("total").get("value"))

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
                author_name = (
                    author.get("person").get("fullName")
                    if "fullName" in author.get("person")
                    else author.get("fullName")
                )
            elif "fullName" in author:
                author_id = author.get("fullName")
                author_name = author.get("fullName")
            else:
                continue

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

    return authors_data
