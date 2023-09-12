import streamlit as st
from streamlit.components.v1 import html
import os
import sys
import networkx as nx
from pyvis.network import Network
from ipysigma import Sigma
from dotenv import load_dotenv
from community_detection_func import generate_graph

st.title("Community detection application")

# Choose data source
data_sources = ["scanR"]
data_source = st.selectbox("Data source", data_sources, 0)

# Choose search by
search_types = ["Co-authoring by keyword", "Co-authoring by author id (idref)"]
search_by = st.selectbox("Search by", search_types, 0)

# Choose query
query_label = "Keywords" if (search_types.index(search_by) == 0) else "Idrefs"
queries = st.text_input(query_label)

# Generate graph
if st.button(label="Generate graph", type="primary") is True:
    graph, request, answer = generate_graph(data_source, search_types.index(search_by), queries)

    with st.expander("See request infos"):
        st.markdown("Request :")
        st.json(request, expanded=False)

        st.markdown("Answer :")
        st.json(answer, expanded=False)

    # Display graph
    st.markdown("Graph : ")
    net = Network()
    net.from_nx(graph)
    net.write_html("pyvis_graph.html")
    HtmlFile = open("pyvis_graph.html", "r", encoding="utf-8")
    html(HtmlFile.read(), height=600, scrolling=True)

    st.balloons()
