import requests
import pandas as pd
import math

BASE_URL = "https://api.openalex.org/works?filter=publication_year:2023-"


def url_them(thematic):
    url = BASE_URL
    if thematic:
        url += f"&search={thematic}&cursor="

    return url


def get_nb_page(nb, ppage):
    n_page = math.ceil(nb / ppage)

    return n_page

thematic = "athlete"
URL_THEME = url_them(thematic)
res = requests.get(URL_THEME + "*&per_page=200").json()
cur = res["meta"]["next_cursor"]
cnt = res["meta"]["count"]
print(f"Le nombre de résultats est de {cnt}.")
nb_page = get_nb_page(cnt, 200)
print(f"Le nombre de pages est de {nb_page}.")

authors = []
for i in range(len(res['results'])):
    for l in range(len(res["results"][i]["authorships"])):
        keys = res["results"][i]["authorships"][l].keys()
        dic = res["results"][i]["authorships"][l]["author"]
        dic["doi"] = res["results"][i]["doi"]
        for key in keys:
            if key not in ["author", "institutions", "raw_affiliation_strings"]:
                dic[key] = res["results"][i]["authorships"][l][key]
        keys_ins = []
        if len(res["results"][i]["authorships"][l]["institutions"]) > 0:
            for li in range(len(res["results"][i]["authorships"][l]["institutions"])):
                for key in res["results"][i]["authorships"][l]["institutions"][li].keys():
                    key2 = key + "_ins"
                    keys_ins.append(key2)
                    dic[key2] = res["results"][i]["authorships"][l]["institutions"][li][key]
        for item in ["author", "institutions", "raw_affiliation_strings"]:
            if item in dic.keys():
                del dic[item]
        authors.append(dic)

for page in range(2, nb_page + 1):
    print(f"Page {page}.")
    res = requests.get(URL_THEME + cur+ "&per_page=200").json()
    cur = res["meta"]["next_cursor"]
    for i in range(len(res['results'])):
        for l in range(len(res["results"][i]["authorships"])):
            keys = res["results"][i]["authorships"][l].keys()
            dic = res["results"][i]["authorships"][l]["author"]
            dic["doi"] = res["results"][i]["doi"]
            for key in keys:
                if key not in ["author", "institutions", "raw_affiliation_strings"]:
                    dic[key] = res["results"][i]["authorships"][l][key]
            keys_ins = []
            if len(res["results"][i]["authorships"][l]["institutions"]) > 0:
                for li in range(len(res["results"][i]["authorships"][l]["institutions"])):
                    for key in res["results"][i]["authorships"][l]["institutions"][li].keys():
                        key2 = key + "_ins"
                        keys_ins.append(key2)
                        dic[key2] = res["results"][i]["authorships"][l]["institutions"][li][key]
            for item in ["author", "institutions", "raw_affiliation_strings"]:
                if item in dic.keys():
                    del dic[item]
            authors.append(dic)
data = pd.DataFrame(data=authors)
# data = data[["display_name", "doi"]].drop_duplicates()

# coauth = data.groupby("doi").nunique().reset_index().rename(columns={"display_name": "nauth"})
# partauth = data.groupby("display_name").nunique().reset_index().rename(columns={"doi": "partauth"})

import networkx as nx

# NB_MAX_COAUTHORS = 20
# NB_MIN_PUBLICATIONS = 5
#
# coauth_ov = coauth.loc[coauth["nauth"] > NB_MAX_COAUTHORS]
# coauth_un = coauth.loc[coauth["nauth"] <= NB_MAX_COAUTHORS]
# partauth_ov = partauth.loc[partauth["partauth"] >= NB_MIN_PUBLICATIONS]
# partauth_un = partauth.loc[partauth["partauth"] < NB_MIN_PUBLICATIONS]
#
# data2 = data.loc[(data["doi"].isin(coauth_un["doi"])) & (data["display_name"].isin(partauth_ov["display_name"]))]
#
# nb_removed = coauth_ov["doi"].nunique()

G = nx.Graph()

G = nx.from_pandas_edgelist(data, 'doi', 'display_name')

leaderboard = {}
for x in G.nodes:
    leaderboard[x] = len(G[x])

s = pd.Series(leaderboard, name='connections')
df2 = s.to_frame().sort_values('connections', ascending=False)
df2 = df2.reset_index()

nx.write_graphml_lxml(G, '/run/media/julia/DATA/atheleteOA.graphml')