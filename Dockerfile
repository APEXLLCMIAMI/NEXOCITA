FROM python:3.12-slim
WORKDIR /app
COPY server.py *.html *.css *.js ./
COPY assets ./assets
ENV HOST=0.0.0.0 PORT=8766 NEXOCITA_DB=/data/nexocita.sqlite3
VOLUME ["/data"]
EXPOSE 8766
CMD ["python", "server.py"]
