# MARSCOPE Backend - MOLA DEM Tile Server
# Build: docker build -t marscope-backend .
# Run: docker run -p 8000:8000 -v /path/to/mola_cog:/data marscope-backend

FROM python:3.12-slim

# Install system dependencies for rasterio/GDAL
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL config
ENV GDAL_VERSION=3.8.0
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]