import requests
import pandas as pd
import math

BASE_URL = "https://api.openalex.org/works?filter=publication_year:2021-"


def url_them(thematic):
    url = BASE_URL
    if thematic:
        url += f"&search={thematic}"

    return url


def get_nb_page(url):
    global n_page
    try:
        res = requests.get(url).json()
        meta = res["meta"]
        nb_results = meta['count']
        n_page = math.ceil(nb_results / res['meta']['per_page'])
    except:
        print("echec")

    return n_page


def get_data(url, p):
    global tmp
    try:
        if p > 1:
            res = requests.get(url+f"&page={p}").json()
        else:
            res = requests.get(url).json()
        tmp = pd.json_normalize(res['results'])
    except:
        print("echec")

    return tmp

thematic = "athlete"
URL_THEME = url_them(thematic)
nb_pages = get_nb_page(URL_THEME)
liste = []
for page in range(1, nb_pages + 1):
    temp = get_data(URL_THEME, page)
    liste.append(temp)
data = pd.concat(liste)
data['query'] = thematic