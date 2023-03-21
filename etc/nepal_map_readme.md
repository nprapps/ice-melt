# Notes on creating 3D Nepal videos

## Raster satellite image processing
I got my rasters from airbus, via their free media license. They are 50cm, so they're very high res. They came in 4 zipped 1GB files, which individually contained several unzipped 1GB files. The steps I have taken are:

1. Downsample
	- Go to `downsample_tiffs.py` to find out how I did this. I went from a resolution size of 4x10-6 to 1x10-5. I tried 4x10-4 but that was too course. I did tests at that level first. 
1. merge
	- Go to `merge_tiffs.py` to see how I did that. The resulting merged files were each about 7GB uncompressed.
	- After that initial merge, I merged the 4 resulting files using QGIS (could have done command line but didn't). The resulting file is ~18 GB uncompressed
	- After this I exported the same file as a "Rendered Image" in the QGIS GUI. This cuts the file size down to about 4 GB. I should have done this earlier to the many constituent files but i couldn't figure out how to in the command line. 
1. reproject
	- Using the QGIS GUI I export one more time using the QGIS GUI but changed the projection from WGS 84 to the correct UTM (32645).
	- Make sure to include `tfw=yes` to include a worldfile that will allow it to be edited in photoshop and then brought back into QGIS. 
1. color correct/tone
	- https://medium.com/@robsimmon/making-sense-of-satellite-data-an-open-source-workflow-color-correction-with-gimp-7ddae0360fea
	


