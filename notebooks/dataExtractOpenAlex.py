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
        dic = res["results"][i]["authorships"][l]["author"]
        dic["doi"] = res["results"][i]["doi"]
        authors.append(dic)

for page in range(2, nb_page + 1):
    print(f"Page {page}.")
    res = requests.get(URL_THEME + cur+ "&per_page=200").json()
    cur = res["meta"]["next_cursor"]
    for i in range(len(res['results'])):
        for l in range(len(res["results"][i]["authorships"])):
            dic = res["results"][i]["authorships"][l]["author"]
            dic["doi"] = res["results"][i]["doi"]
            authors.append(dic)
data = pd.DataFrame(data=authors)
data = data[["display_name", "doi"]].drop_duplicates()