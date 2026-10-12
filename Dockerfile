FROM python:3.12-slim
WORKDIR /app
COPY server.py *.html *.css *.js ./
COPY assets ./assets
ENV HOST=0.0.0.0
ENV PORT=8766
ENV NEXOCITA_DB=/data/nexocita.sqlite3
RUN mkdir -p /data
EXPOSE 8766
CMD ["python", "server.py"]
