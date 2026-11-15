#!/usr/bin/env python3
"""
Download and convert MOLA DEM to Cloud-Optimized GeoTIFF (COG)
Run once to prepare data for backend tile server.

Usage:
    python prepare_mola_cog.py

Requires: gdal, rasterio, requests
"""

import os
import sys
import requests
from pathlib import Path
from tqdm import tqdm
import subprocess

MOLA_URL = (
    "https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
)
MOLA_LOCAL = "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
MOLA_COG = "Mars_MGS_MOLA_DEM_mosaic_global_463m_cog.tif"

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

MOLA_PATH = DATA_DIR / MOLA_LOCAL
COG_PATH = DATA_DIR / MOLA_COG


def download_file(url: str, dest: Path, chunk_size: int = 8192) -> None:
    """Download file with progress bar"""
    print(f"Downloading from {url}...")
    print(f"Saving to {dest}")

    response = requests.get(url, stream=True)
    response.raise_for_status()

    total_size = int(response.headers.get("content-length", 0))

    with (
        open(dest, "wb") as f,
        tqdm(
            total=total_size,
            unit="B",
            unit_scale=True,
            unit_divisor=1024,
            desc="Downloading",
        ) as pbar,
    ):
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
                pbar.update(len(chunk))

    print(f"Download complete: {dest}")


def convert_to_cog(src: Path, dst: Path) -> None:
    """Convert GeoTIFF to Cloud-Optimized GeoTIFF using gdal_translate"""
    print(f"Converting {src} to COG...")

    # gdal_translate options for COG:
    # -of COG: output format Cloud Optimized GeoTIFF
    # -co COMPRESS=DEFLATE: compression
    # -co PREDICTOR=2: horizontal differencing predictor for DEM
    # -co BIGTIFF=YES: support files > 4GB
    # -co OVERVIEWS=IGNORE_EXISTING: build overviews
    # -co NUM_THREADS=ALL_CPUS: parallel compression
    cmd = [
        "gdal_translate",
        "-of",
        "COG",
        "-co",
        "COMPRESS=DEFLATE",
        "-co",
        "PREDICTOR=2",
        "-co",
        "BIGTIFF=YES",
        "-co",
        "OVERVIEWS=IGNORE_EXISTING",
        "-co",
        "NUM_THREADS=ALL_CPUS",
        str(src),
        str(dst),
    ]

    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        raise RuntimeError(f"gdal_translate failed with code {result.returncode}")

    print(f"COG created: {dst}")


def verify_cog(path: Path) -> None:
    """Verify COG is readable and has overviews"""
    import rasterio

    print(f"Verifying COG: {path}")

    with rasterio.open(path) as src:
        print(f"  Width: {src.width}, Height: {src.height}")
        print(f"  Bands: {src.count}")
        print(f"  CRS: {src.crs}")
        print(f"  Transform: {src.transform}")
        print(f"  Dtype: {src.dtypes[0]}")
        print(f"  Overviews: {src.overviews(1)}")
        print(f"  Block size: {src.block_shapes[0]}")
        print(f"  Compression: {src.compression}")

        # Test reading a tile
        window = rasterio.windows.Window(0, 0, 256, 256)
        data = src.read(1, window=window)
        print(
            f"  Sample tile stats: min={data.min()}, max={data.max()}, mean={data.mean():.1f}"
        )


def main():
    print("=" * 60)
    print("MARSCOPE MOLA COG Preparation")
    print("=" * 60)

    # Check if COG already exists
    if COG_PATH.exists():
        print(f"COG already exists at {COG_PATH}")
        verify_cog(COG_PATH)
        return

    # Download if needed
    if not MOLA_PATH.exists():
        print(f"MOLA GeoTIFF not found, downloading...")
        try:
            download_file(MOLA_URL, MOLA_PATH)
        except Exception as e:
            print(f"Download failed: {e}")
            print(f"Please manually download from {MOLA_URL}")
            print(f"and place at {MOLA_PATH}")
            sys.exit(1)
    else:
        print(f"Using existing MOLA GeoTIFF at {MOLA_PATH}")

    # Convert to COG
    try:
        convert_to_cog(MOLA_PATH, COG_PATH)
    except Exception as e:
        print(f"Conversion failed: {e}")
        sys.exit(1)

    # Verify
    verify_cog(COG_PATH)

    print("=" * 60)
    print("COG preparation complete!")
    print(f"COG ready at: {COG_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
